# BACKEND AGENT HANDOFF

**Agente recomendado:** KRONOS backend/storage + KOSMOS schema validation + AUDITOR gate.

## Mision

Implementar o endurecer backend para `tenant_state`, roles, gates, capabilities, trazabilidad, provenance y acceso por plataforma sin automatizar decisiones humanas.

## Leer primero

- `AJUSTES PARA FINIQUITAR/ADR-0010_stage_based_platform_separation.md`
- `AJUSTES PARA FINIQUITAR/PLATAFORMA_0_BACKOFFICE_SPEC.md`
- `docs/execution/MASTER_IMPLEMENTATION_PLAN.md`
- `docs/execution/BINARY_ACCEPTANCE_GATES.md`
- `docs/architecture/capability_registry.json` si existe.

## Areas probables a tocar

- Modelos/migraciones tenant.
- Endpoints admin tenants/gates/capabilities.
- Middleware o guards de stage.
- Audit/provenance logs.
- Tests backend.

## Alcance permitido

- `tenant_state` canonico.
- Gates humanos con evidencia.
- Roles/permisos.
- Separacion de `/admin`, `/v`, `/p`, `/e`.
- Storage de provenance/ClaimLedger si aplica al bloque.

## Limites estrictos

- No cerrar gates automaticamente.
- No cambiar stage por agente.
- No exponer Plataforma 0 a cliente municipal.
- No mezclar datos privados entre tenants.
- No implementar NOUS maduro ni publicacion automatica.
- No borrar legacy sin decision founder.

## Pruebas esperadas

- Unit/API tests de tenant_state.
- Prueba negativa: tenant validation no accede a planning/execution.
- Prueba negativa: cierre de gate sin evidencia/responsable falla.
- Prueba de aislamiento tenant.
- Smoke de endpoints criticos.

## Criterio binario de cierre

Backend cierra solo si stage, gates, roles, audit log y aislamiento tenant funcionan con pruebas positivas y negativas.

## Formato de entrega

Archivos modificados, migraciones, endpoints, comandos, pruebas, datos comparados, bloqueos y estado: cerrado/parcial/bloqueado.
