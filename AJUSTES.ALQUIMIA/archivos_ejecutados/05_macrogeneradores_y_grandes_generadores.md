# 05 - Macrogeneradores Y Grandes Generadores

## Propósito

Diseñar la seccion de grandes generadores como motor serio de estimacion, educacion sectorial, logistica, infraestructura y mercado.

## Alcance

Incluye clubes deportivos, estadios, hoteles, hospitales, bibliotecas, conciertos, centros comerciales, universidades, condominios, residenciales, empresas, industria ligera, zonas turisticas, espacios publicos, eventos masivos y actividades no residenciales.

## Problema Que Corrige

Los macrogeneradores no pueden ser una tabla superficial. Son fuentes relevantes de volumen, estacionalidad, pureza, rutas y oportunidades de negocio.

## Decisiones De Producto

- Cada tipo de generador tiene variables propias.
- La incertidumbre debe mostrarse.
- La fuente bibliografica esperada debe registrarse.
- El impacto debe conectarse con infraestructura, logistica y recicladoras.
- Los generadores pueden ser residenciales, comerciales, institucionales o eventuales.
- Esta seccion debe escalar a un portal empresarial/institucional, no quedarse como subseccion municipal.
- El sistema debe orientar sobre RSU y advertir cuando aparezcan residuos especiales, peligrosos o regulados que exigen proveedor autorizado o validacion normativa.
- La recomendacion debe llegar al nivel practico: tipo de contenedores, ubicacion sugerida, separacion interna, proveedor ambiental cercano y alternativa circular por material.

## Tipos De Generador

```text
MacroGeneratorType
  club_deportivo
  estadio
  hotel
  hospital
  empresa
  industria_ligera
  zona_turistica
  espacio_publico
  biblioteca
  concierto
  centro_comercial
  universidad
  condominio
  residencial
  evento_masivo
  actividad_no_residencial
```

## Variables De Calculo Por Tipo

### Club Deportivo

- socios activos;
- visitantes diarios;
- eventos;
- restaurante/cafeteria;
- jardineria;
- vestidores;
- fraccion organica/plastico/papel.

### Estadio

- aforo;
- ocupacion promedio;
- eventos por mes;
- tipo de evento;
- consumo alimentos/bebidas;
- residuos por asistente;
- limpieza post-evento.

### Hotel

- habitaciones;
- ocupacion;
- noches;
- restaurante;
- eventos;
- lavanderia;
- organicos;
- envases.

### Hospital

- camas;
- consultas diarias;
- visitantes;
- cafeterias;
- areas administrativas;
- residuos RSU separados de residuos biologico-infecciosos u otros regulados;
- proveedor autorizado existente;
- zonas de acopio interno;
- restricciones normativas.

Nota obligatoria: ALQUIMIA puede orientar la circularidad de RSU y rutas de disposicion; no debe simular manejo de residuos regulados como si fueran RSU ordinarios.

### Empresa / Industria Ligera

- empleados;
- turnos;
- proceso productivo;
- comedor;
- empaques;
- tarimas/carton/plastico;
- residuos de mantenimiento;
- proveedor ambiental actual;
- posibilidad de venta, retorno, reutilizacion o coprocesamiento.

### Zona Turistica / Espacio Publico

- visitantes diarios;
- temporada alta/baja;
- comercios temporales;
- mobiliario urbano;
- puntos de generacion;
- requerimientos de contenedores diferenciados;
- frecuencia de recoleccion;
- educacion visual en sitio.

### Biblioteca

- visitantes;
- cafeteria;
- papel/carton;
- eventos;
- residuos administrativos.

### Concierto / Evento Masivo

- asistentes;
- duracion;
- vendedores;
- bebidas;
- alimentos;
- montaje/desmontaje;
- temporalidad.

### Centro Comercial

- locales;
- visitantes;
- food court;
- estacionamiento;
- mantenimiento;
- carton comercial;
- organicos.

### Universidad

- estudiantes;
- personal;
- cafeterias;
- laboratorios;
- eventos;
- residencias;
- papel/carton.

### Condominio / Residencial

- viviendas;
- habitantes;
- amenities;
- jardines;
- reglamento interno;
- punto de acopio.

## Fuentes Bibliograficas Esperadas

Para cada tipo se debe buscar o registrar:

- estudios de generacion per capita por actividad;
- reportes de eventos;
- datos de ocupacion;
- literatura de hoteleria/turismo;
- fuentes municipales;
- reportes de centros comerciales;
- estudios universitarios;
- benchmarks nacionales/internacionales.
- padron o directorio de proveedores ambientales autorizados cuando aplique;
- normas o permisos aplicables para residuos no RSU cuando el generador los declare.

Si no hay fuente, estado:

```text
benchmark_estimado
```

nunca `oficial`.

## Modelo De Datos Sugerido

```text
MacroGeneratorProfile
  generator_id
  city_id
  municipio_id
  tipo
  nombre
  ubicacion
  variables
  generacion_estimada_ton_dia
  composicion_estimada
  estacionalidad
  fuente
  confianza
  incertidumbre
  residuos_regulados_detectados
  proveedor_ambiental_sugerido
  plan_contenedores
```

```text
MacroGeneratorScenarioImpact
  generator_id
  captura_adicional
  pureza_esperada
  ruta_requerida
  centro_acopio_asociado
  recicladora_potencial
  ingresos_estimados
  warnings
```

```text
OrganizationalCircularityAssessment
  organization_id
  tipo_actividad
  city_id
  municipio_id
  residuos_rsu
  residuos_no_rsu
  proveedores_cercanos
  alternativas_circularidad
  plan_contenedores
  acciones_30_60_90
  bloqueos_normativos
```

## Endpoints Sugeridos

- `GET /macros/types`
- `POST /macros/profile/estimate`
- `POST /macros/impact`
- `GET /macros/{city_id}/registry`
- `POST /organizations/circularity-assessment`
- `GET /organizations/{organization_id}/providers`
- `GET /organizations/{organization_id}/container-plan`

## Componentes Frontend Sugeridos

- `MacroGeneratorTypeSelector`
- `MacroGeneratorEstimator`
- `MacroUncertaintyBadge`
- `MacroLogisticsImpactPanel`
- `MacroMarketConnectionPanel`
- `OrganizationCircularityEntry`
- `ProviderLocatorPanel`
- `ContainerPlacementPlanner`
- `RegulatedWasteWarningBanner`

## Relación Con Código Actual

Ya existen `backend/app/macros` y `Macrogeneradores.tsx`. Deben evolucionar para incluir variables por tipo, fuente esperada, incertidumbre y conexion clara con rutas, CAs y recicladoras. El portal empresarial debe reutilizar esta base, pero agregar evaluacion organizacional, proveedores ambientales, plan de contenedores y advertencias para residuos no RSU.

## Criterios De Aceptación

- Cada tipo tiene variables especificas.
- La estimacion muestra rango e incertidumbre.
- El impacto altera logistica/infraestructura/mercado cuando aplica.
- No se presenta benchmark como oficial.
- Un evento temporal no se trata igual que generador permanente.
- Una empresa/institucion recibe recomendaciones practicas: separacion, contenedores, proveedor ambiental y alternativa circular por residuo.
- Los residuos regulados se etiquetan y no se mezclan con RSU.

## Riesgos De Mala Implementación

- Usar un factor promedio para todo.
- No distinguir estacionalidad.
- No conectar con rutas.
- Inflar ingresos sin comprador.
- Recomendar disposicion de residuos regulados sin proveedor autorizado.
- Convertir el portal empresarial en formulario generico sin accion.

## Qué NO Hacer

- No crear tabla estetica sin motor.
- No llamar verificado a dato sin fuente.
- No mezclar residencial con estadio.
- No duplicar volumen ya contado en vivienda si no hay regla anti-doble conteo.
- No sugerir manejo de residuos biologico-infecciosos, peligrosos o especiales como si fueran reciclables ordinarios.
- No limitar la recomendacion a "separa mejor"; debe aterrizar en contenedores, proveedor, ruta y alternativa de circularidad.

## Prompt Final Para Agente Codificador

```text
Refuerza macrogeneradores como motor por tipo de actividad y base del portal empresarial/institucional. Cada tipo debe tener variables, fuente esperada, confianza, incertidumbre y conexion con logistica, centros de acopio, recicladoras y proveedores ambientales. Agrega `OrganizationalCircularityAssessment` con plan de contenedores, alternativas de circularidad y advertencias para residuos regulados. Evita tabla superficial, evita doble conteo con vivienda y no trates residuos especiales como RSU ordinario.
```
