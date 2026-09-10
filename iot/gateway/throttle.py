def should_publish(has_reading, last_valid_at, last_publish_at, now, interval):
    """True if a fresh valid reading is due for publication.

    Requires: a reading exists; it arrived strictly after the last publish (so a
    stale value is never re-emitted once the sensor goes silent); and the throttle
    interval has elapsed since the last publish.
    """
    if not has_reading:
        return False
    if last_valid_at <= last_publish_at:
        return False
    return now - last_publish_at >= interval
