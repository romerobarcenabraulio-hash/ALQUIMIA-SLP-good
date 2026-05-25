"""Informes ambientales/financieros BIOS con bloques QHC (LOGOS)."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def render_qhc_block(title: str, que: str, como: str, cuidado: str) -> str:
    return (
        f"> **QHC · {title}**\n"
        f"> - **Qué:** {que}\n"
        f"> - **Cómo:** {como}\n"
        f"> - **Cuidado:** {cuidado}"
    )


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def report_to_markdown(
    co2e: dict[str, Any],
    financial: dict[str, Any],
    sensitivity: dict[str, Any],
) -> str:
    fecha = co2e.get("generado_en", date.today().isoformat())[:10]
    co2e_total = co2e.get("co2e_total_ton", 0)
    vpn = financial.get("vpn_mxn", 0)
    tir = financial.get("tir_pct", 0)
    payback = financial.get("payback_meses", 0)
    horizonte = financial.get("horizonte_anios", 10)

    lines = [
        f"# Informe ambiental-financiero · BIOS",
        "",
        "**Audiencia:** Cabildo · Inversionista · PMO ambiental",
        f"**Fecha:** {fecha}",
        f"**Periodo CO₂e:** {co2e.get('periodo', '—')}",
        f"**Modelo:** {financial.get('modelo', '—')}",
        "",
        "## Pregunta de decisión",
        "",
        "¿El beneficio ambiental proyectado (CO₂e evitadas) y el retorno financiero (VPN/TIR) justifican la inversión en valorización RSU?",
        "",
        "## Resumen ejecutivo",
        "",
        f"- **CO₂e evitadas (escenario anual referencia):** {co2e_total:,.2f} t",
        f"- **CO₂e acumuladas horizonte {horizonte} años:** {financial.get('co2e_horizonte_ton', 0):,.2f} t",
        f"- **VPN (MXN):** ${vpn:,.2f}",
        f"- **TIR:** {tir:.2f}%",
        f"- **Payback simple:** {payback:.1f} meses",
        "",
        render_qhc_block(
            "Resumen ambiental-financiero",
            "Consolida emisiones evitadas del escenario y métricas de retorno (VPN, TIR, payback).",
            "Compare CO₂e con metas municipales de descarbonización; TIR vs. WACC declarado ("
            f"{financial.get('wacc_pct', '—')}%).",
            "CO₂e usa factores LCA (Ecoinvent/IPCC); no es inventario GEI certificado. "
            "TIR >50% requiere revisión AURUM/BIOS antes de presentar a Cabildo.",
        ),
        "",
        "## CO₂e por fracción",
        "",
        "| Fracción | Toneladas | CO₂e (t) | Factor | Fuente |",
        "|----------|-----------|----------|--------|--------|",
    ]

    for row in co2e.get("por_fraccion", []):
        lines.append(
            f"| {row.get('fraccion', '—')} | {row.get('toneladas', 0):,.2f} | "
            f"{row.get('co2e_ton', 0):,.2f} | {row.get('factor_aplicado', '—')} | "
            f"{row.get('fuente_factor', '—')} |"
        )

    lines.extend([
        "",
        render_qhc_block(
            "CO₂e por fracción",
            "Desglose de emisiones evitadas por material valorizado según factores LCA ISO 14040.",
            "Aluminio y PET suelen concentrar CO₂e por factor de producción virgen evitada.",
            "Tonelaje de fallback Modelo_BASED si HERMES no tiene báscula — ver notas al pie.",
        ),
        "",
    ])

    if co2e.get("notas"):
        lines.append("### Notas de proveniencia")
        for note in co2e["notas"]:
            lines.append(f"- {note}")
        lines.append("")

    lines.extend([
        "## Sensibilidad VPN (tornado)",
        "",
        "| Variable | Δ% | VPN (MXN) | Δ VPN % |",
        "|----------|-----|-----------|---------|",
    ])

    seen: set[tuple[str, float]] = set()
    for row in sensitivity.get("escenarios", []):
        key = (row.get("variable", ""), row.get("delta_pct", 0))
        if key in seen:
            continue
        seen.add(key)
        lines.append(
            f"| {row.get('variable', '—')} | {row.get('delta_pct', 0):+.0f} | "
            f"${row.get('vpn_mxn', 0):,.0f} | {row.get('delta_vpn_pct', 0):+.1f} |"
        )

    lines.extend([
        "",
        render_qhc_block(
            "Análisis de sensibilidad",
            "Muestra cómo varía el valor presente neto (VPN) ante cambios en precios, captura, combustible y WACC.",
            "Variable con mayor Δ VPN % es el driver de riesgo prioritario para negociación con concesionario.",
            "Escenarios ±30% son ilustrativos; no sustituyen contrato de compra-venta de materiales.",
        ),
        "",
        f"*Proyección BIOS · {financial.get('modelo', 'Modelo_BASED.xlsx')} · "
        "No sustituye auditoría ambiental ni dictamen financiero.*",
    ])

    return "\n".join(lines)


def persist_bios_report() -> Path:
    root = repo_root()
    co2e = _load_json(root / "data/environmental/co2e_latest.json")
    financial = _load_json(root / "data/lifecycle/financial_latest.json")
    sensitivity = _load_json(root / "data/lifecycle/sensitivity_latest.json")

    fecha = co2e.get("generado_en", date.today().isoformat())[:10]
    out_dir = root / "data/environmental/reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    md_path = out_dir / f"informe_{fecha}.md"
    md_path.write_text(report_to_markdown(co2e, financial, sensitivity), encoding="utf-8")

    latest = out_dir / "informe_latest.md"
    latest.write_text(md_path.read_text(encoding="utf-8"), encoding="utf-8")
    return md_path
