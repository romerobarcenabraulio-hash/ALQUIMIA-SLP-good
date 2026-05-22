# Reglamentos municipales — PDFs en línea (ALQUIMIA)

**Instantánea de trabajo:** 2026-05-18
**Advertencia (Navigator / Auditor):** Los archivos en esta carpeta son **copias de conveniencia** descargadas para contexto interno, revisión de adendos y demos de UI. La vigencia jurídica y la versión única reconocible ante terceros siguen siendo la **publicación oficial** en portal municipal, gaceta o **Compilación del orden jurídico** del Poder Judicial estatal (cuando aplique). Antes de citar en dictamen, confirmar fecha de última reforma en fuente oficial.

## Política de archivos

- **Solo PDFs** se sirven en línea desde esta carpeta. Archivos `.doc` no van en `public/`.
- **Adendos jurídicos** los generan los agentes de ALQUIMIA; el frontend los consume, no los produce.
- Fuente de verdad programática: `frontend/src/data/reglamentos.ts` (campo `archivo_local`).

## Convención de nombres

`{ZM}_{municipio_id}_{descripcion}.pdf`

- **ZM:** `SLP` San Luis Potosí, `MTY` Monterrey, `QRO` Querétaro, `GDL` Guadalajara, `EXT` fuera del modelo del simulador.
- **municipio_id:** coincide con `frontend/src/lib/constants.ts` (`mty`, `gua`, `qro`, …).

## Índice de archivos

| Archivo | Municipio (id) | Tipo |
|---------|----------------|------|
| `SLP_slp_reglamento_aseo_publico.pdf` | slp | Reglamento de Aseo Público |
| `SLP_sol_reglamento_aseo_publico_2013.pdf` | sol | Reglamento de Aseo Público (2013) |
| `MTY_mty_monterrey_reglamento_limpia_municipal.pdf` | mty | Limpia municipal |
| `MTY_spg_san_pedro_reglamento_aseo_publico.pdf` | spg | Reglamento de Aseo Público |
| `MTY_spg_san_pedro_reglamento_limpia_sistec_candidate.pdf` | spg | Candidato limpia (SISTEC) |
| `MTY_spg_san_pedro_reglamento_ambiental_gaceta118_2009.pdf` | spg | Medio ambiente (gaceta) |
| `MTY_spg_san_pedro_reglamento_zonificacion_usos_suelo.pdf` | spg | Zonificación |
| `MTY_gua_guadalupe_reglamento_limpia.pdf` | gua | Limpia |
| `MTY_apo_apodaca_reglamento_proteccion_ambiente_sistec.pdf` | apo | Protección ambiental |
| `MTY_gar_garcia_R-IRMG-3-40_instruccion_interna.pdf` | gar | Instrucción interna |
| `QRO_qro_reglamento_aseo_publico.pdf` | qro | Reglamento de Aseo Público |
| `QRO_cor_reglamento_ambiente_segob_queretaro_reference.pdf` | cor | Referencia normativa |
| `GDL_gdl_guadalajara_reglamento_gestion_integral_municipio.pdf` | gdl | Gestión integral |
| `GDL_gdl_guadalajara_reglamento_aseo_publico.pdf` | gdl | Reglamento de Aseo Público |
| `GDL_zap_zapopan_reglamento_gestion_integral_residuos.pdf` | zap | Gestión integral residuos |
| `EXT_cad_cadereyta_reglamento_desarrollo_urbano_portalmunicipal.pdf` | cad | Desarrollo urbano |

## Municipios sin PDF local (pendiente)

Cerro de San Pedro (`csp`), Villa de Pozos (`vip`), San Nicolás (`snl`), Santa Catarina (`sca`), General Escobedo (`esc`), Juárez NL (`jua`), El Marqués (`mar`), Huimilpan (`hui`), San Pedro Tlaquepaque (`tla`): pendiente obtener PDF oficial.

Ver **`manifest.json`** para URLs de descarga originales y `riesgos_calidad`.
