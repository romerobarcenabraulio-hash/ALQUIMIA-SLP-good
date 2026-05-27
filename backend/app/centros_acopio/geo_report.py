"""Reportes geo — depósito concesionario por municipio."""
from __future__ import annotations

import json
from typing import Any

from sqlalchemy.orm import Session

from app.city.inegi_catalog import ESTADOS_MX, fetch_municipios_inegi
from app.logistics.depot_resolver import resolve_depot
from app.repo_paths import repo_root

DEPOT_REPORT_PATH = repo_root() / "data" / "geo" / "depot_por_municipio.json"


def build_depot_report(db: Session | None) -> dict[str, Any]:
    report: dict[str, Any] = {"municipios": {}, "resumen": {}}
    total = con_depot = verificado = candidato = 0
    for eid, _ in ESTADOS_MX:
        for muni in fetch_municipios_inegi(eid):
            cve = muni.clave_inegi.zfill(5)
            total += 1
            try:
                depot = resolve_depot(cve, zm=muni.zm_simulator_id, db=db)
                con_depot += 1
                conf = depot.get("confianza")
                if conf == "verificado":
                    verificado += 1
                elif conf == "candidato":
                    candidato += 1
                report["municipios"][cve] = {
                    "municipio": muni.nombre,
                    "estado": muni.estado_nombre,
                    "estado_id": eid,
                    "zm": muni.zm_simulator_id,
                    "depot_label": depot.get("label"),
                    "lat": depot.get("lat"),
                    "lon": depot.get("lon"),
                    "confianza": conf,
                    "fuente": depot.get("fuente"),
                    "centro_id": depot.get("centro_id"),
                    "advertencia": depot.get("advertencia"),
                }
            except Exception as exc:
                report["municipios"][cve] = {
                    "municipio": muni.nombre,
                    "estado": muni.estado_nombre,
                    "error": str(exc),
                }
    report["resumen"] = {
        "municipios_total": total,
        "con_depot_resuelto": con_depot,
        "operador_verificado": verificado,
        "operador_candidato": candidato,
    }
    DEPOT_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    DEPOT_REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report
