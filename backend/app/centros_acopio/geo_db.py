"""Persistencia Neon — geo centros, sync cursor, rutas residenciales."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.agents.schemas import (
    CentroAcopio,
    CentroAcopioMaterial,
    CentroAcopioRolInstalacion,
    CentroAcopioTipo,
)
from app.models.geo import GeoCentroAcopio, GeoMunicipioSync, LogisticsResidentialRoute


def _safe_enum(enum_cls, value, default):
    try:
        return enum_cls(value)
    except (ValueError, TypeError):
        return default


def _row_to_centro(row: GeoCentroAcopio) -> CentroAcopio:
    materiales = row.materiales or []
    mat_values = {m.value for m in CentroAcopioMaterial}
    return CentroAcopio(
        centro_id=row.centro_id,
        nombre=row.nombre,
        tipo=_safe_enum(CentroAcopioTipo, row.tipo, CentroAcopioTipo.otro),
        direccion=row.direccion or "",
        municipio=row.municipio,
        estado=row.estado or "",
        clave_inegi=row.clave_inegi,
        zm=row.zm,
        lat=row.lat,
        lon=row.lon,
        materiales=[CentroAcopioMaterial(m) for m in materiales if m in mat_values],
        precio_compra=row.precio_compra or {},
        telefono=row.telefono,
        horario=row.horario,
        acepta_publico=row.acepta_publico,
        acepta_empresa=row.acepta_empresa,
        rol_instalacion=_safe_enum(
            CentroAcopioRolInstalacion, row.rol_instalacion, CentroAcopioRolInstalacion.centro_acopio
        ),
        es_operador_principal=row.es_operador_principal,
        operador_nombre=row.operador_nombre,
        fuente=row.fuente,
        verificado=row.verificado,
        score_confianza=row.score_confianza,
        notas=row.notas,
        created_at=row.created_at or datetime.now(timezone.utc),
        updated_at=row.updated_at or datetime.now(timezone.utc),
    )


def _centro_to_row(centro: CentroAcopio) -> dict[str, Any]:
    return {
        "centro_id": centro.centro_id,
        "nombre": centro.nombre,
        "tipo": centro.tipo.value if isinstance(centro.tipo, CentroAcopioTipo) else str(centro.tipo),
        "direccion": centro.direccion,
        "municipio": centro.municipio,
        "estado": centro.estado,
        "clave_inegi": centro.clave_inegi,
        "zm": centro.zm,
        "lat": centro.lat,
        "lon": centro.lon,
        "materiales": [m.value if isinstance(m, CentroAcopioMaterial) else m for m in centro.materiales],
        "precio_compra": centro.precio_compra or {},
        "telefono": centro.telefono,
        "horario": centro.horario,
        "acepta_publico": centro.acepta_publico,
        "acepta_empresa": centro.acepta_empresa,
        "rol_instalacion": centro.rol_instalacion.value
        if isinstance(centro.rol_instalacion, CentroAcopioRolInstalacion)
        else str(centro.rol_instalacion),
        "es_operador_principal": centro.es_operador_principal,
        "operador_nombre": centro.operador_nombre,
        "fuente": centro.fuente,
        "verificado": centro.verificado,
        "score_confianza": centro.score_confianza,
        "notas": centro.notas,
        "updated_at": datetime.now(timezone.utc),
    }


def upsert_centro(db: Session, centro: CentroAcopio) -> CentroAcopio:
    data = _centro_to_row(centro)
    row = db.query(GeoCentroAcopio).filter(GeoCentroAcopio.centro_id == centro.centro_id).first()
    if row:
        for k, v in data.items():
            setattr(row, k, v)
    else:
        row = GeoCentroAcopio(**data)
        db.add(row)
    db.flush()
    return _row_to_centro(row)


def upsert_centros_bulk(db: Session, centros: list[CentroAcopio], clave_inegi: str) -> int:
    """Reemplaza centros no-operador de un CVE; preserva operadores de perfil verificado."""
    db.query(GeoCentroAcopio).filter(
        GeoCentroAcopio.clave_inegi == clave_inegi.zfill(5),
        GeoCentroAcopio.es_operador_principal.is_(False),
        GeoCentroAcopio.fuente != "perfil_municipal",
    ).delete(synchronize_session=False)
    count = 0
    for c in centros:
        upsert_centro(db, c)
        count += 1
    db.flush()
    return count


def replace_operadores_for_cve(db: Session, centros: list[CentroAcopio], clave_inegi: str) -> None:
    cve = clave_inegi.zfill(5)
    db.query(GeoCentroAcopio).filter(
        GeoCentroAcopio.clave_inegi == cve,
        GeoCentroAcopio.es_operador_principal.is_(True),
        GeoCentroAcopio.verificado.is_(False),
    ).delete(synchronize_session=False)
    for c in centros:
        if c.es_operador_principal:
            upsert_centro(db, c)


def get_centro(db: Session, centro_id: str) -> CentroAcopio | None:
    row = db.query(GeoCentroAcopio).filter(GeoCentroAcopio.centro_id == centro_id).first()
    return _row_to_centro(row) if row else None


def list_centros_db(
    db: Session,
    *,
    zm: Optional[str] = None,
    municipio: Optional[str] = None,
    clave_inegi: Optional[str] = None,
    material: Optional[CentroAcopioMaterial] = None,
    acepta_empresa: Optional[bool] = None,
    verificado_only: bool = False,
    incluir_operador: bool = True,
    solo_operador: bool = False,
) -> list[CentroAcopio]:
    q = db.query(GeoCentroAcopio)
    if clave_inegi:
        q = q.filter(GeoCentroAcopio.clave_inegi == clave_inegi.zfill(5))
    if zm:
        q = q.filter(GeoCentroAcopio.zm == zm.upper())
    if municipio:
        q = q.filter(GeoCentroAcopio.municipio.ilike(f"%{municipio}%"))
    if solo_operador:
        q = q.filter(GeoCentroAcopio.es_operador_principal.is_(True))
    elif not incluir_operador:
        q = q.filter(GeoCentroAcopio.es_operador_principal.is_(False))
    if acepta_empresa is not None:
        q = q.filter(GeoCentroAcopio.acepta_empresa == acepta_empresa)
    if verificado_only:
        q = q.filter(GeoCentroAcopio.verificado.is_(True))
    rows = q.all()
    out = [_row_to_centro(r) for r in rows]
    if material:
        out = [c for c in out if material in c.materiales]
    out.sort(key=lambda c: (c.es_operador_principal, c.verificado, c.score_confianza), reverse=True)
    return out


def get_sync_row(db: Session, clave_inegi: str) -> GeoMunicipioSync | None:
    return db.query(GeoMunicipioSync).filter(GeoMunicipioSync.clave_inegi == clave_inegi.zfill(5)).first()


def upsert_sync_row(
    db: Session,
    *,
    clave_inegi: str,
    municipio: str,
    estado: str,
    estado_id: str | None,
    status: str,
    total_centros: int,
    total_candidatos_operador: int,
    fuente: str,
    error_message: str | None = None,
) -> None:
    cve = clave_inegi.zfill(5)
    row = db.query(GeoMunicipioSync).filter(GeoMunicipioSync.clave_inegi == cve).first()
    now = datetime.now(timezone.utc)
    if row:
        row.municipio = municipio
        row.estado = estado
        row.estado_id = estado_id
        row.status = status
        row.total_centros = total_centros
        row.total_candidatos_operador = total_candidatos_operador
        row.fuente = fuente
        row.error_message = error_message
        row.last_sync_at = now
    else:
        db.add(
            GeoMunicipioSync(
                clave_inegi=cve,
                municipio=municipio,
                estado=estado,
                estado_id=estado_id,
                status=status,
                total_centros=total_centros,
                total_candidatos_operador=total_candidatos_operador,
                fuente=fuente,
                error_message=error_message,
                last_sync_at=now,
            )
        )
    db.flush()


def coverage_stats(db: Session) -> dict[str, Any]:
    total = db.query(func.count(GeoMunicipioSync.clave_inegi)).scalar() or 0
    synced = db.query(func.count(GeoMunicipioSync.clave_inegi)).filter(
        GeoMunicipioSync.status == "synced"
    ).scalar() or 0
    sin_datos = db.query(func.count(GeoMunicipioSync.clave_inegi)).filter(
        GeoMunicipioSync.status == "sin_datos"
    ).scalar() or 0
    pending = db.query(func.count(GeoMunicipioSync.clave_inegi)).filter(
        GeoMunicipioSync.status == "pending"
    ).scalar() or 0
    operador_verificado = db.query(func.count(func.distinct(GeoCentroAcopio.clave_inegi))).filter(
        GeoCentroAcopio.es_operador_principal.is_(True),
        GeoCentroAcopio.verificado.is_(True),
    ).scalar() or 0
    operador_candidato = db.query(func.count(func.distinct(GeoCentroAcopio.clave_inegi))).filter(
        GeoCentroAcopio.es_operador_principal.is_(True),
        GeoCentroAcopio.verificado.is_(False),
    ).scalar() or 0
    centros_total = db.query(func.count(GeoCentroAcopio.id)).scalar() or 0
    pct = round((synced / total * 100), 2) if total else 0.0
    return {
        "municipios_catalogados": total,
        "municipios_synced": synced,
        "municipios_sin_datos": sin_datos,
        "municipios_pending": pending,
        "geo_coverage_pct": pct,
        "centros_total": centros_total,
        "municipios_con_operador_verificado": operador_verificado,
        "municipios_con_operador_candidato": operador_candidato,
    }


def save_residential_route(db: Session, plan: dict[str, Any]) -> int:
    route_id = plan["route_id"]
    zm = (plan.get("zm") or plan.get("zm_id") or "SLP").upper()
    row = (
        db.query(LogisticsResidentialRoute)
        .filter(LogisticsResidentialRoute.route_id == route_id, LogisticsResidentialRoute.zm == zm)
        .first()
    )
    saved_at = datetime.now(timezone.utc)
    payload = {
        "route_id": route_id,
        "zm": zm,
        "clave_inegi": plan.get("clave_inegi"),
        "municipio_id": plan.get("municipio_id") or plan.get("stops", [{}])[0].get("municipio_id", "slp"),
        "traced": bool(plan.get("traced")),
        "source": plan.get("source", "draft"),
        "depot_json": plan.get("depot"),
        "plan_json": plan,
        "saved_at": saved_at,
    }
    if row:
        for k, v in payload.items():
            if k != "route_id" and k != "zm":
                setattr(row, k, v)
        row.updated_at = saved_at
    else:
        row = LogisticsResidentialRoute(**payload)
        db.add(row)
    db.flush()
    return row.id


def list_residential_routes(
    db: Session,
    *,
    zm: str | None = None,
    clave_inegi: str | None = None,
    traced_only: bool = False,
) -> list[dict[str, Any]]:
    q = db.query(LogisticsResidentialRoute)
    if zm:
        q = q.filter(LogisticsResidentialRoute.zm == zm.upper())
    if clave_inegi:
        q = q.filter(LogisticsResidentialRoute.clave_inegi == clave_inegi.zfill(5))
    if traced_only:
        q = q.filter(LogisticsResidentialRoute.traced.is_(True))
    rows = q.order_by(LogisticsResidentialRoute.updated_at.desc()).all()
    return [r.plan_json for r in rows]


def count_traced_routes(db: Session) -> int:
    return db.query(func.count(LogisticsResidentialRoute.id)).filter(
        LogisticsResidentialRoute.traced.is_(True)
    ).scalar() or 0


def latest_traced_km_for_municipio(db: Session, municipio_id: str) -> float | None:
    row = (
        db.query(LogisticsResidentialRoute)
        .filter(
            LogisticsResidentialRoute.municipio_id == municipio_id,
            LogisticsResidentialRoute.traced.is_(True),
        )
        .order_by(LogisticsResidentialRoute.saved_at.desc())
        .first()
    )
    if not row or not row.plan_json:
        return None
    return float(row.plan_json.get("km_totales") or row.plan_json.get("total_km") or 0)
