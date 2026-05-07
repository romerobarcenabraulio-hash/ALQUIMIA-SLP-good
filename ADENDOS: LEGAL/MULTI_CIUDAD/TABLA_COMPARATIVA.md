# TABLA COMPARATIVA MULTI-CIUDAD
## Mapa de artículos por reglamento — programa de separación en cinco fracciones

**trace:** CLC-MULTI-CIUDAD  
**Estado:** `[BORRADOR — pendiente de carga de PDFs de reglamentos por el CSA]`

---

> **Instrucción de uso:** cada columna `📄 VERIFICAR` se actualiza cuando el CSA cargue el PDF del reglamento de esa ciudad. El texto de los adendos no cambia — solo el número del artículo donde se insertan.

---

## Mapa de artículos por ciudad

> **Clave:** ✅ Verificado en PDF · `[📄 VERIFICAR]` = pendiente PDF · `[NO EXISTE]` = artículo a crear nuevo

| Adendo | Contenido | **SLP** | **Querétaro** | **Monterrey** | **San Pedro G.G.** | **Soledad G.S.** | **Corregidora** | **El Marqués** |
|---|---|---|---|---|---|---|---|---|
| **1 — Definiciones** | Condominio, administración, centro de acopio, 5 fracciones | **Art. 4** (adición fracciones) `[📄 PDF pendiente]` | Art. `[📄]` | **Art. 3** ✅ (verificado — 35 fracs.) | Art. `[📄]` | Art. 1 (nuevo) | Art. `[📄]` | Art. `[📄]` |
| **2 — Esquemas condominio** | Modelos A y B de recolección | **Art. 20 Bis** `[NO EXISTE]` `[📄 PDF pendiente]` | Art. `[📄]` Bis | **Art. 7 Bis** `[NO EXISTE]` — ref. Art. 8 ✅ (condominios) | Art. `[📄]` Bis | Art. `[N°]` (nuevo) | Art. `[📄]` Bis | Art. `[📄]` Bis |
| **3 — Obligaciones habitantes** | Separar, no mezclar, respetar horarios | **Art. 21** fracs. X-XII `[📄 PDF pendiente]` | Art. `[📄]` fracs. | **Art. 20** fracs. ✅ (Obligaciones ciudadanía — adición fracs.) | Art. `[📄]` fracs. | Art. `[N°]` (nuevo) | Art. `[📄]` fracs. | Art. `[📄]` fracs. |
| **4 — Obligaciones administraciones** | 5 obligaciones operativas RSU | **Art. 21 Bis** `[NO EXISTE]` `[📄 PDF pendiente]` | Art. `[📄]` Bis | **Art. 8 Bis** `[NO EXISTE]` — ref. Art. 8 ✅ (propietarios/admin) | Art. `[📄]` Bis | Art. `[N°]` (nuevo) | Art. `[📄]` Bis | Art. `[📄]` Bis |
| **5 — Sanciones** | Escalera 4→8→12 UMAs, 3 niveles | **Art. 37 Bis** `[NO EXISTE]` — remite al Bando `[📄 PDF pendiente]` | Art. `[📄]` Bis | **Art. 54-55 + Tabulador** ✅ (reformar para escalera condominial) | Art. `[📄]` (multas 20-200 UMAs) | Art. `[N°]` (nuevo) | Art. `[📄]` Bis | Art. `[📄]` Bis |
| **6 — Transitorios** | Vigencia, gradualidad, periodo educativo | Transitorios 1-6 | Transitorios 1-6 | Transitorios 1-6 | Transitorios 1-6 | Transitorios 1-6 | Transitorios 1-6 | Transitorios 1-6 |
| **Lineamiento técnico** | 5 fracciones, contenedores, frecuencias | Dirección Aseo Público | Dirección `[📄]` | Dirección Servicios Públicos ✅ | Dirección `[📄]` | Dirección Aseo | Dirección `[📄]` | Dirección `[📄]` |

---

## Estado de los reglamentos base

| Ciudad | Reglamento | Año | Estado actual sanciones RSU | PDF cargado | Nota de verificación |
|---|---|---|---|---|---|
| **San Luis Potosí** | Reglamento de Aseo Público | 2018 | Remite al Bando — sin escalera específica | ⏳ Pendiente | ⚠️ El PDF equivocado (Ley de Ingresos 2023) está archivado en `ADENDOS: LEGAL/pdfs/reglamentos/_espejo_catalogo_erroneo/`. Cargar el reglamento correcto como `…/SLP_slp_reglamento_aseo_publico.pdf` + symlink en `frontend/public/reglamentos/`. |
| **Querétaro** | Reglamento Municipal de GIRS | 2021 | Parcialmente desarrollado | ⏳ Pendiente | ⚠️ El PDF equivocado (LOMEQ estatal) está archivado en `_espejo_catalogo_erroneo/`. Cargar el GIRS municipal como `…/QRO_qro_reglamento_municipal_GIRS.pdf` + symlink. |
| **Monterrey** | Reglamento de Limpia Municipal | 2020 (ref. 2023) | Art. 54-55 con Tabulador de Multas en cuotas UMA — procedimiento completo | ✅ Cargado | PDF verificado: `MTY_mty_monterrey_reglamento_limpia_municipal.pdf` · 41 páginas · Gobierno 2021-2024. Arts. mapeados: definiciones (Art. 3), recolección (Art. 7), obligaciones (Art. 20), sanciones (Art. 54-55). Sin artículo específico de condominios. |
| **San Pedro G.G.** | Reglamento Ambiental y Desarrollo Sustentable | 2009 (Gaceta 118) | Art. de sanciones en reglamento ambiental | ⏳ Pendiente PDF RSU | PDF disponible: `MTY_spg_san_pedro_reglamento_ambiental_gaceta118_2009.pdf` — contiene Reglamento Ambiental (2009), no el de RSU/Limpia específico. Verificar artículos RSU. |
| **Soledad de G.S.** | Sin reglamento propio | — | Sin base normativa | — No aplica | Requiere reglamento nuevo completo (trabajo adicional CLC). |
| **Corregidora** | Reglamento Ambiental (referencia QRO) | 2020 | Por verificar | ⏳ Pendiente | PDF disponible: `QRO_cor_reglamento_ambiente_segob_queretaro_reference.pdf` — pendiente de revisión para mapear arts. RSU. |
| **El Marqués** | Reglamento de Limpia Municipal | 2015 | Sin artículo de sanciones RSU | ⏳ Pendiente | No hay PDF en repo. Requiere carga. |

---

## Técnicas normativas usadas por adendo

| Técnica | Definición | Cuándo se usa |
|---|---|---|
| **Adicionar** | Insertar nuevo artículo o nuevas fracciones | Cuando no existe artículo equivalente o el existente no cubre el tema |
| **Reformar** | Modificar texto de artículo existente | Cuando existe artículo pero está desactualizado u omite condominios |
| **Artículo nuevo** | Crear artículo desde cero | Cuando no existe ningún reglamento (ej. Soledad de G.S.) |
| **Transitorio** | Artículo temporal de implementación | Para gradualidad, plazos y derogaciones — acompaña siempre el decreto |
| **Documento derivado** | Lineamiento técnico / acuerdo administrativo | Para especificaciones técnicas operativas que no requieren Cabildo |

---

## Instrucciones para el CSA — carga de reglamentos

Cuando descargues el PDF de cada reglamento, busca y anota:

1. **Artículo de definiciones** — normalmente Cap. I, las primeras 3-5 páginas
2. **Artículo de recolección general** — busca palabras como "recolección", "prestación del servicio", "contenedores"
3. **Artículo de obligaciones de los habitantes** — busca "obligaciones", "usuarios", "generadores"
4. **Artículo de infracciones/sanciones** — busca "infracciones", "sanciones", "multas"
5. **¿Hay artículo específico para condominios?** — si existe, anotar número y texto

Con esos 5 datos por ciudad, se completan todos los `📄 VERIFICAR` de la tabla.

---

> **NOTA DE NO VINCULANCIA:** borrador consultivo CLC-ALQUIMIA. No produce efectos jurídicos.
