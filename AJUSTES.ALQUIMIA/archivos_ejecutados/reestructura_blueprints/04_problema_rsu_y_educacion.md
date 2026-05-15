# 04 - Problema RSU Y Educacion Ciudadana

## Propósito

Crear una seccion educativa clara para explicar el problema de RSU, la separacion domestica, la contaminacion de valorizables y el impacto del hogar.

## Alcance

Incluye composicion de residuos, tipos de predio, categorias, calculadora domestica y lenguaje ciudadano. No sustituye el modulo financiero ni el legal.

## Problema Que Corrige

La composicion RSU existe como dato tecnico, pero no guia suficientemente al ciudadano sobre que hacer en su casa, edificio, condominio o residencial.

## Decisiones De Producto

- La educacion debe venir antes de pedir accion.
- El lenguaje debe ser ciudadano, no tecnico.
- Las cinco categorias se explican con ejemplos cotidianos.
- La calculadora domestica debe estimar, no dictaminar.
- El modulo debe conectar conducta ciudadana con pureza, merma, captura y economia.

## Categorias De Separacion

- vidrio;
- aluminio;
- plasticos;
- papel/carton;
- organicos.

Cada categoria debe explicar:

- que incluye;
- que no incluye;
- como se contamina;
- que pasa si se mezcla;
- que valor puede tener;
- que contenedor usar.

## Tipos De Predio

### Casa Habitacion

Debe explicar espacio, frecuencia, contenedores recomendados y separacion basica.

### Edificio / Departamento

Debe explicar separacion en cocina, almacenamiento temporal y punto comun.

### Condominio

Debe explicar reglas internas, administrador, avisos, bitacora y responsabilidades compartidas.

### Residencial

Debe explicar zonas internas, calendario, educacion y posible convenio.

## Calculadora Domestica

Debe permitir ingresar:

- residuos generados en casa;
- numero de habitantes;
- frecuencia de generacion;
- fracciones separadas;
- contaminacion aproximada;
- huella de carbono estimada.

Debe devolver:

- kg/dia estimados;
- kg/mes;
- residuos valorizables;
- organicos;
- impacto de separar;
- advertencias si el dato es manual.

## Modelo De Datos Sugerido

```text
HouseholdWasteProfile
  profile_id
  city_id
  municipio_id
  tipo_predio
  habitantes
  kg_semana_manual
  fracciones
  contaminacion_estimada
  fuente
  confianza
```

```text
EducationContentBlock
  block_id
  audience
  categoria
  titulo
  explicacion
  ejemplos
  errores_comunes
  accion_recomendada
```

## Endpoints Sugeridos

- `GET /education/{city_id}/content`
- `POST /education/household-calculator`
- `GET /education/container-guidance?tipo_predio=casa`

## Componentes Frontend Sugeridos

- `CitizenWasteIntro`
- `WasteCategoryCards`
- `PropertyTypeSeparationGuide`
- `HouseholdWasteCalculator`
- `ContaminationExplainer`
- `ContainerRecommendationPanel`

## Relación Con Código Actual

`ComposicionRSU.tsx` y `TipoVivienda.tsx` existen, pero deben evolucionar de tarjetas tecnicas a una experiencia educativa accionable. `frontend/src/lib/constants.ts` contiene composicion fija que debe mostrarse con fuente y limites.

## Criterios De Aceptación

- Un ciudadano entiende como separar sin leer un reglamento.
- Se distinguen casa, edificio, condominio y residencial.
- La calculadora declara cuando usa dato manual.
- La UI explica merma y contaminacion con ejemplos.
- El resultado se conecta con captura, pureza y valor.

## Riesgos De Mala Implementación

- Hacer infografias sin calculo.
- Infantilizar el lenguaje.
- Prometer precision domestica sin datos.
- No conectar educacion con resultados del simulador.

## Qué NO Hacer

- No usar lenguaje tecnico sin glosario.
- No presentar estimaciones domesticas como medicion oficial.
- No mezclar contenedor domiciliario con contenedor publico.

## Prompt Final Para Agente Codificador

```text
Implementa una seccion educativa ciudadana basada en composicion RSU, tipo de predio y calculadora domestica. Debe explicar cinco categorias, contaminacion, merma e impacto. Todo dato manual debe marcarse como manual. Conectar resultados con pureza/captura/valor sin afirmar precision oficial.
```
