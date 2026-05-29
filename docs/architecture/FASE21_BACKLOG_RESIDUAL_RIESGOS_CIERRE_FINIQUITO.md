# Fase 21 · Backlog residual, riesgos y cierre de finiquito

**Estado:** cerrado como inventario de finiquito  
**Fecha:** 2026-05-28  
**Recomendación final:** **staging extendido / piloto controlado**, no release público todavía. No se identifican P0 abiertos en la evidencia local revisada, pero sí P1 que bloquean producción abierta.

## 1 · Decisión ejecutiva

ALQUIMIA tiene una arquitectura operable en staging controlado: Plataforma 0, tenant_state, gates manuales, rutas `/v` `/p` `/e`, SLP preservado, personalización municipal, inferencia preliminar, documentos bloqueables, data moat anónimo, NOUS observacional, field studies y KPIs de defensibilidad como contratos.

No debe declararse finiquito de producción pública. La aceptación final es humana y requiere firma founder. Los P1 abiertos obligan a operar como piloto controlado hasta cerrar conectores reales, worker async, hardening de auth tenant y suite backend completa con PostgreSQL/CI.

## 2 · Matriz de estado Fases 0-20

| Fase | Estado | Evidencia local | Nota AUDITOR |
| --- | --- | --- | --- |
| 0 · Preparación normativa | Cerrado | ADR-0010, Plataforma 0 spec, Module Maturity firmados en `docs/architecture`. | No reabrir sin decisión founder. |
| 1 · Plataforma 0 MVP | Cerrado técnico | `test_admin_tenants.py`; endpoints admin tenants/gates/capabilities. | Producción abierta exige auth hardening. |
| 2 · tenant_state/transiciones | Cerrado técnico | Tests admin tenants y guards por etapa. | Transiciones manuales, sin cierre automático. |
| 3 · routing `/v` `/p` `/e` | Cerrado técnico | Fase 8/9 QA y pruebas frontend previas documentadas. | No hay retiro irreversible de legacy. |
| 4 · migración SLP | Cerrado técnico | Comparativos fase4 reportan `ok: true`; SLP `validation`. | Mantener rollback/backup accesible. |
| 5 · consolidación módulos | Cerrado técnico | Registry consolidado y pruebas de consolidación documentadas en Fase 9. | No borrar legacy aún. |
| 6 · personalización municipal | Cerrado técnico | `TenantProfilePanels`, perfiles SLP/Monterrey/Guanajuato, Fase 15. | Datos básicos incompletos quedan como pendientes. |
| 7 · validación final migración | Parcial | No hay firma founder final en repo. | Aceptación humana pendiente. |
| 8 · auditoría visual Minto/McKinsey | Cerrado focalizado | Capturas en `phase8_visual_evidence`; typecheck/build previos. | No fue rediseño exhaustivo de todos los módulos legacy. |
| 9 · release hardening | Cerrado para staging / bloqueado público | Fase 9: release público bloqueado por PostgreSQL local/CI. | P1 abierto. |
| 10 · observabilidad post-release | Cerrado para staging / bloqueado público | Fase 10: smoke/rollback/incidentes. | Producción pública bloqueada si suite completa sigue sin DB. |
| 11 · automatización consultiva | Cerrado técnico | `test_phase11_automation.py`, inference fixtures. | Fuentes reales siguen diferidas. |
| 12 · automatización documental | Cerrado técnico | `test_phase12_document_automation.py`; blockers/export-check. | Borradores, no documentos oficiales. |
| 13 · runtime automation | Cerrado técnico | `test_phase13_runtime_automation.py`. | Recomendación, no decisión humana sustituida. |
| 14 · data moat/privacy | Cerrado técnico | `test_phase14_data_moat.py`. | Observación interna; no patrones NOUS publicables. |
| 15 · primer login/UAT técnico | Parcial-operativo | Fase 15: UAT técnico, staging extendido. | Founder UAT humano pendiente en evidencia local. |
| 16 · backlog/deuda previa | Parcial/no evidenciado localmente | No se encontró `FASE16` en `docs/architecture`. | No inventar cierre. |
| 17 · paquete founder | Cerrado operativo | `FASE17_OPERACION_COMERCIAL_CONTROLADA_PAQUETE_FOUNDER.md`. | Vender piloto controlado, no automatización oficial plena. |
| 17R · reconciliación NOUS | Cerrado | `FASE17R_RECONCILIACION_NOUS_LEARNING_FEEDBACK.md`. | NOUS observa antes de sugerir. |
| 18 · NOUS observacional | Cerrado técnico | `test_phase18_nous_observational.py`. | Sin detectores, sin publicación, sin recalibración. |
| 19 · field studies/KPIs | Cerrado contrato técnico | `test_phase19_field_studies_kpis.py`. | Brechas técnicas, no estudios reales ejecutados. |
| 20 · primer login/UAT integrado | Parcial por evidencia local | Contexto del usuario dice validado; no hay artefacto Fase 20 en repo. | Requiere archivo/evidencia o firma founder para cierre local. |

## 3 · Backlog residual priorizado

| Prioridad | Tipo | Item | Por qué importa | Gate de cierre |
| --- | --- | --- | --- | --- |
| P0 | Bug real | Ninguno identificado en evidencia local actual. | No hay P0 abierto documentado. | Repetir smoke antes de demo/release. |
| P1 | Infra/QA | PostgreSQL local/CI para suite backend completa. | Fase 9/10 bloquean release público. | Suite backend completa verde en CI o ambiente reproducible. |
| P1 | Backend/operación | Worker async real para inferencia HERMES >15 min. | Hoy hay inferencia mínima síncrona/fixtureada. | Job con parciales, retry y estado persistido. |
| P1 | Datos | Conectores públicos reales HERMES. | Fuentes actuales son controladas/fixtures; no prometer cobertura universal. | Conectores por fuente con fallback y trazabilidad. |
| P1 | Seguridad | Auth cliente granular por tenant separada de admin. | Evita depender de demo controlada. | Pruebas negativas tenant A/B y rol cliente/admin. |
| P1 | Aceptación | Firma founder de UAT final/Fase 20. | Sin firma no hay aceptación final. | Acta o doc Fase 20 con evidencia. |
| P2 | Producto | Capturas UAT visual firmadas para todos los módulos clave. | Reduce riesgo de layout roto en demo. | Screenshots desktop/mobile actualizados. |
| P2 | Documental | Formalizar decisión legacy 30-60 días. | No retirar legacy por accidente ni venderlo como futuro. | Decisión founder: mantener, retirar o pausar. |
| P2 | Producto | Estudios de campo reales por tenant piloto. | Fase 19 solo define contratos; no ejecuta estudios. | Evidencia de estudio local cargada o brecha explícita. |
| P2 | Datos | Opt-in analytics contractual real. | Sin opt-in no hay aggregate. | Consentimiento por tenant registrado. |
| P2 | Técnico | DB-backed listing completo de observaciones NOUS. | Escritura existe; listado DB quedó mínimo. | Endpoint de lectura persistente con tests. |
| P3 | Visual/editorial | Pulido de módulos legacy no prioritarios. | No bloquea staging si no rompe lectura. | Auditoría visual incremental. |
| P3 | Documental | Consolidar Fases 16/20 si existen fuera del repo. | Evita huecos de trazabilidad. | Archivos agregados a `docs/architecture`. |

## 4 · Clasificación por deuda

**Bugs reales:** ninguno P0 observado; release público bloqueado por P1 de infraestructura/test DB, no por bug funcional confirmado.

**Deuda técnica:** worker async HERMES; conectores reales; auth tenant granular; DB-backed NOUS observation listing; CI PostgreSQL.

**Deuda de producto:** decisión legacy; UAT founder; estudios de campo reales; opt-in contractual real; alcance comercial de piloto.

**Deuda documental:** falta artefacto local Fase 16; falta artefacto local Fase 20; firmas humanas no versionadas en repo.

**Deuda visual/editorial:** módulos legacy no auditados exhaustivamente; capturas UAT finales pendientes.

**Features diferidas:** A11 NOUS completo, pattern detectors, recalibración de priors, sugerencias NOUS al cliente, What a Waste completo, billing avanzado, analytics avanzado público.

## 5 · Riesgos residuales

| Área | Riesgo | Severidad | Estado |
| --- | --- | --- | --- |
| Acceso por etapa | Tenant ve etapa posterior. | P0 si ocurre | Cubierto por pruebas enfocadas; repetir en release. |
| tenant_state/gates | Gate cierra sin evidencia o avanza automático. | P0 si ocurre | Diseñado manual-only; pruebas admin. |
| Privacidad tenant | Datos privados cruzan tenants. | P0 si ocurre | Data moat bloquea identificadores y requiere opt-in. |
| Inferencias | Dato preliminar se lee como oficial. | P1 | UI/docs marcan fuente/confianza; conectores reales pendientes. |
| Field studies | Benchmark nacional se usa como estudio local. | P1 | Fase 19 lo bloquea por contrato; falta ejecución real de estudios. |
| KPIs nuevos | KPI se muestra sin fuente local. | P1 | Registry marca `missing_local_study_until_evidence`. |
| Documentos/export | Documento sale `ok` con bloqueos. | P0 si ocurre | Fase 12 export-check lo bloquea; repetir antes de demo. |
| NOUS | Se vende aprendizaje maduro. | P1 | NOUS observacional; paquete founder prohíbe claim. |
| UI editorial | Página se ve antigua o encimada. | P2/P3 | Fase 8 focalizada; auditoría completa pendiente. |
| Legacy | Retiro irreversible sin firma. | P1 | Prohibido; mantener 30-60 días salvo decisión founder. |

## 6 · Decisiones humanas pendientes

- Firma founder de aceptación final.
- Decisión de release: piloto controlado, staging extendido o bloqueado.
- Aprobación/firma de documentos de arquitectura si cambiaron tras Fase 19.
- Opt-in analytics por tenant.
- Decisión legacy: mantener 30-60 días recomendado, retirar o pausar.
- Aprobación de NOUS futuro antes de A11/detectores/publicación.
- Aprobación de studies/KPIs como requisito comercial.
- Autorización para usar datos privados reales de prospectos en demo.

## 7 · Legacy

Estado recomendado: **mantener legacy temporal 30-60 días**, sin venderlo como arquitectura futura y sin retirarlo de forma irreversible.

Uso permitido:

- continuidad histórica SLP;
- demos ya comprometidas en flujo anterior;
- comparación de respaldo si la nueva ruta está inestable.

Uso prohibido:

- presentar legacy como experiencia principal futura;
- retirar legacy sin firma founder;
- mezclar legacy con claims de tres plataformas.

## 8 · NOUS

Estado: **observacional únicamente**.

Permitido:

- registrar `inference_corrections`;
- registrar `gate_outcomes`;
- registrar `projection_deltas`;
- crear `nous_patterns` pendientes/no publicables;
- aplicar opt-in/opt-out.

Diferido:

- detectores productivos;
- A11 completo;
- sugerencias NOUS al cliente;
- publicación de patrones;
- recalibración de priors;
- claims de aprendizaje maduro.

## 9 · Field studies y KPIs

Estado: **contrato técnico cerrado; ejecución real pendiente por tenant**.

Permitido:

- mostrar brecha crítica o recomendada;
- exigir evidencia;
- integrar resultados cuando terceros/municipio los ejecuten;
- mapear KPIs a standards y modules.

Prohibido:

- inventar estudio local;
- presentar benchmark SEMARNAT/nacional como caracterización local;
- llamar dictamen a M03B sin firma jurídica;
- defender tarifa sin PSP cuando aplique.

## 10 · Handoff operativo

Antes de cada demo o piloto:

```bash
backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_phase15_first_login_uat.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase18_nous_observational.py backend/tests/test_phase19_field_studies_kpis.py
python3 -m json.tool docs/architecture/capability_registry.json >/tmp/capability_registry_check.json
python3 -m json.tool docs/architecture/standards_map.json >/tmp/standards_map_check.json
```

Checklist humano:

- Confirmar tenant demo y etapa.
- Confirmar `/v` permitido y `/p` `/e` bloqueados para validation.
- Mostrar fuente/confianza/no oficialidad.
- Mostrar documento bloqueado si falta evidencia.
- Mostrar brecha crítica de estudio local faltante.
- No decir que NOUS aprende robustamente.
- Registrar promesas nuevas como backlog, no como compromiso verbal.

## 11 · Recomendación final

**Recomendación:** staging extendido / piloto controlado.

Motivo: no hay P0 abierto en evidencia local, pero P1 abiertos bloquean producción pública: PostgreSQL/CI, worker async, conectores reales, auth tenant granular y firma founder/UAT final.

Finiquito aceptable solo para:

- demo interna controlada;
- piloto asistido;
- venta honesta con límites explícitos;
- continuidad de desarrollo con backlog priorizado.

No aceptable para:

- producción pública abierta;
- claims de automatización oficial plena;
- publicación de patrones NOUS;
- retiro irreversible de legacy.

## 12 · Gate AUDITOR

AUDITOR confirma:

- No se cerró como terminado lo que está parcial.
- No se mezcló deuda visual con falla funcional.
- Estudios de campo faltantes son brechas, no bugs.
- NOUS no aparece como aprendizaje maduro.
- Founder conserva la decisión de aceptación final.

**Fase 21: cerrada como inventario de finiquito.**
