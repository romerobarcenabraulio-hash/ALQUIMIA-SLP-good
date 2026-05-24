"""Tests narrativa de implementación KRONOS."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_planning_narrative_returns_five_phases():
    res = client.get("/api/planning/narrative?municipio_id=slp")
    assert res.status_code == 200
    data = res.json()
    assert data["ontology"].startswith("G1-G5")
    assert len(data["fases"]) == 5
    assert data["fases"][0]["gate_id"] == "G1"
    assert data["fases"][0]["fase"] == "Fase 1"
    assert len(data["fases"][0]["actividades"]) >= 1
    assert len(data["fases"][0]["riesgos"]) >= 1


def test_gantt_tasks_have_fase_gate():
    res = client.post("/api/planning/gantt", json={
        "municipio": "slp",
        "zm": "SLP",
        "scenario_id": "test",
        "n_cas_pequeno": 1,
        "capex_total_mxn": 1_000_000,
    })
    assert res.status_code == 200
    tasks = res.json()["tasks"]
    t01 = next(t for t in tasks if t["task_id"] == "T01")
    assert t01["fase_gate"] == "G1"
    t14 = next(t for t in tasks if t["task_id"] == "T14")
    assert t14["fase_gate"] == "G4"


def test_gates_endpoint_includes_definitions():
    res = client.get("/api/planning/risk/gates")
    assert res.status_code == 200
    data = res.json()
    assert "definitions" in data
    assert "G1" in data["definitions"]
    assert "descripcion" in data["definitions"]["G1"]
