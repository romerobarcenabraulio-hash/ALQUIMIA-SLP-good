"""Propuesta M06 → nodos geo_centro_acopio (fase 2 infra graph)."""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.agents.schemas import CentroAcopio, CentroAcopioRolInstalacion, CentroAcopioTipo
from app.centros_acopio import geo_db


def mix_cas_to_geo_nodes(
    db: Session,
    *,
    clave_inegi: str,
    zm: str,
    municipio: str,
    estado: str,
    mix: dict[str, int],
) -> list[dict[str, Any]]:
    """
    Convierte mix M06 (P/M/G) en nodos propuestos sin coords inventadas.
    Solo persiste metadatos; coords se llenan cuando DENUE/Places aporten.
    """
    size_map = {"P": ("pequeño", 5), "M": ("mediano", 15), "G": ("grande", 50)}
    nodes: list[dict[str, Any]] = []
    for key, count in mix.items():
        if count <= 0 or key not in size_map:
            continue
        label, cap = size_map[key]
        for i in range(count):
            centro_id = f"prop-{clave_inegi.zfill(5)}-{key.lower()}-{i + 1}"
            centro = CentroAcopio(
                centro_id=centro_id,
                nombre=f"CA propuesto {label} #{i + 1} — {municipio}",
                tipo=CentroAcopioTipo.centro_municipal,
                direccion="Por definir — plan M06",
                municipio=municipio,
                estado=estado,
                clave_inegi=clave_inegi.zfill(5),
                zm=zm.upper(),
                lat=None,
                lon=None,
                materiales=[],
                acepta_publico=True,
                acepta_empresa=True,
                rol_instalacion=CentroAcopioRolInstalacion.centro_acopio,
                fuente="m06_propuesto",
                verificado=False,
                score_confianza=0.35,
                notas=f"Capacidad ref. {cap} t/día · estado=propuesto",
            )
            geo_db.upsert_centro(db, centro)
            nodes.append(centro.model_dump(mode="json"))
    db.flush()
    return nodes


def export_infra_graph(
    db: Session,
    *,
    zm: str,
    clave_inegi: str | None = None,
) -> dict[str, Any]:
    """Grafo colonia→CA→recicladora (metadatos exportables)."""
    centros = geo_db.list_centros_db(db, zm=zm, clave_inegi=clave_inegi)
    acopio = [c for c in centros if not c.es_operador_principal]
    operador = [c for c in centros if c.es_operador_principal]
    propuestos = [c for c in acopio if c.fuente == "m06_propuesto"]
    return {
        "zm": zm.upper(),
        "clave_inegi": clave_inegi,
        "nodes": {
            "centros_acopio": [c.model_dump(mode="json") for c in acopio if c.fuente != "m06_propuesto"],
            "centros_propuestos": [c.model_dump(mode="json") for c in propuestos],
            "operador": [c.model_dump(mode="json") for c in operador],
        },
        "edges_note": "Colonias territoriales → CA → recicladora (frontend recicladorasCatalog)",
    }
