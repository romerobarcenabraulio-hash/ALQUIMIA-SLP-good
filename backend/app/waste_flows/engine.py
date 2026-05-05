"""Motor Fase 13.4: diagnóstico de cierre de ciclo municipal."""
from __future__ import annotations

from app.waste_flows.schemas import (
    BrechaCircularidad,
    DiagnosticoCircularidadRequest,
    DiagnosticoCircularidadResponse,
    FlujoCorriente,
    WasteDestination,
)

_RECOVERABLES = {"organico", "papel", "carton", "plastico", "vidrio", "metal", "textil"}


def _round(v: float) -> float:
    return round(v, 4)


def _empty_response(
    status: str,
    blockers: list[str],
    advertencias: list[str],
) -> DiagnosticoCircularidadResponse:
    brecha = BrechaCircularidad(
        toneladas_recuperables_perdidas=0.0,
        porcentaje_recuperable_no_capturado=0.0,
        oportunidad_ingreso_estimado_mxn=0.0,
        formula="(ton_recuperables_perdidas × 365 días × $800/ton)",
        fuente_factor="SEMARNAT 2023 precio mercado secundario promedio",
    )
    return DiagnosticoCircularidadResponse(
        status=status,  # type: ignore[arg-type]
        blockers=blockers,
        flujos=[],
        brecha=brecha,
        tasa_circularidad_actual_pct=0.0,
        tasa_circularidad_potencial_pct=0.0,
        acciones_prioritarias=[
            "Consolidar diagnóstico base de corrientes por municipio.",
            "Validar infraestructura y rutas actuales.",
            "Definir meta de recuperación con trazabilidad.",
        ],
        advertencias=advertencias,
    )


def _destination_for(name: str, recoverable: bool, infra: list[str]) -> WasteDestination:
    if name == "organico" and any(i.lower() == "composta" for i in infra):
        return WasteDestination.compostaje
    if recoverable:
        return WasteDestination.reciclaje
    return WasteDestination.relleno_sanitario


def _priorities(mix: dict[str, float]) -> list[str]:
    organico = mix.get("organico", 0.0)
    papel_carton = mix.get("papel", 0.0) + mix.get("carton", 0.0)
    plastico = mix.get("plastico", 0.0)
    acciones = []
    if organico > 0.40:
        acciones.append("Instalar planta de composta y separación de orgánicos en origen.")
    if papel_carton > 0.15:
        acciones.append("Formalizar convenio con recicladoras de papel y cartón por ruta.")
    if plastico > 0.12:
        acciones.append("Crear programa de recuperación PET/HDPE con acopio dedicado.")
    if len(acciones) < 3:
        acciones.append("Optimizar trazabilidad de rutas para reducir pérdidas recuperables.")
    if len(acciones) < 3:
        acciones.append("Implementar campañas de separación municipal por corriente prioritaria.")
    return acciones[:3]


def calculate_waste_flows(req: DiagnosticoCircularidadRequest) -> DiagnosticoCircularidadResponse:
    blockers: list[str] = []
    advertencias: list[str] = []

    municipio = (req.municipio_id or "").strip().lower()
    if not municipio:
        blockers.append("municipio_id es obligatorio para diagnóstico de flujos.")
    if req.generacion_total_ton_dia <= 0:
        blockers.append("generacion_total_ton_dia debe ser mayor que cero.")

    if blockers:
        return _empty_response("blocked", blockers, advertencias)

    flujos: list[FlujoCorriente] = []
    total_recoverable = 0.0

    for nombre, fraccion in req.mix_corrientes.items():
        frac = max(0.0, float(fraccion))
        ton = req.generacion_total_ton_dia * frac
        recoverable = nombre.lower() in _RECOVERABLES
        destino = _destination_for(nombre.lower(), recoverable, req.infraestructura_actual)
        if recoverable:
            total_recoverable += ton
        flujos.append(
            FlujoCorriente(
                nombre=nombre,
                toneladas_dia=_round(ton),
                destino=destino,
                porcentaje_del_total=_round(frac * 100.0),
                es_recuperable=recoverable,
                advertencia=None if recoverable else "Corriente no recuperable en esquema RSU estándar.",
            )
        )

    if total_recoverable <= 0 and req.tasa_recuperacion_actual_pct == 0:
        advertencias.append("Municipio sin recuperación activa detectada")
        status = "warning"
    else:
        status = "ready"

    tasa_actual = max(0.0, min(100.0, req.tasa_recuperacion_actual_pct))
    potencial_base = (total_recoverable / req.generacion_total_ton_dia) * 100.0 if req.generacion_total_ton_dia > 0 else 0.0
    tasa_potencial = max(tasa_actual, potencial_base)

    ton_perdidas = total_recoverable * (1.0 - tasa_actual / 100.0)
    pct_no_capturado = (ton_perdidas / req.generacion_total_ton_dia) * 100.0 if req.generacion_total_ton_dia > 0 else 0.0
    oportunidad = ton_perdidas * 365.0 * 800.0

    brecha = BrechaCircularidad(
        toneladas_recuperables_perdidas=_round(ton_perdidas),
        porcentaje_recuperable_no_capturado=_round(pct_no_capturado),
        oportunidad_ingreso_estimado_mxn=_round(oportunidad),
        formula="(ton_recuperables_perdidas × 365 días × $800/ton)",
        fuente_factor="SEMARNAT 2023 precio mercado secundario promedio",
    )

    return DiagnosticoCircularidadResponse(
        status=status,  # type: ignore[arg-type]
        blockers=[],
        flujos=flujos,
        brecha=brecha,
        tasa_circularidad_actual_pct=_round(tasa_actual),
        tasa_circularidad_potencial_pct=_round(tasa_potencial),
        acciones_prioritarias=_priorities(req.mix_corrientes),
        advertencias=advertencias,
    )
