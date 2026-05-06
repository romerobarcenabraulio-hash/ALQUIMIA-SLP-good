"""Q-017 — Perfil de Generación Estimada RSU (API empresa)."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_scian_factors_minimum_count():
    r = client.get("/empresa/scian-factors")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 10
    assert all(len(item["giro_codigo"]) == 6 for item in data)


def test_post_declaracion_restaurante_201_and_positive_total():
    payload = {
        "empresa_nombre": "Rest Prueba SA",
        "rfc": None,
        "municipio_id": "slp",
        "zm": "SLP",
        "giro_scian": "722511",
        "produccion_anual": 50000,
        "tiene_plan_manejo": False,
    }
    r = client.post("/empresa/declaraciones", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["generacion_total_ton_anio"] > 0
    assert "ESTIMACIÓN VOLUNTARIA" in body["disclaimer_voluntaria"]
    assert body["fuente_tipo"] == "declaracion_voluntaria"
    assert body["es_posible_gran_generador"] is True
    assert "COA SEMARNAT" in body["advertencia_gran_generador"]


def test_gran_generador_threshold():
    payload = {
        "empresa_nombre": "Mini abarrotes",
        "municipio_id": "slp",
        "zm": "SLP",
        "giro_scian": "461110",
        "produccion_anual": 0.02,
        "tiene_plan_manejo": False,
    }
    r = client.post("/empresa/declaraciones", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["es_posible_gran_generador"] is False
    assert body["advertencia_gran_generador"] == ""


def test_produccion_cero_422():
    r = client.post(
        "/empresa/declaraciones",
        json={
            "empresa_nombre": "X",
            "municipio_id": "slp",
            "zm": "SLP",
            "giro_scian": "722511",
            "produccion_anual": 0,
        },
    )
    assert r.status_code == 422


def test_confirmar_patch():
    created = client.post(
        "/empresa/declaraciones",
        json={
            "empresa_nombre": "Confirma test",
            "municipio_id": "sol",
            "zm": "SLP",
            "giro_scian": "621111",
            "produccion_anual": 10000,
            "tiene_plan_manejo": True,
        },
    )
    assert created.status_code == 201
    did = created.json()["declaracion_id"]
    r = client.patch(f"/empresa/declaraciones/{did}/confirmar")
    assert r.status_code == 200
    assert r.json()["status"] == "confirmada"
    listed = client.get("/empresa/declaraciones", params={"municipio_id": "sol"})
    assert listed.status_code == 200
    assert any(d["declaracion_id"] == did for d in listed.json())


def test_disclaimer_in_response():
    r = client.post(
        "/empresa/declaraciones",
        json={
            "empresa_nombre": "Y",
            "municipio_id": "vip",
            "zm": "SLP",
            "giro_scian": "511111",
            "produccion_anual": 5,
            "tiene_plan_manejo": False,
        },
    )
    assert r.status_code == 201
    assert "ESTIMACIÓN VOLUNTARIA" in r.json()["disclaimer_voluntaria"]
