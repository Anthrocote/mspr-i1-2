import pytest
from backoff import next_backoff


def test_backoff_doubles_from_base():
    assert next_backoff(0) == 1
    assert next_backoff(1) == 2
    assert next_backoff(2) == 4
    assert next_backoff(3) == 8


def test_backoff_is_capped():
    assert next_backoff(6) == 60   # 2**6 = 64 -> capped at 60
    assert next_backoff(10) == 60


def test_backoff_negative_attempt_raises():
    with pytest.raises(ValueError):
        next_backoff(-1)
