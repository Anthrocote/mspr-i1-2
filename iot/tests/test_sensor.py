from sensor import is_plausible


def test_plausible_within_dht22_range():
    assert is_plausible(29.4, 56.1) is True
    assert is_plausible(-40, 0) is True
    assert is_plausible(80, 100) is True


def test_implausible_out_of_range():
    assert is_plausible(-41, 50) is False
    assert is_plausible(81, 50) is False
    assert is_plausible(25, -1) is False
    assert is_plausible(25, 101) is False
