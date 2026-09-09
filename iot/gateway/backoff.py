def next_backoff(attempt, base=1, cap=60):
    if attempt < 0:
        raise ValueError("attempt must be >= 0")
    delay = base * (2 ** attempt)
    return delay if delay < cap else cap
