# MASTER IMPLEMENTATION PLAN

**Uso:** plan maestro para pasar de documentacion a implementacion real sin volver a planeacion infinita.

**Regla de trabajo:** cada bloque se ejecuta con auditoria previa, cambios acotados, pruebas especificas y cierre binario. No se avanza por narrativa; se avanza por evidencia observable.

## Bloques priorizados

| Bloque | Objetivo | Archivos probables a tocar | Dependencias | Criterio binario de cierre | Riesgos | Que NO implementar | Agente recomendado |
|---|---|---|---|---|---|---|---|
| A · Estabilizacion documental y gates | Consolidar doctrina, auditorias, non-negotiables y handoffs. | `docs/methodology/*`, `docs/founder/*`, `docs/execution/*`. | 7 archivos base revisados. | Existe fuente de verdad documental y gates binarios; no hay contradicciones abiertas. | Plan infinito, documentos duplicados, gates ambiguos. | UI, producto, claims nuevos. | AUDITOR + OCCAM + BIOS. |
| B · Plataforma 0/backoffice | Habilitar administracion interna de tenants, gates, capabilities, evidencia y preparacion municipal. | `frontend/src`, `backend`, `docs/architecture/PLATAFORMA_0*`, rutas admin, `AJUSTES POST-RESCATE/PLAN_CONTINUACION_ADMIN_CLIENTE_MUNICIPIO_PREPARADO.md`. | Bloque A; ADR-0010; spec Plataforma 0; plan post-rescate Admin Operativo/Vista Cliente. | Founder puede administrar tenant, gates, capabilities, evidencia, municipio preparado y previsualizacion cliente sin exponer backoffice al cliente. | Backoffice decorativo, permisos ambiguos, municipio preparado sin reglamento/bibliografia minima. | Landing, marketing, aprobaciones automaticas, selector libre de municipio en cliente. | KRONOS + POLIS + AUDITOR. |
| C · tenant_state, roles, gates y trazabilidad | Construir o endurecer estado canonico del tenant, roles, gates y audit log. | Backend tenant models, migrations, endpoints, tests. | Bloque B parcial; ADR-0010. | `tenant_state` controla stage, gates, roles y trazabilidad; acceso indebido se bloquea. | Stage incorrecto, gate sin evidencia, rol excesivo. | Cambios de etapa automaticos. | KRONOS + KOSMOS + AUDITOR. |
| D · Separacion de journeys `/v`, `/p`, `/e` | Separar Validacion, Planeacion y Ejecucion en rutas visibles por stage. | Routing frontend, middleware, navigation, `capability_registry.json`. | Bloque C. | Tenant validation solo ve `/v`; planning ve `/p` y previos; execution ve `/e` y previos; posterior indebido bloqueado. | Cliente ve etapa equivocada. | Mezcla de journeys, rediseño amplio. | POLIS + KRONOS + AUDITOR. |
| E · Migracion SLP | Registrar SLP como tenant canonico sin perdida y con execution oculto si validation. | Seeds, tenant data, migration scripts, backup/compare scripts. | Bloques C-D. | Backup existe; pre/post coincide; SLP current_stage validation; `/p` y `/e` bloqueados. | Perdida de datos, ZM/municipio mezclados. | Borrar legacy, copiar conclusiones ZM. | BIOS + KRONOS + AUDITOR. |
| F · Madurez modular y personalizacion | Consolidar modulos, personalizacion por tenant y estados Carga inicial/Operacion. | `capability_registry.json`, module registries, tenant schemas, components. | Bloques D-E. | Modulos visibles por stage/madurez; datos tenant cambian contenido; faltantes se marcan honestamente. | Modulos inmaduros vendidos como listos. | Personalizacion opaca, datos inventados. | FORGE + POLIS + KOSMOS + AUDITOR. |
| G · Field studies, KPIs faltantes y evidencia | Formalizar estudios locales, KPIs y brechas criticas sin inventar cifras locales. | `standards_map.json`, `capability_registry.json`, schemas, docs field studies. | Bloque F; documentos de field studies. | Seis estudios y KPIs de oleada uno definidos; benchmarks no aparecen como estudio local. | Diagnostico impugnable. | What a Waste completo sin adapter, claims banca sin evidencia. | HERMES + AURUM + MARCOS + AUDITOR. |
| H · Automation layer | Precargar datos publicos, marcar confianza, recalcular dependencias y preparar borradores sin decisiones automaticas. | Inference services, document engine, event triggers, provenance. | Bloques C-G. | Inferencias tienen fuente/fecha/metodo/confianza; parciales tolerados; discrepancias registradas; humano decide. | Inferencia como oficial, scraping fragil. | Firma, comunicacion oficial o gate automatico. | HERMES + KRONOS + KOSMOS + AUDITOR. |
| I · NOUS learning/feedback | Implementar observacion, opt-in, patrones internos, deltas y gobernanza supervisada. | NOUS storage, observers, A11, policies, tests. | Bloque H; opt-in; datos suficientes. | NOUS observa antes de sugerir; no publica sin N, bias, founder gate y trazabilidad. | ML opaco, fuga tenant, sesgo. | Publicacion automatica, recalibracion automatica. | NOUS + KOSMOS + AUDITOR. |
| J · Founder/commercial/legal/pilot package | Mantener materiales founder, legal, contrato preliminar y piloto alineados con evidencia. | `docs/founder/*`, `docs/methodology/*`. | Bloque A y actualizaciones de producto. | Founder puede vender, defender y pilotear sin sobreprometer. | Claims comerciales no sustentados. | Pricing final, contrato legal final, marketing agresivo. | SUPREME + BIOS + AUDITOR. |
| K · Release hardening | Ejecutar QA funcional, visual, datos, acceso, export/provenance y decision release. | Tests, smoke scripts, release docs, observability docs. | Bloques B-J segun release scope. | Tests/smokes pasan o bloqueos documentados; decision release/staging/bloqueado explicita. | Release con acceso roto o datos falsos. | Nuevas features durante hardening. | AUDITOR + BIOS + POLIS + KRONOS. |

## Orden recomendado

1. Ejecutar A si hay cambio doctrinal o nuevo documento base.
2. Ejecutar B-C-D antes de cualquier tenant nuevo; para B aplicar el addendum `PLAN_CONTINUACION_ADMIN_CLIENTE_MUNICIPIO_PREPARADO.md` como contrato de Admin Operativo, Vista Cliente, Previsualizacion Cliente y Municipio Preparado.
3. Ejecutar E antes de usar SLP como caso demostrable en nueva arquitectura.
4. Ejecutar F-G antes de claims tecnicos fuertes.
5. Ejecutar H solo cuando provenance y datos tenant esten estables.
6. Ejecutar I solo observacional hasta que haya opt-in, N suficiente y governance.
7. Ejecutar J en paralelo documental, pero sin sobreprometer funciones no cerradas.
8. Ejecutar K antes de publicar o vender piloto real.

## Politica de cierre

Cada bloque debe entregar archivos modificados, comandos ejecutados, evidencia positiva, prueba negativa, bloqueos residuales y estado final: cerrado, parcial o bloqueado.
