# 05 · HOJA DE RUTA — 3 DÍAS PARA CERRAR DIAGNÓSTICO Y ENCENDER PLANEACIÓN
**Fecha:** 15 junio 2026
**Ventana:** 15, 16, 17 junio (3 días)
**Meta:** Cerrar Fase 1 (Diagnóstico) del Sector Pack de residuos + dejar andamiaje de Fase 2 (Planeación) listo para construir
**Lectura previa:** 04_REENCUADRE_ALQUIMIA_ES_SECTOR_PACK.md

---

## 0. LA DISCIPLINA GIT (lo que prometí explicarte antes de decidir)

Pediste "todo en main, que no hagan un cagadero". Aquí está el riesgo y la decisión correcta.

### El riesgo de "ambos commitean directo a main"
Dos agentes escribiendo al mismo `main` simultáneamente produce: commits entrelazados que rompen el build, un agente sobrescribiendo trabajo del otro, y deploys automáticos a Render/Vercel con código a medias. Eso ES el cagadero. "Todo a main directo" no previene el caos — lo causa.

### La disciplina que SÍ previene el cagadero (y aún así te deja main siempre limpio)
**Ramas de vida ultra-corta + merge verificado el mismo día.** No es "branches eternos que divergen". Es: cada agente trabaja en una rama que vive horas, no días; cuando su tarea pasa verificación, se mergea a main inmediatamente y la rama se borra. Main siempre queda verde y desplegable. Los dos agentes nunca tocan los mismos archivos el mismo día (la división de tareas lo garantiza).

**Reglas duras (van en el handoff de cada agente):**
1. Una rama por tarea, nombrada `fase1/<tarea>` o `fase2/<tarea>`. Vive máximo un día.
2. Antes de empezar: `git pull origin main`. Siempre desde main actualizado.
3. Commits pequeños y descriptivos. Nada de "fixes" o "wip" sin contexto.
4. Antes de mergear: el build pasa, el lint pasa, los tests pasan. Sin excepción.
5. Merge a main vía PR con descripción. Borrar la rama tras mergear.
6. **Codex y Claude Code nunca tocan los mismos archivos el mismo día.** La división de tareas (sección 2) lo garantiza por diseño.
7. Si hay conflicto de merge: PARAR y reportar. No forzar.

Esto te da lo que querías —main siempre limpio y desplegable— sin el caos de escritura concurrente. **Es "todo converge a main rápido", no "todo se escribe en main crudo".** Recomiendo esta. Si insistes en commits directos a main sin rama, lo documento pero te advierto por escrito que el riesgo de build roto en Render es alto.

---

## 1. DIVISIÓN POR CAPACIDAD: QUIÉN HACE QUÉ

Dijiste "no sé qué hace mejor cada uno, decide tú". Aquí está la división por las fortalezas reales de cada plataforma.

### CODEX (OpenAI/GPT-5.2-Codex en Codex)
**Fortaleza:** ejecución agéntica de cambios de código multi-archivo, acceso a Render, refactors backend, tareas largas autónomas con compaction de contexto.
**Le asignamos:** todo lo de **backend (FastAPI), base de datos (Neon), despliegue (Render), e integración de datos.** Codex es tu caballo de carga del backend.

### CLAUDE CODE (en Cursor)
**Fortaleza:** razonamiento sobre arquitectura, calidad de código, frontend, trabajo cuidadoso sobre lógica delicada, adhesión estricta a especificaciones.
**Le asignamos:** **frontend (Next.js), lógica de los agentes de diagnóstico, el AUDITOR (motor de trazabilidad), y los esquemas de datos** donde el rigor importa más que la velocidad.

### La regla de oro de la división
**Backend + infra + Render = Codex. Frontend + lógica de agentes + esquemas + auditoría = Claude Code.** Esta línea garantiza que nunca tocan los mismos archivos el mismo día.

---

## 2. EL PLAN DÍA POR DÍA

### DÍA 1 (15 jun) — BASELINE + CONSOLIDAR SECTOR PACK

**Objetivo del día:** saber qué existe de verdad y consolidar el Sector Pack de residuos como artefacto formal.

**CODEX (backend/infra):**
- Tarea C1.1: Status baseline del backend. Verificar qué endpoints existen, estado de la DB Neon, qué corre en Render. Salida: `status-backend.md`.
- Tarea C1.2: Verificar el estado de los 3 agentes de Fase 1 en backend (generadores, composición, valorización). Cuáles tienen endpoint, cuáles no. Salida: `status-agentes-fase1.md`.
- Rama: `fase1/status-backend`. Merge a main al final del día.

**CLAUDE CODE (frontend/lógica/esquemas):**
- Tarea CC1.1: Status baseline del frontend. Qué rutas existen, qué vistas, estado del simulador y admin. Salida: `status-frontend.md`.
- Tarea CC1.2: Consolidar el Sector Pack de residuos como archivo formal `sector_pack_residuos_mx_v1.yaml` siguiendo el schema de la sección 3 del Reencuadre. Salida: el YAML + `sector-pack-gaps.md` (qué blocks/agentes faltan).
- Rama: `fase1/sector-pack-consolidacion`. Merge a main al final del día.

**Gate del Día 1:** Claude Master revisa los 4 archivos de status + el Sector Pack YAML. Confirma si el plan de Día 2-3 procede o se ajusta. **Si el baseline revela trabajo 3x mayor, replanificamos aquí, no después.**

---

### DÍA 2 (16 jun) — CERRAR LOS 3 AGENTES DE DIAGNÓSTICO

**Objetivo del día:** los tres agentes de Fase 1 producen sus `must_have_blocks` validados.

**CODEX (backend):**
- Tarea C2.1: Endpoint y lógica de `composicion_agent` — captura composición con campo `fuente` obligatorio. Si no hay fuente verificable, bloquea (no rellena con default). Esto es Zero Invention a nivel código.
- Tarea C2.2: Endpoint de `valorizacion_agent` — modelo de mezcla de precios determinista. (Monte Carlo se difiere si no da tiempo; el determinista es el MVP.)
- Ramas: `fase1/composicion-backend`, `fase1/valorizacion-backend`. Merge el mismo día.

**CLAUDE CODE (lógica/auditoría):**
- Tarea CC2.1: Implementar el `auditor_agent` mínimo — la función que, dado un dato, verifica que tenga `fuente` trazable y la registra. Es el corazón del motor de digestión de evidencia, en su versión mínima. Sin esto, Zero Invention es solo una promesa.
- Tarea CC2.2: Vista frontend del diagnóstico — que el Director vea los 3 blocks (padrón, composición, valorización) con su estado de validación y la fuente de cada dato visible.
- Ramas: `fase1/auditor-minimo`, `fase1/vista-diagnostico`. Merge el mismo día.

**Gate del Día 2:** Los 3 blocks se pueden producir y cada dato muestra su fuente. El auditor bloquea datos sin fuente. Claude Master verifica con un caso real (un municipio de prueba).

---

### DÍA 3 (17 jun) — GATE DE FASE + ANDAMIAJE DE FASE 2

**Objetivo del día:** cerrar Fase 1 con su gate de aprobación, y dejar la estructura de Fase 2 lista para construir la próxima semana.

**CODEX (backend):**
- Tarea C3.1: Implementar el **gate de aprobación de Fase 1** — endpoint que marca el diagnóstico como "aprobado por Director" y desbloquea Fase 2. Es el mecanismo Phase ON/OFF de Supermind L5, en mínimo.
- Tarea C3.2: Andamiaje backend de Fase 2 — stubs de endpoints para `plan_manejo_agent` y `banobras_agent` (no lógica completa, solo la estructura para construir la semana próxima).
- Ramas: `fase1/gate-aprobacion`, `fase2/andamiaje-backend`. Merge el mismo día.

**CLAUDE CODE (frontend/lógica):**
- Tarea CC3.1: Vista del gate — el Director ve el diagnóstico completo y puede aprobar/pedir revisión. Al aprobar, la UI refleja el desbloqueo de Fase 2.
- Tarea CC3.2: Documentar la especificación de Fase 2 (`spec-fase2-planeacion.md`) para que la construcción de la próxima semana arranque sin ambigüedad: qué hace `plan_manejo_agent`, qué datos consume, qué documento produce.
- Ramas: `fase1/vista-gate`, `fase2/spec-planeacion`. Merge el mismo día.

**Gate del Día 3 (CIERRE):** Un municipio de prueba puede recorrer el diagnóstico completo, cada dato es trazable, el Director aprueba, y Fase 2 queda desbloqueada con su andamiaje listo. **Eso es "diagnóstico terminado".**

---

## 3. PROTOCOLO ANTI-MENTIRA (lo pediste explícitamente)

Para que ningún agente reporte "terminado" sin resultado real:

1. **"Terminado" exige evidencia ejecutable.** No "implementé el endpoint". Es "el endpoint responde, aquí está el output de la llamada real con este input". Captura de la respuesta, no descripción de ella.
2. **Cada tarea cierra con una verificación reproducible.** El agente entrega el comando exacto que Claude Master puede correr para confirmar. Si Master lo corre y no funciona, la tarea NO está terminada.
3. **"No terminé" es una respuesta válida y esperada.** El agente debe reportar "llegué hasta aquí, me bloqueé en X" sin maquillaje. Reportar bloqueo honesto > reportar falso éxito. Esto se dice explícito en cada handoff.
4. **Prohibido reportar build verde sin correr el build.** Si dice "pasa el lint", tuvo que correr el lint y pegar el resultado.
5. **El gate de cada día lo valida Claude Master con un caso real**, no con la palabra del agente.

---

## 4. PROTOCOLO DE MANEJO DE ERRORES

Cómo arreglan errores sin romper más:

1. **Reproducir antes de arreglar.** El agente debe poder disparar el error a voluntad antes de tocar nada. Si no lo reproduce, no entiende la causa.
2. **Un arreglo por vez.** Nada de cambiar cinco cosas a la vez esperando que una funcione. Eso esconde la causa real.
3. **Si el arreglo no funciona al segundo intento, PARAR y reportar.** No entrar en espiral de cambios. Reportar a Claude Master con: qué error, qué intenté, qué pasó.
4. **Nunca arreglar en main directo.** El arreglo va en su rama, se verifica, se mergea.
5. **Logs de Render son la fuente de verdad para errores de deploy.** Codex tiene acceso; debe leerlos antes de especular.

---

## 5. RESUMEN DE ASIGNACIÓN (tabla de un vistazo)

| Día | Codex (backend/Render) | Claude Code (frontend/lógica/auditoría) | Gate Master |
|---|---|---|---|
| **1** | Status backend + estado agentes F1 | Status frontend + consolidar Sector Pack YAML | ¿Baseline limpio? ¿Procede? |
| **2** | composicion_agent + valorizacion_agent (backend) | auditor_minimo + vista diagnóstico | ¿3 blocks con fuente? ¿Auditor bloquea? |
| **3** | gate aprobación F1 + andamiaje F2 backend | vista gate + spec Fase 2 | ¿Municipio recorre diagnóstico completo? |

---

## 6. PRÓXIMOS DOCUMENTOS (handoffs ejecutables)

Una vez apruebes esta hoja de ruta, genero:
- `06_HANDOFF_CODEX_DIA1.md` — instrucciones exactas para Codex, día 1
- `07_HANDOFF_CLAUDE_CODE_DIA1.md` — instrucciones exactas para Claude Code, día 1

Y conforme avancen los días, los handoffs de día 2 y 3, ajustados a lo que el baseline revele.

---

*05 · Hoja de Ruta 3 Días · Alquimia SLP · 15 junio 2026*
