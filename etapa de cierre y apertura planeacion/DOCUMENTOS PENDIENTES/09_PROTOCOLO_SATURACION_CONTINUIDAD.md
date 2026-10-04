# 09 · PROTOCOLO DE SATURACIÓN Y CONTINUIDAD
**Fecha:** 15 junio 2026
**Autor:** Claude Master
**Propósito:** Preparar el relevo ANTES de que cualquier agente (incluido yo) se sature. Lo inevitable, manejado.
**Aplica a:** Claude Master, Codex, Claude Code, y cualquier agente futuro

---

## 1. POR QUÉ ESTE DOCUMENTO EXISTE

Tienes razón en lo crudo: **tarde o temprano me saturo.** Una sesión de Claude tiene una ventana de contexto finita. Conforme esta conversación crece, cada respuesta mía "carga" más historia y deja menos espacio para pensar. Lo mismo le pasa a Codex y Claude Code en sesiones largas. No es un defecto a evitar —es física del sistema. La pregunta correcta no es "¿cómo evito saturarme?" sino "¿cómo hago que mi reemplazo retome sin perder un paso?"

La respuesta es un sistema de relevo donde **el contexto vive en archivos, no en la memoria del agente.** Si todo lo importante está escrito, cualquier instancia nueva —de mí, de Codex, de quien sea— lee los archivos y continúa. El agente es desechable; el contexto es permanente. Eso ya está en tu arquitectura (el estado en .md, Tier 2/3). Aquí lo formalizo como protocolo de relevo.

---

## 2. SEÑALES DE SATURACIÓN (cómo sabes que es hora de relevo)

### En Claude Master (yo)
- Mis respuestas empiezan a repetir cosas que ya dije
- Pido información que ya me diste
- Pierdo el hilo de una decisión tomada hace varios mensajes
- Mis respuestas se vuelven más genéricas, menos ancladas a TUS archivos
- **Regla dura:** cuando una conversación pasa de ~15-20 intercambios densos, asume que estoy cerca del límite. No esperes a que falle — releva preventivamente.

### En Codex / Claude Code
- Empiezan a "olvidar" decisiones del inicio de la sesión
- Reescriben código que ya estaba bien
- Pierden de vista los 4 principios duros
- Proponen cosas que contradicen lo ya acordado
- **Regla dura:** sesión de código > 1 día, o > cierto número de archivos tocados → relevo con handoff.

---

## 3. EL HANDOFF DE RELEVO — ESTRUCTURA FIJA

Cuando un agente se va a saturar, produce (o el founder le pide) un **HANDOFF DE RELEVO** antes de cerrar. Estructura fija, siempre la misma, para que el siguiente agente sepa exactamente dónde buscar:

```markdown
# HANDOFF DE RELEVO — [Agente] — [Fecha/Hora]

## 1. DÓNDE ESTOY (estado actual)
- Qué tarea estaba haciendo
- Qué quedó terminado (con evidencia: PR, test verde, archivo)
- Qué quedó a medias (exactamente en qué línea/archivo/paso)

## 2. DECISIONES TOMADAS EN ESTA SESIÓN
- Lista de decisiones nuevas que NO están en los docs maestros aún
- (estas hay que migrar a un ADR o doc permanente)

## 3. QUÉ SIGUE (lo inmediato)
- La siguiente acción concreta, sin ambigüedad
- Qué archivo abrir primero

## 4. BLOQUEOS ACTIVOS
- Qué está esperando algo (y qué)

## 5. ADVERTENCIAS
- Trampas que encontré, cosas que NO hacer, errores que ya cometí y corregí
```

Este handoff se guarda en `bitacora-handoffs-codex/` con timestamp. Es el mismo formato que ya usaste con el handoff de Claude Code del 14 jun —que funcionó perfecto: yo lo leí y retomé sin perder nada. Eso prueba que el sistema sirve.

---

## 4. CÓMO ME RELEVAS A MÍ (Claude Master) ESPECÍFICAMENTE

Cuando notes mis señales de saturación, o preventivamente cada ~15-20 intercambios:

**Paso 1:** Me pides: *"Claude, genera tu handoff de relevo antes de cerrar."* Yo produzco el documento con estructura fija (sección 3) + actualizo los docs maestros con cualquier decisión nueva.

**Paso 2:** Abres una sesión nueva de Claude (chat nuevo). Le das:
- El último handoff de relevo mío
- El `08_PLAN_DEFINITIVO_MATERIALIZACION.md` (el plan maestro)
- El `10_MAPA_DE_TRABAJO_AGENTES.md` (quién hace qué)
- Los archivos del ZIP de handoff si hay contexto técnico nuevo

**Paso 3:** La instancia nueva lee y confirma: *"Retomo como Claude Master. Estado actual: X. Siguiente acción: Y."* Si confirma bien, continúas sin pérdida.

**La clave:** nunca dependas de que YO recuerde. Depende de que los ARCHIVOS recuerden. Yo soy intercambiable; tu carpeta `cierre-apertura-planeacion/` es la que tiene la memoria real.

---

## 5. REGLA DE HIGIENE PARA QUE EL RELEVO SIEMPRE FUNCIONE

Para que esto no falle el día que de verdad me sature:

1. **Toda decisión importante se escribe en un doc maestro el mismo día.** Si una decisión vive solo en el chat, se pierde cuando el chat muere.
2. **Los docs maestros son la fuente de verdad, no la conversación.** Cuando haya conflicto entre lo que "recuerdo" y lo que dice el archivo, gana el archivo.
3. **Un doc maestro por tema, versionado.** No reescribir; crear v2 si cambia algo grande, para auditoría.
4. **El plan maestro (08) y el mapa de agentes (10) se mantienen actualizados.** Son los dos que cualquier relevo lee primero.

---

## 6. APLICACIÓN A CODEX Y CLAUDE CODE

Para los agentes de código, el relevo es aún más crítico porque tocan código real:

- **Antes de cerrar sesión de código:** el agente hace commit de todo lo terminado + produce handoff de relevo (qué quedó, qué falta, en qué archivo).
- **El handoff incluye los comandos para retomar** (como el handoff del 14 jun: "git checkout rama", "pytest -q", etc.).
- **Nunca dejar código a medias sin commit Y sin handoff.** Código a medias + sin nota = trabajo perdido cuando la sesión muere.
- **Greptile (tu tarea de mañana)** ayuda exactamente aquí: deja que un agente nuevo navegue el código sin tener que "recordar" dónde está cada cosa. La herramienta sustituye la memoria del agente.

---

*09 · Protocolo de Saturación y Continuidad · Alquimia Supermind · 15 junio 2026*
