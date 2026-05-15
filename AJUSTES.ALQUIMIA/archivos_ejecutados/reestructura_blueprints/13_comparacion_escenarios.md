# 13 Comparación De Escenarios

## Propósito

Diseñar un workflow formal para crear, guardar, comparar y exportar escenarios de decisión pública.

## Alcance

Incluye ajuste de parámetros, guardado de escenarios, comparación por costo, captura, ROI, emisiones, empleos, viabilidad política, riesgo legal, tiempo a circularidad, infraestructura y riesgo operativo.

## Problema Que Corrige

Comparar escenarios no debe ser una tabla secundaria al final del scroll. Debe ser un instrumento de cabildo y ciudadanía para entender alternativas, costos, riesgos y consecuencias.

## Decisiones De Producto

- Todo escenario guardado debe contener ciudad, municipio(s), horizonte, supuestos, data provenance y fecha.
- La comparación debe mostrar diferencias, no solo valores absolutos.
- Debe existir “escenario base” y escenarios alternativos.
- La exportación debe incluir explicación ejecutiva de tradeoffs.
- Ningún escenario debe comparar municipios como si fueran equivalentes sin aclarar diferencias legales y financieras.

## Modelo De Datos Sugerido

```ts
interface ScenarioComparisonMetric {
  id: string
  nombre: string
  unidad: string
  valor_base: number | string
  valores: Record<string, number | string>
  interpretacion: string
  riesgo?: string
}

interface ScenarioComparison {
  id: string
  ciudad_id: string
  escenario_base_id: string
  escenario_ids: string[]
  metricas: ScenarioComparisonMetric[]
  conclusion_ejecutiva: string
  warnings: string[]
}
```

## Endpoints Sugeridos

- `POST /scenarios/save`
- `GET /scenarios/{city_id}`
- `POST /scenarios/compare`
- `GET /scenarios/compare/{comparison_id}/export`

## Componentes Frontend Sugeridos

- `ScenarioSaveButton`
- `ScenarioLibrary`
- `ScenarioComparisonMatrix`
- `TradeoffNarrativePanel`
- `ScenarioExportPanel`

## Relación Con Código Actual

El store ya guarda escenarios en `escenariosGuardados` y existen tipos `EscenarioGuardado`. También hay exportación de paquetes. Esta fase debe transformar la tabla de comparación en workflow completo con narrativa y descarga.

## Criterios De Aceptación

- El usuario puede guardar al menos tres escenarios y compararlos.
- Cada escenario conserva supuestos y proveniencia.
- La matriz muestra diferencias y riesgos.
- La exportación produce un documento de comparación.
- Se evita comparar ZM o municipios sin contexto jurídico/operativo.

## Riesgos De Mala Implementación

- Comparar solo KPIs altos sin supuestos.
- Perder data provenance al guardar.
- Exportar una tabla sin interpretación.
- Permitir que escenarios de ciudades distintas parezcan intercambiables.

## Qué NO Hacer

- No convertir comparación en screenshot de tabla.
- No borrar warnings al guardar.
- No ocultar horizonte o base legal del escenario.
- No mezclar escenario ciudadano con escenario financiero sin etiqueta.

## Prompt Final Para Agente Codificador

Implementa `ScenarioComparison` como workflow. Extiende `EscenarioGuardado` para conservar proveniencia, legal status, horizonte, municipios y supuestos. Crea matriz comparativa con diferencias, riesgos e interpretación. Agrega exportación de comparación y tests que fallen si un escenario guardado pierde warnings, fuentes o ciudad/municipio.
