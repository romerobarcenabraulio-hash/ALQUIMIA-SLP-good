"""Plantillas de reporte de costos por audiencia — PMO / inversionista."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any, Literal

from modules.planning.budget.schemas import AcUpdatePayload, CostStructure, EfficiencyIndicators

Audience = Literal["pmo", "inversionista"]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def reports_dir() -> Path:
    d = repo_root() / "data" / "financial" / "reports"
    d.mkdir(parents=True, exist_ok=True)
    return d


def templates_dir() -> Path:
    d = reports_dir() / "templates"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _pmo_template() -> dict[str, Any]:
    return {
        "audiencia": "pmo",
        "titulo": "Reporte quincenal de costos — PMO",
        "secciones": [
            "resumen_ejecutivo",
            "ac_por_categoria",
            "desviaciones_vs_baseline",
            "costos_no_calidad",
            "indicadores_eficiencia",
            "alertas_y_acciones",
            "supuestos_y_fuentes",
        ],
        "formato": "json+markdown",
        "frecuencia": "quincenal",
        "destinatario": "KRONOS + equipo PMO municipal",
    }


def _inversionista_template() -> dict[str, Any]:
    return {
        "audiencia": "inversionista",
        "titulo": "Reporte de costos — Inversionista / Cabildo",
        "secciones": [
            "resumen_ejecutivo",
            "capex_por_componente",
            "opex_run_rate",
            "unit_economics",
            "payback_y_sensibilidades",
            "riesgos_costo",
            "disclaimer_proyeccion",
        ],
        "formato": "json+markdown",
        "frecuencia": "mensual",
        "destinatario": "SUPREME + inversionistas / Cabildo",
        "disclaimer": "Proyección basada en supuesto declarado — no altera datos históricos conciliados.",
    }


def ensure_report_templates() -> dict[str, Path]:
    out: dict[str, Path] = {}
    tdir = templates_dir()
    tdir.mkdir(parents=True, exist_ok=True)
    for name, template in (("pmo", _pmo_template()), ("inversionista", _inversionista_template())):
        path = tdir / f"plantilla_{name}.json"
        if not path.is_file():
            path.write_text(json.dumps(template, ensure_ascii=False, indent=2), encoding="utf-8")
        out[name] = path
    return out


def _format_mxn(value: str) -> str:
    try:
        num = float(value)
        return f"${num:,.2f} MXN"
    except (TypeError, ValueError):
        return str(value)


def render_pmo_report(
    structure: CostStructure,
    ac_update: AcUpdatePayload,
    *,
    warnings: list[str] | None = None,
) -> dict[str, Any]:
    ind = ac_update.indicadores
    report = {
        "audiencia": "pmo",
        "fecha": structure.fecha.isoformat(),
        "municipio_id": structure.municipio_id,
        "supuesto_base": structure.supuesto_base,
        "resumen_ejecutivo": {
            "ac_total": str(ac_update.ac_total_mxn),
            "capex_baseline": str(structure.capex_total),
            "opex_mensual_referencia": str(structure.opex_mensual_total),
            "hermes_dias_consumidos": ac_update.hermes_dias_consumidos,
            "semaforo_costo_ton": ind.semaforo_costo_ton,
        },
        "ac_por_categoria": {k: str(v) for k, v in ac_update.ac_por_categoria.items()},
        "costos_no_calidad": structure.no_calidad.to_dict(),
        "indicadores_eficiencia": ind.to_dict(),
        "alertas_y_acciones": _build_alerts(ind, warnings or []),
        "fuentes": {
            "hermes": "data/logistics/daily_summary/",
            "baseline": structure.supuesto_base,
        },
    }
    return report


def render_inversionista_report(
    structure: CostStructure,
    ac_update: AcUpdatePayload,
) -> dict[str, Any]:
    ind = ac_update.indicadores
    capex_by_component: dict[str, str] = {}
    for line in structure.capex_lines:
        comp = line.componente or "otros"
        prev = capex_by_component.get(comp, "0")
        capex_by_component[comp] = str(float(prev) + float(line.monto_mxn))

    report = {
        "audiencia": "inversionista",
        "fecha": structure.fecha.isoformat(),
        "municipio_id": structure.municipio_id,
        "supuesto_base": structure.supuesto_base,
        "resumen_ejecutivo": {
            "capex_total_programa": str(structure.capex_total),
            "opex_run_rate_mensual": str(structure.opex_mensual_total),
            "payback_simple_anios": str(ind.payback_simple_anios),
            "costo_no_calidad_pct": str(ind.costo_no_calidad_pct),
        },
        "capex_por_componente": capex_by_component,
        "unit_economics": {
            "costo_por_tonelada_mxn": str(ind.costo_por_tonelada),
            "costo_por_vivienda_mxn": str(ind.costo_por_vivienda),
        },
        "riesgos_costo": [
            "Costos de no-calidad > 8% ingreso bruto → escalación SUPREME",
            "Feed HERMES > 3 días sin publicar → AC EVM desactualizado",
            "Categoría OPEX > 20% sobre presupuesto → alerta roja",
        ],
        "disclaimer_proyeccion": (
            f"Proyección basada en: {structure.supuesto_base}. "
            "No sustituye conciliación contable ni auditoría."
        ),
    }
    return report


def _build_alerts(ind: EfficiencyIndicators, warnings: list[str]) -> list[str]:
    alerts: list[str] = list(warnings)
    if ind.alerta_roja_no_calidad:
        alerts.append("ROJO: costos de no-calidad superan 8% del ingreso bruto")
    if ind.semaforo_costo_ton == "ROJO":
        alerts.append("ROJO: costo/tonelada > 20% sobre umbral operativo")
    elif ind.semaforo_costo_ton == "AMARILLO":
        alerts.append("AMARILLO: costo/tonelada entre umbral y +20%")
    return alerts


def report_to_markdown(report: dict[str, Any]) -> str:
    audiencia = report.get("audiencia", "pmo")
    lines = [
        f"# Reporte de costos · {audiencia.upper()}",
        "",
        f"**Fecha:** {report.get('fecha', date.today().isoformat())}",
        f"**Municipio:** {report.get('municipio_id', '—')}",
        f"**Supuesto base:** {report.get('supuesto_base', '—')}",
        "",
    ]

    resumen = report.get("resumen_ejecutivo", {})
    lines.append("## Resumen ejecutivo")
    for key, val in resumen.items():
        label = key.replace("_", " ").title()
        display = _format_mxn(str(val)) if "mxn" in key.lower() or key.endswith("_total") else str(val)
        lines.append(f"- **{label}:** {display}")
    lines.append("")

    if "ac_por_categoria" in report:
        lines.append("## AC por categoría")
        for key, val in report["ac_por_categoria"].items():
            lines.append(f"- {key.replace('_', ' ')}: {_format_mxn(str(val))}")
        lines.append("")

    if "capex_por_componente" in report:
        lines.append("## CAPEX por componente")
        for key, val in report["capex_por_componente"].items():
            lines.append(f"- {key}: {_format_mxn(str(val))}")
        lines.append("")

    if "indicadores_eficiencia" in report:
        lines.append("## Indicadores de eficiencia")
        for key, val in report["indicadores_eficiencia"].items():
            lines.append(f"- {key}: {val}")
        lines.append("")

    alerts = report.get("alertas_y_acciones") or report.get("riesgos_costo") or []
    if alerts:
        lines.append("## Alertas")
        for a in alerts:
            lines.append(f"- {a}")
        lines.append("")

    disclaimer = report.get("disclaimer_proyeccion")
    if disclaimer:
        lines.append(f"*{disclaimer}*")

    return "\n".join(lines)


def persist_audience_reports(
    pmo_report: dict[str, Any],
    investor_report: dict[str, Any],
) -> dict[str, str]:
    fecha = pmo_report.get("fecha", date.today().isoformat())
    paths: dict[str, str] = {}

    for audience, report in (("pmo", pmo_report), ("inversionista", investor_report)):
        base = reports_dir() / audience
        base.mkdir(parents=True, exist_ok=True)
        json_path = base / f"reporte_{fecha}.json"
        md_path = base / f"reporte_{fecha}.md"
        json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        md_path.write_text(report_to_markdown(report), encoding="utf-8")
        paths[audience] = str(json_path)

    latest = reports_dir() / "latest"
    latest.mkdir(parents=True, exist_ok=True)
    (latest / "pmo.json").write_text(
        json.dumps(pmo_report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (latest / "inversionista.json").write_text(
        json.dumps(investor_report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return paths
