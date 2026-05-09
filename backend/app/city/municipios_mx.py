"""
Catálogo municipal México Q-009 — CVE INEGI (entidad 2 + municipio 3 dígitos).

Navigator debe validar cifras definitivas contra MGN/INEGI antes de uso oficial.
Fuente población: referencia CONAPO/estimaciones 2024 para filas marcadas datos_estimados.
Generación RSU: kg/hab/día nacional ~0.86 (referencia SEMARNAT) × 0.8 factor redacción modelo.
"""

from __future__ import annotations

from dataclasses import dataclass

# kg/hab/día base; ton/día = población * GEN_KG_HAB_REF * FACTOR_MX / 1000
GEN_KG_HAB_REF: float = 0.86
FACTOR_PROMEDIO_MX: float = 0.8
GEN_KG_HAB_MODEL: float = GEN_KG_HAB_REF * FACTOR_PROMEDIO_MX  # 0.688


def _rsu_ton_dia(poblacion: int) -> float:
    return round(poblacion * GEN_KG_HAB_MODEL / 1000.0, 4)


@dataclass(frozen=True)
class MunicipioMxRow:
    clave_inegi: str
    nombre: str
    estado_nombre: str
    estado_id: str  # CVE entidad INEGI 01-32
    poblacion: int
    generacion_rsu_dia: float
    zm_simulator_id: str
    municipio_simulator_id: str
    datos_estimados: bool


# Poblaciones: mixto INEGI 2020 / CONAPO 2024 estimaciones internas (marcado estimados salvo donde ZM ya alinea).
MUNICIPIOS_MX: tuple[MunicipioMxRow, ...] = (
    # ── San Luis Potosí (24) — alineado a simulador ZM SLP
    MunicipioMxRow(
        clave_inegi="24028",
        nombre="San Luis Potosí",
        estado_nombre="San Luis Potosí",
        estado_id="24",
        poblacion=912_871,
        generacion_rsu_dia=_rsu_ton_dia(912_871),
        zm_simulator_id="SLP",
        municipio_simulator_id="slp",
        datos_estimados=False,
    ),
    MunicipioMxRow(
        clave_inegi="24031",
        nombre="Soledad de Graciano Sánchez",
        estado_nombre="San Luis Potosí",
        estado_id="24",
        poblacion=323_409,
        generacion_rsu_dia=_rsu_ton_dia(323_409),
        zm_simulator_id="SLP",
        municipio_simulator_id="sol",
        datos_estimados=False,
    ),
    MunicipioMxRow(
        clave_inegi="24011",
        nombre="Cerro de San Pedro",
        estado_nombre="San Luis Potosí",
        estado_id="24",
        poblacion=4_278,
        generacion_rsu_dia=_rsu_ton_dia(4_278),
        zm_simulator_id="SLP",
        municipio_simulator_id="csp",
        datos_estimados=False,
    ),
    MunicipioMxRow(
        clave_inegi="24019",
        nombre="Villa de Pozos",
        estado_nombre="San Luis Potosí",
        estado_id="24",
        poblacion=3_422,
        generacion_rsu_dia=_rsu_ton_dia(3_422),
        zm_simulator_id="SLP",
        municipio_simulator_id="vip",
        datos_estimados=True,
    ),
    # ── Querétaro (22)
    MunicipioMxRow(
        clave_inegi="22014",
        nombre="Querétaro",
        estado_nombre="Querétaro",
        estado_id="22",
        poblacion=1_049_777,
        generacion_rsu_dia=_rsu_ton_dia(1_049_777),
        zm_simulator_id="QRO",
        municipio_simulator_id="qro",
        datos_estimados=True,
    ),
    MunicipioMxRow(
        clave_inegi="22006",
        nombre="Corregidora",
        estado_nombre="Querétaro",
        estado_id="22",
        poblacion=193_000,
        generacion_rsu_dia=_rsu_ton_dia(193_000),
        zm_simulator_id="QRO",
        municipio_simulator_id="cor",
        datos_estimados=True,
    ),
    MunicipioMxRow(
        clave_inegi="22011",
        nombre="El Marqués",
        estado_nombre="Querétaro",
        estado_id="22",
        poblacion=168_000,
        generacion_rsu_dia=_rsu_ton_dia(168_000),
        zm_simulator_id="QRO",
        municipio_simulator_id="mar",
        datos_estimados=True,
    ),
    # ── Nuevo León (19)
    MunicipioMxRow(
        clave_inegi="19039",
        nombre="Monterrey",
        estado_nombre="Nuevo León",
        estado_id="19",
        poblacion=1_142_994,
        generacion_rsu_dia=_rsu_ton_dia(1_142_994),
        zm_simulator_id="MTY",
        municipio_simulator_id="mty",
        datos_estimados=False,
    ),
    MunicipioMxRow(
        clave_inegi="19019",
        nombre="San Pedro Garza García",
        estado_nombre="Nuevo León",
        estado_id="19",
        poblacion=163_148,
        generacion_rsu_dia=_rsu_ton_dia(163_148),
        zm_simulator_id="MTY",
        municipio_simulator_id="spg",
        datos_estimados=False,
    ),
    MunicipioMxRow(
        clave_inegi="19021",
        nombre="Guadalupe",
        estado_nombre="Nuevo León",
        estado_id="19",
        poblacion=686_165,
        generacion_rsu_dia=_rsu_ton_dia(686_165),
        zm_simulator_id="MTY",
        municipio_simulator_id="gua",
        datos_estimados=False,
    ),
    # ── Jalisco (14) — ZM Guadalajara (simulador GDL)
    MunicipioMxRow(
        clave_inegi="14039",
        nombre="Guadalajara",
        estado_nombre="Jalisco",
        estado_id="14",
        poblacion=1_385_600,
        generacion_rsu_dia=_rsu_ton_dia(1_385_600),
        zm_simulator_id="GDL",
        municipio_simulator_id="gdl",
        datos_estimados=True,
    ),
    MunicipioMxRow(
        clave_inegi="14120",
        nombre="Zapopan",
        estado_nombre="Jalisco",
        estado_id="14",
        poblacion=1_062_000,
        generacion_rsu_dia=_rsu_ton_dia(1_062_000),
        zm_simulator_id="GDL",
        municipio_simulator_id="zap",
        datos_estimados=True,
    ),
    MunicipioMxRow(
        clave_inegi="14098",
        nombre="San Pedro Tlaquepaque",
        estado_nombre="Jalisco",
        estado_id="14",
        poblacion=650_000,
        generacion_rsu_dia=_rsu_ton_dia(650_000),
        zm_simulator_id="GDL",
        municipio_simulator_id="tla",
        datos_estimados=True,
    ),
)


def list_municipios_mx(estado_id: str | None = None) -> list[MunicipioMxRow]:
    rows = list(MUNICIPIOS_MX)
    if estado_id:
        e = estado_id.strip().zfill(2) if estado_id.strip().isdigit() else estado_id.strip()
        rows = [r for r in rows if r.estado_id == e]
    return rows


def get_municipio_mx_by_clave(clave_inegi: str) -> MunicipioMxRow | None:
    clave = clave_inegi.strip().zfill(5) if clave_inegi.strip().isdigit() else clave_inegi.strip()
    return next((r for r in MUNICIPIOS_MX if r.clave_inegi == clave), None)


def list_estados_distinct() -> list[tuple[str, str]]:
    """(estado_id, estado_nombre) únicos ordenados por nombre."""
    seen: dict[str, str] = {}
    for r in MUNICIPIOS_MX:
        seen[r.estado_id] = r.estado_nombre
    return sorted(((k, seen[k]) for k in sorted(seen.keys())), key=lambda x: x[1])
