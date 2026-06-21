# 01 - Mapa De Experiencia De Usuario

## Propósito

Disenar la experiencia de ALQUIMIA como navegacion por secciones/clics y decisiones, no como scroll total.

## Alcance

Define el mapa de interaccion, secciones, audiencias, estados y componentes. No define formulas.

## Problema Que Corrige

El usuario actual debe avanzar por muchas secciones en un solo flujo. Eso produce perdida de contexto, fatiga visual y confusion entre diagnostico, legal, operacion, finanzas y documentos.

## Decisiones De Producto

- La primera accion es seleccionar ciudad/municipio.
- Antes o junto con la ciudad, el usuario debe elegir su puerta de entrada: ciudadano/plan de ciudad o empresa/institucion.
- La ciudad seleccionada debe mostrar circularidad RSU actual estimada antes de proponer metas.
- La navegacion principal se organiza por modulos.
- Cada modulo tiene resumen ejecutivo, vista tecnica y documentos relacionados.
- El sistema debe poder cambiar de audiencia sin cambiar los datos.
- El usuario siempre debe ver fase institucional, bloqueos y siguiente accion.

## Arquitectura De Navegacion

```text
Inicio
  -> Selector de entrada
       -> Ciudadano: quiero entender o construir el plan de circularidad de mi ciudad
       -> Empresa/institucion: quiero hacer mas circular mi operacion
  -> Selector de ciudad/municipio o ubicacion operativa
  -> Panel de contexto territorial
  -> Modulos de decision
```

Modulos:

1. Introduccion.
2. Trazabilidad de datos.
3. Marco legal.
4. Circularidad actual estimada.
5. Problema RSU.
6. Educacion de separacion.
7. Implementacion por fases.
8. Infraestructura y centros de acopio.
9. Logistica y zonas.
10. Economia y ROI.
11. Impacto ambiental.
12. Impacto economico local.
13. Viabilidad politica.
14. Grandes generadores.
15. Precolocacion, materiales y recicladoras.
16. Causalidad y trazabilidad.
17. Comparacion de escenarios.
18. Exportacion documental.

## Selector Inicial De Ciudad/Municipio

Debe permitir:

- elegir ZM;
- elegir municipio especifico;
- activar/desactivar municipios;
- ver estado de datos;
- ver estado legal;
- ver si hay concesionario conocido;
- ver si hay cobertura suficiente para documentos.

Texto recomendado:

```text
Selecciona la ciudad o municipio que quieres analizar.
ALQUIMIA ajustara datos, marco legal, fases, documentos y riesgos a este territorio.
```

## Selector Inicial De Entrada

Debe existir antes del detalle tecnico:

```text
¿Qué quieres hacer?

1. Soy ciudadano, cabildo o equipo publico y quiero entender o construir el plan de circularidad de mi ciudad.
2. Soy empresario, hotel, hospital, industria, club, escuela, estadio o administrador de inmueble y quiero volver mi operacion mas circular.
```

La entrada no cambia la verdad de datos. Cambia el orden, el lenguaje, los modulos destacados y los documentos generables.

Para empresa/institucion, el sistema debe preguntar:

- tipo de actividad;
- ubicacion;
- numero de personas atendidas o empleados;
- residuos principales;
- si genera residuos regulados o de manejo especial;
- proveedores ambientales actuales;
- objetivo: cumplir, reducir costo, vender material, reducir huella, ordenar contenedores o generar reporte.

## Circularidad Actual Estimada De La Ciudad

Despues de seleccionar ciudad, ALQUIMIA debe mostrar una linea base:

```text
Circularidad RSU actual estimada: X%
Estado: estimado / benchmark / verificado
Que incluye: reciclaje formal, valorizacion, compostaje, recuperacion privada conocida
Que no incluye: informalidad no registrada, residuos regulados fuera de RSU, datos no observables
Confianza: baja / media / alta
```

Esta linea base debe ser punto de partida para metas. No debe presentarse como dictamen oficial.

## Audiencias En La UI

```text
AudienceMode
  ciudadano
  cabildo
  juridico
  operador
  concesionario
  inversionista_recicladora
  tecnico
```

Cada modo cambia:

- densidad de informacion;
- etiquetas;
- documentos destacados;
- acciones visibles;
- glosario;
- riesgos mostrados.

No cambia:

- datos base;
- trazabilidad;
- calculos;
- bloqueos.

## Estados De Cada Modulo

```text
ModuleState
  listo
  incompleto
  bloqueado
  estimado
  requiere_validacion
```

Cada modulo debe mostrar:

- estado;
- causa;
- accion sugerida;
- documento afectado;
- fuente de evidencia.

## Modelo De Datos Sugerido

```text
ExperienceModule
  id
  nombre
  audiencia_principal
  fase_institucional
  decision
  estado
  inputs_requeridos
  outputs
  documentos
  bloqueos
```

```text
UserJourney
  city_id
  audience_mode
  portal_entry
  current_module
  completed_modules
  blocked_modules
  recommended_next_action
```

## Endpoints Sugeridos

- `GET /experience/{city_id}/modules`
- `GET /experience/{city_id}/journey?audience=cabildo`
- `GET /experience/{city_id}/baseline`
- `POST /experience/{city_id}/next-action`

## Componentes Frontend Sugeridos

- `CityFirstSelector`
- `PortalEntrySelector`
- `CircularityBaselinePanel`
- `ModuleGrid`
- `ModuleDetailShell`
- `AudienceModeSwitch`
- `InstitutionalPhaseRail`
- `NextActionPanel`
- `ModuleEvidenceDrawer`
- `DocumentOutputPanel`

## Relación Con Código Actual

- Reemplaza el uso central de `Sidebar` como lista de anclas.
- `frontend/src/app/simulator/page.tsx` debe dejar de renderizar todos los modulos como scroll obligatorio.
- Componentes actuales pueden reutilizarse dentro de `ModuleDetailShell`.
- `useSimulatorStore` debe conservar estado, pero agregar `cityContext`, `audienceMode`, `currentModule` y `journeyState`.

## Criterios De Aceptación

- La persona puede iniciar por ciudad sin leer toda la plataforma.
- La persona puede iniciar por entrada ciudadana/publica o empresa/institucion.
- La ciudad muestra circularidad RSU actual estimada antes de metas futuras.
- El usuario puede entrar a cualquier modulo desde un mapa claro.
- Cada modulo contesta: que veo, que decido, que dato lo sostiene, que sigue.
- La navegacion distingue ciudadano, cabildo, juridico, operador e inversionista.
- Los bloqueos se muestran como control de calidad, no como error opaco.

## Riesgos De Mala Implementación

- Convertir los modulos en tabs decorativos sin flujo.
- Ocultar secciones criticas por audiencia.
- Duplicar estado entre store y componentes.
- Mantener el scroll largo disfrazado de navegacion.
- Ocultar el camino empresarial dentro de macrogeneradores.
- Presentar circularidad actual estimada sin limites metodologicos.

## Qué NO Hacer

- No quitar trazabilidad para simplificar.
- No mostrar todo a todos.
- No crear landing page de marketing.
- No llamar "oficial" a documentos propuestos.
- No tratar hospitales o industria como ciudadanos domiciliarios.
- No mezclar residuos peligrosos, especiales o regulados con RSU sin etiqueta y validacion normativa.

## Prompt Final Para Agente Codificador

```text
Reestructura la experiencia del simulador en torno a PortalEntrySelector, CityFirstSelector, CircularityBaselinePanel, AudienceModeSwitch y ModuleDetailShell. Reutiliza componentes existentes, pero deja de depender de un scroll S1-S20 como estructura principal. Cada modulo debe declarar decision, estado, evidencia, bloqueos y siguiente accion. Mantener store actual, agregando portalEntry, cityContext, circularityBaseline, audienceMode y journeyState. El flujo empresarial/institucional debe existir como entrada propia y no como tabla secundaria.
```
