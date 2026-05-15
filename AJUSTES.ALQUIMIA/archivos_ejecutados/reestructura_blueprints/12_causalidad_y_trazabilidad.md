# 12 Causalidad Y Trazabilidad

## Propósito

Rediseñar la trazabilidad para que una persona entienda de dónde salió cada dato, qué cálculo lo usó, qué decisión depende de él y qué evidencia respalda cada afirmación documental.

## Alcance

Incluye fuente, cálculo, decisión dependiente, estado de evidencia, ClaimLedger, preguntas frecuentes, explicación humana y reemplazo de grafos innecesarios.

## Problema Que Corrige

La trazabilidad técnica puede volverse un grafo difícil de leer. Si el usuario no entiende la relación dato-cálculo-decisión-documento, la trazabilidad existe en código pero no en confianza pública.

## Decisiones De Producto

- La visualización principal debe ser una explicación guiada, no un grafo por defecto.
- Cada afirmación importante debe tener ClaimLedger.
- Cada KPI debe mostrar fuente, fórmula y decisión impactada.
- Los estados permitidos son: verificado, estimado, benchmark, manual, bloqueado.
- Un grafo puede existir como vista avanzada, no como explicación principal.
- La sección debe responder preguntas frecuentes prefabricadas.

## Modelo De Datos Sugerido

```ts
interface TraceableDecision {
  id: string
  decision: string
  datos_usados: string[]
  calculos_usados: string[]
  documentos_afectados: string[]
  evidencia_estado: 'verificado' | 'estimado' | 'benchmark' | 'manual' | 'bloqueado'
  explicacion_humana: string
}

interface ClaimLedgerEntry {
  claim_id: string
  texto_claim: string
  documento_id: string
  fuente_ids: string[]
  kpi_ids: string[]
  estado: 'soportado' | 'pendiente_fuente' | 'bloqueado' | 'manual'
}
```

## Endpoints Sugeridos

- `GET /reasoning/{city_id}/trace`
- `GET /reasoning/{city_id}/decision/{decision_id}`
- `GET /reasoning/{city_id}/claim-ledger`
- `POST /reasoning/explain`

## Componentes Frontend Sugeridos

- `HumanTraceabilityPanel`
- `DecisionEvidenceCards`
- `ClaimLedgerTable`
- `TraceabilityFAQ`
- `AdvancedReasoningGraphToggle`

## Relación Con Código Actual

Ya existen `reasoningGraph`, `DecisionExplanation` y endpoints `/reasoning/graph` y `/reasoning/explain`. También existe ClaimLedger en AGORA. Esta fase debe integrar ambos mundos para que la trazabilidad llegue a UI y documentos.

## Criterios De Aceptación

- Una decisión puede rastrearse a datos, cálculos, documentos y evidencia.
- ClaimLedger se puede consultar antes de exportar.
- La UI no depende de un grafo para ser entendible.
- Cada estado de evidencia tiene explicación.
- Los documentos exportan anexo de fuentes y ClaimLedger.

## Riesgos De Mala Implementación

- Mantener un grafo bonito pero inútil.
- Crear ClaimLedger solo al exportar y no durante decisión.
- Mostrar fuentes sin explicar qué decisión sostienen.
- Confundir datos verificados con benchmarks.

## Qué NO Hacer

- No mostrar grafos por defecto si no ayudan a decidir.
- No permitir claims sin fuente en documentos defendibles.
- No usar “trazable” como etiqueta decorativa.
- No esconder cambios manuales.

## Prompt Final Para Agente Codificador

Implementa `HumanTraceabilityPanel` y endpoints de `TraceableDecision`. Conecta `reasoningGraph`, `DecisionExplanation`, `DataProvenance` y ClaimLedger para que cada KPI/decisión/documento tenga fuente y estado. El grafo debe quedar como vista avanzada. Agrega tests para impedir documentos defendibles con claims sin evidencia.
