# 17 · GOBERNANZA DOCUMENTAL Y CADENCIA DE INSTRUCCIONES
**Fecha:** 15 jun 2026 (noche)
**Autor:** Claude Master (Cowork)
**Propósito:** Codificar el ritmo. Las carpetas son un kanban; los .md fluyen de pendiente → ejecutado. Define CUÁNDO Claude Master crea cada instrucción, según el time-space del proyecto. Orden, disciplina, ejecución rápida y limpia.

---

## 1. EL KANBAN DE CARPETAS (qué significa cada una)

| Carpeta | Qué contiene | Regla |
|---|---|---|
| **Raíz** | Puntos de entrada: `00_EMPIEZA_AQUI`, `_INDICE_ESTADO`, brief del día | Lo primero que se lee |
| **DOCUMENTOS PENDIENTES/** | Instrucciones vigentes: por aprobar, aprobadas, emitidas, en ejecución | El "por hacer / haciendo" |
| **DOCUMENTOS EJECUTADOS/** | Lo completado Y validado | Se mueve aquí SOLO al cumplir su criterio de cierre |
| **HANDOOF AGENTE DE CODIGO/** | Tickets a agentes, bitácora, contrato de ejecución, resultados de relevo | El canal con Codex/Claude Code |
| **_superados_v1/** | Histórico equivocado | Solo auditoría, no usar |

---

## 2. CICLO DE VIDA DE UN .MD DE INSTRUCCIÓN

```
DRAFT → APPROVED (founder firma) → EMITIDA (pegada al agente) →
EN_EJECUCION → EJECUTADO (criterio de cierre cumplido + validado) →
MOVIDO a DOCUMENTOS EJECUTADOS/
```

- El estado vive en `_INDICE_ESTADO.md` (tablero) y en `BITACORA_MAESTRA.md` (log).
- **Solo se mueve a EJECUTADOS cuando el criterio de aceptación está 100% cumplido y validado.** Ni antes, ni "casi".
- Doc obsoleto pero NO ejecutado (superado por otro) → `_superados/`, no a EJECUTADOS. Son cosas distintas: "hecho" vs "descartado".

---

## 3. CONVENCIÓN DE NOMBRES
- `NN_TITULO.md` numerado por orden de creación (…15, 16, 17). ADRs = `ADR-00N`. Tickets = `HO-XXX`.
- Un doc maestro por tema. Cambio grande → `rev.N` dentro del doc (con nota de revisión) o `vN` nuevo. **Nunca reescribir silenciosamente** — la auditoría importa.

---

## 4. LA REGLA ANTI-DISPERSIÓN (cuándo NO crear)
Just-in-time: se escribe el doc que el hito ACTUAL necesita, cuando lo necesita. **NO los 110 de golpe** (la ansiedad del v4). Un doc nuevo se justifica solo si:
- (a) desbloquea la siguiente acción concreta, o
- (b) captura una decisión que, si no se escribe hoy, se pierde.
Si no cumple (a) ni (b), no se escribe todavía.

**REGLA ANTI-DUPLICACIÓN (obligatoria, añadida 18-jun):** ANTES de crear cualquier doc, **leer `docs/architecture/FASE*` y `cursor-rules/`** — gran parte de la arquitectura YA está definida ahí (NOUS=FASE17-27, automatización=FASE11-13, data moat/privacidad=FASE14, agentes=`_base.md`+roles, catálogo de entregables, observabilidad=FASE9/10, estética=AESTHETE-1). Si ya existe: **EDITAR / cross-referenciar la fuente canónica, NO crear un doc nuevo que la duplique.** Ver mapa de reconciliación en `_INDICE_ESTADO`. Esto evita trabajo doble y que se "pierdan" decisiones ya tomadas.

---

## 5. MAPA DE CADENCIA — CUÁNDO CREO QUÉ, POR TIME-SPACE

| Fase (dónde estamos) | Disparador | Docs que Claude Master crea | Ejecuta | Al cerrar |
|---|---|---|---|---|
| **Pre-Hito 0 — recuperación repo (AHORA)** | repo en rebase, base sin verificar | `HO-D0-RECON`, brief del día, este `17` | Codex (recon) / founder | → EJECUTADOS |
| **Hito 0 — cierre GOV** | repo limpio + CI verde | `12` (5 tareas), `15`+`HO-DIAG` (diagnóstico nacional) | Codex + Claude Code | → EJECUTADOS por ola |
| **Hito 1 — fundación Empresarial** | GOV cerrado | `COMPANY_PROFILE_JSON_SPEC`, lista reversible/irreversible, reglas ORCHESTRATOR/SECTOR, lifecycle Jarvis, router de capacidades, `MASTER_SYSTEM`, `DATA_MODEL` | backend+frontend streams | → EJECUTADOS |
| **Hito 2 — primer módulo** | Profile listo + módulo elegido | `SCR_*` por pantalla, spec del módulo (E1), handoff del módulo | stream 2 | → EJECUTADOS |
| **Hito 3 — red comercio + fiscal** | primer módulo en producción | specs fiscales (18-J LIVA, CFDI Carta Porte) **solo tras validación contador/abogado** | stream 3 | → EJECUTADOS |

**Lectura clave:** cada fila se desbloquea al cerrar la anterior. No escribo los docs de Hito 1 mientras Hito 0 no cierre. El número de docs lo dicta el hito, no la ansiedad.

---

## 6. MI LAZO CONTINUO (el ritmo que corro como Claude Master)

Por cada unidad de trabajo:
1. **Antes:** ¿existe el doc de instrucción que la siguiente acción necesita? Si no → lo creo (DRAFT → pido APPROVED).
2. **Al emitir:** registro en bitácora (HO-XXX, status EMITIDA) + actualizo `_INDICE_ESTADO`.
3. **Durante:** el agente ejecuta. No creo docs nuevos salvo que surja una decisión que haya que capturar.
4. **Al terminar:** valido el criterio de cierre → **muevo el doc a EJECUTADOS** → actualizo índice + bitácora → creo el siguiente doc que el hito necesita.
5. **Si me saturo:** handoff de relevo (doc `09`). Los archivos recuerdan, no yo.

---

## 7. HIGIENE (revisión recurrente)
- Revisar PENDIENTES: ¿algo ejecutado sin mover? → muévelo. ¿algo obsoleto? → `_superados`.
- `_INDICE_ESTADO` SIEMPRE refleja la realidad. Si el tablero miente, el sistema falla.
- La bitácora es el log; el índice es el tablero. Ambos al día.

---

*17 · Gobernanza Documental y Cadencia · Alquimia Supermind · 15 jun 2026*
