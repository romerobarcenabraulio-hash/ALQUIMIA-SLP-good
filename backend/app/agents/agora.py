"""
ÁGORA — Motor documental institucional para municipios mexicanos y ZMs.

Fase 3B: los contratos documentales controlan la redacción real.

Pipeline:
  GeneratePlanRequest
    → ScenarioBundle        (bundle_builder)
    → DocumentPlan          (document_specs — Director de Paquete)
    → DraftBundle           (agentes reciben AgentContext con DocumentSpec)
    → ClaimLedger           (construido desde KPIs del bundle)
    → ValidationReport      (validator.py — bloquea o degrada)
    → ExportBundle          (exporter.py — sin .txt sueltos)
    → Drive/Hub

Retrocompatibilidad: PlanInput sigue siendo la interfaz pública del router.
La conversión a ScenarioBundle ocurre en build_bundle_from_plan_input().

Los agentes SOLO se activan cuando run_agora() es llamado explícitamente
desde POST /generate/plan. Nunca en startup ni background sin trigger.
"""
from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

from app.agents.schemas import (
    ClaimEntry,
    ClaimLedger,
    ClaimReviewStatus,
    ClaimType,
    DocumentNivel,
    DocumentPlan,
    DocumentStatusLevel,
    DraftBundle,
    DraftDocument,
    DraftSection,
    EvidenceItem,
    EvidenceTipo,
    ExportBundle,
    MunicipalReasoningDossier,
    ScenarioBundle,
    SourceStatus,
    ValidationReport,
)

logger = logging.getLogger(__name__)
PROMPTS_DIR = Path(__file__).parent / "prompts"


# ─── Contratos públicos ───────────────────────────────────────────────────────

@dataclass
class PlanInput:
    """Interfaz legacy del router. Se convierte a ScenarioBundle en run_agora()."""
    municipio:       str
    zm:              str
    scenario_json:   dict
    kpis_json:       dict
    data_provenance: Optional[dict] = field(default=None)
    # Fase 5: MarketSummary serializado desde POST /market/place
    market_summary:  Optional[dict] = field(default=None)
    # Fase 6: MacroImpactSummary serializado desde POST /macros/impact
    macro_impact_summary: Optional[dict] = field(default=None)
    # Fase 7: ReasoningGraph serializado desde POST /reasoning/graph
    reasoning_graph: Optional[dict] = field(default=None)
    # Fase 8: expansion nacional municipio por municipio
    municipio_profiles: Optional[list[dict]] = field(default=None)
    coverage_statuses: Optional[list[dict]] = field(default=None)
    legal_sources: Optional[list[dict]] = field(default=None)
    operations_summary: Optional[dict] = field(default=None)
    # Wave 1: Investigador + CostModel
    research_findings: Optional[dict] = field(default=None)   # ResearchFindings serializado
    cost_model: Optional[dict] = field(default=None)          # CostModelSummary serializado


@dataclass
class AgentContext:
    """
    Lo que cada agente recibe. Nunca PlanInput suelto.
    Contiene ScenarioBundle + DocumentSpec + estado del DraftBundle.
    """
    agent_name:   str
    bundle:       ScenarioBundle
    spec:         object    # DocumentSpec — evita import circular en type hint
    draft_bundle: DraftBundle
    evidence_pack: Optional[object] = field(default=None)   # EvidencePack opcional


@dataclass
class PlanOutput:
    """
    Salida del pipeline. Los campos legacy se mantienen para compatibilidad.
    Los campos Fase 3B son los que importan.
    """
    # ── Fase 3B (estructurado) ────────────────────────────────────────────────
    draft_bundle:       Optional[DraftBundle] = field(default=None)
    export_bundle:      Optional[ExportBundle] = field(default=None)
    document_plan_obj:  Optional[DocumentPlan] = field(default=None)
    validation_summary: Optional[ValidationReport] = field(default=None)
    municipal_reasoning_dossier: Optional[MunicipalReasoningDossier] = field(default=None)
    docs_drive_ids:     dict = field(default_factory=dict)

    # ── Legacy (compatibilidad con router y tests anteriores) ─────────────────
    marco_legal:       Optional[str] = field(default=None)
    reforma:           Optional[str] = field(default=None)
    modelo_cfo:        Optional[dict] = field(default=None)
    plan_impl:         Optional[str] = field(default=None)
    benchmark:         Optional[str] = field(default=None)
    stakeholders:      Optional[str] = field(default=None)
    reporte_ejecutivo: Optional[str] = field(default=None)


ProgressCallback = Callable[[int, str], None]


# ─── Orquestador principal ────────────────────────────────────────────────────

async def run_agora(
    plan_input: PlanInput,
    progress_cb: Optional[ProgressCallback] = None,
    municipios_activos: Optional[list[str]] = None,
) -> PlanOutput:
    """
    Orquesta el pipeline documental ÁGORA Fase 3B.

    Los agentes reciben AgentContext (ScenarioBundle + DocumentSpec),
    no PlanInput suelto. La salida es DraftBundle → ExportBundle.
    """
    from app.agents.bundle_builder import build_bundle_from_plan_input
    from app.agents.document_specs import build_document_plan
    from app.agents.validator import validate_bundle
    from app.agents.exporter import build_export_bundle

    output = PlanOutput()

    async def report(pct: int, msg: str) -> None:
        if progress_cb:
            await progress_cb(pct, msg)
        logger.info(f"ÁGORA [{pct}%] {msg}")

    # ── 0. ScenarioBundle ─────────────────────────────────────────────────────
    await report(3, "Director — Construyendo ScenarioBundle...")
    bundle = build_bundle_from_plan_input(plan_input, municipios_activos)
    if bundle.warnings:
        logger.warning("Bundle warnings: " + "; ".join(bundle.warnings[:3]))

    # ── Fase 5: inyectar MarketSummary si viene en plan_input ─────────────────
    if getattr(plan_input, "market_summary", None):
        bundle.inputs_usuario["market_summary"] = plan_input.market_summary
        mkt_warnings = plan_input.market_summary.get("warnings", [])
        if mkt_warnings:
            bundle.warnings.extend(mkt_warnings)
        logger.info(
            f"ÁGORA — MarketSummary recibido para ZM={bundle.zm}: "
            f"ingresos_ajustados={plan_input.market_summary.get('ingresos_ajustados_mxn', 'N/D')}"
        )

    # ── Fase 6: inyectar MacroImpactSummary si viene en plan_input ───────────
    if getattr(plan_input, "macro_impact_summary", None):
        bundle.inputs_usuario["macro_impact_summary"] = plan_input.macro_impact_summary
        macro_warnings = plan_input.macro_impact_summary.get("warnings", [])
        if macro_warnings:
            bundle.warnings.extend(macro_warnings)
        logger.info(
            f"ÁGORA — MacroImpactSummary recibido para ZM={bundle.zm}: "
            f"generators={plan_input.macro_impact_summary.get('generators_count', 'N/D')}"
        )

    # ── Fase 7: inyectar ReasoningGraph si viene en plan_input ───────────────
    if getattr(plan_input, "reasoning_graph", None):
        bundle.inputs_usuario["reasoning_graph"] = plan_input.reasoning_graph
        graph_warnings = plan_input.reasoning_graph.get("warnings", [])
        if graph_warnings:
            bundle.warnings.extend(graph_warnings)
        logger.info(
            f"ÁGORA — ReasoningGraph recibido para ZM={bundle.zm}: "
            f"nodes={len(plan_input.reasoning_graph.get('nodes', []))}"
        )

    # ── Fase 8: inyectar perfiles/cobertura nacional por municipio ──────────
    if getattr(plan_input, "municipio_profiles", None):
        bundle.inputs_usuario["municipio_profiles"] = plan_input.municipio_profiles
    if getattr(plan_input, "coverage_statuses", None):
        bundle.inputs_usuario["coverage_statuses"] = plan_input.coverage_statuses
        for cov in plan_input.coverage_statuses:
            if cov.get("agora_bloqueado"):
                bundle.warnings.extend(cov.get("bloqueos", []))
                municipio_id = cov.get("municipio_id", "?")
                if municipio_id not in " ".join(bundle.bloqueos):
                    bundle.bloqueos.append(f"Municipio {municipio_id} bloqueado por cobertura legal insuficiente.")
    if getattr(plan_input, "legal_sources", None):
        bundle.inputs_usuario["legal_sources"] = plan_input.legal_sources
    if getattr(plan_input, "operations_summary", None):
        bundle.inputs_usuario["operations_summary"] = plan_input.operations_summary
        for warning in plan_input.operations_summary.get("warnings", []):
            bundle.warnings.append(warning)

    # ── 0B. Investigador — ResearchFindings en tiempo real ────────────────────
    # Ejecuta búsquedas Serper para costos reales, precios y reglamentos.
    # Si Serper no está configurado, retorna findings vacíos con advertencia.
    if getattr(plan_input, "research_findings", None):
        # Ya viene pre-calculado (llamada desde tests o pipeline avanzado)
        bundle.inputs_usuario["research_findings"] = plan_input.research_findings
        logger.info("ÁGORA — ResearchFindings recibido pre-calculado.")
    else:
        _investigador_enabled = True
        try:
            from app.config import settings as _cfg
            _investigador_enabled = getattr(_cfg, "INVESTIGADOR_ENABLED", True)
        except Exception:
            pass

        if _investigador_enabled:
            await report(5, f"Investigador — costos y contexto para {plan_input.municipio}...")
        try:
            from app.agents.research_service import investigate_municipio
            _estado = bundle.zm.split("_")[-1] if "_" in bundle.zm else bundle.zm
            _mun_id = plan_input.municipio.lower().replace(" ", "_")[:50]
            used_cache = False
            findings = None
            try:
                from app.research.cache import load_cached_findings
                cached = load_cached_findings(_mun_id, bundle.zm, plan_input.municipio)
                if cached and cached.queries_con_resultado >= 3:
                    bundle.inputs_usuario["research_findings"] = cached.model_dump(mode="json")
                    bundle.warnings.append(cached.advertencias[0] if cached.advertencias else "Research desde caché DB.")
                    logger.info("ÁGORA — Investigador omitido (caché Postgres).")
                    used_cache = True
            except Exception:
                pass
            if not used_cache:
                findings = await investigate_municipio(
                    municipio=plan_input.municipio,
                    estado=_estado,
                    zm=bundle.zm,
                )
            if findings is not None:
                bundle.inputs_usuario["research_findings"] = findings.model_dump(mode="json")
                if findings.advertencias:
                    bundle.warnings.extend(findings.advertencias[:3])
                logger.info(
                    f"ÁGORA — Investigador: {findings.queries_con_resultado}/"
                    f"{findings.queries_ejecutadas} queries. Serper: {findings.fuente_serper}"
                )
        except Exception as exc:
            logger.warning(f"ÁGORA — Investigador falló, continuando sin findings: {exc}")
            bundle.warnings.append("Investigador no disponible — costos sin enriquecer con datos web.")

    # Inyectar CostModel si viene en plan_input (de Wave 0)
    if getattr(plan_input, "cost_model", None):
        bundle.inputs_usuario["cost_model"] = plan_input.cost_model
        logger.info("ÁGORA — CostModel trazable recibido.")

    # ── 0C. MunicipalReasoningDossier ────────────────────────────────────────
    # El expediente razonado es insumo previo a documentos. Los agentes redactan
    # desde este contrato, no desde intuiciones ni prosa suelta.
    from app.agents.dossier import build_municipal_reasoning_dossier

    municipal_reasoning_dossier = build_municipal_reasoning_dossier(bundle)
    bundle.inputs_usuario["municipal_reasoning_dossier"] = municipal_reasoning_dossier.model_dump(mode="json")
    output.municipal_reasoning_dossier = municipal_reasoning_dossier

    # ── 1. DocumentPlan ───────────────────────────────────────────────────────
    await report(8, f"Director — Construyendo DocumentPlan para ZM {bundle.zm}...")
    document_plan = build_document_plan(bundle)
    output.document_plan_obj = document_plan
    logger.info(f"DocumentPlan: {len(document_plan.specs)} docs, {len(document_plan.warnings)} warnings")

    # ── 2. DraftBundle vacío desde DocumentPlan ───────────────────────────────
    await report(12, "Director — Inicializando DraftBundle...")
    draft_bundle = _init_draft_bundle(bundle, document_plan)
    draft_bundle.municipal_reasoning_dossier = municipal_reasoning_dossier

    # ── 3. Agentes con AgentContext ───────────────────────────────────────────
    # Cada agente recibe el spec más relevante para su rol
    agent_spec_map = {
        "arquitecto":    DocumentNivel.municipal,
        "ghostwriter":   DocumentNivel.ejecutivo,
        "comparador":    DocumentNivel.financiero,
        "mapeador":      DocumentNivel.ejecutivo,
        "director":      DocumentNivel.ejecutivo,
        "humanizador":   DocumentNivel.ejecutivo,
        "validador":     DocumentNivel.tecnico,
        # Wave 1 — logística
        "rutas":         DocumentNivel.operativo,
        "flota":         DocumentNivel.operativo,
        "territorio":    DocumentNivel.operativo,
        "supply_chain":  DocumentNivel.operativo,
    }

    await report(18, f"Arquitecto Jurídico — Diagnosticando reglamentos ({', '.join(bundle.municipios_activos[:2])})...")
    await report(32, "Economista y Logística — Construyendo modelos en paralelo...")
    await report(46, "Mapeador — Identificando stakeholders y riesgos...")

    arquitecto_prompt  = _load_prompt("arquitecto")
    comparador_prompt  = _load_prompt("comparador")
    mapeador_prompt    = _load_prompt("mapeador")
    rutas_prompt       = _load_prompt("rutas")
    flota_prompt       = _load_prompt("flota")
    territorio_prompt  = _load_prompt("territorio")
    supply_chain_prompt = _load_prompt("supply_chain")

    def _spec_by_doc_id(plan: DocumentPlan, doc_id: str):
        """Retorna el spec con ese document_id exacto, o fallback al primero."""
        for s in plan.specs:
            if s.document_id == doc_id:
                return s
        return plan.specs[0] if plan.specs else _default_spec()

    from app.agents.document_specs import (
        DOC_RUTAS, DOC_FLOTA, DOC_TERRITORIO, DOC_SUPPLY_CHAIN,
    )

    await asyncio.gather(
        # ── Agentes existentes ───────────────────────────────────────────────
        _call_agent_with_context(
            AgentContext("arquitecto", bundle,
                         _get_spec_for_nivel(document_plan, DocumentNivel.municipal),
                         draft_bundle),
            arquitecto_prompt, plan_input, output,
        ),
        _call_agent_with_context(
            AgentContext("comparador", bundle,
                         _get_spec_for_nivel(document_plan, DocumentNivel.financiero),
                         draft_bundle),
            comparador_prompt, plan_input, output,
        ),
        _call_agent_with_context(
            AgentContext("mapeador", bundle,
                         _get_spec_for_nivel(document_plan, DocumentNivel.ejecutivo),
                         draft_bundle),
            mapeador_prompt, plan_input, output,
        ),
        # ── Agentes logísticos Wave 1 (paralelo con los anteriores) ─────────
        _call_agent_with_context(
            AgentContext("rutas", bundle,
                         _spec_by_doc_id(document_plan, DOC_RUTAS),
                         draft_bundle),
            rutas_prompt, plan_input, output,
        ),
        _call_agent_with_context(
            AgentContext("flota", bundle,
                         _spec_by_doc_id(document_plan, DOC_FLOTA),
                         draft_bundle),
            flota_prompt, plan_input, output,
        ),
        _call_agent_with_context(
            AgentContext("territorio", bundle,
                         _spec_by_doc_id(document_plan, DOC_TERRITORIO),
                         draft_bundle),
            territorio_prompt, plan_input, output,
        ),
        _call_agent_with_context(
            AgentContext("supply_chain", bundle,
                         _spec_by_doc_id(document_plan, DOC_SUPPLY_CHAIN),
                         draft_bundle),
            supply_chain_prompt, plan_input, output,
        ),
        return_exceptions=True,
    )

    await report(60, f"Redactor — Redactando paquete para {plan_input.municipio}...")
    ghostwriter_prompt = _load_prompt("ghostwriter")
    await _call_agent_with_context(
        AgentContext("ghostwriter", bundle,
                     _get_spec_for_nivel(document_plan, DocumentNivel.ejecutivo),
                     draft_bundle),
        ghostwriter_prompt, plan_input, output,
    )

    await report(72, "Validador — Verificando consistencia, fuentes y lenguaje...")
    validador_prompt = _load_prompt("validador")
    await _call_agent_with_context(
        AgentContext("validador", bundle,
                     _get_spec_for_nivel(document_plan, DocumentNivel.tecnico),
                     draft_bundle),
        validador_prompt, plan_input, output,
    )

    await report(84, "Humanizador — Claridad institucional, no maquillaje...")
    humanizador_prompt = _load_prompt("humanizador")
    await _call_agent_with_context(
        AgentContext("humanizador", bundle,
                     _get_spec_for_nivel(document_plan, DocumentNivel.ejecutivo),
                     draft_bundle),
        humanizador_prompt, plan_input, output,
    )

    # ── 4. ClaimLedger desde KPIs del bundle ─────────────────────────────────
    await report(87, "Editor de Evidencia — Construyendo ClaimLedger...")
    bundle_ledger = _build_claim_ledger_from_bundle(bundle, draft_bundle.bundle_id)
    draft_bundle.claim_ledger = bundle_ledger

    # Asociar ClaimLedger a cada DraftDocument que no tenga uno
    for doc in draft_bundle.documentos:
        if doc.claim_ledger is None:
            doc.claim_ledger = _build_claim_ledger_from_bundle(bundle, doc.document_id)

    # ── 5. ValidationReport por documento ─────────────────────────────────────
    await report(90, "Validador — Evaluando estado de cada documento...")
    validation_summary = validate_bundle(draft_bundle, bundle)
    output.validation_summary = validation_summary

    # ── 6. ExportBundle ───────────────────────────────────────────────────────
    await report(94, "Exportador — Construyendo ExportBundle (sin .txt)...")
    export_bundle = build_export_bundle(draft_bundle, document_plan, bundle)
    draft_bundle_final = draft_bundle
    output.draft_bundle  = draft_bundle_final
    output.export_bundle = export_bundle

    # ── 7. Drive ──────────────────────────────────────────────────────────────
    await report(96, "Director — Subiendo a Drive desde ExportBundle...")
    try:
        output.docs_drive_ids = await _upload_from_export_bundle(
            plan_input, export_bundle, draft_bundle_final
        )
    except Exception as e:
        logger.warning(f"Drive upload falló: {e} — documentos en memoria")

    # plan_impl como resumen legible del DocumentPlan
    output.plan_impl = output.plan_impl or _format_document_plan_summary(document_plan)

    n_defendibles = len(export_bundle.documents_defendibles())
    n_total       = len(export_bundle.documents)
    await report(
        100,
        f"¡Paquete completo! {n_defendibles}/{n_total} documentos defendibles — /hub",
    )
    return output


# ─── Helpers de pipeline ──────────────────────────────────────────────────────

def _init_draft_bundle(bundle: ScenarioBundle, plan: DocumentPlan) -> DraftBundle:
    """Crea DraftBundle con DraftDocuments vacíos para cada spec del DocumentPlan."""
    documentos = [
        DraftDocument(
            document_id=spec.document_id,
            spec=spec,
            status=DocumentStatusLevel.borrador,
        )
        for spec in plan.specs
    ]
    return DraftBundle(
        bundle_id=bundle.scenario_id,
        zm=bundle.zm,
        municipios=bundle.municipios_activos,
        documentos=documentos,
    )


def _get_spec_for_nivel(plan: DocumentPlan, nivel: DocumentNivel):
    """Retorna el primer spec del nivel dado, o el primer spec del plan."""
    docs = plan.documento_por_nivel(nivel)
    if docs:
        return docs[0]
    return plan.specs[0] if plan.specs else _default_spec()


def _default_spec():
    from app.agents.schemas import DocumentSpec
    return DocumentSpec(
        document_id="agora_default",
        titulo="Documento ÁGORA",
        audiencia=["Equipo técnico"],
        decision_que_habilita="Revisar output",
        nivel=DocumentNivel.ejecutivo,
        secciones_obligatorias=["1. Contenido"],
    )


def _text_to_sections(text: str, spec) -> list[DraftSection]:
    """Parsea texto con ## headers en DraftSections."""
    parts = re.split(r"^##\s+(.+)$", text, flags=re.MULTILINE)
    if len(parts) <= 1:
        # Sin headers — sección única
        titulo = (spec.secciones_obligatorias[0]
                  if spec.secciones_obligatorias else "Contenido")
        return [DraftSection(section_id="sec_01", titulo=titulo,
                             contenido=text.strip())]
    sections = []
    i, n = 1, 1
    while i < len(parts) - 1:
        titulo   = parts[i].strip()
        contenido = parts[i + 1].strip()
        sections.append(DraftSection(
            section_id=f"sec_{n:02d}",
            titulo=titulo,
            contenido=contenido,
        ))
        i += 2
        n += 1
    return sections


def _build_claim_ledger_from_bundle(bundle: ScenarioBundle, document_id: str) -> ClaimLedger:
    """Construye ClaimLedger desde los KPIs del ScenarioBundle."""
    entries: list[ClaimEntry] = []

    for kpi in bundle.kpis_con_provenance:
        kpi_id = kpi.get("kpi_id", "")
        valor  = kpi.get("valor")
        prov   = kpi.get("provenance") or {}
        tipo   = prov.get("tipo", "desconocido")
        conf   = float(prov.get("confianza", 0.5))
        fuente = prov.get("fuente_nombre", "Simulador ALQUIMIA")

        if tipo in ("certificado", "oficial"):
            src_status = SourceStatus.verificado
            lang       = f"según {fuente}"
            ev_tipo    = EvidenceTipo.dato
        elif tipo == "calculado":
            src_status = SourceStatus.estimado
            lang       = "el simulador proyecta"
            ev_tipo    = EvidenceTipo.formula
        elif tipo in ("manual", "fallback"):
            src_status = SourceStatus.fallback
            lang       = "se estima que"
            ev_tipo    = EvidenceTipo.supuesto
        else:
            src_status = SourceStatus.no_disponible
            lang       = "datos disponibles indican"
            ev_tipo    = EvidenceTipo.supuesto

        evidence: list[EvidenceItem] = []
        if valor is not None:
            evidence.append(EvidenceItem(
                texto_claim=f"Valor de {kpi_id}: {valor}",
                tipo=ev_tipo,
                fuente=fuente,
                kpi_ids=[kpi_id],
                confianza=conf,
                lenguaje_permitido=lang,
            ))

        review = (ClaimReviewStatus.aprobado
                  if evidence else ClaimReviewStatus.requiere_fuente)

        entries.append(ClaimEntry(
            document_id=document_id,
            section_id="kpis_simulador",
            claim_text=f"{kpi_id}: {valor}",
            claim_type=(ClaimType.dato
                        if src_status == SourceStatus.verificado
                        else ClaimType.interpretacion),
            evidence_items=evidence,
            source_status=src_status,
            confidence=conf,
            allowed_language=lang,
            review_status=review,
        ))

    return ClaimLedger(document_id=document_id, entries=entries)


# ─── Agente con contexto ──────────────────────────────────────────────────────

async def _call_agent_with_context(
    context: AgentContext,
    system_prompt: str,
    plan_input: PlanInput,
    output: PlanOutput,
) -> None:
    """
    Llama al agente con AgentContext (ScenarioBundle + DocumentSpec).
    Nunca recibe solo PlanInput.

    Produce:
      - Resultado en DraftDocument del DraftBundle (Fase 3B)
      - Resultado en PlanOutput legacy (compatibilidad)
    """
    from app.agents.prompt_builder import build_agent_prompt

    # Prompt estructurado desde contratos
    agent_prompt = build_agent_prompt(
        context.agent_name,
        context.spec,
        context.bundle,
        context.evidence_pack,
    )

    try:
        from app.config import settings
        use_llm = (
            settings.ANTHROPIC_API_KEY
            and settings.ANTHROPIC_API_KEY != "tu_anthropic_api_key_aqui"
        )
    except Exception:
        use_llm = False

    if use_llm:
        try:
            # El rol (*_system.md) debe combinarse con el contrato documental +
            # protocolo municipal y expediente (system_context del prompt_builder);
            # sin esto el modelo no recibe MunicipalReasoningDossier ni reglas duras.
            combined_system = (
                f"{system_prompt}\n\n---\n\n{agent_prompt.system_context}"
            )
            text = await _call_anthropic_text(
                context.agent_name, combined_system, agent_prompt.user_context
            )
            _store_agent_output(context.agent_name, text, output)
            _store_in_draft_bundle(context, text, is_fallback=False)
            return
        except Exception as e:
            logger.warning(f"Anthropic call falló para {context.agent_name}: {e} — template")

    # Fallback: template estructurado
    _apply_template(context.agent_name, plan_input, output)
    text = _get_template_text(context.agent_name, plan_input)
    _store_in_draft_bundle(context, text, is_fallback=True)


def _store_in_draft_bundle(
    context: AgentContext,
    text: str,
    is_fallback: bool,
) -> None:
    """Almacena el texto del agente en el DraftDocument correspondiente del DraftBundle."""
    if not text:
        return

    sections = _text_to_sections(text, context.spec)
    # Buscar el DraftDocument que corresponde al spec del agente
    doc = context.draft_bundle.documento_por_id(context.spec.document_id)
    if doc is None:
        # Si no existe, tomar el primero no poblado
        for d in context.draft_bundle.documentos:
            if not d.secciones:
                doc = d
                break

    if doc is None:
        return

    # Solo poblar si no tiene secciones aún (el primero que llega gana)
    if not doc.secciones:
        doc.secciones = sections
        doc.is_fallback = is_fallback


# ─── Anthropic call (texto puro) ─────────────────────────────────────────────

async def _call_anthropic_text(
    agent_name: str,
    system_prompt: str,
    user_message: str,
) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic()
    try:
        from app.config import settings
        model = getattr(settings, "ANTHROPIC_MODEL", "claude-sonnet-4-6")
    except Exception:
        model = "claude-sonnet-4-6"
    message = await client.messages.create(
        model=model,
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return message.content[0].text if message.content else ""


def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}_system.md"
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        text = f"Eres el agente {name} del sistema ÁGORA GOV."
    if name == "validador":
        ref = PROMPTS_DIR / "formulas_rsu_reference.md"
        if ref.exists():
            text += "\n\n---\n\n## Referencia numérica RSU\n\n" + ref.read_text(encoding="utf-8")
    return text


def _store_agent_output(agent_name: str, content: str, output: PlanOutput) -> None:
    """Almacena texto en PlanOutput legacy para compatibilidad."""
    if agent_name == "arquitecto":
        output.marco_legal = content
    elif agent_name == "ghostwriter":
        output.reforma = content
    elif agent_name == "comparador":
        output.benchmark = content
    elif agent_name == "mapeador":
        output.stakeholders = content
    elif agent_name == "humanizador":
        output.reporte_ejecutivo = content
    elif agent_name == "director":
        output.plan_impl = content
    elif agent_name in ("rutas", "flota", "territorio", "supply_chain"):
        # Almacenar en operations_summary como sub-clave
        if output.modelo_cfo is None:
            output.modelo_cfo = {}
        output.modelo_cfo[f"logistica_{agent_name}"] = content


def _get_template_text(agent_name: str, p: PlanInput) -> str:
    """Retorna el texto de template para un agente dado."""
    kpis = p.kpis_json or {}
    templates = {
        "arquitecto": f"""# DIAGNÓSTICO REGLAMENTARIO — {p.municipio.upper()}

## 1. Situación actual
El municipio de {p.municipio} requiere revisión de su reglamento de limpia o
instrumento equivalente antes de proponer obligaciones, sanciones o reformas.
La ZM {p.zm} sólo sirve como lectura territorial y no sustituye al municipio.

## 2. Brechas identificadas
- Reglamento municipal: pendiente de fuente verificable en este fallback.
- Sancionalidad: pendiente de validación jurídica municipal.
- Operación, bitácora, inspección y capacidad: pendientes de evidencia municipal.

## 3. Marco legal de referencia
- LGPGIR y NOM aplicables sólo como marco general de referencia.
- Reglamento municipal vigente: pendiente de fuente oficial o manifest validado.

## 4. Bloqueos y siguiente acción
No redactar reforma, sanción firme ni dictamen hasta validar reglamento, fuente,
brecha crítica y competencia municipal.

Generado por ÁGORA GOV · {p.zm} · Plataforma ALQUIMIA""",

        "ghostwriter": f"""# INICIATIVA DE REFORMA REGLAMENTARIA — {p.municipio.upper()}

## Exposición de motivos
El presente borrador es una propuesta expositiva sujeta a revisión competente.
El simulador proyecta una TIR de {kpis.get('tir', '—')}%
y VPN de ${kpis.get('vpn', 0):,.0f} MXN (estimaciones del modelo).

## Artículos propuestos

**Artículo 1.** Pendiente de redacción por jurista municipal tras validar
reglamento, competencia, fuente oficial y madurez operativa.

**Artículo 2.** Cualquier obligación sobre centros de acopio, concesionario,
inspección o sanción queda bloqueada si no existe fuente jurídica municipal y
evidencia operativa suficiente.

Generado por ÁGORA GOV · Plataforma ALQUIMIA""",

        "comparador": f"""# BENCHMARK LATAM — {p.municipio.upper()}

## Comparables

| Caso comparable | Condición habilitante | Diferencia crítica | Fuente |
|------------------|-----------------------|--------------------|--------|
| Pendiente de fuente verificable | Pendiente | Pendiente | pendiente_fuente |

## Posicionamiento de {p.municipio}
No se puede posicionar al municipio frente a ciudades latinoamericanas sin
fuentes comparables, metodología y condición habilitante. Este fallback conserva
la comparación como pendiente, no como conclusión.

Generado por ÁGORA GOV · Plataforma ALQUIMIA""",

        "mapeador": f"""# MAPEO DE STAKEHOLDERS — {p.municipio.upper()}

## Actores de alto poder e influencia (prioridad 1)
- **Presidencia Municipal**: rol probable de decisión; requiere confirmación local.
- **Servicios Públicos o área equivalente**: posible responsable operativo; nombre institucional pendiente de fuente.
- **Operador o concesionario**: sólo incluir si existe contrato o fuente verificable.

## Actores a convertir (prioridad 2)
- **Cabildo y comisiones aplicables**: requieren evidencia técnica, jurídica y financiera.
- **Ciudadanía y recicladores de base**: pendientes de mapeo con fuente municipal.

## Riesgos y mitigaciones
- No comunicar nombres, contratos, colonias ni conflictos sin fuente verificable.

Generado por ÁGORA GOV · Plataforma ALQUIMIA""",

        "director": f"""# PLAN DOCUMENTAL — {p.municipio.upper()}

## Resumen
El simulador proyecta: TIR {kpis.get('tir', '—')}% | VPN ${kpis.get('vpn', 0):,.0f} MXN

## Fases

### Fase 1 (Meses 0–6): Alineación institucional
- Aprobación reforma reglamentaria en Cabildo
- Firma adenda con concesionario

### Fase 2 (Meses 6–12): Despliegue piloto
- Construcción de centros de acopio
- Arranque operativo con KPIs semanales

### Fase 3 (Meses 12–36): Escalamiento
- Expansión progresiva
- Evaluación trimestral vs proyecciones

Generado por ÁGORA GOV · Plataforma ALQUIMIA""",

        "humanizador": f"""# REPORTE EJECUTIVO — {p.municipio.upper()}

## Propuesta

El programa ALQUIMIA para {p.municipio} muestra viabilidad financiera:
el simulador proyecta una TIR de {kpis.get('tir', '—')}% y VPN positivo
de ${kpis.get('vpn', 0):,.0f} MXN bajo los supuestos del modelo.

## Impacto estimado (sujeto a verificación operativa)

- Empleos directos: {kpis.get('empleos_directos', 0):.0f}
- CO₂e evitadas: {kpis.get('co2e_evitadas', 0)/1000:.1f}K ton/año
- Payback: {kpis.get('payback_meses', 0):.0f} meses

## Recomendación

Presentar al Cabildo con las advertencias activas de datos y el diagnóstico jurídico.

Plataforma ALQUIMIA · {p.zm}""",

        "validador": "",  # Validador no produce texto — produce ValidationReport

        # ── Wave 1: Agentes logísticos ────────────────────────────────────────
        "rutas": f"""# PLAN DE RUTAS DE RECOLECCIÓN — {p.municipio.upper()}

## 1. Zonificación de sectores
Sin datos de rutas verificables en este fallback. La zonificación requiere
composición RSU municipal y distancias al Centro de Acopio más cercano.

## 2. Rutas por sector y CA asignado

| Sector | CA asignado | km/ruta (est.) | Frecuencia | Costo mensual (est.) |
|--------|------------|----------------|------------|----------------------|
| Zona A (alta densidad) | CA-01 | 18 km | Diaria | supuesto_editable |
| Zona B (densidad media) | CA-01 | 25 km | 3x/semana | supuesto_editable |

## 3. Frecuencias y horarios
- Zona A: recolección diaria 6:00–14:00 h
- Zona B: lunes, miércoles, viernes 6:00–14:00 h

## 4. Costo mensual por ruta
Precio diesel: pendiente de fuente — usar precio PEMEX más reciente.
Consumo estimado: 4 km/litro (supuesto_editable para camión 12 ton).

## 5. Supuestos y fuentes
- Distancias: estimadas (pendiente de verificación con cartografía municipal)
- Precio diesel: supuesto_editable — actualizar con PEMEX al inicio del programa

Generado por ÁGORA GOV · Plataforma ALQUIMIA""",

        "flota": f"""# DIMENSIONAMIENTO DE FLOTA — {p.municipio.upper()}

## 1. Demanda de recolección
Generación per cápita estimada: {p.scenario_json.get('gen_percapita_kg_dia', 0.9):.2f} kg/hab/día (supuesto_editable).
Toneladas/día objetivo: pendiente de fuente — derivado del simulador.

## 2. Número de unidades requeridas
- Capacidad por camión: 12 ton (supuesto_editable)
- Flota mínima estimada: 2–4 unidades (escala con población y rutas)
- Factor de reserva 15%: 1 unidad adicional recomendada

## 3. CAPEX de flota
Precio camión recolector 12 ton: pendiente de cotización formal.
Referencia de mercado: $1,800,000–$2,500,000 MXN (2025, supuesto_editable).

## 4. OPEX vehicular mensual
- Diesel: pendiente de cálculo con km/ruta y precio PEMEX
- Mantenimiento: 2.5% anual sobre valor del vehículo (supuesto_editable)

## 5. Ciclo de reposición
Vida útil estimada: 8–10 años. Primera reposición: Año 8 con ajuste por inflación.

Generado por ÁGORA GOV · Plataforma ALQUIMIA""",

        "territorio": f"""# SEGMENTACIÓN TERRITORIAL — {p.municipio.upper()}

## 1. Zonificación municipal

| Zona | Tipo | Criterio | CA asignado | Viviendas (est.) | Riesgo participación |
|------|------|----------|-------------|-----------------|----------------------|
| Zona A | Arranque (sem. 1–12) | Alta densidad, accesibilidad alta | CA-01 | estimado_modelo | Bajo |
| Zona B | Expansión (sem. 13–26) | Densidad media | CA-01 | estimado_modelo | Medio |
| Zona C | Consolidación (sem. 27+) | Periférica/dispersa | CA-01 | estimado_modelo | Alto |

## 2. Criterios de priorización
- Densidad de viviendas por colonia (INEGI o estimación municipal)
- Accesibilidad vehicular de los camiones
- Presencia de escuelas u organizaciones vecinales activas

## 3. Cobertura por ola
- Ola 1 (sem. 12): ~35% de viviendas
- Ola 2 (sem. 26): ~65% de viviendas
- Ola 3 (sem. 52): cobertura total estimada

## 4. Riesgos y mitigaciones
- Baja participación Zona B/C: campaña previa de 4 semanas con encuesta de base
- Acceso limitado en zonas periféricas: vehículos de menor capacidad o rutas adaptadas

Fuentes: estimación del modelo — verificar con padrón municipal y cartografía INEGI.

Generado por ÁGORA GOV · Plataforma ALQUIMIA""",

        "supply_chain": f"""# CADENA DE SUMINISTRO Y COMERCIALIZACIÓN — {p.municipio.upper()}

## 1. Volúmenes estimados por material

| Material | % en RSU (est.) | ton/año (est.) | Fuente composición |
|----------|-----------------|----------------|--------------------|
| PET | 5.0% | estimado_modelo | supuesto_editable |
| HDPE | 3.5% | estimado_modelo | supuesto_editable |
| Aluminio | 1.0% | estimado_modelo | supuesto_editable |
| Cartón/Papel | 12.0% | estimado_modelo | supuesto_editable |
| Vidrio | 4.0% | estimado_modelo | supuesto_editable |
| Orgánico | 50.0% | estimado_modelo | supuesto_editable |

## 2. Precios de mercado

| Material | Precio (MXN/kg) | Fuente | Clasificación |
|----------|-----------------|--------|---------------|
| PET | 7.00–8.50 | Referencia mercado CANIRAC/sector | supuesto_editable |
| Aluminio | 20.00–24.00 | Referencia mercado nacional | supuesto_editable |
| Cartón | 1.80–2.20 | Referencia mercado nacional | supuesto_editable |

## 3. Compradores identificados
Pendiente de verificación local. Consultar base de datos de Centros de Acopio
en /api/v1/centros-acopio/?zm={p.zm} para compradores verificados en la ZM.

## 4. Ingresos proyectados
Proyección completa pendiente de: (a) precio de materiales verificado, (b) volúmenes
con composición RSU municipal, (c) comprador confirmado por material.

## 5. Riesgo de no-colocación
Materiales sin comprador: vidrio, orgánicos — identificar mercado antes de arrancar.

Generado por ÁGORA GOV · Plataforma ALQUIMIA""",
    }
    return templates.get(agent_name, "")


def _apply_template(agent_name: str, p: PlanInput, output: PlanOutput) -> None:
    """Compatibilidad legacy — almacena texto en PlanOutput."""
    text = _get_template_text(agent_name, p)
    _store_agent_output(agent_name, text, output)


# ─── Export a Drive ───────────────────────────────────────────────────────────

async def _upload_from_export_bundle(
    plan_input: PlanInput,
    export_bundle: ExportBundle,
    draft_bundle: DraftBundle,
) -> dict:
    """
    Sube documentos a Drive desde ExportBundle.
    Lee de export_bundle.documents — no de strings hardcodeados.
    Los archivos son .md o .docx, NUNCA .txt.
    """
    from app.agents.exporter import render_draft_document_as_markdown

    try:
        from app.config import settings
    except Exception:
        logger.info("Config no disponible — subida a Drive omitida")
        return {}

    if (not settings.GOOGLE_SERVICE_ACCOUNT_FILE
            or settings.GOOGLE_SERVICE_ACCOUNT_FILE == "./service-account.json"):
        if not Path(settings.GOOGLE_SERVICE_ACCOUNT_FILE).exists():
            logger.info("service-account.json no encontrado — documentos en memoria")
            return {}

    zm_folder_map = {
        "QRO": settings.DRIVE_QRO_ID,
        "MTY": settings.DRIVE_NL_ID,
        "NL":  settings.DRIVE_NL_ID,
        "GTO": settings.DRIVE_GTO_ID,
        "SLP": settings.DRIVE_SLP_ID,
    }
    zm_folder = zm_folder_map.get(plan_input.zm, settings.DRIVE_ROOT_ID)

    ids: dict[str, str] = {}

    try:
        from googleapiclient.discovery import build
        from google.oauth2 import service_account
        from googleapiclient.http import MediaInMemoryUpload

        creds = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_SERVICE_ACCOUNT_FILE,
            scopes=["https://www.googleapis.com/auth/drive.file"],
        )
        service = build("drive", "v3", credentials=creds)

        # Manifest como JSON
        if export_bundle.manifest:
            import json
            manifest_content = export_bundle.manifest.model_dump_json(indent=2)
            _drive_upload(service, zm_folder, "00_Manifest_De_Paquete.json",
                          manifest_content.encode(), "application/json", ids)

        # Documentos desde DraftBundle
        for exported_doc in export_bundle.documents:
            if exported_doc.status == DocumentStatusLevel.bloqueado:
                continue  # no subir bloqueados

            draft_doc = draft_bundle.documento_por_id(exported_doc.document_id)
            if draft_doc:
                content_md = render_draft_document_as_markdown(draft_doc)
            else:
                content_md = f"# {exported_doc.filename}\n\n(Sin contenido)\n"

            # Siempre .md, nunca .txt
            assert not exported_doc.filename.endswith(".txt")
            _drive_upload(service, zm_folder, exported_doc.filename,
                          content_md.encode("utf-8"), "text/markdown", ids)

    except Exception as e:
        logger.error(f"Error subiendo a Drive: {e}")

    return ids


def _drive_upload(service, folder_id, nombre, contenido_bytes, mimetype, ids):
    from googleapiclient.http import MediaInMemoryUpload
    file_meta = {"name": nombre, "parents": [folder_id]}
    media = MediaInMemoryUpload(contenido_bytes, mimetype=mimetype)
    f = service.files().create(body=file_meta, media_body=media, fields="id").execute()
    ids[nombre] = f.get("id")
    logger.info(f"Subido: {nombre} → {f.get('id')}")


# ─── Utilidades ───────────────────────────────────────────────────────────────

def _format_document_plan_summary(document_plan: DocumentPlan) -> str:
    lines = [
        f"# PLAN DOCUMENTAL — ZM {document_plan.zm}",
        f"Municipios: {', '.join(document_plan.municipios)}",
        f"Documentos: {len(document_plan.specs)}",
        "",
    ]
    for spec in document_plan.specs:
        dec = spec.decision_que_habilita
        dec_short = (dec[:77] + "...") if len(dec) > 80 else dec
        lines.append(
            f"[{spec.nivel.value.upper()}] {spec.document_id}\n"
            f"  Título: {spec.titulo}\n"
            f"  Audiencia: {', '.join(spec.audiencia[:3])}\n"
            f"  Decisión: {dec_short}"
        )
        lines.append("")
    if document_plan.warnings:
        lines.append("⚠️  ADVERTENCIAS:")
        for w in document_plan.warnings:
            lines.append(f"  - {w}")
    return "\n".join(lines)


def _format_kpis(kpis: dict) -> str:
    if not kpis:
        return "(sin KPIs — escenario demo)"
    mapping = {
        "tir":             "TIR (%)",
        "vpn":             "VPN (MXN)",
        "payback_meses":   "Payback (meses)",
        "ingresos_brutos": "Ingresos brutos anuales (MXN)",
        "empleos_directos": "Empleos directos",
        "co2e_evitadas":   "CO₂e evitadas (ton/año)",
        "capex_total":     "CAPEX total (MXN)",
    }
    lines = []
    for key, label in mapping.items():
        if key in kpis:
            v = kpis[key]
            lines.append(
                f"- {label}: {v:,.1f}" if isinstance(v, float) else f"- {label}: {v}"
            )
    return "\n".join(lines) or str(kpis)
