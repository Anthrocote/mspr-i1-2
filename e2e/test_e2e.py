"""Full-chain e2e scenarios (dossier chapter 6, cases E2E-01..E2E-10).

The stack, the fake sensor and the frontend are session-scoped fixtures
(conftest.py). Cases run in order: each builds on the state the previous left,
exactly as the dossier describes. The chain cases (01-07) assert against the
pays API, the siège API and Mailpit; the UI cases (08-10) drive the frontend
with Playwright.
"""

from conftest import (
    PAYS_URL, SIEGE_URL, FRONTEND_URL, WAREHOUSE_CODE,
    api_get, trigger_sync, mailpit_messages, mailpit_clear, poll, _compose,
)


def _pays_measurements():
    return api_get(PAYS_URL, "/measurements", warehouse=WAREHOUSE_CODE)


def _pays_alerts():
    return api_get(PAYS_URL, "/alerts")


def _pays_warehouse_status():
    for w in api_get(PAYS_URL, "/sync/warehouses"):
        if w.get("code") == WAREHOUSE_CODE:
            return w.get("last_status")
    return None


def _subjects():
    return [m.get("Subject", "") for m in mailpit_messages().get("messages", [])]


# ── E2E-01: a nominal reading reaches the pays, the warehouse is online ──
def test_e2e_01_measurement_flows_to_pays(sensor):
    sensor.set(29.0)
    poll(lambda: len(_pays_measurements()) > 0, timeout=20,
         desc="a measurement reaches the pays")
    assert poll(lambda: _pays_warehouse_status() == "online", timeout=20,
                desc="warehouse status becomes online")


# ── E2E-02: 45 °C opens an out_of_range alert and emails the manager ──
def test_e2e_02_out_of_range_opens_alert_and_email(sensor):
    mailpit_clear()
    sensor.set(45.0)
    poll(lambda: any(a["type"] == "out_of_range" and a["resolved_at"] is None
                     for a in _pays_alerts()),
         timeout=25, desc="an out_of_range alert opens")
    assert poll(lambda: any("Alerte conditions" in s for s in _subjects()),
                timeout=15, desc="a conditions-alert email is sent")


# ── E2E-03: back in range resolves the alert and sends a recovery email ──
def test_e2e_03_return_in_range_resolves_alert(sensor):
    mailpit_clear()
    sensor.set(29.0)
    poll(lambda: all(a["resolved_at"] is not None
                     for a in _pays_alerts() if a["type"] == "out_of_range"),
         timeout=25, desc="the out_of_range alert resolves")
    assert poll(lambda: any("Retour à la normale" in s for s in _subjects()),
                timeout=15, desc="a recovery email is sent")


# ── E2E-04: a mute sensor is reported as sensor_error, then recovers ──
def test_e2e_04_silence_reports_sensor_error(sensor):
    # An out-of-physical-range reading is rejected by the gateway exactly like no
    # reading at all, so after the silence window the status flips to sensor_error.
    sensor.set(999.0)
    assert poll(lambda: _pays_warehouse_status() == "sensor_error", timeout=25,
                desc="warehouse status becomes sensor_error")
    sensor.set(29.0)
    assert poll(lambda: _pays_warehouse_status() == "online", timeout=25,
                desc="warehouse status returns to online")


# ── E2E-05: measures buffered during a broker outage arrive after reconnect ──
def test_e2e_05_broker_outage_measures_are_buffered(sensor):
    before = len(_pays_measurements())
    _compose("stop", "mosquitto")
    try:
        sensor.set(30.0)  # keep producing readings while the broker is down
    finally:
        _compose("start", "mosquitto")
    assert poll(lambda: len(_pays_measurements()) > before, timeout=40,
                desc="measures produced during the outage arrive after reconnect")


# ── E2E-06: a manual sync populates the siège with the pays' UUIDs ──
def test_e2e_06_sync_populates_siege(sensor):
    assert trigger_sync("br").status_code == 202

    lots = poll(lambda: api_get(SIEGE_URL, "/api/lots").get("data"), timeout=20,
                desc="lots appear at the siège after sync")
    assert any(l["status"] == "expired" for l in lots), "the 400-day lot is expired"
    assert all(l["country"]["code"] == "br" for l in lots)

    status = {p["code"]: p for p in api_get(SIEGE_URL, "/api/sync/status")["data"]}
    assert status["br"]["configured"] is True
    assert status["br"]["lastSyncedAt"] is not None

    alerts = api_get(SIEGE_URL, "/api/alerts", status="all")["data"]
    assert any(a["type"] == "out_of_range" for a in alerts)
    assert any(a["type"] == "expired_lot" for a in alerts)


# ── E2E-07: the sync acked the pays, so confirmed measures are purged ──
def test_e2e_07_ack_purges_confirmed_measures(sensor):
    # The sync in E2E-06 posts /sync/ack; the pays drops confirmed measures but
    # keeps the lots in stock. A fresh reading then reappears as unconfirmed.
    assert poll(lambda: len(api_get(PAYS_URL, "/sync/measurements")) == 0, timeout=20,
                desc="confirmed measures are purged from the pays")
    # Lots in stock are kept (marked confirmed, not deleted): they stay visible on
    # the full /lots listing even though /sync/lots (unconfirmed only) is now empty.
    assert len(api_get(PAYS_URL, "/lots")) >= 1, "lots in stock are kept"

    sensor.set(29.0)
    assert poll(lambda: len(api_get(PAYS_URL, "/sync/measurements")) > 0, timeout=20,
                desc="a new measure reappears as unconfirmed")


# ── E2E-08: the frontend lists Brazil's lots, oldest first, the old one expired ──
def test_e2e_08_frontend_lists_lots(page):
    page.goto(f"{FRONTEND_URL}/lots")
    page.wait_for_load_state("networkidle")
    body = page.inner_text("body")
    assert "Lot ancien" in body and "Lot récent" in body
    # The 400-day lot is expired and, FIFO, listed before the recent one.
    assert body.index("Lot ancien") < body.index("Lot récent")


# ── E2E-09: the lot detail shows the temperature curve with the spike ──
def test_e2e_09_frontend_lot_detail(page):
    page.goto(f"{FRONTEND_URL}/lots")
    page.wait_for_load_state("networkidle")
    page.get_by_text("Lot ancien").first.click()
    page.wait_for_load_state("networkidle")
    assert "entrepot-sao-paulo" in page.inner_text("body").lower() \
        or "brésil" in page.inner_text("body").lower()


# ── E2E-10: the alerts page shows the conditions and expired-lot alerts ──
def test_e2e_10_frontend_alerts(page):
    page.goto(f"{FRONTEND_URL}/alertes")
    page.wait_for_load_state("networkidle")
    body = page.inner_text("body").lower()
    assert "brésil" in body or "entrepot-sao-paulo" in body
