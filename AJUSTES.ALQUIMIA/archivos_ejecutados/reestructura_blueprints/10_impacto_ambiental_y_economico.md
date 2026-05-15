# 10 Impacto Ambiental Y Económico

## Propósito

Presentar el impacto ambiental y económico de forma clara, verificable y no tediosa, conectando mitigación, salud pública, formalización, empleo, derrama local y beneficios fiscales.

## Alcance

Incluye reducción de emisiones, nota introductoria de mitigación, impacto variable por ciudad, empleos, cadena de suministro, ingresos fiscales, valor de propiedad, formalización, ahorro de salud pública y presentación visual.

## Problema Que Corrige

Los impactos pueden parecer cifras grandes sin contexto. Si no se explica qué dato alimenta cada indicador y qué tan defendible es, el impacto se percibe como marketing. La sección debe ser técnica y humana a la vez.

## Decisiones De Producto

- Separar impacto ambiental, económico y social.
- Mostrar primero la interpretación, luego los números.
- Cada KPI debe tener fuente, fórmula resumida, unidad y estado de evidencia.
- El impacto debe variar por ciudad y composición real de residuos.
- Evitar equivalencias ambientales exageradas si no hay fuente clara.
- Presentar derrama económica como multiplicador, no como flujo de caja del proyecto.

## Modelo De Datos Sugerido

```ts
interface ImpactKPI {
  id: string
  categoria: 'ambiental' | 'economico' | 'social' | 'salud'
  nombre: string
  valor: number
  unidad: string
  fuente: string
  formula_resumen: string
  evidencia_estado: 'verificado' | 'estimado' | 'benchmark' | 'manual' | 'bloqueado'
}

interface LocalEconomicImpact {
  ciudad_id: string
  cadena_suministro_mxn: number
  empleos_directos: number
  empleos_indirectos: number
  ingresos_fiscales_mxn: number
  formalizacion_personas: number
  valor_propiedad_mxn?: number
  warnings: string[]
}
```

## Endpoints Sugeridos

- `GET /impact/{city_id}/environmental`
- `GET /impact/{city_id}/economic`
- `GET /impact/{city_id}/kpis`
- `POST /impact/{city_id}/recalculate`

## Componentes Frontend Sugeridos

- `ImpactNarrativeHeader`
- `EnvironmentalMitigationPanel`
- `LocalEconomicImpactGrid`
- `ImpactKPITraceCards`
- `FormalizationImpactPanel`
- `ImpactEvidenceTooltip`

## Relación Con Código Actual

El sistema ya calcula CO2e, empleos y multiplicadores económicos. Existen componentes como `MultiplicadoresEco.tsx`. Debe hacerse más defendible: cada KPI debe estar conectado a proveniencia y ClaimLedger.

## Criterios De Aceptación

- Cada KPI tiene fuente, unidad y estado de evidencia.
- La UI distingue impacto ambiental, económico y social.
- Las equivalencias se muestran solo con fuente clara.
- Los documentos no usan cifras sin ClaimLedger.
- El usuario puede entender por qué el impacto cambia por ciudad.

## Riesgos De Mala Implementación

- Usar cifras enormes sin explicación.
- Duplicar beneficios en varias categorías.
- Presentar derrama como ingreso directo.
- Ocultar que algunos impactos son estimaciones.

## Qué NO Hacer

- No usar equivalencias ambientales decorativas sin respaldo.
- No sumar externalidades al ROI privado.
- No presentar impacto nacional si el cálculo es municipal.
- No escribir frases triunfalistas sin fuente.

## Prompt Final Para Agente Codificador

Implementa una capa de `ImpactKPI` con fuente, fórmula y estado de evidencia para impacto ambiental, económico, social y salud. Conecta estos KPIs a proveniencia y ClaimLedger. Ajusta la UI para explicar primero la interpretación y luego los números. Agrega tests para impedir KPIs exportables sin unidad, fuente o estado de evidencia.
