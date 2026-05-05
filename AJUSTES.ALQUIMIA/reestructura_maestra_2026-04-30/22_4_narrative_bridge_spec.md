# 22.4 · NarrativeBridge — Especificación del componente

Propósito: estandarizar el "pegamento" narrativo entre cálculo y acción siguiente. Sin este puente, la fase 22.x se considera FALLIDA.

## Contrato del componente

```ts
type NarrativeBridgeVariant = 'result' | 'warning' | 'bridge'

interface NarrativeBridgeProps {
  kicker: string                  // S22 · Lectura del modelo
  title?: string                  // opcional, hero corto
  summary: string | (() => string) // texto principal (preferentemente derivado de datos)
  evidence?: Array<{ label: string; value: string }> // 2–4 chips numéricos
  nextStep?: { label: string; helper?: string; href?: string }
  variant?: NarrativeBridgeVariant
  source?: { fuente: string; unidad?: string; incertidumbre?: string }
  audience?: 'citizen' | 'functionary' | 'entrepreneur'
}
```

- `summary` debe construirse a partir del `simulatorStore` o de la respuesta API; está prohibido pasar copy estático sin variables.
- `evidence` lista métricas críticas (máx. 4 chips) con unidad explícita.
- `nextStep` empuja al usuario al siguiente módulo dentro de su audiencia.
- `source` es obligatorio cuando `summary` cita un número con incertidumbre (mantiene el estándar 18/19).

## Variantes

- `result`: lectura post-cálculo (verde sutil). Usar tras un chart cuantitativo.
- `warning`: alerta o riesgo (ámbar). Usar cuando hay incertidumbre alta o gate bloqueado.
- `bridge`: transición pura entre módulos (gris/serif). Usar para empujar al siguiente paso.

## Plantillas por tipo de cálculo

### RSU (baseline / capturable)
- "Tu municipio captura X t/día de los Y t/día generados (cobertura Z%). La brecha sugiere…"

### Monte Carlo (financiero)
- "Bajo 2,000 simulaciones, el TIR mediano es X% con P10–P90 entre A% y B%. El peor escenario mantiene payback ≤ K meses."

### Tornado (sensibilidad)
- "Las variables más sensibles son [v1, v2]. Una variación de ±10% mueve el TIR en ΔP puntos."

### ROI / Waterfall
- "Los componentes positivos son …; los negativos …; el resultado neto se proyecta en MXN N en horizonte H años."

### Sankey (flujos de residuos)
- "El X% del flujo se canaliza a [centro/recicladora]. La fuga relevante es Y t/año hacia [destino]."

### Timeline (PER / Implementación)
- "El PER inicia en mes M y se estabiliza en mes M+K. Hito crítico: …"

## Reglas para Ejecutor
- Cada NarrativeBridge debe estar **inmediatamente debajo** del cálculo o entre dos charts.
- Está prohibido renderizar un cálculo complejo sin un NarrativeBridge en la misma vista.
- Está prohibido usar NarrativeBridge como decoración: si no aporta lectura/acción, se elimina.
- `summary` debe responder a "qué significa esto para mi audiencia" en menos de 220 caracteres.
