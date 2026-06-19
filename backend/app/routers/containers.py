"""
Router: /api/v1/containers

Inventory of physical waste containers per tenant (ALQ-13 — GOV close).
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.security import AuthedUser, current_user
from app.services.container_inventory import ContainerInventory, ContainerNotFound

router = APIRouter(prefix="/containers", tags=["containers"])
logger = logging.getLogger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ContainerDTO(BaseModel):
    id: str
    tenant_id: str
    tipo: str
    capacidad_litros: Optional[int] = None
    color: Optional[str] = None
    material: Optional[str] = None
    ubicacion: str
    zona_interna: Optional[str] = None
    municipio: Optional[str] = None
    clave_inegi: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    frecuencia_recoleccion: Optional[str] = None
    proveedor_recoleccion: Optional[str] = None
    activo: bool
    notas: Optional[str] = None

    class Config:
        from_attributes = True


class ContainerCreate(BaseModel):
    tipo: str
    capacidad_litros: Optional[int] = None
    color: Optional[str] = None
    material: Optional[str] = None
    ubicacion: str
    zona_interna: Optional[str] = None
    municipio: Optional[str] = None
    clave_inegi: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    frecuencia_recoleccion: Optional[str] = None
    proveedor_recoleccion: Optional[str] = None
    notas: Optional[str] = None


class ContainerUpdate(BaseModel):
    tipo: Optional[str] = None
    capacidad_litros: Optional[int] = None
    color: Optional[str] = None
    material: Optional[str] = None
    ubicacion: Optional[str] = None
    zona_interna: Optional[str] = None
    municipio: Optional[str] = None
    clave_inegi: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    frecuencia_recoleccion: Optional[str] = None
    proveedor_recoleccion: Optional[str] = None
    notas: Optional[str] = None
    activo: Optional[bool] = None


class ContainerCountDTO(BaseModel):
    total: int
    tenant_id: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _require_tenant(user: AuthedUser) -> str:
    if not user.tenant_id:
        raise HTTPException(status_code=403, detail="Usuario sin tenant asignado")
    return user.tenant_id


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ContainerDTO])
def list_containers(
    activo_only: bool = Query(False, description="Sólo contenedores activos"),
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    tenant_id = _require_tenant(user)
    inventory = ContainerInventory(tenant_id=tenant_id, db=db)
    return inventory.list(activo_only=activo_only)


@router.get("/count", response_model=ContainerCountDTO)
def count_containers(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    tenant_id = _require_tenant(user)
    inventory = ContainerInventory(tenant_id=tenant_id, db=db)
    return ContainerCountDTO(total=inventory.count(tipo=tipo), tenant_id=tenant_id)


@router.post("", response_model=ContainerDTO, status_code=201)
def create_container(
    data: ContainerCreate,
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    tenant_id = _require_tenant(user)
    inventory = ContainerInventory(tenant_id=tenant_id, db=db)
    obj = inventory.create(data.model_dump(exclude_none=True))
    logger.info("container created tenant=%s id=%s tipo=%s", tenant_id, obj.id, obj.tipo)
    return obj


@router.get("/{container_id}", response_model=ContainerDTO)
def get_container(
    container_id: str,
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    tenant_id = _require_tenant(user)
    inventory = ContainerInventory(tenant_id=tenant_id, db=db)
    try:
        return inventory.get(container_id)
    except ContainerNotFound:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")


@router.patch("/{container_id}", response_model=ContainerDTO)
def update_container(
    container_id: str,
    data: ContainerUpdate,
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    tenant_id = _require_tenant(user)
    inventory = ContainerInventory(tenant_id=tenant_id, db=db)
    try:
        return inventory.update(container_id, data.model_dump(exclude_none=True))
    except ContainerNotFound:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")


@router.delete("/{container_id}", status_code=204)
def delete_container(
    container_id: str,
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    tenant_id = _require_tenant(user)
    inventory = ContainerInventory(tenant_id=tenant_id, db=db)
    try:
        inventory.delete(container_id)
    except ContainerNotFound:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")
