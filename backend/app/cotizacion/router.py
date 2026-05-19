"""
Router: /api/v1/cotizaciones

Endpoints para guardar y recuperar cotizaciones óptimas por municipio.
Los agentes ALQUIMIA usan estos endpoints para:
  - Persistir recomendaciones generadas en el frontend.
  - Recuperar la última cotización al retomar un proyecto.
  - Comparar versiones históricas (data flywheel).
  - Añadir notas de campo (consultor / agente autónomo).
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.proyecto import CotizacionMunicipal
from app.routers.auth import get_current_user, UserInfo
from .schemas import (
    CotizacionCreateRequest,
    CotizacionResponse,
    CotizacionHistorialResponse,
    NotasUpdateRequest,
    MixCAsSchema,
    RecicladoraSchema,
    JustificacionSchema,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _model_to_response(c: CotizacionMunicipal) -> CotizacionResponse:
    """Convierte el modelo ORM a schema de respuesta."""
    mix = c.mix_cas_json or {}
    recicladoras = [
        RecicladoraSchema(
            giro=r.get("giro", ""),
            nombre=r.get("nombre", ""),
            justificacion=r.get("justificacion", ""),
            capex_mxn=r.get("capexMXN", 0),
            opex_mes_mxn=r.get("opexMesMXN", 0),
            tir_pct=r.get("tirPct", 0),
            payback_meses=r.get("paybackMeses", 999),
            empleos=r.get("empleos", 0),
        )
        for r in (c.recicladoras_json or [])
    ]
    just = c.resultado_completo_json or {}
    just_obj = just.get("justificacion", {})
    justificacion = JustificacionSchema(
        texto_ejecutivo=just_obj.get("textoEjecutivo", ""),
        factores_favorables=just_obj.get("factoresFavorables", []),
        restricciones=just_obj.get("restricciones", []),
        supuestos_clave=just_obj.get("supuestosClave", []),
    )
    return CotizacionResponse(
        id=c.id,
        municipio_id=c.municipio_id,
        municipio_nombre=c.municipio_nombre,
        zm=c.zm,
        version=c.version,
        generado_por=c.generado_por,
        generado_en=c.created_at,

        poblacion=c.poblacion,
        generacion_rsu_ton_dia=c.generacion_rsu_ton_dia,
        pct_captura_meta=c.pct_captura_meta,
        ton_captura_meta=c.ton_captura_meta,
        horizonte_anos=c.horizonte_anos,

        fase_recomendada=c.fase_recomendada,
        fase_nombre=c.fase_nombre,
        mix_cas=MixCAsSchema(P=mix.get("P", 0), M=mix.get("M", 0), G=mix.get("G", 0)),
        capacidad_ton_dia=c.capacidad_ton_dia,
        cobertura_meta_pct=c.cobertura_meta_pct,
        recicladoras=recicladoras,

        capex_total_mxn=c.capex_total_mxn,
        opex_mes_mxn=c.opex_mes_mxn,
        ebitda_mes_mxn=c.ebitda_mes_mxn,
        empleos_directos=c.empleos_directos,
        co2e_anual_ton=c.co2e_anual_ton,
        tir_estimada_pct=c.tir_estimada_pct,
        payback_meses=c.payback_meses,

        score_viabilidad=c.score_viabilidad,
        clasificacion_viabilidad=c.clasificacion_viabilidad,
        justificacion=justificacion,
        notas=c.notas,
    )


@router.post(
    "/",
    response_model=CotizacionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Guardar cotización recomendada",
    description=(
        "Persiste la cotización óptima generada por el motor ALQUIMIA. "
        "Si ya existe una cotización con el mismo `id` (idempotency key), "
        "la retorna sin duplicar. Si el municipio ya tiene versiones previas, "
        "incrementa la versión automáticamente."
    ),
)
async def crear_cotizacion(
    payload: CotizacionCreateRequest,
    db: AsyncSession = Depends(get_db),
    _user: UserInfo = Depends(get_current_user),
) -> CotizacionResponse:
    # Idempotencia: si ya existe este UUID, retornar el existente
    existing = await db.get(CotizacionMunicipal, payload.id)
    if existing:
        logger.info(f"Cotizacion {payload.id} ya existe — retornando existente")
        return _model_to_response(existing)

    # Calcular próxima versión para este municipio
    result = await db.execute(
        select(func.max(CotizacionMunicipal.version)).where(
            CotizacionMunicipal.municipio_id == payload.municipio_id
        )
    )
    max_version: Optional[int] = result.scalar_one_or_none()
    next_version = (max_version or 0) + 1

    cotizacion = CotizacionMunicipal(
        id=payload.id,
        municipio_id=payload.municipio_id,
        municipio_nombre=payload.municipio_nombre,
        zm=payload.zm,

        poblacion=payload.poblacion,
        generacion_rsu_ton_dia=payload.generacion_rsu_ton_dia,
        pct_captura_meta=payload.pct_captura_meta,
        ton_captura_meta=payload.ton_captura_meta,
        horizonte_anos=payload.horizonte_anos,
        precios_json=payload.precios_json,

        fase_recomendada=payload.fase_recomendada,
        fase_nombre=payload.fase_nombre,
        mix_cas_json=payload.mix_cas.model_dump(),
        capacidad_ton_dia=payload.capacidad_ton_dia,
        cobertura_meta_pct=payload.cobertura_meta_pct,
        recicladoras_json=[r.model_dump() for r in payload.recicladoras],

        capex_total_mxn=payload.resumen.capex_total_mxn,
        opex_mes_mxn=payload.resumen.opex_mes_mxn,
        ebitda_mes_mxn=payload.resumen.ebitda_mes_mxn,
        empleos_directos=payload.resumen.empleos_directos,
        co2e_anual_ton=payload.resumen.co2e_anual_ton,
        tir_estimada_pct=payload.resumen.tir_estimada_pct,
        payback_meses=payload.resumen.payback_meses,

        score_viabilidad=payload.score_viabilidad,
        clasificacion_viabilidad=payload.clasificacion_viabilidad,

        version=next_version,
        generado_por=payload.generado_por,
        notas=payload.notas,
        resultado_completo_json=payload.resultado_completo_json,
    )

    db.add(cotizacion)
    await db.commit()
    await db.refresh(cotizacion)

    logger.info(
        f"Cotizacion creada: {cotizacion.municipio_nombre} "
        f"Fase{cotizacion.fase_recomendada} v{cotizacion.version} "
        f"score={cotizacion.score_viabilidad}"
    )
    return _model_to_response(cotizacion)


@router.get(
    "/{municipio_id}",
    response_model=CotizacionResponse,
    summary="Última cotización del municipio",
)
async def get_ultima_cotizacion(
    municipio_id: str,
    db: AsyncSession = Depends(get_db),
    _user: UserInfo = Depends(get_current_user),
) -> CotizacionResponse:
    result = await db.execute(
        select(CotizacionMunicipal)
        .where(CotizacionMunicipal.municipio_id == municipio_id)
        .order_by(CotizacionMunicipal.version.desc())
        .limit(1)
    )
    cotizacion = result.scalar_one_or_none()
    if not cotizacion:
        raise HTTPException(
            status_code=404,
            detail=f"No existe cotización para el municipio '{municipio_id}'",
        )
    return _model_to_response(cotizacion)


@router.get(
    "/{municipio_id}/history",
    response_model=CotizacionHistorialResponse,
    summary="Historial de versiones de cotización",
    description="Devuelve todas las versiones de cotización para el municipio, ordenadas por versión descendente.",
)
async def get_historial_cotizaciones(
    municipio_id: str,
    db: AsyncSession = Depends(get_db),
    _user: UserInfo = Depends(get_current_user),
) -> CotizacionHistorialResponse:
    result = await db.execute(
        select(CotizacionMunicipal)
        .where(CotizacionMunicipal.municipio_id == municipio_id)
        .order_by(CotizacionMunicipal.version.desc())
    )
    versiones = list(result.scalars().all())
    return CotizacionHistorialResponse(
        municipio_id=municipio_id,
        total_versiones=len(versiones),
        versiones=[_model_to_response(v) for v in versiones],
    )


@router.put(
    "/{cotizacion_id}/notas",
    response_model=CotizacionResponse,
    summary="Añadir/actualizar notas de campo",
    description="Permite a agentes y consultores agregar notas contextuales a una cotización existente.",
)
async def actualizar_notas(
    cotizacion_id: str,
    payload: NotasUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _user: UserInfo = Depends(get_current_user),
) -> CotizacionResponse:
    cotizacion = await db.get(CotizacionMunicipal, cotizacion_id)
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    cotizacion.notas = payload.notas
    cotizacion.generado_por = "consultor"
    await db.commit()
    await db.refresh(cotizacion)
    return _model_to_response(cotizacion)
