# 19 · Refactorización Estética y Causal (Infraestructura 13.1)

Objetivo: elevar `CentrosAcopio` (S13.1) a estándar de consultoría senior, con causalidad visible y estados diferenciados. No toca contratos backend; solo UI/UX y narrativa conectada a datos existentes.

## Alcance
- Hero ejecutivo con badge “Simulación propuesta” + banda de 3 KPIs (brecha t/día, cobertura %, CAPEX/OPEX estimados) y tooltips de fuente/supuestos.
- Diagrama compacto RSU capturable → capacidad instalada → brecha → centros propuestos → CAPEX/OPEX → impacto (m², empleos). Debe ser visible antes de tablas y compatible con estático/export.
- Estados ricos: skeleton lineal para tarjetas/tablas; empty con CTA “Configura mix P/M/G”; error en rojo con acción “Reintentar cálculo”; blocked en ámbar con icono + `next_action`; warning con icono y tono ámbar.
- Tarjetas P/M/G: chip “propuesto/instalado”, icono de capacidad, tooltip de costo marginal, microcopy que aclare que TIR es estimada del centro (no de la estrategia).
- Panel de brecha: bloque “Trazabilidad del cálculo” con fórmula, unidad, fuente, incertidumbre; brecha positiva en ámbar, negativa en verde; help text ≤ 2 líneas.
- Fases/KPIs: evitar tabla densa; badges de fase, cobertura y fuente “CA_CONFIG ALQUIMIA (confianza media)”; plegable/accordion opcional para detalle.

## Criterios de aceptación
- Checklists del archivo `18_estandar_estetico_y_narrativo_elite.md` cumplidos: jerarquía clara, estados diferenciados, trazabilidad visible, advertencia de oficialidad/alcance.
- Diagrama de causalidad presente y legible sin scroll excesivo.
- Copy con tono de consultoría (sin “mock”, sin neutro técnico plano).
- Funciona en export estático (`audit_visual_maqueta/`) y en dev; sin romper llamadas a `/infrastructure/plan`.
