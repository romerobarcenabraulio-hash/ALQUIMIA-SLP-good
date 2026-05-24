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

from app.agents.eidos_glossary import compact_glossary_for_prompt
from app.agents.schemas import DocumentSpec, EvidencePack, ScenarioBundle


MUNICIPAL_INTELLIGENCE_PROTOCOL = "Protocolo de inteligencia municipal por caso"
MUNICIPAL_DOSSIER_CONTRACT = "Contrato de expediente municipal razonado"


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


def _as_text(value: object, default: str = "no disponible") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text or default


def _format_municipal_intelligence_block(bundle: ScenarioBundle) -> list[str]:
    """Crea el bloque que evita que los agentes razonen en abstracto."""
    scope = "metropolitano" if bundle.requiere_capa_metropolitana() else "municipal"
    lines = [
        f"\n## {MUNICIPAL_INTELLIGENCE_PROTOCOL}:",
        f"  - Ámbito de lectura: {scope}. ZM activa: {_as_text(bundle.zm)}.",
        "  - La zona metropolitana coordina una lectura territorial; no sustituye reglamento, obligaciones, validación ni responsabilidad municipal.",
        "  - Cada municipio activo es un caso distinto: historia, madurez, reglamento, fuente, operación, contrato y brecha no se copian entre ayuntamientos.",
        "  - No uses Capítulo San Luis, SLP, Querétaro, Monterrey o Guadalajara como fuente de verdad de otro municipio; sólo sirven como contexto si una fuente verificable los respalda.",
        "  - No propongas sancionalidad nueva cuando el contexto municipal ya cubre sanciones; en ese caso enfoca la recomendación en evidencia, inspección, bitácora y operación.",
        "  - Todo texto legal o financiero es propuesta expositiva o simulación; ALQUIMIA no emite dictamen, acto oficial, presupuesto aprobado ni sanción firme.",
        "  - Mantén separado RSU municipal de residuos peligrosos, especiales, de manejo especial o regulados.",
        "  - Antes de recomendar, identifica: municipio_id, reglamento/fuente, estado de verificación, madurez, bloqueo, supuesto editable y siguiente acción.",
    ]

    lines.append("\n## Perfil legal municipal que SÍ puedes usar:")
    if bundle.legal_municipal:
        for m_id in bundle.municipios_activos:
            legal = bundle.legal_municipal.get(m_id) or bundle.legal_municipal.get(m_id.lower())
            if not legal:
                lines.append(
                    f"  - {m_id}: sin contexto legal municipal cargado; no completes con inferencias de ZM ni de otro municipio."
                )
                continue
            estado = (
                "fuente municipal usable para análisis"
                if bool(legal.get("verificado")) and not bool(legal.get("agora_bloqueado"))
                else "pendiente de validación o con bloqueo"
            )
            reglamento = _as_text(legal.get("reglamento"))
            fuente = _as_text(legal.get("fuente"))
            brecha = _as_text(legal.get("brecha_critica"), "sin brecha crítica declarada")
            version = _as_text(legal.get("version"), "sin versión declarada")
            lines.append(
                f"  - {m_id}: {estado}; reglamento={reglamento}; versión={version}; fuente={fuente}; brecha={brecha}."
            )
    else:
        lines.append("  - Sin perfiles legales municipales en el bundle; marca bloqueo o pendiente antes de redactar conclusiones normativas.")

    if bundle.inputs_usuario.get("municipio_profiles"):
        lines.append("\n## Perfiles municipales adicionales recibidos:")
        for profile in bundle.inputs_usuario["municipio_profiles"][:8]:
            municipio_id = _as_text(profile.get("municipio_id") or profile.get("id"))
            madurez = _as_text(profile.get("madurez") or profile.get("maturity") or profile.get("maturity_level"))
            resumen = _as_text(profile.get("resumen") or profile.get("summary") or profile.get("observacion"))
            lines.append(f"  - {municipio_id}: madurez={madurez}; lectura={resumen}.")

    if bundle.inputs_usuario.get("coverage_statuses"):
        lines.append("\n## Cobertura/fuentes por municipio:")
        for cov in bundle.inputs_usuario["coverage_statuses"][:8]:
            municipio_id = _as_text(cov.get("municipio_id") or cov.get("id"))
            status = _as_text(cov.get("status") or cov.get("source_status") or cov.get("ingest_status"))
            bloqueado = bool(cov.get("agora_bloqueado"))
            lines.append(f"  - {municipio_id}: status={status}; bloqueado={bloqueado}.")

    if bundle.inputs_usuario.get("legal_sources"):
        lines.append("\n## Fuentes legales localizadas o manifest:")
        for src in bundle.inputs_usuario["legal_sources"][:8]:
            municipio_id = _as_text(src.get("municipio_id") or src.get("id"))
            source_status = _as_text(src.get("source_status") or src.get("manifest_status") or src.get("status"))
            url = _as_text(src.get("url") or src.get("official_url") or src.get("archivo_local"))
            lines.append(f"  - {municipio_id}: {source_status}; referencia={url}.")

    if bundle.inputs_usuario.get("operations_summary"):
        ops = bundle.inputs_usuario["operations_summary"]
        lines.append("\n## Resumen operativo/logístico disponible:")
        lines.append(f"  - Estado operativo: {_as_text(ops.get('status') or ops.get('estado'))}.")
        lines.append(f"  - Rutas/olas declaradas: {_as_text(ops.get('routes') or ops.get('rutas') or ops.get('waves') or ops.get('olas'))}.")
        lines.append(f"  - Capacidad declarada: {_as_text(ops.get('capacity') or ops.get('capacidad') or ops.get('capacidad_ton_dia'))}.")
        for warning in ops.get("warnings", [])[:6]:
            lines.append(f"  - Advertencia operativa: {warning}.")

    if bundle.inputs_usuario.get("municipal_reasoning_dossier"):
        dossier = bundle.inputs_usuario["municipal_reasoning_dossier"]
        lines.append("\n## MunicipalReasoningDossier disponible:")
        lines.append(f"  - status: {_as_text(dossier.get('status'))}.")
        lines.append(f"  - thesis: {_as_text(dossier.get('thesis'))}.")
        for municipio_id, maturity in (dossier.get("municipal_maturity") or {}).items():
            lines.append(f"  - madurez {municipio_id}: {_as_text(maturity)}.")
        logistics = dossier.get("logistics") or {}
        lines.append(f"  - ruta logística: {_as_text(logistics.get('route_logic'))}.")
        lines.append(f"  - capacidad: {_as_text(logistics.get('capacity_logic'))}.")
        blocked_claims = dossier.get("blocked_claims") or []
        if blocked_claims:
            lines.append("  - claims bloqueados del expediente:")
            for claim in blocked_claims[:8]:
                lines.append(f"    - {claim}")
        next_actions = dossier.get("next_actions") or []
        if next_actions:
            lines.append("  - siguientes acciones del expediente:")
            for action in next_actions[:6]:
                lines.append(f"    - {action}")

    lines.extend([
        f"\n## {MUNICIPAL_DOSSIER_CONTRACT}:",
        "  - problema_real_del_municipio: qué problema público específico se observa en este municipio.",
        "  - evidencia_que_lo_sostiene: fuente, fórmula, manifest, provenance o dato declarado que sostiene cada afirmación material.",
        "  - no_sabemos_todavia: datos faltantes que impiden cerrar recomendación, monto, ruta, sanción o documento.",
        "  - hipotesis_de_trabajo: supuestos editables que usa el análisis y cómo cambiaría la conclusión si fallan.",
        "  - contradicciones_detectadas: tensiones entre datos, legal, operación, política pública, mercado o narrativa.",
        "  - madurez_y_capacidad_municipal: qué puede hacer este municipio por su madurez legal, operativa, económica y política.",
        "  - clasificacion_de_salida: separa simulación, propuesta, análisis y pendiente de validación.",
        "  - ruta_logistica_justificada: número de olas, rutas, capacidad, responsables y tiempos; si falta LogisticsBlueprint, bloquear promesas operativas.",
        "  - bloqueos_por_fuente_insuficiente: qué debe quedar bloqueado por falta de fuente, fórmula, comprador, capacidad, reglamento o validación.",
        "  - decision_publica_habilitada: qué decisión concreta puede tomar la autoridad y qué revisión debe ocurrir antes.",
    ])

    lines.extend([
        "\n## Salida obligatoria de cada agente:",
        "  - contexto_municipal_usado: municipio(s), ZM si aplica y por qué no sustituye al municipio.",
        "  - observacion_por_municipio: una lectura separada por municipio activo; sin transferir conclusiones entre municipios.",
        "  - mesa_razonamiento_municipal: problema, evidencia, no_sabemos, hipótesis, contradicciones, madurez/capacidad y decisión pública.",
        "  - ruta_logistica_y_capacidad: olas, rutas, capacidad, responsables y tiempos, o bloqueo explícito si no hay evidencia operativa.",
        "  - supuestos_y_fuentes: cifra o afirmación material -> fuente/matriz/provenance -> estado de verificación.",
        "  - bloqueos_y_siguiente_accion: qué falta validar, quién debe validarlo y qué acción sigue.",
        "  - limite_de_interpretacion: qué NO significa esta propuesta o simulación.",
    ])
    return lines


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
    system_lines.append("\n" + compact_glossary_for_prompt(getattr(spec, "tono", None)))
    system_lines.extend(_format_municipal_intelligence_block(bundle))

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

    # Research compacto (top por categoría — ahorra tokens vs JSON completo)
    rf = bundle.inputs_usuario.get("research_findings")
    if isinstance(rf, dict):
        user_lines.append("\n## Investigación web (resumen compacto):")
        for cat in (
            "precios_materiales", "costos_construccion", "costos_terreno",
            "reglamentos", "benchmarks_latam",
        ):
            items = rf.get(cat) or []
            for it in items[:2]:
                tit = (it.get("titulo") or "")[:80]
                val = it.get("valor_numerico")
                dom = it.get("domain", "?")
                extra = f" · ${val}" if val else ""
                user_lines.append(f"  - [{cat}] {tit} ({dom}){extra}")
        if rf.get("advertencias"):
            user_lines.append(f"  - Advertencia: {rf['advertencias'][0][:120]}")

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
