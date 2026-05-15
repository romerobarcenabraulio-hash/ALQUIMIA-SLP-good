# 20 · Ajuste Narrativo Institucional (Simulador completo)

Objetivo: sustituir lenguaje de “programador” por narrativa de consultoría y gobernanza municipal. Aplica a módulos visibles en `simulator` (12.x, 13.1, legales y exportables). No modifica cálculos ni contratos, solo textos, etiquetas y ayudas.

## Alcance prioritario
- `CentrosAcopio.tsx`: titulares con alcance (“con trazabilidad municipal”), badges de oficialidad (simulación/propuesta), ayuda de 2 líneas, advertencia de estimación CA_CONFIG.
- `AdvertenciasGateLegal.tsx`: chips “propuesta/definitivo”, oficialidad explícita, distinción educativo vs sanción, colores semánticos alineados al estándar 18.
- `page.tsx`: ancla que introduzca S13.1 como “Infraestructura con gate municipal”; plegar detalle operativo para evitar scroll plano.
- Textos transversales: reemplazar “resultados” por “Impacto proyectado y viabilidad técnica”; “error” por “incidencia operativa”; “loading” por “calculando escenario”.

## Léxico controlado
- Usar: “brecha operativa capturable”, “trazabilidad municipal vigente”, “simulación propuesta”, “validación competente pendiente”, “impacto operativo”.
- Evitar: “mock”, “placeholder”, “demo”, “listo”, “datos estimados” sin fuente.

## Criterios de aceptación
- Todas las ayudas mencionan fuente, unidad, incertidumbre o alcance cuando haya números.
- Advertencias legales y de infraestructura declaran si el estado es simulación, propuesta o bloqueado por legal.
- Sin textos genéricos en estados: cada estado indica acción siguiente (CTA breve).
- Mantener compatibilidad con export estático y con el dev server del Ejecutor.
