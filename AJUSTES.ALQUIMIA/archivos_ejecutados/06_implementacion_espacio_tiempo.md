# 06 Implementación En Espacio Y Tiempo

## Propósito

Convertir el horizonte del programa en una decisión pública comprensible: no preguntar solamente cuántos años dura el plan, sino en cuántos años quiere la ciudad alcanzar una operación circular defendible.

La pregunta rectora debe ser: **¿En cuántos años quieres que tu ciudad sea circular?**

## Alcance

Incluye planes a 3, 5 y 7 años, calendario por años, meses y trimestres, trayectoria de captura, expansión por zonas, colonias piloto, transición territorial, actividades institucionales y recalculo automático cuando cambie el horizonte temporal.

## Problema Que Corrige

El simulador actual trata el horizonte como un parámetro financiero y operativo aislado. Eso debilita la comprensión pública: una ciudadanía o un cabildo no decide “cinco años” en abstracto, decide el ritmo de transformación territorial, la carga presupuestal, el riesgo político y la capacidad operativa.

## Decisiones De Producto

- El horizonte debe mostrarse como ruta territorial, no como selector numérico aislado.
- Todo plan debe tener unidades de tiempo simultáneas: año, trimestre y mes.
- La expansión debe dividirse en zonas operativas, colonias piloto y oleadas.
- Cambiar horizonte debe recalcular captura, infraestructura, logística, educación, ROI, riesgo legal y documentos.
- La trayectoria debe distinguir meta de captura, capacidad instalada y capacidad realmente operable.
- La plataforma debe advertir cuando el ritmo seleccionado no sea consistente con permisos, capacidad de centros, educación o concesionario.

## Modelo De Datos Sugerido

```ts
type CircularityHorizon = 3 | 5 | 7

interface TerritorialZone {
  id: string
  nombre: string
  municipio_id: string
  colonias: string[]
  poblacion_estimada: number
  viviendas_estimadas: number
  prioridad: 'piloto' | 'expansion' | 'consolidacion'
  restricciones: string[]
}

interface ImplementationWave {
  id: string
  fase_institucional: 1 | 2 | 3 | 4 | 5
  zona_id: string
  inicio_mes: number
  fin_mes: number
  captura_objetivo_pct: number
  capacidad_ca_ton_dia: number
  actividades: string[]
  evidencia_requerida: string[]
  bloqueos: string[]
}

interface CircularityTimeline {
  ciudad_id: string
  horizonte_anios: CircularityHorizon
  mes_inicio: number
  zonas: TerritorialZone[]
  oleadas: ImplementationWave[]
  warnings: string[]
}
```

## Endpoints Sugeridos

- `GET /implementation/{city_id}/timeline?years=3|5|7`
- `POST /implementation/{city_id}/timeline/recalculate`
- `GET /implementation/{city_id}/zones`
- `POST /implementation/{city_id}/zones/{zone_id}/activate`
- `GET /implementation/{city_id}/timeline/export`

## Componentes Frontend Sugeridos

- `CityCircularityHorizonSelector`
- `TimelineByYearQuarterMonth`
- `ZoneExpansionMap`
- `ImplementationWaveTable`
- `CaptureVsCapacityChart`
- `TimelineRiskBanner`

## Relación Con Código Actual

Hoy `frontend/src/app/simulator/page.tsx` muestra `HorizonteSection` como parte del scroll S1-S20. La reestructura exige convertirlo en módulo de decisión posterior a ciudad/municipio y previo a infraestructura/logística. El store ya tiene `horizonteAnios`, `mesInicio`, `pctCapturaPorAño` y datos por ZM; debe evolucionar para guardar `CircularityTimeline`.

## Criterios De Aceptación

- El usuario puede seleccionar 3, 5 o 7 años y ver el efecto en captura, fases, zonas, centros, logística y documentos.
- La UI explica el plan en meses y trimestres, no solo años.
- Cada zona tiene municipio, colonias, inicio, cierre, meta y evidencia.
- El sistema advierte si el horizonte no es viable por legal, infraestructura, educación o concesionario.
- Los documentos exportados incluyen calendario territorial y no solo una gráfica de trayectoria.

## Riesgos De Mala Implementación

- Convertir el horizonte en un slider decorativo.
- Mostrar metas de captura sin capacidad instalada.
- Mezclar zonas de distintos municipios sin responsabilidad administrativa clara.
- Presentar una trayectoria agresiva sin evidencia educativa, legal u operativa.

## Qué NO Hacer

- No usar “Plan SLP original” como preset universal.
- No asumir que 5 años siempre es óptimo.
- No ocultar meses/trimestres detrás de una gráfica anual.
- No permitir metas de captura incompatibles con el número de centros o camiones.

## Prompt Final Para Agente Codificador

Implementa el módulo `ImplementacionEspacioTiempo` como sustituto conceptual de `HorizonteSection`. Debe partir de `city_id/municipio_id`, permitir horizontes 3/5/7, generar `CircularityTimeline`, mostrar oleadas por zona y recalcular impactos en captura, centros, logística y documentos. Agrega tests donde cambiar de horizonte modifique oleadas, advertencias y capacidad requerida. No lo implementes como slider aislado: debe ser una ruta territorial auditable.
