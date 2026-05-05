# 00 - Resumen Ejecutivo De Reestructura

## Propósito

Definir que cambia en ALQUIMIA para convertirla en una plataforma de decision publica por ciudad, no en una calculadora con secciones acumuladas.

## Alcance

Este documento gobierna la reestructura narrativa, funcional y tecnica. No implementa codigo. Ordena el producto para que los siguientes agentes implementen con menor ambiguedad.

## Problema Que Corrige

La plataforma actual tiene capacidades valiosas: simulador, documentos, exportacion, macrogeneradores, cobertura legal, operacion, trazabilidad y release. El riesgo es que el usuario las viva como un scroll largo donde cada modulo compite por atencion.

El problema no es falta de funciones. El problema es falta de arquitectura de experiencia.

## Que Cambia

ALQUIMIA pasa de:

```text
scroll largo de secciones
```

a:

```text
experiencia guiada por ciudad
  -> modulo de decision
  -> fase institucional
  -> evidencia
  -> simulacion
  -> documento por audiencia
```

La ciudad o municipio deja de ser un selector mas. Se vuelve el punto de partida que condiciona:

- marco legal;
- reglamento aplicable;
- circularidad RSU estimada actual;
- municipios activos;
- concesionario;
- composicion RSU;
- infraestructura;
- mercado de reciclaje;
- riesgos;
- documentos generables;
- bloqueos juridicos;
- viabilidad politica.

## Por Que No Debe Ser Un Scroll Largo

Un scroll total sirve para demo rapida, pero falla como herramienta civica porque:

- mezcla audiencias;
- esconde decisiones;
- obliga a recordar contexto;
- no distingue propuesta de documento oficial;
- hace que legal, finanzas, educacion y operacion parezcan secciones equivalentes;
- dificulta explicar por que un numero cambia;
- convierte una plataforma compleja en una lectura cansada.

La navegacion debe separar decisiones:

- "Soy ciudadano y quiero entender o impulsar el plan de circularidad de mi ciudad."
- "Soy empresa/institucion y quiero volver mi operacion mas circular."
- "Quiero entender el problema."
- "Quiero revisar legal."
- "Quiero disenar el plan."
- "Quiero ver infraestructura."
- "Quiero evaluar finanzas."
- "Quiero explicar impacto."
- "Quiero comparar escenarios."
- "Quiero generar documentos."

## Audiencias

ALQUIMIA debe hablarle a varias audiencias sin usar el mismo lenguaje para todas:

- ciudadania: que separar, por que importa, que cambia en su casa;
- cabildo: que decision se pide, cuanto cuesta, que riesgo tiene;
- legisladores/juridico: que articulo vigente existe, que propuesta se muestra, que ruta de aprobacion sigue;
- concesionario: como cambia recoleccion, rutas, etapas y obligaciones;
- operador: que hacer por zona, mes, ruta, evidencia e incidencia;
- inversionista/recicladora: volumen, pureza, precio, ubicacion, riesgo y retorno;
- empresarios/macrogeneradores: como estimar generacion, separar y conectar con el sistema.
- hospitales, hoteles, industria, clubes, estadios, campus y zonas turisticas: como gestionar RSU y, cuando aplique, residuos especiales o regulados con rutas, proveedores ambientales y alternativas de circularidad.

## Resultado Esperado

La plataforma debe permitir que una persona seleccione una ciudad y obtenga:

- linea base estimada de circularidad RSU actual, con fuente, confianza e incertidumbre;
- diagnostico legal expositivo por municipio;
- problema RSU explicado en lenguaje ciudadano;
- plan institucional por fases;
- implementacion espacio-tiempo por zonas;
- infraestructura y centros de acopio;
- logistica operativa;
- simulacion financiera separada por actividad;
- impacto ambiental y economico;
- viabilidad politica explicable;
- trazabilidad humana;
- comparacion de escenarios;
- paquete documental profesional por audiencia.

## Decisiones De Producto

- La pantalla inicial debe preguntar ciudad/municipio antes que cualquier calculo.
- La plataforma debe usar navegacion por modulos, no depender de scroll largo.
- Cada modulo debe declarar que decision habilita.
- Los documentos legales son expositivos/propuestos hasta validacion juridica.
- Cada municipio se analiza con su propio reglamento.
- Las finanzas separan centros de acopio, recicladoras y actividad economica.
- Causalidad se explica con lenguaje humano antes que con grafos.
- El portal debe arrancar con dos entradas: ciudadania/plan de ciudad y empresa/institucion/plan de circularidad organizacional.
- La linea base de circularidad actual debe etiquetarse como estimacion, benchmark o dato verificado segun evidencia disponible.
- El producto debe escalar a hoteles, hospitales, empresas, industria, zonas turisticas, estadios, clubes, campus, residenciales y espacios publicos.
- Para empresas e instituciones, ALQUIMIA debe asesorar RSU y, cuando aplique, otros residuos con manejo especializado, siempre distinguiendo lo municipal de lo regulado por normas sectoriales.

## Modelo De Datos Sugerido

```text
CityContext
  city_id
  nombre
  zm_id
  municipios
  poblacion
  circularidad_actual_estimada
  circularidad_actual_fuente
  circularidad_actual_confianza
  reglamentos
  concesionario
  data_provenance
  estado_validacion
```

```text
DecisionModule
  module_id
  ciudad
  audiencia
  decision
  inputs
  outputs
  bloqueos
  documentos
```

```text
PortalEntry
  entry_id
  tipo
    ciudadano_ciudad
    empresa_institucion
  preguntas_iniciales
  datos_minimos
  modulos_recomendados
  documentos_generables
```

## Endpoints Sugeridos

- `GET /city-context/{city_id}`
- `GET /city-context/{city_id}/circularity-baseline`
- `GET /city-context/{city_id}/modules`
- `GET /city-context/{city_id}/readiness`
- `GET /portal/entry-options`
- `POST /portal/entry-assessment`

## Componentes Frontend Sugeridos

- `CityFirstSelector`
- `PortalEntrySelector`
- `CircularityBaselineCard`
- `DecisionModuleNav`
- `AudienceModeSwitch`
- `InstitutionalPhaseRail`
- `EvidenceStatusBanner`

## Relación Con Código Actual

Actualmente `frontend/src/app/simulator/page.tsx` renderiza secciones `S1` a `S20` como scroll. Esta reestructura exige dividir esa experiencia en modulos navegables condicionados por ciudad y audiencia.

## Criterios De Aceptación

- Existe selector inicial de ciudad/municipio.
- Existe selector inicial de entrada: ciudadano/plan de ciudad o empresa/institucion.
- La ciudad muestra una linea base estimada de circularidad RSU actual con fuente, confianza e incertidumbre.
- La UI no depende de recorrer S1-S20 para entender la plataforma.
- Cada modulo declara decision, audiencia, datos y documentos relacionados.
- Legal, finanzas, educacion, operacion y exportacion quedan separados.
- El usuario puede explicar que esta viendo y que sigue.

## Riesgos De Mala Implementación

- Convertir la reestructura en una nueva lista mas larga.
- Ocultar complejidad sin explicarla.
- Usar el mismo texto para ciudadano, cabildo y tecnico.
- Presentar propuestas legales como oficiales.
- Mezclar municipio, ciudad y ZM.
- Presentar circularidad actual como dato oficial cuando sea una estimacion.
- Tratar residuos regulados de hospitales, industria o empresas como si fueran RSU municipales ordinarios.

## Qué NO Hacer

- No borrar funcionalidad existente sin auditoria.
- No vender documentos como dictamen oficial.
- No usar SLP como plantilla juridica para todo Mexico.
- No fusionar negocios financieros distintos.
- No crear pantallas decorativas sin decision.
- No prometer manejo de residuos peligrosos/especiales sin marco regulatorio y proveedor autorizado.
- No esconder incertidumbre de la linea base de circularidad.

## Prompt Final Para Agente Codificador

```text
Implementa la reestructura base de ALQUIMIA: reemplaza la experiencia de scroll largo por una arquitectura guiada por ciudad, modulos de decision, audiencia y fase institucional. No elimines calculos existentes. Crea la capa CityContext y una navegacion por modulos. Agrega dos entradas iniciales del portal: ciudadano/plan de ciudad y empresa/institucion/plan de circularidad organizacional. Para cada ciudad, calcula o muestra una linea base estimada de circularidad RSU actual con fuente, confianza e incertidumbre. Cada modulo debe declarar decision, audiencia, evidencia, bloqueos y documentos relacionados. Mantener distincion estricta entre simulacion, propuesta, dictamen y documento oficial, y distinguir RSU municipal de residuos especiales o regulados.
```
