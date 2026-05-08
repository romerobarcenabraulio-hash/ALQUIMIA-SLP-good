# Bitácora Ejecutor — cierre auditoría multimunicipio (2026-05-07)

Rama: `cursor/cityfirst-progresion-plan-ui`.  

## Alcance cerrado (P0 / P1)

| ID | Tema | Notas |
|----|------|--------|
| P0-1 | Disclaimer y `next_action` por municipio | `municipal_legal_copy.py` (CLC maps vacíos → fallback determinístico); `diagnostic.py` arma texto tras `select_strategy`. Tests: `tests/legal/test_audit_gates.py`, `TestCLCExpositorMunicipal`. |
| P0-2 | `CircularityBaseline.interpretation` / `warnings` | `city/repository.py`: cifras t/día, brecha vs mejor ZM del catálogo, warnings con nombre ZM y secretaría estatal. |
| P0-3 | ZM GDL | Frontend: `NEXT_PUBLIC_ALQUIMIA_HIDE_GDL=1` filtra `ZMS` en `constants.ts`; backend: `ALQUIMIA_HIDE_GDL=1` en `list_city_options`; pie de selector; sin GDL en UI con env; clic en GDL con ZM visible abre diálogo de bloqueo demo. |
| P0-4 | Limpieza strings “dev” | Catálogo nacional GDL; reglamentos GDL en `legal/repository.py`; pie `AdendoViewer` sin prefijo `trace:`. |
| P0-5 | `/health` | `APP_ENV` con fallback a `ENVIRONMENT` en `main.py`. Producción: fijar `APP_ENV=production` en hosting. |
| P0-6 | MTY 9 municipios | `ZM_MUNICIPIOS` y paquete; test `test_disclaimer_unique_per_municipality_in_zm_paquete` para MTY. |
| P1-3 | `MarcoLegal` | `munId` desde `municipiosActivos[0]`. |
| P1-4 | Hitos por ZM | `HITOS_TIMELINE_MTY/QRO/GDL`, `getHitosForZm`, serie municipal y UI progresión; mensaje fallback SLP en `catalogLabel`. |
| P1-5 | `DashboardKPIs` | `deriveCorrientesCriticas` desde composición y toneladas baseline. |
| P1-7 | `can_enable_sanctions` | `ingest_status == verified` + `validado_externamente` + `score_legal >= 50`; mensaje explícito bloqueo por manifest (ej. SPGG). |

## Verificación (Auditor)

1. `cd backend && pytest tests/legal -k "disclaimer_unique or interpretation_unique"` → esperado PASS.  
2. `cd frontend && npm run build` → esperado sin errores TS.  
3. `curl` producción `/health` y `/legal/zm/{SLP,MTY,QRO,GDL}/paquete` según checklist desplegado.  
4. Re-auditoría: solicitar al Auditor tras deploy con `APP_ENV=production` y envs GDL alineados front/back.

## Referencia de commit

Ver historial de rama `cursor/cityfirst-progresion-plan-ui` (mensaje: multimunicipio P0/P1 — legal copy, baseline, GDL, hitos y gates).

P2 explícitamente fuera de este pase.
