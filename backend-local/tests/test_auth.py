def test_missing_api_key_rejected(client):
    r = client.get("/lots")
    assert r.status_code == 401


def test_wrong_api_key_rejected(client):
    r = client.get("/lots", headers={"X-API-KEY": "nope"})
    assert r.status_code == 401


def test_health_is_public(client):
    r = client.get("/health")
    assert r.status_code == 200
