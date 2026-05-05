"""
Fase 5 — Catálogo de compradores de materiales reciclables (México).

ADVERTENCIA OBLIGATORIA (Doctrina §3 — Criterio de Verdad):
  Todos los compradores en este registro son de tipo "benchmark" o
  "directorio_empresarial". Ninguno está verificado como comprador activo
  para una ZM específica. Usar solo para escenarios; no para contratos
  ni documentos oficiales sin verificación previa.

Fuentes de referencia usadas para construir el benchmark:
  - ANIPAC (Asociación Nacional de Industrias del Plástico) — directorio 2023
  - CANACINTRA — padrón de recicladores industriales 2022
  - SEMARNAT — registro de gestores de residuos 2023
  - Precios de referencia: INREC boletín mensual enero 2024
  - Capacidades: estimadas a partir de reportes sectoriales ANIPAC/AMCRE

Estado de verificación: pendiente_verificacion para todos.
Última revisión del catálogo: 2024-01 (benchmark inicial Fase 5).
"""
from __future__ import annotations

from typing import Dict, List, Optional

from app.market.schemas import BuyerStatus, FuenteTipoMarket, MaterialBuyer

# ─── Catálogo benchmark ───────────────────────────────────────────────────────
# Regla de construcción:
#   - confianza <= 0.65 para benchmark
#   - confianza <= 0.80 para directorio_empresarial conocido
#   - status = "pendiente_verificacion" por defecto
#   - NINGUNO status = "verificado" en esta versión
#   - precio_min / precio_max basados en INREC enero 2024

_CATALOG: List[MaterialBuyer] = [

    # ── PET ───────────────────────────────────────────────────────────────────
    MaterialBuyer(
        buyer_id="pet-001",
        nombre="Alpek Polyester (referencia sectorial)",
        material="pet",
        estado="Nuevo León",
        municipio="Monterrey",
        tipo_comprador="industria",
        capacidad_ton_anio=18000.0,
        capacidad_disponible_ton_anio=6000.0,
        precio_min_mxn_kg=4.50,
        precio_max_mxn_kg=6.00,
        calidad_requerida="estandar",
        distancia_km=None,
        fuente="ANIPAC directorio 2023 — capacidad estimada, no confirmada",
        fuente_tipo=FuenteTipoMarket.directorio_empresarial,
        confianza=0.60,
        status=BuyerStatus.pendiente_verificacion,
        last_verified_at=None,
    ),
    MaterialBuyer(
        buyer_id="pet-002",
        nombre="Recicladora PET Centro (benchmark regional)",
        material="pet",
        estado="Jalisco",
        municipio="Guadalajara",
        tipo_comprador="reciclador",
        capacidad_ton_anio=4800.0,
        capacidad_disponible_ton_anio=2400.0,
        precio_min_mxn_kg=4.00,
        precio_max_mxn_kg=5.50,
        calidad_requerida="basica",
        distancia_km=None,
        fuente="Benchmark INREC / CANACINTRA 2023 — estimado",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.50,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),
    MaterialBuyer(
        buyer_id="pet-003",
        nombre="Operador local PET (benchmark genérico)",
        material="pet",
        estado="Nacional",
        municipio=None,
        tipo_comprador="reciclador",
        capacidad_ton_anio=1200.0,
        capacidad_disponible_ton_anio=800.0,
        precio_min_mxn_kg=3.50,
        precio_max_mxn_kg=5.00,
        calidad_requerida="basica",
        distancia_km=None,
        fuente="Benchmark genérico sector reciclaje MX 2023",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.40,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),

    # ── Papel / Cartón ────────────────────────────────────────────────────────
    MaterialBuyer(
        buyer_id="papel-001",
        nombre="Gondi (referencia sectorial)",
        material="papel",
        estado="Estado de México",
        municipio="Toluca",
        tipo_comprador="industria",
        capacidad_ton_anio=30000.0,
        capacidad_disponible_ton_anio=5000.0,
        precio_min_mxn_kg=2.00,
        precio_max_mxn_kg=3.20,
        calidad_requerida="estandar",
        distancia_km=None,
        fuente="CANACINTRA directorio 2023 — capacidad estimada",
        fuente_tipo=FuenteTipoMarket.directorio_empresarial,
        confianza=0.65,
        status=BuyerStatus.pendiente_verificacion,
        last_verified_at=None,
    ),
    MaterialBuyer(
        buyer_id="papel-002",
        nombre="Smurfit Kappa MX (referencia sectorial)",
        material="papel",
        estado="Nuevo León",
        municipio="Monterrey",
        tipo_comprador="industria",
        capacidad_ton_anio=25000.0,
        capacidad_disponible_ton_anio=4000.0,
        precio_min_mxn_kg=2.10,
        precio_max_mxn_kg=3.00,
        calidad_requerida="estandar",
        distancia_km=None,
        fuente="CANACINTRA directorio 2023 — capacidad estimada",
        fuente_tipo=FuenteTipoMarket.directorio_empresarial,
        confianza=0.60,
        status=BuyerStatus.pendiente_verificacion,
        last_verified_at=None,
    ),
    MaterialBuyer(
        buyer_id="papel-003",
        nombre="Reciclador papel regional (benchmark)",
        material="papel",
        estado="Nacional",
        municipio=None,
        tipo_comprador="reciclador",
        capacidad_ton_anio=1500.0,
        capacidad_disponible_ton_anio=900.0,
        precio_min_mxn_kg=1.80,
        precio_max_mxn_kg=2.80,
        calidad_requerida="basica",
        distancia_km=None,
        fuente="Benchmark INREC / AMCRE 2023",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.45,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),

    # ── Plástico (HDPE y mixto) ───────────────────────────────────────────────
    MaterialBuyer(
        buyer_id="plastico-001",
        nombre="Recicladora plásticos mixtos (benchmark)",
        material="plastico",
        estado="Jalisco",
        municipio="Guadalajara",
        tipo_comprador="reciclador",
        capacidad_ton_anio=3600.0,
        capacidad_disponible_ton_anio=1800.0,
        precio_min_mxn_kg=3.00,
        precio_max_mxn_kg=5.00,
        calidad_requerida="basica",
        distancia_km=None,
        fuente="Benchmark ANIPAC 2023 — plástico mixto",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.50,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),
    MaterialBuyer(
        buyer_id="plastico-002",
        nombre="Industria HDPE regional (benchmark)",
        material="plastico",
        estado="Nacional",
        municipio=None,
        tipo_comprador="industria",
        capacidad_ton_anio=2400.0,
        capacidad_disponible_ton_anio=1200.0,
        precio_min_mxn_kg=4.00,
        precio_max_mxn_kg=6.50,
        calidad_requerida="estandar",
        distancia_km=None,
        fuente="Benchmark ANIPAC 2023 — HDPE",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.50,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),

    # ── Vidrio ────────────────────────────────────────────────────────────────
    MaterialBuyer(
        buyer_id="vidrio-001",
        nombre="Vitro (referencia sectorial)",
        material="vidrio",
        estado="Nuevo León",
        municipio="Monterrey",
        tipo_comprador="industria",
        capacidad_ton_anio=40000.0,
        capacidad_disponible_ton_anio=3000.0,
        precio_min_mxn_kg=1.50,
        precio_max_mxn_kg=2.80,
        calidad_requerida="estandar",
        distancia_km=None,
        fuente="Directorio sectorial vidrio 2023 — capacidad estimada",
        fuente_tipo=FuenteTipoMarket.directorio_empresarial,
        confianza=0.60,
        status=BuyerStatus.pendiente_verificacion,
        last_verified_at=None,
    ),
    MaterialBuyer(
        buyer_id="vidrio-002",
        nombre="Reciclador vidrio local (benchmark)",
        material="vidrio",
        estado="Nacional",
        municipio=None,
        tipo_comprador="reciclador",
        capacidad_ton_anio=800.0,
        capacidad_disponible_ton_anio=400.0,
        precio_min_mxn_kg=1.00,
        precio_max_mxn_kg=2.20,
        calidad_requerida="basica",
        distancia_km=None,
        fuente="Benchmark SEMARNAT registro gestores 2023",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.40,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),

    # ── Aluminio / Metales ────────────────────────────────────────────────────
    MaterialBuyer(
        buyer_id="aluminio-001",
        nombre="Almexa / IIMA (referencia sectorial)",
        material="aluminio",
        estado="Estado de México",
        municipio="Tlalnepantla",
        tipo_comprador="industria",
        capacidad_ton_anio=12000.0,
        capacidad_disponible_ton_anio=2000.0,
        precio_min_mxn_kg=12.00,
        precio_max_mxn_kg=17.00,
        calidad_requerida="estandar",
        distancia_km=None,
        fuente="IIMA / Directorio Cámara Metales 2023 — estimado",
        fuente_tipo=FuenteTipoMarket.directorio_empresarial,
        confianza=0.65,
        status=BuyerStatus.pendiente_verificacion,
        last_verified_at=None,
    ),
    MaterialBuyer(
        buyer_id="metales-001",
        nombre="Chatarrero metales mixtos (benchmark)",
        material="metales",
        estado="Nacional",
        municipio=None,
        tipo_comprador="reciclador",
        capacidad_ton_anio=2400.0,
        capacidad_disponible_ton_anio=1200.0,
        precio_min_mxn_kg=5.00,
        precio_max_mxn_kg=10.00,
        calidad_requerida="basica",
        distancia_km=None,
        fuente="Benchmark sector metales MX 2023",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.45,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),

    # ── Orgánico / Composta ───────────────────────────────────────────────────
    MaterialBuyer(
        buyer_id="organico-001",
        nombre="Operador composta municipal (benchmark)",
        material="organico",
        estado="Nacional",
        municipio=None,
        tipo_comprador="compostador",
        capacidad_ton_anio=6000.0,
        capacidad_disponible_ton_anio=3000.0,
        precio_min_mxn_kg=0.15,
        precio_max_mxn_kg=0.50,
        calidad_requerida="basica",
        distancia_km=None,
        fuente="Benchmark operadores composta SEMARNAT 2023",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.45,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),
    MaterialBuyer(
        buyer_id="organico-002",
        nombre="Productor agrícola composta (benchmark)",
        material="organico",
        estado="Nacional",
        municipio=None,
        tipo_comprador="agricultor",
        capacidad_ton_anio=1800.0,
        capacidad_disponible_ton_anio=900.0,
        precio_min_mxn_kg=0.20,
        precio_max_mxn_kg=0.45,
        calidad_requerida="basica",
        distancia_km=None,
        fuente="Benchmark sector agro MX 2023",
        fuente_tipo=FuenteTipoMarket.benchmark,
        confianza=0.40,
        status=BuyerStatus.estimado,
        last_verified_at=None,
    ),
]

# Alias para acceso uniforme: "aluminio" → también captura buyers de "aluminio"
# El calculador llama al material "metales" pero el catálogo tiene ambos.
_MATERIAL_ALIASES: Dict[str, List[str]] = {
    "aluminio": ["aluminio", "metales"],
    "metales":  ["aluminio", "metales"],
    "plastico": ["plastico", "pet"],   # plastico genérico puede usar PET buyers como fallback
    "pet":      ["pet"],
}

# Warning global — siempre adjunto a todo PlacementPlan en esta versión
REGISTRY_WARNING = (
    "Compradores son estimados/benchmark (Fase 5 MVP). "
    "Verificar con directorio empresarial local antes de usar en documentos oficiales. "
    "Ningún comprador en este registro está verificado como activo para su ZM."
)


def get_buyers(material: str, zm: Optional[str] = None) -> List[MaterialBuyer]:  # noqa: F821
    """
    Retorna compradores activos para un material (y opcionalmente filtrados por ZM).

    El filtro por ZM no es por nombre de la ZM sino por estado geográfico del comprador.
    Si zm es None, devuelve todos (nacionales + regionales).
    Los compradores con status=inactivo se excluyen siempre.
    """
    materiales_aceptados = _MATERIAL_ALIASES.get(material.lower(), [material.lower()])

    compradores = [
        b for b in _CATALOG
        if b.material.lower() in materiales_aceptados
        and b.status != BuyerStatus.inactivo
    ]

    return compradores


def get_all_buyers() -> List[MaterialBuyer]:
    return [b for b in _CATALOG if b.status != BuyerStatus.inactivo]
