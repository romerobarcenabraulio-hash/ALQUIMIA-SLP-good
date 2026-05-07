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
| **Querétaro (capital)** | Reglamento de Limpia y Aseo Público del Municipio de Querétaro (denominación de trabajo; verificar rubro en POE) | 2021 | Marco propio de obligaciones, prohibiciones e infracciones — brecha principal en instrumentación 5 fracciones condominio | ⏳ PDF en repo pendiente | ⚠️ **No afirmar ausencia normativa total.** Corregir etiqueta histórica “solo GIRS” si el instrumento oficial es de Limpia y Aseo. Cargar PDF íntegro y mapear Arts. 2, 15–18, 8–11 (cotejo literal). |
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

---

## Matriz legal final (CLC · consistencia municipal)

| Municipio (id simulador) | Base normativa existente (síntesis) | Brecha jurídica | Brecha operativa | Prioridad de reforma |
|---|---|---|---|---|
| **SLP** `slp` | Reglamento de Aseo Público (2018 ref.) + Bando para sanciones | Encaje de definiciones 5 fracciones, modelos A/B, prueba y tabulador acotado a condominio | PDF vigente no espejado en repo; riesgo de citas imprecisas | **Alta** — cargar PDF + dictamen jurídico local |
| **MTY** `mty` | Reglamento de Limpia Municipal: Arts. 3, 7–8, 20, 54–55 Tabulador UMA | Falta supuesto explícito condominio 5 fracciones + encaje sin romper Tabulador | Diseño de inciso en Art. 55 + CM protección debido proceso | **Alta** — reforma puntual Cabildo |
| **QRO** `qro` | Reglamento Limpia y Aseo: obligaciones, condominio, prohibiciones, sanciones | **No** vacío legal; falta **precisión** de circuito 5 fracciones y graduación compatible con bloque sancionador | Rutas A/B, evidencia, CRM expediente, armonía con inspectores | **Media–Alta** — adiciones/reformas acotadas |
| **SPGG** `spg` | RSU / Aseo SPGG + normas ambientales (validar instrumento único aplicable) | Numeración y titularidad inspectiva [VERIFICAR]; evitar mezclar reglamentos | Mismo paquete 6 adendos con mapeo PDF | **Alta** — verificación fuente primaria |
| **Corregidora** `cor` | Servicios públicos / normativa ambiental municipal (titulación [VERIFICAR]) | Riesgo de copy-paste desde capital; numeración propia obligatoria | Cargar PDF + validar competencias vs capital | **Alta** |
| **El Marqués** `mar` | Reglamento de limpia (ref. 2015 — [VERIFICAR]) | Sin mapeo en repo | Toda la cadena de adendos pendiente | **Alta** — bloqueado hasta PDF |
| **Soledad** `sol` | Sin reglamento RSU propio en seed — paquete `adendosExtendedCiudades` | Instrumento propio o armonía ZM | Localización CLC 2026-05-07 | **Media–Alta** |

---

## Extensión CLC — 14 municipios (auditoría P0/P1 · 2026-05-07)

Los `adendoPropuesto` para los ids `sol`, `csp`, `vip`, `snl`, `gua`, `apo`, `sca`, `gar`, `esc`, `jua`, `hui`, `gdl`, `zap`, `tla` viven en `frontend/src/data/adendosExtendedCiudades.ts` y se fusionan en `adendos.ts`.

| Adendo | **sol** | **csp** | **vip** | **hui** | **jua** | **gdl** | **zap** | **tla** | **snl** | **gua** | **apo** | **sca** | **gar** | **esc** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1 Definiciones** | `[NO EXISTE]` proyecto nuevo | idem | idem | proyecto + Ley QRO supletoria | proyecto + Ley NL | **ALQUIMIA no tiene reglamento RSU verificado para este municipio. Se requiere descarga manual del Periódico Oficial del Estado de Jalisco antes de la redacción del adendo.** | idem Jalisco | idem Jalisco | `[📄 VERIFICAR]` tras PDF POE | `[📄 VERIFICAR]` | `[📄 VERIFICAR]` | `[📄 VERIFICAR]` | `[📄 VERIFICAR]` | `[📄 VERIFICAR]` |
| **2 Modelos A/B** | Art. [●] Bis (nuevo) | idem | idem | idem | idem | idem | idem | idem | `[📄]` Bis | `[📄]` Bis | `[📄]` Bis | `[📄]` Bis | `[📄]` Bis | `[📄]` Bis |
| **3 Oblig. habitantes** | Art. [●] (nuevo) | idem | idem | idem | idem | idem | idem | idem | `[📄]` | `[📄]` | `[📄]` | `[📄]` | `[📄]` | `[📄]` |
| **4 Oblig. administración** | Art. [●] Bis (nuevo) | idem | idem | idem | idem | idem | idem | idem | `[📄]` Bis | `[📄]` Bis | `[📄]` Bis | `[📄]` Bis | `[📄]` Bis | `[📄]` Bis |
| **5 Sanciones** | escalera UMA + `[REDACCIÓN PENDIENTE — Bando]` | idem | idem | idem | idem | idem | idem | idem | reforma tabulador `[📄 VERIFICAR]` | idem | idem | idem | idem | idem |
| **6 Transitorios** | decreto expedición | idem | idem | idem | idem | idem | idem | idem | transitorios reforma | idem | idem | idem | idem | idem |

**Querétaro capital (`qro`):** se mantiene la nota CLC — no afirmar ausencia normativa total; el marco ya prevé obligaciones y sanciones; la brecha es de instrumentación condominio 5 fracciones.

**ZM Guadalajara (`gdl`, `zap`, `tla`):** como arriba — sin PDF RSU verificado en repo ALQUIMIA; descarga manual POE Jalisco obligatoria antes de fijar numeración.
