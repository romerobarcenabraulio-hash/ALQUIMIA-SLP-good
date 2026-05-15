# 09 Motor Financiero ROI

## Propósito

Separar con precisión los negocios, flujos y riesgos financieros de ALQUIMIA para que la simulación sea defendible ante cabildo, inversionistas, recicladoras y equipos técnicos.

## Alcance

Incluye ROI de centros de acopio, ROI de recicladoras, flujos por actividad, precios de compra/venta, sensibilidad, stress test, Monte Carlo de 2000 simulaciones, P10/P50/P90, TIR, VPN, payback, fuentes de precios y trazabilidad de cambios manuales.

## Problema Que Corrige

El riesgo principal es mezclar negocios distintos en un solo ROI: centro de acopio, recicladora, venta final de material, ahorro municipal, carbono y derrama económica no son la misma cuenta. Si se mezclan, el sistema puede verse espectacular pero perder credibilidad.

## Decisiones De Producto

- Separar por lo menos tres capas:
  - Centro de acopio: recepción, separación, compactación, venta a recicladora.
  - Recicladora: compra de material, proceso, producto final.
  - Municipio: ahorro, costo fiscal, externalidades, derrama y beneficio social.
- Cada precio debe tener fuente, fecha, unidad y estado de evidencia.
- Si el usuario cambia precio, el sistema debe registrar si cambió la fuente o si es supuesto manual.
- Monte Carlo debe explicar P10, P50 y P90 en lenguaje humano.
- Stress test y sensibilidad deben correr por negocio, no solo por proyecto agregado.
- TIR, VPN y payback deben decir de qué entidad económica hablan.

## Modelo De Datos Sugerido

```ts
interface PriceReference {
  material: string
  precio_mxn_kg: number
  fuente: string
  fecha: string
  tipo: 'api' | 'oficial' | 'benchmark' | 'manual'
  modificado_por_usuario: boolean
  justificacion_manual?: string
}

interface BusinessCase {
  id: string
  tipo: 'centro_acopio' | 'recicladora' | 'municipio' | 'mixto'
  nombre: string
  capex_mxn: number
  opex_mensual_mxn: number
  ingresos_anuales_mxn: number
  flujo_caja: number[]
  tir_pct: number | null
  vpn_mxn: number | null
  payback_meses: number | null
  warnings: string[]
}

interface MonteCarloResult {
  simulaciones: 2000
  p10: number
  p50: number
  p90: number
  variables_sensibles: string[]
  negocio_id: string
}
```

## Endpoints Sugeridos

- `GET /finance/{city_id}/business-cases`
- `POST /finance/{city_id}/recalculate`
- `POST /finance/{city_id}/price-override`
- `GET /finance/{city_id}/monte-carlo?business_case_id=...`
- `GET /finance/{city_id}/sensitivity?business_case_id=...`

## Componentes Frontend Sugeridos

- `FinanceBusinessTabs`
- `BusinessCaseSummaryCards`
- `PriceReferenceEditor`
- `MonteCarloExplainer`
- `SensitivityByBusinessChart`
- `CashflowByBusinessChart`
- `FinancialAssumptionLedger`

## Relación Con Código Actual

El simulador ya calcula TIR, VPN, EBITDA, payback y precios en `frontend/src/lib/constants.ts` y tipos de `ResultadosCalculados`. También existen módulos de mercado/precolocación. Esta fase debe evitar que esos resultados se presenten como una sola verdad financiera sin separación de negocio.

## Criterios De Aceptación

- Se puede ver ROI separado de centros, recicladoras y municipio.
- Cada precio muestra fuente, fecha, unidad y estado.
- Un cambio manual de precio aparece en trazabilidad y documentos.
- Monte Carlo corre con 2000 simulaciones o explica por qué no se ejecutó.
- P10/P50/P90 se explican en lenguaje para cabildo.
- Los documentos financieros no mezclan derrama económica con flujo de caja del operador.

## Riesgos De Mala Implementación

- Inflar rentabilidad mezclando externalidades con ingresos.
- Presentar precio manual como precio de mercado.
- Ocultar incertidumbre financiera.
- Confundir TIR del centro con TIR municipal.

## Qué NO Hacer

- No mostrar una TIR única si hay varios negocios.
- No usar precios sin unidad.
- No aceptar overrides sin justificación.
- No llamar ingreso a una externalidad social.

## Prompt Final Para Agente Codificador

Reestructura el motor financiero para separar `BusinessCase` por centro de acopio, recicladora y municipio. Implementa `PriceReference` con trazabilidad y overrides justificados. Ajusta UI para tabs por negocio y agrega sensibilidad/Monte Carlo por negocio. Los documentos deben declarar explícitamente a qué entidad pertenece cada TIR, VPN, payback e ingreso.
