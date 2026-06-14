"""§4 ContainerInventory service — register, import, and query containers."""
from __future__ import annotations

import csv
import io
import uuid
from typing import Any, Optional

from app.models.container import Container

# Required CSV columns for bulk import
CSV_REQUIRED_COLS = {"codigo", "tipo", "colonia"}
CSV_OPTIONAL_COLS = {
    "capacidad_litros", "calle", "latitud", "longitud", "zona",
    "estado_fisico", "tiene_tapa", "tiene_separacion", "accesible",
    "frecuencia_recoleccion", "notas",
}
VALID_TIPOS = {
    "contenedor_metalico", "contenedor_plastico", "papelera",
    "contenedor_organico", "contenedor_reciclaje", "camion_compactador", "otro",
}
VALID_ESTADOS = {"operativo", "danado", "saturado", "fuera_de_servicio"}


def _bool(val: Any) -> bool:
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in {"1", "true", "si", "sí", "yes"}


def _float_or_none(val: Any) -> Optional[float]:
    try:
        return float(val) if val not in (None, "", "null") else None
    except (ValueError, TypeError):
        return None


def register_container(tenant_id: str, data: dict, db) -> dict:
    """Register a single container (field survey or manual entry).

    Returns dict with container_id and status. Gracefully degrades if db=None.
    """
    if db is None:
        return {"status": "no_db", "container_id": None}

    tipo = data.get("tipo", "otro")
    if tipo not in VALID_TIPOS:
        tipo = "otro"

    estado = data.get("estado_fisico", "operativo")
    if estado not in VALID_ESTADOS:
        estado = "operativo"

    c = Container(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        codigo=str(data.get("codigo", "")).strip() or f"CTR-{uuid.uuid4().hex[:6].upper()}",
        tipo=tipo,
        capacidad_litros=_float_or_none(data.get("capacidad_litros")),
        colonia=data.get("colonia"),
        calle=data.get("calle"),
        latitud=_float_or_none(data.get("latitud")),
        longitud=_float_or_none(data.get("longitud")),
        zona=data.get("zona"),
        estado_fisico=estado,
        tiene_tapa=_bool(data.get("tiene_tapa", True)),
        tiene_separacion=_bool(data.get("tiene_separacion", False)),
        accesible=_bool(data.get("accesible", True)),
        frecuencia_recoleccion=data.get("frecuencia_recoleccion"),
        source=data.get("source", "field_survey"),
        registrado_por=data.get("registrado_por"),
        notas=data.get("notas"),
    )
    db.add(c)
    db.flush()
    return {"status": "created", "container_id": c.id, "codigo": c.codigo}


def import_from_csv(tenant_id: str, csv_text: str, db) -> dict:
    """Bulk-import containers from CSV text.

    Returns summary: total, imported, errors (list of {row, reason}).
    """
    summary: dict = {"total": 0, "imported": 0, "errors": []}
    if db is None:
        summary["errors"].append({"row": 0, "reason": "no_db"})
        return summary

    reader = csv.DictReader(io.StringIO(csv_text))
    if not reader.fieldnames:
        summary["errors"].append({"row": 0, "reason": "CSV vacío o sin encabezado"})
        return summary

    cols = {c.strip().lower() for c in reader.fieldnames}
    missing = CSV_REQUIRED_COLS - cols
    if missing:
        summary["errors"].append({
            "row": 0,
            "reason": f"Columnas requeridas faltantes: {', '.join(sorted(missing))}",
        })
        return summary

    for i, row in enumerate(reader, start=2):
        summary["total"] += 1
        clean = {k.strip().lower(): v.strip() if isinstance(v, str) else v for k, v in row.items()}
        if not clean.get("codigo"):
            summary["errors"].append({"row": i, "reason": "codigo vacío"})
            continue
        if not clean.get("tipo"):
            summary["errors"].append({"row": i, "reason": "tipo vacío"})
            continue
        result = register_container(tenant_id, {**clean, "source": "csv_import"}, db)
        if result["status"] == "created":
            summary["imported"] += 1
        else:
            summary["errors"].append({"row": i, "reason": result.get("status", "unknown")})

    if summary["imported"]:
        db.commit()

    return summary


def get_inventory_summary(tenant_id: str, db) -> dict:
    """Return aggregate stats for a tenant's container inventory."""
    if db is None:
        return {"tenant_id": tenant_id, "total": 0, "disponible": False}

    rows = db.query(Container).filter(Container.tenant_id == tenant_id).all()
    by_tipo: dict[str, int] = {}
    by_estado: dict[str, int] = {}
    with_separation = 0
    for c in rows:
        by_tipo[c.tipo] = by_tipo.get(c.tipo, 0) + 1
        by_estado[c.estado_fisico] = by_estado.get(c.estado_fisico, 0) + 1
        if c.tiene_separacion:
            with_separation += 1

    return {
        "tenant_id": tenant_id,
        "total": len(rows),
        "por_tipo": by_tipo,
        "por_estado": by_estado,
        "con_separacion": with_separation,
        "pct_separacion": round(100 * with_separation / len(rows), 1) if rows else 0.0,
        "disponible": True,
    }
