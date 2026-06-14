"""§2 Company survey — per-giro question bank + deterministic estimation engine.

Design:
- GIRO_CATALOG: canonical sectors with factors (extends empresa/schemas.GiroScian concept
  but stored here as plain dicts for speed — no DB needed for the catalog itself).
- GIRO_QUESTION_BANK: per-giro survey questions with the specific unit driver the
  estimation engine will read.
- estimate_generation(): deterministic, zero randomness.  Given a giro code and
  the answered survey values it returns kg_rsu_anual, composicion, disclaimer, and
  full provenance breakdown so the output can never be silently wrong.
"""
from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# Giro catalog — factors derived from SEMARNAT DBGIR 2020 (illustrative)
# ---------------------------------------------------------------------------
# Each entry:
#   factor_kg_por_unidad: kg RSU per year per one unit of `unidad`
#   unidad: the survey driver (what we ask about)
#   composicion: material fractions (must sum ~1.0)
#   sector / descripcion: human labels
GIRO_CATALOG: dict[str, dict] = {
    "722511": {
        "sector": "Servicios de alimentos",
        "descripcion": "Restaurantes de servicio completo",
        "factor_kg_por_unidad": 182.5,   # kg/año por cubierto/día promedio
        "unidad": "cubiertos_por_dia",
        "composicion": {
            "organico": 0.68, "carton_papel": 0.12, "vidrio": 0.07,
            "plastico": 0.08, "otros": 0.05,
        },
        "fuente": "SEMARNAT DBGIR 2020 [ESTIMADO]",
    },
    "721111": {
        "sector": "Servicios de alojamiento",
        "descripcion": "Hoteles con servicios integrados",
        "factor_kg_por_unidad": 219.0,   # kg/año por habitación
        "unidad": "habitaciones",
        "composicion": {
            "organico": 0.42, "carton_papel": 0.22, "plastico": 0.14,
            "vidrio": 0.10, "textil": 0.06, "otros": 0.06,
        },
        "fuente": "SEMARNAT DBGIR 2020 [ESTIMADO]",
    },
    "461110": {
        "sector": "Comercio al por menor",
        "descripcion": "Tiendas de abarrotes y misceláneas",
        "factor_kg_por_unidad": 85.0,    # kg/año por m² de piso de venta
        "unidad": "m2_piso_venta",
        "composicion": {
            "carton_papel": 0.38, "plastico": 0.27, "organico": 0.18,
            "vidrio": 0.10, "otros": 0.07,
        },
        "fuente": "SEMARNAT DBGIR 2020 [ESTIMADO]",
    },
    "621111": {
        "sector": "Servicios médicos",
        "descripcion": "Consultorios médicos (solo RSU, excluye RPBI)",
        "factor_kg_por_unidad": 365.0,   # kg/año por consultorio
        "unidad": "consultorios",
        "composicion": {
            "carton_papel": 0.40, "plastico": 0.30, "organico": 0.15,
            "vidrio": 0.05, "otros": 0.10,
        },
        "fuente": "SEMARNAT DBGIR 2020 [ESTIMADO] — excluye RPBI/RME",
    },
    "611111": {
        "sector": "Educación básica",
        "descripcion": "Escuelas primarias y secundarias",
        "factor_kg_por_unidad": 18.25,   # kg/año por alumno
        "unidad": "alumnos",
        "composicion": {
            "carton_papel": 0.52, "plastico": 0.20, "organico": 0.18,
            "otros": 0.10,
        },
        "fuente": "SEMARNAT DBGIR 2020 [ESTIMADO]",
    },
    "236110": {
        "sector": "Construcción",
        "descripcion": "Edificación residencial (RCD — residuos de construcción)",
        "factor_kg_por_unidad": 200.0,   # kg/año por trabajador en obra
        "unidad": "trabajadores_en_obra",
        "composicion": {
            "concreto_tabique": 0.55, "madera": 0.18, "metal": 0.10,
            "plastico": 0.07, "otros": 0.10,
        },
        "fuente": "SEMARNAT DBGIR 2020 [ESTIMADO] — RCD ilustrativo",
    },
    "432210": {
        "sector": "Comercio electrónico / almacén",
        "descripcion": "Bodegas de distribución",
        "factor_kg_por_unidad": 110.0,   # kg/año por m² de bodega
        "unidad": "m2_bodega",
        "composicion": {
            "carton_papel": 0.58, "plastico": 0.22, "madera": 0.10,
            "metal": 0.05, "otros": 0.05,
        },
        "fuente": "SEMARNAT DBGIR 2020 [ESTIMADO]",
    },
    "000000": {
        "sector": "Otro / No clasificado",
        "descripcion": "Giro no listado — estimación genérica",
        "factor_kg_por_unidad": 120.0,   # kg/año por empleado
        "unidad": "empleados",
        "composicion": {
            "organico": 0.30, "carton_papel": 0.30, "plastico": 0.20,
            "vidrio": 0.08, "otros": 0.12,
        },
        "fuente": "SEMARNAT DBGIR 2020 [ESTIMADO GENÉRICO]",
    },
}

# ---------------------------------------------------------------------------
# Per-giro question bank
# ---------------------------------------------------------------------------
# Each entry maps to exactly one `driver_field` that the estimator reads.
# `pregunta_id` must match the key in survey answers dict.
GIRO_QUESTION_BANK: dict[str, list[dict]] = {
    "722511": [
        {
            "pregunta_id": "cubiertos_por_dia",
            "texto": "¿Cuántos cubiertos promedio sirves por día (suma de todos los turnos)?",
            "tipo": "numero",
            "unidad_display": "cubiertos/día",
            "obligatoria": True,
        },
        {
            "pregunta_id": "dias_operacion_semana",
            "texto": "¿Cuántos días a la semana opera el restaurante?",
            "tipo": "numero",
            "unidad_display": "días/semana",
            "obligatoria": False,
            "default": 6,
        },
        {
            "pregunta_id": "tiene_aceite_reciclado",
            "texto": "¿El aceite usado se recolecta para reciclaje?",
            "tipo": "booleano",
            "obligatoria": False,
        },
    ],
    "721111": [
        {
            "pregunta_id": "habitaciones",
            "texto": "¿Cuántas habitaciones tiene el hotel?",
            "tipo": "numero",
            "unidad_display": "habitaciones",
            "obligatoria": True,
        },
        {
            "pregunta_id": "ocupacion_promedio_pct",
            "texto": "¿Cuál es la ocupación promedio anual? (%, ejemplo: 65)",
            "tipo": "numero",
            "unidad_display": "%",
            "obligatoria": False,
            "default": 65,
        },
    ],
    "461110": [
        {
            "pregunta_id": "m2_piso_venta",
            "texto": "¿Cuántos m² tiene el piso de venta (área abierta al público)?",
            "tipo": "numero",
            "unidad_display": "m²",
            "obligatoria": True,
        },
    ],
    "621111": [
        {
            "pregunta_id": "consultorios",
            "texto": "¿Cuántos consultorios opera el establecimiento?",
            "tipo": "numero",
            "unidad_display": "consultorios",
            "obligatoria": True,
        },
    ],
    "611111": [
        {
            "pregunta_id": "alumnos",
            "texto": "¿Cuántos alumnos tiene la escuela (matrícula)?",
            "tipo": "numero",
            "unidad_display": "alumnos",
            "obligatoria": True,
        },
    ],
    "236110": [
        {
            "pregunta_id": "trabajadores_en_obra",
            "texto": "¿Cuántos trabajadores hay en obra en promedio?",
            "tipo": "numero",
            "unidad_display": "trabajadores",
            "obligatoria": True,
        },
    ],
    "432210": [
        {
            "pregunta_id": "m2_bodega",
            "texto": "¿Cuántos m² tiene la bodega?",
            "tipo": "numero",
            "unidad_display": "m²",
            "obligatoria": True,
        },
    ],
    "000000": [
        {
            "pregunta_id": "empleados",
            "texto": "¿Cuántos empleados tiene el establecimiento?",
            "tipo": "numero",
            "unidad_display": "empleados",
            "obligatoria": True,
        },
    ],
}

# Gran generador threshold: ≥10 ton/año triggers advisory (NOM-161-SEMARNAT-2011)
_GRAN_GENERADOR_KG = 10_000

DISCLAIMER = (
    "ESTIMACIÓN VOLUNTARIA — no oficial, no sustituye COA SEMARNAT "
    "ni obligaciones de reporte federal."
)


def get_questions(giro_codigo: str) -> list[dict]:
    """Return the survey questions for a given giro code.

    Falls back to the generic '000000' question bank for unknown codes.
    """
    return GIRO_QUESTION_BANK.get(giro_codigo, GIRO_QUESTION_BANK["000000"])


def estimate_generation(giro_codigo: str, answers: dict[str, Any]) -> dict:
    """Deterministic waste generation estimate.

    Args:
        giro_codigo: 6-digit SCIAN code (uses '000000' fallback if unknown)
        answers: dict of pregunta_id → numeric (or bool) answers

    Returns:
        dict with kg_rsu_anual, ton_rsu_anual, composicion_kg, semaforo,
        gran_generador_advisory, disclaimer, provenance.
    """
    giro = GIRO_CATALOG.get(giro_codigo) or GIRO_CATALOG["000000"]
    effective_code = giro_codigo if giro_codigo in GIRO_CATALOG else "000000"

    driver_field = giro["unidad"]
    driver_value = float(answers.get(driver_field) or 0)

    # Optional modifiers
    factor = giro["factor_kg_por_unidad"]

    # Hotel: adjust for occupancy
    if effective_code == "721111":
        ocupacion = float(answers.get("ocupacion_promedio_pct", 65)) / 100.0
        factor = factor * ocupacion

    kg_rsu_anual = driver_value * factor
    ton_rsu_anual = round(kg_rsu_anual / 1000, 3)

    composicion_kg = {
        material: round(fraction * kg_rsu_anual, 1)
        for material, fraction in giro["composicion"].items()
    }

    if kg_rsu_anual >= _GRAN_GENERADOR_KG:
        semaforo = "ROJO"
        gran_generador_advisory = (
            "Tu volumen estimado (≥10 ton/año) podría sujetarte a registro como "
            "Gran Generador ante SEMARNAT (NOM-161-SEMARNAT-2011). "
            "Consulta a un especialista en residuos de manejo especial."
        )
    elif kg_rsu_anual >= 400:
        semaforo = "AMARILLO"
        gran_generador_advisory = None
    else:
        semaforo = "VERDE"
        gran_generador_advisory = None

    return {
        "giro_codigo": effective_code,
        "giro_descripcion": giro["descripcion"],
        "sector": giro["sector"],
        "driver_field": driver_field,
        "driver_value": driver_value,
        "kg_rsu_anual": round(kg_rsu_anual, 1),
        "ton_rsu_anual": ton_rsu_anual,
        "composicion_kg": composicion_kg,
        "semaforo": semaforo,
        "gran_generador_advisory": gran_generador_advisory,
        "disclaimer": DISCLAIMER,
        "provenance": {
            "metodo": "factor_por_unidad_determinista",
            "factor_aplicado_kg_por_unidad": round(factor, 4),
            "fuente_factor": giro["fuente"],
            "giro_catalogo": "SEMARNAT DBGIR 2020",
        },
    }
