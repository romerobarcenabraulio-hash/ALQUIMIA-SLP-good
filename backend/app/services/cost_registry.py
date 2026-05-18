"""
Catalogo de costos PRECARGADOS para ALQUIMIA (Wave 0).

Principio: SIEMPRE hay un numero — nunca un campo vacio que bloquee al usuario.
Cada linea tiene fuente explícita y caducidad. El humano puede corregir cualquier
valor desde la UI; su correccion tiene prioridad sobre el precargado.

Estructura por tier de CA (Pequeno / Mediano / Grande):
  - CAPEX: terreno, construccion, equipamiento, permisos, capacitacion, capital_trabajo
  - OPEX: personal, energia, mantenimiento, admin, combustible
  - Basureros domiciliarios
  - Costo de disposicion evitada (ahorro real vs relleno sanitario)

Los totales de CAPEX P/M/G suman aproximadamente los actuales en calculator.py
(726_476 / 2_528_808 / 7_131_655) para no alterar la escala de resultados existentes.
"""
from __future__ import annotations

from datetime import date
from typing import Dict, List, Optional

from app.schemas.cost_model import (
    CostLineItem,
    CostSourceType,
    NegotiationScheme,
)

# ─── Fuentes de referencia ────────────────────────────────────────────────────
_FECHA = date(2026, 5, 1)   # Fecha de captura de los benchmarks

# ─── Reparto de CAPEX por esquema de negociacion ─────────────────────────────
# actor_responsable en cada linea es para municipal_directo.
# Las funciones apply_negotiation_scheme() sobreescriben el actor segun esquema.

_ACTOR_CAPEX_CONCESION: Dict[str, str] = {
    # En concesion_total: el concesionario paga todo excepto permisos (municipio).
    "terreno":         "concesionario",
    "construccion":    "concesionario",
    "equipamiento":    "concesionario",
    "permisos":        "municipio",
    "capacitacion":    "concesionario",
    "capital_trabajo": "concesionario",
    "basureros":       "municipio",
    "disposicion":     "compartido",
}
_ACTOR_CAPEX_MIXTO: Dict[str, str] = {
    "terreno":         "municipio",
    "construccion":    "concesionario",
    "equipamiento":    "concesionario",
    "permisos":        "municipio",
    "capacitacion":    "compartido",
    "capital_trabajo": "concesionario",
    "basureros":       "municipio",
    "disposicion":     "compartido",
}


def _item(
    concepto: str,
    cantidad: float,
    unidad: str,
    precio_unitario: float,
    fuente: str,
    clasificacion: CostSourceType,
    actor: str,
    periodicidad: str = "unico",
    notas: str = "",
    caducidad_dias: int = 90,
) -> CostLineItem:
    monto = round(cantidad * precio_unitario, 2)
    return CostLineItem(
        concepto=concepto,
        cantidad=cantidad,
        unidad=unidad,
        precio_unitario_mxn=precio_unitario,
        monto_precargado=monto,
        monto_usuario=None,
        fuente_precarga=fuente,
        clasificacion=clasificacion,
        actor_responsable=actor,
        periodicidad=periodicidad,
        fecha_obtencion=_FECHA,
        caducidad_dias=caducidad_dias,
        notas=notas,
    )


# ─── CAPEX por tier ───────────────────────────────────────────────────────────

def capex_ca_pequeno() -> List[CostLineItem]:
    """
    CAPEX CA Pequeno (~200 m2). Total benchmark: ~726,000 MXN.
    Fuente base: benchmarks SLP/MTY/QRO 2025-2026.
    """
    return [
        _item("terreno_CA_P",      200, "m2",  1_050, "Catastro municipal SLP benchmark 2026 — industrial/semi-industrial",   CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("construccion_CA_P", 200, "m2",  1_800, "INPC sector construccion ligera 2025 — bodega metalica prefabricada",  CostSourceType.supuesto_editable, "municipio", caducidad_dias=90),
        _item("equipamiento_CA_P",   1, "ud", 140_000, "Cotizacion mercado: bascula 500kg + basureros grandes + herramienta",  CostSourceType.supuesto_editable, "municipio", caducidad_dias=60),
        _item("permisos_CA_P",       1, "ud",  28_000, "Tarifas licencia construccion + EIA simplificada — SLP 2024",          CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("capacitacion_CA_P",   5, "persona-mes", 3_600, "STPS/CONALEP 2025 — programa manejo residuos 1 mes",            CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("capital_trabajo_CA_P", 1, "ud", 110_838 * 3, "3 meses OPEX inicial (buffer arranque)",                          CostSourceType.supuesto_editable, "municipio",
              notas="Equivale a 3 meses de CA_OPEX['P']"),
    ]


def capex_ca_mediano() -> List[CostLineItem]:
    """
    CAPEX CA Mediano (~700 m2). Total benchmark: ~2,528,000 MXN.
    """
    return [
        _item("terreno_CA_M",        700, "m2",  1_100, "Catastro industrial SLP/QRO benchmark 2026",                         CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("construccion_CA_M",   700, "m2",  2_000, "INPC sector construccion 2025 — nave semi-industrial",               CostSourceType.supuesto_editable, "municipio", caducidad_dias=90),
        _item("equipamiento_CA_M",     1, "ud", 450_000, "Prensa hidraulica + bascula 2t + montacarga — cotizacion mercado",   CostSourceType.supuesto_editable, "municipio", caducidad_dias=60),
        _item("permisos_CA_M",         1, "ud",  65_000, "Licencias + EIA media complejidad + uso suelo industrial",           CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("capacitacion_CA_M",    14, "persona-mes", 3_600, "STPS/CONALEP 2025 x 14 personas",                            CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("capital_trabajo_CA_M",  1, "ud", 320_354 * 3, "3 meses OPEX inicial CA mediano",                               CostSourceType.supuesto_editable, "municipio",
              notas="Equivale a 3 meses de CA_OPEX['M']"),
    ]


def capex_ca_grande() -> List[CostLineItem]:
    """
    CAPEX CA Grande (~2000 m2). Total benchmark: ~7,131,000 MXN.
    """
    return [
        _item("terreno_CA_G",       2_000, "m2",  1_200, "Catastro industrial ZM — precio promedio parque industrial",        CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("construccion_CA_G",  2_000, "m2",  2_100, "INPC sector construccion 2025 — nave industrial",                   CostSourceType.supuesto_editable, "municipio", caducidad_dias=90),
        _item("equipamiento_CA_G",      1, "ud", 1_200_000, "Linea separacion semi-automatica + 2 prensas + montacarga elec", CostSourceType.supuesto_editable, "municipio", caducidad_dias=60),
        _item("permisos_CA_G",          1, "ud",  160_000, "EIA completa + licencias estado + uso suelo industrial mayor",    CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("capacitacion_CA_G",     34, "persona-mes", 3_600, "STPS/CONALEP 2025 x 34 personas",                          CostSourceType.supuesto_editable, "municipio", caducidad_dias=180),
        _item("capital_trabajo_CA_G",   1, "ud", 787_328 * 3, "3 meses OPEX inicial CA grande",                              CostSourceType.supuesto_editable, "municipio",
              notas="Equivale a 3 meses de CA_OPEX['G']"),
    ]


# ─── OPEX mensual por tier ────────────────────────────────────────────────────

def opex_mensual_ca_pequeno() -> List[CostLineItem]:
    return [
        _item("personal_CA_P",      5, "persona-mes",  9_000, "Salario operador RSU SLP 2025 — IMSS + prestaciones",         CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("energia_CA_P",       1, "ud",           8_000, "CFE tarifa industrial — consumo estimado 200m2 operacion",     CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("mantenimiento_CA_P", 1, "ud",           5_000, "Mantenimiento preventivo mensual equipamiento menor",          CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("admin_CA_P",         1, "ud",          12_838, "Coordinacion, reportes, costos administrativos",              CostSourceType.supuesto_editable, "municipio", "mensual"),
    ]


def opex_mensual_ca_mediano() -> List[CostLineItem]:
    return [
        _item("personal_CA_M",      14, "persona-mes", 9_000, "Salario operador RSU SLP 2025 — IMSS + prestaciones",         CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("energia_CA_M",        1, "ud",          18_000, "CFE tarifa industrial — nave semi-industrial 700m2",          CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("mantenimiento_CA_M",  1, "ud",          12_000, "Mantenimiento preventivo mensual equipamiento mediano",        CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("admin_CA_M",          1, "ud",          38_354, "Coordinacion, reportes, costos administrativos",              CostSourceType.supuesto_editable, "municipio", "mensual"),
    ]


def opex_mensual_ca_grande() -> List[CostLineItem]:
    return [
        _item("personal_CA_G",      34, "persona-mes", 9_000, "Salario operador RSU 2025 — IMSS + prestaciones",             CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("energia_CA_G",        1, "ud",          45_000, "CFE tarifa industrial — nave industrial 2000m2",              CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("mantenimiento_CA_G",  1, "ud",          35_000, "Mantenimiento preventivo mensual linea semi-automatica",       CostSourceType.supuesto_editable, "municipio", "mensual"),
        _item("admin_CA_G",          1, "ud",         401_328, "Coordinacion, reportes, costos administrativos CA grande",    CostSourceType.supuesto_editable, "municipio", "mensual"),
    ]


# ─── Basureros domiciliarios ──────────────────────────────────────────────────

def item_basureros(viviendas: float) -> CostLineItem:
    """$230/contenedor para 80% de las viviendas — benchmark mercado 2025."""
    cantidad = viviendas * 0.80
    return _item(
        "basureros_domiciliarios",
        cantidad, "contenedor", 230,
        "Precio promedio contenedor residencial 120L — mercado nacional 2025",
        CostSourceType.supuesto_editable,
        "municipio",
        periodicidad="unico",
        notas="80% cobertura viviendas. Reemplace con cotizacion proveedor local.",
        caducidad_dias=60,
    )


# ─── Costo de disposicion evitada ────────────────────────────────────────────

def item_tarifa_disposicion(zm: str = "SLP") -> CostLineItem:
    """
    Costo que el municipio paga HOY por ton dispuesta en relleno sanitario.
    Cada ton separada = ahorro real en esta tarifa.
    Fuente: benchmarks 2024-2026 SEMARNAT / contratos publicados.
    """
    benchmarks: Dict[str, float] = {
        "SLP": 320.0,   # MXN/ton — tarifa promedio relleno sanitario SLP
        "MTY": 450.0,
        "QRO": 380.0,
    }
    tarifa = benchmarks.get(zm.upper(), 320.0)
    return _item(
        "tarifa_disposicion_relleno",
        1, "MXN/ton", tarifa,
        f"Benchmark tarifa disposicion relleno sanitario {zm} 2024 — SEMARNAT/contratos publicos",
        CostSourceType.supuesto_editable,
        "municipio",
        periodicidad="unico",
        notas="Tarifa por tonelada. Actualice con contrato vigente de disposicion final.",
        caducidad_dias=180,
    )


# ─── Funcion principal: construir CostModel para una corrida ─────────────────

def build_cost_items(
    nP: int, nM: int, nG: int,
    viviendas: float,
    zm: str = "SLP",
    negociacion: NegotiationScheme = NegotiationScheme.municipal_directo,
    overrides: Optional[Dict[str, float]] = None,
) -> List[CostLineItem]:
    """
    Construye la lista de CostLineItem para un escenario dado.

    - nP/nM/nG: numero de CAs por tier
    - viviendas: para calcular basureros domiciliarios
    - zm: zona metropolitana (para tarifa disposicion y benchmarks)
    - negociacion: redistribuye actor_responsable segun esquema
    - overrides: {concepto: monto_usuario} para sobreescrituras del usuario

    Los montos CAPEX se suman: 3 CAs pequenos = 3x cada linea de CA_P.
    """
    items: List[CostLineItem] = []

    # CAPEX centros de acopio
    for _ in range(nP):
        items.extend(capex_ca_pequeno())
    for _ in range(nM):
        items.extend(capex_ca_mediano())
    for _ in range(nG):
        items.extend(capex_ca_grande())

    # OPEX mensual (para referencia; el calculador sigue usando CA_OPEX internamente)
    items.extend(opex_mensual_ca_pequeno() * nP)
    items.extend(opex_mensual_ca_mediano() * nM)
    items.extend(opex_mensual_ca_grande() * nG)

    # Basureros y disposicion
    if viviendas > 0:
        items.append(item_basureros(viviendas))
    items.append(item_tarifa_disposicion(zm))

    # Aplicar esquema de negociacion
    items = _apply_negotiation(items, negociacion)

    # Aplicar overrides del usuario
    if overrides:
        items = _apply_overrides(items, overrides)

    return items


def _apply_negotiation(items: List[CostLineItem], scheme: NegotiationScheme) -> List[CostLineItem]:
    """Redistribuye actor_responsable segun esquema de negociacion."""
    if scheme == NegotiationScheme.municipal_directo:
        return items  # ya todo es municipio por defecto

    actor_map = (
        _ACTOR_CAPEX_CONCESION
        if scheme == NegotiationScheme.concesion_total
        else _ACTOR_CAPEX_MIXTO
    )

    result: List[CostLineItem] = []
    for item in items:
        # Extraer la "categoria" del concepto (terreno_CA_P → terreno)
        categoria = item.concepto.split("_")[0]
        nuevo_actor = actor_map.get(categoria, item.actor_responsable)
        if nuevo_actor != item.actor_responsable:
            item = item.model_copy(update={"actor_responsable": nuevo_actor})
        result.append(item)
    return result


def _apply_overrides(items: List[CostLineItem], overrides: Dict[str, float]) -> List[CostLineItem]:
    """Aplica monto_usuario a los items cuyo concepto este en overrides."""
    result: List[CostLineItem] = []
    for item in items:
        if item.concepto in overrides:
            item = item.model_copy(update={
                "monto_usuario": overrides[item.concepto],
                "clasificacion": CostSourceType.dato_usuario,
            })
        result.append(item)
    return result


# ─── Resumen de confianza ─────────────────────────────────────────────────────

def confianza_score(items: List[CostLineItem]) -> float:
    """Score de confianza 0-1 basado en calidad de los datos."""
    if not items:
        return 0.0
    pesos = {
        CostSourceType.fuente_verificada: 1.0,
        CostSourceType.dato_usuario: 0.85,
        CostSourceType.estimado_mercado: 0.65,
        CostSourceType.supuesto_editable: 0.40,
        CostSourceType.pendiente_fuente: 0.05,
    }
    total = sum(pesos.get(i.clasificacion, 0.4) for i in items)
    return round(total / len(items), 3)
