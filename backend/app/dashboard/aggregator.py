"""Motor Fase 13.7: agregación de dashboard municipal."""
from __future__ import annotations

from app.dashboard.schemas import (
    DashboardRequest,
    DashboardResponse,
    KPIIndicador,
    ResumenEjecutivoDashboard,
    TendenciaSentido,
)


def _score(req: DashboardRequest) -> float:
    score = 20.0
    if req.tasa_circularidad_actual_pct >= 10:
        score += 30
    if req.brecha_infraestructura_ton_dia == 0:
        score += 20
    if req.estado_legal == "gate_activo":
        score += 20
    if req.num_centros_acopio > 0:
        score += 10
    return min(100.0, max(0.0, score))


def _tendencia_tasa(tasa: float) -> TendenciaSentido:
    if tasa >= 15:
        return TendenciaSentido.mejora
    if tasa >= 5:
        return TendenciaSentido.estable
    return TendenciaSentido.deterioro


def _blocked_response(blockers: list[str]) -> DashboardResponse:
    resumen = ResumenEjecutivoDashboard(
        municipio_id="",
        total_residuos_ton_dia=0.0,
        tasa_circularidad_pct=0.0,
        brecha_infraestructura_ton_dia=0.0,
        num_macrogeneradores=0,
        num_centros_acopio=0,
        estado_legal="sin_gate",
        score_circularidad=0.0,
    )
    return DashboardResponse(
        status="blocked",
        blockers=blockers,
        resumen=resumen,
        kpis=[],
        advertencias=[],
    )


def build_dashboard(req: DashboardRequest) -> DashboardResponse:
    blockers: list[str] = []
    advertencias: list[str] = []
    municipio = (req.municipio_id or "").strip()
    if not municipio:
        blockers.append("municipio_id es obligatorio para generar dashboard.")
    if req.generacion_ton_dia <= 0:
        blockers.append("generacion_ton_dia debe ser mayor que cero.")
    if blockers:
        return _blocked_response(blockers)

    score = _score(req)
    tendencia_tasa = _tendencia_tasa(req.tasa_circularidad_actual_pct)
    brecha_alerta = (
        "Brecha crítica: requiere centros de acopio urgentes"
        if req.brecha_infraestructura_ton_dia > 5
        else None
    )
    if req.tasa_circularidad_actual_pct == 0:
        advertencias.append("Sin recuperación activa: diagnóstico de flujos recomendado (Fase 13.4)")

    kpis = [
        KPIIndicador(
            clave="tasa_circularidad",
            titulo="Tasa de circularidad",
            valor_actual=req.tasa_circularidad_actual_pct,
            unidad="%",
            meta_90_dias=15.0,
            tendencia=tendencia_tasa,
            fuente="Dashboard municipal ALQUIMIA",
            formula="tasa_circularidad_actual_pct",
        ),
        KPIIndicador(
            clave="brecha_infraestructura",
            titulo="Brecha de infraestructura",
            valor_actual=req.brecha_infraestructura_ton_dia,
            unidad="t/día",
            meta_90_dias=0.0,
            tendencia=TendenciaSentido.deterioro if req.brecha_infraestructura_ton_dia > 0 else TendenciaSentido.mejora,
            fuente="Infraestructura 13.1",
            formula="brecha_infraestructura_ton_dia",
            alerta=brecha_alerta,
        ),
        KPIIndicador(
            clave="cobertura_macrogeneradores",
            titulo="Cobertura de macrogeneradores",
            valor_actual=float(req.num_macrogeneradores),
            unidad="unidades",
            meta_90_dias=10.0,
            tendencia=TendenciaSentido.mejora if req.num_macrogeneradores >= 5 else TendenciaSentido.estable,
            fuente="Macrogeneradores 13.2",
            formula="num_macrogeneradores",
        ),
        KPIIndicador(
            clave="score_circularidad",
            titulo="Score de circularidad",
            valor_actual=score,
            unidad="pts/100",
            meta_90_dias=80.0,
            tendencia=TendenciaSentido.mejora if score >= 70 else TendenciaSentido.estable,
            fuente="Dashboard 13.7",
            formula="base(20) + circularidad(30) + infraestructura(20) + legal(20) + centros(10)",
        ),
        KPIIndicador(
            clave="eficiencia_legal",
            titulo="Eficiencia legal",
            valor_actual=1.0 if req.estado_legal == "gate_activo" else 0.0,
            unidad="estado",
            meta_90_dias=1.0,
            tendencia=TendenciaSentido.mejora if req.estado_legal == "gate_activo" else TendenciaSentido.estable,
            fuente="Alcance legal 12.4",
            formula="1 si alcance municipal esta revisado, en otro caso 0",
        ),
    ]

    resumen = ResumenEjecutivoDashboard(
        municipio_id=municipio,
        total_residuos_ton_dia=req.generacion_ton_dia,
        tasa_circularidad_pct=req.tasa_circularidad_actual_pct,
        brecha_infraestructura_ton_dia=req.brecha_infraestructura_ton_dia,
        num_macrogeneradores=req.num_macrogeneradores,
        num_centros_acopio=req.num_centros_acopio,
        estado_legal=req.estado_legal,
        score_circularidad=score,
    )

    return DashboardResponse(
        status="warning" if advertencias else "ready",
        blockers=[],
        resumen=resumen,
        kpis=kpis,
        advertencias=advertencias,
    )
