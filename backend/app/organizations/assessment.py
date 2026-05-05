"""Motor Fase 13.3: evaluación de circularidad organizacional."""
from __future__ import annotations

from app.organizations.schemas import (
    Action30_60_90,
    CalculoGeneracionOrg,
    ContainerPlacementPlan,
    OrganizationActivityType,
    OrganizationalCircularityRequest,
    OrganizationalCircularityResponse,
    WasteStreamProfile,
)


def _calc_range(base_ton_day: float) -> tuple[float, float]:
    low = max(0.0, round(base_ton_day * 0.7, 4))
    high = round(base_ton_day * 1.3 if base_ton_day > 0 else 0.001, 4)
    return (low, high if high > low else low + 0.001)


def _calc_for_type(request: OrganizationalCircularityRequest) -> CalculoGeneracionOrg:
    empleados = max(0, request.empleados)
    variables = request.variables or {}
    tipo = request.tipo_actividad
    formula = "empleados * factor_kg_persona / 1000"
    explicacion = "Estimación benchmark sectorial ALQUIMIA para circularidad organizacional."
    base_ton_day = empleados * 1.2 / 1000.0

    if tipo == OrganizationActivityType.hotel:
        habitaciones = float(variables.get("habitaciones", 0))
        ocupacion = float(variables.get("ocupacion_pct", 0)) / 100.0
        base_ton_day = max(base_ton_day, habitaciones * ocupacion * 1.8 / 1000.0)
        formula = "habitaciones * ocupacion_pct * 1.8kg + empleados*0.6kg"
    elif tipo == OrganizationActivityType.hospital:
        camas = float(variables.get("camas", 0))
        consultas = float(variables.get("consultas_dia", 0))
        base_ton_day = max(base_ton_day, (camas * 2.5 + consultas * 0.25) / 1000.0)
        formula = "camas*2.5kg + consultas_dia*0.25kg"
    elif tipo in (OrganizationActivityType.empresa, OrganizationActivityType.industria_ligera):
        turnos = max(1.0, float(variables.get("turnos", 1)))
        base_ton_day = max(base_ton_day, empleados * turnos * 1.3 / 1000.0)
        formula = "empleados * turnos * 1.3kg"
    elif tipo == OrganizationActivityType.universidad:
        estudiantes = float(variables.get("estudiantes", 0))
        base_ton_day = max(base_ton_day, (estudiantes * 0.7 + empleados * 0.5) / 1000.0)
        formula = "estudiantes*0.7kg + empleados*0.5kg"
    elif tipo == OrganizationActivityType.estadio:
        aforo = float(variables.get("aforo", 0))
        ocupacion = float(variables.get("ocupacion_pct", 0)) / 100.0
        base_ton_day = max(base_ton_day, aforo * ocupacion * 1.4 / 1000.0)
        formula = "aforo * ocupacion_pct * 1.4kg"
    elif tipo == OrganizationActivityType.centro_comercial:
        visitantes = float(variables.get("visitantes_dia", 0))
        base_ton_day = max(base_ton_day, visitantes * 0.9 / 1000.0)
        formula = "visitantes_dia * 0.9kg"
    elif tipo == OrganizationActivityType.club_deportivo:
        socios = float(variables.get("socios", 0))
        base_ton_day = max(base_ton_day, socios * 0.8 / 1000.0)
        formula = "socios * 0.8kg + empleados*0.4kg"
    elif tipo == OrganizationActivityType.zona_turistica:
        visitantes = float(variables.get("visitantes_dia", 0))
        base_ton_day = max(base_ton_day, visitantes * 1.1 / 1000.0)
        formula = "visitantes_dia * 1.1kg"
    elif tipo == OrganizationActivityType.espacio_publico:
        visitantes = float(variables.get("visitantes_dia", 0))
        base_ton_day = max(base_ton_day, visitantes * 0.6 / 1000.0)
        formula = "visitantes_dia * 0.6kg"

    return CalculoGeneracionOrg(
        formula=formula,
        fuente_factor="benchmark_sectorial ALQUIMIA",
        unidad="ton/día",
        incertidumbre_rango=_calc_range(base_ton_day),
        explicacion=explicacion,
    )


def _container_plan(tipo: OrganizationActivityType) -> list[ContainerPlacementPlan]:
    base = {
        OrganizationActivityType.hotel: [
            ("cocina", "orgánicos 120L", 3, "diaria"),
            ("habitaciones", "reciclables 80L", 8, "diaria"),
            ("área de servicio", "rechazo 240L", 2, "interdiaria"),
        ],
        OrganizationActivityType.hospital: [
            ("cafetería", "orgánicos 120L", 2, "diaria"),
            ("administración", "papel 80L", 3, "diaria"),
            ("almacén", "rechazo 240L", 2, "interdiaria"),
        ],
        OrganizationActivityType.empresa: [
            ("comedor", "orgánicos 120L", 2, "diaria"),
            ("oficinas", "papel/cartón 80L", 4, "diaria"),
            ("taller", "plásticos 120L", 2, "interdiaria"),
        ],
    }
    selected = base.get(tipo, [
        ("acceso principal", "mezcla separada 120L", 2, "diaria"),
        ("zona operativa", "reciclables 80L", 2, "interdiaria"),
        ("servicios", "rechazo 120L", 1, "interdiaria"),
    ])
    return [
        ContainerPlacementPlan(
            zona_interna=z,
            tipo_contenedor=c,
            cantidad=n,
            frecuencia_recoleccion=f,
            nota="Propuesta inicial; ajustar con validación operativa interna.",
        )
        for z, c, n, f in selected
    ]


def _actions(tipo: OrganizationActivityType) -> list[Action30_60_90]:
    by_type = {
        OrganizationActivityType.hotel: (
            "Instalar separación en housekeeping y cocina",
            "Alinear proveedores de amenidades retornables",
            "Auditar captura por ala y consolidar KPIs operativos",
        ),
        OrganizationActivityType.hospital: (
            "Delimitar RSU vs no-RSU por área clínica y administrativa",
            "Formalizar protocolo interno con proveedor autorizado",
            "Validar trazabilidad mensual con comité hospitalario",
        ),
        OrganizationActivityType.empresa: (
            "Mapear puntos de generación en línea de producción",
            "Implementar contenedores diferenciados por turno",
            "Negociar salida circular para materiales recuperables",
        ),
    }
    a30, a60, a90 = by_type.get(
        tipo,
        (
            "Levantar diagnóstico operativo por zona interna",
            "Implementar separación con responsables por área",
            "Consolidar reporte de circularidad y próximos hitos",
        ),
    )
    return [
        Action30_60_90(
            plazo="30_dias",
            accion=a30,
            responsable="Operación interna",
            recursos_requeridos="Capacitación + señalética + contenedores",
            impacto_esperado="Reducción de mezcla y trazabilidad inicial",
        ),
        Action30_60_90(
            plazo="60_dias",
            accion=a60,
            responsable="Sustentabilidad / Mantenimiento",
            recursos_requeridos="Ajustes logísticos y rutas internas",
            impacto_esperado="Mayor captura y pureza de materiales",
        ),
        Action30_60_90(
            plazo="90_dias",
            accion=a90,
            responsable="Dirección operativa",
            recursos_requeridos="Seguimiento de KPIs y auditoría interna",
            impacto_esperado="Plan continuo con mejoras por evidencia",
        ),
    ]


def evaluate_organizational_circularity(
    request: OrganizationalCircularityRequest,
) -> OrganizationalCircularityResponse:
    blockers: list[str] = []
    warnings: list[str] = []

    municipio_id = (request.municipio_id or "").strip().lower()
    if not municipio_id:
        blockers.append("municipio_id es obligatorio para evaluación organizacional.")

    tipo = request.tipo_actividad
    calculo = _calc_for_type(request)

    rsu_base = (calculo.incertidumbre_rango[0] + calculo.incertidumbre_rango[1]) / 2.0
    waste_streams = [
        WasteStreamProfile(
            material="organico",
            estimacion_ton_dia=round(rsu_base * 0.45, 4),
            es_rsu=True,
            requiere_proveedor_autorizado=False,
            norma_aplicable=None,
            advertencia="",
        ),
        WasteStreamProfile(
            material="reciclables_mezclados",
            estimacion_ton_dia=round(rsu_base * 0.35, 4),
            es_rsu=True,
            requiere_proveedor_autorizado=False,
            norma_aplicable=None,
            advertencia="",
        ),
    ]

    residuos_no_rsu_detectados: list[str] = []
    advertencia_no_rsu = ""
    proveedor_requerido = False

    has_regulated = bool(request.variables.get("tiene_residuos_regulados") or request.variables.get("residuos_mixtos"))
    if tipo in (
        OrganizationActivityType.hospital,
        OrganizationActivityType.industria_ligera,
        OrganizationActivityType.empresa,
    ) and has_regulated:
        proveedor_requerido = True
        residuos_no_rsu_detectados = ["residuo_regulado_no_rsu"]
        advertencia_no_rsu = (
            "Se detectan residuos no-RSU: requieren proveedor autorizado y cumplimiento normativo aplicable."
        )
        waste_streams.append(
            WasteStreamProfile(
                material="residuo_regulado_no_rsu",
                estimacion_ton_dia=round(rsu_base * 0.12, 4),
                es_rsu=False,
                requiere_proveedor_autorizado=True,
                norma_aplicable="NOM-087",
                advertencia="Gestionar con proveedor autorizado; no tratar como RSU ordinario.",
            )
        )
        warnings.append(advertencia_no_rsu)

    status = "blocked" if blockers else ("warning" if warnings else "ready")
    next_action = (
        "Completar municipio y datos mínimos para desbloquear evaluación."
        if blockers
        else (
            "Coordinar proveedor autorizado y separar no-RSU del flujo RSU."
            if warnings
            else "Ejecutar acciones 30/60/90 y validar con operación municipal."
        )
    )

    return OrganizationalCircularityResponse(
        status=status,  # type: ignore[arg-type]
        organization_id=request.organization_id,
        tipo_actividad=tipo,
        municipio_id=municipio_id,
        waste_streams=waste_streams,
        container_plan=_container_plan(tipo),
        acciones_30_60_90=_actions(tipo),
        residuos_no_rsu_detectados=residuos_no_rsu_detectados,
        advertencia_residuos_no_rsu=advertencia_no_rsu,
        proveedor_ambiental_requerido=proveedor_requerido,
        calculo_generacion=calculo,
        blockers=blockers,
        warnings=warnings,
        next_action=next_action,
    )
