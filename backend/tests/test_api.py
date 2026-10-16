from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db
init_db()

client = TestClient(app)

def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert "SecureCode AI" in res.json()["project"]

def test_health():
    res = client.get("/api/system/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    assert res.json()["cloud_llm_calls_enabled"] is False

def test_get_benchmark_tables():
    res = client.get("/api/benchmarks/tables")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 18

def test_get_benchmark_records():
    res = client.get("/api/benchmarks/records?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "records" in data
    assert len(data["records"]) <= 10

def test_dataset_summary():
    res = client.get("/api/dataset/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_files" in data

def test_scanners_status():
    res = client.get("/api/scanners/status")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
