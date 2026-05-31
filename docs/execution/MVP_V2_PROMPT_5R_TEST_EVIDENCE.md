# MVP V2 Prompt 5R Test Evidence

Fecha: 2026-05-30

| Comando | Resultado | Salida relevante | Bloqueo |
| --- | --- | --- | --- |
| `npm run type-check` | PASS | `tsc --noEmit` terminó con código 0 | Ninguno |
| `npm run test -- src/lib/citations.test.ts src/lib/documentArchiveStore.test.ts src/components/platform/PillarModulePanel.test.tsx` | PASS | 3 archivos, 10 tests passed | Ninguno |
| `npm run test` | PASS | 45 archivos, 174 tests passed | Ninguno |
| `npm run build` | PASS | Next build compiló y generó rutas `/api/tenants/[id]/data`, `/api/tenants/[id]/export-zip`, `/v`, `/p`, `/e`, `/pendiente-validacion` | Ninguno |
| `npm run lint` | PASS con warnings heredados | 0 errors, 162 warnings preexistentes/ajenos al cambio | Ninguno |
| `GET /api/tenants/complete-city/export-zip` | PASS | HTTP 200, `application/zip`, 9 archivos | Ninguno |
| `GET /api/tenants/partial-city/export-zip` | PASS | HTTP 200, `application/zip`, 9 archivos | Ninguno |
| `GET /api/tenants/gap-city/export-zip` | PASS | HTTP 200, `application/zip`, 9 archivos | Ninguno |
| `GET /api/tenants/partial-city/data` con `x-tenant-id: other-city` | PASS | HTTP 403 `Acceso cross-tenant bloqueado` | Ninguno |
| `GET /api/tenants/partial-city/export-zip` con `x-tenant-id: other-city` | PASS | HTTP 403 `Acceso cross-tenant bloqueado` | Ninguno |
| Browser desktop `/v?tenant=partial-city&module=city_baseline` | PASS | Municipio correcto, fuente/fecha/método, CTA humana, sin nombres internos visibles | Ninguno |
| Browser mobile `/v?tenant=gap-city&module=marco_legal` | PASS | Sin overflow horizontal; municipio visible; watermark visible; sin nombres internos visibles | Ninguno |
