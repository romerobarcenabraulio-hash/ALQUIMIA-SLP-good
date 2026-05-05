from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.access.middleware import verify_rol
from app.access.schemas import ContextoAcceso, RolAcceso
from app.export.router import router as export_router


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(export_router, prefix="/export")
    return TestClient(app)


def _payload() -> dict:
    return {
        "municipio_id": "slp",
        "municipio_nombre": "San Luis Potosí",
        "secciones": ["infraestructura", "flujos"],
        "formato": "pdf",
        "incluir_trazabilidad": True,
        "incluir_advertencias": True,
    }


def test_export_sin_header_retorna_403():
    response = _client().post("/export/report", json=_payload())
    assert response.status_code == 403


def test_export_con_rol_publico_retorna_403():
    response = _client().post("/export/report", json=_payload(), headers={"X-Alquimia-Role": "publico"})
    assert response.status_code == 403


def test_export_con_rol_tecnico_retorna_200():
    response = _client().post("/export/report", json=_payload(), headers={"X-Alquimia-Role": "tecnico"})
    assert response.status_code == 200


def test_export_con_rol_admin_retorna_200():
    response = _client().post("/export/report", json=_payload(), headers={"X-Alquimia-Role": "admin"})
    assert response.status_code == 200


def test_verify_rol_orden_correcto():
    tecnico = ContextoAcceso(user_id="u1", rol=RolAcceso.tecnico)
    publico = ContextoAcceso(user_id="u2", rol=RolAcceso.publico)
    assert verify_rol(tecnico, RolAcceso.publico) is True
    assert verify_rol(publico, RolAcceso.tecnico) is False
