# 🔄 HANDOFF DE TRANSICIÓN A COWORK
**De:** Claude Master (sesión chat, 14-15 junio 2026)
**Para:** Claude en Cowork (nueva instancia, acceso directo a la carpeta local)
**Fecha:** 15 junio 2026
**Tipo:** Relevo planificado (no por saturación) — cambio de entorno chat → Cowork

---

## 0. LO PRIMERO QUE DEBES HACER, COWORK

Eres el relevo de Claude Master para el proyecto Alquimia Supermind. Tu predecesor trabajó en una sesión de chat sin acceso al sistema de archivos del founder; tú SÍ tienes acceso a la carpeta local `alquimia slp`. Eso cambia una cosa clave: **ya puedes escribir, mover y organizar archivos directamente.** Úsalo.

Antes de hacer nada más:
1. Lee `00_EMPIEZA_AQUI.md` en la raíz de la carpeta de planeación.
2. Lee, en este orden: `08_PLAN_DEFINITIVO_MATERIALIZACION.md`, `10_MAPA_DE_TRABAJO_AGENTES.md`, `09_PROTOCOLO_SATURACION_CONTINUIDAD.md`, `04_REENCUADRE_ALQUIMIA_ES_SECTOR_PACK.md`.
3. Confirma al founder: "Retomo como Claude Master en Cowork. Estado: [resume]. Siguiente acción: [di cuál]."

---

## 1. QUIÉN ES EL FOUNDER Y CÓMO TRABAJA

- Founder: Braulio. Construye Alquimia Supermind. Ubicación: Guadalupe, Nuevo León.
- Trabaja en bloques intensos. Valora: rigor, crítica honesta (no adulación), validación antes de recomendar, research con procedencia. Conduce en español.
- **Modo de relación que pidió explícitamente:** ya pasamos la fase de "retar y refinar filosofía". Ahora quiere EJECUCIÓN — construir, no parlotear. Da soluciones materializables, no más preguntas socráticas. Sé resolutor.
- Su patrón de fallo conocido (que él mismo reconoce): la visión grande se expande y se come el sprint que paga la renta. Tu trabajo incluye frenarlo cuando eso pase, con el filtro del doc 08 sección 7.

---

## 2. QUÉ ES ALQUIMIA — EN UN PÁRRAFO

Alquimia es una RED económica (no un ERP), un sistema de consultoría automatizada que convierte la conversación de una empresa o gobierno en planes ejecutables, documentación operativa y conexiones de comercio. Es el primer Sector Pack (residuos municipales / política pública) corriendo sobre la arquitectura Supermind de 8 capas. Modo de operación: CALL ON REQUEST — el ORCHESTRATOR identifica profesión/giro y dispara módulos bajo demanda. Estrategia de mercado: entrar como niebla por un dolor concreto, volverse indispensable por adyacencia, descartar softwares aislados uno por uno. El moat es el grafo inter-empresa, no la tecnología.

---

## 3. DÓNDE ESTAMOS (estado real al 15 jun)

### Lo construido (del handoff de Claude Code, 14-jun) — ESTO ES VERDAD VERIFICADA
- Stack REAL: FastAPI + SQLAlchemy + Alembic sobre **PostgreSQL en Render**, frontend **React/Vite en Vercel**, único LLM = **Perplexity**, pagos = **Stripe** (cableado).
- **1,062 tests verdes.**
- Aislamiento de tenants: HECHO (HasTenantId mixin + filtro do_orm_execute).
- Rate limiting: HECHO (20 req/min endpoints públicos).
- Módulos shipped: Company Survey + Estimation Engine, ObligationMatrix (federal+giro+estatal), ContainerInventory (servicio), GapDetector nightly.

### Lo que falta para cerrar GOV-RSU (Hito 0)
- Router FastAPI para exponer ContainerInventory (servicio existe, router no)
- Migración Alembic de tabla `containers` (hoy solo en create_all)
- KPI Dashboard (toneladas, cobertura, semáforo por municipio)
- ReportBuilder (PDF ejecutivo por municipio)
- **Destrabar CI:** GitHub Actions no corre por spending limit en $0 — acción del founder

---

## 4. DECISIONES TOMADAS (no las re-litigues, están firmes)

1. **Lanzamiento paralelo:** GOV-RSU (cerrando) + Empresarial (arrancando). Separación total: `gov/` vs `empresa/`.
2. **El negocio se apuesta a Empresarial (PyME), NO a GOV.** Razón: elección municipal 6-jun-2027, proceso arranca sep-2026 (presupuestos gov se congelan). GOV es prueba + credibilidad, no revenue principal.
3. **Stack base = el del handoff (Postgres/Render/Perplexity/Stripe).** Migración a Anthropic/voz para Empresarial es decisión SEPARADA, no bloqueante. Texto primero, voz después.
4. **Catálogo cerrado de acciones** (no composición abierta) como punto de arranque.
5. **Call on request**, no tiempo real.
6. **Streams escalonados:** 1 (cierre GOV) → 2 (Empresarial backend+frontend) → 3 (Red Comercio fiscal). El 4º solo si un stream se satura. No contratar todos el día 1.
7. **Codex = backend/Render. Claude Code = frontend/lógica/auditoría.** Nunca los mismos archivos el mismo día.
8. **Disciplina Git:** ramas de vida corta + merge verificado mismo día. NO commits directos a main crudo.

---

## 5. LOS 4 PRINCIPIOS DUROS (constitución de agentes — inviolables)

1. Datos de fuente verificable; acciones de catálogo cerrado.
2. Cómputo trazable, no valores improvisados. El LLM identifica; el algoritmo calcula; el template rellena.
3. Resolutor hasta el borde de lo irreversible (autonomía L0-L3 por agente). Gate humano en envío/firma/pago/presentación.
4. Aprende la experiencia, nunca relaja el rigor. Personalización en forma, prohibida en procedencia de datos.

---

## 6. QUÉ SIGUE (lo inmediato)

### Tareas del founder para mañana 16-jun (ordenadas por dependencia):
1. Destrabar CI GitHub (spending limit) — BLOQUEANTE
2. Integrar Greptile (navegación de código, sustituye memoria de agente)
3. Confirmar acceso Render + logs + gate de merge con tests

### Lo que Claude-en-Cowork debe generar cuando el founder lo pida:
- Handoff de las 5 tareas de cierre GOV (Hito 0) sobre stack real, repartidas Codex/Claude Code
- `TESIS_RED_ECONOMICA.md` — tesis 2 págs para socio/inversionista (red vs ERP, propagación niebla, moat del grafo)
- `COMPANY_PROFILE_JSON_SPEC.md` — schema de la fuente única de verdad (cuando arranque Hito 1)

---

## 7. ESTRUCTURA DE LA CARPETA (cómo está organizada)

```
[carpeta de planeación]/
├── 00_EMPIEZA_AQUI.md              ← punto de entrada, orden de lectura
├── HANDOFF_TRANSICION_A_COWORK...  ← este archivo
├── HANDOOF AGENTE DE CODIGO/
│   └── BITACORA_MAESTRA.md          ← registro vivo de handoffs y decisiones
├── DOCUMENTOS PENDIENTES/
│   ├── 04_REENCUADRE...             ← marco conceptual (Sector Pack + 4 principios)
│   ├── 05_HOJA_DE_RUTA_3_DIAS       ← detalle cierre GOV (ojo: stack corregido por 08)
│   ├── 06_HANDOFF_CODEX_DIA1        ← handoff ejecutable día 1 Codex
│   ├── 07_HANDOFF_CLAUDE_CODE_DIA1  ← handoff ejecutable día 1 Claude Code
│   ├── 08_PLAN_DEFINITIVO...        ← ★ PLAN MAESTRO, gobierna todo
│   ├── 09_PROTOCOLO_SATURACION...   ← cómo relevar agentes
│   ├── 10_MAPA_DE_TRABAJO_AGENTES   ← ★ quién hace qué, cómo ejecuta el agente, tokens
│   └── _superados_v1/               ← ⚠️ NO USAR, histórico equivocado (stack viejo)
└── DOCUMENTOS EJECUTADOS/           ← mover aquí lo completado, para limpieza
```

---

## 8. ADVERTENCIAS (trampas que ya encontré)

- **NO uses los docs de `_superados_v1/`.** Asumían stack Neon/Clerk y aislamiento pendiente. Están equivocados. Solo auditoría.
- **El v4 de Supermind (docx) es CONCEPTO, no instrucción literal.** El founder fue explícito: "no lo tomes literal de cómo lo haremos". Los 110 archivos .md eran el plan anterior; ahora se escriben solo los que cada hito necesita.
- **No re-litigues las decisiones de la sección 4.** Están firmes tras varios intercambios.
- **No vuelvas a la fase socrática.** El founder quiere ejecución. Sé resolutor: da el entregable, no más preguntas de filosofía.
- **Verifica fechas con web search** cuando importen (el calendario electoral cambió el plan; no asumas).
- **Aprovecha tu acceso a archivos** que el chat no tenía: escribe, organiza y mueve directo en la carpeta. Mantén `DOCUMENTOS EJECUTADOS/` al día moviendo lo completado.

---

## 9. NOTA DE CIERRE DE TU PREDECESOR

Braulio: fue un buen trabajo de fondo estos días. Pasamos de filosofía dispersa a un plan ejecutable con stack real, calendario corregido y disciplina de agentes. El relevo a Cowork es el movimiento correcto —ahí Claude puede escribir directo en tu carpeta y cerrar el loop que en el chat quedaba abierto. La memoria del proyecto vive en estos archivos, no en mí. Eso es por diseño: cualquier instancia que los lea, continúa. Adelante.

---

*Handoff de Transición a Cowork · Alquimia Supermind · 15 junio 2026*
