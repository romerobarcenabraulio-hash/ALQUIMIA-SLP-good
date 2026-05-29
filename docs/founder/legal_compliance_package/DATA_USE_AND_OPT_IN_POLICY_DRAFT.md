# Data Use and Opt In Policy Draft

**Uso:** borrador operativo para abogado. No es politica final de privacidad.

## Tipos de datos

| Tipo | Uso permitido |
|---|---|
| Datos de tenant | Uso para operar y personalizar el propio tenant. |
| Datos privados del tenant | No se cruzan con otros tenants sin consentimiento y anonimización. |
| Datos publicos | Pueden alimentar Public Knowledge Base con fuente y fecha. |
| Datos agregados anonimos | Solo con opt-in y reglas de N minimo. |
| Observaciones capa de aprendizaje supervisado | Uso interno observacional; publicacion sujeta a gates. |

## Opt-in explicito

Los datos de tenant no alimentan analytics agregada ni patrones compartibles sin consentimiento explicito. El opt-in debe registrar fecha, responsable, alcance, version de politica y posibilidad de revocacion.

## Exclusion sin opt-in

Sin opt-in, los datos pueden usarse para el propio tenant, pero no para aggregate, benchmarking anonimo compartible ni aprendizaje publicado.

## Trazabilidad de consentimiento

Debe conservarse:

- quien autoriza;
- rol;
- fecha;
- alcance;
- datos incluidos;
- datos excluidos;
- version de politica;
- revocacion si ocurre.

## Revocacion

La revocacion debe detener uso futuro en analytics agregada. El abogado debe definir tratamiento de observaciones historicas ya anonimizadas.

## Publicacion de patrones

Un patron capa de aprendizaje supervisado solo puede publicarse si cumple:

- opt-in valido;
- N suficiente;
- bias check aprobado;
- founder gate aprobado;
- trazabilidad;
- no identificacion de tenants;
- revision humana.

## Minimos de N

Los umbrales minimos se rigen por `capa de aprendizaje supervisado_GOVERNANCE_METHOD.md` y documentos capa de aprendizaje supervisado. Ningun patron con N insuficiente debe publicarse al cliente.

## Bias check

Patrones con sesgo, variables protegidas, reidentificacion indirecta o contradiccion con estandares deben bloquearse o retirarse.

## Founder gate

El founder gate no sustituye revision legal cuando la publicacion tenga efecto externo, contractual, reputacional o regulatorio.

## Responsabilidad humana

Toda aprobacion de uso agregado, publicacion o retiro debe tener responsable humano, fecha, evidencia y audit log.
