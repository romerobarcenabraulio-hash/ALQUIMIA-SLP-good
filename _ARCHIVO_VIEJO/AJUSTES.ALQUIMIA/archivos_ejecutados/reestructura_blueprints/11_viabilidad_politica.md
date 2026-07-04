# 11 Viabilidad Política

## Propósito

Explicar si un plan es políticamente viable sin convertir el score en una caja negra. El score debe orientar decisiones de cabildo, no reemplazarlas.

## Alcance

Incluye ambición, payback vs periodo de gobierno, empleos, costo fiscal, formalización, riesgo legal, beneficio ciudadano, explicación para cabildo y trazabilidad de componentes.

## Problema Que Corrige

Un score político único puede parecer arbitrario o manipulable. La plataforma debe explicar qué mide, qué no mide, qué evidencia lo sostiene y cómo se puede mejorar.

## Decisiones De Producto

- El score debe descomponerse en componentes visibles.
- Cada componente debe tener ponderación, valor, razón y evidencia.
- El score no debe prometer aprobación política; debe medir defendibilidad y riesgo.
- Debe existir un modo “explicar a cabildo” con lenguaje institucional.
- El riesgo legal debe afectar el score sin destruir la utilidad: se muestra como bloqueo desbloqueable.

## Modelo De Datos Sugerido

```ts
interface PoliticalScoreComponent {
  id: string
  nombre: string
  ponderacion: number
  puntaje: number
  razon: string
  evidencia: string[]
  accion_para_mejorar?: string
}

interface PoliticalViabilityScore {
  ciudad_id: string
  score_total: number
  categoria: 'baja' | 'media' | 'alta' | 'muy_alta'
  componentes: PoliticalScoreComponent[]
  riesgos: string[]
  mensaje_cabildo: string
}
```

## Endpoints Sugeridos

- `GET /political/{city_id}/score`
- `POST /political/{city_id}/recalculate`
- `GET /political/{city_id}/cabildo-brief`

## Componentes Frontend Sugeridos

- `PoliticalScoreBreakdown`
- `CabildoExplanationPanel`
- `PoliticalRiskActions`
- `ScoreComponentEvidenceDrawer`

## Relación Con Código Actual

El tipo `ResultadosCalculados` ya contempla `scorePolitico`. La reestructura exige que ese número deje de ser una cifra agregada sin explicación y se convierta en un objeto auditable con componentes.

## Criterios De Aceptación

- El score total se puede reconstruir desde componentes.
- Cada componente tiene evidencia y acción de mejora.
- La explicación para cabildo no usa lenguaje de caja negra.
- El riesgo legal aparece con acción de desbloqueo.
- El score no se exporta como garantía de aprobación.

## Riesgos De Mala Implementación

- Crear un score opaco.
- Sobreponderar beneficios sin costo fiscal.
- Ignorar bloqueos jurídicos.
- Usar lenguaje político promocional en vez de técnico.

## Qué NO Hacer

- No prometer viabilidad política.
- No ocultar ponderaciones.
- No mezclar popularidad con defendibilidad técnica.
- No presentar el score como dictamen.

## Prompt Final Para Agente Codificador

Reemplaza `scorePolitico` plano por `PoliticalViabilityScore` con componentes auditables. Mantén compatibilidad con cálculos existentes, pero expón ponderación, evidencia y acciones de mejora. Agrega UI para explicar el score a cabildo y tests que fallen si el score no puede reconstruirse desde sus componentes.
