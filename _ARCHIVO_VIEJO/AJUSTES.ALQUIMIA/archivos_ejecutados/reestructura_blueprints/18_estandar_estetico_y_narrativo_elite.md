# 18 · Estándar Estético y Narrativo Élite

Propósito: blindar la percepción de ALQUIMIA como consultoría senior. Aplica a todo lo que se muestre al usuario (UI, texto, gráficas, diagramas) desde Fase 13 en adelante y se vuelve criterio duro de auditoría.

## Principios no negociables
- Información guiada: cada pantalla debe llevar al usuario de decisión en 3 saltos (contexto → diagnóstico → acción). El resto es material expandible/colapsable.
- Jerarquía visual: 1 solo H1 visible, subtítulos claros, padding generoso (16–24 px), contraste AA mínimo, cards limpias sin “cajas” redundantes.
- Estados obligatorios: loading (skeleton, no spinners), empty (con acción sugerida), error (mensaje técnico + acción), blocked (legal/contrato), warning (riesgo o límite), ready.
- Causalidad y trazabilidad: toda métrica muestra fórmula, unidad, fuente y incertidumbre; toda gráfica declara qué significa y qué NO significa.
- Narrativa de prestigio: prohibido “genérico/placeholder”. Usar lenguaje de perito: “Brecha operativa capturable”, “Impacto proyectado y viabilidad técnica”, “Trazabilidad municipal vigente”.

## Regla de textos y copy
- Titulares: accionables y con alcance (“Plan de infraestructura por zona · simulación propuesta”).
- Ayudas: 2 líneas máximo; anexar cálculo/fuente en línea, no en notas sueltas.
- Etiquetas: usar vocabulario consistente (municipio, zona, mix CA, brecha, impacto, trazabilidad).
- Advertencias: dejar claro si algo es estimado, no oficial o depende de validación municipal.

## Layout y microinteracciones
- Grid 12 col con respiración; evitar tablas densas sin resumen ejecutivo arriba.
- Cards primarias con 16–20 px de padding, bordes suaves, sombras mínimas; secondary info en accordions discretos.
- Botones con estados hover/focus y leyendas específicas (“Recalcular plan”, “Ver trazabilidad”).
- Skeletons lineales para listas/tablas; no usar “Loading…” plano.

## Iconografía y color
- Sistema semántico: éxito (#2D7A0A), warning ámbar (#C47E00), error (#B3261E), info gris azulado (#4B5563). Usar lucide-react; 16–20 px.
- Icono + texto siempre alineados; no depender solo de color para el estado.

## Gráficas y diagramas
- Activar diagrama de causalidad cuando haya más de 3 pasos: entrada → proceso → output → impacto.
- Para Fase 13.1: flujo RSU capturable → capacidad instalada → brecha → centros propuestos → CAPEX/OPEX → impacto operativo. Mostrarlo en una banda visual antes de tablas.
- Toda gráfica incluye: qué representa, fórmula, fuente, unidad y límite de uso.

## Checklist de entrega
- [ ] Jerarquía (H1, subtítulo, resumen ejecutivo con 3 KPIs clave).
- [ ] Estados completos y diferenciados visualmente.
- [ ] Fórmulas, fuentes, incertidumbre visibles en el mismo panel.
- [ ] Advertencia de oficialidad/alcance (simulación vs validado).
- [ ] Diagrama de causalidad cuando aplique.
- [ ] Copy revisado para autoridad (sin placeholders ni lenguaje decorativo).
