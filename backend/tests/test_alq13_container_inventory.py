from __future__ import annotations

import uuid

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.security import AuthedUser, current_user
from app.db.session import get_db
from app.models.admin_tenant import AdminTenant
from app.models.container import Container
from app.routers.containers import router as containers_router
from app.services.container_inventory import ContainerInventory, ContainerNotFound


TENANT_A = "tenant-a"
TENANT_B = "tenant-b"


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _fk_pragma(conn, _):
        conn.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine, tables=[AdminTenant.__table__, Container.__table__])
    Session = sessionmaker(bind=engine)
    session = Session()
    session.add_all(
        [
            AdminTenant(
                id=TENANT_A,
                nombre="Tenant A",
                estado_mx="San Luis Potosi",
                municipio_id="slp",
                inegi_clave="24028",
            ),
            AdminTenant(
                id=TENANT_B,
                nombre="Tenant B",
                estado_mx="Nuevo Leon",
                municipio_id="mty",
                inegi_clave="19039",
            ),
        ]
    )
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine, tables=[Container.__table__, AdminTenant.__table__])


@pytest.fixture()
def client(db_session):
    app = FastAPI()
    app.include_router(containers_router, prefix="/api/v1")

    def _override_db():
        return db_session

    def _override_user():
        return AuthedUser(id="user-1", rol="funcionario", email="test@example.com", tenant_id=TENANT_A)

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[current_user] = _override_user
    return TestClient(app)


def _inventory(db_session, tenant_id: str = TENANT_A) -> ContainerInventory:
    return ContainerInventory(tenant_id=tenant_id, db=db_session)


def test_service_create_records_provenance(db_session):
    obj = _inventory(db_session).create(
        {
            "tipo": "organicos",
            "ubicacion": "Cocina principal",
            "capacidad_litros": 120,
            "clave_inegi": "24028",
        }
    )

    assert obj.tenant_id == TENANT_A
    assert obj.source == "manual_user_input"
    assert obj.source_date is not None
    assert obj.source_method == "container_inventory_api"


def test_service_filters_by_tenant_and_soft_delete(db_session):
    inv_a = _inventory(db_session, TENANT_A)
    inv_b = _inventory(db_session, TENANT_B)
    own = inv_a.create({"tipo": "reciclables", "ubicacion": "Patio"})
    inv_b.create({"tipo": "organicos", "ubicacion": "Cocina"})

    assert [item.id for item in inv_a.list()] == [own.id]
    assert inv_a.count() == 1

    deleted = inv_a.deactivate(own.id)
    assert deleted.activo is False
    assert deleted.deleted_at is not None
    assert inv_a.list() == []
    with pytest.raises(ContainerNotFound):
        inv_a.get(own.id)


def test_service_ignores_immutable_fields(db_session):
    obj = _inventory(db_session, TENANT_A).create(
        {
            "id": "attacker-id",
            "tenant_id": TENANT_B,
            "tipo": "vidrio",
            "ubicacion": "Almacen",
        }
    )

    assert obj.id != "attacker-id"
    assert obj.tenant_id == TENANT_A

    updated = _inventory(db_session, TENANT_A).update(
        obj.id,
        {"tenant_id": TENANT_B, "id": str(uuid.uuid4()), "ubicacion": "Almacen Norte"},
    )
    assert updated.tenant_id == TENANT_A
    assert updated.id == obj.id
    assert updated.ubicacion == "Almacen Norte"


def test_router_create_list_count_and_get(client):
    created = client.post(
        "/api/v1/containers",
        json={"tipo": "organicos", "ubicacion": "Cocina", "capacidad_litros": 120},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["tenant_id"] == TENANT_A
    assert body["source"] == "manual_user_input"

    listed = client.get("/api/v1/containers")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [body["id"]]

    counted = client.get("/api/v1/containers/count?tipo=organicos")
    assert counted.status_code == 200
    assert counted.json() == {"total": 1, "tenant_id": TENANT_A}

    fetched = client.get(f"/api/v1/containers/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["ubicacion"] == "Cocina"


def test_router_patch_and_deactivate_without_hard_delete(client, db_session):
    created = client.post("/api/v1/containers", json={"tipo": "carton", "ubicacion": "Bodega"}).json()

    patched = client.patch(f"/api/v1/containers/{created['id']}", json={"ubicacion": "Bodega Sur"})
    assert patched.status_code == 200
    assert patched.json()["ubicacion"] == "Bodega Sur"

    deleted = client.delete(f"/api/v1/containers/{created['id']}")
    assert deleted.status_code == 200
    assert deleted.json()["status"] == "deactivated"
    assert deleted.json()["hard_deleted"] is False

    assert client.get(f"/api/v1/containers/{created['id']}").status_code == 404
    row = db_session.query(Container).filter(Container.id == created["id"]).one()
    assert row.deleted_at is not None
    assert row.activo is False


def test_router_requires_tenant(db_session):
    app = FastAPI()
    app.include_router(containers_router, prefix="/api/v1")
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[current_user] = lambda: AuthedUser(
        id="user-2", rol="funcionario", email="missing@example.com", tenant_id=None
    )
    client = TestClient(app)

    response = client.get("/api/v1/containers")
    assert response.status_code == 403
