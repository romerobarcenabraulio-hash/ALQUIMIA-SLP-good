"""
Router: /api/v1/centros-acopio
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.agents.schemas import (
    CentroAcopio,
    CentroAcopioMaterial,
    CentroAcopioTipo,
)
from app.centros_acopio import repository as repo
from app.db.session import get_db, is_db_available

router = APIRouter()
logger = logging.getLogger(__name__)


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
    limit: Optional[int] = Field(None, ge=1, le=250)


class PlacesEstadoSyncRequest(BaseModel):
    estado_id: str = Field("24", description="CVE entidad INEGI (24=San Luis Potosí)")
    force: bool = False
    limit: Optional[int] = Field(None, ge=1, le=250)


class CentroAcopioListResponse(BaseModel):
    total:    int
    centros:  List[CentroAcopio]
    sync_status: Optional[str] = None


def _lazy_sync_background(clave_inegi: str) -> None:
    if not is_db_available():
        return
    from app.db.session import get_sync_db
    from app.centros_acopio.geo_worker import ensure_municipio_geo

    with get_sync_db() as db:
        if db is not None:
            try:
                ensure_municipio_geo(db, clave_inegi)
            except Exception as exc:
                logger.warning("Lazy geo sync falló %s: %s", clave_inegi, exc)


@router.get("/", response_model=CentroAcopioListResponse)
async def list_centros(
    background_tasks: BackgroundTasks,
    zm:              Optional[str] = Query(None),
    municipio:       Optional[str] = Query(None),
    clave_inegi:     Optional[str] = Query(None),
    material:        Optional[CentroAcopioMaterial] = Query(None),
    acepta_empresa:  Optional[bool] = Query(None),
    verificado_only: bool = Query(False),
    incluir_operador: bool = Query(True),
    solo_operador:   bool = Query(False),
    db: Session = Depends(get_db),
) -> CentroAcopioListResponse:
    sync_status: str | None = None
    if clave_inegi and db is not None:
        from app.centros_acopio import geo_db

        row = geo_db.get_sync_row(db, clave_inegi.zfill(5))
        if row:
            sync_status = row.status
        elif is_db_available():
            sync_status = "pending"
            background_tasks.add_task(_lazy_sync_background, clave_inegi)

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
    return CentroAcopioListResponse(total=len(centros), centros=centros, sync_status=sync_status)


@router.get("/depots")
async def get_depots_map(
    estado_id: Optional[str] = Query(None, description="CVE entidad INEGI, ej. 19=NL"),
    db: Session = Depends(get_db),
) -> dict:
    """Mapa depósito/almacén concesionario resuelto por municipio (resolveDepot)."""
    from app.city.inegi_catalog import ESTADOS_MX, fetch_municipios_inegi
    from app.logistics.depot_resolver import resolve_depot

    estados = [estado_id.zfill(2)] if estado_id else [e for e, _ in ESTADOS_MX]
    municipios_out: dict[str, dict] = {}
    for eid in estados:
        for muni in fetch_municipios_inegi(eid):
            cve = muni.clave_inegi.zfill(5)
            depot = resolve_depot(cve, zm=muni.zm_simulator_id, db=db)
            municipios_out[cve] = {
                "municipio": muni.nombre,
                "estado": muni.estado_nombre,
                **depot,
            }
    return {"municipios": municipios_out, "total": len(municipios_out)}


@router.get("/coverage")
async def get_coverage(db: Session = Depends(get_db)) -> dict:
    stats = repo.coverage_stats()
    manifest = {
        "version": "2.0.0",
        "updated_at": stats.get("updated_at"),
        "totales": {
            "municipios_catalogados": stats.get("municipios_catalogados", 0),
            "con_datos": stats.get("municipios_synced", 0),
            "sin_datos": stats.get("municipios_sin_datos", 0),
            "pending": stats.get("municipios_pending", 0),
        },
        "geo_coverage_pct": stats.get("geo_coverage_pct", 0),
        "centros_total": stats.get("centros_total", 0),
        "municipios_con_operador_verificado": stats.get("municipios_con_operador_verificado", 0),
        "municipios_con_operador_candidato": stats.get("municipios_con_operador_candidato", 0),
    }
    if stats.get("source") == "file_manifest":
        from app.centros_acopio.file_store import coverage_summary
        return {**coverage_summary(), "stats": stats}
    return {"manifest": manifest, "stats": stats, "source": "neon"}


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
    try:
        from app.google.config import resolve_google_places_api_key
        from app.config import settings
        api_key = resolve_google_places_api_key()
        enabled = settings.PLACES_SYNC_ENABLED or bool(api_key)
    except Exception:
        api_key = ""
        enabled = False

    if not api_key:
        return {"synced": 0, "message": "Configura GOOGLE_PLACES_API_KEY o MAPS_PLATFORM_API en Render."}

    synced = await repo.sync_from_places(zm=req.zm, api_key=api_key)
    return {"synced": synced, "zm": req.zm}


@router.post("/sync/denue")
async def sync_denue(req: DenueSyncRequest, db: Session = Depends(get_db)) -> dict:
    from app.centros_acopio import nacional_sync

    if req.clave_inegi:
        if db is not None:
            from app.centros_acopio.geo_worker import sync_municipio
            return sync_municipio(db, req.clave_inegi, force=req.force)
        result = nacional_sync.sync_municipio_denue(req.clave_inegi, force=req.force)
        from app.centros_acopio import file_store as fs
        for centro in fs.load_municipio_centros(req.clave_inegi):
            repo.upsert(centro)
        for centro in fs.load_operadores(req.clave_inegi):
            repo.upsert(centro)
        return result

    if req.estado_id:
        return nacional_sync.sync_estado_denue(req.estado_id, force=req.force, limit=req.limit)

    raise HTTPException(status_code=400, detail="Indique clave_inegi o estado_id.")


@router.post("/sync/places-estado")
async def sync_places_estado(req: PlacesEstadoSyncRequest, db: Session = Depends(get_db)) -> dict:
    """Google Places — todos los municipios de una entidad (p.ej. 24=San Luis Potosí)."""
    if db is None:
        raise HTTPException(503, "Base de datos no disponible")
    from app.centros_acopio.places_sync import sync_estado_places

    return sync_estado_places(db, req.estado_id, force=req.force, limit=req.limit)


@router.post("/sync/places-municipio")
async def sync_places_municipio(
    clave_inegi: str = Query(..., min_length=5, max_length=5),
    force: bool = Query(False),
    db: Session = Depends(get_db),
) -> dict:
    if db is None:
        raise HTTPException(503, "Base de datos no disponible")
    from app.centros_acopio.places_sync import sync_municipio_places

    return sync_municipio_places(db, clave_inegi, force=force)


@router.post("/sync/geocode-operadores")
async def sync_geocode_operadores(
    clave_inegi: Optional[str] = Query(None),
) -> dict:
    from app.centros_acopio import geocode_operadores as geo_op
    from app.centros_acopio import file_store as fs

    try:
        results = await geo_op.geocode_operadores(clave_inegi)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Google Geocoding no disponible: {exc}") from exc

    if clave_inegi:
        for centro in fs.load_operadores(clave_inegi):
            repo.upsert(centro)
    else:
        for centro in fs.load_all_persisted():
            if centro.es_operador_principal:
                repo.upsert(centro)

    return {"geocoded": results, "total_files": len(results)}
