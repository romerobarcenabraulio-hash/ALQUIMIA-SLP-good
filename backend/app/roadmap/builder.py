"""Motor Fase 13.5: construcción de hoja de ruta ejecutiva municipal."""
from __future__ import annotations

from app.roadmap.schemas import (
    AccionEjecutiva,
    AccionHorizonte,
    NivelPrioridad,
    RoadmapMunicipalRequest,
    RoadmapMunicipalResponse,
)


def _action(
    horizonte: AccionHorizonte,
    titulo: str,
    descripcion: str,
    responsable: str,
    kpi: str,
    fuente: str,
    prioridad: NivelPrioridad,
    costo: float | None = None,
) -> AccionEjecutiva:
    return AccionEjecutiva(
        horizonte=horizonte,
        titulo=titulo,
        descripcion=descripcion,
        responsable_sugerido=responsable,
        kpi_exito=kpi,
        fuente_diagnostico=fuente,
        prioridad=prioridad,
        costo_estimado_mxn=costo,
    )


def build_roadmap(req: RoadmapMunicipalRequest) -> RoadmapMunicipalResponse:
    blockers: list[str] = []
    advertencias: list[str] = []

    municipio = (req.municipio_id or "").strip().lower()
    if not municipio:
        blockers.append("municipio_id es obligatorio para generar hoja de ruta.")
    if req.generacion_ton_dia <= 0:
        blockers.append("generacion_ton_dia debe ser mayor que cero.")

    if blockers:
        return RoadmapMunicipalResponse(
            status="blocked",
            blockers=blockers,
            acciones=[],
            resumen_ejecutivo=(
                "La hoja de ruta no puede construirse sin municipio y base de generación válidos."
            ),
            kpi_meta_90_dias={},
            advertencias=advertencias,
        )

    acciones: list[AccionEjecutiva] = []

    # 30 días (mínimo 2)
    if req.brecha_infraestructura_ton_dia > 0:
        acciones.append(
            _action(
                AccionHorizonte.dias_30,
                "Activar centro de acopio emergente",
                "Implementar capacidad táctica temporal para reducir la brecha operativa inmediata.",
                "Dirección de Servicios Públicos",
                "Reducir ≥20% brecha de infraestructura en 30 días",
                "Infraestructura 13.1: brecha positiva detectada",
                NivelPrioridad.critica,
                450000.0,
            )
        )
    if "organico" in [c.lower() for c in req.corrientes_criticas]:
        acciones.append(
            _action(
                AccionHorizonte.dias_30,
                "Separación en origen de orgánicos",
                "Despliegue operativo en mercados y zonas de alta generación orgánica.",
                "Coordinación de Limpia Municipal",
                "Capturar +10% orgánicos valorizables",
                "Flujos 13.4: corriente orgánica crítica",
                NivelPrioridad.alta,
            )
        )
    if req.tiene_residuos_regulados:
        acciones.append(
            _action(
                AccionHorizonte.dias_30,
                "Contratar proveedor autorizado SEMARNAT para residuos regulados",
                "Formalizar gestión de corrientes no-RSU fuera del flujo ordinario municipal.",
                "Dirección de Gestión Ambiental",
                "100% de corrientes reguladas con trazabilidad",
                "Portal empresarial 13.3: residuos no-RSU detectados",
                NivelPrioridad.critica,
            )
        )
    if len([a for a in acciones if a.horizonte == AccionHorizonte.dias_30]) < 2:
        acciones.append(
            _action(
                AccionHorizonte.dias_30,
                "Instalar mesa ejecutiva de cierre de ciclo",
                "Alinear responsables de operación, infraestructura y monitoreo en tablero único.",
                "Secretaría Técnica Municipal",
                "Tablero de seguimiento activo",
                "Diagnóstico integral municipal",
                NivelPrioridad.media,
            )
        )

    # 60 días (mínimo 2)
    if req.tasa_circularidad_actual_pct < 10:
        acciones.append(
            _action(
                AccionHorizonte.dias_60,
                "Establecer convenio con recicladoras formales",
                "Asegurar salida de materiales recuperables con trazabilidad comercial.",
                "Dirección de Desarrollo Económico",
                "Incrementar recuperación formal ≥5 puntos",
                "Flujos 13.4: baja tasa de circularidad actual",
                NivelPrioridad.alta,
            )
        )
    if req.tiene_macrogeneradores:
        acciones.append(
            _action(
                AccionHorizonte.dias_60,
                "Auditar macrogeneradores e inscribir en padrón municipal",
                "Levantar variables críticas y compromisos de separación por tipo de actividad.",
                "Dirección de Inspección y Vigilancia",
                "80% de macrogeneradores prioritarios auditados",
                "Macrogeneradores 13.2: presencia activa en municipio",
                NivelPrioridad.media,
            )
        )
    if len([a for a in acciones if a.horizonte == AccionHorizonte.dias_60]) < 2:
        acciones.append(
            _action(
                AccionHorizonte.dias_60,
                "Optimizar rutas con enfoque de recuperación",
                "Ajustar frecuencias para capturar corrientes críticas y reducir rechazo.",
                "Coordinación Operativa de Recolección",
                "Reducir 10% de disposición irregular",
                "Operación 12.3 + Flujos 13.4",
                NivelPrioridad.media,
            )
        )

    # 90 días (mínimo 2 y reglas fijas)
    if req.estado_legal == "gate_activo":
        acciones.append(
            _action(
                AccionHorizonte.dias_90,
                "Documentar expedientes de inspección para cumplimiento NOM",
                "Consolidar evidencia operativa para cumplimiento normativo y trazabilidad.",
                "Dirección Jurídica y Normativa",
                "100% expedientes con evidencia completa",
                "Gate legal 12.4: estado gate_activo",
                NivelPrioridad.media,
            )
        )

    acciones.append(
        _action(
            AccionHorizonte.dias_90,
            "Publicar reporte de circularidad municipal para transparencia",
            "Emitir reporte ejecutivo con KPIs, brechas y acciones de mejora continua.",
            "Coordinación de Planeación Municipal",
            "Reporte trimestral publicado y validado",
            "Consolidado fases 13.1–13.4",
            NivelPrioridad.media,
        )
    )
    if len([a for a in acciones if a.horizonte == AccionHorizonte.dias_90]) < 2:
        acciones.append(
            _action(
                AccionHorizonte.dias_90,
                "Consolidar gobernanza municipal de economía circular",
                "Formalizar comité técnico con sesiones mensuales y metas públicas.",
                "Presidencia Municipal",
                "Comité activo con plan semestral",
                "Diagnóstico integral municipal",
                NivelPrioridad.media,
            )
        )

    if req.tasa_circularidad_actual_pct == 0 and not req.corrientes_criticas:
        advertencias.append(
            "Diagnóstico incompleto: se recomiendan fases 13.1–13.4 antes de ejecutar el roadmap"
        )

    # asegurar mínimo 6 acciones
    if len(acciones) < 6:
        acciones.append(
            _action(
                AccionHorizonte.dias_60,
                "Fortalecer monitoreo de KPIs por corriente",
                "Unificar medición para decisiones quincenales basadas en evidencia.",
                "Unidad de Datos y Monitoreo",
                "KPIs semanales activos por corriente",
                "Brechas de trazabilidad detectadas",
                NivelPrioridad.media,
            )
        )

    resumen = (
        f"El municipio {municipio} presenta una tasa actual de circularidad de "
        f"{req.tasa_circularidad_actual_pct:.1f}% con generación de {req.generacion_ton_dia:.1f} ton/día. "
        "La hoja de ruta 30/60/90 prioriza brechas operativas, captura de corrientes críticas y trazabilidad regulatoria. "
        "La meta a 90 días es consolidar gobernanza técnica con mejoras observables en recuperación y transparencia."
    )

    kpi_meta = {
        "tasa_circularidad": "≥15%",
        "brecha_cubierta": "≥30%",
        "trazabilidad_operativa": "100% acciones críticas con evidencia",
    }

    return RoadmapMunicipalResponse(
        status="warning" if advertencias else "ready",
        blockers=[],
        acciones=acciones,
        resumen_ejecutivo=resumen,
        kpi_meta_90_dias=kpi_meta,
        advertencias=advertencias,
    )
