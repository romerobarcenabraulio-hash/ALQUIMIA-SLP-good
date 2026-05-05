# 07 Infraestructura Y Centros De Acopio

## Propósito

Convertir los centros de acopio en una decisión espacial, financiera y operativa verificable: cuántos centros, de qué tamaño, dónde, cuándo, con qué capacidad y conectados a qué cadena de valor.

## Alcance

Número óptimo por fase, ubicación usando mapas, crecimiento proyectado, capacidad instalada, centros por zona y periodo, mixes prefabricados, comparación de costo/viabilidad/derrama/empleo, relación con recicladoras y visualización por residuo.

## Problema Que Corrige

El sistema actual presenta mixes de centros como tarjetas financieras y tabla de fases. Eso ayuda, pero no responde la pregunta pública principal: dónde deben existir, qué flujo reciben, qué residuo procesan y qué pasa si la ciudad crece o cambia el horizonte.

## Decisiones De Producto

- Todo centro debe pertenecer a una zona, fase y municipio.
- La capacidad debe compararse contra flujo capturable, no contra RSU total sin separación.
- La ubicación debe priorizar cobertura, cercanía a generación, acceso logístico, suelo disponible y conexión a recicladoras.
- La gráfica principal debe permitir ver crecimiento por residuo en líneas acumuladas y capacidad instalada.
- Deben existir mixes prefabricados, pero siempre explicados como propuestas, no como receta universal.
- Cada centro debe declarar CAPEX, OPEX, empleos, capacidad, materiales aceptados, riesgo y fuente de supuestos.

## Modelo De Datos Sugerido

```ts
interface CollectionCenterType {
  id: 'P' | 'M' | 'G'
  nombre: string
  capacidad_ton_dia: number
  superficie_m2: number
  capex_mxn: number
  opex_mensual_mxn: number
  empleos_directos: number
  materiales_aceptados: string[]
}

interface CollectionCenterSite {
  id: string
  municipio_id: string
  zona_id: string
  tipo_id: 'P' | 'M' | 'G'
  lat?: number
  lng?: number
  fase_inicio: number
  mes_inicio: number
  capacidad_ton_dia: number
  restricciones_suelo: string[]
  recicladoras_destino: string[]
  estado: 'propuesto' | 'validacion_suelo' | 'aprobado' | 'operando'
}

interface InfrastructurePlan {
  city_id: string
  centros: CollectionCenterSite[]
  capacidad_por_material: Record<string, number>
  brecha_capacidad_ton_dia: number
  warnings: string[]
}
```

## Endpoints Sugeridos

- `GET /infrastructure/{city_id}/centers`
- `POST /infrastructure/{city_id}/optimize`
- `GET /infrastructure/{city_id}/capacity-by-material`
- `GET /infrastructure/{city_id}/map-sites`
- `POST /infrastructure/{city_id}/center-scenarios`

## Componentes Frontend Sugeridos

- `InfrastructureDecisionPanel`
- `CollectionCenterMixCards`
- `CapacityByMaterialMultilineChart`
- `CenterLocationMap`
- `CenterToRecyclerFlowTable`
- `InfrastructureRiskBanner`

## Relación Con Código Actual

El frontend usa `CA_CONFIG` y `FASES_CA` en `frontend/src/lib/constants.ts`, y el simulador muestra centros en S10. Existe `frontend/src/app/ca-studio/page.tsx`, que puede convertirse en laboratorio técnico conectado al módulo principal. Esta fase debe evitar duplicar lógica: el módulo principal decide; el estudio especializado profundiza.

## Criterios De Aceptación

- Cada centro tiene fase, zona, municipio, capacidad, materiales, costo y estado.
- La UI muestra brecha entre flujo capturable y capacidad instalada.
- La ubicación no se presenta como definitiva si no hay validación de suelo.
- El plan identifica relación centro-recicladora.
- Los documentos exportados incluyen mapa/listado de centros, supuestos y riesgos.

## Riesgos De Mala Implementación

- Optimizar solo por costo y no por cobertura.
- Confundir capacidad de centro con tonelaje total de ciudad.
- Ignorar restricciones de suelo, permisos, accesos y operación.
- Generar centros sin compradores o recicladoras destino.

## Qué NO Hacer

- No presentar ubicaciones como definitivas sin evidencia.
- No meter todos los centros en una sola ZM sin municipio responsable.
- No usar barras estáticas como única visualización.
- No vender TIR de centros como TIR de toda la estrategia.

## Prompt Final Para Agente Codificador

Implementa el módulo `InfraestructuraCentrosAcopio` con `InfrastructurePlan`, `CollectionCenterType` y `CollectionCenterSite`. Reutiliza `CA_CONFIG` como semilla, pero agrega zona, municipio, capacidad por material, brecha de capacidad y relación con recicladoras. Agrega gráfica multilínea capacidad/flujo por residuo y tests que fallen si un centro no tiene municipio, fase, capacidad o estado de validación.
