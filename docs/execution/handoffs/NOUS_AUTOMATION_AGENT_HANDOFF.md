# NOUS AUTOMATION AGENT HANDOFF

**Agente recomendado:** NOUS observer + HERMES inference + KRONOS jobs + KOSMOS schema + AUDITOR privacy/bias.

## Mision

Implementar automatizacion trazable y NOUS observacional/supervisado sin decisiones politicas automaticas, sin ML opaco y sin publicacion prematura.

## Leer primero

- `AJUSTES PARA FINIQUITAR/AUTOMATION_AND_PERSONALIZATION_LAYER.md`
- `AJUSTES PARA FINIQUITAR/LEARNING_AND_FEEDBACK_LAYER.md`
- `docs/execution/DO_NOT_BUILD_YET.md`
- `docs/execution/BINARY_ACCEPTANCE_GATES.md`

## Reglas NOUS

- NOUS observa antes de sugerir.
- Aprendizaje por validacion, no caja negra.
- No publicar sin N suficiente, bias check, founder gate y trazabilidad.
- No recalibrar automaticamente.
- No usar variables protegidas.
- No exponer tenants comparables identificables.

## Reglas automation

- Agentes explicitamente disparados.
- Cada dato inferido con fuente, fecha, metodo, confianza y estado.
- Si fuente falla, guardar parcial/pendiente con razon.
- Recalculos registrados con causa.
- Discrepancias visibles sin presentarlas como error definitivo.

## Opt-in

Sin opt-in, datos tenant pueden servir al propio tenant pero no analytics agregada ni patron publicable.

## Logs/evidencia

Registrar quien, cuando, modulo, fuente, confianza, evento, decision humana, inclusion/exclusion aggregate y razon.

## Pruebas esperadas

- Opt-in true/false.
- N insuficiente bloquea patron.
- Bias fail bloquea patron.
- Fuente fallida conserva parcial.
- No publication/no auto-apply.

## Criterio binario de cierre

Cierra solo si automatizacion es trazable, parcial-tolerante, segura por tenant y NOUS queda supervisado, no autonomo.
