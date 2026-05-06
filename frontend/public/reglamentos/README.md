# Espejos de ordenamiento municipal (justificación legislativa ALQUIMIA)

**Instantánea de trabajo:** 2026-05-05  
**Advertencia (Navigator / Auditor):** Los archivos en esta carpeta son **copias de conveniencia** descargadas para contexto interno, revisión de adendos y demos de UI. La vigencia jurídica y la versión única reconocible ante terceros siguen siendo la **publicación oficial** en portal municipal, gaceta o **Compilación del orden jurídico** del Poder Judicial estatal (cuando aplique). Antes de citar en dictamen, confirmar fecha de última reforma en fuente oficial.

## Convención de nombres

`{ZM}_{municipio_id}_{descripcion}.{pdf|doc}`

- **ZM:** `MTY` zona metropolitana Monterrey, `SLP` San Luis Potosí, `QRO` Querétaro, `EXT` fuera del modelo del simulador pero usado en pilots / convenios.
- **municipio_id:** coincide con `frontend/src/lib/constants.ts` (`mty`, `gua`, `qro`, …).

## Dónde anclar adendo / derogación (agente legal)

En instrumentos tipo reglamento mexicanos, suele ubicarse al final:

1. **DISPOSICIONES TRANSITORIAS** (o capítulo equivalente): entrada natural para vigencias y entrada en operación de reformas.
2. **Del titulado de reformas / modificaciones** al texto vigente (cuando exista como bloque previo a transitorias).
3. Para derogaciones explícitas: buscar frases tipo *“Se deroga…”*, *“Queda sin efectos…”* y el **último artículo material** antes del bloque transitorio.

Los PDF locales deben abrirse en lector con búsqueda (`Ctrl/Cmd+F`). Los `.doc` provienen del portal de compilación estatal y conviene abrirlos en Word/LibreOffice para localizar el mismo bloque.

## Índice rápido de archivos

| Archivo | Municipio (id) | Tipo | Observación |
|---------|------------------|------|-------------|
| `MTY_mty_monterrey_reglamento_limpia_municipal.pdf` | mty | Limpia municipal | Portal Monterrey |
| `MTY_spg_san_pedro_reglamento_ambiental_gaceta118_2009.pdf` | spg | Medio ambiente (gaceta) | Convive con zonificación |
| `MTY_spg_san_pedro_reglamento_zonificacion_usos_suelo.pdf` | spg | Zonificación | Complementario RSU/obra |
| `MTY_snl_san_nicolas_servicio_limpieza_fuentestatal.doc` | snl | Servicio limpieza | Compilación NL |
| `MTY_gua_guadalupe_reglamento_limpia.pdf` | gua | Limpia | Bucket municipal |
| `MTY_apo_apodaca_reglamento_proteccion_ambiente_sistec.pdf` | apo | Protección ambiental | Archivo SISTEC estatal |
| `MTY_sca_santa_catarina_reglamento_limpia_recoleccion_fuentestatal.doc` | sca | Limpia y recolección | Compilación NL |
| `MTY_gar_garcia_R-IRMG-3-40_instruccion_interna.pdf` | gar | Instrucción / manual | **No** es necesariamente el reglamento de limpia completo; Auditor debe validar instrumento maestro |
| `MTY_esc_escobedo_reglamento_limpia_fuentestatal.doc` | esc | Limpia | Compilación NL |
| `MTY_jua_juarez_reglamento_limpia_fuentestatal.doc` | jua | Limpia | Compilación NL |
| `EXT_cad_cadereyta_reglamento_desarrollo_urbano_portalmunicipal.pdf` | cad | Desarrollo urbano | Contexto ordenamiento territorial |
| `EXT_cad_cadereyta_reglamento_equilibrio_ecologico_ambiente_fuentestatal.doc` | cad | Ecología municipal | Compilación NL |
| _(pendiente)_ `QRO_qro_reglamento_municipal_GIRS.pdf` | qro | GIRS municipal (capital) | Sustituir espejo: la LOMEQ archivada en `_espejo_catalogo_erroneo/` no es el instrumento RSU. |
| `QRO_cor_reglamento_ambiente_segob_queretaro_reference.pdf` | cor | Referencia normativa | Verificar titulación exacta en PDF |
| _(pendiente)_ `SLP_slp_reglamento_aseo_publico.pdf` | slp | Reglamento de Aseo Público | Ley de Ingresos mal etiquetada archivada en `ADENDOS: LEGAL/pdfs/reglamentos/_espejo_catalogo_erroneo/` |

Ver **`manifest.json`** para URLs de descarga originales y columnas `instrumento`, `riesgos_calidad`.

## Municipios del modelo sin archivo en esta carpeta (pendiente)

Soledad (`sol`), Cerro de San Pedro (`csp`), Villa de Pozos (`vip`), El Marqués (`mar`), Huimilpan (`hui`): registrar URL oficial y, si aplica, espejo `.pdf` en siguiente ciclo de scraping autorizado por CSA.
