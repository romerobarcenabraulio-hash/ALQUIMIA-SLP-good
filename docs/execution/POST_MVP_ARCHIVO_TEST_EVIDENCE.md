# Post-MVP Sprint 2 · Evidencia de pruebas

Fecha: 2026-05-31

| Comando | Resultado | Salida relevante | Riesgo |
| --- | --- | --- | --- |
| `npm run type-check` | PASS | `tsc --noEmit` sin errores | Ninguno |
| `npm run test -- archivoFull.test.ts documentArchiveStore.test.ts` | PASS | 2 archivos, 11 pruebas | Ninguno |
| `npm run test` | PASS | 47 archivos, 183 pruebas | Ninguno |
| `npm run lint` | PASS | 0 errores, 162 warnings legacy | Warnings existentes del repo |
| `npm run build` | PASS | Next build completado; rutas `/api/archivo/digest` e `/api/archivo/inbound` incluidas | Ninguno |

## Pendiente antes de cierre completo

- Probar `/api/archivo/inbound` con `POSTMARK_INBOUND_SECRET` real en entorno seguro.
- Probar parser/OCR cuando se instalen dependencias aprobadas.
