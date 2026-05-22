# Bitácora CSA — descarga y verificación reglamentos (2026-05-07)

**Agente:** CSA (carga y verificación PDF/reglas municipales)
**Objetivo:** Desbloquear cadena `source_manifest` / `ingest_status` en backend con rutas, URLs primarias y `SHA256` auditables.

## Hechos ejecutados

1. **Guadalajara (`gdl`)** — PDF oficial de transparencia municipal descargado y verificado contra portal (`SHA256` coincidente). Copia en `frontend/public/reglamentos/GDL_gdl_guadalajara_reglamento_gestion_integral_municipio.pdf` (+ aseo público 2026-05-18).
2. **Zapopan (`zap`)** — Sustituido espejo previo por **PDF Oct 2024** desde `servicios.zapopan.gob.mx:8000` (coincidencia `SHA256` con descarga directa). Copia en `frontend/public/reglamentos/GDL_zap_zapopan_reglamento_gestion_integral_residuos.pdf`.
3. **San Pedro Garza García (`spg`)** — Incorporado candidato **SISTEC** corto de materia limpia (`MTY_spg_san_pedro_reglamento_limpia_sistec_candidate.pdf`), manteniendo PDFs ambientales y de zonificación como **anexos de contexto** (no deben sustituir verificación POE de un «Reglamento de Limpia» consolidado si existe).
4. **Backend seeds** — `repository.py`: URLs corregidas para **SLP** y **QRO** capital (eliminados enlaces rotos/DNS); **SPGG** apunta al expediente SISTEC limpia candidato; **gdl/zap** metadatos alineados con fuentes oficiales. La descarga/checksum **no** equivale a validación jurídica, dictamen, documento oficial ni vigencia certificada por ALQUIMIA.

## Bloqueos abiertos (evidencia INFOMEX / ZIP)

| ID | Motivo breve |
|----|----------------|
| slp | Portal municipal sin PDF estable espejado; rutas `ordenjuridico` fallidas (404/TLS) en pasadas |
| qro | Índice reglamentario sin archivo único GIRS consolidado en esta corrida |
| mar | Portal DDG/HTML sin PDF RSU dedicado identificado |
| hui | Índice transparencia sin normativa RSU (solo avisos privacidad en scrape) |
| tla | TLS/navegación portal Tlaquepaque — pendiente captura humana + INFOMEX Jalisco |

**ZIP de evidencia:** artefacto base (`stub`) generado en `ADENDOS: LEGAL/evidencia_busqueda_no_localizable_2026-05-07_stub.zip` — contiene README + modelo INFOMEX; reemplazar con ZIP definitivo cuando existan capturas POE + acuses.

## Riesgos de calidad (Auditor)

- **Apodaca (`apo`)** — PDF ambiental SISTEC; no etiquetar como «solo RSU» sin dictamen.
- **Corregidora (`cor`)** — PDF voluminoso desde SEGOB referencia; vigencia territorial y titulación RSU **en_revision**.
- **García (`gar`)** — Documento interno R-IRMG-3-40; no sustituye reglamento maestro hasta localizarlo.

## Referencias de archivo

- Manifest tabular: `ADENDOS: LEGAL/MANIFEST_REGLAMENTOS_2026-05.md`
- Datos UI: `frontend/src/data/reglamentos.ts`
- Índice agente legal frontend: `frontend/public/reglamentos/manifest.json`
