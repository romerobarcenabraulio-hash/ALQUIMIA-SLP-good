"""Motor Fase 13.9: generación de alertas municipales."""
from __future__ import annotations

from app.alerts.schemas import (
    Alerta,
    AlertaNivel,
    AlertaTipo,
    AlertasRequest,
    AlertasResponse,
)


def _alerta(
    tipo: AlertaTipo,
    nivel: AlertaNivel,
    titulo: str,
    mensaje: str,
    accion_sugerida: str,
    modulo_origen: str,
) -> Alerta:
    return Alerta(
        tipo=tipo,
        nivel=nivel,
        titulo=titulo,
        mensaje=mensaje,
        accion_sugerida=accion_sugerida,
        modulo_origen=modulo_origen,
    )


def _blocked(municipio_id: str, blockers: list[str]) -> AlertasResponse:
    return AlertasResponse(
        status="blocked",
        blockers=blockers,
        municipio_id=municipio_id,
        alertas=[],
        total_criticas=0,
        total_alertas=0,
        resumen="No fue posible evaluar alertas por bloqueos en los datos de entrada.",
    )


def generate_alerts(req: AlertasRequest) -> AlertasResponse:
    municipio_id = (req.municipio_id or "").strip()
    if not municipio_id:
        return _blocked(municipio_id, ["municipio_id es obligatorio para evaluar alertas."])

    alertas: list[Alerta] = []

    if req.brecha_infraestructura_ton_dia > 5:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.brecha_infraestructura,
                nivel=AlertaNivel.critica,
                titulo="Brecha crítica de infraestructura",
                mensaje="La brecha de infraestructura supera 5 t/día y compromete la capacidad de recuperación municipal.",
                accion_sugerida="Activar instalación urgente de centros de acopio en zonas de mayor generación.",
                modulo_origen="13.1 Infraestructura",
            )
        )
    elif req.brecha_infraestructura_ton_dia > 0:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.brecha_infraestructura,
                nivel=AlertaNivel.alta,
                titulo="Brecha operativa de infraestructura",
                mensaje="Existe brecha de infraestructura pendiente que limita captación de materiales valorizables.",
                accion_sugerida="Programar expansión de capacidad en fase 30/60/90 con metas por zona.",
                modulo_origen="13.1 Infraestructura",
            )
        )

    if req.tasa_circularidad_pct < 5:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.tasa_circularidad_baja,
                nivel=AlertaNivel.critica,
                titulo="Circularidad en nivel crítico",
                mensaje="La tasa de circularidad se mantiene por debajo de 5%, indicando baja recuperación efectiva.",
                accion_sugerida="Priorizar rutas de recuperación orgánica y separación en origen durante los próximos 30 días.",
                modulo_origen="13.4 Flujos",
            )
        )
    elif req.tasa_circularidad_pct < 15:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.tasa_circularidad_baja,
                nivel=AlertaNivel.alta,
                titulo="Circularidad por debajo del objetivo",
                mensaje="La tasa de circularidad está entre 5% y 15%, aún por debajo del umbral de mejora sostenida.",
                accion_sugerida="Refinar plan de captura selectiva por corriente prioritaria para elevar la tasa sobre 15%.",
                modulo_origen="13.4 Flujos",
            )
        )

    if req.tiene_residuos_regulados:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.residuos_regulados,
                nivel=AlertaNivel.critica,
                titulo="Residuos regulados detectados",
                mensaje="Se identificaron corrientes fuera de RSU municipal que requieren manejo con proveedor autorizado.",
                accion_sugerida="Derivar de inmediato a gestor ambiental autorizado y excluir del circuito RSU.",
                modulo_origen="13.3 Portal Empresarial",
            )
        )

    if req.estado_legal == "sancion_propuesta":
        alertas.append(
            _alerta(
                tipo=AlertaTipo.legal_gate_pendiente,
                nivel=AlertaNivel.alta,
                titulo="Alcance legal pendiente de revisión",
                mensaje="El municipio tiene sanción propuesta activa sin cierre de debido proceso.",
                accion_sugerida="Completar revisión jurídica y evidencia documental antes de acciones definitivas.",
                modulo_origen="12.4 Alcance legal",
            )
        )

    if req.num_macrogeneradores_sin_padron > 0:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.macrogenerador_sin_padron,
                nivel=AlertaNivel.media,
                titulo="Macrogeneradores sin padrón",
                mensaje=f"Se detectaron {req.num_macrogeneradores_sin_padron} macrogeneradores sin alta formal en padrón.",
                accion_sugerida="Actualizar padrón municipal y asignar seguimiento operativo por establecimiento.",
                modulo_origen="13.2 Macrogeneradores",
            )
        )

    if req.score_circularidad < 40:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.score_bajo,
                nivel=AlertaNivel.alta,
                titulo="Score de circularidad bajo",
                mensaje="El score integral está por debajo de 40/100 y refleja riesgo de ejecución insuficiente.",
                accion_sugerida="Alinear acciones 30/60/90 a los indicadores de mayor impacto en score.",
                modulo_origen="13.7 Dashboard",
            )
        )

    if req.tasa_circularidad_pct == 0:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.sin_recuperacion,
                nivel=AlertaNivel.critica,
                titulo="Sin recuperación activa",
                mensaje="No hay recuperación activa de materiales y la circularidad está completamente detenida.",
                accion_sugerida="Ejecutar diagnóstico de flujos y activar pilotos de recuperación inmediata por corriente.",
                modulo_origen="13.4 Flujos",
            )
        )

    if not alertas:
        alertas.append(
            _alerta(
                tipo=AlertaTipo.score_bajo,
                nivel=AlertaNivel.info,
                titulo="Sin alertas activas",
                mensaje="Municipio sin alertas activas. Monitorear indicadores mensualmente.",
                accion_sugerida="Mantener seguimiento mensual de tasa, brecha, score y alcance legal.",
                modulo_origen="13.7 Dashboard",
            )
        )

    total_criticas = sum(1 for alerta in alertas if alerta.nivel == AlertaNivel.critica)
    total_alertas = len(alertas)
    urgente = next((a.accion_sugerida for a in alertas if a.nivel == AlertaNivel.critica), "")
    resumen = f"{total_alertas} alertas activas ({total_criticas} críticas)."
    if urgente:
        resumen = f"{resumen} {urgente}"

    return AlertasResponse(
        status="ready",
        blockers=[],
        municipio_id=municipio_id,
        alertas=alertas,
        total_criticas=total_criticas,
        total_alertas=total_alertas,
        resumen=resumen,
    )
