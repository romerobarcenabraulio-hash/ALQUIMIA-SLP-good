"""
Fase 3B — prompt_builder.py

Construye el mensaje al LLM desde contratos, no desde strings libres.

Reglas:
  - Si el DocumentSpec exige tabla y el prompt no la menciona → falla.
  - Si hay advertencia crítica y el prompt no obliga lenguaje prudente → falla.
  - El prompt siempre contiene audiencia y decisión.
  - El lenguaje de cada KPI se calibra por su tipo de provenance.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.agents.schemas import DocumentSpec, EvidencePack, ScenarioBundle


@dataclass
class AgentPrompt:
    """Prompt estructurado listo para enviar al LLM."""
    system_context: str   # rol + contrato del documento
    user_context:   str   # datos del bundle + warnings

    def full_prompt(self) -> str:
        return f"{self.system_context}\n\n---\n\n{self.user_context}"

    def contains_audiencia(self) -> bool:
        return "Audiencia:" in self.system_context or "Audiencia:" in self.user_context

    def contains_decision(self) -> bool:
        return ("Decisión que este documento habilita:" in self.system_context
                or "decision_que_habilita" in self.user_context)

    def contains_tabla(self, tabla_nombre: str) -> bool:
        return tabla_nombre.lower() in self.full_prompt().lower()

    def contains_lenguaje_prudente(self) -> bool:
        prudente_markers = [
            "lenguaje prudente obligatorio",
            "se proyecta",
            "se estima",
            "advertencias activas",
            "⚠️",
        ]
        texto = self.full_prompt()
        return any(m in texto for m in prudente_markers)


def build_agent_prompt(
    agent_name: str,
    spec: DocumentSpec,
    bundle: ScenarioBundle,
    evidence_pack: Optional[EvidencePack] = None,
) -> AgentPrompt:
    """
    Construye AgentPrompt desde contratos.

    Validaciones:
      - Siempre incluye audiencia y decisión del spec.
      - Siempre lista tablas obligatorias si las hay.
      - Si hay warnings críticos, incluye aviso de lenguaje prudente.
      - El lenguaje de cada KPI se calibra por provenance.
    """
    system_lines = [
        f"Eres el agente **{agent_name}** del sistema ÁGORA GOV — Plataforma ALQUIMIA.",
        "Tu función es producir documentos institucionales defendibles para municipios mexicanos.",
        "",
        f"## Documento a producir: {spec.titulo}",
        f"## Audiencia: {', '.join(spec.audiencia)}",
        f"## Decisión que este documento habilita: {spec.decision_que_habilita}",
        f"## Nivel documental: {spec.nivel.value}",
        f"## Tono: {spec.tono}",
        f"## Lecturabilidad objetivo: {spec.lecturabilidad_objetivo}",
    ]

    if spec.max_paginas:
        system_lines.append(f"## Máximo de páginas: {spec.max_paginas}")

    if spec.secciones_obligatorias:
        system_lines.append("\n## Secciones obligatorias (todas son requeridas):")
        for s in spec.secciones_obligatorias:
            system_lines.append(f"  - {s}")

    if spec.tablas_obligatorias:
        system_lines.append(
            "\n## Tablas obligatorias (cada tabla necesita: unidad, período y fuente):"
        )
        for t in spec.tablas_obligatorias:
            system_lines.append(f"  - {t}")

    if spec.figuras_obligatorias:
        system_lines.append("\n## Figuras/visualizaciones obligatorias:")
        for f in spec.figuras_obligatorias:
            system_lines.append(f"  - {f}")

    if spec.fuentes_minimas:
        system_lines.append("\n## Fuentes mínimas que debe citar:")
        for f in spec.fuentes_minimas:
            system_lines.append(f"  - {f}")

    if spec.criterios_de_bloqueo:
        system_lines.append("\n## Criterios de bloqueo (no redactar si aplican):")
        for c in spec.criterios_de_bloqueo:
            system_lines.append(f"  - {c}")

    system_lines += [
        "\n## Reglas editoriales obligatorias:",
        "  - Citar fuente para cada número o afirmación material.",
        "  - Usar 'el simulador proyecta' o 'se estima que' para proyecciones, NUNCA 'garantiza'.",
        "  - Prohibido: 'revolucionario', 'innovador sin evidencia', 'garantiza', 'sin precedentes'.",
        "  - Párrafos de 3 a 6 líneas. Una idea por párrafo.",
        "  - Primera frase de cada sección explica POR QUÉ importa.",
        "  - Cada sección técnica cierra con 'Implicación para la decisión'.",
    ]

    # ── User context ──────────────────────────────────────────────────────────

    user_lines = [
        f"## Zona Metropolitana: {bundle.zm}",
        f"## Municipios activos: {', '.join(bundle.municipios_activos)}",
        f"## Horizonte: {bundle.horizonte_anios} año(s)",
        f"## Score de confianza de datos: {bundle.confidence_score:.0%}",
    ]

    # KPIs con lenguaje calibrado por provenance
    if bundle.kpis_con_provenance:
        user_lines.append("\n## Datos del simulador (lenguaje calibrado por fuente):")
        for kpi in bundle.kpis_con_provenance:
            kpi_id  = kpi.get("kpi_id", "?")
            valor   = kpi.get("valor", "?")
            prov    = kpi.get("provenance") or {}
            tipo    = prov.get("tipo", "desconocido")
            conf    = prov.get("confianza", 0.5)
            fuente  = prov.get("fuente_nombre", "Simulador ALQUIMIA")

            if tipo in ("manual", "fallback", "estimado"):
                lang = "se estima que"
            elif tipo == "supuesto":
                lang = "bajo el supuesto de que"
            elif tipo in ("certificado", "oficial"):
                lang = f"según {fuente}"
            elif tipo == "calculado":
                lang = "el simulador proyecta"
            else:
                lang = "datos disponibles indican"

            flag = " ⚠️ CONFIANZA BAJA — usar lenguaje muy prudente" if conf < 0.5 else ""
            user_lines.append(f"  - {kpi_id}: {valor} ({lang}){flag}")

    # Warnings activos → lenguaje prudente obligatorio
    all_warnings = bundle.warnings + bundle.bloqueos
    if all_warnings:
        user_lines.append(
            "\n## ⚠️ Advertencias activas — lenguaje prudente obligatorio en estas áreas:"
        )
        for w in all_warnings[:8]:
            user_lines.append(f"  - {w}")

    # Legal por municipio
    if bundle.legal_municipal:
        user_lines.append("\n## Estado jurídico por municipio:")
        for m_id, legal in bundle.legal_municipal.items():
            if legal:
                verificado = legal.get("verificado", False)
                estado = "✅ verificado" if verificado else "⚠️ NO verificado"
                reglamento = legal.get("reglamento", "sin datos")
                user_lines.append(f"  - {m_id}: {reglamento} [{estado}]")
            else:
                user_lines.append(f"  - {m_id}: sin diagnóstico jurídico ⚠️")

    # Evidence pack
    if evidence_pack and evidence_pack.items:
        user_lines.append("\n## Evidencia disponible para este documento:")
        for item in evidence_pack.items[:10]:
            user_lines.append(
                f"  - [{item.tipo.value}] {item.texto_claim} "
                f"(fuente: {item.fuente}, confianza: {item.confianza:.0%}, "
                f"lenguaje permitido: '{item.lenguaje_permitido}')"
            )

    user_lines.append(
        f"\nProduce el documento '{spec.titulo}' con TODAS las secciones obligatorias. "
        "Cada afirmación numérica debe ir acompañada de su fuente entre paréntesis."
    )

    return AgentPrompt(
        system_context="\n".join(system_lines),
        user_context="\n".join(user_lines),
    )
