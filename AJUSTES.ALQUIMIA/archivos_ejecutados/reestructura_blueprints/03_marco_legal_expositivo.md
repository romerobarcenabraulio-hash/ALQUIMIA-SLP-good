# 03 - Marco Legal Expositivo

## Propósito

Reestructurar la capa legal para que ALQUIMIA explique, proponga y trace rutas de aprobacion sin aparentar que emite documentos oficiales o dictamen juridico.

## Alcance

Aplica a diagnostico legal, propuestas reglamentarias, documentos AGORA, bloqueos juridicos, cobertura nacional y explicacion ciudadana.

## Problema Que Corrige

El usuario puede confundir una propuesta generada por el sistema con un documento oficial aprobado. Tambien puede confundirse la ZM con el municipio, aunque cada municipio tiene reglamento, obligaciones y rutas de aprobacion distintas.

## Decisiones De Producto

- Legal municipal siempre se analiza por municipio.
- La ZM puede coordinar, pero no sustituye reglamentos municipales.
- Todo texto legal generado es expositivo o propuesta hasta validacion juridica.
- El bloqueo juridico se presenta como control de calidad.
- El sistema debe sugerir acciones para desbloquear.
- La ciudadania debe entender derechos, obligaciones y limites sin lenguaje opaco.

## Lenguaje De Oficialidad

Usar estados:

```text
LegalDocumentStatus
  expositivo
  propuesta_borrador
  pendiente_validacion_jurista
  defendible_tecnicamente
  aprobado_por_autoridad
  bloqueado
```

Regla:

- `expositivo`: explica la norma o propuesta.
- `propuesta_borrador`: texto sugerido para revision.
- `pendiente_validacion_jurista`: requiere revision legal.
- `defendible_tecnicamente`: evidencia suficiente para discutir.
- `aprobado_por_autoridad`: solo si existe evidencia documental real.
- `bloqueado`: falta fuente, municipio, articulo o competencia.

## Contenido Legal Por Municipio

Cada municipio debe mostrar:

- reglamento vigente;
- fuente;
- fecha/version;
- articulos relevantes;
- obligaciones municipales;
- obligaciones ciudadanas;
- limites de actuacion;
- brechas;
- propuesta de texto;
- ruta de cabildo;
- actor responsable;
- evidencia faltante.

Si existe legislacion anterior, debe mostrarse como contexto historico, no como norma vigente.

## Explicacion Ciudadana

Texto base:

```text
El municipio tiene obligacion de prestar el servicio de limpia y recoleccion conforme a su marco legal. La separacion por categorias, los horarios, las obligaciones por tipo de predio y las sanciones requieren fundamento reglamentario especifico. ALQUIMIA muestra propuestas y rutas de aprobacion para que el municipio pueda evaluar cambios; no sustituye la decision de Cabildo ni la revision de un jurista.
```

## Bloqueo Juridico

El bloqueo no debe decir "fallo". Debe decir:

```text
Pendiente de validacion por jurista.
```

Debe incluir:

- que falta;
- por que importa;
- que documento afecta;
- quien puede desbloquear;
- accion sugerida;
- endpoint o carga requerida.

Ejemplo:

```text
Este municipio tiene reglamento identificado, pero falta validar fuente, version y articulos aplicables. ALQUIMIA puede mostrar diagnostico expositivo, pero no debe generar propuesta de reforma defendible hasta que un jurista confirme la fuente.
```

## Modelo De Datos Sugerido

```text
MunicipalLegalContext
  municipio_id
  municipio_nombre
  zm_id
  reglamento_vigente
  reglamento_anterior
  fuente_vigente
  fecha_version
  articulos
  obligaciones_municipales
  obligaciones_ciudadanas
  limites
  brechas
  propuestas
  estado_validacion
```

```text
LegalProposal
  proposal_id
  municipio_id
  articulo_origen
  problema
  texto_propuesto
  justificacion_tecnica
  evidencia
  estado
  acciones_desbloqueo
```

## Endpoints Sugeridos

- `GET /legal/{municipio_id}/context`
- `GET /legal/{municipio_id}/articles`
- `GET /legal/{municipio_id}/proposals`
- `POST /legal/{municipio_id}/validate-source`
- `POST /legal/{municipio_id}/unlock-action`

## Componentes Frontend Sugeridos

- `MunicipalLegalExplorer`
- `LegalStatusBanner`
- `ArticleComparisonTable`
- `LegalProposalCard`
- `UnlockLegalActionPanel`
- `CitizenLegalExplanation`

## Relación Con Código Actual

Ya existen `backend/app/legal`, `backend/app/national` y `DiagnosticoJuridico.tsx`. La reestructura exige reforzar el lenguaje de oficialidad, acciones de desbloqueo y separacion municipio/ZM.

## Criterios De Aceptación

- Ningun documento legal se presenta como oficial sin evidencia.
- Cada municipio tiene contexto separado.
- El usuario ve norma vigente, anterior si aplica y propuesta.
- Todo bloqueo juridico tiene accion de desbloqueo.
- El ciudadano entiende obligacion municipal y limites de separacion/sancion.

## Riesgos De Mala Implementación

- Usar una plantilla legal para varios municipios.
- Generar texto de reforma sin fuente.
- Llamar dictamen a una propuesta.
- Bloquear sin explicar como avanzar.

## Qué NO Hacer

- No decir "aprobado" si no hay evidencia.
- No mezclar articulos de municipios.
- No permitir sanciones solo por simulacion.
- No usar SLP como fuente nacional.

## Prompt Final Para Agente Codificador

```text
Reestructura legal como capa expositiva por municipio. Implementa MunicipalLegalContext, LegalProposal y estados de oficialidad. Todo documento legal debe declarar si es expositivo, propuesta, pendiente de validacion, defendible o aprobado. Agrega acciones de desbloqueo y evita que ZM sustituya municipio.
```
