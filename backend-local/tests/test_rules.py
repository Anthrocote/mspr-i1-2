from datetime import datetime, timedelta, timezone

from app.rules import Thresholds, is_expired


def s():
    return Thresholds(ideal_temperature=29.0, ideal_humidity=55.0)  # bounds: T[26,32], H[53,57]


def test_in_range_center():
    assert s().is_out_of_range(29.0, 55.0) is False


def test_temp_upper_limit_ok():
    assert s().is_out_of_range(32.0, 55.0) is False


def test_temp_above_limit():
    assert s().is_out_of_range(32.1, 55.0) is True


def test_temp_below_limit():
    assert s().is_out_of_range(25.9, 55.0) is True


def test_humidity_limit_ok():
    assert s().is_out_of_range(29.0, 57.0) is False


def test_humidity_above_limit():
    assert s().is_out_of_range(29.0, 57.1) is True


def test_expiry_boundaries():
    now = datetime(2026, 9, 10, tzinfo=timezone.utc)
    assert is_expired(now - timedelta(days=364), now) is False
    assert is_expired(now - timedelta(days=365), now) is False
    assert is_expired(now - timedelta(days=366), now) is True
