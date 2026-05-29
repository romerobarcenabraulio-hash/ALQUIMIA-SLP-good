# Technical Challenge Protocol

**Uso:** protocolo para responder impugnaciones tecnicas de concesionarios, regidores, auditoria, direccion municipal o proveedores.

## 1. Principio

Toda impugnacion se responde con evidencia, no con autoridad del sistema. Si ALQUIMIA no puede demostrar fuente, fecha, metodo, confianza y responsable humano, la afirmacion se degrada, corrige o bloquea.

## 2. Flujo comun

1. Registrar la impugnacion con fecha, actor, modulo, claim y motivo.
2. Identificar unidad territorial: municipio, ZM, region o benchmark.
3. Localizar ClaimLedger/provenance, fuente y fecha.
4. Revisar metodo y supuestos.
5. Clasificar el dato: validado, oficial, inferido, benchmark, supuesto o brecha.
6. Determinar si el claim continua, se corrige, se degrada o se bloquea.
7. Registrar decision humana y evidencia usada.
8. Actualizar documento/modulo con advertencia visible.

## 3. Escenario: concesionario rechaza una estimacion

**Riesgo:** el concesionario afirma que rutas, toneladas, costos o capacidad no reflejan operacion real.

**Respuesta obligatoria:**

- solicitar bitacora, GPS, pesajes, mantenimiento, capacidad, contrato o reporte operativo;
- comparar contra fuente usada por ALQUIMIA;
- si ALQUIMIA uso benchmark o inferencia, declarar que no era dato oficial;
- si el concesionario aporta evidencia suficiente, registrar como dato privado del tenant;
- si hay contradiccion mayor a 20%, marcar discrepancia y exigir validacion humana.

**Bloquear claim si:** no existe estudio local ni evidencia operativa suficiente.

## 4. Escenario: regidor cuestiona fuente o metodo

**Respuesta obligatoria:**

- mostrar fuente, fecha y metodo;
- distinguir si es cifra municipal, ZM o benchmark;
- explicar formula en lenguaje natural;
- indicar si falta estudio local;
- ofrecer ruta de validacion: estudio de campo, acta, oficio o revision de juridico/tesoreria.

**Bloquear claim si:** la cifra se presento como oficial sin fuente local u oficial competente.

## 5. Escenario: auditor pide trazabilidad

**Respuesta obligatoria:**

- entregar ClaimLedger/provenance del documento o modulo;
- listar fuente, fecha, metodo, version y responsable;
- mostrar audit log de cambios, gates y decisiones humanas;
- declarar blockers vigentes;
- no reconstruir evidencia ex post como si hubiera existido desde origen.

**Bloquear claim si:** no hay version, audit log o fuente recuperable.

## 6. Escenario: direccion municipal quiere usar benchmark como verdad local

**Respuesta obligatoria:**

- permitir benchmark solo como referencia;
- insertar advertencia: "Benchmark; no estudio local";
- exigir estudio local para afirmacion municipal;
- separar decision administrativa de validacion tecnica.

**Bloquear claim si:** el benchmark se quiere usar en Cabildo, contrato, CAPEX/OPEX, SDG 11.6.1 o dictamen como dato local.

## 7. Escenario: proveedor externo entrega datos incompletos

**Respuesta obligatoria:**

- registrar campos faltantes;
- pedir fuente, periodo, unidad, metodologia y responsable;
- marcar `pending_human_validation` o `missing_source`;
- no llenar huecos con inferencias si el claim sera oficial.

**Bloquear claim si:** faltan unidades, periodo, metodologia o evidencia primaria.

## 8. Escenario: juridico pregunta quien aprobo un claim

**Respuesta obligatoria:**

- separar generacion automatizada, revision tecnica y aprobacion humana;
- mostrar audit log, responsable humano, fecha y evidencia usada;
- declarar si el texto es borrador, observacion tecnica, lectura ejecutiva o dictamen firmado;
- si no hay aprobacion humana, marcar `human_review_required`;
- no atribuir firma, aprobacion o cierre de gate a flujo de borradores asistidos, capa de aprendizaje supervisado u otro sistema interno.

**Pausar claims:** documentos de Cabildo, adendas, reformas reglamentarias, gates y afirmaciones con efecto contractual.

**Advertencia visible:** "Borrador para revision humana; no documento oficial."

**Humano decide:** juridico municipal, sindicatura, founder o autoridad competente segun materia.

**ALQUIMIA no debe:** responder que el sistema aprobo, firmo o valido juridicamente el claim.

**Bloquear claim si:** se presenta como aprobado sin responsable humano, fecha y evidencia.

## 9. Escenario: ausencia de estudio local

**Respuesta obligatoria:**

- marcar brecha critica si el estudio es requisito de gate;
- declarar que benchmarks o inferencias no sustituyen estudio;
- listar estudio requerido, responsable, costo aproximado, tiempo y evidencia;
- no avanzar claim a oficial.

**Pausar claims:** generacion/composicion local, rutas, infraestructura, PSP, CAPEX/OPEX, SDG/GRI/Wasteaware y dictamen juridico cuando dependan del estudio faltante.

**Advertencia visible:** "Brecha critica: falta estudio local requerido."

**Humano decide:** responsable tecnico municipal, tercero ejecutor, juridico o founder, segun el estudio.

**ALQUIMIA no debe:** suavizar la brecha como oportunidad comercial ni rellenar con narrativa positiva.

**Bloquear claim si:** el modulo depende de cuarteo, rutas, infraestructura, juridico, pepenadores o PSP y no hay evidencia local suficiente.

## 10. Escenario: discrepancia entre municipio y ZM

**Respuesta obligatoria:**

- identificar la unidad territorial original de cada fuente;
- mostrar municipio y ZM en renglones separados;
- explicar si la ZM solo sirve como contexto o benchmark;
- conservar conclusiones municipales y regionales separadas;
- exigir fuente municipal para claims municipales.

**Pausar claims:** claims de poblacion, toneladas, cobertura, costos, rutas, metas de captura o impacto cuando la fuente ZM se quiera usar como verdad municipal.

**Advertencia visible:** "Dato regional/ZM; no validado como cifra municipal."

**Humano decide:** responsable de datos municipales/founder, con apoyo de validacion de arquitectura si hay conflicto de alcance.

**ALQUIMIA no debe:** copiar una conclusion de ZM al municipio ni una conclusion municipal a la ZM.

**Bloquear claim si:** no se puede separar fuente, fecha, metodo o alcance territorial.

## 11. Resultado de impugnacion

| Resultado | Uso |
|---|---|
| Sostener claim | Evidencia suficiente y fuente trazable. |
| Corregir claim | Evidencia nueva valida reemplaza cifra o texto. |
| Degradar claim | De oficial/validado a preliminar, benchmark o supuesto. |
| Bloquear claim | Falta evidencia critica. |
| Escalar | Requiere founder, revision metodologica, revision de estandares, validacion de arquitectura, juridico o Cabildo. |
