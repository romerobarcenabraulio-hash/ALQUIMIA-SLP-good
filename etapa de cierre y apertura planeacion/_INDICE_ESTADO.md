# 📋 ÍNDICE DE ESTADO — TABLERO VIVO
**Última actualización:** 15 jun 2026 (noche) · por Claude Master
**Qué es:** el kanban de un vistazo. Estado real de cada doc. Si esto miente, el sistema falla (doc 17 §7).
**Leyenda:** 🟢 VIGENTE/listo · 🟡 ESPERA FIRMA/APROBACIÓN · 🔵 EMITIDA · ⚙️ EN EJECUCIÓN · ✅ EJECUTADO · 📚 REFERENCIA/HISTÓRICO

---

## ⚠️ KEYSTONES A CONCRETAR ANTES DE CONSTRUIR ANCHO (ambigüedades, repaso 18-jun)
Resolver estos PRIMERO o se construye sobre arena / se duplica código:
1. **ALQ-104** reconciliar specs vs FASE*/cursor-rules (extender vs construir) — antes de cualquier build.
2. **ALQ-23** COMPANY_PROFILE_SPEC concreto (campos/tipos) — todo cuelga de él.
3. **ALQ-24** Agent Spec schema concreto — sin esto no se "instancian" agentes.
4. **ALQ-25** lista ENUMERADA de acciones irreversibles (no principio, lista) — para que el gate sepa qué gatear.
5. **ALQ-107** relación de los 4 registros (módulos/capacidades/build-buy/playbooks) = 1 sistema, 4 facetas + definir L0–L3 concretos.
6. Asegurar que el agente alcanza REGLAS/HO-DIAG (AGENTS.md commiteado ✓; carpeta de planeación sin commitear — verificar acceso).

## 🗺️ MACRO ROADMAP (4 fases del founder) ↔ Hitos
1. **RSU para todo México** = Hito 0 (diagnóstico nacional + cierre GOV).
2. **Integrar Supermind a la parte ejecutora** = Hito 1 (engine + agentes + contratos).
3. **Super Supermind versátil para empresa privada** = Hito 2 (1º módulo + fábrica + orchestrator generador de servicios ALQ-105).
4. **Supermind para política pública** (extensión del RSU) = Hito 3+ (servicios de política vía el mismo generador).
→ **Se comercializa por ambos frentes** (GOV + Empresarial), lanzamiento paralelo (doc 08/10). Mismo motor, mismos playbooks, dos mercados.

## 🎯 NUESTRO FUERTE (el norte — no lo olvides)
Alquimia NO es un ERP/SaaS. Su fuerte: **identificar el problema + web scraping para identificar fuentes (MX y el mundo) + una filosofía de pensamiento compleja + digerir y resolver problemas con sentido común muy desarrollado.** Asistencia y consultoría embebida con procedencia. Entender lo que el cliente necesita — no ser el sistema, ser la inteligencia encima.

## 📁 ORDEN DE CARPETA (milestone nuevo)
Milestone "📁 Ordenar carpeta alquimia-slp": ALQ-112 (estructura canónica keep/archive/delete + FOLDER_MAP) + ALQ-30 (limpieza 205 duplicados " 2"/temp). 1 agente, 1 rama, PR.

## ⏳ DÓNDE ESTAMOS
**Fase:** Hito 0 EN MARCHA. ✅ RECON (ALQ-5), ✅ rebase resuelto (ALQ-6), ⚠️ **CI BLOQUEADO (ALQ-7 reabierto — billing de GitHub Actions: pago fallido / spending limit; salida $0 = repo público tras scrub de .env.sentry, o arreglar método de pago en privado)**, ✅ memoria repo (ALQ-8), ✅ Greptile gate (ALQ-17). Claude Code en ALQ-16. **Sin CI verde NO hay merge a main ni deploy**; agentes pueden seguir en rama + auto-auditar.

**⚠️ VEREDICTO RECON = ESCENARIO 2:** el trabajo del 14-jun (company_survey, container_inventory, etc.) NO se recupera. GOV close = **construir desde cero** sobre la base SCIAN/declaraciones (afecta tamaño del sprint, no la estrategia). Pendiente: correr `pytest` ahora que el repo está limpio para fijar el conteo REAL de tests (reemplaza el "1,062" no verificado).

## ✋ ESPERA DECISIÓN DEL FOUNDER (desbloquean todo lo demás)
1. 🟡 Firmar **ADR-001** (doc 13) → Proposed → Accepted.
2. 🟡 Aprobar **spec de agentes** (doc 14).
3. 🟡 Aprobar **diagnóstico nacional** (doc 15) + **cierre GOV** (doc 12).
4. ✋ Resolver el **rebase** (irreversible — decisión tuya) tras leer el resultado de RECON.
5. ✋ Conectar **GitHub** vía `/mcp` + encender CI (GRATIS, sin Anthropic — ver doc 19; decidir repo público vs privado 2,000 min).
6. 🟡 5 decisiones de negocio (doc 16 §5): alcance Ola 1 · primer módulo · persistencia Jarvis · conector cliente · Perplexity sí/no.

---

## RAÍZ (puntos de entrada)
| Doc | Estado |
|---|---|
| `00_EMPIEZA_AQUI.md` | 🟢 entrada |
| `_INDICE_ESTADO.md` (este) | 🟢 tablero vivo |
| `BUENOS_DIAS_16JUN.md` | 🟢 brief del día |
| `HANDOFF_TRANSICION_A_COWORK_2026-06-15.md` | 📚 referencia |

## DOCUMENTOS PENDIENTES/
| Doc | Estado | Nota |
|---|---|---|
| `08_PLAN_DEFINITIVO` | 🟢 plan maestro | gobierna todo |
| `09_PROTOCOLO_SATURACION` | 🟢 vigente | relevos |
| `10_MAPA_DE_TRABAJO_AGENTES` | 🟢 vigente | quién hace qué |
| `11_ESTADO_REAL_REPO_VERIFICADO` | 🟢 vigente | verdad medida del repo |
| `12_HANDOFF_CIERRE_GOV_HITO0` | 🟡 espera aprobación | gated por precondición |
| `13_ADR-001_ARQUITECTURA` | 🟡 Proposed (rev.1) | espera firma |
| `14_SPEC_AGENTES_Y_PROTOCOLO` | 🟡 Draft | espera aprobación |
| `15_DIAGNOSTICO_RSU_NACIONAL` | 🟡 espera aprobación | gated |
| `16_AUDITORIA_ARQUITECTURA` | 🟢 referencia/decisiones | 5 decisiones §5 |
| `17_GOBERNANZA_DOCUMENTAL` | 🟢 vigente | este sistema |
| `18_ESTRATEGIA_MEMORIA_Y_VELOCIDAD` | 🟢 vigente | memoria 2 capas + qué instalar |
| `19_MODO_COSTO_CERO` | 🟢 vigente | CI sin Anthropic; construir con $0 |
| `20_STACK_INTEGRACION_Y_AUTOMATIZACION` | 🟢 vigente | Linear/Stripe/Greptile/Render; SDK diferido |
| `21_INTELIGENCIA_COMPETITIVA_Y_CAPA_UNIFICADA` | 🟢 vigente | benchmark+out-build; backlog ALQ-21 |
| `22_EVALUACION_SUPERFICIE_DE_CAPACIDADES` | 🟢 vigente | todo reduce a 1 patrón; qué construir vs expresar |
| `23_CIERRE_DE_ARQUITECTURA` | 🟢 CIERRE | canon + voz/evidencia + alcance universal/organigrama; a programar |
| `24_SECUENCIA_MAESTRA_Y_MAPA_DE_APIS` | 🟢 vigente | RSU+deploy paralelo; cuándo enciende cada API (ElevenLabs, etc.) |
| `25_FLUJO_GIT_PR_MERGE_DEPLOY` | 🟢 vigente | rama→PR→Greptile/CI→merge gated→deploy Render/Vercel |
| `26_ESTIMACION_FASES_Y_AUDITORIA_FIDELIDAD` | 🟢 vigente | ~90–135 act. a auto-sostenible; ~150–220 a Hito 3; plan fiel |
| `27_TRAZABILIDAD_IDEAS_FEEDBACK_ACTIVIDAD` | 🟢 vigente | 40 ideas tuyas → feedback → actividad; nada se pierde |
| `28_INVENTARIO_COMPLETITUD_SPECS` | 🟢 vigente | barrido paranoico; 9 huecos → ALQ-48..56 |
| `29_ROSTER_AGENTES_CAPACIDADES_MODELOS` | 🟢 vigente | agentes+capacidades+75 modelos; ROI/TIR ya existen; gaps → ALQ-61..64 |
| `30_ADR-002_CAPA_DE_JUICIO_SUBCONSCIENCIA` | 🟡 Proposed | juicio compuesto + anti-sicofancia + System1/2 sobre NOUS; ALQ-65..68 |
| `31_MOTOR_SENTIDO_COMUN_DECISION_ACCION` | 🟢 vigente | ECA decisión→acción con razón/estándar; gaps → ALQ-69..72 |
| `32_PREMORTEM_RIESGOS_E_INCOGNITAS` | 🟢 vigente | pre-mortem; 3 riesgos top (venta/gate/datos); → ALQ-73..78 |
| `33_SOLUCIONES_INNOVADORAS` | 🟢 vigente | golden circle, vs Palantir, empatía adaptativa, entrevista, shadow mode; → ALQ-79..83 |
| `34_CAPA_DATOS_DURA_Y_GEMELO_DIGITAL` | 🟢 vigente | ingestión 24/7 fichas; gemelo digital staged (F1 2D ya / F2 dron-CV R&D); → ALQ-84..87 |
| `35_PAISAJE_COMPETITIVO_Y_COBERTURA` | 🟢 vigente | vs Slack/Salesforce/Bloomberg/Palantir; absorber slice, ganar la cuña; → ALQ-88/89 |
| `36_MARCO_BUILD_INTEGRATE_BUY` | 🟢 vigente | replicar solo el moat / integrar plomería / comprar materia prima; → ALQ-90 |
| `37_COBERTURA_DOMINIOS_CONSULTORIA` | 🟢 vigente | dominios (energía/logística/legal/etc.) qué+cómo tener; ERP no, contratos asistir; → ALQ-91..94 |
| `38_PATRON_INTEGRACION_MCP_ERP` | 🟢 vigente | conector MCP-style + anti-corrupción; read libre/write gated; absorber sin reemplazar; → ALQ-95 |
| `39_VARIABILIDAD_INTEGRACION_Y_MIGRACION_ERP` | 🟢 vigente | perfil de integración por tenant; migración a ERP (cuña); → ALQ-96/97 |
| `40_IDENTIDAD_PRODUCTO_Y_BIWO` | 🟢 vigente | Alquimia=capa de inteligencia sobre ERP/CRM (merge); BIWO; flujo legal; → ALQ-101 |
| `41_ADR-003_ONTOLOGIA_ALQUIMIA` | 🟡 Proposed | ONTOLOGÍA (objetos/links/acciones+procedencia)=spine Palantir-grade; → ALQ-102/103 |

**Concepto rector añadido:** la **Ontología** (ADR-003) es el spine que unifica todo (canónico+org+SA+ECA+red). Edge vs Palantir: procedencia nativa + auto-construida + cruza tenants (el moat).

---

## ⚠️ RECONCILIACIÓN ANTI-DUPLICACIÓN (mis docs 14–41 vs lo PRE-EXISTENTE en el repo)
Hallazgo (18-jun): varios docs míos RE-DERIVARON diseño ya existente en `docs/architecture/` (FASE*) y `cursor-rules/`. **La fuente CANÓNICA es la del repo (ya implementada parcial); mis docs DEFIEREN/cross-ref, no compiten ni reemplazan.** Antes de construir, el agente lee la fuente canónica (no reimplementa).

| Mi doc / issue | Fuente CANÓNICA pre-existente | Acción |
|---|---|---|
| ADR-002 juicio/subconsciencia · ALQ-65/67/68 | **NOUS: FASE17R/18/23/24/25/26/27** (+ app/nous) | DEFERIR: construir SOBRE NOUS, no reinventar |
| doc 31 ECA/sentido común · ALQ-69 | **FASE11 (consultiva) + FASE13 (runtime automation)** | cross-ref / reusar |
| doc 29 gen documental · ALQ-63/72 | **FASE12 (automatización documental + revisión humana)** | cross-ref; el gate ya está |
| doc 34 data moat + ADR-003 cross-tenant · ALQ-55 | **FASE14 (data moat + cross-tenant + privacidad)** | construir sobre FASE14 |
| ADR-001 / doc 14 / REGLAS (agentes) | **cursor-rules `_base.md` + EJECUTOR/AUDITOR/NAVIGATOR/ATLAS/AURUM/AESTHETE + PROTOCOLO_ECOSISTEMAS + COLA_Y_ROLES** | RECONCILIAR con el contrato y roles ya existentes |
| doc 37/29 dominios/capacidades · ALQ-94 | **CATALOGO_ENTREGABLES_CONSULTORIA** | poblar DESDE el catálogo, no inventar |
| ALQ-46/47 producción/observabilidad | **FASE9 (hardening) + FASE10 (observabilidad)** | reusar |
| doc 22 personalización · ALQ-56 | **MODULE_MATURITY_AND_PERSONALIZATION** | cross-ref |
| ESTÉTICA (doc 28/ALQ-16) | **AESTHETE-1 + ESTETICA_FRONTEND + FASE8** | ya referenciado ✓ |

**Regla nueva (doc 17 + REGLAS §3B):** leer `docs/architecture/FASE*` + `cursor-rules/` ANTES de crear doc o código; editar/cross-ref sobre crear; NO reimplementar lo ya hecho.

**Top-3 riesgos (doc 32):** 🔴 sin primera venta (ALQ-73) · 🔴 fallo de gate/trigger (ALQ-74/75) · calidad de datos (ALQ-76/77).
| `04`–`07` (reencuadre, ruta, handoffs día 1) | 📚 apoyo | stack corregido por 08 |
| `_superados_v1/` | 📚 histórico | NO usar |

## HANDOOF AGENTE DE CODIGO/
| Doc | Estado | Nota |
|---|---|---|
| `REGLAS_DE_EJECUCION_AGENTES` | 🟢 contrato v1.0 | colocar como AGENTS.md/CLAUDE.md |
| `BITACORA_MAESTRA` | 🟢 log vivo | |
| `HO-D0-RECON_CODEX_16jun` | 🔵 EMITIDA | primer ticket, read-only |
| `HO-DIAG_PROMPTS_CODEX_Y_CLAUDECODE` | 🟢 prompts listos | gated por repo limpio |
| `HANDOFF_20260614` | 📚 referencia | handoff técnico (no verificable, ver doc 11) |

## DOCUMENTOS EJECUTADOS/
| — | _(vacío: nada cumple criterio de cierre todavía)_ |

---

## 🔗 LINEAR (tablero vivo — plan de 2 semanas)
Proyecto **"Hito 0 — Cierre GOV + Diagnóstico RSU Nacional"** (equipo Alquimiaplatform). 16 issues en 2 milestones. El kanban .md y Linear son espejo.

**Semana 1 — Recuperación + Fundaciones + GOV backend:** ALQ-5 RECON (Codex) · ALQ-6 rebase (Founder) · ALQ-7 seguridad+CI · ALQ-8 memoria repo (Codex) · ALQ-9 DIAG T1 catálogo (Codex) · ALQ-13 router ContainerInventory+Alembic (Codex) · ALQ-14 KPI backend (Codex).

**Semana 2 — Diagnóstico nacional + Frontend + Auditorías:** ALQ-10 ingesta+cobertura (Codex) · ALQ-11 endpoints (Codex) · ALQ-12 mapa+semáforo (Claude Code) · ALQ-15 ReportBuilder PDF (Claude Code) · ALQ-16 Design System (Claude Code) · ALQ-17 Greptile PR gate · ALQ-18 audit seguridad (Codex) · ALQ-19 audit procedencia (Codex+CC) · ALQ-20 audit accesibilidad (Claude Code).

**Asignación fija:** Codex = backend/datos/infra. Claude Code = frontend/specs/auditoría visual. Nunca los mismos archivos el mismo día.

**Roadmap COMPLETO en Linear (6 milestones):** Semana 1 · Semana 2 · Hito 1 contratos (CM) · **Hito 2** (ALQ-36–41: engine+LISTENER, ORCHESTRATOR/SECTOR, 1º módulo BE/FE, onboarding, 🎯 1 PyME pagando) · **Hito 3** (ALQ-42–45 + 34: fiscal 18-J/CFDI, COMMERCE_AGENT, E2, 🎯 primer deal) · **Producción/Calidad** (ALQ-46/47: observabilidad, backups/DR, performance). Estándar: **nivel mercado, no MVP genérico** (en descripción del proyecto). Hitos futuros como EPICS; se desglosan al entrar (cadencia doc 17).

**Estándar frontend CONFIRMADO (fuentes reales en el repo):** minimalista McKinsey/Minto (`docs/architecture/FASE8_AUDITORIA_VISUAL_MINTO_MCKINSEY.md`, estado cerrado para módulos auditados) + constitución `cursor-rules/OLD/AESTHETE-1.md` (WCAG **2.2** AA piso, OKLCH, NarrativeBridge, tokens W3C, ISO 9241, Tufte) + `25_tokens_y_design_as_code.md` + `FRONTEND DEFINITIVO/`. Pendiente: aplicarlo a las pantallas nuevas del diagnóstico (ALQ-16/20). Corrección: es WCAG 2.2, no 2.1.

**Regla de palomita (REGLAS §7):** ninguna tarea pasa a Done sin el ciclo **codificar → auto-auditar → corregir → review Greptile+CI verde → palomear → siguiente.** La palomita se gana; no se avanza con la anterior sin auditar.

**Pipeline Claude Master (Hito 1, milestone propio):** ALQ-23 COMPANY_PROFILE_SPEC → ALQ-24 schema Agent Spec → ALQ-25 reversible/irreversible → ALQ-26 ORCHESTRATOR/SECTOR → ALQ-27 lifecycle Jarvis+router → ALQ-28 MASTER_SYSTEM+DATA_MODEL → ALQ-29 evidencia. + ALQ-22 ORG_BUILDER. Son los .md que escribo cuando GOV cierre.

## ▶️ SIGUIENTE ACCIÓN CONCRETA
Mover **ALQ-5 (RECON)** a In Progress → disparar a Codex → leer `RECON_RESULTADO_16jun.md` → resolver rebase (ALQ-6) → GitHub `/mcp` + CI (ALQ-7). Ahí se desbloquea el diagnóstico (ALQ-9 T1 + ALQ-12 SCR). Nada de SDK/Anthropic todavía (doc 20).

*Mantenido por Claude Master. Se actualiza en cada emisión/cierre de doc (doc 17 §6).*
