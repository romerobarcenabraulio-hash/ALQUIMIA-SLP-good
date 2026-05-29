# FIRST EXECUTION ORDER

**Uso:** orden recomendado para la primera ejecucion real despues del cierre de planeacion. No es fase nueva; es secuencia operativa.

## Orden

1. **Auditoria documental de arranque**
   - Leer `EXECUTION_HANDOFF_INDEX.md`.
   - Confirmar que el bloque elegido existe en `MASTER_IMPLEMENTATION_PLAN.md`.
   - Confirmar que no esta en `DO_NOT_BUILD_YET.md`.

2. **Backend base**
   - Ejecutar `BACKEND_AGENT_HANDOFF.md`.
   - Prioridad: `tenant_state`, gates humanos, roles, trazabilidad, aislamiento tenant.
   - No avanzar sin pruebas negativas de acceso/gates.

3. **Frontend journeys**
   - Ejecutar `FRONTEND_AGENT_HANDOFF.md`.
   - Prioridad: Plataforma 0 interna y rutas `/v`, `/p`, `/e`.
   - No mostrar capacidades fuera de stage.

4. **QA/AUDITOR**
   - Ejecutar `QA_AUDITOR_AGENT_HANDOFF.md`.
   - Confirmar acceso, datos, registry, exports, frontend visual y pruebas disponibles.

5. **SLP y datos**
   - Solo si backend/frontend gates pasan.
   - Verificar backup, pre/post, stage validation, execution oculto.

6. **Field studies y KPIs**
   - No inventar cifras.
   - Marcar brechas criticas.

7. **Automation interna**
   - Solo con provenance, source metadata y triggers explicitos.
   - Sin decisiones politicas automaticas.

8. **Learning/feedback interno**
   - Solo con opt-in, storage, N, bias gate y founder gate.
   - No publicacion automatica.

9. **Founder/legal/pilot**
   - Actualizar materiales contra producto real.
   - No vender ni pilotear capabilities no cerradas.

10. **Release**
   - Ejecutar `RELEASE_AGENT_HANDOFF.md`.
   - Decidir release listo, staging only o bloqueado.

## Regla de bloqueo

Si aparece P0, detener ejecucion y registrar bloqueo. No crear "fase futura" para esconderlo.
