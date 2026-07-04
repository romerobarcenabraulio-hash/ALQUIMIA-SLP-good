"""§5 GapDetector — nightly scan that emits DocumentGap records.

Compares every active tenant's uploaded TenantDocuments against the canonical
document canon and creates (or refreshes) DocumentGap rows for items that are
still missing or pending.  Idempotent: re-running on an already-complete tenant
is a no-op.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Sequence

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Canonical document canon
# ---------------------------------------------------------------------------
# Each entry defines a document type that every tenant must eventually supply
# for a given module.  `required_for_gate` is the earliest gate that needs it.
# ---------------------------------------------------------------------------
CANONICAL_DOCS: list[dict] = [
    # G1 — baseline evidence
    {"module_id": "marco_legal",       "document_type": "reglamento_limpia",       "required_for_gate": "G1", "priority": "high"},
    {"module_id": "marco_legal",       "document_type": "titulo_concesion",         "required_for_gate": "G1", "priority": "medium"},
    {"module_id": "city_baseline",     "document_type": "censo_poblacion_inegi",    "required_for_gate": "G1", "priority": "high"},
    {"module_id": "city_baseline",     "document_type": "diagnostico_rsu",          "required_for_gate": "G1", "priority": "high"},
    {"module_id": "infraestructura",   "document_type": "auditoria_infraestructura","required_for_gate": "G1", "priority": "medium"},
    # G2 — financial & social evidence
    {"module_id": "costos_programa",   "document_type": "presupuesto_municipal",    "required_for_gate": "G2", "priority": "high"},
    {"module_id": "costos_programa",   "document_type": "contrato_disposicion_final","required_for_gate": "G2","priority": "medium"},
    {"module_id": "social_diagnostico","document_type": "encuesta_disposicion_pago","required_for_gate": "G2", "priority": "medium"},
    {"module_id": "logistica",         "document_type": "estudio_rutas",            "required_for_gate": "G2", "priority": "medium"},
    # G3 — scheme & financial model
    {"module_id": "esquema_concesion", "document_type": "bases_licitacion",         "required_for_gate": "G3", "priority": "high"},
    {"module_id": "escenarios_financieros","document_type": "modelo_financiero",    "required_for_gate": "G3", "priority": "high"},
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def scan_tenant(tenant_id: str, db) -> dict:
    """Scan one tenant and emit DocumentGap rows for missing canonical docs.

    Returns a summary dict.  Safe to call with db=None (graceful degradation).
    """
    if db is None:
        return {"tenant_id": tenant_id, "skipped": True, "reason": "no_db"}

    from app.models.document_archive import DocumentGap, TenantDocument

    # Collect uploaded document types per module
    uploaded: set[tuple[str, str]] = {
        (row.module_id, row.document_type)
        for row in db.query(TenantDocument.module_id, TenantDocument.document_type)
        .filter(
            TenantDocument.tenant_id == tenant_id,
            TenantDocument.upload_status.in_(["received", "processed"]),
        )
        .all()
    }

    # Collect already-open gaps (avoid duplicates)
    open_gaps: set[tuple[str, str]] = {
        (row.module_id, row.document_type)
        for row in db.query(DocumentGap.module_id, DocumentGap.document_type)
        .filter(
            DocumentGap.tenant_id == tenant_id,
            DocumentGap.status == "pending",
            DocumentGap.marked_not_applicable == False,  # noqa: E712
        )
        .all()
    }

    created = 0
    for canon in CANONICAL_DOCS:
        key = (canon["module_id"], canon["document_type"])
        if key in uploaded or key in open_gaps:
            continue
        db.add(
            DocumentGap(
                tenant_id=tenant_id,
                module_id=canon["module_id"],
                document_type=canon["document_type"],
                reason=(
                    f"Documento canónico faltante detectado por GapDetector nightly "
                    f"(gate {canon['required_for_gate']})"
                ),
                detection_method="gap_detector_nightly",
                status="pending",
                priority=canon["priority"],
            )
        )
        created += 1

    if created:
        db.commit()

    return {
        "tenant_id": tenant_id,
        "gaps_created": created,
        "uploaded_types": len(uploaded),
        "open_gaps_before": len(open_gaps),
    }


def run_gap_detector(db) -> dict:
    """Scan all active tenants.  Called nightly by the scheduler."""
    if db is None:
        logger.warning("gap_detector skipped — no DB")
        return {"skipped": True}

    from app.models.admin_tenant import AdminTenant

    tenant_ids: list[str] = [
        row[0]
        for row in db.query(AdminTenant.id).filter(AdminTenant.activo == True).all()  # noqa: E712
    ]

    results = []
    for tid in tenant_ids:
        try:
            summary = scan_tenant(tid, db)
            results.append(summary)
        except Exception as exc:
            logger.warning("gap_detector failed for tenant %s: %s", tid, exc)
            results.append({"tenant_id": tid, "error": str(exc)})

    total_gaps = sum(r.get("gaps_created", 0) for r in results)
    logger.info(
        "gap_detector finished: %d tenants scanned, %d new gaps created",
        len(tenant_ids),
        total_gaps,
    )
    return {"tenants_scanned": len(tenant_ids), "total_gaps_created": total_gaps, "results": results}
