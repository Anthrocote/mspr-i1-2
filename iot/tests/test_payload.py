import json
from payload import build_payload, format_iso8601


def test_build_payload_contains_all_fields():
    raw = build_payload(29.4, 56.1, "2026-09-08T14:32:00Z", "uno-br-01")
    data = json.loads(raw)
    assert data == {
        "temperature": 29.4,
        "humidite": 56.1,
        "mesure_le": "2026-09-08T14:32:00Z",
        "device_id": "uno-br-01",
    }


def test_build_payload_returns_string():
    assert isinstance(build_payload(29.4, 56.1, "2026-09-08T14:32:00Z", "d"), str)


def test_format_iso8601_zero_pads():
    # (year, month, mday, hour, minute, second, weekday, yearday)
    t = (2026, 9, 8, 4, 3, 2, 0, 0)
    assert format_iso8601(t) == "2026-09-08T04:03:02Z"
