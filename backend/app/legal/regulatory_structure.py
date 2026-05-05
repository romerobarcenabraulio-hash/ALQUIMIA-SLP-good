"""Fase 11.2: mapa de inserción normativa municipal expositiva."""
from __future__ import annotations

from typing import Iterable, Optional

from app.legal.diagnostic import build_diagnostic
from app.legal.repository import get_repo
from app.legal.schemas import (
    ArticuloMatriz,
    EstadoArticulo,
    LegalSourceIngestStatus,
    LegalSourceValidationStatus,
    LegalValidationGate,
    MunicipalLegalInsertionMap,
    NormativeInsertionProposal,
    NormativeProposalStatus,
    NormativeTechnique,
    RegulatoryNodeType,
    RegulatoryStructureNode,
)


_DISCLAIMER = (
    "ALQUIMIA produce insumos expositivos sujetos a revisión jurídica competente "
    "y aprobación municipal por las vías aplicables."
)


def _article_number(raw: str) -> str:
    return raw.replace("Art.", "Articulo").strip()


def _suggest_number(article: ArticuloMatriz, index: int) -> str:
    base = _article_number(article.numero)
    if index == 0:
        return f"{base} Bis"
    if index == 1:
        return f"{base} Ter"
    if index == 2:
        return f"{base} Quater"
    return base


def _gate(
    validation_status: LegalSourceValidationStatus,
    blockers: Iterable[str],
    next_action: str,
) -> LegalValidationGate:
    return LegalValidationGate(
        validation_status=validation_status,
        requires_jurist_review=True,
        blocks_sanctions=True,
        blocks_definitive_document=True,
        blockers=list(blockers),
        next_action=next_action,
        disclaimer=_DISCLAIMER,
    )


def _base_structure(municipio_id: str, regulation_title: str, articles: list[ArticuloMatriz]) -> RegulatoryStructureNode:
    article_nodes = [
        RegulatoryStructureNode(
            node_id=f"{municipio_id}-{article.numero.lower().replace(' ', '-')}",
            node_type=RegulatoryNodeType.articulo,
            label=f"{article.numero}. {article.titulo}",
            number=article.numero,
            title=article.titulo,
            text_excerpt=article.texto_actual,
            children=(
                [
                    RegulatoryStructureNode(
                        node_id=f"{municipio_id}-{article.numero.lower().replace(' ', '-')}-parrafo-1",
                        node_type=RegulatoryNodeType.parrafo,
                        label="Parrafo localizado en fuente municipal",
                        number="1",
                        text_excerpt=article.texto_actual,
                    )
                ]
                if article.texto_actual
                else []
            ),
        )
        for article in articles
    ]

    return RegulatoryStructureNode(
        node_id=f"{municipio_id}-reglamento",
        node_type=RegulatoryNodeType.reglamento,
        label=regulation_title,
        title=regulation_title,
        children=[
            RegulatoryStructureNode(
                node_id=f"{municipio_id}-titulo-primero",
                node_type=RegulatoryNodeType.titulo,
                label="Titulo Primero. Disposiciones generales y gestion RSU municipal",
                number="Titulo Primero",
                children=[
                    RegulatoryStructureNode(
                        node_id=f"{municipio_id}-capitulo-i",
                        node_type=RegulatoryNodeType.capitulo,
                        label="Capitulo I. Objeto, separacion, recoleccion y valorizacion",
                        number="Capitulo I",
                        children=[
                            RegulatoryStructureNode(
                                node_id=f"{municipio_id}-seccion-rsu",
                                node_type=RegulatoryNodeType.seccion,
                                label="Seccion I. Residuos solidos urbanos municipales",
                                number="Seccion I",
                                children=article_nodes,
                            )
                        ],
                    )
                ],
            ),
            RegulatoryStructureNode(
                node_id=f"{municipio_id}-transitorios",
                node_type=RegulatoryNodeType.transitorio,
                label="Articulos transitorios propuestos para implementacion gradual",
                number="Transitorios",
            ),
            RegulatoryStructureNode(
                node_id=f"{municipio_id}-anexo-tecnico-rsu",
                node_type=RegulatoryNodeType.anexo_tecnico,
                label="Anexo tecnico de separacion y reporte RSU municipal",
                number="Anexo Tecnico",
            ),
            RegulatoryStructureNode(
                node_id=f"{municipio_id}-lineamiento-operativo-rsu",
                node_type=RegulatoryNodeType.lineamiento_tecnico,
                label="Lineamientos tecnicos operativos de RSU municipal",
                number="Lineamiento Tecnico",
            ),
        ],
    )


def _permanent_text(article: ArticuloMatriz) -> str:
    return (
        f"Se propone regular {article.titulo.lower()} para residuos solidos urbanos "
        "municipales, con obligaciones, responsables, evidencia operativa y trazabilidad "
        "de cumplimiento dentro de la competencia municipal."
    )


def _proposal_for_article(
    municipio_id: str,
    regulation_title: str,
    article: ArticuloMatriz,
    index: int,
    source_manifest,
    validation_gate: LegalValidationGate,
) -> NormativeInsertionProposal:
    technique = (
        NormativeTechnique.reformar
        if article.estado == EstadoArticulo.presente_obsoleto
        else NormativeTechnique.adicionar
    )
    suggested_number = _suggest_number(article, index)
    return NormativeInsertionProposal(
        proposal_id=f"{municipio_id}-{article.numero.lower().replace(' ', '-')}-{technique.value}",
        municipio_id=municipio_id,
        reglamento_titulo=regulation_title,
        source_manifest=source_manifest,
        validation_status=source_manifest.validation_status,
        proposal_status=NormativeProposalStatus.pendiente_validacion_juridica,
        categoria_reforma=article.categoria.value,
        ubicacion_probable="Titulo Primero / Capitulo I / Seccion I",
        articulo_o_seccion_relacionada=f"{article.numero}: {article.titulo}",
        tecnica_sugerida=technique,
        numeracion_sugerida=suggested_number,
        texto_base_sugerido=_permanent_text(article),
        justificacion=(
            "La matriz municipal marca esta materia como ausente, en conflicto u obsoleta; "
            "la propuesta orienta la discusion tecnica sin cerrar redaccion normativa."
        ),
        riesgos_armonizacion=[
            "Verificar competencia municipal y concordancia con legislacion estatal y federal aplicable.",
            "Mantener alcance en RSU municipal; residuos peligrosos, especiales o regulados requieren via normativa distinta.",
            "Confirmar numeracion y tecnica con el texto completo del reglamento base.",
        ],
        confidence=0.64 if article.estado == EstadoArticulo.ausente else 0.58,
        requiere_validacion_juridica=True,
        is_definitive=False,
        legal_validation_gate=validation_gate,
    )


def _transitory_proposal(municipio_id: str, regulation_title: str, source_manifest, validation_gate: LegalValidationGate) -> NormativeInsertionProposal:
    return NormativeInsertionProposal(
        proposal_id=f"{municipio_id}-transitorio-primero",
        municipio_id=municipio_id,
        reglamento_titulo=regulation_title,
        source_manifest=source_manifest,
        validation_status=source_manifest.validation_status,
        proposal_status=NormativeProposalStatus.pendiente_validacion_juridica,
        categoria_reforma="implementacion_gradual",
        ubicacion_probable="Articulos transitorios",
        articulo_o_seccion_relacionada="Entrada en vigor y programa de implementacion",
        tecnica_sugerida=NormativeTechnique.transitorio,
        numeracion_sugerida="Transitorio Primero",
        texto_base_sugerido=(
            "La implementacion de las obligaciones de separacion y reporte RSU municipal "
            "podra programarse por etapas mediante calendario municipal de implementacion."
        ),
        justificacion="Distingue calendario de implementacion de obligaciones permanentes.",
        riesgos_armonizacion=[
            "No convertir un transitorio en obligacion permanente.",
            "Alinear plazos con presupuesto, capacidad operativa y campanas educativas.",
        ],
        confidence=0.62,
        requiere_validacion_juridica=True,
        is_definitive=False,
        is_permanent_obligation=False,
        legal_validation_gate=validation_gate,
    )


def _technical_guideline_proposal(
    municipio_id: str,
    regulation_title: str,
    source_manifest,
    validation_gate: LegalValidationGate,
) -> NormativeInsertionProposal:
    return NormativeInsertionProposal(
        proposal_id=f"{municipio_id}-lineamiento-tecnico-rsu",
        municipio_id=municipio_id,
        reglamento_titulo=regulation_title,
        source_manifest=source_manifest,
        validation_status=source_manifest.validation_status,
        proposal_status=NormativeProposalStatus.pendiente_validacion_juridica,
        categoria_reforma="lineamiento_operativo",
        ubicacion_probable="Lineamientos tecnicos derivados",
        articulo_o_seccion_relacionada="Separacion, acopio, medicion y reporte RSU municipal",
        tecnica_sugerida=NormativeTechnique.lineamiento_tecnico,
        numeracion_sugerida="Lineamiento Tecnico RSU-01",
        texto_base_sugerido=(
            "Emitir criterios tecnicos de separacion, acopio temporal, medicion y reporte "
            "de RSU municipal para apoyar la ejecucion operativa del programa."
        ),
        justificacion="El lineamiento detalla operacion y evidencia, pero no sustituye reforma reglamentaria.",
        riesgos_armonizacion=[
            "Un lineamiento tecnico no debe crear obligaciones o sanciones sin habilitacion reglamentaria.",
            "Requiere revisar jerarquia normativa municipal y facultades emisoras.",
        ],
        confidence=0.6,
        requiere_validacion_juridica=True,
        is_definitive=False,
        does_not_replace_regulatory_reform=True,
        legal_validation_gate=validation_gate,
    )


def _technical_annex_proposal(
    municipio_id: str,
    regulation_title: str,
    source_manifest,
    validation_gate: LegalValidationGate,
) -> NormativeInsertionProposal:
    return NormativeInsertionProposal(
        proposal_id=f"{municipio_id}-anexo-tecnico-rsu",
        municipio_id=municipio_id,
        reglamento_titulo=regulation_title,
        source_manifest=source_manifest,
        validation_status=source_manifest.validation_status,
        proposal_status=NormativeProposalStatus.pendiente_validacion_juridica,
        categoria_reforma="anexo_tecnico",
        ubicacion_probable="Anexos tecnicos",
        articulo_o_seccion_relacionada="Estandares de separacion y trazabilidad RSU municipal",
        tecnica_sugerida=NormativeTechnique.anexo_tecnico,
        numeracion_sugerida="Anexo Tecnico 1",
        texto_base_sugerido=(
            "Integrar tablas de fracciones RSU municipales, indicadores de captura, "
            "formatos de reporte y evidencia minima para seguimiento operativo."
        ),
        justificacion="El anexo ordena datos tecnicos sin invadir redaccion sustantiva del reglamento.",
        riesgos_armonizacion=[
            "El anexo tecnico debe remitir a articulo habilitante.",
            "No incorporar residuos peligrosos, especiales o regulados como RSU ordinario.",
        ],
        confidence=0.59,
        requiere_validacion_juridica=True,
        is_definitive=False,
        does_not_replace_regulatory_reform=True,
        legal_validation_gate=validation_gate,
    )


def build_municipal_legal_insertion_map(municipio_id: str) -> Optional[MunicipalLegalInsertionMap]:
    repo = get_repo()
    diag = build_diagnostic(municipio_id.lower())
    if diag is None:
        return None

    source_manifest = diag.source_manifest
    regulation_title = diag.reglamento_nombre
    structure = _base_structure(diag.municipio_id, regulation_title, diag.articulos)

    blockers = list(source_manifest.blockers)
    warnings = list(source_manifest.warnings)
    if source_manifest.ingest_status == LegalSourceIngestStatus.no_disponible:
        blockers.append("No se puede proponer ubicacion normativa sin fuente municipal localizada.")
        gate = _gate(
            source_manifest.validation_status,
            blockers,
            "Localizar reglamento municipal base antes de preparar propuesta normativa.",
        )
        return MunicipalLegalInsertionMap(
            municipio_id=diag.municipio_id,
            municipio_nombre=repo.get_municipio_nombre(diag.municipio_id),
            zm=diag.zm,
            reglamento_titulo=regulation_title,
            source_manifest=source_manifest,
            validation_status=source_manifest.validation_status,
            regulatory_structure=structure,
            proposals=[],
            validation_gate=gate,
            warnings=warnings,
            blockers=blockers,
            next_action=gate.next_action,
        )

    blockers.append("Toda propuesta requiere cotejo contra texto completo y validacion juridica competente.")
    gate = _gate(
        source_manifest.validation_status,
        blockers,
        "Cotejar texto completo, tecnica normativa y ruta de aprobacion con jurista municipal.",
    )

    candidate_articles = [
        article
        for article in diag.articulos
        if article.estado in (EstadoArticulo.ausente, EstadoArticulo.conflicto, EstadoArticulo.presente_obsoleto)
    ]
    proposals = [
        _proposal_for_article(
            diag.municipio_id,
            regulation_title,
            article,
            index,
            source_manifest,
            gate,
        )
        for index, article in enumerate(candidate_articles[:4])
    ]
    proposals.extend(
        [
            _transitory_proposal(diag.municipio_id, regulation_title, source_manifest, gate),
            _technical_guideline_proposal(diag.municipio_id, regulation_title, source_manifest, gate),
            _technical_annex_proposal(diag.municipio_id, regulation_title, source_manifest, gate),
        ]
    )

    return MunicipalLegalInsertionMap(
        municipio_id=diag.municipio_id,
        municipio_nombre=repo.get_municipio_nombre(diag.municipio_id),
        zm=diag.zm,
        reglamento_titulo=regulation_title,
        source_manifest=source_manifest,
        validation_status=source_manifest.validation_status,
        regulatory_structure=structure,
        proposals=proposals,
        validation_gate=gate,
        warnings=warnings,
        blockers=blockers,
        next_action=gate.next_action,
    )


def reject_zm_normative_insertion(zm: str) -> dict:
    return {
        "ok": False,
        "zm": zm.upper(),
        "error": "Una ZM no genera propuesta normativa municipal unica.",
        "next_action": "Construir un mapa de insercion por cada municipio de la ZM.",
    }
