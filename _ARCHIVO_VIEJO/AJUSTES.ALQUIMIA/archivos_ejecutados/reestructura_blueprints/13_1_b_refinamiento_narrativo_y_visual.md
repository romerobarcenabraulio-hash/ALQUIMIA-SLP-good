# 13.1.b · Refinamiento narrativo y visual (Centros de Acopio)

Objetivo: llevar la UI de infraestructura (S13.1) al nivel de consultoría senior, sin tocar contratos backend. Aplica inmediatamente después de la entrega técnica actual.

## Alcance
- Hero ejecutivo con badge “Simulación propuesta” y banda de 3 KPIs (brecha t/día, cobertura %, CAPEX/OPEX estimados) con tooltips de fuente/supuestos.
- Diagrama causal compacto: RSU capturable → capacidad instalada → brecha → centros propuestos → CAPEX/OPEX → impacto (m², empleos); visible antes de tablas.
- Estados enriquecidos: skeleton lineal; empty con CTA “Configura mix P/M/G”; error rojo con “Reintentar cálculo”; blocked ámbar con icono y `next_action`; warning con icono.
- Trazabilidad: bloque “Trazabilidad del cálculo” con fórmula, unidad, fuente, incertidumbre; brecha positiva en ámbar, negativa en verde.
- Narrativa de prestigio: copy de autoridad (simulación/propuesta, estimación CA_CONFIG), sin lenguaje de “mock”.

## Criterios de aceptación
- Checklist completo de `18_estetica_causal_dinamica.md` y `18_estandar_estetico_y_narrativo_elite.md`.
- Diagrama presente, legible y coherente con los datos.
- Estados diferenciados y con acción siguiente explícita.
- Funciona en dev y en export estático (`audit_visual_maqueta/`).
