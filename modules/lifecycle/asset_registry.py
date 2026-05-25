"""Inventario de activos — vida útil y RUL estimada."""
from __future__ import annotations

import json
from datetime import date, datetime

from modules.lifecycle.paths import inventory_path
from modules.lifecycle.schemas import AssetInventory, AssetRecord


def load_inventory() -> AssetInventory:
    path = inventory_path()
    if not path.is_file():
        inv = default_inventory()
        save_inventory(inv)
        return inv
    return AssetInventory.model_validate(json.loads(path.read_text(encoding="utf-8")))


def default_inventory() -> AssetInventory:
    return AssetInventory(
        actualizado=date.today().isoformat(),
        referencia_vida_util={
            "infraestructura_civil": 20,
            "maquinaria_prensas": 10,
            "flota": 8,
            "basculas": 5,
            "hardware_digital": 4,
        },
        assets=[],
    )


def save_inventory(inv: AssetInventory) -> None:
    inv.actualizado = date.today().isoformat()
    inventory_path().write_text(
        json.dumps(inv.model_dump(mode="json"), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def estimar_rul(asset: AssetRecord, *, hoy: date | None = None) -> float | None:
    ref = hoy or date.today()
    if asset.fecha_adquisicion is None:
        return None
    elapsed = (ref - asset.fecha_adquisicion).days / 365.25
    return round(max(0.0, asset.vida_util_anios - elapsed), 2)


def enrich_inventory(inv: AssetInventory) -> AssetInventory:
    for asset in inv.assets:
        asset.rul_estimada_anios = estimar_rul(asset)
    return inv


def replacement_alerts(inv: AssetInventory) -> list[dict]:
    alerts: list[dict] = []
    for asset in enrich_inventory(inv).assets:
        rul = asset.rul_estimada_anios
        if rul is None:
            continue
        if rul < 0.5:
            nivel = "ROJO"
        elif rul < 1.5:
            nivel = "AMARILLO"
        else:
            continue
        alerts.append(
            {
                "asset_id": asset.asset_id,
                "nombre": asset.nombre,
                "rul_anios": rul,
                "nivel": nivel,
                "destinatario": "AURUM" if nivel == "AMARILLO" else "AURUM+KRONOS",
            }
        )
    return alerts
