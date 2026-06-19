"""ContainerInventory: CRUD service for tenant-scoped container records."""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.container import Container


class ContainerNotFound(Exception):
    pass


class ContainerInventory:
    """Manages physical waste containers for a single tenant."""

    def __init__(self, tenant_id: str, db: Session) -> None:
        self._tenant_id = tenant_id
        self._db = db

    def _base_query(self):
        return self._db.query(Container).filter(Container.tenant_id == self._tenant_id)

    # ── Read ──────────────────────────────────────────────────────────────────

    def list(self, *, activo_only: bool = False) -> list[Container]:
        q = self._base_query()
        if activo_only:
            q = q.filter(Container.activo.is_(True))
        return q.order_by(Container.created_at.desc()).all()

    def get(self, container_id: str) -> Container:
        obj = self._base_query().filter(Container.id == container_id).first()
        if obj is None:
            raise ContainerNotFound(container_id)
        return obj

    def count(self, *, tipo: Optional[str] = None) -> int:
        q = self._base_query()
        if tipo:
            q = q.filter(Container.tipo == tipo)
        return q.count()

    # ── Write ─────────────────────────────────────────────────────────────────

    def create(self, data: dict) -> Container:
        data.pop("tenant_id", None)  # never accept caller-supplied tenant_id
        obj = Container(tenant_id=self._tenant_id, **data)
        self._db.add(obj)
        self._db.commit()
        self._db.refresh(obj)
        return obj

    def update(self, container_id: str, data: dict) -> Container:
        obj = self.get(container_id)
        data.pop("tenant_id", None)
        data.pop("id", None)
        for field, value in data.items():
            setattr(obj, field, value)
        self._db.commit()
        self._db.refresh(obj)
        return obj

    def deactivate(self, container_id: str) -> Container:
        obj = self.get(container_id)
        obj.activo = False
        self._db.commit()
        self._db.refresh(obj)
        return obj

    def delete(self, container_id: str) -> None:
        obj = self.get(container_id)
        self._db.delete(obj)
        self._db.commit()
