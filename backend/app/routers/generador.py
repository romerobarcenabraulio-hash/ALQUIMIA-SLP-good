from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime
from uuid import UUID
from typing import Optional, List

from app.db.session import get_db
from app.db.security import current_user
from app.models.generador import (
    GeneradorEntity, GeneratorResidueRecord, MunicipalResidueAggregate,
    GeneradorTipo, GeneradorSource
)
from app.models.user_account import User

router = APIRouter()


# ─── Pydantic Schemas ────────────────────────────────────────────────────────


from pydantic import BaseModel, Field
from typing import Dict, Any, Optional


class GeneradorCreateRequest(BaseModel):
    nombre: str
    tipo: GeneradorTipo
    rfc: Optional[str] = None
    clave_inegi: Optional[str] = None
    municipio: str
    estado_mx: str
    direccion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    sector_isic: Optional[str] = None
    sector_desc: Optional[str] = None
    capacidad_generacion_ton_mes: Optional[float] = None
    materiales_generados: Optional[List[str]] = None
    frecuencia_generacion: str = "diaria"


class GeneradorUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[GeneradorTipo] = None
    rfc: Optional[str] = None
    municipio: Optional[str] = None
    estado_mx: Optional[str] = None
    direccion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    capacidad_generacion_ton_mes: Optional[float] = None
    materiales_generados: Optional[List[str]] = None
    frecuencia_generacion: Optional[str] = None
    activo: Optional[bool] = None
    verificado: Optional[bool] = None


class GeneradorResponse(BaseModel):
    id: str
    nombre: str
    tipo: str
    rfc: Optional[str]
    municipio: str
    estado_mx: str
    direccion: Optional[str]
    contacto_nombre: Optional[str]
    contacto_email: Optional[str]
    contacto_telefono: Optional[str]
    sector_isic: Optional[str]
    capacidad_generacion_ton_mes: Optional[float]
    materiales_generados: Optional[List[str]]
    activo: bool
    verificado: bool
    source: str
    created_at: str

    class Config:
        from_attributes = True


# ─── Routes ──────────────────────────────────────────────────────────────────


@router.get("/generadores")
async def list_generadores(
    tipo: Optional[str] = Query(None),
    municipio: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """List generadores for active tenant with optional filters."""

    tenant_id = user.tenant_id
    query = db.query(GeneradorEntity).filter(
        and_(
            GeneradorEntity.tenant_id == tenant_id,
            GeneradorEntity.deleted_at.is_(None),
        )
    )

    if tipo:
        query = query.filter(GeneradorEntity.tipo == tipo)
    if municipio:
        query = query.filter(GeneradorEntity.municipio == municipio)
    if sector:
        query = query.filter(GeneradorEntity.sector_isic == sector)
    if activo is not None:
        query = query.filter(GeneradorEntity.activo == activo)

    total = query.count()
    generadores = query.order_by(desc(GeneradorEntity.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "generadores": [
            {
                "id": str(g.id),
                "nombre": g.nombre,
                "tipo": g.tipo.value,
                "municipio": g.municipio,
                "estado_mx": g.estado_mx,
                "contacto_nombre": g.contacto_nombre,
                "capacidad_generacion_ton_mes": g.capacidad_generacion_ton_mes,
                "activo": g.activo,
                "verificado": g.verificado,
                "source": g.source.value,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
            for g in generadores
        ],
    }


@router.post("/generadores")
async def create_generador(
    req: GeneradorCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Create a new generador entity."""

    tenant_id = user.tenant_id

    # Check for duplicates (RFC if provided)
    if req.rfc:
        existing = db.query(GeneradorEntity).filter(
            and_(
                GeneradorEntity.tenant_id == tenant_id,
                GeneradorEntity.rfc == req.rfc,
                GeneradorEntity.deleted_at.is_(None),
            )
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="RFC already exists")

    generador = GeneradorEntity(
        tenant_id=tenant_id,
        nombre=req.nombre,
        tipo=req.tipo,
        rfc=req.rfc,
        municipio=req.municipio,
        estado_mx=req.estado_mx,
        direccion=req.direccion,
        latitud=req.latitud,
        longitud=req.longitud,
        contacto_nombre=req.contacto_nombre,
        contacto_email=req.contacto_email,
        contacto_telefono=req.contacto_telefono,
        sector_isic=req.sector_isic,
        sector_desc=req.sector_desc,
        capacidad_generacion_ton_mes=req.capacidad_generacion_ton_mes,
        materiales_generados=req.materiales_generados or [],
        frecuencia_generacion=req.frecuencia_generacion,
        source=GeneradorSource.manual,
    )

    db.add(generador)
    db.commit()
    db.refresh(generador)

    return {
        "id": str(generador.id),
        "nombre": generador.nombre,
        "tipo": generador.tipo.value,
        "municipio": generador.municipio,
        "estado_mx": generador.estado_mx,
        "activo": generador.activo,
        "source": generador.source.value,
        "created_at": generador.created_at.isoformat(),
    }


@router.get("/generadores/{generador_id}")
async def get_generador(
    generador_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Get a specific generador by ID."""

    try:
        gid = UUID(generador_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    generador = db.query(GeneradorEntity).filter(
        and_(
            GeneradorEntity.id == gid,
            GeneradorEntity.tenant_id == user.tenant_id,
            GeneradorEntity.deleted_at.is_(None),
        )
    ).first()

    if not generador:
        raise HTTPException(status_code=404, detail="Generador not found")

    return {
        "id": str(generador.id),
        "nombre": generador.nombre,
        "tipo": generador.tipo.value,
        "rfc": generador.rfc,
        "municipio": generador.municipio,
        "estado_mx": generador.estado_mx,
        "direccion": generador.direccion,
        "latitud": generador.latitud,
        "longitud": generador.longitud,
        "contacto_nombre": generador.contacto_nombre,
        "contacto_email": generador.contacto_email,
        "contacto_telefono": generador.contacto_telefono,
        "sector_isic": generador.sector_isic,
        "capacidad_generacion_ton_mes": generador.capacidad_generacion_ton_mes,
        "materiales_generados": generador.materiales_generados,
        "activo": generador.activo,
        "verificado": generador.verificado,
        "source": generador.source.value,
        "created_at": generador.created_at.isoformat(),
        "updated_at": generador.updated_at.isoformat(),
    }


@router.patch("/generadores/{generador_id}")
async def update_generador(
    generador_id: str,
    req: GeneradorUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Update a generador entity."""

    try:
        gid = UUID(generador_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    generador = db.query(GeneradorEntity).filter(
        and_(
            GeneradorEntity.id == gid,
            GeneradorEntity.tenant_id == user.tenant_id,
            GeneradorEntity.deleted_at.is_(None),
        )
    ).first()

    if not generador:
        raise HTTPException(status_code=404, detail="Generador not found")

    # Update fields
    for field, value in req.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(generador, field, value)

    generador.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(generador)

    return {
        "id": str(generador.id),
        "nombre": generador.nombre,
        "tipo": generador.tipo.value,
        "municipio": generador.municipio,
        "estado_mx": generador.estado_mx,
        "activo": generador.activo,
        "verificado": generador.verificado,
        "updated_at": generador.updated_at.isoformat(),
    }


@router.delete("/generadores/{generador_id}")
async def delete_generador(
    generador_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Soft delete a generador."""

    try:
        gid = UUID(generador_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    generador = db.query(GeneradorEntity).filter(
        and_(
            GeneradorEntity.id == gid,
            GeneradorEntity.tenant_id == user.tenant_id,
            GeneradorEntity.deleted_at.is_(None),
        )
    ).first()

    if not generador:
        raise HTTPException(status_code=404, detail="Generador not found")

    generador.deleted_at = datetime.utcnow()
    db.commit()

    return {"status": "deleted", "id": str(generador.id)}


# ─── Residue Recording ──────────────────────────────────────────────────────


@router.post("/generadores/{generador_id}/residues")
async def record_residue(
    generador_id: str,
    req: dict,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Record daily residue data for a generador.

    req: {
        "fecha_generacion": "2024-01-15",
        "materiales_json": {"acero": 2.5, "concreto": 5.0},
        "cantidad_total_tons": 7.5,
        "comentario": "..."
    }
    """

    try:
        gid = UUID(generador_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    # Verify generador exists and belongs to tenant
    generador = db.query(GeneradorEntity).filter(
        and_(
            GeneradorEntity.id == gid,
            GeneradorEntity.tenant_id == user.tenant_id,
            GeneradorEntity.deleted_at.is_(None),
        )
    ).first()

    if not generador:
        raise HTTPException(status_code=404, detail="Generador not found")

    # Check for duplicate entry for same fecha
    existing = db.query(GeneratorResidueRecord).filter(
        and_(
            GeneratorResidueRecord.generador_id == gid,
            GeneratorResidueRecord.fecha_generacion == req.get("fecha_generacion"),
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Record already exists for this date")

    record = GeneratorResidueRecord(
        generador_id=gid,
        tenant_id=user.tenant_id,
        fecha_generacion=req.get("fecha_generacion"),
        materiales_json=req.get("materiales_json", {}),
        cantidad_total_tons=req.get("cantidad_total_tons", 0),
        comentario=req.get("comentario"),
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": str(record.id),
        "generador_id": str(record.generador_id),
        "fecha_generacion": record.fecha_generacion,
        "cantidad_total_tons": record.cantidad_total_tons,
        "validado": record.validado,
        "created_at": record.created_at.isoformat(),
    }


@router.get("/generadores/{generador_id}/residues")
async def list_generador_residues(
    generador_id: str,
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """List residue records for a generador."""

    try:
        gid = UUID(generador_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    # Verify generador belongs to tenant
    generador = db.query(GeneradorEntity).filter(
        and_(
            GeneradorEntity.id == gid,
            GeneradorEntity.tenant_id == user.tenant_id,
        )
    ).first()

    if not generador:
        raise HTTPException(status_code=404, detail="Generador not found")

    query = db.query(GeneratorResidueRecord).filter(
        GeneratorResidueRecord.generador_id == gid
    )

    if fecha_desde:
        query = query.filter(GeneratorResidueRecord.fecha_generacion >= fecha_desde)
    if fecha_hasta:
        query = query.filter(GeneratorResidueRecord.fecha_generacion <= fecha_hasta)

    total = query.count()
    records = query.order_by(desc(GeneratorResidueRecord.fecha_generacion)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "generador_id": str(gid),
        "records": [
            {
                "id": str(r.id),
                "fecha_generacion": r.fecha_generacion,
                "cantidad_total_tons": r.cantidad_total_tons,
                "materiales_json": r.materiales_json,
                "validado": r.validado,
                "es_outlier": r.es_outlier,
                "confianza_pct": r.confianza_pct,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ],
    }


# ─── Municipal Aggregation ──────────────────────────────────────────────────


@router.get("/municipios/{municipio}/residue-aggregate")
async def get_municipal_aggregate(
    municipio: str,
    fecha: Optional[str] = Query(None),
    periodo: str = Query("diario"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Get aggregated residue data for a municipality."""

    # Build filters
    query = db.query(MunicipalResidueAggregate).filter(
        and_(
            MunicipalResidueAggregate.tenant_id == user.tenant_id,
            MunicipalResidueAggregate.municipio == municipio,
            MunicipalResidueAggregate.periodo == periodo,
        )
    )

    if fecha:
        query = query.filter(MunicipalResidueAggregate.fecha == fecha)

    aggregates = query.order_by(desc(MunicipalResidueAggregate.fecha)).limit(30).all()

    return {
        "municipio": municipio,
        "periodo": periodo,
        "data": [
            {
                "fecha": a.fecha,
                "total_tons": a.total_tons,
                "total_generadores": a.total_generadores,
                "promedio_generador_tons": a.promedio_generador_tons,
                "completitud_pct": a.completitud_pct,
                "materiales_desglose": a.materiales_desglose,
                "cambio_semana_pct": a.cambio_semana_pct,
                "proyeccion_mes_tons": a.proyeccion_mes_tons,
            }
            for a in aggregates
        ],
    }


@router.get("/generadores/{generador_id}/analytics")
async def get_generador_analytics(
    generador_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Get residue analytics and trends for a specific generador."""

    try:
        gid = UUID(generador_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    # Verify generador exists
    generador = db.query(GeneradorEntity).filter(
        and_(
            GeneradorEntity.id == gid,
            GeneradorEntity.tenant_id == user.tenant_id,
        )
    ).first()

    if not generador:
        raise HTTPException(status_code=404, detail="Generador not found")

    from datetime import timedelta
    from app.residue_tracking.analyzer import TrendAnalyzer, MaterialComposition

    cutoff_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

    records = db.query(GeneratorResidueRecord).filter(
        and_(
            GeneratorResidueRecord.generador_id == gid,
            GeneratorResidueRecord.fecha_generacion >= cutoff_date,
        )
    ).order_by(GeneratorResidueRecord.fecha_generacion).all()

    if not records:
        return {
            "generador_id": str(gid),
            "dias_con_datos": 0,
            "mensaje": "No hay datos disponibles"
        }

    daily_values = [r.cantidad_total_tons for r in records]
    trend_data = TrendAnalyzer.calculate_trend(daily_values)

    # Aggregate materials
    all_materiales = {}
    for record in records:
        for material, tons in (record.materiales_json or {}).items():
            if material not in all_materiales:
                all_materiales[material] = 0
            all_materiales[material] += tons

    material_composition = MaterialComposition.estimate_recyclable_potential(all_materiales)
    material_percentages = MaterialComposition.calculate_percentages(all_materiales)

    return {
        "generador_id": str(gid),
        "dias_con_datos": len(records),
        "periodo_dias": days,
        "trend": trend_data,
        "materiales_agregados": all_materiales,
        "material_percentages": material_percentages,
        "reciclable_potencial": material_composition,
        "proyeccion_mes_tons": TrendAnalyzer.project_monthly(trend_data["media_tons"], len(records)),
    }


@router.post("/municipios/{municipio}/residue-export-banobras")
async def export_banobras_format(
    municipio: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
) -> dict:
    """Export municipal residue data in BANOBRAS-compatible format."""

    from app.residue_tracking.aggregator import MunicipalAggregator

    if user.rol not in ["admin", "analista"]:
        raise HTTPException(status_code=403, detail="Access denied")

    export_data = MunicipalAggregator.generate_banobras_export(db, user.tenant_id)

    # Filter to requested municipality
    export_data["municipios"] = [m for m in export_data["municipios"] if m["nombre"] == municipio]

    return export_data
