from app.config import get_settings, thresholds_for


def test_thresholds_bresil():
    s = thresholds_for("br")
    assert s.ideal_temperature == 29.0
    assert s.ideal_humidity == 55.0
    assert s.temp_tolerance == 3.0
    assert s.humidity_tolerance == 2.0


def test_settings_defaults(monkeypatch):
    monkeypatch.setenv("API_KEY", "k")
    get_settings.cache_clear()
    st = get_settings()
    assert st.country == "br"
    assert st.expiry_check_interval_s == 3600


def test_config_rejects_unknown_country(monkeypatch):
    import pytest
    from app.config import Settings
    monkeypatch.setenv("COUNTRY", "pe")
    with pytest.raises(Exception):
        Settings()


def test_config_normalizes_country_case(monkeypatch):
    from app.config import Settings
    monkeypatch.setenv("COUNTRY", "BR")
    assert Settings().country == "br"
