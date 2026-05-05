"""Gate de debido proceso para sanciones."""
from __future__ import annotations

from fastapi import HTTPException

from app.legal.repository import get_repo
from app.national.coverage import legal_source_for_municipio
from app.national.schemas import SourceStatus
from app.operations.events import evidence_assets, inspections, violations
from app.operations.schemas import DueProcessStatus, OperationStatus, ViolationRecord


_ORDER = [
    DueProcessStatus.advertencia_no_sancionatoria,
    DueProcessStatus.notificacion,
    DueProcessStatus.en_aclaracion,
    DueProcessStatus.sancion_propuesta,
    DueProcessStatus.sancion_firme,
    DueProcessStatus.pagada,
]


def validate_violation(record: ViolationRecord) -> ViolationRecord:
    if record.due_process_status == DueProcessStatus.advertencia_no_sancionatoria:
        record.monto_mxn = 0
        record.status = OperationStatus.programado
        return record

    source = legal_source_for_municipio(record.municipio_id)
    if source is None or source.status != SourceStatus.verificado:
        raise HTTPException(
            status_code=422,
            detail="Sin LegalSource municipal verificado no hay multa; registrar advertencia educativa.",
        )
    if record.legal_source_id != source.legal_source_id:
        raise HTTPException(status_code=422, detail="LegalSource no corresponde al municipio.")
    article_ids = {a.numero for a in get_repo().get_articulos(record.municipio_id)}
    if record.article_id not in article_ids:
        raise HTTPException(status_code=422, detail="Articulo aplicable no existe para el municipio.")
    if not record.evidencia_ids:
        raise HTTPException(status_code=422, detail="Sancion requiere evidencia.")
    missing_evidence = [eid for eid in record.evidencia_ids if eid not in evidence_assets]
    if missing_evidence:
        raise HTTPException(status_code=422, detail=f"Evidencia no registrada: {', '.join(missing_evidence)}")
    if record.inspection_id not in inspections:
        raise HTTPException(status_code=422, detail="Sancion requiere inspeccion registrada.")
    if not record.derecho_aclaracion:
        raise HTTPException(status_code=422, detail="Sancion requiere derecho de aclaracion.")
    if record.due_process_status not in (
        DueProcessStatus.notificacion,
        DueProcessStatus.en_aclaracion,
        DueProcessStatus.sancion_propuesta,
        DueProcessStatus.sancion_firme,
        DueProcessStatus.pagada,
    ):
        raise HTTPException(status_code=422, detail="Estado de debido proceso invalido para sancion.")
    return record


def transition_violation(violation_id: str, next_status: DueProcessStatus) -> ViolationRecord:
    record = violations.get(violation_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"ViolationRecord no encontrado: {violation_id}")
    cur_idx = _ORDER.index(record.due_process_status)
    next_idx = _ORDER.index(next_status)
    if next_status == DueProcessStatus.cancelada:
        record.due_process_status = next_status
        record.status = OperationStatus.cancelado
        return record
    if next_idx < cur_idx or next_idx > cur_idx + 1:
        raise HTTPException(status_code=422, detail="No se puede saltar etapas de debido proceso.")
    record.due_process_status = next_status
    if next_status in (DueProcessStatus.sancion_firme, DueProcessStatus.pagada):
        record.status = OperationStatus.completado
    return record

