"""API BIOS — ciclo de vida, LCA y financiero."""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from modules.lifecycle.asset_registry import (
    enrich_inventory,
    load_inventory,
    replacement_alerts,
    save_inventory,
)
from modules.lifecycle.co2e_engine import build_co2e_report, persist_co2e_report
from modules.lifecycle.financial_model import calcular_ciclo_financiero
from modules.lifecycle.lca_factors import load_lca_factors
from modules.lifecycle.paths import (
    co2e_latest_path,
    financial_latest_path,
    inventory_path,
    lca_factors_path,
    sensitivity_latest_path,
)
from modules.lifecycle.pipeline import run_bios_pipeline
from modules.lifecycle.schemas import AssetRecord
from modules.lifecycle.sensitivity import run_sensitivity

router = APIRouter()


class AssetUpsertRequest(BaseModel):
    asset_id: str
    categoria: str
    nombre: str
    fecha_adquisicion: str | None = None
    vida_util_anios: float = Field(..., gt=0)
    costo_capex_mxn: float | None = None
    notas: str | None = None


@router.get("/health")
def bios_health() -> dict[str, Any]:
    return {
        "agent": "BIOS",
        "status": "ok",
        "dominio": ["data/environmental", "data/assets", "data/lifecycle", "modules/lifecycle"],
    }


@router.get("/lca/factors")
def get_lca_factors() -> dict:
    return load_lca_factors().model_dump(mode="json")


@router.get("/co2e/latest")
def get_co2e_latest() -> dict:
    path = co2e_latest_path()
    if not path.is_file():
        report = build_co2e_report()
        persist_co2e_report(report)
        return report.model_dump(mode="json")
    return json.loads(path.read_text(encoding="utf-8"))


@router.post("/co2e/calculate")
def post_co2e_calculate(use_scenario_fallback: bool = True) -> dict:
    report = build_co2e_report(use_scenario_fallback=use_scenario_fallback)
    persist_co2e_report(report)
    return report.model_dump(mode="json")


@router.get("/assets/inventory")
def get_asset_inventory() -> dict:
    inv = enrich_inventory(load_inventory())
    return {
        **inv.model_dump(mode="json"),
        "replacement_alerts": replacement_alerts(inv),
    }


@router.post("/assets/upsert")
def post_asset_upsert(req: AssetUpsertRequest) -> dict:
    inv = load_inventory()
    from datetime import date as date_cls

    fecha = date_cls.fromisoformat(req.fecha_adquisicion) if req.fecha_adquisicion else None
    record = AssetRecord(
        asset_id=req.asset_id,
        categoria=req.categoria,
        nombre=req.nombre,
        fecha_adquisicion=fecha,
        vida_util_anios=req.vida_util_anios,
        costo_capex_mxn=req.costo_capex_mxn,
        notas=req.notas,
    )
    inv.assets = [a for a in inv.assets if a.asset_id != req.asset_id]
    inv.assets.append(record)
    inv = enrich_inventory(inv)
    save_inventory(inv)
    return {"ok": True, "asset": record.model_dump(mode="json"), "path": str(inventory_path())}


@router.get("/financial/lifecycle")
def get_financial_lifecycle() -> dict:
    path = financial_latest_path()
    if path.is_file():
        return json.loads(path.read_text(encoding="utf-8"))
    result = calcular_ciclo_financiero()
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


@router.get("/financial/sensitivity")
def get_sensitivity() -> dict:
    path = sensitivity_latest_path()
    if path.is_file():
        return json.loads(path.read_text(encoding="utf-8"))
    report = run_sensitivity()
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


@router.post("/pipeline/run")
def post_pipeline_run(use_scenario_fallback: bool = True) -> dict:
    return run_bios_pipeline(use_scenario_fallback=use_scenario_fallback)


@router.get("/manifest")
def get_manifest() -> dict:
    factors_ok = lca_factors_path().is_file()
    co2e_ok = co2e_latest_path().is_file()
    inv_ok = inventory_path().is_file()
    fin_ok = financial_latest_path().is_file()
    sens_ok = sensitivity_latest_path().is_file()
    if not all([factors_ok, co2e_ok, inv_ok, fin_ok, sens_ok]):
        raise HTTPException(
            status_code=404,
            detail="Ejecutar POST /pipeline/run para generar artefactos BIOS",
        )
    return {
        "agente": "BIOS",
        "artefactos": {
            "lca_factors": str(lca_factors_path()),
            "co2e_latest": str(co2e_latest_path()),
            "inventory": str(inventory_path()),
            "financial_latest": str(financial_latest_path()),
            "sensitivity_latest": str(sensitivity_latest_path()),
        },
    }
