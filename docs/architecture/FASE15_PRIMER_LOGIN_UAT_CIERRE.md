# Fase 15 · Primer login automatizado, UAT y cierre operativo

**Estado:** implementada para validacion tecnica  
**Fecha:** 2026-05-28  
**Decision recomendada:** staging extendido con UAT humano del founder antes de aceptacion final.

## Flujo end-to-end probado

1. Founder crea tenant en Plataforma 0 con nombre, estado, municipio_id, clave INEGI, tier y etapa `validation`.
2. HERMES dispara `run_initial_inference(...)` durante `POST /admin/tenants`.
3. El perfil municipal queda en `municipal_profile` con:
   - `public_knowledge_base`
   - `tenant_private_store`
   - `inference.status = complete | partial`
   - `preliminary_notice = dato preliminar pendiente de validacion`
4. Cliente entra a `/v?tenant_id=<id>` porque `platform-access/validation` permite la etapa.
5. `/p` y `/e` quedan bloqueadas para tenants en `validation`.
6. M00, M01, M02/M02C, M03B, M04 y M13 muestran estado de primer login, fuentes, confianza y no-oficialidad.
7. Si el cliente ajusta un dato privado, KRONOS recalcula dependencias y AUDITOR marca discrepancia mayor a 20%.

## Municipios usados en UAT tecnico

| Perfil | INEGI | Resultado |
| --- | --- | --- |
| SLP Capital | `24028` | Precarga poblacion, viviendas, generacion per capita y reglamento preliminar; no oficial. |
| Capital grande nueva | `22014` | Precarga razonable desde Public Knowledge Base; queda en `carga_inicial`. |
| Municipio pequeno/rural incompleto | `99999` | Pipeline parcial; campos faltantes quedan `pending_source` / `missing_source` con razon. |

## Evidencia de primer login

- M00 muestra `TenantFirstLoginSummary` personalizado al municipio.
- M01 muestra fuente/confianza para poblacion, generacion RSU y reglamento.
- M02/M02C conserva actores por tenant y marca faltantes sin copiar actores entre municipios.
- M03B hereda reglamento preliminar o `missing_source`.
- M04 muestra costo de omision como lectura estimada/no oficial.
- M13 muestra escenarios preliminares y fuente/confianza antes de lectura financiera.

Estados visibles:

- `verified`
- `inferred_high_confidence`
- `inferred_medium_confidence`
- `inferred_low_confidence`
- `pending_human_validation`
- `missing_source`

## Integridad y privacidad

- SLP conserva su `tenant_private_store.tenant_id` propio.
- Queretaro y municipio rural reciben stores privados distintos.
- `cross_tenant_private_access = false`.
- Clientes no pueden consultar analytics cross-tenant ni datos privados agregados por endpoint admin.
- Data moat sigue opt-in y anonimizado; no se copian conclusiones de SLP a otro municipio.

## Recalculo y recomendacion

Caso probado: Queretaro cambia poblacion inferida `1049777` por dato privado `1400000`.

Resultado:

- `capability_registry.json` declara `produces_data_for` para los módulos centrales; el runtime ya no depende solo del fallback por `depends_on`.
- `runtime.recalculated_modules` incluye `city_baseline`.
- `runtime.discrepancies[]` registra delta mayor a 20%.
- La discrepancia queda como revision humana, no error definitivo.
- Se generan recomendaciones trazables con accion humana pendiente.
- `automatic_gate_changes = false`.
- `automatic_stage_transitions = false`.

## Riesgos residuales

| Severidad | Riesgo | Estado |
| --- | --- | --- |
| P1 | No existe worker async real/Inngest para inferencia de 15 minutos. | Diferido; hoy la inferencia minima corre sincrona y parcial-tolerante. |
| P1 | Fuentes publicas reales aun son fixture/controladas, no conectores web/API completos. | Staging, no produccion plena. |
| P2 | Auth cliente granular por tenant aun debe separarse de endpoints admin. | Mitigado por bloqueo admin a rol cliente; requiere hardening antes de produccion abierta. |
| P2 | UAT visual humano debe validar composicion en navegador real para todos los modulos visibles. | Se intento smoke local; queda pendiente walkthrough founder por sesion/token del navegador. |

## Checklist de aceptacion final

- [x] Crear tenant dispara inferencia inicial.
- [x] Primer login no queda vacio.
- [x] Datos inferidos muestran fuente/confianza.
- [x] Datos faltantes muestran pendiente explicito.
- [x] SLP no se mezcla con otros municipios.
- [x] Municipio grande nuevo recibe precarga razonable.
- [x] Municipio pequeno/rural funciona con fuentes incompletas.
- [x] Ajustar dato privado recalcula y marca discrepancia.
- [x] Cliente no puede consultar analytics/datos privados cross-tenant.
- [x] UI usa resumen sobrio de primer login sin dashboard nuevo.
- [x] UAT tecnico documentado.
- [x] Smoke visual parcial confirma que M00 muestra resumen de primer login, no-oficialidad y `missing_source`.
- [ ] Founder ejecuta UAT humano y decide aceptacion final.

## Backlog post-finiquito

1. Conectar HERMES a fuentes publicas reales con retries y cache.
2. Separar auth cliente por tenant antes de produccion abierta.
3. Implementar background worker para inferencia parcial >15 minutos.
4. Añadir screenshots UAT firmados por founder.
5. Completar opt-in contractual formal para analytics agregados.

## Comandos de prueba

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase15_first_login_uat.py
backend/.venv/bin/python -m pytest backend/tests/test_phase15_first_login_uat.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase13_runtime_automation.py backend/tests/test_phase12_document_automation.py backend/tests/test_phase11_automation.py backend/tests/test_admin_tenants.py
cd frontend && npm run test -- src/components/simulator/TenantProfilePanels.test.tsx
cd frontend && npm run type-check
cd frontend && npm run build
```

## Estado

**Fase 15: parcial-operativa / staging extendido.**

La experiencia tecnica de primer login esta lista para UAT humano. No se recomienda declarar aceptacion final sin decision explicita del founder porque aun faltan conectores reales de fuentes publicas y firma UAT visual.
