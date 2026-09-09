from throttle import should_publish


def test_no_reading_never_publishes():
    assert should_publish(False, 100.0, 0.0, 200.0, 60) is False


def test_fresh_reading_after_interval_publishes():
    # reading arrived at t=100, last publish at t=0, now t=100, interval 60
    assert should_publish(True, 100.0, 0.0, 100.0, 60) is True


def test_fresh_reading_before_interval_waits():
    assert should_publish(True, 70.0, 60.0, 70.0, 60) is False


def test_stale_reading_not_republished():
    # last valid reading (t=50) predates last publish (t=60): sensor went silent
    assert should_publish(True, 50.0, 60.0, 130.0, 60) is False


def test_reading_exactly_at_last_publish_is_not_fresh():
    assert should_publish(True, 60.0, 60.0, 130.0, 60) is False
