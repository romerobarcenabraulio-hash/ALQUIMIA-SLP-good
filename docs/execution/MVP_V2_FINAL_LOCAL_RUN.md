# MVP V2 Final Local Run

Fecha: 2026-05-31

Entorno:

- Backend local: `uvicorn app.main:app --host 127.0.0.1 --port 8000`.
- Frontend local: `next start --port 3000`.
- Browser integrado: PASS en rutas críticas.
- `curl` desde shell local devolvió `000` por restricción de red del sandbox; se usó navegador integrado para evidencia de UI.

| Ruta/flujo | Resultado esperado | Resultado observado | Estado | Evidencia | Bloqueo |
| --- | --- | --- | --- | --- | --- |
| `/` | Landing institucional | Carga, sin nombres internos, sin demo público | PASS | Browser route smoke | No |
| `/comenzar` | Form institucional | Carga formulario y copy de validación humana | PASS | Browser route smoke | No |
| `/sign-in` | Login sin demo público | Carga sin “Acceso de demostración” ni “Usar cuenta demo” | PASS | Browser route smoke | No |
| `/preparando` | Preparación preliminar | Carga explicación sin promesas automáticas | PASS | Browser route smoke | No |
| `/pendiente-validacion` | Validación humana requerida | Carga bloqueo de correo genérico/manual | PASS | Browser route smoke | No |
| `/metodologia` | Método público sobrio | Carga fuente/método/confianza/brechas | PASS | Browser route smoke | No |
| `/v?tenant=partial-city` | Diagnóstico validación | Carga tenant parcial, sin `SLP` visible como fallback | PASS | Browser route smoke | No |
| `/p?tenant=partial-city` | Planeación | Carga plataforma planeación | PASS | Browser route smoke | No |
| `/e?tenant=gap-city` | Ejecución | Carga plataforma ejecución con brechas | PASS | Browser route smoke | No |
| Registro institucional | Cuenta creada y redirección a preparación | Verificado en RC previo y backend auth API completo | PASS | `MVP_V2_FINAL_SMOKE_TEST.md` | No |
| Registro genérico | Cuenta pendiente de validación | Verificado en RC previo | PASS | `MVP_V2_FINAL_SMOKE_TEST.md` | No |
| Admin/founder approval | Aprobación mínima/procedimiento seguro | Parcial por MVP; panel completo no es alcance | PARTIAL | `MVP_V2_RELEASE_CANDIDATE_STATUS.md` | No para local; sí para producción |
| Upload documento | PDF recibido y pendiente validación | Verificado en RC previo | PASS | `MVP_V2_FINAL_SMOKE_TEST.md` | No |
| Export ZIP | 9 archivos, watermark, índice común | Verificado en RC previo | PASS | `MVP_V2_FINAL_MULTI_CITY_DOCUMENT_QA.md` | No |

## Decisión

Final local run: PASS para founder/local review. Producción requiere configuración externa.

