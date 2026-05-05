"""Catalogo benchmark de macrogeneradores MVP.

Estos registros son ejemplos sectoriales para simulacion. No son directorio
oficial ni deben usarse como evidencia institucional sin verificacion.
"""
from __future__ import annotations

from copy import deepcopy
import json
import os
from pathlib import Path
from typing import Dict, List, Optional

from app.macros.schemas import FuenteTipoMacro, MacroGenerator, MacroStatus, MacroTipo


REGISTRY_WARNING = (
    "Macrogeneradores de registro inicial son benchmark/estimados; requieren "
    "validacion local antes de presentarse como fuente oficial."
)


_DEFAULT_COMPOSITION: Dict[MacroTipo, Dict[str, float]] = {
    MacroTipo.hotel: {"organico": 0.42, "papel": 0.12, "plastico": 0.22, "vidrio": 0.16, "aluminio": 0.03, "otros": 0.05},
    MacroTipo.estadio: {"organico": 0.36, "papel": 0.08, "plastico": 0.34, "vidrio": 0.06, "aluminio": 0.10, "otros": 0.06},
    MacroTipo.club_deportivo: {"organico": 0.30, "papel": 0.10, "plastico": 0.38, "vidrio": 0.06, "aluminio": 0.08, "otros": 0.08},
    MacroTipo.plaza_comercial: {"organico": 0.28, "papel": 0.22, "plastico": 0.28, "vidrio": 0.06, "aluminio": 0.04, "otros": 0.12},
    MacroTipo.mercado_publico: {"organico": 0.72, "papel": 0.05, "plastico": 0.12, "vidrio": 0.02, "aluminio": 0.02, "otros": 0.07},
    MacroTipo.hospital: {"organico": 0.24, "papel": 0.18, "plastico": 0.24, "vidrio": 0.08, "aluminio": 0.02, "otros": 0.24},
    MacroTipo.universidad: {"organico": 0.34, "papel": 0.24, "plastico": 0.24, "vidrio": 0.04, "aluminio": 0.04, "otros": 0.10},
    MacroTipo.parque_industrial: {"organico": 0.12, "papel": 0.20, "plastico": 0.30, "vidrio": 0.04, "aluminio": 0.12, "otros": 0.22},
    MacroTipo.edificio_oficinas: {"organico": 0.20, "papel": 0.36, "plastico": 0.20, "vidrio": 0.04, "aluminio": 0.04, "otros": 0.16},
    MacroTipo.evento_masivo: {"organico": 0.30, "papel": 0.06, "plastico": 0.42, "vidrio": 0.06, "aluminio": 0.10, "otros": 0.06},
}


_SEEDS: List[MacroGenerator] = [
    MacroGenerator(
        generator_id="SLP-MAC-MERCADO-001",
        nombre="Mercado publico benchmark SLP",
        tipo=MacroTipo.mercado_publico,
        zm="SLP",
        municipio="slp",
        ubicacion="Centro urbano, referencia aproximada",
        lat=22.1565,
        lon=-100.9855,
        actividad_base=650,
        unidad_actividad="locatarios_equivalentes",
        generacion_estimada_ton_dia=3.8,
        composicion=_DEFAULT_COMPOSITION[MacroTipo.mercado_publico],
        estacionalidad_mensual=[0.95, 0.95, 1.0, 1.02, 1.02, 1.0, 1.0, 1.0, 1.05, 1.05, 1.08, 1.18],
        dias_operacion_anio=360,
        separacion_actual_pct=8,
        separacion_potencial_pct=62,
        pureza_estimada_pct=78,
        fuente="Benchmark sectorial no verificado, no documento historico SLP",
        fuente_tipo=FuenteTipoMacro.benchmark_sectorial,
        confianza=0.48,
        status=MacroStatus.estimado,
    ),
    MacroGenerator(
        generator_id="SLP-MAC-UNIV-001",
        nombre="Campus universitario benchmark SLP",
        tipo=MacroTipo.universidad,
        zm="SLP",
        municipio="slp",
        ubicacion=None,
        actividad_base=12000,
        unidad_actividad="usuarios_dia",
        generacion_estimada_ton_dia=2.4,
        composicion=_DEFAULT_COMPOSITION[MacroTipo.universidad],
        estacionalidad_mensual=[0.9, 1.05, 1.08, 1.08, 1.05, 0.85, 0.55, 0.90, 1.10, 1.10, 1.05, 0.75],
        dias_operacion_anio=245,
        separacion_actual_pct=12,
        separacion_potencial_pct=68,
        pureza_estimada_pct=82,
        fuente="Benchmark sectorial educativo",
        fuente_tipo=FuenteTipoMacro.benchmark_sectorial,
        confianza=0.50,
        status=MacroStatus.pendiente_verificacion,
    ),
    MacroGenerator(
        generator_id="QRO-MAC-PLAZA-001",
        nombre="Plaza comercial benchmark QRO",
        tipo=MacroTipo.plaza_comercial,
        zm="QRO",
        municipio="queretaro",
        ubicacion="Referencia comercial agregada",
        lat=20.5900,
        lon=-100.3900,
        actividad_base=25000,
        unidad_actividad="visitantes_semana",
        generacion_estimada_ton_dia=4.1,
        composicion=_DEFAULT_COMPOSITION[MacroTipo.plaza_comercial],
        dias_operacion_anio=360,
        separacion_actual_pct=10,
        separacion_potencial_pct=60,
        pureza_estimada_pct=80,
        fuente="Benchmark sectorial comercial",
        fuente_tipo=FuenteTipoMacro.benchmark_sectorial,
        confianza=0.47,
        status=MacroStatus.estimado,
    ),
    MacroGenerator(
        generator_id="MTY-MAC-IND-001",
        nombre="Parque industrial benchmark MTY",
        tipo=MacroTipo.parque_industrial,
        zm="MTY",
        municipio="monterrey",
        ubicacion=None,
        actividad_base=80,
        unidad_actividad="naves_equivalentes",
        generacion_estimada_ton_dia=8.0,
        composicion=_DEFAULT_COMPOSITION[MacroTipo.parque_industrial],
        dias_operacion_anio=300,
        separacion_actual_pct=20,
        separacion_potencial_pct=70,
        pureza_estimada_pct=86,
        fuente="Benchmark sectorial industrial",
        fuente_tipo=FuenteTipoMacro.benchmark_sectorial,
        confianza=0.45,
        status=MacroStatus.estimado,
    ),
]

MACROS_DIR = Path(os.environ.get("ALQUIMIA_MACROS_DIR", "/tmp/alquimia_macros"))
GENERATORS_FILE = MACROS_DIR / "generators.json"

_registry: List[MacroGenerator] = []


def _atomic_write_json(path: Path, data: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    tmp.replace(path)


def _persist_registry() -> None:
    _atomic_write_json(GENERATORS_FILE, [g.model_dump(mode="json") for g in _registry])


def _load_registry() -> None:
    global _registry
    if GENERATORS_FILE.exists():
        data = json.loads(GENERATORS_FILE.read_text(encoding="utf-8"))
        _registry = [MacroGenerator(**item) for item in data]
        return
    _registry = deepcopy(_SEEDS)
    _persist_registry()


def configure_storage(directory: Path, reset: bool = False) -> None:
    """Reconfigura almacenamiento para tests o despliegues embebidos."""
    global MACROS_DIR, GENERATORS_FILE
    MACROS_DIR = Path(directory)
    GENERATORS_FILE = MACROS_DIR / "generators.json"
    if reset and GENERATORS_FILE.exists():
        GENERATORS_FILE.unlink()
    _load_registry()


def reset_registry_for_tests() -> None:
    global _registry
    _registry = deepcopy(_SEEDS)
    _persist_registry()


def get_default_composition(tipo: MacroTipo) -> Dict[str, float]:
    return dict(_DEFAULT_COMPOSITION[tipo])


def list_generators(zm: Optional[str] = None, municipio: Optional[str] = None) -> List[MacroGenerator]:
    results = _registry
    if zm:
        zm_key = zm.upper()
        results = [g for g in results if g.zm.upper() == zm_key]
    if municipio:
        municipio_key = municipio.lower()
        results = [g for g in results if (g.municipio or "").lower() == municipio_key]
    return deepcopy(results)


def add_generator(generator: MacroGenerator) -> MacroGenerator:
    if any(g.generator_id == generator.generator_id for g in _registry):
        raise ValueError(f"generator_id duplicado: {generator.generator_id}")
    _registry.append(generator)
    _persist_registry()
    return deepcopy(generator)


def update_generator(generator_id: str, updates: Dict) -> Optional[MacroGenerator]:
    for idx, generator in enumerate(_registry):
        if generator.generator_id == generator_id:
            data = generator.model_dump()
            data.update({k: v for k, v in updates.items() if v is not None})
            updated = MacroGenerator(**data)
            _registry[idx] = updated
            _persist_registry()
            return deepcopy(updated)
    return None


_load_registry()
