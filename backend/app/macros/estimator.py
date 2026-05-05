"""Estimador de volumen por tipo de macrogenerador (Fase 13.2)."""
from __future__ import annotations

from typing import Dict, List

from app.macros.schemas import CalculoVolumenMacro, MacroTipo


_REQUIRED: Dict[MacroTipo, List[str]] = {
    MacroTipo.hotel: ["habitaciones", "ocupacion_pct", "noches_promedio"],
    MacroTipo.estadio: ["aforo", "ocupacion_pct", "eventos_mes"],
    MacroTipo.evento_masivo: ["aforo", "ocupacion_pct", "eventos_mes"],
    MacroTipo.hospital: ["camas", "consultas_dia", "tiene_residuos_regulados"],
    MacroTipo.universidad: ["estudiantes", "personal"],
    MacroTipo.plaza_comercial: ["locales", "visitantes_dia"],
    MacroTipo.club_deportivo: ["socios", "visitantes_dia"],
    MacroTipo.parque_industrial: ["empleados", "turnos"],
    MacroTipo.edificio_oficinas: ["empleados"],
}


def check_required_variables(tipo: MacroTipo, variables: Dict) -> List[str]:
    required = _REQUIRED.get(tipo, [])
    missing: List[str] = []
    for key in required:
        if variables.get(key) in (None, "", []):
            missing.append(key)
    return missing


def _pct(value: float | int | None) -> float:
    if value is None:
        return 0.0
    v = float(value)
    return v / 100.0 if v > 1 else v


def _range(ton_dia: float) -> tuple[float, float]:
    low = max(0.0, round(ton_dia * 0.7, 4))
    high = round(ton_dia * 1.3 if ton_dia > 0 else 0.0, 4)
    if high <= low:
        high = low + 0.001
    return (low, high)


def estimate_volume(tipo: MacroTipo, variables: Dict) -> CalculoVolumenMacro:
    datos = variables or {}
    es_temporal = False
    formula = "actividad_base * factor"
    fuente = "benchmark_sectorial ALQUIMIA"
    unidad = "ton/día"
    periodicidad = "diaria"
    razon = "Benchmark sectorial estimado; requiere validación local."

    ton_dia = 0.0

    if tipo == MacroTipo.hotel:
        habitaciones = float(datos.get("habitaciones", 0))
        ocupacion = _pct(datos.get("ocupacion_pct"))
        noches = float(datos.get("noches_promedio", 1)) or 1
        factor_kg = 1.8
        ton_dia = habitaciones * ocupacion * factor_kg * noches / 1000.0
        formula = "habitaciones * ocupacion_pct * factor_kg_huesped * noches"
        razon = "Estimación hotelera promedio; no suma RSU domiciliario."
    elif tipo in (MacroTipo.estadio, MacroTipo.evento_masivo):
        aforo = float(datos.get("aforo", 0))
        ocupacion = _pct(datos.get("ocupacion_pct"))
        eventos_mes = float(datos.get("eventos_mes", 1)) or 1
        factor_kg = 1.5
        ton_evento = aforo * ocupacion * factor_kg / 1000.0
        es_temporal = tipo == MacroTipo.evento_masivo
        ton_dia = ton_evento
        periodicidad = "por_evento" if es_temporal else "mensual_promedio"
        formula = "aforo * ocupacion_pct * factor_kg_asistente"
        razon = "Evento masivo: volumen por evento; multiplicar por número de eventos."
    elif tipo == MacroTipo.hospital:
        camas = float(datos.get("camas", 0))
        consultas = float(datos.get("consultas_dia", 0))
        factor_cama = 2.5  # kg/cama/día RSU (no regulado)
        factor_consulta = 0.25
        ton_dia = (camas * factor_cama + consultas * factor_consulta) / 1000.0
        formula = "camas * factor_cama + consultas_dia * factor_consulta"
        razon = "Volumen hospitalario RSU; residuos biológico-infecciosos son regulados."
    elif tipo == MacroTipo.universidad:
        estudiantes = float(datos.get("estudiantes", 0))
        personal = float(datos.get("personal", 0))
        cafeterias = float(datos.get("cafeterias", 0))
        ton_dia = (estudiantes * 0.7 + personal * 0.4) / 1000.0 + cafeterias * 0.05
        formula = "estudiantes*0.7kg + personal*0.4kg + cafeterias*0.05t"
        razon = "Generación educativa promedio con cafeterías."
    elif tipo == MacroTipo.plaza_comercial:
        locales = float(datos.get("locales", 0))
        visitantes = float(datos.get("visitantes_dia", 0))
        food_court = bool(datos.get("food_court", False))
        ton_dia = visitantes * 0.9 / 1000.0 + locales * 0.015
        if food_court:
            ton_dia += 0.25
        formula = "visitantes_dia*0.9kg + locales*0.015t [+0.25t si food_court]"
        razon = "Plaza comercial con food court y mantenimiento."
    elif tipo == MacroTipo.club_deportivo:
        socios = float(datos.get("socios", 0))
        visitantes = float(datos.get("visitantes_dia", 0))
        eventos = float(datos.get("eventos_mes", 0))
        ton_dia = (socios * 0.8 + visitantes * 0.6) / 1000.0 + eventos * 0.03
        formula = "socios*0.8kg + visitantes*0.6kg + eventos_mes*0.03t"
        razon = "Club deportivo con aforo moderado."
    elif tipo in (MacroTipo.parque_industrial, MacroTipo.edificio_oficinas):
        empleados = float(datos.get("empleados", 0))
        turnos = float(datos.get("turnos", 1)) or 1
        ton_dia = empleados * turnos * 1.2 / 1000.0
        formula = "empleados * turnos * 1.2kg"
        razon = "Benchmark industrial/oficinas; revisar residuos regulados."
    else:
        # Fallback conservador
        actividad = float(datos.get("actividad_base", 0))
        factor = float(datos.get("factor_kg_dia", 0.8))
        ton_dia = actividad * factor / 1000.0
        formula = "actividad_base * factor_kg_dia"
        razon = "Estimación genérica; requiere datos específicos del tipo."

    inc_range = _range(ton_dia)
    return CalculoVolumenMacro(
        formula=formula,
        fuente_factor=fuente,
        unidad=unidad,
        periodicidad=periodicidad,
        razon=razon,
        incertidumbre_rango=inc_range,
        es_temporal=es_temporal,
    )
