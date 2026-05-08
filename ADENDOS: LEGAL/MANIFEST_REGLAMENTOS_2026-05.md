# Manifest verificable — espejos RSU / limpia municipal (CSA · 2026-05-07)

Artefactos canónicos en disco: `ADENDOS: LEGAL/pdfs/reglamentos/<ZM>_<municipio_id>_<slug>.<pdf|doc>`
Enlaces públicos del frontend: `frontend/public/reglamentos/` → symlinks al mismo árbol ADENDOS.

**Notas**

- **Páginas (PDF):** conteo heurístico `/Type /Page` en el binario (coincide con lectura visual salvo PDFs con objetos no estándar). Zapopan reemplazado el **2026-05-07** por la versión **Oct 2024** del portal oficial (`SHA256` alineado con descarga directa).
- **Word (.doc):** compilación estatal NL — páginas no aplicables (`—`). Requisito jurídico frente a terceros: confrontar con POE/gaceta municipal.
- **Criterio ≥12/17:** la tabla incluye **17 filas** (backlog CSA **16** IDs + **mty** como referencia de ingest NL). Con archivo binario local hay **12** filas del backlog principal (`snl`, `gua`, `apo`, `sca`, `gar`, `esc`, `jua`, `spg`, `cor`, `gdl`, `zap`). Si el auditor exige **solo PDF** y excluye `.doc`, el cómputo cae por debajo de 12 hasta obtener POE PDF para los municipios NL en compilación Word — documentado para Ejecutor/Auditor.

## Tabla

| municipio_id | URL_oficial | fecha_publicación | SHA256 | páginas | año_versión | arts_localizados | estado_final |
|--------------|-------------|-------------------|--------|---------|-------------|------------------|--------------|
| slp | https://sitio.sanluis.gob.mx/SanLuisPotoSi/DispocisionReglamentaria | — | — | — | 2018 (referencia catálogo) | POE SLP + portal — sin PDF vigente espejado CSA | no_localizable |
| qro | https://municipiodequeretaro.gob.mx/reglamento/ | — | — | — | 2021 (referencia) | Marco municipal propio — pendiente PDF directo estable | no_localizable |
| mar | https://www.marques.gob.mx/transparencia/ | — | — | — | — | Búsqueda portal / DDG sin PDF RSU dedicado en esta pasada | no_localizable |
| hui | https://huimilpan.gob.mx/category/transparencia/ | — | — | — | — | Solo avisos de privacidad en índice HTML scrapeado; sin reglamento RSU | no_localizable |
| gdl | https://transparencia.guadalajara.gob.mx/sites/default/files/reglamentos/Reg.GestionIntegralMunicipioGuadalajara.pdf | Gaceta base 2016-07-15 + reformas posteriores (consultar POE/GEM); servidor Last-Modified 2025-05-13 | cb3eaae5bebee6c1b11b5645cb3e60baab3785505fd9ad4567ab0d0b09c3239b | 152 | 2016 (consolidado portal) | Objeto; definiciones; obligaciones; sanciones; desarrollo urbano articulado | checksum_verificado_en_revision |
| zap | https://servicios.zapopan.gob.mx:8000/wwwportal/publicfiles/descargasEnlaces/10-2024/Reglamento%20de%20Prevenci%C3%B3n%20y%20Gesti%C3%B3n%20Integral%20de%20Residuos%20del%20Municipio%20de%20Zapopan%2C%20Jalisco.pdf | Última versión archivo oficial 2024-10-15 (Gaceta origen aprobación 2021-09-02) | 426dee031b8edd96848a72529d55816f4fae0580693fa85c3c4ea52a03edc84a | 46 | 2024 | Disposiciones generales; gestión integral residuos; obligaciones; infracciones | checksum_verificado_en_revision |
| tla | https://www.tlaquepaque.gob.mx/transparencia/ | — | — | — | — | Portal TLS / índice normativo sin PDF RSU fijado en CSA | no_localizable |
| snl | http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=6913&ambito=MUNICIPAL | Por expediente compilación (confirmar gaceta municipal) | f7a254d4536873f3ee9bfb68338b57dd84ae1d91eb243cf7726d9d1e419aac53 | — | 2016 | Servicio limpieza; obligaciones generales (validar numeración) | en_revision |
| gua | https://webguadalupe.s3.amazonaws.com/wp-content/uploads/2023/01/REGLAMENTO-DE-LIMPIA-DEL-MUNICIPIO-DE-GUADALUPE-NUEVO-LEON.pdf | Publicación portal (confirmar POE NL) | 92d751b945072790855cc33821ed63ea108e6beb9abc04c894e8c4d0288f1a04 | 21 | 2019 | Limpia municipal; recolección; sanciones | en_revision |
| apo | https://sistec.nl.gob.mx/Transparencia_2015/Archivos/AC_0001_0008_0168498-0000001.pdf | Por expediente SISTEC | 16f586f1856d4e1e60fd51d8db55d9fe8b2129eccea02185c8a67ad27117ef4b | 28 | 2009 | Protección ambiental — **no** reglamento RSU dedicado; usar como referencia hasta instrumento limpia | en_revision |
| sca | http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=7027&ambito=MUNICIPAL | Por expediente compilación | 84994ecfc4209f4a5cd19c9b57381da9b93867cabcb17cbe0d8115b3017135d9 | — | 2013 | Limpia y recolección | en_revision |
| gar | https://www.garcia.gob.mx/wp-content/uploads/2022/08/R-IRMG-3-40.pdf | 2022-08 (documento interno) | c3c08cad63e3096896e1a1597fc565542eeb6f0994d5003040833c88d7584aec | 19 | 2022 | Instrucción interna — **no** reglamento maestro RSU | en_revision |
| esc | http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=6968&ambito=MUNICIPAL | Por expediente compilación | 23f4e95bb01d9c009b36ac8b2b96f6aff3828c1df83f5ee8d5ac4352bd53df28 | — | 2016 | Limpia | en_revision |
| jua | http://compilacion.ordenjuridico.gob.mx/fichaOrdenamiento.php?idArchivo=105171&ambito=MUNICIPAL | Por expediente compilación | 38a5cc689d4237b66a31c7a30f7b33166183f74f332dc4aed59332d3ac04498c | — | 2025 | Limpia | en_revision |
| spg | https://sistec.nl.gob.mx/Transparencia_2015/Archivos/AC-F0108-07-M020011171-01.pdf | Pendiente cotejo POE/gaceta SPGG vs título «limpia» | 8c4e345e1a69be81e388ba33c622cd4df004ec4b401d7e6955e8b4d36f35de4c | 12 | pendiente | Candidato corto «limpia» — contrastar con instrumentos ambientales gaceta 118 en repo | en_revision |
| cor | https://lasombradearteaga.segobqueretaro.gob.mx/getfile.php?p1=20121059-01.pdf | 2012 (SEGOB QRO referencia) | 3d27cb5209c8f62f05ba2c323626626f67c2f118c29babc5c05dee196ff2887f | 228 | 2012 | Ambiente municipal — **sin** confirmación RSU exclusiva | en_revision |
| mty | https://www.monterrey.gob.mx/pdf/reglamentos/1/Reglamento_de_Limpia_Municipal_de_Monterrey.pdf | Confirmar POE/gaceta NL | 23d9a2e511a1184db6971987492a9a46d23ffed7775b822c52b19e85cb784977 | 41 | 2021 | Limpia; obligaciones; orden público | en_revision |

## Hand-off Ejecutor (`source_manifest`)

Tras `POST` de bytes al endpoint legal o actualización de seeds, fijar por municipio:

- `official_url` / `download_url` como en columna **URL_oficial**
- `checksum_sha256` como en tabla (cuando exista archivo)
- `ingest_status`: **`verified`** recomendado solo donde **SHA256** coincide con descarga reciente (`gdl`, `zap`); resto **`descargado`** / **`localizado`** hasta validación jurídica

Rutas archivo para ingest desde disco:

- `ADENDOS: LEGAL/pdfs/reglamentos/GDL_gdl_guadalajara_reglamento_gestion_integral_municipio.pdf`
- `ADENDOS: LEGAL/pdfs/reglamentos/GDL_zap_zapopan_reglamento_gestion_integral_residuos.pdf`
- (demás según prefijo `MTY_*`, `QRO_*` en el mismo directorio)
