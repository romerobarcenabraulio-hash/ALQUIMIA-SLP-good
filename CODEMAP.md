# CODEMAP - ALQUIMIA SLP

Indice operativo para agentes. Leer este archivo antes de escanear el repo entero.

## Raiz

- `AGENTS.md` - contrato permanente de agentes de codigo.
- `CLAUDE.md` - memoria especifica de Claude Code.
- `render.yaml` / `Dockerfile` - despliegue backend en Render desde raiz del monorepo.
- `DEPLOYMENT.md` - URLs y checklist historico de despliegue.
- `etapa de cierre y apertura planeacion/` - handoffs, bitacora, tickets y documentos de planeacion.
- `docs/architecture/` - fases, ADRs y contratos de arquitectura vigentes.
- `docs/execution/` - auditorias, estado MVP, evidencias de pruebas y handoffs de ejecucion.

## Backend

- `backend/app/main.py` - FastAPI principal, registro de routers, health/version/runtime.
- `backend/app/config.py` - settings, env vars, URLs publicas, Stripe, Maps, DB.
- `backend/app/db/` - base SQLAlchemy, sesiones y seguridad DB.
- `backend/alembic/` - migraciones Alembic.
- `backend/app/models/` - modelos persistentes: tenants, usuario, pagos, research, geo, archivo, nous, etc.
- `backend/app/schemas/` - schemas compartidos.
- `backend/app/routers/` - routers legacy/transversales, incluidos pagos y webhooks.
- `backend/app/admin/` - estado de tenant, perfiles municipales y operaciones admin.
- `backend/app/auth/` - password crypto, email/SMS, TOTP, onboarding y usuarios.
- `backend/app/access/` - middleware y schemas de acceso.
- `backend/app/city/` - catalogo municipal CVE INEGI y repositorios municipales.
- `backend/app/national/` - diagnostico RSU nacional: cobertura, huella, circularidad, ZM grid e ingesta legal.
- `backend/app/data/` + `backend/app/data/adapters/` - fuentes oficiales y registro de datos.
- `backend/app/legal/` - reglamentos, diagnostico juridico, estrategia de reforma, PDFs legales.
- `backend/app/research/` - busqueda/bibliografia y recovery de fuentes.
- `backend/app/agora/` - pipeline y router AGORA.
- `backend/app/agents/` - builders, prompts, specs documentales, linter y exportadores de agentes.
- `backend/app/automation/` - automatizacion documental, field studies, NOUS observacional, runtime y data moat.
- `backend/app/nous/` - motor de aprendizaje/insights NOUS.
- `backend/app/standards/` - mapeo de KPIs a GRI/SASB/ODS/ISO.
- `backend/app/centros_acopio/` - centros de acopio, geocoding, Places/DENUE, grafo de infraestructura.
- `backend/app/google/` - clientes Maps Platform: Places, Geocoding, Routes y quota guard.
- `backend/app/empresa/` - SCIAN, perfil RSU empresarial y PDF de perfil.
- `backend/app/export/` - renderers DOCX/XLSX/PDF, paquetes, portafolios y narrativa ejecutiva.
- `backend/app/dashboard/` - agregadores y endpoints de tablero.
- `backend/app/decision_tree/` - motor de arbol de decision.
- `backend/app/residue_tracking/` - registro de residuos.
- `backend/app/waste_flows/` - flujos de residuos.
- `backend/app/market/` - mercado, placement y registry.
- `backend/app/scenarios/` - escenarios y comparadores.
- `backend/app/statistical/` - calculos deterministas como PERT/Monte Carlo/multiplicadores.
- `backend/app/planning/` - presupuesto, financial model, riesgo y scheduling.
- `backend/app/logistics/` - rutas, depot resolver, persistencia y bridge logistico.
- `backend/app/operations/` - compliance, gates legales, PER y eventos operativos.
- `backend/app/governance/` - checker y endpoints de gobernanza.
- `backend/app/cron/` - jobs y endpoints protegidos por `CRON_SECRET`.
- `backend/tests/` - 96 archivos `test_*.py` al 17 jun 2026.

## Frontend

- `frontend/src/app/` - Next.js App Router.
- `frontend/src/app/admin/` - consola admin y tabla maestra municipal.
- `frontend/src/app/v/` - vista cliente consultiva.
- `frontend/src/app/p/`, `frontend/src/app/e/` - shells por experiencia/rol.
- `frontend/src/app/hub/` - hub y rutas de modulo: documentos, generadores, mapa, plan, ESG, analytics.
- `frontend/src/app/onboarding/` - onboarding, perfil y reglamento.
- `frontend/src/app/decision-tree/` - decision tree cliente/admin.
- `frontend/src/components/platform/` - componentes plataforma consultiva.
- `frontend/src/components/simulator/` - legado funcional; revisar antes de reutilizar.
- `frontend/src/components/admin/` - piezas admin.
- `frontend/src/components/layout/` - shell/layout.
- `frontend/src/components/reglamento/` - UI de reglamentos.
- `frontend/src/hooks/` - hooks de RBAC, tenant, permisos, persistencia y onboarding.
- `frontend/src/lib/api.ts` - URL/base API.
- `frontend/src/lib/rbac.ts` y `frontend/src/hooks/useRBAC.ts` - reglas de permisos.
- `frontend/src/lib/platformModuleGroups.ts` + `chapterConfig.ts` - organizacion de modulos cliente.
- `frontend/src/lib/municipalityPreparation.ts` - estados de preparacion municipal.
- `frontend/src/data/` - datos estaticos, reglamentos, narrativas, fuentes y matrices.
- `frontend/src/store/` - Zustand/persistencia de simulador/logistica.
- `frontend/src/types/` - tipos compartidos del frontend.

## Docs Y Planeacion

- `etapa de cierre y apertura planeacion/HANDOOF AGENTE DE CODIGO/` - contrato permanente, bitacora, RECON y prompts de ejecucion.
- `etapa de cierre y apertura planeacion/DOCUMENTOS PENDIENTES/` - documentos de arquitectura/trabajo aun no movidos a canon.
- `memory/` - glosario, decisiones y gotchas para agentes.
- `cursor-rules/` y `.cursor/rules/` - reglas de Cursor/Navigator/contratos.

## Comandos Frecuentes

- Backend tests: `cd backend && python -m pytest -q`
- Frontend type-check/build: revisar `frontend/package.json` antes de correr.
- Estado git: `git status --short`
- Buscar rapido: `rg "<patron>"`

## Riesgos Conocidos

- `.git` puede quedar bloqueado en sandbox; si `git add` falla por `index.lock Operation not permitted`, completar stage/rebase desde terminal local.
- No asumir Render verde sin logs o health actual. Ultimo dato founder: deploy 12 jun verde.
- La experiencia cliente no debe filtrar IDs/gates internos ni lenguaje de simulador.
