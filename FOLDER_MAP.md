# FOLDER_MAP — alquimia-slp
Mapa de la carpeta. 1 línea por entrada. (ALQ-112 limpio — reemplaza al PR #39)

## Código (producto)
- backend/        API FastAPI + SQLAlchemy + Alembic (Render, vía Dockerfile raíz)
- frontend/       App Next.js (Vercel)
- modules/        Módulos Python que el backend copia a la imagen (personalization, lifecycle, logistics…)
- agents/ system/ config/ data/   Agentes, estado del sistema, config y datos que viajan con el backend
- scripts/        Scripts de utilidad y checks de CI (eidos_check_docs.py)
- contracts/      Contratos de API (OpenAPI v1)
- compose/ changelog/ phase-rules/ backups/   Docker, changelog, reglas de fase, manifests de respaldo

## Docs canónicos (fuente de verdad)
- docs/                       Arquitectura (FASE*) y specs
- cursor-rules/               Contratos de agentes (AESTHETE-1, roles, protocolos)
- AJUSTES PARA FINIQUITAR/    Specs canónicos (agent spec, learning, automation)
- AJUSTES.ALQUIMIA/           Histórico de fases — se queda aquí: 6 docs canónicos lo enlazan
- etapa de cierre y apertura planeacion/   Planeación viva: pendientes, ejecutados, handoffs, REGLAS

## Insumos que el código LEE por ruta (NO mover sin actualizar el código)
- ADENDOS: LEGAL/             modules/personalization/{coherence_validator,cross_contamination}.py y tests
- ESTANDARES INTERNACIONALES/ backend/tests/test_pdf_intake.py
- SLP ( contexto )  /         backend/app/planning/financial_model/model_loader.py (Modelo_BASED.xlsx)
- fuentes de calculo/, Investigacion_Precios_RSU_SLP.xlsx, Tabla_Maestra_Fuentes_CapituloSLP.docx   backend/scripts/slp_phase4_backup.py
- FRONTEND DEFINITIVO/        Referencia visual citada por frontend/DESIGN_SYSTEM.md
- REGLAMENTOS DE ASEO PUBBLICO/   Fuente normativa

## Referencia sin dependencias de código
- referencia/     Listados de observaciones (mayo)

## Archivo (histórico, NO usar como fuente)
- _ARCHIVO_VIEJO/   Planes y prompts superados, auditoría visual vieja. DEPRECADO.

## Generado / local (ignorado o no tocar)
- .venv-pdf/ .pytest_cache/ node_modules/ .playwright-browsers/ .vercel/ .obsidian/ .cursor/ .claude/ codex-marketplaces/ plugins/ alquimia-ui-lab/ (repo aparte)

## Regla para mover algo
Antes de mover una carpeta: `git grep -n "<nombre>"` sobre código, infra y docs canónicos.
Si hay referencias, se actualizan en el mismo PR o la carpeta no se mueve. Un glob que deja de
encontrar archivos no truena: pasa en verde falso.
