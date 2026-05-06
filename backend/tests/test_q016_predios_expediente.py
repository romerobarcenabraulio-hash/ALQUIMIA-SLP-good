"""Q-016 — predios y expediente técnico."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.predios.router as predios_mod
from app.predios.router import router as predios_router


@pytest.fixture(autouse=True)
def _reset_predios_stores() -> None:
    predios_mod._predios.clear()
    predios_mod._inspecciones.clear()
    predios_mod._expedientes.clear()
    yield


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(predios_router)
    return TestClient(app)


def test_post_registro_returns_201_and_id() -> None:
    c = _client()
    r = c.post(
        "/predios/registro",
        json={
            "municipio_id": "slp",
            "direccion_texto": "Priv. Prueba 123, col. Centro",
            "lat": 22.15,
            "lon": -101.0,
        },
    )
    assert r.status_code == 201
    data = r.json()
    assert data["predio_id"]
    assert data["municipio_id"] == "slp"


def test_post_inspeccion_basura_clandestina_201() -> None:
    c = _client()
    pr = c.post(
        "/predios/registro",
        json={"municipio_id": "slp", "direccion_texto": "Calle X 1"},
    ).json()
    r = c.post(
        f"/predios/{pr['predio_id']}/inspecciones",
        json={
            "fecha_inspeccion": "2026-05-08",
            "tipo_infraccion": "basura_clandestina",
            "descripcion_hallazgo": "Acumulación visible de residuos en lote sin contención.",
            "tiene_permiso_ca": False,
        },
    )
    assert r.status_code == 201
    ins = r.json()
    assert ins["tipo_infraccion"] == "basura_clandestina"
    assert ins["status"] == "borrador"


def test_post_expediente_montos_y_disclaimer() -> None:
    c = _client()
    pr = c.post(
        "/predios/registro",
        json={"municipio_id": "slp", "direccion_texto": "Addr"},
    ).json()
    ins = c.post(
        f"/predios/{pr['predio_id']}/inspecciones",
        json={
            "fecha_inspeccion": "2026-05-08",
            "tipo_infraccion": "basura_clandestina",
            "descripcion_hallazgo": "Hallazgo",
            "tiene_permiso_ca": False,
        },
    ).json()
    exr = c.post(
        "/predios/expedientes",
        json={"inspeccion_id": ins["inspeccion_id"]},
    )
    assert exr.status_code == 201
    ex = exr.json()
    assert ex["nivel_sancion"]
    assert ex["monto_min_mxn"] > 0
    assert "no es acto de autoridad" in ex["disclaimer"].lower()
    assert ex["articulo_reglamento"] == "[PENDIENTE VERIFICACIÓN CLC]"


def test_get_municipio_expedientes_list() -> None:
    c = _client()
    pr = c.post(
        "/predios/registro",
        json={"municipio_id": "slp", "direccion_texto": "Z"},
    ).json()
    ins = c.post(
        f"/predios/{pr['predio_id']}/inspecciones",
        json={
            "fecha_inspeccion": "2026-05-08",
            "tipo_infraccion": "mezcla_residuos_no_autorizada",
            "descripcion_hallazgo": "Mezcla observable",
            "tiene_permiso_ca": True,
            "permiso_ca_vigente": False,
        },
    ).json()
    c.post("/predios/expedientes", json={"inspeccion_id": ins["inspeccion_id"]})
    lst = c.get("/predios/municipio/slp/expedientes")
    assert lst.status_code == 200
    assert len(lst.json()) >= 1


def test_catalogo_sanciones_slp_includes_all_infraction_types() -> None:
    c = _client()
    r = c.get("/predios/catalogo/sanciones-slp")
    assert r.status_code == 200
    body = r.json()
    rows = body["escaleras"]
    tipos = {row["descripcion_infraccion"] for row in rows}
    assert "vertedero_no_autorizado" in tipos
    assert all(row["articulo_reglamento"] == "[PENDIENTE VERIFICACIÓN CLC]" for row in rows)


def test_catalogo_valor_uma_matches_module_constant() -> None:
    """Contrato Q-016: el catálogo expone el mismo UMA que `escalera_slp.VALOR_UMA_2026`."""
    from app.predios.escalera_slp import VALOR_UMA_2026

    c = _client()
    r = c.get("/predios/catalogo/sanciones-slp")
    assert r.status_code == 200
    assert r.json()["valor_uma_referencia_mxn"] == VALOR_UMA_2026


def test_expediente_non_slp_municipio_422() -> None:
    c = _client()
    pr = c.post(
        "/predios/registro",
        json={"municipio_id": "sol", "direccion_texto": "Otros"},
    ).json()
    ins = c.post(
        f"/predios/{pr['predio_id']}/inspecciones",
        json={
            "fecha_inspeccion": "2026-05-08",
            "tipo_infraccion": "otro",
            "descripcion_hallazgo": "x",
            "tiene_permiso_ca": False,
        },
    ).json()
    r = c.post("/predios/expedientes", json={"inspeccion_id": ins["inspeccion_id"]})
    assert r.status_code == 422
    assert "slp" in r.json()["detail"].lower()
