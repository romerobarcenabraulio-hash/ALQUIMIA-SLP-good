# Data Evidence Glossary

**Uso:** vocabulario controlado para claims, tablas, documentos y respuestas ante auditoria.

## 1. Tipos de dato

| Termino | Definicion | Puede usarse como oficial | Advertencia requerida |
|---|---|---:|---|
| Dato validado local | Dato municipal revisado por responsable humano y sustentado por fuente o estudio local. | Si | No, salvo limitaciones del estudio. |
| Documento oficial | Publicacion, acuerdo, reglamento, contrato, acta o registro emitido por autoridad competente. | Si | Citar autoridad, fecha y enlace/folio. |
| Fuente publica primaria | INEGI, CONAPO, PNT, Periódico Oficial, INAFED, municipio u otra fuente primaria. | No por si sola; depende del claim. | Citar fuente, fecha y metodo. |
| Fuente secundaria | Publicacion, nota, reporte privado, estudio academico o agregador que interpreta una fuente primaria. | No | Citar fuente original si existe y declarar limitacion. |
| Inferencia publica | Dato precargado por pipeline de inferencia publica desde fuentes publicas o calculo reproducible. | No | "Dato preliminar pendiente de validacion humana". |
| Benchmark | Referencia externa nacional, internacional o comparable anonima. | No | "Referencia comparativa; no estudio local". |
| Dato estimado | Cifra calculada con supuestos, benchmark o inferencia cuando no existe medicion local suficiente. | No | "Estimacion; no dato oficial municipal". |
| Supuesto editable | Valor inicial usado para simular o completar un calculo. | No | "Supuesto editable; no oficial". |
| Estudio local | Levantamiento, medicion, auditoria, censo o analisis ejecutado para el municipio con alcance, fecha, metodo, fuente y responsable. | Puede sostener claims locales si fue validado. | Citar alcance y limitaciones. |
| Brecha critica | Ausencia de evidencia requerida para sostener un claim institucional, cerrar un gate o presentar una cifra local. | No | "Brecha critica" o "pendiente". |
| Proyeccion | Resultado futuro calculado con supuestos. | No | "Proyeccion sujeta a validacion y medicion". |
| Gate humano | Punto de decision donde una persona autorizada acepta, rechaza, pausa o escala evidencia. | No aplica | Registrar responsable, fecha y evidencia. |
| Patron capa de aprendizaje supervisado | Observacion agregada y anonimizada bajo opt-in, N minimo, bias check, founder gate y trazabilidad. | No por si sola | "Patron observado; no dictamen ni decision automatica". |
| Sugerencia capa de aprendizaje supervisado | Recomendacion accionable derivada de un patron aprobado internamente. | No | "Sugerencia; humano decide". |
| Validacion humana | Revision documentada por responsable competente que acepta, corrige, rechaza o bloquea un dato o claim. | Solo para el alcance revisado. | Registrar responsable, fecha y criterio. |
| Claim documental | Afirmacion dentro de expediente, oficio, adenda, reporte o presentacion. | Solo si cumple matriz de evidencia. | Segun claim. |

## 2. Estados de confianza

| Estado | Uso |
|---|---|
| `verified` | Validado por humano con fuente suficiente. |
| `verified_official` | Fuente oficial primaria, no necesariamente validacion local completa. |
| `inferred_high_confidence` | Inferencia trazable con fuente fuerte y metodo claro. |
| `inferred_medium_confidence` | Inferencia plausible con fuente parcial o metodo indirecto. |
| `inferred_low_confidence` | Inferencia debil; solo orientativa. |
| `pending_human_validation` | Requiere revision humana antes de claim institucional. |
| `missing_source` | No hay fuente suficiente. |
| `missing_local_study_until_evidence` | Falta estudio local requerido. |

## 3. Fuentes

Una fuente valida debe registrar:

- nombre de fuente;
- entidad emisora;
- fecha de publicacion o consulta;
- enlace, folio o archivo;
- metodo de extraccion;
- alcance territorial;
- responsable de carga o validacion.

## 4. Metodo

El metodo debe declarar si el dato fue:

- capturado manualmente;
- extraido de fuente publica;
- calculado con formula;
- inferido por pipeline pipeline de inferencia publica;
- generado por estudio local;
- derivado de benchmark;
- observado por capa de aprendizaje supervisado.

## 5. Advertencias obligatorias

| Situacion | Texto institucional recomendado |
|---|---|
| Inferencia publica | "Dato preliminar pendiente de validacion humana." |
| Benchmark | "Referencia comparativa; no sustituye estudio local." |
| Falta estudio local | "Brecha critica: falta estudio local para afirmar esta cifra." |
| ZM usada como contexto | "Dato regional/ZM; no validado como cifra municipal." |
| Documento automatizado | "Borrador para revision humana; no documento oficial." |
| Sugerencia capa de aprendizaje supervisado | "Sugerencia agregada aprobada; el humano decide." |

## 6. Responsables humanos

| Materia | Responsable humano tipico |
|---|---|
| Dato operativo municipal | Direccion de Servicios Publicos o equivalente. |
| Marco juridico | Sindicatura, juridico municipal o abogado externo. |
| Finanzas | Tesoreria, finanzas municipales o consultor financiero. |
| Estudios de campo | Consultor/laboratorio tercero y contraparte municipal. |
| Gate | Founder/equipo ALQUIMIA y decisor humano designado. |
| Publicacion capa de aprendizaje supervisado | Founder, revision metodologica y responsable de metodologia. |
