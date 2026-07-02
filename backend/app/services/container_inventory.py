"""ContainerInventory service with tenant isolation and soft deletion."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.container import Container


class ContainerNotFound(Exception):
    """Raised when a container is absent or outside the active tenant scope."""


class ContainerInventory:
    """CRUD facade for one tenant's physical waste containers."""

    IMMUTABLE_FIELDS = {"id", "tenant_id", "created_at", "deleted_at"}

    def __init__(self, tenant_id: str, db: Session) -> None:
        self._tenant_id = str(tenant_id)
        self._db = db

    def _base_query(self):
        return self._db.query(Container).filter(
            Container.tenant_id == self._tenant_id,
            Container.deleted_at.is_(None),
        )

    def list(
        self,
        *,
        activo_only: bool = False,
        tipo: Optional[str] = None,
        clave_inegi: Optional[str] = None,
    ) -> list[Container]:
        query = self._base_query()
        if activo_only:
            query = query.filter(Container.activo.is_(True))
        if tipo:
            query = query.filter(Container.tipo == tipo)
        if clave_inegi:
            query = query.filter(Container.clave_inegi == clave_inegi.zfill(5))
        return query.order_by(Container.created_at.desc()).all()

    def get(self, container_id: str) -> Container:
        obj = self._base_query().filter(Container.id == str(container_id)).first()
        if obj is None:
            raise ContainerNotFound(container_id)
        return obj

    def count(self, *, tipo: Optional[str] = None, activo_only: bool = False) -> int:
        query = self._base_query()
        if tipo:
            query = query.filter(Container.tipo == tipo)
        if activo_only:
            query = query.filter(Container.activo.is_(True))
        return query.count()

    def create(self, data: dict) -> Container:
        clean = self._sanitize(data)
        clean.setdefault("source", "manual_user_input")
        clean.setdefault("source_date", datetime.now(timezone.utc))
        clean.setdefault("source_method", "container_inventory_api")
        obj = Container(tenant_id=self._tenant_id, **clean)
        self._db.add(obj)
        self._db.commit()
        self._db.refresh(obj)
        return obj

    def update(self, container_id: str, data: dict) -> Container:
        obj = self.get(container_id)
        clean = self._sanitize(data)
        for field, value in clean.items():
            setattr(obj, field, value)
        obj.updated_at = datetime.now(timezone.utc)
        self._db.commit()
        self._db.refresh(obj)
        return obj

    def deactivate(self, container_id: str) -> Container:
        obj = self.get(container_id)
        now = datetime.now(timezone.utc)
        obj.activo = False
        obj.deleted_at = now
        obj.updated_at = now
        self._db.commit()
        self._db.refresh(obj)
        return obj

    def _sanitize(self, data: dict) -> dict:
        return {key: value for key, value in data.items() if key not in self.IMMUTABLE_FIELDS}
