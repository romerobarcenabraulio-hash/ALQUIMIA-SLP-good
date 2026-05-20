# GUIA ESTETICA Y TECNICA — FRONTEND ALQUIMIA

> Este documento es la referencia canonica de diseno para todo componente del simulador.
> Todo agente que modifique TSX debe cumplir estas reglas.

## Objetivo Visual

Herramienta institucional de consultoria, planeacion municipal y analisis tecnico.
Comunicar: seriedad publica, precision tecnica, confianza metodologica, limpieza visual, facilidad de lectura, toma de decisiones, nivel consultoria/gobierno/infraestructura.

---

## 1. LAYOUT GENERAL

Estructura fija:
1. Sidebar izquierda verde oscuro (220-260 px)
2. Topbar superior compacta
3. Area principal blanca (flex, mayor parte de pantalla)
4. Rail derecho de consideraciones (260-320 px)
5. Cards centrales con bordes suaves
6. Footer de acciones

Margenes: 24-32 px alrededor del contenido principal.
Separacion entre secciones: 24 px grandes, 12-16 px cards internas.
No usar contenido pegado a los bordes.

---

## 2. FONDO Y SUPERFICIES

Fondo principal: `#FFFFFF`, `#FAFAF7`, `#F8F7F2`

Cards:
```
background: #FFFFFF;
border: 1px solid #E7E5DC;
border-radius: 14px;
box-shadow: 0 1px 2px rgba(0,0,0,0.03);
```

Cards importantes: verde claro `#F1F8EC` / `#EEF7E8` o beige `#F7F3EA` / `#FAF6ED`
Alertas: amarillo `#FFF7E6`, rojo `#FDECEC`
Nunca colores saturados como fondo grande.

---

## 3. PALETA DE COLOR

| Rol | Tokens |
|-----|--------|
| Sidebar | `#0F2F16`, `#12351B`, `#173F22` |
| Verde primario | `#2F6B1F`, `#3E7D27` |
| Verde claro | `#EAF5E4`, `#F1F8EC` |
| Verde exito | `#4E8A2A` |
| Naranja advertencia | `#D98A1E`, `#F2A93B` |
| Rojo riesgo | `#C94A3A`, `#E05A47` |
| Azul informativo | `#2F6DB3` |
| Texto principal | `#1F2933` |
| Texto secundario | `#5F6B5F` |
| Labels | `#8A9286` |

Verde dominante. Naranja/rojo SOLO para alertas reales.

---

## 4. TIPOGRAFIA

**Titulos editoriales:** Serif — Georgia, Literata, Merriweather, Libre Baskerville
**UI/tablas/KPIs/formularios:** Sans — Inter, Manrope, IBM Plex Sans, Source Sans 3, Geist, Plus Jakarta Sans

Combinacion recomendada: Libre Baskerville / Georgia para titulos + Inter / Manrope para UI.

---

## 5. TAMANOS DE LETRA

| Elemento | Tamano | Peso | Extra |
|----------|--------|------|-------|
| Titulo modulo | 28-34 px | 500-600 | line-height: 1.15 |
| Subtitulo modulo | 15-17 px | 500 | color verde/gris oscuro |
| Breadcrumb | 11-12 px | — | uppercase, letter-spacing: 0.06em |
| Titulo seccion | 18-22 px | 500-600 | — |
| Subtitulo seccion | 13-15 px | — | gris medio |
| Texto normal | 14-15 px | — | line-height: 1.5-1.65 |
| Texto secundario | 12-13 px | — | gris |
| Labels | 11-12 px | 600 | uppercase o semibold |
| KPI numero | 22-30 px | 600+ | — |
| KPI label | 11-12 px | — | — |
| Tabla header | 12-13 px | 600 | — |
| Tabla body | 12-14 px | — | minimo 12 px |

---

## 6. JERARQUIA VISUAL (orden por pagina)

1. Titulo claro
2. Subtitulo explicativo
3. KPIs principales
4. Lectura ejecutiva o decision
5. Grafica/tabla protagonista
6. Detalle secundario
7. Acciones
8. Consideraciones en rail derecho

**Regla:** El usuario debe entender la pagina en 10 segundos.

---

## 7. CARDS

- KPI (72-96 px alto): icono + label + numero + microtexto. Max 5-6 por fila.
- Medianas (160-260 px): graficas, lectura, tablas cortas.
- Grandes (320-480 px): mapa, Sankey, PERT, Gantt, matriz de riesgo.

---

## 8. SLIDERS

Compactos: 48-70 px alto total. Track 4-6 px. Thumb 14-18 px.
Incluir: label arriba, valor a la derecha, escala min/max.
Agrupar relacionados. Secciones colapsables si son muchos.

---

## 9. BOTONES

- Primario: verde solido, 40-48 px, border-radius 10-12 px, peso 600
- Secundario: blanco, borde verde/gris
- Terciario: texto solo o gris claro
- Peligro: rojo, solo para eliminar/cancelar/riesgo critico

Solo UN boton primario dominante por seccion.

---

## 10. TABS

40-48 px alto. Activa: fondo blanco/verde claro, borde inferior verde. Inactiva: gris/beige.
Nombres que cuenten la historia, no codigos tecnicos.

---

## 11. TABLAS

Ligeras, no Excel. Headers claros, lineas horizontales suaves, sin bordes verticales fuertes.
Zebra minima. Chips para estados. Max 7-9 columnas visibles. Fila: 40-52 px.
Numeros a la derecha, texto a la izquierda.

---

## 12. GRAFICAS

Claras, no decorativas. Titulos descriptivos, ejes legibles, leyendas simples.
Max 4-5 series. Tooltip al hover. Boton "Ampliar". Lectura ejecutiva al lado.
Alturas: pequena 180-240 px, mediana 280-360 px, protagonista 420-520 px.

---

## 13. MAPAS / SANKEY / PERT / GANTT

Vista principal: limpia, resumen, leyenda, pocos controles, boton "Ampliar".
Modal expandido: filtros, leyenda completa, zoom, lectura, exportar, metodologia, fuente, confianza.

---

## 14. RAIL DERECHO

280-320 px. Contenido: consideraciones, como se calcula, contexto, observamos, decision, que verificar, metodologia, condiciones de lectura, nivel de confianza.
Cards/acordeones suaves. Texto 12-13 px. Titulos 11-12 px semibold uppercase.

---

## 15. BADGES Y CHIPS

24-28 px alto. Padding: 8-12 px. Border-radius: 999 px.
Verde=validado, amarillo=pendiente, rojo=critico, azul=informativo, gris=neutro.

---

## 16. ALERTAS

Discretas pero visibles. 48-80 px. Icono + titulo corto + descripcion + accion.
Colores: azul=info, amarillo=advertencia, rojo=critico, verde=positivo.

---

## 17. FORMULARIOS

Campos: 40-44 px, border-radius 8-10 px, borde gris claro, label arriba.
Textareas: 96-140 px. Pasos y agrupaciones, nunca 30 campos seguidos.

---

## 18. ESPACIADO (multiplos de 4/8)

4 px micro | 8 px interno | 12 px elementos cercanos | 16 px estandar | 24 px entre cards | 32 px entre secciones | 48 px entre bloques grandes.

---

## 19. RESALTAR LO IMPORTANTE

Combinar (NO todo al mismo tiempo): tamano, peso, color, fondo suave, posicion, icono.

---

## 20. LECTURA EJECUTIVA

Obligatoria en cada pagina importante. Titulo: LECTURA EJECUTIVA. 2-4 lineas max.
Explica: que se observa, por que importa, que decision habilita.

---

## 21. MODALES

80-90% ancho, 85-90% viewport alto. Titulo + subtitulo + filtros + visualizacion + lectura + metodologia + fuentes + acciones (exportar, descargar, copiar, cerrar).

---

## 22. DENSIDAD

Vista principal = resumen. Modal = detalle. Tablas: 5-8 filas + "Ver tabla completa".
Explicaciones largas: rail derecho o modal metodologico.

---

## 23. MICROCOPY

Evitar: "Datos", "Informacion", "Resultados", "Detalle".
Preferir: "Que significa", "Que decision habilita", "Que verificar antes de avanzar", "Como se calcula", "Supuesto critico", "Nivel de confianza".

---

## 24. ESTETICA GENERAL

Referencia: consultoria estrategica + software publico moderno + dashboard institucional + SaaS premium + identidad municipal verde (Linear/Vercel/Notion como referencia, pero con identidad propia).

Evitar: apariencia Excel, demasiados bordes, colores saturados, cards gigantes vacias, textos microscopicos, graficas sin explicacion, botones compitiendo, sliders enormes, modulos sin narrativa.

---

## 25. REGLAS FINALES

1. No hardcodear datos
2. No saturar la vista principal
3. Mantener jerarquia clara
4. Tipografia legible y moderna
5. Blanco, verde y grises como base
6. Naranja/rojo solo para riesgo
7. Sliders pequenos y compactos
8. Toda grafica compleja expandible
9. Toda metrica con microexplicacion
10. Toda pagina con lectura ejecutiva
11. Toda seccion responde una pregunta de decision
12. Rail derecho explica supuestos, metodologia y confianza
13. Diseno limpio, serio y catchy
14. Entender que se ve en menos de 10 segundos
15. Herramienta real de implementacion, no simulador bonito
