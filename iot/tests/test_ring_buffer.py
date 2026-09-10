import pytest
from ring_buffer import RingBuffer


def test_append_within_capacity_keeps_all():
    buf = RingBuffer(3)
    buf.append("a")
    buf.append("b")
    assert len(buf) == 2


def test_append_beyond_capacity_drops_oldest():
    buf = RingBuffer(2)
    buf.append("a")
    buf.append("b")
    buf.append("c")
    assert buf.drain() == ["b", "c"]


def test_drain_returns_in_order_and_empties():
    buf = RingBuffer(3)
    buf.append(1)
    buf.append(2)
    assert buf.drain() == [1, 2]
    assert len(buf) == 0


def test_capacity_must_be_positive():
    with pytest.raises(ValueError):
        RingBuffer(0)
