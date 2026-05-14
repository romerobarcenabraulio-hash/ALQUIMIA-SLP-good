# Ejecutor - Auditoria P2 Reconciliada (simulator) · 2026-05-07

Estado del documento: reconciliado contra `main` despues del commit `084c9713`.

Este archivo ya no debe leerse como cierre automatico de P2. El pase original mezclaba intencion de limpieza, ramas previas y algunos cambios no aplicados en el arbol actual. La verdad vigente es la siguiente.

## P2-1 · TraceRibbon compartido

Integrado.

- `frontend/src/components/ui/TraceRibbon.tsx` existe como componente compartido.
- `frontend/src/lib/progresionUiConstants.ts` centraliza `CORTE_UI`.
- `ProgresionPlanMunicipalTiempo` usa el componente compartido.
- `PortalEmpresarial` muestra cinta de trazabilidad bajo KPIs, con hecho, supuesto, fuente, formula, corte y confianza.

## P2-2 · Componentes huerfanos

No integrado.

El pase anterior afirmaba eliminacion de varios componentes, pero en `main` siguen existiendo:

- `EditorTrayectoria.tsx`
- `HorizonteCircularidad.tsx`
- `ImpactoFinanciero.tsx`
- `Macrogeneradores.tsx`
- `ImplementacionEspacioTiempo.tsx`
- `ComparadorEscenarios.tsx`
- `GuidedPlanControls.tsx`

Decision vigente: no borrarlos sin auditoria de importadores, ruta de usuario y reemplazo funcional. ALQUIMIA no debe perder modulos utiles solo por limpiar una lista.

## P2-3 · GuidedPlanControls

No integrado como borrado.

El archivo sigue en el repo. Cualquier eliminacion futura requiere prueba de que no hay importadores ni dependencia de navegacion.

## P2-4 · Linea de tiempo colapsable

No certificado en esta reconciliacion.

Debe auditarse en browser si se retoma P2 visual. No se declara cerrado por presencia de texto en bitacora.

## P2-5 · Marco legal: objetivos y alcance

Parcialmente integrado y corregido por doctrina nueva.

- La interfaz debe hablar de `alcance`, `revision`, `fuente`, `oficialidad` y `propuesta`.
- Evitar lenguaje visible de `gate legal`, `compuerta` o `bloqueo` salvo estados tecnicos internos.
- La restriccion aplica a oficialidad, documento definitivo o sancion firme; no al analisis ni a propuestas de politica publica.

## Doctrina producto vigente

ALQUIMIA puede analizar, simular y proponer mejoras municipales. No emite dictamen legal, acto oficial, multa firme ni acuerdo de cabildo. La pagina debe ayudar a municipio, ciudadania y empresas a tomar decisiones con evidencia; no debe sentirse como un sistema que se autocensura por un gate interno.

## Verificacion vigente

- `backend/.venv/bin/python -m pytest backend/tests/test_health_deep.py backend/tests/test_q003_deploy_cors_health.py backend/tests/test_legal.py backend/tests/test_fase11_0_legal_source_ingest.py -q` paso localmente antes de la reconciliacion de copy.
- `npm run type-check` paso localmente.
- GitHub Actions del commit `084c9713` quedo en `success`.
