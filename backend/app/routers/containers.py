"""Router for tenant-scoped physical container inventory."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.db.security import AuthedUser, current_user
from app.db.session import get_db
from app.services.container_inventory import ContainerInventory, ContainerNotFound

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/containers", tags=["containers"])


class ContainerDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
    source: str
    source_date: datetime
    source_method: str

class ContainerCreate(BaseModel):
    tipo: str = Field(min_length=1, max_length=60)
    capacidad_litros: Optional[int] = Field(default=None, ge=1)
    color: Optional[str] = Field(default=None, max_length=30)
    material: Optional[str] = Field(default=None, max_length=60)
    ubicacion: str = Field(min_length=1, max_length=255)
    zona_interna: Optional[str] = Field(default=None, max_length=120)
    municipio: Optional[str] = Field(default=None, max_length=200)
    clave_inegi: Optional[str] = Field(default=None, max_length=10)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lon: Optional[float] = Field(default=None, ge=-180, le=180)
    frecuencia_recoleccion: Optional[str] = Field(default=None, max_length=60)
    proveedor_recoleccion: Optional[str] = Field(default=None, max_length=200)
    notas: Optional[str] = None
    source: str = Field(default="manual_user_input", max_length=120)
    source_method: str = Field(default="container_inventory_api", max_length=120)


class ContainerUpdate(BaseModel):
    tipo: Optional[str] = Field(default=None, min_length=1, max_length=60)
    capacidad_litros: Optional[int] = Field(default=None, ge=1)
    color: Optional[str] = Field(default=None, max_length=30)
    material: Optional[str] = Field(default=None, max_length=60)
    ubicacion: Optional[str] = Field(default=None, min_length=1, max_length=255)
    zona_interna: Optional[str] = Field(default=None, max_length=120)
    municipio: Optional[str] = Field(default=None, max_length=200)
    clave_inegi: Optional[str] = Field(default=None, max_length=10)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lon: Optional[float] = Field(default=None, ge=-180, le=180)
    frecuencia_recoleccion: Optional[str] = Field(default=None, max_length=60)
    proveedor_recoleccion: Optional[str] = Field(default=None, max_length=200)
    activo: Optional[bool] = None
    notas: Optional[str] = None
    source: Optional[str] = Field(default=None, max_length=120)
    source_method: Optional[str] = Field(default=None, max_length=120)


class ContainerCountDTO(BaseModel):
    total: int
    tenant_id: str


class ContainerDeleteDTO(BaseModel):
    status: str
    id: str
    tenant_id: str
    hard_deleted: bool = False


def _inventory(user: AuthedUser, db: Session) -> ContainerInventory:
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    if not user.tenant_id:
        raise HTTPException(status_code=403, detail="Usuario sin tenant asignado")
    return ContainerInventory(tenant_id=user.tenant_id, db=db)


@router.get("", response_model=list[ContainerDTO])
def list_containers(
    activo_only: bool = Query(False, description="Sólo contenedores activos"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    clave_inegi: Optional[str] = Query(None, description="Filtrar por clave INEGI"),
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    return _inventory(user, db).list(activo_only=activo_only, tipo=tipo, clave_inegi=clave_inegi)


@router.get("/count", response_model=ContainerCountDTO)
def count_containers(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    activo_only: bool = Query(False, description="Sólo contenedores activos"),
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    inventory = _inventory(user, db)
    return ContainerCountDTO(total=inventory.count(tipo=tipo, activo_only=activo_only), tenant_id=str(user.tenant_id))


@router.post("", response_model=ContainerDTO, status_code=201)
def create_container(
    data: ContainerCreate,
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    obj = _inventory(user, db).create(data.model_dump(exclude_none=True))
    logger.info("container_created tenant=%s id=%s tipo=%s", user.tenant_id, obj.id, obj.tipo)
    return obj


@router.get("/{container_id}", response_model=ContainerDTO)
def get_container(
    container_id: str,
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    try:
        return _inventory(user, db).get(container_id)
    except ContainerNotFound:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")


@router.patch("/{container_id}", response_model=ContainerDTO)
def update_container(
    container_id: str,
    data: ContainerUpdate,
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    try:
        return _inventory(user, db).update(container_id, data.model_dump(exclude_none=True))
    except ContainerNotFound:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")


@router.delete("/{container_id}", response_model=ContainerDeleteDTO)
def deactivate_container(
    container_id: str,
    user: AuthedUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Deactivate a container without physically deleting tenant data."""
    try:
        obj = _inventory(user, db).deactivate(container_id)
    except ContainerNotFound:
        raise HTTPException(status_code=404, detail="Contenedor no encontrado")
    logger.info("container_deactivated tenant=%s id=%s", user.tenant_id, obj.id)
    return ContainerDeleteDTO(status="deactivated", id=obj.id, tenant_id=obj.tenant_id)
