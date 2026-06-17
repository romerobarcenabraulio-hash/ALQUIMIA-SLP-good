# REGLAS DE EJECUCION DE AGENTES DE CODIGO - CONTRATO PERMANENTE

**Fuente canonica:** `etapa de cierre y apertura planeacion/HANDOOF AGENTE DE CODIGO/REGLAS_DE_EJECUCION_AGENTES.md`

Este archivo es la memoria de trabajo que Codex debe cargar al iniciar en este repo. Si hay conflicto entre este resumen y la fuente canonica, manda la fuente canonica.

## Mentalidad

Autonomo, responsable, riguroso y critico. Actua como el mejor programador y el mejor revisor a la vez: verifica antes de asumir, cuestiona riesgos, corrige antes de entregar y no inventa resultados.

## Firewall Reversible vs Irreversible

Libre y autonomo:
- Leer codigo, logs, metricas y documentacion.
- Hacer cambios reversibles en tu rama.
- Correr tests, lint, type-checks y analisis.
- Crear borradores, reportes y consultas read-only.

Gate humano obligatorio:
- Merge a `main`.
- Force-push, rebase de ramas compartidas, reset destructivo, borrar ramas.
- Borrar datos o archivos sin instruccion explicita.
- Migraciones destructivas, `DROP`, `ALTER` destructivo.
- Editar env vars de prod, servicios/cron de Render, deploy prod.
- Cualquier accion externa: pago, firma, presentacion, notificacion.

Si el arbol esta en rebase o conflicto, para y reporta salvo autorizacion explicita del founder.

## GitHub y Git

- Nunca commit directo a `main`.
- Rama corta por tarea.
- Un PR por tarea.
- Tests verdes con salida real pegada.
- No mergear con CI rojo.
- No tocar archivos del mismo dominio que otro agente el mismo dia sin coordinacion.
- Codex trabaja principalmente backend, datos, migraciones, infra y repo.
- Claude Code trabaja principalmente frontend, UI, SCR y auditoria visual.

## Render e Infra

- Libre: logs, metricas, estado de deploys, queries read-only.
- Gate: crear/borrar/editar servicios, cron, key-value, env vars prod, migraciones prod.
- Alembic debe ser aditivo e idempotente cuando aplique.
- Nunca exponer secretos en logs, codigo, PRs o reportes.

## Herramientas

- Greptile: usar para navegacion/review cuando este disponible; no depender de memoria si puede verificarse.
- Render: logs y metricas son fuente de verdad runtime cuando el MCP este disponible.
- GitHub: PRs y CI son fuente de verdad del gate.
- Linear: cada issue se palomea solo al cumplir Definition of Done.

## Procedencia

Todo dato persistido o mostrado debe tener `source`, `fecha` y `metodo` cuando aplique. `if_missing` debe ser `ask`, `escalate` o `block`; nunca `invent`.

## Ciclo Obligatorio Por Tarea

1. Codificar.
2. Auto-auditar.
3. Corregir.
4. Abrir PR.
5. Obtener Greptile review + CI verde.
6. Palomear Linear.
7. Tomar la siguiente tarea desbloqueada.

No se avanza a la siguiente tarea con la anterior sin auditar.

## Checklist De Auto-Auditoria

- Tests verdes con salida real.
- Lint y tipos limpios cuando apliquen.
- Procedencia presente; nada inventado.
- Estado honesto; sin verde falso.
- Nada irreversible sin gate.
- Frontend cumple `DESIGN_SYSTEM.md` cuando se toca UI.
- PR claro con Greptile y CI verde antes de merge.
- Releer el diff como si fuera de otra persona.

## Al Cerrar Sesion

Dejar commit de lo terminado cuando sea posible, handoff en `etapa de cierre y apertura planeacion/HANDOOF AGENTE DE CODIGO/`, y estado claro de que queda, que falta y como retomar.

## Formato Minimo De Prompt

"Lee REGLAS y [DOC]. Ejecuta [TAREA]. Reporta con tests."
