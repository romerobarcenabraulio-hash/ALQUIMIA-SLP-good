"""§4 ContainerInventory — Container model, field registration, CSV import."""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.tenant_isolation import install_tenant_filter, set_tenant_context, clear_tenant_context
from app.models.container import Container
from app.services.container_inventory import (
    CSV_REQUIRED_COLS,
    VALID_TIPOS,
    VALID_ESTADOS,
    get_inventory_summary,
    import_from_csv,
    register_container,
)


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine, tables=[Container.__table__])
    Session = sessionmaker(bind=engine)
    install_tenant_filter(Session)
    db = Session()
    yield db
    db.close()


def _tid() -> str:
    return str(uuid.uuid4())


# --- Model constraints ---

def test_valid_tipos_and_estados_non_empty():
    assert len(VALID_TIPOS) >= 7
    assert len(VALID_ESTADOS) >= 4


def test_csv_required_cols():
    assert CSV_REQUIRED_COLS == {"codigo", "tipo", "colonia"}


# --- register_container ---

def test_register_container_creates_row(db_session):
    tid = _tid()
    token = set_tenant_context(tid)
    try:
        result = register_container(tid, {
            "codigo": "CTR-001",
            "tipo": "contenedor_plastico",
            "colonia": "Centro",
            "capacidad_litros": 240,
            "tiene_separacion": True,
        }, db_session)
        assert result["status"] == "created"
        assert result["container_id"] is not None

        row = db_session.query(Container).filter(Container.id == result["container_id"]).first()
        assert row is not None
        assert row.tenant_id == tid
        assert row.tipo == "contenedor_plastico"
        assert row.capacidad_litros == 240.0
        assert row.tiene_separacion is True
        assert row.source == "field_survey"
    finally:
        clear_tenant_context(token)


def test_register_invalid_tipo_defaults_to_otro(db_session):
    tid = _tid()
    result = register_container(tid, {"codigo": "X", "tipo": "UNKNOWN", "colonia": "Col"}, db_session)
    row = db_session.query(Container).filter(Container.id == result["container_id"]).first()
    assert row.tipo == "otro"


def test_register_graceful_without_db():
    result = register_container("any", {"codigo": "X"}, None)
    assert result["status"] == "no_db"


# --- import_from_csv ---

_VALID_CSV = """\
codigo,tipo,colonia,capacidad_litros,tiene_separacion
CTR-A01,contenedor_metalico,Zona Centro,500,true
CTR-A02,papelera,Barrio Norte,60,false
"""

def test_csv_import_basic(db_session):
    tid = _tid()
    summary = import_from_csv(tid, _VALID_CSV, db_session)
    assert summary["total"] == 2
    assert summary["imported"] == 2
    assert summary["errors"] == []


def test_csv_import_missing_required_col(db_session):
    bad_csv = "codigo,tipo\nCTR-B,contenedor_metalico\n"
    summary = import_from_csv(_tid(), bad_csv, db_session)
    assert summary["imported"] == 0
    assert any("colonia" in e["reason"] for e in summary["errors"])


def test_csv_import_empty_codigo_is_error(db_session):
    csv_text = "codigo,tipo,colonia\n,contenedor_plastico,Centro\n"
    summary = import_from_csv(_tid(), csv_text, db_session)
    assert summary["errors"][0]["reason"] == "codigo vacío"


def test_csv_import_graceful_without_db():
    summary = import_from_csv("any", _VALID_CSV, None)
    assert summary["imported"] == 0
    assert any(e["reason"] == "no_db" for e in summary["errors"])


# --- get_inventory_summary ---

def test_inventory_summary(db_session):
    tid = _tid()
    register_container(tid, {"codigo": "S1", "tipo": "contenedor_organico", "colonia": "A", "tiene_separacion": True}, db_session)
    register_container(tid, {"codigo": "S2", "tipo": "contenedor_organico", "colonia": "A", "tiene_separacion": False}, db_session)
    register_container(tid, {"codigo": "S3", "tipo": "papelera", "colonia": "B", "estado_fisico": "danado"}, db_session)
    db_session.commit()

    token = set_tenant_context(tid)
    try:
        summary = get_inventory_summary(tid, db_session)
    finally:
        clear_tenant_context(token)

    assert summary["total"] == 3
    assert summary["por_tipo"]["contenedor_organico"] == 2
    assert summary["por_tipo"]["papelera"] == 1
    assert summary["con_separacion"] == 1
    assert summary["pct_separacion"] == pytest.approx(33.3, abs=0.5)
    assert summary["disponible"] is True


def test_inventory_summary_graceful_without_db():
    result = get_inventory_summary("any", None)
    assert result["total"] == 0
    assert result["disponible"] is False
