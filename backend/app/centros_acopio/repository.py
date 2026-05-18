"""
CentroAcopioRepository — Almacén en memoria de Centros de Acopio.

Arquitectura:
- Tienda en memoria (dict por centro_id) + seeding de datos demo al arrancar.
- En producción futura: reemplazar _store con una capa SQLite / Postgres.
- Sync adapters: PlacesSync (Google Places) y DenueSync (INEGI DENUE).
  Ambos son feature-flag controlled (PLACES_SYNC_ENABLED).

Operaciones:
  get(centro_id)                → CentroAcopio | None
  list(zm, municipio, material) → List[CentroAcopio]
  upsert(centro)                → CentroAcopio
  delete(centro_id)             → bool
  sync_from_places(zm)          → int  (# de registros sincronizados)
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.agents.schemas import (
    CentroAcopio,
    CentroAcopioMaterial,
    CentroAcopioTipo,
)

logger = logging.getLogger(__name__)

# ─── Tienda en memoria ────────────────────────────────────────────────────────
_store: Dict[str, CentroAcopio] = {}


# ─── Datos demo (seed) ───────────────────────────────────────────────────────

def _seed_demo() -> None:
    """Puebla el store con centros demo para SLP, QRO, MTY."""
    demos = [
        CentroAcopio(
            centro_id="ca-slp-001",
            nombre="EcoPlanta San Luis",
            tipo=CentroAcopioTipo.empresa_recicladora,
            direccion="Av. Industrial 450, Zona Industrial",
            municipio="San Luis Potosí",
            estado="San Luis Potosí",
            zm="SLP",
            lat=22.1565, lon=-100.9855,
            materiales=[
                CentroAcopioMaterial.pet, CentroAcopioMaterial.hdpe,
                CentroAcopioMaterial.aluminio, CentroAcopioMaterial.carton,
            ],
            precio_compra={"pet": 7.5, "hdpe": 5.0, "aluminio": 22.0, "carton": 1.8},
            telefono="444-123-4567",
            horario="Lunes-Viernes 8:00-17:00, Sábados 8:00-13:00",
            acepta_publico=True,
            acepta_empresa=True,
            fuente="denue",
            verificado=True,
            score_confianza=0.85,
        ),
        CentroAcopio(
            centro_id="ca-slp-002",
            nombre="Punto Verde Tangamanga",
            tipo=CentroAcopioTipo.punto_verde,
            direccion="Parque Tangamanga I, entrada norte",
            municipio="San Luis Potosí",
            estado="San Luis Potosí",
            zm="SLP",
            lat=22.1490, lon=-101.0010,
            materiales=[
                CentroAcopioMaterial.pet, CentroAcopioMaterial.carton,
                CentroAcopioMaterial.papel, CentroAcopioMaterial.vidrio,
            ],
            precio_compra={},
            horario="Sábados y Domingos 9:00-14:00",
            acepta_publico=True,
            acepta_empresa=False,
            fuente="usuario",
            verificado=False,
            score_confianza=0.60,
        ),
        CentroAcopio(
            centro_id="ca-slp-003",
            nombre="Recicla Soledad",
            tipo=CentroAcopioTipo.chatarreria,
            direccion="Blvd. Manantiales 1200, Soledad de Graciano Sánchez",
            municipio="Soledad de Graciano Sánchez",
            estado="San Luis Potosí",
            zm="SLP",
            lat=22.1900, lon=-100.9320,
            materiales=[
                CentroAcopioMaterial.aluminio, CentroAcopioMaterial.acero,
                CentroAcopioMaterial.pet, CentroAcopioMaterial.hdpe,
            ],
            precio_compra={"aluminio": 20.0, "acero": 4.5, "pet": 7.0},
            telefono="444-987-6543",
            horario="Lunes-Sábado 8:00-18:00",
            acepta_publico=True,
            acepta_empresa=True,
            fuente="usuario",
            verificado=False,
            score_confianza=0.55,
        ),
        CentroAcopio(
            centro_id="ca-slp-004",
            nombre="Punto ECOLECT — Baterías y Electrónicos SLP",
            tipo=CentroAcopioTipo.banco_de_residuos,
            direccion="Plaza San Luis, nivel PB, San Luis Potosí",
            municipio="San Luis Potosí",
            estado="San Luis Potosí",
            zm="SLP",
            lat=22.1520, lon=-100.9784,
            materiales=[
                CentroAcopioMaterial.baterias, CentroAcopioMaterial.electronico,
                CentroAcopioMaterial.aceite,
            ],
            precio_compra={},
            horario="Todos los días 10:00-21:00",
            acepta_publico=True,
            acepta_empresa=False,
            fuente="places_api",
            verificado=True,
            score_confianza=0.80,
        ),
        CentroAcopio(
            centro_id="ca-qro-001",
            nombre="SMEC Querétaro — Centro de Reciclaje",
            tipo=CentroAcopioTipo.empresa_recicladora,
            direccion="Parque Industrial Benito Juárez, Querétaro",
            municipio="Querétaro",
            estado="Querétaro",
            zm="QRO",
            lat=20.5888, lon=-100.3899,
            materiales=[
                CentroAcopioMaterial.pet, CentroAcopioMaterial.aluminio,
                CentroAcopioMaterial.carton, CentroAcopioMaterial.papel,
                CentroAcopioMaterial.hdpe,
            ],
            precio_compra={"pet": 8.0, "aluminio": 23.0, "carton": 2.0},
            telefono="442-567-8901",
            horario="Lunes-Viernes 7:00-17:00",
            acepta_publico=False,
            acepta_empresa=True,
            fuente="denue",
            verificado=True,
            score_confianza=0.88,
        ),
        CentroAcopio(
            centro_id="ca-mty-001",
            nombre="Ecolón Monterrey",
            tipo=CentroAcopioTipo.empresa_recicladora,
            direccion="Av. Fundidora 501, Monterrey, NL",
            municipio="Monterrey",
            estado="Nuevo León",
            zm="MTY",
            lat=25.6780, lon=-100.3066,
            materiales=[
                CentroAcopioMaterial.pet, CentroAcopioMaterial.aluminio,
                CentroAcopioMaterial.carton, CentroAcopioMaterial.vidrio,
                CentroAcopioMaterial.tetrapak,
            ],
            precio_compra={"pet": 7.8, "aluminio": 24.0, "carton": 1.9, "tetrapak": 1.2},
            telefono="818-555-0100",
            horario="Lunes-Sábado 8:00-18:00",
            acepta_publico=True,
            acepta_empresa=True,
            fuente="places_api",
            verificado=True,
            score_confianza=0.90,
        ),
    ]
    for c in demos:
        _store[c.centro_id] = c
    logger.info(f"CentroAcopio seed: {len(_store)} centros cargados.")


_seed_demo()


# ─── CRUD ─────────────────────────────────────────────────────────────────────

def get(centro_id: str) -> Optional[CentroAcopio]:
    return _store.get(centro_id)


def list_centros(
    zm: Optional[str] = None,
    municipio: Optional[str] = None,
    material: Optional[CentroAcopioMaterial] = None,
    acepta_empresa: Optional[bool] = None,
    verificado_only: bool = False,
) -> List[CentroAcopio]:
    results = list(_store.values())
    if zm:
        results = [c for c in results if c.zm and c.zm.upper() == zm.upper()]
    if municipio:
        results = [c for c in results
                   if municipio.lower() in c.municipio.lower()]
    if material:
        results = [c for c in results if material in c.materiales]
    if acepta_empresa is not None:
        results = [c for c in results if c.acepta_empresa == acepta_empresa]
    if verificado_only:
        results = [c for c in results if c.verificado]
    # Ordenar por score_confianza desc, luego verificado primero
    results.sort(key=lambda c: (c.verificado, c.score_confianza), reverse=True)
    return results


def upsert(centro: CentroAcopio) -> CentroAcopio:
    centro.updated_at = datetime.now(timezone.utc)
    _store[centro.centro_id] = centro
    return centro


def delete(centro_id: str) -> bool:
    if centro_id in _store:
        del _store[centro_id]
        return True
    return False


def count() -> int:
    return len(_store)


# ─── Sync adapters ────────────────────────────────────────────────────────────

async def sync_from_places(zm: str, api_key: str) -> int:
    """
    Sincroniza CentroAcopio desde Google Places API para la ZM dada.
    Busca 'centro de reciclaje', 'punto verde', 'chatarreria' en la zona.
    Retorna el número de registros nuevos/actualizados.

    NOTE: Feature-flag controlled via PLACES_SYNC_ENABLED.
    """
    try:
        import httpx
    except ImportError:
        logger.warning("httpx no disponible — Places sync cancelado.")
        return 0

    queries = [
        f"centro de reciclaje {zm}",
        f"punto verde {zm}",
        f"chatarrería {zm}",
        f"recicladora {zm}",
    ]

    synced = 0
    async with httpx.AsyncClient(timeout=10.0) as client:
        for query in queries:
            try:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/place/textsearch/json",
                    params={"query": query, "language": "es", "key": api_key},
                )
                if resp.status_code != 200:
                    continue
                data = resp.json()
                for place in data.get("results", [])[:5]:
                    centro_id = f"places-{place.get('place_id', str(uuid.uuid4())[:8])}"
                    location  = place.get("geometry", {}).get("location", {})
                    centro = CentroAcopio(
                        centro_id=centro_id,
                        nombre=place.get("name", "Sin nombre"),
                        tipo=_infer_tipo(place.get("types", [])),
                        direccion=place.get("formatted_address", ""),
                        municipio=_extract_municipio(place.get("formatted_address", "")),
                        estado="",
                        zm=zm.upper(),
                        lat=location.get("lat"),
                        lon=location.get("lng"),
                        materiales=[],  # no inferible solo de Places
                        fuente="places_api",
                        verificado=False,
                        score_confianza=0.65,
                    )
                    upsert(centro)
                    synced += 1
            except Exception as exc:
                logger.warning(f"Places sync error for '{query}': {exc}")

    logger.info(f"Places sync: {synced} centros sincronizados para ZM={zm}")
    return synced


def _infer_tipo(types: List[str]) -> CentroAcopioTipo:
    joined = " ".join(types).lower()
    if "establishment" in joined and "store" in joined:
        return CentroAcopioTipo.empresa_recicladora
    return CentroAcopioTipo.otro


def _extract_municipio(address: str) -> str:
    """Extrae el nombre de municipio de una dirección formateada."""
    parts = [p.strip() for p in address.split(",")]
    # La ciudad suele estar en posición -3 o -2 antes del código postal
    if len(parts) >= 3:
        return parts[-3] if len(parts) >= 3 else parts[-2]
    return address.split(",")[0] if "," in address else address
