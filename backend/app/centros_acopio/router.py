"""
Router: /api/v1/centros-acopio

Wave 1 — endpoints para el mapa de Centros de Acopio de materiales reciclables.

Endpoints:
  GET  /                 → lista paginada con filtros (zm, municipio, clave_inegi, material)
  GET  /coverage         → manifest de cobertura nacional
  GET  /{centro_id}      → detalle de un centro
  POST /                 → registrar nuevo centro (empresa o usuario)
  PUT  /{centro_id}      → actualizar centro existente
  DELETE /{centro_id}    → eliminar (solo admin)
  POST /sync/places      → trigger sync desde Google Places (feature-flag)
  POST /sync/denue       → sync INEGI DENUE por CVE o entidad
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.agents.schemas import (
    CentroAcopio,
    CentroAcopioMaterial,
    CentroAcopioTipo,
)
from app.centros_acopio import repository as repo

router = APIRouter()
logger = logging.getLogger(__name__)


# ─── Request / Response schemas ──────────────────────────────────────────────

class CentroAcopioCreate(BaseModel):
    nombre:         str
    tipo:           CentroAcopioTipo = CentroAcopioTipo.otro
    direccion:      str
    municipio:      str
    estado:         str
    zm:             Optional[str] = None
    lat:            Optional[float] = None
    lon:            Optional[float] = None
    materiales:     List[CentroAcopioMaterial] = []
    precio_compra:  dict = {}
    telefono:       Optional[str] = None
    horario:        Optional[str] = None
    acepta_publico: bool = True
    acepta_empresa: bool = False


class PlacesSyncRequest(BaseModel):
    zm: str


class DenueSyncRequest(BaseModel):
    clave_inegi: Optional[str] = None
    estado_id: Optional[str] = None
    force: bool = False
    limit: Optional[int] = Field(None, ge=1, le=250, description="Límite municipios por entidad")


class CentroAcopioListResponse(BaseModel):
    total:    int
    centros:  List[CentroAcopio]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=CentroAcopioListResponse)
async def list_centros(
    zm:              Optional[str] = Query(None, description="Clave ZM: SLP, QRO, MTY"),
    municipio:       Optional[str] = Query(None),
    clave_inegi:     Optional[str] = Query(None, description="CVE INEGI municipal (5 dígitos)"),
    material:        Optional[CentroAcopioMaterial] = Query(None),
    acepta_empresa:  Optional[bool] = Query(None),
    verificado_only: bool = Query(False),
    incluir_operador: bool = Query(True, description="Incluir bodega/patio del concesionario"),
    solo_operador:   bool = Query(False, description="Solo instalaciones del operador principal"),
) -> CentroAcopioListResponse:
    centros = repo.list_centros(
        zm=zm,
        municipio=municipio,
        clave_inegi=clave_inegi,
        material=material,
        acepta_empresa=acepta_empresa,
        verificado_only=verificado_only,
        incluir_operador=incluir_operador,
        solo_operador=solo_operador,
    )
    return CentroAcopioListResponse(total=len(centros), centros=centros)


@router.get("/coverage")
async def get_coverage() -> dict:
    """Manifest de cobertura nacional — municipios con/sin datos DENUE u operador."""
    from app.centros_acopio.file_store import coverage_summary
    return coverage_summary()


@router.get("/{centro_id}", response_model=CentroAcopio)
async def get_centro(centro_id: str) -> CentroAcopio:
    centro = repo.get(centro_id)
    if not centro:
        raise HTTPException(status_code=404, detail=f"Centro {centro_id!r} no encontrado.")
    return centro


@router.post("/", response_model=CentroAcopio, status_code=201)
async def create_centro(data: CentroAcopioCreate) -> CentroAcopio:
    import uuid
    from datetime import datetime, timezone
    centro = CentroAcopio(
        centro_id=str(uuid.uuid4()),
        nombre=data.nombre,
        tipo=data.tipo,
        direccion=data.direccion,
        municipio=data.municipio,
        estado=data.estado,
        zm=data.zm,
        lat=data.lat,
        lon=data.lon,
        materiales=data.materiales,
        precio_compra=data.precio_compra,
        telefono=data.telefono,
        horario=data.horario,
        acepta_publico=data.acepta_publico,
        acepta_empresa=data.acepta_empresa,
        fuente="usuario",
        verificado=False,
        score_confianza=0.50,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    return repo.upsert(centro)


@router.put("/{centro_id}", response_model=CentroAcopio)
async def update_centro(centro_id: str, data: CentroAcopioCreate) -> CentroAcopio:
    existing = repo.get(centro_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Centro {centro_id!r} no encontrado.")
    updated = existing.model_copy(update=data.model_dump(exclude_unset=True))
    return repo.upsert(updated)


@router.delete("/{centro_id}")
async def delete_centro(centro_id: str) -> dict:
    if not repo.delete(centro_id):
        raise HTTPException(status_code=404, detail=f"Centro {centro_id!r} no encontrado.")
    return {"deleted": centro_id}


@router.post("/sync/places")
async def sync_places(req: PlacesSyncRequest) -> dict:
    """Sincroniza centros de acopio desde Google Places para la ZM dada."""
    try:
        from app.google.config import resolve_google_places_api_key
        from app.config import settings
        api_key = resolve_google_places_api_key()
        enabled = settings.PLACES_SYNC_ENABLED or bool(api_key)
    except Exception:
        api_key  = ""
        enabled  = False

    if not api_key:
        return {
            "synced": 0,
            "message": "Configura GOOGLE_PLACES_API_KEY o MAPS_PLATFORM_API en Render.",
        }

    synced = await repo.sync_from_places(zm=req.zm, api_key=api_key)
    return {"synced": synced, "zm": req.zm}


@router.post("/sync/denue")
async def sync_denue(req: DenueSyncRequest) -> dict:
    """Sincroniza centros DENUE por CVE municipal o por entidad federativa."""
    from app.centros_acopio import nacional_sync

    if req.clave_inegi:
        result = nacional_sync.sync_municipio_denue(req.clave_inegi, force=req.force)
        # Recargar store en memoria tras persistir
        from app.centros_acopio import file_store as fs
        for centro in fs.load_municipio_centros(req.clave_inegi):
            repo.upsert(centro)
        for centro in fs.load_operadores(req.clave_inegi):
            repo.upsert(centro)
        return result

    if req.estado_id:
        result = nacional_sync.sync_estado_denue(
            req.estado_id, force=req.force, limit=req.limit,
        )
        return result

    raise HTTPException(
        status_code=400,
        detail="Indique clave_inegi o estado_id para sincronizar DENUE.",
    )


@router.post("/sync/geocode-operadores")
async def sync_geocode_operadores(
    clave_inegi: Optional[str] = Query(None, description="CVE INEGI; omitir para todos"),
) -> dict:
    """Re-geocodifica bodegas/patios del concesionario vía Google Maps."""
    from app.centros_acopio import geocode_operadores as geo_op
    from app.centros_acopio import file_store as fs

    try:
        results = await geo_op.geocode_operadores(clave_inegi)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Google Geocoding no disponible: {exc}",
        ) from exc

    if clave_inegi:
        for centro in fs.load_operadores(clave_inegi):
            repo.upsert(centro)
    else:
        for centro in fs.load_all_persisted():
            if centro.es_operador_principal:
                repo.upsert(centro)

    return {"geocoded": results, "total_files": len(results)}
