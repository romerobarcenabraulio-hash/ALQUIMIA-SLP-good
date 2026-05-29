# Fase 17R · Reconciliación con LEARNING_AND_FEEDBACK_LAYER

**Estado:** cerrado como reconciliación de roadmap, no como implementación de NOUS completo  
**Fecha:** 2026-05-28  
**Decisión recomendada:** insertar NOUS como storage observacional temprano y diferir detectores/publicación de patrones hasta tener datos suficientes, opt-in, bias audit y gate founder.

## 1 · Fuentes revisadas

El sexto documento incorporado fue:

- `AJUSTES PARA FINIQUITAR/LEARNING_AND_FEEDBACK_LAYER.md`

También se revisaron las copias actuales de:

- `AJUSTES PARA FINIQUITAR/ADR-0010_stage_based_platform_separation.md`
- `AJUSTES PARA FINIQUITAR/PLATAFORMA_0_BACKOFFICE_SPEC.md`
- `AJUSTES PARA FINIQUITAR/MODULE_MATURITY_AND_PERSONALIZATION.md`
- `AJUSTES PARA FINIQUITAR/ROADMAP_MIGRACION_3_PLATAFORMAS.md`
- `AJUSTES PARA FINIQUITAR/AUTOMATION_AND_PERSONALIZATION_LAYER.md`

Nota AUDITOR: el prompt citaba `AJUSTES PARA FINIQUITAR/files/*`, pero esos archivos ya no existen en el working tree. Las fuentes activas están en la raíz de `AJUSTES PARA FINIQUITAR/` y espejadas en `docs/architecture/`.

## 2 · Impacto del sexto documento

`LEARNING_AND_FEEDBACK_LAYER` cambia el mapa de Fases 13-17: el aprendizaje no puede venderse ni publicarse como capacidad madura. NOUS debe observar antes de sugerir, y cualquier patrón requiere volumen, consentimiento, bias audit y gate humano.

La lectura correcta es:

- Fases 11-13 pueden generar inferencias, discrepancias, recalculos y recomendaciones por tenant.
- Fase 14 puede producir analítica agregada interna y anónima con opt-in.
- Fase 14 no debe publicar patrones NOUS a clientes.
- Fase 17 no debe decir que ALQUIMIA ya aprende robustamente.
- NOUS entra ahora solo como metodología, storage observacional y trazabilidad.

## 3 · Auditoría de fases ejecutadas

| Fase | Estado contra NOUS | Ajuste requerido |
| --- | --- | --- |
| 11 · Automatización consultiva | Compatible si se mantiene como inferencia preliminar trazable. | No llamar aprendizaje a la precarga. |
| 12 · Documentos | Compatible: humano revisa y documentos se bloquean sin evidencia. | Mantener bloqueos y no usar patrones NOUS en documentos. |
| 13 · Runtime automation | Compatible como recomendaciones por tenant. | No presentar recomendaciones como outcomes aprendidos colectivamente. |
| 14 · Data moat | Parcialmente desalineada: N=5 y `shareable_after_founder_approval` sonaban a patrón publicable. | Corregido: N=5 queda como observación interna; publicar queda bloqueado sin NOUS/bias/founder gate. |
| 15 · Primer login | Compatible si se mantiene como valor preliminar. | No decir que el primer login usa aprendizaje robusto. |
| 17 · Paquete founder | Parcialmente desalineado por lenguaje de “patrones” demasiado fuerte. | Corregido: hablar de observación agregada interna, NOUS diferido y prohibir claim de aprendizaje maduro. |

## 4 · Contradicciones detectadas

1. **Data moat con N=5 como insight compartible.**  
   Riesgo: parecer patrón publicable sin cumplir umbrales NOUS.  
   Corrección aplicada: `shareable_after_founder_approval = false`, `nous_status = observational_only`, `nous_publication_eligible = false`.

2. **Ausencia de bias gate en publicación.**  
   Riesgo: publicar correlaciones sin revisar variables protegidas o sesgo por municipio pequeño.  
   Corrección aplicada: endpoint de compartir ahora bloquea con `nous_founder_bias_gate_required` si el patrón no trae elegibilidad NOUS, bias passed y founder gate approved.

3. **Lenguaje comercial de patrones agregados.**  
   Riesgo: vender NOUS como maduro antes de tener datos.  
   Corrección aplicada: paquete founder prohíbe decir “NOUS ya aprende robustamente” y “nuestro modelo predice”.

4. **Storage observacional no separado en roadmap.**  
   Riesgo: construir detectores antes de tener registros básicos.  
   Corrección de plan: se inserta Fase 18 recomendada, limitada a storage observacional.

## 5 · Alcance inmediato permitido

Esto sí entra ahora:

- Schemas y eventos observacionales para:
  - `inference_corrections`
  - `gate_outcomes`
  - `projection_deltas`
  - `nous_patterns` en estado no publicable
- Log de correcciones de inferencia por tenant.
- Log de outcomes de gates.
- Log de delta proyectado vs real.
- Opt-in/opt-out contractual para analytics agregada.
- Auditoría de consulta agregada y uso de observaciones.
- Documentación metodológica de umbrales, sesgo y no-oficialidad.
- Bloqueo técnico de publicación de observaciones agregadas mientras no exista NOUS completo.

## 6 · Alcance diferido

Esto no entra ahora:

- Detectores productivos de patrones.
- Publicación automática o manual de patrones a clientes sin NOUS completo.
- Recalibración automática de priors.
- A11 completo de NOUS Insights Panel.
- Sugerencias cross-tenant visibles al cliente.
- Bayesian updating aplicado a inferencias nuevas.
- Claims comerciales de aprendizaje maduro.
- Cualquier frase tipo “nuestro modelo predice”.

## 7 · Umbrales NOUS incorporados al roadmap

| Tipo | Umbral | Uso permitido |
| --- | ---: | --- |
| Corrección de inferencia | 3 correcciones similares | Patrón emergente interno, no publicable. |
| Outcome de gate | 8 outcomes | Patrón emergente interno de gate, no publicable sin review. |
| Patrón establecido | 15 observaciones | Candidato a founder gate si pasa bias audit. |
| Patrón robusto | 30 observaciones | Candidato fuerte a publicación controlada. |

Reglas adicionales:

- Sin opt-in, datos del tenant no alimentan aggregate.
- Ningún patrón se publica sin founder gate.
- AUDITOR puede retirar patrones por sesgo.
- Variables protegidas no se usan para correlaciones.
- Explicabilidad antes que sofisticación.

## 8 · Cambios aplicados

- `backend/app/automation/data_moat.py`
  - Agregó umbrales NOUS.
  - Degradó analytics N=5 a `observational_only`.
  - Bloqueó publicación de insight sin elegibilidad NOUS, bias check y founder gate.

- `backend/tests/test_phase14_data_moat.py`
  - Cambió la prueba de compartir insight: ahora debe bloquear si no existe NOUS/bias/founder gate.

- `docs/architecture/FASE14_DATA_MOAT_PRIVACIDAD.md`
  - Aclara que Fase 14 produce observación interna, no patrón NOUS publicable.

- `docs/architecture/FASE17_OPERACION_COMERCIAL_CONTROLADA_PAQUETE_FOUNDER.md`
  - Ajusta narrativa comercial para no sobreprometer NOUS.

## 9 · Riesgos si se ignora NOUS

| Riesgo | Severidad | Consecuencia |
| --- | --- | --- |
| Publicar patrones con N bajo | P1 | Ruido vendido como inteligencia. |
| Saltar opt-in | P0 | Fuga contractual/reputacional de datos privados. |
| Omitir bias audit | P1 | Patrones que amplifican desigualdad o reidentifican municipios pequeños. |
| Decir “modelo predice” | P2 | Daño reputacional y pérdida de defensibilidad política. |
| Recalibrar priors automáticamente | P1 | Cambios opacos en cifras usadas por Cabildo o documentos. |

## 10 · Siguiente fase recomendada

### Fase 18 · NOUS storage observacional y metodología

Objetivo: crear solo la base observacional de NOUS, sin detectores productivos ni publicación a clientes.

Alcance:

1. Migraciones/schemas para `inference_corrections`, `gate_outcomes`, `projection_deltas`, `nous_patterns`.
2. Eventos que registren corrección de inferencias, cierre/fallo de gates y deltas proyectado vs real.
3. Opt-in/opt-out formal por tenant para alimentar analytics agregada.
4. Policy de variables prohibidas/protegidas.
5. Bias audit log trimestral como estructura, no automatización completa.
6. Documentación `/docs/methodology/nous.md`.
7. Tests negativos: sin opt-in no agrega; N insuficiente no publica; bias no pasado bloquea; founder gate ausente bloquea.

No implementar:

- A11 completo.
- Pattern detectors.
- Recalibración automática.
- Sugerencias NOUS al cliente.
- Publicación automática de patrones.

## 11 · Estado final

**Fase 17R: cerrada como reconciliación de roadmap y ajuste mínimo de seguridad.**

NOUS queda correctamente ubicado como aprendizaje supervisado, lento y trazable. El sistema puede observar; todavía no puede afirmar que aprende robustamente ni publicar patrones a clientes.
