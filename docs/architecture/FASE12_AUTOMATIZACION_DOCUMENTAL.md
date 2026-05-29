# Fase 12 · Automatización documental con revisión humana obligatoria

**Estado:** implementada para validación técnica  
**Fecha:** 2026-05-28  
**Alcance:** motor de borradores, ClaimLedger/provenance, versionado, A6 Plataforma 0 y bloqueo de export `ok` sin revisión/evidencia.

## Regla rectora

ALQUIMIA prepara borradores para revisión. No firma, no aprueba, no publica, no envía comunicaciones oficiales y no sustituye al secretario, jurídico municipal o Cabildo.

## Documentos soportados

- `expediente_cabildo`
- `reforma_reglamentaria_3_articulos`
- `acuerdo_cabildo`
- `adenda_concesion`
- `reporte_mensual_esg_gri_306`
- `oficio_estandar`

## Estados documentales

- `draft_generated`
- `human_review_required`
- `in_review`
- `approved_by_human`
- `rejected`
- `blocked_missing_evidence`

Un borrador generado entra como `human_review_required` si no tiene bloqueos críticos, o `blocked_missing_evidence` si falta evidencia crítica. `qa_status` no puede ser `ok` mientras existan bloqueos o mientras falte aprobación humana.

## Trazabilidad

Cada borrador incluye:

- `claim_ledger.claims[]` con campo, valor, fuente, método, confianza, estado preliminar y oficialidad falsa.
- `provenance` con tenant, municipio, fecha de generación y revisión humana obligatoria.
- estándares MARCOS desde `docs/architecture/standards_map.json`.
- secciones que requieren revisión humana.
- advertencias cuando falta fuente o validación.
- historial `versions[]` y `review_history[]`.

## A6 Plataforma 0

Endpoints administrativos:

- `POST /admin/tenants/{tenant_id}/documents/drafts`
- `GET /admin/tenants/{tenant_id}/documents`
- `PATCH /admin/tenants/{tenant_id}/documents/{document_id}`
- `POST /admin/tenants/{tenant_id}/documents/{document_id}/export-check`

La respuesta de listado expone `a6_documentacion_generada` y mantiene `official_auto_send_enabled = false`.

## Bloqueos críticos

- Falta evidencia de gate crítico para documentos dependientes:
  - `acuerdo_cabildo` requiere G1.
  - `adenda_concesion` requiere G2.
  - `reporte_mensual_esg_gri_306` requiere G3.
- Dato crítico sin fuente trazable en `reglamento_de_limpia` u `organigrama_servicio`.
- Cualquier bloqueo fuerza `qa_status = blocked` y `can_export_ok = false`.

## Prueba mínima

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase12_document_automation.py
```

La prueba cubre generación trazable, documento bloqueado, export-check negativo, versionado e historial de revisión.
