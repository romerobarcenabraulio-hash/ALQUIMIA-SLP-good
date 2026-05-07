"""
Motor de diagnóstico jurídico.

Dado un municipio_id produce un LegalDiagnostic con:
  - matriz de 12 artículos canónicos con su estado actual
  - métricas derivadas (brecha, score, booleanos clave)
  - gate ÁGORA (agora_bloqueado ↔ reglamento no verificado)
"""
from __future__ import annotations

from datetime import date

from app.legal.schemas import (
    ArticuloMatriz, EstadoArticulo,
    Criticidad, LegalDiagnostic, LegalSourceIngestStatus,
    LegalSourceValidationStatus,
    MunicipalLegalContext,
)
from app.legal.municipal_legal_copy import build_legal_disclaimer, build_next_action
from app.legal.repository import get_repo
from app.legal.reform_strategy import select_strategy
from app.legal.source_ingest import locate_municipal_legal_source


# ─── Pesos para score_legal (0-100) ──────────────────────────────────────────
#
#   presente_adecuado  → puntos_max  del artículo (según criticidad)
#   presente_obsoleto  → puntos_max * 0.5
#   ausente / conflicto → 0
#
_PUNTOS = {
    Criticidad.alta:  12,
    Criticidad.media:  6,
    Criticidad.baja:   3,
}

# Total teórico si todos los artículos fueran presente_adecuado con los pesos canónicos.
# Calculado dinámicamente desde _CANONICAL en repository.py.
# Aquí lo fijamos explícitamente para consistencia.
_PUNTOS_MAX_TOTAL = (
    5 * _PUNTOS[Criticidad.alta]    # Arts. 1-6 sin Art.8 (media)  → ver distribución abajo
    + 3 * _PUNTOS[Criticidad.alta]  # completamos los 8 alta
    + 3 * _PUNTOS[Criticidad.media] # 3 media
    + 1 * _PUNTOS[Criticidad.baja]  # 1 baja
)
# Alta: Arts 1,2,3,4,5,6,7,11 = 8 artículos × 12 = 96
# Media: Arts 8,9,10 = 3 × 6 = 18
# Baja: Art 12 = 1 × 3 = 3
# Total = 117  → normalizamos a 100
_PUNTOS_MAX_TOTAL = 8 * 12 + 3 * 6 + 1 * 3  # = 117


def _sanctions_blocked_reason(
    *,
    can_enable: bool,
    score_legal: int,
    tiene_sancion_ejecutable: bool,
    ingest_verified: bool,
    validation_status: LegalSourceValidationStatus,
) -> str | None:
    if can_enable:
        return None
    parts: list[str] = []
    if not ingest_verified:
        if score_legal >= 50 and tiene_sancion_ejecutable:
            parts.append(
                "Bloqueado por manifest no verificado; no por contenido normativo."
            )
        else:
            parts.append(
                "Manifiesto de fuente sin estado de ingesta `verified`."
            )
    if validation_status != LegalSourceValidationStatus.validado_externamente:
        parts.append(
            "Sanciones bloqueadas: se requiere fuente municipal validada externamente."
        )
    if score_legal < 50:
        parts.append("Score legal inferior a 50 puntos en esta política.")
    return " ".join(parts) if parts else "Sanciones deshabilitadas por política ALQUIMIA."


def _puntos_articulo(art: ArticuloMatriz) -> float:
    base = _PUNTOS[art.criticidad]
    if art.estado == EstadoArticulo.presente_adecuado:
        return base
    if art.estado == EstadoArticulo.presente_obsoleto:
        return base * 0.5
    return 0.0  # ausente o conflicto


def build_diagnostic(municipio_id: str) -> LegalDiagnostic | None:
    repo = get_repo()
    reg  = repo.get_reglamento(municipio_id)
    if reg is None:
        return None

    articulos = repo.get_articulos(municipio_id)

    # ── Métricas ─────────────────────────────────────────────────────────────
    brecha_total   = sum(
        1 for a in articulos
        if a.estado in (EstadoArticulo.ausente, EstadoArticulo.conflicto)
    )
    brecha_critica = sum(
        1 for a in articulos
        if a.estado in (EstadoArticulo.ausente, EstadoArticulo.conflicto)
        and a.criticidad == Criticidad.alta
    )

    puntos_obtenidos = sum(_puntos_articulo(a) for a in articulos)
    score_legal      = min(100, round(puntos_obtenidos / _PUNTOS_MAX_TOTAL * 100))

    # ── Booleanos clave ───────────────────────────────────────────────────────
    tiene_separacion_origen   = any(
        a.numero in ("Art. 1", "Art. 2") and a.estado == EstadoArticulo.presente_adecuado
        for a in articulos
    )
    tiene_tarifa_diferenciada = any(
        a.numero == "Art. 7" and a.estado == EstadoArticulo.presente_adecuado
        for a in articulos
    )
    tiene_figura_reciclador   = any(
        a.numero == "Art. 6" and a.estado == EstadoArticulo.presente_adecuado
        for a in articulos
    )
    tiene_sancion_ejecutable  = any(
        a.numero == "Art. 11" and a.estado == EstadoArticulo.presente_adecuado
        for a in articulos
    )

    # ── Gate ÁGORA ────────────────────────────────────────────────────────────
    agora_bloqueado = not reg.verificado  # reglamento sin fuente verificada → bloquea
    source_manifest = locate_municipal_legal_source(municipio_id)
    if source_manifest is None:
        return None

    has_validated_source = (
        source_manifest.validation_status == LegalSourceValidationStatus.validado_externamente
    )
    ingest_verified = source_manifest.ingest_status == LegalSourceIngestStatus.verified

    diag_tmp = LegalDiagnostic(
        municipio_id=municipio_id.lower(),
        zm=reg.zm,
        reglamento_nombre=reg.nombre,
        reglamento_version=reg.version,
        reglamento_fuente=reg.fuente,
        fecha_diagnostico=date.today().isoformat(),
        articulos=articulos,
        brecha_total=brecha_total,
        brecha_critica=brecha_critica,
        tiene_separacion_origen=tiene_separacion_origen,
        tiene_tarifa_diferenciada=tiene_tarifa_diferenciada,
        tiene_figura_reciclador=tiene_figura_reciclador,
        tiene_sancion_ejecutable=tiene_sancion_ejecutable,
        score_legal=score_legal,
        requiere_revision_juridica=reg.requiere_revision_juridica,
        agora_bloqueado=agora_bloqueado,
        source_manifest=source_manifest,
        legal_validation_status=source_manifest.validation_status,
        officiality=source_manifest.officiality,
        can_enable_education=source_manifest.can_enable_education,
        can_enable_simulation=source_manifest.can_enable_simulation,
        can_enable_sanctions=False,
        can_generate_official_document=False,
        sanctions_blocked_reason=None,
        official_document_blocked_reason=None,
        next_action="",
        legal_disclaimer="",
    )
    strat = select_strategy(diag_tmp)

    can_enable_sanctions = bool(
        ingest_verified
        and source_manifest.validation_status == LegalSourceValidationStatus.validado_externamente
        and score_legal >= 50
    )
    can_generate_official_document = has_validated_source

    sanctions_blocked_reason = _sanctions_blocked_reason(
        can_enable=can_enable_sanctions,
        score_legal=score_legal,
        tiene_sancion_ejecutable=tiene_sancion_ejecutable,
        ingest_verified=ingest_verified,
        validation_status=source_manifest.validation_status,
    )
    official_document_blocked_reason = None if can_generate_official_document else (
        "Documento oficial bloqueado: ALQUIMIA solo puede producir insumos expositivos "
        "hasta validación competente y aprobación de autoridad facultada."
    )
    next_action = build_next_action(
        municipio_id=municipio_id.lower(),
        has_validated_source=has_validated_source,
        strategy=strat,
    )
    legal_disclaimer = build_legal_disclaimer(
        municipio_id=municipio_id.lower(),
        reglamento_nombre=reg.nombre,
        brecha_critica=brecha_critica,
    )

    return diag_tmp.model_copy(
        update={
            "can_enable_sanctions": can_enable_sanctions,
            "can_generate_official_document": can_generate_official_document,
            "sanctions_blocked_reason": sanctions_blocked_reason,
            "official_document_blocked_reason": official_document_blocked_reason,
            "next_action": next_action,
            "legal_disclaimer": legal_disclaimer,
        }
    )


def build_municipal_legal_context(municipio_id: str) -> MunicipalLegalContext | None:
    repo = get_repo()
    diag = build_diagnostic(municipio_id)
    if diag is None:
        return None
    strategy = select_strategy(diag)
    obligaciones = [
        f"{a.numero}: {a.titulo}"
        for a in diag.articulos
        if a.estado == EstadoArticulo.presente_adecuado
    ]
    limites = [
        f"{a.numero}: {a.titulo} ({a.estado.value})"
        for a in diag.articulos
        if a.estado in (EstadoArticulo.ausente, EstadoArticulo.conflicto, EstadoArticulo.presente_obsoleto)
    ]
    bloqueos = list(diag.source_manifest.blockers)
    if diag.sanctions_blocked_reason:
        bloqueos.append(diag.sanctions_blocked_reason)
    if diag.official_document_blocked_reason:
        bloqueos.append(diag.official_document_blocked_reason)

    return MunicipalLegalContext(
        municipio_id=diag.municipio_id,
        municipio_nombre=repo.get_municipio_nombre(diag.municipio_id),
        zm=diag.zm,
        diagnostic=diag,
        strategy=strategy,
        source_manifest=diag.source_manifest,
        obligaciones=obligaciones,
        limites=limites,
        bloqueos=bloqueos,
        next_action=diag.next_action,
        can_enable_education=diag.can_enable_education,
        can_enable_simulation=diag.can_enable_simulation,
        can_enable_sanctions=diag.can_enable_sanctions,
        can_generate_official_document=diag.can_generate_official_document,
        legal_disclaimer=diag.legal_disclaimer,
    )
