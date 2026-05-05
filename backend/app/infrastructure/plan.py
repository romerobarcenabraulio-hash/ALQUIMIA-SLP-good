"""Motor Fase 13.1: plan de infraestructura y centros de acopio."""
from __future__ import annotations

from typing import Dict

from app.infrastructure.schemas import (
    CalculoBrechaPlan,
    CollectionCenterSite,
    CollectionCenterType,
    InfrastructurePlanRequest,
    InfrastructurePlanResponse,
)

_MATERIAL_DISTRIBUTION: Dict[str, float] = {
    "organico": 0.45,
    "papel": 0.20,
    "plastico": 0.15,
    "vidrio": 0.05,
    "metales": 0.05,
    "otros": 0.10,
}

_CENTER_TYPES: Dict[str, CollectionCenterType] = {
    "P": CollectionCenterType(
        id="P",
        nombre="Centro pequeño",
        capacidad_ton_dia=5.0,
        superficie_m2=250,
        capex_mxn=726_476,
        opex_mensual_mxn=110_838,
        empleos_directos=5,
        materiales_aceptados=["organico", "papel", "plastico", "vidrio", "metales"],
        fuente="CA_CONFIG ALQUIMIA estimada",
        confianza="media",
        warnings=[],
    ),
    "M": CollectionCenterType(
        id="M",
        nombre="Centro mediano",
        capacidad_ton_dia=15.0,
        superficie_m2=750,
        capex_mxn=2_528_808,
        opex_mensual_mxn=320_354,
        empleos_directos=14,
        materiales_aceptados=["organico", "papel", "plastico", "vidrio", "metales"],
        fuente="CA_CONFIG ALQUIMIA estimada",
        confianza="media",
        warnings=[],
    ),
    "G": CollectionCenterType(
        id="G",
        nombre="Centro grande",
        capacidad_ton_dia=50.0,
        superficie_m2=2_000,
        capex_mxn=7_131_655,
        opex_mensual_mxn=787_328,
        empleos_directos=34,
        materiales_aceptados=["organico", "papel", "plastico", "vidrio", "metales"],
        fuente="CA_CONFIG ALQUIMIA estimada",
        confianza="media",
        warnings=[],
    ),
}


def _capacidad_por_material(capacidad_total: float) -> dict[str, float]:
    return {
        material: round(capacidad_total * pct, 4)
        for material, pct in _MATERIAL_DISTRIBUTION.items()
    }


def build_infrastructure_plan(request: InfrastructurePlanRequest) -> InfrastructurePlanResponse:
    blockers: list[str] = []
    warnings: list[str] = []

    municipio_id = (request.municipio_id or "").strip().lower()
    if not municipio_id:
        blockers.append("Falta municipio_id para planear centros de acopio.")
    if not request.mix_centros:
        blockers.append("Mix de centros vacío: no hay centros propuestos.")
    if not request.zona_ids:
        blockers.append("Faltan zonas para ubicar centros de acopio.")

    centros: list[CollectionCenterSite] = []
    capacidad_instalada = 0.0

    if not blockers:
        zona_cycle = list(request.zona_ids)
        if not zona_cycle:
            zona_cycle = ["zona_por_definir"]
        for tipo_id, cantidad in request.mix_centros.items():
            if tipo_id not in _CENTER_TYPES:
                blockers.append(f"Tipo de centro no soportado: {tipo_id}")
                continue
            tipo = _CENTER_TYPES[tipo_id]
            for idx in range(cantidad):
                zona_id = zona_cycle[idx % len(zona_cycle)]
                centro = CollectionCenterSite(
                    id=f"{tipo_id.lower()}-{idx + 1}",
                    municipio_id=municipio_id,
                    zona_id=zona_id,
                    tipo_id=tipo.id,
                    fase_inicio=1,
                    mes_inicio=1,
                    capacidad_ton_dia=tipo.capacidad_ton_dia,
                    materiales_aceptados=list(tipo.materiales_aceptados),
                    recicladoras_destino=["recicladora_propuesta"],
                    restricciones_suelo=[],
                    estado="propuesto",
                    lat=None,
                    lng=None,
                )
                centros.append(centro)
                capacidad_instalada += tipo.capacidad_ton_dia

    brecha = request.rsu_capturable_ton_dia - capacidad_instalada

    if capacidad_instalada > request.rsu_capturable_ton_dia and not blockers:
        warnings.append("Capacidad instalada excede flujo capturable: sobredimensionado.")
    if brecha > 0 and not blockers:
        warnings.append(
            "Brecha de capacidad: escalar mix de centros o revisar flujo capturable estimado."
        )

    status = "blocked" if blockers else ("warning" if warnings else "ready")
    next_action = (
        "Atender bloqueos de territorio o mix antes de planear centros."
        if blockers
        else (
            "Revisar sobredimensionamiento y ajustar mix o fuentes de flujo capturable."
            if warnings
            else "Continuar con factibilidad y validación de suelo por zona."
        )
    )

    calculo_brecha = CalculoBrechaPlan(
        formula="capturable - capacidad_instalada",
        fuente_capturable="Plan territorial / RSU capturable estimado",
        fuente_capacidad="CA_CONFIG ALQUIMIA estimada",
        unidad="ton/día",
        explicacion="Brecha positiva indica capacidad faltante; negativa indica sobredimensionamiento.",
        incertidumbre="Media: supuestos de mix y capacidad por material estimados.",
    )

    capacidad_material = (
        _capacidad_por_material(capacidad_instalada) if not blockers else {}
    )

    return InfrastructurePlanResponse(
        status=status,  # type: ignore[arg-type]
        municipio_id=municipio_id or None,
        centros=centros,
        capacidad_instalada_ton_dia=round(capacidad_instalada, 4),
        rsu_capturable_ton_dia=request.rsu_capturable_ton_dia,
        brecha_ton_dia=round(brecha, 4),
        capacidad_por_material=capacidad_material,
        calculo_brecha=calculo_brecha,
        warnings=warnings,
        blockers=blockers,
        next_action=next_action,
    )
