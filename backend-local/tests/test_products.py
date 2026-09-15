HEADERS = {"X-API-KEY": "testkey"}


def test_create_product(client):
    r = client.post("/products", headers=HEADERS, json={
        "code": "arabica-a", "name": "Café vert", "variety": "Arabica"})
    assert r.status_code == 201
    body = r.json()
    assert set(body) == {"uuid", "code", "name", "description", "variety"}
    assert body["code"] == "arabica-a"


def test_create_product_duplicate_code_409(client):
    client.post("/products", headers=HEADERS, json={"code": "dup", "name": "X"})
    r = client.post("/products", headers=HEADERS, json={"code": "dup", "name": "Y"})
    assert r.status_code == 409


def test_list_products(client):
    client.post("/products", headers=HEADERS, json={"code": "p1", "name": "A"})
    client.post("/products", headers=HEADERS, json={"code": "p2", "name": "B"})
    codes = {p["code"] for p in client.get("/products", headers=HEADERS).json()}
    assert {"p1", "p2"} <= codes


def test_products_requires_api_key(client):
    assert client.get("/products").status_code == 401
