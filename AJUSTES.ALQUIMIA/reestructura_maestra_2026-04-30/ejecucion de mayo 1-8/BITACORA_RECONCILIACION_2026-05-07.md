# Bitacora de Reconciliacion · Universo 2026-05-07

Fecha de reconciliacion: 2026-05-07 / 2026-05-08 UTC.

Commit base verificado: `084c9713 chore(legal): reconcile municipal sources and UI scope`.

## Lectura ejecutiva

Los agentes dejaron una mezcla de implementacion real, evidencias de busqueda, auditorias historicas y documentos aspiracionales. La reconciliacion fija una sola doctrina para `main`:

ALQUIMIA analiza, simula y propone politica publica municipal, programas de circularidad y mejoras reglamentarias. La plataforma no emite dictamen legal, sancion firme, documento oficial ni acuerdo de cabildo. Por tanto, el sistema no debe girar alrededor de "gates legales" que impidan analizar; debe girar alrededor de fuente, provenance, alcance, revision competente, oficialidad y accion siguiente.

## Como debe estar la pagina

1. Entrada por audiencia y municipio antes de metas futuras.
2. Baseline RSU municipal visible con fuente, confianza e incertidumbre.
3. Journey real por perfil: ciudadania, municipio/funcionario, empresa/institucion.
4. Modulos conectados a contratos/API, no secciones decorativas.
5. Legal municipal siempre por municipio; ZM nunca sustituye reglamento municipal.
6. Restricciones solo para oficialidad, sancion firme o documento definitivo; educacion, simulacion, analisis y propuesta permanecen abiertos.
7. Querétaro no recibe nueva sancionalidad propuesta; recibe maduracion probatoria y expediente.
8. GDL/Zap/SPG muestran fuente/proveniencia sin declararse juridicamente validados.
9. Todo output cuantitativo debe tener formula, fuente, unidad, explicacion e incertidumbre.
10. La pagina no debe exponer lenguaje interno: `semilla Q-*`, `trace:`, `Context API`, `Hidratando`, rutas crudas o nombres de agentes.

## Archivos de hoy ya integrados a `main`

### Release / observabilidad

- `backend/app/observability.py`
- `backend/app/main.py`
- `backend/tests/test_health_deep.py`
- `backend/tests/conftest.py`
- `frontend/src/lib/requestId.ts`
- `frontend/src/app/robots.txt/route.ts`
- `frontend/middleware.ts`
- `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/RELEASE_OPS_2026-05.md`

Razon: preparar salud profunda, trazabilidad por `X-Request-ID`, noindex y operacion de release. Estado: integrado y CI verde.

### Fuente legal / CSA

- `ADENDOS: LEGAL/CSA_DESCARGA_2026-05-07.md`
- `ADENDOS: LEGAL/MANIFEST_REGLAMENTOS_2026-05.md`
- `ADENDOS: LEGAL/source_manifest_checksums_2026-05-07.json`
- PDFs/DOCs bajo `ADENDOS: LEGAL/pdfs/reglamentos/`
- symlinks bajo `frontend/public/reglamentos/`
- evidencia INFOMEX/no localizable.

Razon: tener trazabilidad verificable de fuentes municipales. Estado: integrado con regla explicita: descarga/checksum no equivale a validacion juridica.

### Reconciliacion legal/producto

- `backend/app/legal/repository.py`
- `backend/tests/test_legal.py`
- `backend/tests/test_fase11_0_legal_source_ingest.py`
- `frontend/src/data/reglamentos.ts`
- `frontend/src/data/adendos.ts`

Razon: corregir seeds y narrativa municipal. Estado: integrado. QRO se trata como municipio con regimen existente; SPG queda como candidato en revision; GDL/Zap tienen fuente localizada.

### UI/copy

- `frontend/src/components/ui/TraceRibbon.tsx`
- `frontend/src/lib/progresionUiConstants.ts`
- `frontend/src/components/simulator/PortalEmpresarial.tsx`
- `frontend/src/components/simulator/ProgresionPlanMunicipalTiempo.tsx`
- `frontend/src/components/simulator/AdvertenciasGateLegal.tsx`
- `frontend/src/components/simulator/DiagnosticoJuridico.tsx`
- `frontend/src/components/simulator/GovernancePanel.tsx`
- `frontend/src/components/simulator/ComparadorEscenarios.tsx`
- `frontend/src/components/simulator/HojaRuta.tsx`
- `frontend/src/components/simulator/OperacionCampo.tsx`
- `frontend/src/components/simulator/CityFirstSelector.tsx`

Razon: hacer visible trazabilidad, alcance, restricciones de oficialidad y propuesta. Estado: integrado parcialmente; falta browser QA completo posterior a esta reconciliacion.

## Archivos historicos o aspiracionales reconciliados

- `AESTHETE_POLISH_2026-05.md`: ahora describe direccion y pendientes reales, no cierre automatico.
- `EJECUTOR_AUDIT_P2_2026-05-05.md`: ahora marca que los borrados de componentes no ocurrieron y no deben asumirse.
- `QA_VISUAL_2026-05-07.md`: queda como auditoria historica pre-merge/promote; sus FAIL explican por que se corrigio copy, pero no certifican el estado actual.
- `CLC_LOCALIZACION_2026-05-07.md`: valido como contexto CLC; no como validacion juridica competente.
- `EJECUTOR_AUDIT_FIX_2026-05-07.md`: valido como cierre P0/P1 de una rama; debe contrastarse con `main` antes de usar como DoD.

## Decisiones doctrinales

### Legal

- Cambiar mentalidad de compuerta jurídica a alcance legal, fuente, revisión y oficialidad.
- Restringir solo oficialidad, documento definitivo o sancion firme.
- Mantener educacion, analisis, simulacion y propuesta siempre disponibles cuando haya datos suficientes.
- Fuentes historicas o descargadas son insumos; no son verdad juridica final.

### Querétaro

- No proponer nueva escala UMA.
- No decir que falta sancionalidad.
- Proponer protocolo de evidencia, expediente, cadena administrativa y armonizacion con procedimiento/tabulador existente.

### Empresas

- El portal empresarial debe separarse de GOV a futuro, pero el simulador actual puede mostrar una entrada empresarial conectada si mantiene RSU/no-RSU separados, fuentes, formulas y warnings.

## Verificacion ejecutada antes de esta bitacora

- Local backend: `backend/.venv/bin/python -m pytest backend/tests/test_health_deep.py backend/tests/test_q003_deploy_cors_health.py backend/tests/test_legal.py backend/tests/test_fase11_0_legal_source_ingest.py -q` -> 250 passed.
- Local frontend: `npm run type-check` -> OK.
- GitHub Actions commit `084c9713` -> success.

## Pendientes reales

1. Browser QA actual contra `main` desplegado, no contra rama historica.
2. Limpieza gradual de nombres internos `legal_gate`, `gate_activo`, `sin_gate` si se decide migrar contrato; por ahora pueden permanecer como valores internos con labels publicos corregidos.
3. Re-auditar docs de Fases 22-30 para que no vuelvan a pedir "gates legales" como concepto visible.
4. Confirmar envs `ALQUIMIA_HIDE_GDL` y `NEXT_PUBLIC_ALQUIMIA_HIDE_GDL` en produccion segun decision de release.
5. Revalidar visualmente QRO, SPG, GDL y Zapopan en el modal de fuentes.
