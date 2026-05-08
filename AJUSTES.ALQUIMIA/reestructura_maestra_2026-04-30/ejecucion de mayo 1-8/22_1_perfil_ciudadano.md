# 22.1 · Perfil Ciudadano — "¿Por qué es mi problema?"

Propósito: traducir RSU y circularidad en un relato emotivo, claro y empoderador. El ciudadano debe entender en menos de 3 saltos qué genera, qué impacto tiene su acción y dónde se materializa.

## Módulos visibles
- `city_baseline`: hero + `FuentesDatos` (resumido).
- `municipal_context`: `MarcoLegal` (sólo educación) + `CoberturaNacional` (referencia visual).
- `citizen_inputs`: `EducacionCiudadana`, `ComposicionRSU`, `TipoVivienda`.
- `impact_finance` (versión lite): solo `ImpactoAmbiental` y `MultiplicadoresEco` con NarrativeBridge.
- Ocultos para esta audiencia: `infrastructure_operations`, `future_goals`, `scenarios_export`, `market_traceability`.

## Tono y léxico
- Emotivo, claro, empoderador. Sin jerga financiera.
- Ejemplos de frases:
  - "Tu colonia genera X kg/día. Si separas en orgánico/inorgánico, ahorras Y a tu municipio."
  - "Cada bolsa correctamente clasificada baja Z gCO₂e."
- Evitar: "TIR", "Monte Carlo", "ROI", "Payback".

## NarrativeBridge requerido
- En `EducacionCiudadana`: "Lo que ves aquí significa que tu municipio…". Conecta con `ComposicionRSU` como acción siguiente.
- En `ImpactoAmbiental`: "Si tu colonia mantiene este patrón, la huella anual es…". Conecta con `MultiplicadoresEco`.

## Criterios de aceptación
- Solo se ven los módulos listados.
- Ningún copy menciona ROI/TIR/Monte Carlo.
- Cada módulo principal tiene NarrativeBridge con valor conectado al store.
