# 07 · HANDOFF CLAUDE CODE — DÍA 1 (FRONTEND BASELINE + SECTOR PACK)
**Para:** Claude Code (en Cursor)
**De:** Claude Master
**Fecha:** 15 junio 2026
**Tu dominio:** Frontend (Next.js), Lógica de agentes, Esquemas de datos, Auditoría (Zero Invention)
**Repo:** alquimia-slp (mismo repo que Codex — NO toques backend/, ese es de Codex hoy)

---

## LEE ESTO ENTERO ANTES DE TOCAR CÓDIGO

### Tu lugar en el sistema
Alquimia es el Sector Pack de residuos municipales corriendo sobre la arquitectura Supermind (ver `04_REENCUADRE_ALQUIMIA_ES_SECTOR_PACK.md`). Tú eres responsable del **frontend, la lógica fina de los agentes, los esquemas y la auditoría de trazabilidad**. Codex lleva backend e infra. **Hoy no se cruzan: tú en `frontend/` y archivos de esquema/spec, él en `backend/`.**

### Las 7 reglas Git (NO NEGOCIABLES)
1. Rama por tarea: `fase1/sector-pack-consolidacion`. Vive máximo hoy.
2. Antes de empezar: `git pull origin main`.
3. Commits pequeños y descriptivos.
4. Antes de mergear: build pasa, lint pasa, tests pasan. Pega el resultado.
5. Merge a main vía PR con descripción. Borra la rama tras mergear.
6. NO toques nada bajo `backend/` hoy. Es de Codex.
7. ¿Conflicto de merge? PARA y reporta. No fuerces.

### Protocolo anti-mentira
- "Terminado" = evidencia ejecutable. Para el frontend: captura o descripción del render real, no "implementé la vista".
- "No terminé / me bloqueé en X" es VÁLIDO. Repórtalo sin maquillaje.
- "El build pasa" exige haber corrido el build y pegado el resultado.

### Protocolo de errores
- Reproduce antes de arreglar. Un arreglo por vez. ¿2º intento falla? PARA y reporta.

---

## TUS TAREAS HOY

### TAREA CC1.1 — Status del frontend
**Objetivo:** saber qué existe realmente en el frontend.

Verifica y reporta:
- ¿Qué rutas/páginas existen en Next.js? Lista.
- Estado del simulador: ¿existe? ¿funciona? ¿qué hace?
- Estado del admin / master table: ¿existe? ¿cuántas columnas, qué muestra?
- ¿Cómo se conecta al backend? ¿Clerk auth funciona (magic link)?
- ¿Hay vistas por persona/rol o todo es genérico?

**Salida:** `status-frontend.md` en raíz del repo, con tabla de rutas + estado de simulador/admin + sección GAPS.

---

### TAREA CC1.2 — Consolidar el Sector Pack como artefacto formal
**Objetivo:** convertir el conocimiento disperso de residuos en un Sector Pack formal, siguiendo el schema de Supermind.

Toma la especificación inicial de la sección 3 de `04_REENCUADRE_ALQUIMIA_ES_SECTOR_PACK.md` y conviértela en un archivo formal `sector_pack_residuos_mx_v1.yaml`. Debe incluir:
- `personas` (Cabildo, Director Servicios Públicos, Director Ecología, Enlace Operativo)
- `must_have_blocks` (reglamento [blocker], padrón, composición, compradores ancla)
- `default_agents` con su fase y estado actual en Alquimia
- `entry_mode: prefab_structure_capture_case` (la decisión clave: en política pública se salta la entrevista de estructura, queda captura de caso)

Luego compara contra lo que existe y produce `sector-pack-gaps.md`: qué blocks/agentes faltan, cuáles están parciales.

**Verificación para Master:** el YAML es válido (parsea), y `sector-pack-gaps.md` lista honestamente qué falta.

**REGLA CRÍTICA — Zero Invention aplica también aquí:** el bloque `composicion_residuos` debe marcar que el dato viene del MUNICIPIO ESPECÍFICO, nunca del modelo por defecto. Si el schema permite rellenar composición con valores default, eso es invención de datos disfrazada. Márcalo explícitamente como `source_required: true, no_default_allowed: true`.

---

## CÓMO REPORTAS AL CERRAR EL DÍA

1. PR a main con `status-frontend.md`, `sector_pack_residuos_mx_v1.yaml`, `sector-pack-gaps.md`.
2. Mensaje al founder: "Claude Code cerró Día 1. Frontend: [1 línea]. Sector Pack: consolidado, faltan [N] blocks/agentes. Bloqueos: [si hay]."
3. Si te bloqueaste: dónde, qué intentaste, qué necesitas.

---

## LO QUE NO HACES HOY
- No construyes features nuevas. Hoy VERIFICAS y CONSOLIDAS, no construyes lógica nueva.
- No tocas backend.
- No empiezas Día 2 antes de tiempo.

---

*07 · Handoff Claude Code Día 1 · Alquimia SLP · 15 junio 2026*
