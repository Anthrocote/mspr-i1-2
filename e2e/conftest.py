"""Orchestration for the full-chain e2e suite.

Brings up the two Docker stacks (pays + siège), migrates and seeds the siège so
Brazil is a pullable country, then runs the real gateway on the host reading a
configurable fake sensor over a pseudo-terminal. Tests drive the sensor, trigger
the siège sync, and assert across the pays API, the siège API, Mailpit and — for
the UI cases — a Playwright-driven frontend.

Everything is session-scoped: the stack boots once. Individual scenarios stay
ordered (each builds on the state the previous left), matching the dossier.
"""

import json
import os
import pathlib
import shutil
import signal
import subprocess
import time

import pytest
import requests

ROOT = pathlib.Path(__file__).resolve().parent
REPO = ROOT.parent

# Host ports match the compose defaults; override them (E2E_*_PORT) to run the
# stack next to another one already holding the standard ports.
PAYS_PORT = os.environ.get("E2E_PAYS_PORT", "8000")
SIEGE_PORT = os.environ.get("E2E_SIEGE_PORT", "8080")
MAILPIT_PORT = os.environ.get("E2E_MAILPIT_PORT", "8025")
BROKER_PORT = os.environ.get("E2E_BROKER_PORT", "1883")
FRONTEND_PORT = os.environ.get("E2E_FRONTEND_PORT", "3000")

PAYS_URL = f"http://localhost:{PAYS_PORT}"
SIEGE_URL = f"http://localhost:{SIEGE_PORT}"
MAILPIT_URL = f"http://localhost:{MAILPIT_PORT}"
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"
API_KEY = "e2e-secret"

# The warehouse the gateway publishes to (iot/gateway/config.example.py) and the
# pays seed both use this code.
WAREHOUSE_CODE = "entrepot-sao-paulo"

STATE_FILE = ROOT / ".sensor_state.json"


def _wait_http(url, headers=None, timeout=120, predicate=None):
    """Poll a URL until it answers 2xx (and an optional predicate holds)."""
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        try:
            r = requests.get(url, headers=headers, timeout=3)
            if r.status_code < 500:
                if predicate is None or predicate(r):
                    return r
                last = f"predicate false ({r.status_code})"
            else:
                last = f"status {r.status_code}"
        except requests.RequestException as exc:
            last = str(exc)
        time.sleep(2)
    raise TimeoutError(f"{url} not ready: {last}")


def poll(fn, timeout=30, interval=1.0, desc=""):
    """Call fn() until it returns a truthy value, or fail after timeout."""
    deadline = time.time() + timeout
    last = None
    while time.time() < deadline:
        last = fn()
        if last:
            return last
        time.sleep(interval)
    raise AssertionError(f"condition not met within {timeout}s: {desc} (last={last!r})")


def _compose(*args, check=True):
    return subprocess.run(
        ["docker", "compose", "-f", str(ROOT / "docker-compose.yml"), *args],
        cwd=ROOT, check=check, capture_output=True, text=True,
    )


@pytest.fixture(scope="session")
def stack():
    """The pays + siège Docker stacks, migrated and seeded, torn down at the end."""
    _compose("up", "-d", "--build")
    try:
        # Pays is up once /health answers; the siège once nginx serves the API.
        _wait_http(f"{PAYS_URL}/health")
        _wait_http(f"{SIEGE_URL}/api/health")

        # Build the siège schema via the migrations (available in the prod image).
        _compose("exec", "-T", "php", "php", "bin/console",
                 "doctrine:migrations:migrate", "-n")

        # Seed the countries directly in the database. The prod image ships without
        # the fixtures bundle (--no-dev), so we insert the same rows AppFixtures
        # would: Brazil instrumented (sync URL/key point at the pays container),
        # Ecuador and Colombia declared with thresholds but no sync URL.
        _compose("exec", "-T", "db", "psql", "-U", "app", "-d", "futurekawa_siege", "-c",
                 "INSERT INTO pays (code, temp_ideale, humidite_ideale, api_url, api_key) VALUES "
                 "('br', 29, 55, 'http://pays:8000', 'e2e-secret'), "
                 "('ec', 31, 60, NULL, NULL), "
                 "('co', 26, 80, NULL, NULL);")

        yield
    finally:
        logs = _compose("logs", "--no-color", check=False).stdout
        (ROOT / ".compose.log").write_text(logs or "")
        _compose("down", "-v", check=False)


class SensorControl:
    """Handle to the running fake sensor: set the reading it emits."""

    def set(self, temperature, humidity=55.0):
        STATE_FILE.write_text(json.dumps({"temperature": temperature, "humidity": humidity}))
        # The gateway publishes about once per second; give it a couple cycles to
        # read the new value, publish it, and let the pays ingest + evaluate it.
        time.sleep(4)


@pytest.fixture(scope="session")
def sensor(stack):
    """Fake sensor + real gateway on the host, publishing to the broker."""
    SensorControl().set(29.0)  # nominal, in range

    fake = subprocess.Popen(
        ["python", str(ROOT / "fake_sensor.py")],
        env={**os.environ, "FAKE_STATE_FILE": str(STATE_FILE), "FAKE_PERIOD_S": "0.5"},
        stdout=subprocess.PIPE, text=True,
    )
    pty_path = fake.stdout.readline().strip().split("PTY=", 1)[-1]

    # The gateway imports a `config` module; config.py is gitignored, so seed it
    # from the committed example (it already reads the env we set below).
    gateway_dir = REPO / "iot" / "gateway"
    config_py = gateway_dir / "config.py"
    created_config = not config_py.exists()
    if created_config:
        shutil.copy(gateway_dir / "config.example.py", config_py)

    gateway = subprocess.Popen(
        ["python", str(gateway_dir / "gateway.py")],
        cwd=gateway_dir,
        env={**os.environ,
             "GATEWAY_SERIAL_PORT": pty_path,
             "MQTT_BROKER": "localhost",
             "MQTT_PORT": BROKER_PORT,
             "GATEWAY_INTERVAL_S": "1"},
    )
    try:
        yield SensorControl()
    finally:
        for proc in (gateway, fake):
            proc.send_signal(signal.SIGINT)
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        if created_config:
            config_py.unlink(missing_ok=True)
        STATE_FILE.unlink(missing_ok=True)


def api_get(base, path, **params):
    headers = {"X-API-KEY": API_KEY} if base == PAYS_URL else None
    r = requests.get(f"{base}{path}", headers=headers, params=params, timeout=5)
    r.raise_for_status()
    return r.json()


def trigger_sync(code="br"):
    r = requests.post(f"{SIEGE_URL}/api/sync/countries/{code}", timeout=30)
    return r


def mailpit_messages():
    return requests.get(f"{MAILPIT_URL}/api/v1/messages", timeout=5).json()


def mailpit_clear():
    requests.delete(f"{MAILPIT_URL}/api/v1/messages", timeout=5)


@pytest.fixture(scope="session")
def frontend(stack):
    """The frontend built against the siège and served with next start."""
    fe = REPO / "frontend"
    env = {**os.environ, "NEXT_PUBLIC_API_URL": SIEGE_URL}
    subprocess.run(["npm", "ci"], cwd=fe, check=True, capture_output=True, text=True)
    subprocess.run(["npm", "run", "build"], cwd=fe, check=True, env=env,
                   capture_output=True, text=True)
    server = subprocess.Popen(["npm", "run", "start", "--", "--port", FRONTEND_PORT],
                              cwd=fe, env=env)
    try:
        _wait_http(FRONTEND_URL)
        yield FRONTEND_URL
    finally:
        server.send_signal(signal.SIGINT)
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()


@pytest.fixture(scope="session")
def browser():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture
def page(browser, frontend):
    ctx = browser.new_context()
    pg = ctx.new_page()
    yield pg
    ctx.close()
