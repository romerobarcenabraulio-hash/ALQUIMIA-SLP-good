from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.export.generator import build_export_report
from app.export.router import router
from app.export.schemas import ExportFormat, ExportRequest, ExportSection


def _request(**overrides) -> ExportRequest:
    data = {
        "municipio_id": "slp",
        "municipio_nombre": "San Luis Potosí",
        "secciones": [ExportSection.infraestructura, ExportSection.flujos],
        "formato": ExportFormat.pdf,
        "incluir_trazabilidad": True,
        "incluir_advertencias": True,
    }
    data.update(overrides)
    return ExportRequest(**data)


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/export")
    return TestClient(app)


def test_municipio_vacio_blocked():
    result = build_export_report(_request(municipio_id=""))
    assert result.status == "blocked"


def test_secciones_vacias_blocked():
    result = build_export_report(_request(secciones=[]))
    assert result.status == "blocked"
    assert any("Selecciona al menos una sección" in b for b in result.blockers)


def test_reporte_pdf_todas_secciones():
    result = build_export_report(_request(secciones=list(ExportSection), formato=ExportFormat.pdf))
    assert result.status == "ready"
    assert len(result.secciones_exportadas) == 5


def test_cada_seccion_tiene_titulo_y_resumen():
    result = build_export_report(_request(secciones=list(ExportSection)))
    for section in result.secciones_exportadas:
        assert section.titulo
        assert section.resumen


def test_trazabilidad_incluida_cuando_flag_true():
    result = build_export_report(_request(incluir_trazabilidad=True))
    assert any(section.trazabilidad is not None for section in result.secciones_exportadas)


def test_metadata_tiene_fecha_version_total():
    result = build_export_report(_request())
    assert "fecha_generacion" in result.metadata
    assert "version" in result.metadata
    assert "total_secciones" in result.metadata


def test_endpoint_200_caso_feliz():
    response = _client().post(
        "/export/report",
        json=_request().model_dump(mode="json"),
        headers={"X-Alquimia-Role": "tecnico"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ready"
