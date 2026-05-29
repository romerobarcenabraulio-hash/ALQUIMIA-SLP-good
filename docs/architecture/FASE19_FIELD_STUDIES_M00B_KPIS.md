# Fase 19 · Field studies, M00B pipeline y KPIs faltantes

**Estado:** cerrado como contrato técnico de defensibilidad  
**Fecha:** 2026-05-28  
**Decisión:** ALQUIMIA exige, valida e integra estudios de campo; no los inventa ni los presenta como ejecutados por la plataforma.

## 1 · Impacto

`FIELD_STUDIES_AND_MISSING_KPIS.md` corrige una brecha real: M01, M03B, M06, M08, M09, M11 y M13 no deben sonar como diagnóstico técnico definitivo si faltan estudios locales. Desde esta fase, la regla es explícita:

> Si falta estudio local, se muestra brecha crítica o recomendada. No se convierte benchmark nacional en verdad municipal.

## 2 · Schemas de estudios de campo

Los seis contratos viven en `backend/app/automation/field_studies.py` como `FIELD_STUDIES`.

| Estudio | Gate | Criticidad | Costo MXN | Tiempo | Responsable | Evidencia requerida |
| --- | --- | --- | ---: | --- | --- | --- |
| Cuarteo y caracterización física NMX-AA-015-1985 | G1 | Crítico | 80k-250k | 2-3 semanas | Laboratorio o consultor certificado contratado por municipio | Cédula campo, informe laboratorio, bitácora, fotografías |
| Rutas y tiempos de recolección | G2 | Crítico | 30k-100k | 2-4 semanas | Operador actual supervisado | GPS/tracks, bitácora rutas, cédulas turno, pesajes |
| Censo de pepenadores y trabajadores informales | G1 | Crítico | 50k-150k | 3-6 semanas | Trabajo social municipal u ONG local | Cédula censo, consentimientos, resumen demográfico, plan integración |
| Auditoría de infraestructura existente | G2 | Crítico | 30k-80k | 1-2 semanas | Técnico municipal o consultor externo | Inventario flotilla, fichas relleno, fotografías, dictamen activos |
| Estudio jurídico-administrativo | G1 | Crítico | 40k-120k | 2-4 semanas | Abogado externo especializado | Dictamen firmado, cédula, matriz brechas, artículos propuestos |
| Estudio PSP | G2 | Recomendado si hay tarifa | 100k-300k | 4-8 semanas | Consultora socioeconómica | Metodología, base anonimizada, informe resultados |

## 3 · Brechas por gate

G1 requiere:

- `estudio_cuarteo`
- `censo_pepenadores`
- `estudio_juridico`

G2 requiere:

- `estudio_rutas`
- `auditoria_infraestructura`
- `estudio_psp` cuando M11/M13 defienden tarifa al usuario

Ejemplo de brecha crítica:

```json
{
  "study_id": "estudio_cuarteo",
  "gate": "G1",
  "criticality": "critico",
  "status": "brecha_critica",
  "message": "Falta estudio local: Estudio de cuarteo y caracterización física. No convertir benchmark en verdad municipal."
}
```

## 4 · Pipeline HERMES M00B

El pipeline quedó documentado en `M00B_HERMES_PIPELINE`.

Campos cubiertos:

- presidente municipal;
- cabildo;
- comisiones permanentes;
- estructura administrativa;
- reglamento de limpia;
- concesión actual;
- prensa 24 meses;
- próximo proceso electoral.

Cada campo incluye:

- fuentes públicas;
- método de extracción;
- confianza;
- fallback `manual_required`;
- tiempo estimado;
- campos que HERMES no debe inferir.

HERMES no debe inferir:

- posturas políticas no declaradas;
- conflictos internos de Cabildo;
- cifras privadas del concesionario;
- teléfonos/correos personales;
- partido político como variable aprendible para NOUS;
- vigencia normativa no publicada.

## 5 · KPIs de oleada uno

Los KPIs viven en `WAVE_ONE_KPIS` y se reflejan en `capability_registry.json` como `sub_capabilities`, sin crear módulos visuales nuevos.

| KPI | Módulo canónico | Gate | Fuente requerida | Confianza hasta evidencia |
| --- | --- | --- | --- | --- |
| SDG 11.6.1 | `city_baseline` | G1 | cuarteo + rutas + infraestructura | `missing_local_study_until_evidence` |
| Wasteaware ISWM físicos | `city_baseline` | G1 | cuarteo + rutas + censo + infraestructura | `missing_local_study_until_evidence` |
| Wasteaware ISWM gobernanza | `capacidad_institucional` | G1 | censo + jurídico + cuenta pública | `missing_local_study_until_evidence` |
| GRI 302-1 energía | `logistica` | G2 | rutas + infraestructura + facturas energía | `missing_local_study_until_evidence` |
| GRI 303-2 agua/lixiviados | `infraestructura` | G2 | infraestructura + bitácoras lixiviados | `missing_local_study_until_evidence` |
| Inclusión sector informal | `social_diagnostico` | G1 | censo pepenadores | `missing_local_study_until_evidence` |

## 6 · Standards map actualizado

`standards_map.json` subió a versión `1.0.2` e incorpora:

- `SDG 11.6.1`
- `Wasteaware ISWM Benchmark Indicators`
- `Wasteaware ISWM Governance Indicators`
- `Wasteaware Informal Sector Inclusion`
- `GRI 302-1`
- `GRI 303-2`
- `GRI 408-1`
- `NMX-AA-015-1985`
- `PSP/WTP Contingent Valuation`

## 7 · Capability registry actualizado

`capability_registry.json` conserva módulos existentes y agrega subcapacidades KPI de oleada uno.

Política registrada:

```json
{
  "no_local_study_policy": "show_critical_gap_not_municipal_truth",
  "kpi_wave_one_status": "contracts_only_no_local_values"
}
```

También se agregaron reglas de defensibilidad técnica a:

- `city_baseline`
- `marco_legal`
- `infraestructura`
- `logistica`
- `costos_programa`
- `esquema_concesion`
- `escenarios_financieros`

## 8 · No sobreafirmación por módulo

| Módulo | Regla |
| --- | --- |
| M01 / `city_baseline` | Distinguir benchmark nacional, inferencia y estudio de cuarteo local. |
| M03B / `marco_legal` | Sin firma jurídica, análisis preliminar, no dictamen. |
| M06 / `infraestructura` | Sin auditoría, brecha crítica antes de CAPEX validado. |
| M08 / `logistica` | Sin rutas reales, hipótesis operativa. |
| M09 / `costos_programa` | Sin auditoría/rutas, CAPEX/OPEX estimado. |
| M11 / `esquema_concesion` | Sin PSP, no defender tarifa al usuario. |
| M13 / `escenarios_financieros` | Separar dato local validado de sensibilidad financiera. |

## 9 · Pruebas

```bash
backend/.venv/bin/python -m pytest backend/tests/test_phase19_field_studies_kpis.py
backend/.venv/bin/python -m pytest backend/tests/test_phase19_field_studies_kpis.py backend/tests/test_phase18_nous_observational.py backend/tests/test_phase14_data_moat.py
python3 -m json.tool docs/architecture/capability_registry.json >/tmp/capability_registry_phase19.json
python3 -m json.tool docs/architecture/standards_map.json >/tmp/standards_map_phase19.json
```

## 10 · Estado final

**Fase 19: cerrada como contrato técnico.**

AUDITOR confirma: no se agregaron cifras locales, no se afirma ejecución de estudios, no se elevan benchmarks a verdad municipal y los KPIs nuevos quedan bloqueados por evidencia local.
