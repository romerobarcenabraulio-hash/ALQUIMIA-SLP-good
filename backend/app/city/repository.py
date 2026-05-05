from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Optional

from app.city.schemas import CircularityBaseline, CityContext, CityOption, DecisionModule, MunicipioContext, PortalEntry, UserAudienceMode
from app.data.schemas import DataProvenance, FuenteTipo, SnapshotDatos
from app.legal.repository import MUNICIPIO_NOMBRES, ZM_MUNICIPIOS
from app.national.catalog import get_zm


_ESTADOS: Dict[str, str] = {
    "SLP": "San Luis Potosi",
    "QRO": "Queretaro",
    "NL": "Nuevo Leon",
}

_BASELINE_ESTIMATES: Dict[str, Dict[str, float]] = {
    "SLP": {"pct": 4.0, "uncertainty": 3.0, "confidence": 0.46},
    "QRO": {"pct": 5.5, "uncertainty": 3.5, "confidence": 0.48},
    "MTY": {"pct": 7.0, "uncertainty": 4.0, "confidence": 0.50},
}

_FALLBACK_RSU_TON_DAY = {
    "SLP": 1119.6,
    "QRO": 1334.1,
    "MTY": 5608.2,
}


def _municipios_for(zm_id: str) -> list[MunicipioContext]:
    zm_key = zm_id.upper()
    return [
        MunicipioContext(
            municipio_id=municipio_id,
            nombre=MUNICIPIO_NOMBRES.get(municipio_id, municipio_id.upper()),
            estado=_ESTADOS.get(get_zm(zm_key).estado_principal, get_zm(zm_key).estado_principal) if get_zm(zm_key) else "",
        )
        for municipio_id in ZM_MUNICIPIOS.get(zm_key, [])
    ]


def list_city_options() -> list[CityOption]:
    options: list[CityOption] = []
    for zm_id in sorted(ZM_MUNICIPIOS.keys()):
        zm = get_zm(zm_id)
        if not zm:
            continue
        options.append(CityOption(
            city_id=zm.zm_id,
            nombre=zm.nombre,
            estado_principal=zm.estado_principal,
            municipios=_municipios_for(zm.zm_id),
        ))
    return options


def get_city_context(city_id: str) -> Optional[CityContext]:
    zm = get_zm(city_id)
    if not zm:
        return None
    return CityContext(
        city_id=zm.zm_id,
        nombre=zm.nombre,
        estado_principal=zm.estado_principal,
        municipios=_municipios_for(zm.zm_id),
        legal_notice=(
            "La ciudad/ZM organiza el plan territorial; cualquier obligación, sanción o documento legal "
            "se evalúa por municipio y nunca por ZM."
        ),
        audience_mode=UserAudienceMode.city_team,
        supported_entries=[PortalEntry.city_plan, PortalEntry.organization],
    )


def journey_for(entry: PortalEntry) -> list[DecisionModule]:
    if entry == PortalEntry.organization:
        return [
            DecisionModule(
                module_id="organization_profile",
                label="Perfil de organización",
                audience_mode=UserAudienceMode.organization,
                decision="Separar RSU ordinario de residuos regulados",
                evidence="CityContext + declaración de actividad de la organización",
                next_action="Registrar tipo de organización y flujos RSU ordinarios",
            ),
            DecisionModule(
                module_id="containers_provider",
                label="Contenedores y proveedor",
                audience_mode=UserAudienceMode.organization,
                decision="Definir manejo, ruta y alternativa de valorización",
                evidence="Baseline ciudad + fuente declarada por organización",
                status="blocked",
                blocker="Pendiente declarar tipo de organización y confirmar si existen residuos especiales, peligrosos o regulados.",
                next_action="Identificar proveedor autorizado si hay residuos regulados",
            ),
            DecisionModule(
                module_id="market_traceability",
                label="Mercado y trazabilidad",
                audience_mode=UserAudienceMode.organization,
                decision="Precolocar materiales valorizables sin inflar captura RSU municipal",
                evidence="DataProvenance, compradores estimados y warnings de mercado",
                next_action="Revisar compradores, riesgos y grafo causal",
            ),
            DecisionModule(
                module_id="organization_report",
                label="Reporte organizacional",
                audience_mode=UserAudienceMode.organization,
                decision="Preparar salida no oficial con fuentes y bloqueos",
                evidence="Baseline ciudad, warnings y módulos organizacionales completados",
                next_action="Generar paquete expositivo cuando no existan bloqueos críticos",
            ),
        ]
    return [
        DecisionModule(
            module_id="city_baseline",
            label="Baseline RSU",
            audience_mode=UserAudienceMode.city_team,
            decision="Entender circularidad actual antes de metas",
            evidence="CircularityBaseline con fuente, confianza e incertidumbre",
            next_action="Elegir municipios activos para el programa",
        ),
        DecisionModule(
            module_id="municipal_context",
            label="Municipios",
            audience_mode=UserAudienceMode.city_team,
            decision="Elegir municipios activos sin mezclar marco legal",
            evidence="CityContext: ciudad/ZM territorial y legal_scope=municipio",
            next_action="Revisar marco municipal antes de sanciones o documentos legales",
        ),
        DecisionModule(
            module_id="citizen_inputs",
            label="Entradas ciudadanas RSU",
            audience_mode=UserAudienceMode.citizen,
            decision="Definir vivienda y composición RSU municipal ordinaria",
            evidence="Composición RSU y tipos de vivienda del simulador",
            next_action="Confirmar entradas domésticas antes de elegir metas",
        ),
        DecisionModule(
            module_id="future_goals",
            label="Metas futuras",
            audience_mode=UserAudienceMode.city_team,
            decision="Diseñar horizonte y fases",
            evidence="Baseline actual ya visible y marcada como estimada",
            next_action="Abrir metas de captura y horizonte",
        ),
        DecisionModule(
            module_id="infrastructure_operations",
            label="Infraestructura y operación",
            audience_mode=UserAudienceMode.city_team,
            decision="Dimensionar centros, logística y operación de campo",
            evidence="Captura proyectada, municipios activos y configuración operativa",
            next_action="Revisar capacidad instalada contra flujo capturable",
        ),
        DecisionModule(
            module_id="impact_finance",
            label="Impacto y finanzas",
            audience_mode=UserAudienceMode.city_team,
            decision="Evaluar costos, beneficios, empleos e impacto ambiental",
            evidence="Resultados calculados del simulador y parámetros financieros",
            next_action="Comparar sensibilidad antes de documentar",
        ),
        DecisionModule(
            module_id="market_traceability",
            label="Mercado y causalidad",
            audience_mode=UserAudienceMode.city_team,
            decision="Validar mercado, trazabilidad y compradores estimados",
            evidence="Marketplace, macrogeneradores, recicladoras y grafo causal",
            next_action="Resolver warnings de mercado antes de exportar",
        ),
        DecisionModule(
            module_id="scenarios_export",
            label="Escenarios y salida",
            audience_mode=UserAudienceMode.city_team,
            decision="Comparar escenarios y preparar documentos expositivos",
            evidence="Escenarios guardados, DataProvenance y warnings activos",
            next_action="Generar paquete solo como propuesta expositiva trazable",
        ),
    ]


def _kpi_number(snapshot: SnapshotDatos, kpi_id: str, fallback: float) -> float:
    kpi = next((item for item in snapshot.kpis if item.kpi_id == kpi_id), None)
    if not kpi or kpi.valor is None or kpi.provenance.tipo == FuenteTipo.no_disponible:
        return fallback
    try:
        return float(kpi.valor)
    except (TypeError, ValueError):
        return fallback


def baseline_for(city_id: str, snapshot: SnapshotDatos) -> Optional[CircularityBaseline]:
    context = get_city_context(city_id)
    if not context:
        return None

    city_key = context.city_id.upper()
    estimate = _BASELINE_ESTIMATES.get(city_key, {"pct": 4.5, "uncertainty": 5.0, "confidence": 0.40})
    pop = _kpi_number(snapshot, "poblacion_total", 0)
    gen = _kpi_number(snapshot, "gen_percapita_kg_dia", 0)
    rsu_total = (pop * gen / 1000) if pop > 0 and gen > 0 else _FALLBACK_RSU_TON_DAY.get(city_key, 0)
    current_pct = estimate["pct"]
    recovered = rsu_total * (current_pct / 100)

    return CircularityBaseline(
        city_id=context.city_id,
        city_name=context.nombre,
        current_circularity_pct=current_pct,
        material_recovery_ton_day_est=round(recovered, 2),
        rsu_total_ton_day_est=round(rsu_total, 2),
        confidence=estimate["confidence"],
        uncertainty_pct_points=estimate["uncertainty"],
        provenance=DataProvenance(
            tipo=FuenteTipo.estimado,
            fuente_nombre="Modelo ALQUIMIA 10.1 de baseline RSU actual",
            fuente_organismo="ALQUIMIA",
            fuente_url=None,
            fecha_dato="2026-04-30",
            fecha_consulta=datetime.now(timezone.utc).isoformat(),
            confianza=estimate["confidence"],
            advertencia=(
                "Baseline estimada para orientar la simulación inicial. No es dato oficial, dictamen ni documento aprobado; "
                "debe validarse con medición municipal, operador o fuente competente antes de usarse como cifra oficial."
            ),
            requiere_clave_api=False,
        ),
        warnings=[
            "Baseline RSU municipal estimada, no oficial.",
            "No incluye residuos peligrosos, especiales ni regulados de manejo separado.",
            "El marco legal y cualquier obligación se evalúan por municipio, no por ZM.",
        ],
        interpretation=(
            "Esta línea base representa circularidad actual estimada de RSU municipal antes de definir metas futuras."
        ),
    )
