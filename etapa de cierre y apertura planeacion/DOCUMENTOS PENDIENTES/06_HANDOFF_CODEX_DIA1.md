# 06 · HANDOFF CODEX — DÍA 1 (BACKEND BASELINE)
**Para:** Codex (GPT-5.2-Codex)
**De:** Claude Master
**Fecha:** 15 junio 2026
**Tu dominio:** Backend (FastAPI), Base de datos (Neon Postgres), Despliegue (Render), Integración de datos
**Repo:** alquimia-slp (mismo repo que Claude Code — NO toques frontend/, ese es de Claude Code hoy)

---

## LEE ESTO ENTERO ANTES DE TOCAR CÓDIGO

### Tu lugar en el sistema
Alquimia es el Sector Pack de residuos municipales corriendo sobre la arquitectura Supermind. Tú eres responsable del **backend y la infraestructura**. Claude Code es responsable del frontend y la lógica de agentes. **Hoy no se cruzan: tú en `backend/`, él en `frontend/`.**

### Las 7 reglas Git (NO NEGOCIABLES)
1. Rama por tarea: `fase1/status-backend`. Vive máximo hoy.
2. Antes de empezar: `git pull origin main`.
3. Commits pequeños y descriptivos. Nada de "wip".
4. Antes de mergear: build pasa, lint pasa, tests pasan. Pega el resultado.
5. Merge a main vía PR con descripción. Borra la rama tras mergear.
6. NO toques nada bajo `frontend/` hoy. Es de Claude Code.
7. ¿Conflicto de merge? PARA y reporta. No fuerces.

### Protocolo anti-mentira (te aplica directo)
- "Terminado" = evidencia ejecutable, no descripción. Pega el output real de la llamada.
- "No terminé / me bloqueé en X" es respuesta VÁLIDA y esperada. Repórtala sin maquillaje.
- Prohibido decir "el build pasa" sin haber corrido el build y pegado el resultado.
- Cada tarea cierra con el comando exacto para que Claude Master verifique.

### Protocolo de errores
- Reproduce el error antes de arreglarlo.
- Un arreglo por vez.
- ¿No funciona al 2º intento? PARA y reporta.
- Lee los logs de Render antes de especular sobre deploys.

---

## TUS TAREAS HOY

### TAREA C1.1 — Status del backend
**Objetivo:** saber qué existe realmente en el backend, no lo que documentos dicen.

Verifica y reporta:
- ¿Qué endpoints FastAPI existen hoy? Lista de rutas con su método.
- ¿Qué tablas hay en Neon Postgres? Esquema real.
- ¿Qué corre en Render ahora? Estado del servicio, último deploy, ¿está vivo?
- ¿Hay variables de entorno / connection strings configuradas y funcionando?

**Salida:** archivo `status-backend.md` en la raíz del repo, con:
- Tabla de endpoints (ruta, método, qué hace, ¿funciona?)
- Esquema de DB (tablas, columnas clave)
- Estado de Render (servicio, último deploy exitoso sí/no)
- Sección "GAPS": qué esperabas encontrar y no está

**Verificación para Master:** el archivo existe, y para 3 endpoints al azar, pegaste la respuesta real de llamarlos.

---

### TAREA C1.2 — Estado de los 3 agentes de Fase 1
**Objetivo:** saber cuánto de los agentes de diagnóstico ya existe en backend.

Los 3 agentes de Fase 1 (Diagnóstico) son:
1. `diagnostico_generadores_agent` — padrón, SCIAN, outliers. (Se cree shipped como "Phase D".)
2. `composicion_agent` — captura de composición de residuos.
3. `valorizacion_agent` — modelo de mezcla de precios, potencial de valorización.

Para cada uno verifica:
- ¿Existe endpoint/lógica en backend? Path exacto.
- ¿Qué hace realmente vs qué debería hacer?
- ¿Está completo, parcial o ausente?
- Para `diagnostico_generadores_agent`: confirma si la detección de outliers (IQR, Z-score) realmente corre. Pruébala con datos.

**Salida:** archivo `status-agentes-fase1.md` con tabla: agente | existe sí/no | path | completo/parcial/ausente | evidencia.

**Verificación para Master:** para el agente de generadores (el supuestamente shipped), pega el output real de procesarlo con un dato de prueba.

---

## CÓMO REPORTAS AL CERRAR EL DÍA

1. PR a main con `status-backend.md` y `status-agentes-fase1.md`.
2. Mensaje al founder: "Codex cerró Día 1. Backend: [1 línea]. Agentes F1: [1 línea]. Bloqueos: [si hay]."
3. Si te bloqueaste: di exactamente dónde, qué intentaste, qué necesitas. Sin maquillaje.

---

## LO QUE NO HACES HOY
- No construyes features nuevas. Hoy es VERIFICAR, no construir.
- No tocas frontend.
- No empiezas Día 2 aunque termines temprano. Si terminas, profundiza el status con más detalle.

---

*06 · Handoff Codex Día 1 · Alquimia SLP · 15 junio 2026*
