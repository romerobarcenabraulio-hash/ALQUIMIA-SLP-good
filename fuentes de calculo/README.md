# Fuentes de cálculo (autoría externa)

Aquí viven los artefactos maestros que alimentan la **matriz de fuentes de cálculo** en código (precios RSU por material, proporciones típicas, trazabilidad documental):

- `Investigacion_Precios_RSU_SLP.xlsx` — investigación precios materiales recuperables / referencia Mercado Libre y supuestos (actualizar fecha en hoja cuando cambie mercado).
- `Tabla_Maestra_Fuentes_CapituloSLP.docx` — tabla maestra de fuentes capitulares programa SLP (sincronizar con `frontend`/`backend` cuando se exporten filas definitivas).

**Nota repo:** valores numéricos “vivo” para el motor deben replicarse en TypeScript/Python con citas cortas visibles para el usuario; estos archivos son la evidencia editable para humanos auditores.

## Capa social (demografía en simulador)

- **Pestaña lógica maestra (hasta consolidar un `.xlsx` único):** `MAESTRO_Demografia_CAPA_SOCIAL_v0` — referenciada en `sourceSpreadsheetTab` del snapshot y en pistas `excelRowHint`.
- **Contrato y procedimiento MR:** `frontend/src/data/socialStats/SOURCE_TRACE.md`.
- **Snapshot versionado servido al cliente:** `frontend/public/data/social-stats/slices-<buildId>.json` — el `buildId` activo es la constante **`SOCIAL_STATS_BUILD_ID`** en `frontend/src/data/socialStats/embeddedBundle.ts` (una sola fuente de verdad para nombre de archivo + `socialStatsBundleCache`).
- **Historial y regeneración reproducible:** [`CHANGELOG_FUENTES_SOCIAL.md`](CHANGELOG_FUENTES_SOCIAL.md) — tabla extracto↔código, pasos para regenerar JSON, OWNER Auditor+Ejecutor y tests a tocar si cambia el formato.
- **Historial extracto ↔ código + plantilla legal–editorial (22A) y roles MR (22B):** `fuentes de calculo/CHANGELOG_FUENTES_SOCIAL.md`.
