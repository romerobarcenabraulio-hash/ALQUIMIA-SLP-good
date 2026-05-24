# GUÍA ESTÉTICA Y TÉCNICA — FRONTEND ALQUIMIA

> Este documento es la referencia canónica de diseño para todo componente del simulador.
> Todo agente que modifique TSX debe cumplir estas reglas.

## Objetivo Visual

Herramienta institucional de consultoría, planeación municipal y análisis técnico.
Comunicar: seriedad pública, precisión técnica, confianza metodológica, limpieza visual, facilidad de lectura, toma de decisiones, nivel consultoría/gobierno/infraestructura.

---

## 1. LAYOUT GENERAL

Estructura fija:
1. Sidebar izquierda verde oscuro (220-260 px)
2. Topbar superior compacta
3. Área principal blanca (flex, mayor parte de pantalla)
4. Rail derecho de consideraciones (260-320 px)
5. Cards centrales con bordes suaves
6. Footer de acciones

Márgenes: 24-32 px alrededor del contenido principal.
Separación entre secciones: 24 px grandes, 12-16 px cards internas.
No usar contenido pegado a los bordes.

---

## 2. FONDO Y SUPERFICIES

Fondo principal (layout): `#FFFFFF` (`surface-base`)

Bloques de dato secundarios: `#F8FAF8` (`surface-muted`) — solo para tips, código y KPIs anidados, nunca como fondo de página.

Cards:
```
background: #FFFFFF;
border-left: 3px solid [color capítulo]; /* preferir barra lateral sobre borde completo */
border-radius: 0;
padding: 20px 24px;
```

Cards importantes: verde claro `#F1F8EC` / `#EEF7E8` para CTAs y alertas positivas
Alertas: amarillo `#FFF7E6`, rojo `#FDECEC`
Nunca colores saturados como fondo grande.
Nunca beige `#F4F2ED` como capa de layout — retirado en favor de blanco homogéneo.

---

## 3. PALETA DE COLOR

| Rol | Tokens |
|-----|--------|
| Sidebar | `#0F2F16`, `#12351B`, `#173F22` |
| Verde primario | `#2F6B1F`, `#3E7D27` |
| Verde claro | `#EAF5E4`, `#F1F8EC` |
| Verde éxito | `#4E8A2A` |
| Naranja advertencia | `#D98A1E`, `#F2A93B` |
| Rojo riesgo | `#C94A3A`, `#E05A47` |
| Azul informativo | `#2F6DB3` |
| Capítulo 4 (próximos sectores) | `#4A1C7A` |
| Texto principal | `#1F2933` |
| Texto secundario | `#5F6B5F` |
| Labels | `#8A9286` |

Verde dominante. Naranja/rojo SOLO para alertas reales.

---

## 4. TIPOGRAFÍA

**Títulos editoriales:** Serif — Georgia, Literata, Merriweather, Libre Baskerville
**UI/tablas/KPIs/formularios:** Sans — Inter, Manrope, IBM Plex Sans, Source Sans 3, Geist, Plus Jakarta Sans

Combinación recomendada: Libre Baskerville / Georgia para títulos + Inter / Manrope para UI.

---

## 5. TAMAÑOS DE LETRA

| Elemento | Tamaño | Peso | Extra |
|----------|--------|------|-------|
| Título módulo | 28-34 px | 500-600 | line-height: 1.15 |
| Subtítulo módulo | 15-17 px | 500 | color verde/gris oscuro |
| Breadcrumb | 11-12 px | — | uppercase, letter-spacing: 0.06em |
| Título sección | 18-22 px | 500-600 | — |
| Subtítulo sección | 13-15 px | — | gris medio |
| Texto normal | 14-15 px | — | line-height: 1.5-1.65 |
| Texto secundario | 12-13 px | — | gris |
| Labels | 11-12 px | 600 | uppercase o semibold |
| KPI número | 22-30 px | 600+ | — |
| KPI label | 11-12 px | — | — |
| Tabla header | 12-13 px | 600 | — |
| Tabla body | 12-14 px | — | mínimo 12 px |

---

## 6. JERARQUÍA VISUAL (orden por página)

1. Título claro
2. Subtítulo explicativo
3. KPIs principales
4. Lectura ejecutiva o decisión
5. Gráfica/tabla protagonista
6. Detalle secundario
7. Acciones
8. Consideraciones en rail derecho

**Regla:** El usuario debe entender la página en 10 segundos.

---

## 7. CARDS

- KPI (72-96 px alto): icono + label + número + microtexto. Max 5-6 por fila.
- Medianas (160-260 px): gráficas, lectura, tablas cortas.
- Grandes (320-480 px): mapa, Sankey, PERT, Gantt, matriz de riesgo.

---

## 8. SLIDERS

Compactos: 48-70 px alto total. Track 4-6 px. Thumb 14-18 px.
Incluir: label arriba, valor a la derecha, escala min/max.
Agrupar relacionados. Secciones colapsables si son muchos.

---

## 9. BOTONES

- Primario: verde sólido, 40-48 px, border-radius 10-12 px, peso 600
- Secundario: blanco, borde verde/gris
- Terciario: texto solo o gris claro
- Peligro: rojo, solo para eliminar/cancelar/riesgo crítico

Solo UN botón primario dominante por sección.

---

## 10. TABS

40-48 px alto. Activa: fondo blanco/verde claro, borde inferior verde. Inactiva: gris/beige.
Nombres que cuenten la historia, no códigos técnicos.

---

## 11. TABLAS

Ligeras, no Excel. Headers claros, líneas horizontales suaves, sin bordes verticales fuertes.
Zebra mínima. Chips para estados. Max 7-9 columnas visibles. Fila: 40-52 px.
Números a la derecha, texto a la izquierda.

---

## 12. GRÁFICAS

Claras, no decorativas. Títulos descriptivos, ejes legibles, leyendas simples.
Max 4-5 series. Tooltip al hover. Botón "Ampliar". Lectura ejecutiva al lado.
Alturas: pequeña 180-240 px, mediana 280-360 px, protagonista 420-520 px.

---

## 13. MAPAS / SANKEY / PERT / GANTT

Vista principal: limpia, resumen, leyenda, pocos controles, botón "Ampliar".
Modal expandido: filtros, leyenda completa, zoom, lectura, exportar, metodología, fuente, confianza.

---

## 14. RAIL DERECHO

280-320 px. Contenido: consideraciones, cómo se calcula, contexto, observamos, decisión, qué verificar, metodología, condiciones de lectura, nivel de confianza.
Cards/acordeones suaves. Texto 12-13 px. Títulos 11-12 px semibold uppercase.

---

## 15. BADGES Y CHIPS

24-28 px alto. Padding: 8-12 px. Border-radius: 999 px.
Verde=validado, amarillo=pendiente, rojo=crítico, azul=informativo, gris=neutro.

---

## 16. ALERTAS

Discretas pero visibles. 48-80 px. Icono + título corto + descripción + acción.
Colores: azul=info, amarillo=advertencia, rojo=crítico, verde=positivo.

---

## 17. FORMULARIOS

Campos: 40-44 px, border-radius 8-10 px, borde gris claro, label arriba.
Textareas: 96-140 px. Pasos y agrupaciones, nunca 30 campos seguidos.

---

## 18. ESPACIADO (múltiplos de 4/8)

4 px micro | 8 px interno | 12 px elementos cercanos | 16 px estándar | 24 px entre cards | 32 px entre secciones | 48 px entre bloques grandes.

---

## 19. RESALTAR LO IMPORTANTE

Combinar (NO todo al mismo tiempo): tamaño, peso, color, fondo suave, posición, icono.

---

## 20. LECTURA EJECUTIVA

Obligatoria en cada página importante. Título: LECTURA EJECUTIVA. 2-4 líneas max.
Explica: qué se observa, por qué importa, qué decisión habilita.

---

## 21. MODALES

80-90% ancho, 85-90% viewport alto. Título + subtítulo + filtros + visualización + lectura + metodología + fuentes + acciones (exportar, descargar, copiar, cerrar).

---

## 22. DENSIDAD

Vista principal = resumen. Modal = detalle. Tablas: 5-8 filas + "Ver tabla completa".
Explicaciones largas: rail derecho o modal metodológico.

---

## 23. MICROCOPY

Evitar: "Datos", "Información", "Resultados", "Detalle".
Preferir: "Qué significa", "Qué decisión habilita", "Qué verificar antes de avanzar", "Cómo se calcula", "Supuesto crítico", "Nivel de confianza".

---

## 24. ESTÉTICA GENERAL

Referencia: consultoría estratégica + software público moderno + dashboard institucional + SaaS premium + identidad municipal verde (Linear/Vercel/Notion como referencia, pero con identidad propia).

Evitar: apariencia Excel, demasiados bordes, colores saturados, cards gigantes vacías, textos microscópicos, gráficas sin explicación, botones compitiendo, sliders enormes, módulos sin narrativa.

---

## 25. REGLAS FINALES

1. No hardcodear datos
2. No saturar la vista principal
3. Mantener jerarquía clara
4. Tipografía legible y moderna
5. Blanco, verde y grises como base
6. Naranja/rojo solo para riesgo
7. Sliders pequeños y compactos
8. Toda gráfica compleja expandible
9. Toda métrica con microexplicación
10. Toda página con lectura ejecutiva
11. Toda sección responde una pregunta de decisión
12. Rail derecho explica supuestos, metodología y confianza
13. Diseño limpio, serio y catchy
14. Entender qué se ve en menos de 10 segundos
15. Herramienta real de implementación, no simulador bonito

---

## 26. COPY EDITORIAL (SIMULADOR FUNCIONARIO)

**Idioma canónico:** español institucional. Reservar inglés para siglas normativas (GRI, ESRS, EVM) con glosa en español en la primera mención.

**Un módulo = un nombre:** nav, header, guía M00, rail y export PDF deben usar el mismo `label` del registry y el mismo `title` del brief.

**Fuentes de copy:**

| Campo | Fuente |
|-------|--------|
| `label`, `decision`, `evidence`, `next_action` | `clientModuleRegistry.ts` |
| `title`, metodología, consideraciones | `moduleEditorialBriefs.ts` |
| Narrativa M00 | `GuiaCircularidadStack.tsx` |

**Lista negra (prohibido en copy usuario):**

| Prohibido | Sustituir por |
|-----------|---------------|
| Steps for Circularity / ALQUIMIA Platform (H1) | Pasos hacia la circularidad / Plataforma ALQUIMIA |
| consultor senior / deja dinero sobre la mesa | equipo técnico / pierde elegibilidad |
| Lo que no se mide no se mejora | El monitoreo comparará proyección vs. real |
| tú / Decláralos / elegiste | usted / Deben declararse / seleccionado |
| basura (contexto técnico) | RSU / residuos sólidos urbanos |
| Narrativa en 5 pasos | 4 capítulos · 35 módulos |
| Referencias M obsoletas (M04 infra, S4.6) | Derivar de `MODULE_NUMBERS` en `chapterConfig.ts` |

**Rail derecho:** la etiqueta del bloque «siguiente acción» se deriva de `getRailActionLabel()` — financiero (Cabildo), jurídico (Periódico Oficial), operativo, recorrido (M00).

**Tests CI:** `editorialInventory.test.ts` valida briefs completos, strings prohibidos y ausencia de overrides en enrichment.
