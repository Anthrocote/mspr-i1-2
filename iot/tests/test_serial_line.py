from serial_line import parse_line


def test_parse_valid_line():
    assert parse_line("T=29.4;H=56.1") == (29.4, 56.1)


def test_parse_strips_newline():
    assert parse_line("T=29.4;H=56.1\r\n") == (29.4, 56.1)


def test_parse_negative_and_zero():
    assert parse_line("T=-1.5;H=0.0") == (-1.5, 0.0)


def test_parse_err_line_is_none():
    assert parse_line("ERR") is None


def test_parse_empty_is_none():
    assert parse_line("") is None


def test_parse_malformed_is_none():
    assert parse_line("garbage") is None
    assert parse_line("T=abc;H=56.1") is None
    assert parse_line("T=29.4") is None
