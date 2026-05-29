# Promise Control Register

**Uso:** registro interno para controlar promesas hechas o insinuadas en conversaciones institucionales.

## Campos obligatorios

| Campo | Descripcion |
|---|---|
| Fecha | Dia de la reunion o comunicacion. |
| Interlocutor | Persona/institucion. |
| Promesa o claim mencionado | Texto literal o resumen fiel. |
| Quien lo dijo | Founder, cliente, asesor, tercero. |
| Evidencia disponible | Fuente, fecha, metodo, confianza, estudio o documento. |
| Evidencia faltante | Lo necesario para sostener el claim. |
| Advertencia requerida | Texto que debe acompanar el claim. |
| Estado | Permitido, prohibido o condicionado. |
| Responsable humano | Quien valida, corrige o retira. |
| Accion correctiva | Email, aclaracion, bloqueo, estudio, revision juridica. |
| Riesgo si se mantiene | Reputacional, juridico, tecnico, politico, comercial. |

## Estados

| Estado | Uso |
|---|---|
| Permitido | Tiene evidencia minima y advertencia adecuada. |
| Condicionado | Puede usarse solo como preliminar, benchmark, inferencia o estimacion. |
| Prohibido | No tiene evidencia o rompe limite metodologico. |

## Promesas prohibidas ejemplo

| Promesa | Estado | Accion correctiva |
|---|---|---|
| "ALQUIMIA certifica el ahorro." | Prohibido | Aclarar que solo modela escenarios con evidencia. |
| "capa de aprendizaje supervisado valido la recomendacion." | Prohibido | Aclarar que capa de aprendizaje supervisado observa/sugiere; humano decide. |
| "Este benchmark prueba el comportamiento del municipio." | Prohibido | Reetiquetar como referencia comparativa. |
| "La estimacion equivale a dato oficial." | Prohibido | Degradar a estimacion con advertencia. |
| "El estudio local no es necesario para afirmar impacto municipal." | Prohibido | Marcar brecha critica o requerir estudio. |

## Regla de control

Si una promesa no puede rastrearse a evidencia, metodologia o advertencia, debe eliminarse o registrarse como condicionada/prohibida antes del siguiente contacto.
