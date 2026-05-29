# Field Study Status Method

**Uso:** metodo para declarar estudios de campo requeridos, faltantes o validados sin inventar evidencia local.

## 1. Principio

ALQUIMIA no ejecuta automaticamente estudios de campo. Los estudios los realiza el municipio, un tercero, laboratorio o consultor externo. ALQUIMIA exige, valida, integra y muestra brechas.

Si no hay estudio local, se muestra brecha critica o recomendada. No se convierte benchmark en verdad municipal. Una inferencia tampoco es dato validado y un dato estimado no es verdad municipal.

## 2. Estudios formales

| Estudio | Gate | Criticidad | Responsable esperado | Evidencia requerida |
|---|---|---|---|---|
| Cuarteo y caracterizacion fisica NMX-AA-015-1985 | G1 | Critico | Laboratorio/consultor y municipio | Cedula de campo, informe, fotos, fecha, muestra |
| Rutas y tiempos de recoleccion | G2 | Critico | Operaciones/concesionario/consultor | GPS, bitacoras, recorridos, horarios |
| Censo de pepenadores e informales | G1 | Critico | Municipio/consultor social | Censo, metodologia, consentimiento, fecha |
| Auditoria de infraestructura existente | G2 | Critico | Municipio/consultor tecnico | Inventario, capacidad, fotos, estado fisico |
| Estudio juridico-administrativo | G1 | Critico | Juridico/sindicatura/abogado externo | Reglamento, matriz de brechas, firma o responsable |
| Estudio de aceptacion a pago PSP | G2 si hay tarifa | Condicional critico | Consultor social/financiero | Encuesta, muestra, metodologia |

## 3. Estados permitidos

| Estado | Significado | Uso en claim |
|---|---|---|
| `validated_local_study` | Estudio local cargado y validado. | Puede sostener claim local. |
| `uploaded_pending_review` | Evidencia cargada sin revision. | Preliminar. |
| `field_study_required` | Estudio requerido por gate. | Brecha. |
| `critical_gap` | Falta estudio para claim critico. | Bloquea claim. |
| `recommended_gap` | Falta estudio recomendado. | Advierte. |
| `not_applicable` | No aplica por configuracion del tenant. | Debe justificarse. |

## 4. Impacto por modulo

| Modulo | Si falta estudio local |
|---|---|
| M01 | Generacion y composicion quedan como inferencia/benchmark; no verdad municipal. |
| M03B | Analisis legal queda preliminar; no dictamen juridico. |
| M06 | Infraestructura propuesta queda preliminar; CAPEX no validado. |
| M08 | Rutas y logistica quedan en supuesto operativo. |
| M09 | CAPEX/OPEX queda estimado con advertencia. |
| M11 | Gobernanza/financiamiento queda condicionado a evidencia. |
| M13 | Escenarios financieros dependen de supuestos; no garantia. |

## 5. Brecha critica

Texto recomendado:

> Brecha critica: falta estudio local requerido. El benchmark o la inferencia disponible no sustituyen evidencia municipal validada.

## 6. Validacion humana

Cada estudio debe tener:

- responsable de ejecucion;
- responsable municipal receptor;
- fecha;
- metodologia;
- unidad territorial;
- evidencia adjunta;
- limitaciones;
- decision de aceptacion, rechazo o revision.

## 7. KPIs faltantes

Todo KPI faltante debe mostrarse como faltante, no rellenarse con narrativa. El registro minimo debe indicar:

- KPI requerido;
- estandar aplicable;
- fuente requerida;
- dato faltante;
- estudio local o evidencia necesaria;
- gate o modulo afectado;
- responsable humano de validacion;
- advertencia visible.

Texto recomendado:

> KPI faltante: no existe fuente local suficiente para calcular este indicador. No se sustituye con benchmark ni inferencia.

## 8. Bloqueo

Un claim se bloquea si:

- usa estudio faltante como si existiera;
- presenta benchmark como estudio local;
- presenta inferencia como dato validado;
- presenta estimacion como verdad municipal;
- omite fecha/metodo;
- mezcla municipio y ZM;
- intenta cerrar gate sin evidencia;
- usa estudio juridico sin firma como dictamen.
