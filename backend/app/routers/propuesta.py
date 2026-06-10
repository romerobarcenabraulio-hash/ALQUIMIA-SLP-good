"""
Router: /propuesta

Personalized Proposal Engine — Sprint 24.

For each municipio, generates a city-specific circular economy business case:
  - City waste profile (population, generation rate, composition)
  - DENUE companies in the city (recyclers, collectors, anchor buyers)
  - Circularity gap analysis (current recovery % vs potential %)
  - Revenue projections per service tier (MXN)
  - Recommended tier based on city size
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.routers.auth import UserInfo, get_current_user

router = APIRouter(prefix="/propuesta", tags=["propuesta"])
logger = logging.getLogger(__name__)

# ─── Size tiers (population-based) ───────────────────────────────────────────

_TIERS: List[Dict[str, Any]] = [
    {
        "id": "diagnostico",
        "nombre": "Diagnóstico Circular",
        "descripcion": "Evaluación completa del perfil de residuos, brechas y oportunidades. "
                       "Incluye índice de circularidad baseline, mapa de actores y hoja de ruta 36 meses.",
        "entregables": [
            "Índice de Circularidad Municipal (ICM) certificado",
            "Diagnóstico de 8 corrientes de residuos",
            "Mapa georreferenciado de actores DENUE",
            "Hoja de ruta priorizada (36 meses)",
            "Informe ejecutivo para cabildo",
        ],
        "precio_min_mxn": 350_000,
        "precio_max_mxn": 1_200_000,
        "duracion_meses": 3,
        "color": "#3B6D11",
        "tag": "Más elegido",
    },
    {
        "id": "implementacion",
        "nombre": "Implementación Piloto",
        "descripcion": "Diseño e implementación de la infraestructura de separación y acopio. "
                       "Convenios con empresas ancla identificadas en DENUE.",
        "entregables": [
            "Todo lo de Diagnóstico",
            "Diseño de rutas y centros de acopio",
            "Convenios formalizados con 3-5 empresas ancla",
            "Programa de educación municipal",
            "Panel de monitoreo en tiempo real",
        ],
        "precio_min_mxn": 800_000,
        "precio_max_mxn": 4_500_000,
        "duracion_meses": 12,
        "color": "#1C4B8F",
        "tag": "Mayor impacto",
    },
    {
        "id": "operacion",
        "nombre": "Operación Continua",
        "descripcion": "Monitoreo mensual, actualización de índice, reportes para SEMARNAt y soporte técnico permanente.",
        "entregables": [
            "Actualización mensual del ICM",
            "Reportes normativos (SEMARNAT, LGPGIR)",
            "Soporte a licitaciones y fondos federales",
            "Alertas de oportunidad de mercado",
            "Acceso ilimitado a plataforma ALQUIMIA",
        ],
        "precio_min_mxn": 80_000,
        "precio_max_mxn": 400_000,
        "duracion_meses": None,
        "color": "#7B3F00",
        "tag": "Mensual",
    },
]

# Mix de corrientes típico por región (fallback)
_DEFAULT_MIX = {
    "organico": 0.52,
    "papel": 0.09,
    "carton": 0.06,
    "plastico": 0.11,
    "vidrio": 0.07,
    "metal": 0.04,
    "textil": 0.03,
    "otros": 0.08,
}

# Precio de mercado secundario promedio (MXN/ton) por corriente
_PRECIO_MERCADO_MXN: Dict[str, float] = {
    "organico": 300,      # composta
    "papel": 1_800,
    "carton": 1_500,
    "plastico": 3_500,
    "vidrio": 900,
    "metal": 5_200,
    "textil": 2_000,
}

# Generation rate kg/person/day by state (SEMARNAT 2022)
_GEN_PERCAPITA_KG_DIA: Dict[str, float] = {
    "San Luis Potosí": 0.82,
    "Jalisco": 0.98,
    "CDMX": 1.25,
    "Nuevo León": 1.10,
    "Guanajuato": 0.88,
    "Puebla": 0.79,
    "default": 0.85,
}


# ─── Schemas ──────────────────────────────────────────────────────────────────

class EmpresaLocal(BaseModel):
    nombre: str
    actividad: str
    scian: str
    rol: str  # "reciclador", "acopiador", "comprador_ancla"
    municipio: str


class PerfilResiduos(BaseModel):
    poblacion: int
    generacion_ton_dia: float
    mix_corrientes: Dict[str, float]
    tasa_recuperacion_actual_pct: float
    fuente_poblacion: str
    fuente_generacion: str


class BrechaCircular(BaseModel):
    ton_recuperables_perdidas_dia: float
    pct_recuperable_no_capturado: float
    ingreso_potencial_anual_mxn: float
    tasa_actual_pct: float
    tasa_potencial_pct: float


class TierPropuesta(BaseModel):
    id: str
    nombre: str
    descripcion: str
    entregables: List[str]
    precio_min_mxn: int
    precio_max_mxn: int
    precio_recomendado_mxn: int
    duracion_meses: Optional[int]
    color: str
    tag: str
    recomendado: bool


class PropuestaPersonalizada(BaseModel):
    municipio_nombre: str
    estado: str
    perfil: PerfilResiduos
    empresas_locales: List[EmpresaLocal]
    brecha: BrechaCircular
    tiers: List[TierPropuesta]
    tier_recomendado_id: str
    resumen_oportunidad: str
    advertencias: List[str]


class GenerarPropuestaRequest(BaseModel):
    municipio_nombre: str
    estado: str
    cve_municipio: Optional[str] = None
    poblacion_override: Optional[int] = None


# ─── Helper functions ─────────────────────────────────────────────────────────

def _scale_tier_price(tier: Dict[str, Any], poblacion: int) -> int:
    """Scale tier price within its range based on population."""
    # Small (<50k): lower quartile, Large (>500k): upper quartile
    if poblacion < 50_000:
        factor = 0.25
    elif poblacion < 100_000:
        factor = 0.40
    elif poblacion < 250_000:
        factor = 0.60
    elif poblacion < 500_000:
        factor = 0.80
    else:
        factor = 1.0

    rango = tier["precio_max_mxn"] - tier["precio_min_mxn"]
    return int(tier["precio_min_mxn"] + rango * factor)


def _recommended_tier(poblacion: int) -> str:
    if poblacion < 100_000:
        return "diagnostico"
    elif poblacion < 500_000:
        return "implementacion"
    else:
        return "operacion"


def _compute_brecha(poblacion: int, estado: str, tasa_actual: float = 0.12) -> tuple[PerfilResiduos, BrechaCircular]:
    gen_kg = _GEN_PERCAPITA_KG_DIA.get(estado, _GEN_PERCAPITA_KG_DIA["default"])
    gen_ton_dia = round(poblacion * gen_kg / 1000, 2)

    # Recoverable fraction from mix
    mix = _DEFAULT_MIX
    pct_recuperable = sum(
        frac for nombre, frac in mix.items()
        if nombre in _PRECIO_MERCADO_MXN
    )
    ton_recuperable_dia = gen_ton_dia * pct_recuperable
    ton_capturada_dia = ton_recuperable_dia * tasa_actual
    ton_perdida_dia = ton_recuperable_dia - ton_capturada_dia

    # Revenue from potential recovery (weighted average price)
    ingreso_potencial_dia = sum(
        gen_ton_dia * frac * _PRECIO_MERCADO_MXN[nombre]
        for nombre, frac in mix.items()
        if nombre in _PRECIO_MERCADO_MXN
    )
    ingreso_potencial_anual = round(ingreso_potencial_dia * 365)

    perfil = PerfilResiduos(
        poblacion=poblacion,
        generacion_ton_dia=gen_ton_dia,
        mix_corrientes=mix,
        tasa_recuperacion_actual_pct=round(tasa_actual * 100, 1),
        fuente_poblacion="CONAPO 2020 (estimado)",
        fuente_generacion=f"SEMARNAT 2022 — {gen_kg} kg/hab/día ({estado})",
    )

    brecha = BrechaCircular(
        ton_recuperables_perdidas_dia=round(ton_perdida_dia, 2),
        pct_recuperable_no_capturado=round((1 - tasa_actual) * pct_recuperable * 100, 1),
        ingreso_potencial_anual_mxn=ingreso_potencial_anual,
        tasa_actual_pct=round(tasa_actual * 100, 1),
        tasa_potencial_pct=round(pct_recuperable * 80 * 100 / 100, 1),  # 80% of recoverable
    )

    return perfil, brecha


def _build_resumen(municipio: str, poblacion: int, brecha: BrechaCircular, n_empresas: int) -> str:
    mxn_m = brecha.ingreso_potencial_anual_mxn / 1_000_000
    return (
        f"{municipio} genera {brecha.ton_recuperables_perdidas_dia:.1f} ton/día de materiales recuperables "
        f"que actualmente van a relleno sanitario. Con las {n_empresas} empresas locales identificadas "
        f"y el programa ALQUIMIA, el municipio puede capturar hasta "
        f"MXN ${mxn_m:.1f}M anuales en valor de materiales y reducir costos de disposición."
    )


# ─── DENUE helpers ────────────────────────────────────────────────────────────

_SCIAN_ROL: Dict[str, str] = {
    "562111": "recolector",
    "562112": "acopiador",
    "562119": "recolector",
    "381111": "comprador_ancla",
    "381191": "comprador_ancla",
}

_SCIAN_LABEL: Dict[str, str] = {
    "562111": "Recolección de residuos no peligrosos",
    "562112": "Acopio y reciclaje de materiales",
    "562119": "Otros servicios de recolección",
    "381111": "Comercio mayorista de desechos metálicos",
    "381191": "Comercio mayorista de otros desperdicios",
}


async def _get_empresas(municipio_nombre: str, cve_municipio: Optional[str]) -> List[EmpresaLocal]:
    try:
        from app.data.adapters.denue import DenueAdapter
        adapter = DenueAdapter()
        # get_centros_acopio_municipio is sync — run in thread pool
        loop = asyncio.get_event_loop()
        cve = cve_municipio or "24028"  # default SLP capital
        result = await loop.run_in_executor(
            None, lambda: adapter.get_centros_acopio_municipio(cve)
        )
        raw = result.get("establecimientos", [])
        empresas = []
        for e in raw[:20]:
            scian = str(e.get("actividad_scian", ""))
            empresas.append(EmpresaLocal(
                nombre=e.get("nombre", "Empresa"),
                actividad=_SCIAN_LABEL.get(scian, e.get("actividad_label", "")),
                scian=scian,
                rol=_SCIAN_ROL.get(scian, "actor"),
                municipio=e.get("municipio", municipio_nombre),
            ))
        return empresas
    except Exception as exc:
        logger.warning(f"DENUE fetch failed for {municipio_nombre}: {exc}")
        return []


# ─── Population lookup ────────────────────────────────────────────────────────

async def _get_poblacion(municipio_nombre: str, estado: str) -> tuple[int, str]:
    """Return (population, fuente_nota). Falls back to state-average estimate."""
    try:
        from app.data.adapters.inegi import InegiAdapter
        adapter = InegiAdapter()
        result = await adapter.fetch_poblacion_municipio(municipio_nombre, estado)
        if result and result.get("poblacion"):
            return int(result["poblacion"]), "INEGI Censo 2020 (oficial)"
    except Exception as exc:
        logger.warning(f"INEGI poblacion lookup failed: {exc}")

    # Coarse fallback by name-matching common cities
    fallback_map: Dict[str, int] = {
        "san luis potosí": 1_040_443,
        "soledad de graciano sánchez": 368_516,
        "ciudad valles": 196_121,
        "matehuala": 105_617,
        "guadalajara": 1_385_629,
        "monterrey": 1_135_512,
        "puebla": 1_692_181,
    }
    key = municipio_nombre.lower().strip()
    for k, v in fallback_map.items():
        if k in key or key in k:
            return v, "INEGI Censo 2020 (catálogo offline)"
    # Last resort: median Mexican municipality ~50k
    return 50_000, "Estimado CONAPO (municipio sin match en catálogo)"


# ─── Main endpoint ────────────────────────────────────────────────────────────

@router.post("/generate", response_model=PropuestaPersonalizada)
async def generate_propuesta(
    req: GenerarPropuestaRequest,
    user: UserInfo = Depends(get_current_user),
):
    """
    Generate a personalized circular economy proposal for a municipio.
    Returns waste profile, local companies, circularity gap, and tier pricing.
    """
    advertencias: List[str] = []

    # 1. Get population (parallel with DENUE)
    poblacion_task = asyncio.create_task(
        _get_poblacion(req.municipio_nombre, req.estado)
    )
    empresas_task = asyncio.create_task(
        _get_empresas(req.municipio_nombre, req.cve_municipio)
    )

    (raw_poblacion, fuente_pob), empresas = await asyncio.gather(
        poblacion_task, empresas_task
    )

    poblacion = req.poblacion_override or raw_poblacion
    if req.poblacion_override:
        advertencias.append("Población proporcionada manualmente — no verificada con INEGI.")
    if not empresas:
        advertencias.append(
            "No se encontraron empresas DENUE en este municipio. "
            "Configura INEGI_DENUE_TOKEN para búsqueda en vivo."
        )

    # 2. Compute waste profile and circularity gap
    perfil, brecha = _compute_brecha(poblacion, req.estado)
    perfil.fuente_poblacion = fuente_pob

    # 3. Build tier proposals scaled to city size
    tier_rec = _recommended_tier(poblacion)
    tiers = []
    for t in _TIERS:
        precio_rec = _scale_tier_price(t, poblacion)
        tiers.append(TierPropuesta(
            id=t["id"],
            nombre=t["nombre"],
            descripcion=t["descripcion"],
            entregables=t["entregables"],
            precio_min_mxn=t["precio_min_mxn"],
            precio_max_mxn=t["precio_max_mxn"],
            precio_recomendado_mxn=precio_rec,
            duracion_meses=t["duracion_meses"],
            color=t["color"],
            tag=t["tag"],
            recomendado=(t["id"] == tier_rec),
        ))

    resumen = _build_resumen(req.municipio_nombre, poblacion, brecha, len(empresas))

    return PropuestaPersonalizada(
        municipio_nombre=req.municipio_nombre,
        estado=req.estado,
        perfil=perfil,
        empresas_locales=empresas,
        brecha=brecha,
        tiers=tiers,
        tier_recomendado_id=tier_rec,
        resumen_oportunidad=resumen,
        advertencias=advertencias,
    )


@router.get("/public/{municipio_nombre}")
async def get_propuesta_publica(
    municipio_nombre: str,
    estado: str = "San Luis Potosí",
):
    """
    Public (no auth) lightweight proposal for landing/marketing pages.
    Returns only aggregate numbers — no DENUE company list.
    """
    poblacion_defaults: Dict[str, int] = {
        "san luis potosí": 1_040_443,
        "soledad": 368_516,
        "ciudad valles": 196_121,
        "matehuala": 105_617,
    }
    key = municipio_nombre.lower()
    poblacion = next((v for k, v in poblacion_defaults.items() if k in key), 80_000)
    gen_kg = _GEN_PERCAPITA_KG_DIA.get(estado, _GEN_PERCAPITA_KG_DIA["default"])
    gen_ton_dia = round(poblacion * gen_kg / 1000, 2)
    pct_rec = 0.52  # organic fraction — biggest opportunity
    ingreso_anual = int(gen_ton_dia * pct_rec * 0.65 * _PRECIO_MERCADO_MXN["organico"] * 365)

    return {
        "municipio": municipio_nombre,
        "estado": estado,
        "poblacion_estimada": poblacion,
        "generacion_ton_dia": gen_ton_dia,
        "ingreso_potencial_anual_mxn": ingreso_anual,
        "tier_sugerido": _recommended_tier(poblacion),
        "nota": "Estimaciones basadas en promedios SEMARNAT/CONAPO. Solicita diagnóstico para datos precisos.",
    }
