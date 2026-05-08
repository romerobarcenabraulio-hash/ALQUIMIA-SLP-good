# 22.2 · Perfil Funcionario — "¿Cómo planeo el cambio?"

Propósito: dar al funcionario público una sala de mando institucional, con base legal, instrumentos PER, gates y escenarios de implementación.

## Módulos visibles
- `city_baseline`: hero + `FuentesDatos`.
- `municipal_context`: `MarcoLegal`, `DiagnosticoJuridico`, `CoberturaNacional`.
- `future_goals`: `HorizonteCircularidad`, `EditorTrayectoria`, `ImplementacionEspacioTiempo`.
- `infrastructure_operations`: `CentrosAcopio`, `Logistica`, `OperacionPERBitacora`, `AdvertenciasGateLegal`, `FlujosResiduos`, `HojaRuta`.
- `scenarios_export`: `ComparadorEscenarios`, `ExportarSection`, `ExportadorReporte`, `DashboardKPIs`, `AlertasPanel`, `GovernancePanel`, `LaunchChecklist`.
- Ocultos para esta audiencia: `citizen_inputs` (sólo accesibles vía toggle "ver vista ciudadana"), `market_traceability` (entrega como complemento).

## Tono y léxico
- Institucional, estratégico, basado en ley.
- Frases de referencia: "Conforme al Reglamento Municipal de Limpia, el gate jurídico requiere…".
- Evitar: tono coloquial; metáforas financieras agresivas.

## NarrativeBridge requerido
- `AdvertenciasGateLegal`: explicar qué desbloquea cada gate y a qué fase pasa el funcionario.
- `OperacionPERBitacora`: vincular cada PER con KPI municipal.
- `ImplementacionEspacioTiempo`: "Si activas este corredor, en 6 meses podrías cubrir Z%; faltan validaciones A y B".
- `CentrosAcopio`: brecha → CAPEX → impacto operativo.

## Criterios de aceptación
- Vista predeterminada solo módulos listados.
- Toggle opcional para "ver vista ciudadana" sin perder la vista principal.
- Cada alcance legal, PER y decisión municipal tiene NarrativeBridge.
