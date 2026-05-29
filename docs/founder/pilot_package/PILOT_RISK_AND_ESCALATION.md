# PILOT RISK AND ESCALATION

**Uso:** matriz de riesgos para pausar, escalar o bloquear un piloto cuando aparezcan presiones metodologicas, legales, politicas o de evidencia.

## Matriz de riesgos

| Riesgo | Severidad | Senal temprana | Accion inmediata | Responsable humano | Condicion de pausa | Condicion de escalamiento | Condicion de bloqueo |
|---|---:|---|---|---|---|---|---|
| Datos insuficientes. | Alta | Campos clave sin fuente, fecha o responsable. | Marcar pendiente y limitar claims. | Responsable de datos/founder. | Claims dependen del dato faltante. | Cliente no entrega evidencia en fecha acordada. | Se exige publicar claim sin dato. |
| Municipio/ZM mezclados. | Critica | Fuente ZM usada como cifra municipal. | Separar alcance territorial o bloquear claim. | validacion de arquitectura/founder. | No hay forma de distinguir unidad territorial. | Juridico/auditor si el claim saldra externo. | Claim municipal depende de dato ZM sin metodo. |
| Benchmark usado como verdad local. | Critica | Se propone presentar referencia nacional/regional como dato del municipio. | Cambiar lenguaje a referencia comparativa. | revision metodologica/founder. | Interlocutor insiste en usarlo como conclusion local. | Cabildo/juridico si se pretende publicar. | Se intenta ocultar advertencia. |
| Estimacion tratada como oficial. | Critica | Frases como "dato oficial" o "resultado garantizado". | Reescribir como estimacion preliminar con supuestos. | revision metodologica/founder. | Claim sensible depende de estimacion. | Legal/founder. | Se exige usarlo en documento oficial. |
| Presion politica para ocultar brecha. | Critica | Solicitud de quitar advertencia o brecha critica. | Mantener brecha visible y registrar solicitud. | Founder. | La brecha afecta decision publica. | Legal/contraloria si aplica. | Se condiciona continuidad a ocultar brecha. |
| Concesionario impugna datos. | Alta | Objecion a metodologia, fuente o periodo. | Activar protocolo de impugnacion tecnica. | Founder/responsable de datos. | La impugnacion afecta claim central. | Auditor/juridico si el dato sera usado formalmente. | No hay evidencia para sostener claim. |
| Juridico pide pausa. | Critica | Solicita no circular documento o claim. | Pausar publicacion/uso externo. | Juridico/founder. | Cualquier duda legal no resuelta. | Abogado externo. | Se pretende publicar contra instruccion legal. |
| capa de aprendizaje supervisado sugiere sin N suficiente. | Alta | Patron emergente o interno aparece como recomendacion cliente. | Retirar o mantener interno. | capa de aprendizaje supervisado/revision metodologica/founder. | No cumple N, bias check o founder gate. | Founder/revision metodologica. | Se intenta publicar como decision. |
| flujo de borradores asistidos genera contenido no validado. | Alta | Borrador sin fuentes o con tono de dictamen. | Marcar borrador para revision humana. | Founder/revision metodologica. | Se quiere enviar sin validacion. | Legal si tiene efecto externo. | Se presenta como aprobado o firmado. |
| Cliente pide claim de impacto no sustentado. | Critica | Quiere afirmar ahorro/captura/reduccion sin baseline. | Bloquear o condicionar claim. | Founder/revision metodologica. | Falta baseline o estudio local. | Legal/finanzas. | Se exige garantia o cifra oficial. |
| Falta opt-in para analytics agregada. | Critica | Datos tenant quieren usarse para benchmarks o capa de aprendizaje supervisado agregado. | Excluir del agregado. | Founder/legal. | Consentimiento no existe o es ambiguo. | Abogado. | Se usa dato tenant sin opt-in. |
| Cambio de alcance. | Alta | Nuevos modulos, stages, claims o entregables no pactados. | Activar change control. | Founder/cliente. | Cambio afecta evidencia, costo o riesgo. | Founder/legal. | Se ejecuta cambio sin aprobacion humana. |

## Criterios generales de pausa

- Falta sponsor, responsable operativo o responsable de datos.
- Aparece mezcla municipio/ZM sin resolucion.
- Falta estudio local para claim local sensible.
- Hay presion para ocultar advertencias.
- Legal, founder o revision metodologica solicitan pausa.
- capa de aprendizaje supervisado/flujo de borradores asistidos se estan tratando como aprobadores.

## Criterios generales de bloqueo

- Claim de impacto, ahorro, captura o reduccion sin evidencia minima.
- Uso de benchmark como estudio local.
- Uso de inferencia como dato validado.
- Uso de estimacion como verdad oficial.
- Uso agregado de datos tenant sin opt-in.
- Cierre de gate o decision politica por sistema interno.
