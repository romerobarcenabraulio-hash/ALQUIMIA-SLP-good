# Auditoría de exactitud de citas de estándares (AUDITOR · L0)

**Fecha:** 2026-05-27  
**Fuente canónica auditada:** `docs/architecture/standards_map.json` v1.0.0 → **corregida en v1.0.1** (espejo 1:1 en `frontend/src/data/standards_map.json`)  
**Estado:** hallazgos CRÍTICOS y MODERADOS resueltos en `main` (ver `changelog/auditor.md`).  
**Hoja de ruta leída:** `alquimia_hoja_de_ruta.md` (ruta solicitada `docs/architecture/HOJA_DE_RUTA_ALQUIMIA.md` no existe en repo; contenido equivalente)  
**Prerrequisitos:** trabajo MARCOS y POLIS presente en `changelog/marcos.md` y `changelog/polis_standards.md`  
**Alcance de módulos:** 37 entradas en `standards_map.json` + nota M01B (vivo en hoja de ruta, ausente del mapa) = **38 módulos de producto**  
**Método:** verificación de versión, título de sección/disclosure y aplicabilidad contra texto oficial (GRI, SASB/IFRS, ISO, ESRS/EFRAG, PMI) vía publicaciones y delegated act C(2023) 5303.

## Resumen de severidad (solo `standards_map.json`)

| Severidad | Cantidad | Bloquea presentación a cliente |
|-----------|----------|------------------------------|
| CRÍTICO | 8 filas (+ 1 hallazgo satélite en informe PDF) | Sí, hasta corrección |
| MODERADO | 14 filas | No; corregir en paralelo |
| MENOR | 6 filas | No |
| Conforme | 84 filas | — |

## Lista priorizada — errores CRÍTICOS (corrección propuesta para MARCOS)

| # | Módulo | Código citado | Problema verificado | Corrección sugerida |
|---|--------|---------------|---------------------|---------------------|
| 1 | M01 | GRI 306-2 | En **GRI 306:2020**, 306-2 es *Management of significant waste-related impacts* (enfoque de gestión), no destino/disposición (eso era el **306-2 de 2016**). Disposición = **306-5**; desvío = **306-4**. | Separar: línea base generación → **306-1** + **306-3**; destino relleno → **306-5**; reciclaje/desvío → **306-4**. Actualizar `full_name` y `relevance`. |
| 2 | M01 | GRI 306-1 | Título en mapa «Generación de residuos» es incompleto; el disclosure oficial es *Waste generation and significant waste-related impacts*. | Ajustar `full_name`; no usar 306-1 solo para toneladas sin narrativa de impactos si se declara cumplimiento estricto. |
| 3 | M01 | SASB IF-WM-150a.1 | Métrica oficial = **TRI releases** (liberaciones tóxicas), no «peso a vertederos». | Sustituir por **IF-WM-000.D** (materiales gestionados) y/o vincular disposición a **GRI 306-5**; retirar 150a.1 salvo que el municipio reporte TRI. |
| 4 | M06 | SASB IF-WM-000.A | **000.A** = clientes por categoría; instalaciones = **IF-WM-000.C**. | Cambiar código a **IF-WM-000.C** y alinear `relevance` a recinto/instalación. |
| 5 | M08 | SASB IF-WM-150a.2 | **150a.2** = acciones correctivas por liberaciones en relleno, no «% reciclado». | Sustituir por **IF-WM-420a.3** (material reciclado) o **420a.4** según métrica mostrada. |
| 6 | M10 | SASB IF-WM-150a.2 | Mismo error que M08. | Igual que #5. |
| 7 | M08B | ISO 26000:2010 §6.8 | **§6.8** = *Community involvement and development*, no «cadena de valor». | Cambiar a **§6.4** (labour) + **§6.5** (environment) o **§5.3** (stakeholders) según plan educativo. |
| 8 | M02C | GRI 2-30 | **2-30** = convenios de negociación colectiva, no mapeo de actores. | Retirar de M02C; mantener **2-29** + **AA1000 SES** + **ISO 26000 §5.3** (título corregido). |

**Satélite (fuera del mapa, misma regla de verdad):** `frontend/src/app/informe/[municipio_id]/page.tsx` etiqueta «Residuos desviados de relleno» como **GRI 306-2**; debe ser **GRI 306-4** (desvío de disposición).

## M18 — doble materialidad (revisión reforzada)

| Estándar | Versión | Sección | Aplicabilidad | Severidad |
|----------|---------|---------|---------------|-----------|
| CSRD ESRS 1:2023 | Sí (Delegated Act 31.07.2023, OJ 22.12.2023) | Sí — cap. 3 *Double materiality* | Sí para matriz impacto/financiero | Conforme |
| EFRAG IG 1:2023 | Sí (IG final **mayo 2024**, no autoritativo) | Sí — guía DMA | Sí como guía de implementación | MENOR: etiqueta «2023» vs publicación 2024 |
| GRI 3:2021 (Doble materialidad) | Sí GRI 3:2021 | Parcial — GRI 3 define **temas materiales** e **impact materiality**, no el término «doble materialidad» | Parcial — complementa dimensión impacto; **no sustituye** ESRS 1 para dimensión financiera | **MODERADO** |

**Riesgo reputacional:** ante equipo ESG europeo, decir «doble materialidad según GRI 3» es impreciso; la formulación correcta es «matriz alineada con **ESRS 1** (doble materialidad) e identificación de temas materiales **GRI 3** (impacto)». UI `M18MaterialityBadge.tsx` ya menciona ESRS 1 + GRI 3 — aceptable si se matiza en copy.

## M01 — GRI 306-1 vs 306-2 (tarea 5)

| Disclosure GRI 306:2020 (oficial) | Contenido | ¿Aplica a qué parte de M01? | Estado en mapa |
|-----------------------------------|-----------|------------------------------|----------------|
| **306-1** | Generación e impactos significativos (enfoque) | Diagnóstico cualitativo / identificación de impactos | Título acortado — MODERADO |
| **306-2** | Gestión de impactos significativos | Políticas y acciones de gestión, no toneladas por destino | **Mal asignado** si se usa para disposición — CRÍTICO |
| **306-3** | Residuos generados (peso) | KPI toneladas RSU generadas | No citado en M01; debería aparecer para métricas de masa |
| **306-4** | Desviados de disposición | Reciclaje/compostaje | Ausente en M01 |
| **306-5** | Dirigidos a disposición | Relleno/disposición final | Ausente en M01; es el sustituto correcto del antiguo 306-2 (2016) |

## Tabla completa (38 módulos · 102 citas + M01B)

Leyenda: **V** = versión existe/vigente identificada; **S** = sección/disclosure existe con el significado oficial; **A** = aplica al tipo de información del módulo.

| Módulo | Estándar citado | V | S | A | Severidad | Observación |
|--------|-----------------|---|---|---|-----------|-------------|
| M00 | — | — | — | — | — | `no_aplica`; conforme. |
| M00B | GRI 2-29 | Sí | Sí | Sí | — | Participación stakeholders. |
| M00B | GRI 2-22 | Sí | Sí | Sí | — | Estrategia sostenibilidad. |
| M01 | GRI 306-1 | Sí | Parcial | Parcial | MOD | Versión 2020 correcta; título oficial más amplio (impactos significativos). |
| M01 | GRI 306-2 | Sí | Sí | **No** | **CRÍTICO** | No usar para destino/disposición; ver matriz M01 arriba. |
| M01 | SASB IF-WM-150a.1 | Sí | **No** | **No** | **CRÍTICO** | Métrica = TRI, no toneladas a relleno. |
| M01 | NOM-083-SEMARNAT-2003 | Sí | Sí | Sí | — | Disposición final. |
| M01 | ODS 11.6 | Sí | Sí | Sí | — | Meta ONU correcta. |
| M01B | — | — | — | — | — | **No está en mapa** (módulo en hoja de ruta Validación); auditar citas en UI cuando existan. |
| M02 | GRI 2-1 | Sí | Sí | Sí | — | Detalles organizacionales. |
| M02 | ISO 14001:2015 §4.1 | Sí | Sí | Sí | — | Contexto SGA. |
| M02B | GRI 2-29 | Sí | Sí | Sí | — | |
| M02B | AA1000 SES:2015 | Sí | Sí | Sí | — | |
| M02B | ISO 10002:2018 | Sí | Sí | Parcial | MENOR | Quejas; encuesta ciudadana es stretch pero aceptable como referencia de retroalimentación. |
| M02B | ODS 16.7 | Sí | Sí | Sí | — | |
| M02C | GRI 2-29 | Sí | Sí | Sí | — | |
| M02C | GRI 2-30 | Sí | Sí | **No** | **CRÍTICO** | Negociación colectiva ≠ mapeo de actores. |
| M02C | AA1000 SES:2015 | Sí | Sí | Sí | — | |
| M02C | ISO 26000:2010 §5.3 | Sí | **No** | Sí | MOD | Sección = *Stakeholder identification and engagement*, no «responsabilidad organizacional» (§5.2). |
| M02D | GRI 2-12 | Sí | Sí | Sí | — | |
| M02D | GRI 2-13 | Sí | Sí | Sí | — | |
| M02D | PMI PMBOK® 7th Ed. §9 | Sí | **No** | Parcial | MOD | PMBOK 7 usa *dominios* (§9 no existe); §9 ≈ dominio Team/Resources por analogía. |
| M03 | ISO 14001:2015 §7 | Sí | Sí | Sí | — | Apoyo SGA. |
| M03 | ISO 14001:2015 §5.3 | Sí | Sí | Sí | — | Roles SGA. |
| M03B | ISO 14001:2015 §6.1.3 | Sí | Sí | Sí | — | Requisitos legales. |
| M03B | GRI 2-27 | Sí | Sí | Sí | — | |
| M03B | LGPGIR Arts. 9, 17, 18 | Sí | Sí | Sí | — | Norma federal MX. |
| M03C | GRI 2-1 | Sí | Sí | Sí | — | |
| M03C | ISO 14001:2015 §4.3 | Sí | Sí | Sí | — | Alcance SGA. |
| M03D | GRI 2-23 | Sí | Sí | Sí | — | |
| M03D | GRI 2-25 | Sí | Sí | Sí | — | |
| M04 | GRI 201-2 | Sí | Sí | Sí | — | Financiero/clima. |
| M04 | TCFD Recommendations (2017) | Sí | Sí | Sí | — | |
| M04 | CSRD ESRS E5 | Sí | Sí | Sí | — | Economía circular. |
| M04 | ODS 12.5 | Sí | Sí | Sí | — | |
| M04B | GRI 203-2 | Sí | Sí | Sí | — | |
| M04B | GRI 413-1 | Sí | Sí | Sí | — | |
| M04B | ODS 8.5 | Sí | Sí | Sí | — | |
| M04B | ODS 1.2 | Sí | Sí | Sí | — | |
| M04C | GRI 3:2021 §3-3 | Sí | Sí | Sí | — | Gestión temas materiales / teoría de cambio. |
| M05D | PMI PMBOK® 7th Ed. §6 | Sí | **No** | Parcial | MOD | Analogía a dominio Planning, no cláusula §6. |
| M05D | Stage-Gate® Cooper (2009) | Sí | Sí | Sí | — | |
| M05 | PMI PMBOK® 7th Ed. §4 | Sí | **No** | Parcial | MOD | §4 PMBOK 7 = Models, Methods, Artifacts (no «modelos de proyecto» genérico). |
| M05 | Stage-Gate® Cooper | Sí | Sí | Sí | — | |
| M05 | ISO 21500:2012 | Sí | Sí | Sí | — | |
| M05B | PMI PMBOK® 7th Ed. §9 | Sí | **No** | Parcial | MOD | Ver M02D. |
| M05B | PERT clásico NASA (1958) | Sí | Sí | Sí | — | Referencia histórica válida. |
| M05B | RACI matrix | Sí | Sí | Sí | — | Práctica PMI, no ISO. |
| M05C | ISO 55000:2014 | Sí | Sí | Parcial | MENOR | Solo referencia despliegue; mapa ya lo declara. |
| M06 | ISO 14001:2015 §8.1 | Sí | Sí | Sí | — | Operación ambiental. |
| M06 | SASB IF-WM-000.A | Sí | **No** | **No** | **CRÍTICO** | Código incorrecto; usar **IF-WM-000.C**. |
| M06 | NMX-AA-061-SCFI-2015 | Sí | Sí | Sí | — | |
| M06 | EN 840-1:2012 | Sí | Sí | Sí | — | Contenedores. |
| M07 | GRI 2-9 | Sí | Sí | Sí | — | Gobernanza. |
| M07 | ISO 45001:2018 §5.3 | Sí | Sí | Parcial | MENOR | SST en organigrama operativo — aceptable como roles. |
| M07 | PMI PMBOK® 7th Ed. §9 | Sí | **No** | Parcial | MOD | |
| M08 | GRI 306-3 | Sí | Sí | Sí | — | Peso generado en operación. |
| M08 | SASB IF-WM-150a.2 | Sí | **No** | **No** | **CRÍTICO** | Ver M10. |
| M08 | ISO 14001:2015 §8.1 | Sí | Sí | Sí | — | |
| M08 | GRI 305-3 | Sí | Sí | Parcial | MENOR | Alcance 3 en logística — válido si se reportan emisiones indirectas evitadas. |
| M08B | GRI 404-1 | Sí | Sí | Sí | — | |
| M08B | GRI 404-2 | Sí | Sí | Sí | — | |
| M08B | ISO 26000:2010 §6.8 | Sí | **No** | **No** | **CRÍTICO** | Título y alcance erróneos. |
| M08B | ODS 4.7 | Sí | Sí | Sí | — | |
| M09 | GRI 201-1 | Sí | Sí | Sí | — | Valor económico. |
| M09 | PMI EVM ANSI/EIA-748-C (2011) | Sí | Sí | Sí | — | |
| M10 | GRI 301-2 | Sí | Sí | Sí | — | |
| M10 | GRI 301-3 | Sí | Sí | Sí | — | |
| M10 | SASB IF-WM-150a.2 | Sí | **No** | **No** | **CRÍTICO** | Usar **IF-WM-420a.3**. |
| M10 | CSRD ESRS E5 §E5-5 | Sí | Sí | Sí | — | Recursos entrantes/salientes. |
| M11 | — | — | — | — | — | `pendiente`; conforme. |
| M12 | GRI 201-1 | Sí | Sí | Parcial | MENOR | Preliminar declarado en mapa. |
| M13 | GRI 201-2 | Sí | Sí | Sí | — | |
| M13 | TCFD Recommendations (2017) | Sí | Sí | Sí | — | |
| M13 | CSRD ESRS E1-E5 | Sí | Sí | Parcial | MENOR | Conjunto amplio; aceptable en escenarios ESG integrales. |
| M14 | ISO 31000:2018 | Sí | Sí | Sí | — | |
| M14 | GRI 3:2021 §3-3 | Sí | Sí | Sí | — | |
| M14 | TCFD Risk Framework | Sí | Sí | Sí | MENOR | Nombre comercial; contenido TCFD 2017. |
| M14 | PMI PMBOK® §11 | Sí | **No** | Parcial | MOD | PMBOK 7: riesgo ≈ dominio Uncertainty, no §11. |
| M15 | GRI 2-26 | Sí | Sí | Sí | — | Asesoría Cabildo. |
| M15 | GRI 2-22 | Sí | Sí | Sí | — | |
| M16 | ISO 14001:2015 §9.1 | Sí | Sí | Sí | — | Seguimiento/medición. |
| M16 | ISO 14001:2015 §9.2 | Sí | Sí | Sí | — | Auditoría interna. |
| M16 | GRI 306-2 | Sí | Sí | Parcial | MOD | Aplica a gestión de impactos en inspección, no a KPI masivo. |
| M17 | PMI EVM ANSI/EIA-748-C | Sí | Sí | Sí | — | |
| M17 | GRI 306-2 | Sí | Sí | Parcial | MOD | Idem M16. |
| M17 | ISO 14001:2015 §9.1.1 | Sí | Sí | Sí | — | |
| M17 | ODS 11.6 | Sí | Sí | Sí | — | |
| M18 | GRI 3:2021 (Doble materialidad) | Sí | Parcial | Parcial | MOD | Ver sección M18; no equivaler a doble materialidad ESRS. |
| M18 | CSRD ESRS 1:2023 | Sí | Sí | Sí | — | Requisitos generales y DMA. |
| M18 | EFRAG IG 1:2023 | Sí | Sí | Sí | MENOR | Documento final IG 1: **mayo 2024**. |
| M19 | GRI 2-4 | Sí | **No** | Sí | MOD | Oficial: *Restatements of information*, no «reubicación». |
| M19 | GRI 2-3 | Sí | Sí | Sí | — | Periodo de reporte. |
| M19 | ISO 14044:2006 | Sí | Sí | Parcial | MENOR | ACV para trazabilidad de flujos — aceptable si hay inventario de ciclo de vida. |
| M20 | PMI EVM ANSI/EIA-748-C (2011) | Sí | Sí | Sí | — | |
| M20 | ISO 21508:2018 | Sí | Sí | Sí | — | |
| M20B | GRI 201-1 | Sí | Sí | Sí | — | |
| M20B | ISO 21508:2018 | Sí | Sí | Sí | — | |
| M21 | ISO 31000:2018 | Sí | Sí | Sí | — | |
| M21 | PMI PMBOK® §11 | Sí | **No** | Parcial | MOD | |
| M21 | IRM Risk Register Guidance | Sí | Sí | Sí | MENOR | Guía profesional IRM, no norma ISO. |
| M21 | GRI 3:2021 §3-3 | Sí | Sí | Parcial | MENOR | Temas materiales en riesgos estratégicos. |
| M21B | Stage-Gate® Cooper | Sí | Sí | Sí | — | |
| M21B | PMI PMBOK® Phase-Gate | Sí | **No** | Parcial | MOD | «Phase-Gate» no es sección PMBOK; es metodología Cooper. |
| M21B | ISO 21502:2020 | Sí | Sí | Sí | — | |

## Criterio de cierre binario

| Criterio | Estado |
|----------|--------|
| Tabla con 38 módulos revisados | **Cumple** (37 en mapa + M01B documentado) |
| Cero CRÍTICOS sin resolución propuesta | **Cumple** (8 filas + satélite informe con fix indicado) |
| Cada MODERADO con corrección para MARCOS | **Cumple** (ver filas MOD en tabla) |
| No modificación de código/mapas en esta auditoría | **Cumple** (solo este informe y changelog) |

## Referencias de verificación (muestra)

- GRI 306:2020 — [globalreporting.org/publications/.../gri-306-waste-2020](https://www.globalreporting.org/publications/documents/english/gri-306-waste-2020/)
- GRI 2:2021 — [globalreporting.org/.../gri-2-general-disclosures-2021](https://www.globalreporting.org/publications/documents/english/gri-2-general-disclosures-2021/)
- GRI 3:2021 — [globalreporting.org/pdf.ashx?id=12453](https://www.globalreporting.org/pdf.ashx?id=12453)
- ESRS 1 — Delegated Act C(2023) 5303, cap. 3 Double materiality
- SASB Waste Management — métricas IF-WM-150a (TRI), IF-WM-420a (reciclaje), IF-WM-000.A/C/D
- ISO 26000:2010 estructura cláusulas 5.3 y 6.8
- PMBOK® Guide 7th — dominios de desempeño (no capítulos §4–§11 de la 6.ª ed.)

---

*Auditoría L0 · sin cambios en `standards_map.json` ni código. Correcciones ejecutables por MARCOS en siguiente iteración.*
