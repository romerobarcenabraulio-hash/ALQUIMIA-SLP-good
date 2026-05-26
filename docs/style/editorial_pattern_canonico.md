# Patrón editorial canónico EIDOS (referencia M13 / rejilla)

**Fuente de verdad en código:** `ImpactoFinanciero.tsx` — bloque `NarrativeBridge` bajo la rejilla de stress test.

## Estructura obligatoria (2–3 oraciones)

1. **Cifra concreta en línea** — ancla el párrafo a datos del escenario activo (VPN, TIR, CO₂e, IPC, score, etc.).
2. **Condicional accionable** — «Si X … entonces Y»; indica qué revisar o qué no presentar aún.
3. **Conclusión operativa** — siguiente paso en el journey (módulo destino, gate, expediente).

## Ejemplo canónico (M13 — rejilla de combinaciones)

> La rejilla contrasta choques de volumen y precios respecto al caso base (VPN $X, TIR Y%). **Si** la mayoría de celdas permanece verde, la estructura aguanta shocks coordinados; **si** predominan tonos adversos, prioriza contratos indexados o hedges simples.

Componente: `NarrativeBridge` con `evidence[]` (4 KPIs) y `source.fuente`.

## Cuándo aplicarlo

| Situación | Acción |
|-----------|--------|
| Grid de **4+ KPIs** sin párrafo de cierre | Añadir `NarrativeBridge` inmediatamente debajo |
| Bloque bajo gráfica o tabla | Misma regla |
| Brief en `moduleEditorialBriefs.ts` | `criterio_decision` y `observacion_alquimia` deben incluir territorio + cifra o supuesto crítico |

## Prohibiciones (filtro anti-IA)

- «Es importante destacar», «Cabe mencionar», «En este sentido»
- «Adicionalmente», «Asimismo», «Obviamente»
- «Robusto» como adjetivo vacío

## Glosario canónico (P4)

| Usar | No usar |
|------|---------|
| Centro de acopio | nodo, punto de captación |
| Fracción | material (salvo cita normativa) |
| Valorización | valoración, aprovechamiento |
| Gate | hito, milestone (salvo cronología histórica M00B) |
| Cadena de custodia / matriz de fuentes | trazabilidad, tracking (salvo módulo M19 dedicado) |

## Implementación técnica

```tsx
<NarrativeBridge
  variant="bridge" | "warning"
  summary={`Cifra … Si condición … conclusión operativa.`}
  evidence={[
    { label: '…', value: '…' },
    // 4 ítems máximo
  ]}
  source={{ fuente: '…', incertidumbre: '…' }}
  nextStep={{ label: '…' }}
/>
```

Los `summary` deben derivar del store (`useSimulatorStore`) — no copy estático intercambiable entre módulos.

## Bloque maestro TIR múltiples (M13)

`TirMultipleExplainer.tsx` usa `getEtiquetaNarrativaCiudad` y `resultados.tir` del escenario activo — válido para cualquier municipio o ZM, sin anclar a una ciudad piloto.
