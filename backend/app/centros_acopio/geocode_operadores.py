"""Geocodifica instalaciones de operadores logísticos vía Google Maps."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from app.google.config import resolve_geocoding_api_key, resolve_google_places_api_key
from app.google.geocoding_client import geocode_address, normalize_geocode_result
from app.repo_paths import repo_root

logger = logging.getLogger(__name__)

OPERADORES_DIR = repo_root() / "data" / "geo" / "operadores_logisticos"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _places_search(query: str) -> dict[str, Any] | None:
    key = resolve_google_places_api_key()
    if not key:
        return None
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            "https://maps.googleapis.com/maps/api/place/textsearch/json",
            params={"query": query, "language": "es", "region": "mx", "key": key},
        )
        r.raise_for_status()
        data = r.json()
    results = data.get("results") or []
    if not results:
        return None
    place = results[0]
    loc = place.get("geometry", {}).get("location", {})
    return {
        "formatted_address": place.get("formatted_address"),
        "lat": loc.get("lat"),
        "lon": loc.get("lng"),
        "place_id": place.get("place_id"),
        "source": "google_places",
    }


async def resolve_instalacion_location(inst: dict, operador: dict) -> dict[str, Any] | None:
    if not resolve_geocoding_api_key() and not resolve_google_places_api_key():
        return None

    nombre = inst.get("nombre", "")
    direccion = inst.get("direccion", "")
    municipio = inst.get("municipio", "")
    estado = inst.get("estado", "")
    op_nombre = operador.get("nombre") or inst.get("operador_nombre") or ""
    alias = operador.get("alias") or ""

    queries = [
        f"{direccion}, {municipio}, {estado}, México",
        f"{nombre}, {municipio}, {estado}, México",
        f"{op_nombre} {alias} {municipio} México".strip(),
    ]

    for q in queries:
        if not q.strip():
            continue
        try:
            rows = await geocode_address(q)
            if rows:
                norm = normalize_geocode_result(rows[0])
                norm["source"] = "google_geocoding"
                return norm
        except Exception as exc:
            logger.debug("Geocode falló %s: %s", q[:60], exc)

    for q in queries[:2]:
        place = await _places_search(q)
        if place and place.get("lat") is not None:
            return place
    return None


async def geocode_operadores_file(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    operador = payload.get("operador", {})
    updated = 0
    for inst in payload.get("instalaciones", []):
        loc = await resolve_instalacion_location(inst, operador)
        if not loc or loc.get("lat") is None:
            continue
        inst["lat"] = loc["lat"]
        inst["lon"] = loc["lon"]
        if loc.get("formatted_address"):
            inst["direccion"] = loc["formatted_address"]
        if loc.get("place_id"):
            inst["place_id"] = loc["place_id"]
        inst["fuente"] = loc.get("source", "google_geocoding")
        inst["score_confianza"] = 0.85 if loc.get("source") == "google_geocoding" else 0.78
        inst["notas"] = (
            f"Geocodificado Google Maps ({inst['fuente']}). "
            + (inst.get("notas") or "")
        )[:280]
        updated += 1

    payload["updated_at"] = _now_iso()
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"file": path.name, "updated": updated, "total": len(payload.get("instalaciones", []))}


async def geocode_operadores(clave_inegi: str | None = None) -> list[dict[str, Any]]:
    paths = sorted(OPERADORES_DIR.glob("*.json"))
    if clave_inegi:
        paths = [OPERADORES_DIR / f"{clave_inegi.zfill(5)}.json"]
    results = []
    for path in paths:
        if path.is_file():
            results.append(await geocode_operadores_file(path))
    return results
