# 18 · Estética Causal Dinámica

Propósito: reemplazar texto denso por visualizaciones que muestren causalidad y decisiones en 3 saltos (contexto → diagnóstico → acción). Aplica a Fases 12.x, 13.1 y sucesivas.

## Lineamientos
- Diagramas obligatorios cuando hay más de 3 pasos: entrada → proceso → output → impacto. Usar iconografía de economía circular (flujo, reciclaje, brecha).
- Cada gráfica declara: qué representa, fórmula, unidad, fuente, incertidumbre y límite de uso.
- Estados visuales diferenciados: skeleton, empty con CTA, error rojo técnico+acción, blocked ámbar con `next_action`, warning ámbar.
- Jerarquía: H1 único, subtítulo con alcance, banda de KPIs arriba, detalles plegables.
- Interacciones: tooltips breves, chips de oficialidad (simulación/propuesta/validado), badges de riesgo/alcance.

## Criterios de aceptación
- Diagrama de causalidad visible en el primer pliegue de cada módulo crítico.
- KPIs acompañados de help text (2 líneas) y trazabilidad (fórmula+fuente).
- Ningún estado comparte el mismo tratamiento visual; siempre hay acción siguiente.
- Compatible con export estático y dev.
