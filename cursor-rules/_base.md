# PROTOCOLO BASE — SISTEMA ALQUIMIA
> Todos los agentes referencian este archivo. Nada aquí se repite en sus cursor rules.

## ANTES DE CUALQUIER ACCIÓN — SIEMPRE

Lee en este orden. Si algo no existe, ese hallazgo es tu primer output.

```
1. /agents/registry.md              → quién existe y qué hace
2. /system/state/module_health.json → qué está roto o cambiado
3. /changelog/{tu_dominio}.md       → últimos 7 días de cambios
4. /system/state/open_issues.md     → qué está pendiente de resolver
5. /system/state/architecture_map.md → mapa estructural (KOSMOS)
```

Produce esto antes de actuar:
```
ESTADO [agente] [fecha]:
dominio: [qué encontraste]
conflictos: [con qué agentes / ninguno]
proceder: [sí / no — razón si no]
```

## CUÁNDO PARAR Y ESCALAR A SUPREME

- Lo que harás afecta a más de un dominio
- Encontraste una contradicción entre dos fuentes de verdad
- El cambio elimina o renombra algo que otros agentes consumen
- No puedes determinar cuál de dos versiones de un dato es correcta

## CUÁNDO ACTUAR SIN PEDIR PERMISO

- El cambio está dentro de tu dominio exclusivo
- No rompe interfaces con otros agentes
- Existe evidencia clara de que mejora una métrica
- Es reversible

## REGISTRO OBLIGATORIO POST-ACCIÓN

```
/changelog/{tu_dominio}.md → fecha | módulo | cambio | métrica impactada
```

## ECOSISTEMA DE AGENTES

| Agente | Dominio | Ciclo |
|--------|---------|-------|
| HERMES | Logística, rutas, flota | Diario |
| KRONOS | Planeación, gates, EVM | Semanal |
| AURUM  | Costos, presupuesto | Quincenal |
| BIOS   | Ciclo de vida, LCA | Mensual |
| POLIS  | Personalización municipal | Por municipio |
| EIDOS  | Terminología, tono | Por entrega |
| OCCAM  | Simplificación | Por trigger |
| KOSMOS | Arquitectura estructural | Wave 2 |
| SUPREME | Síntesis, arquitectura | Wave 3 |
| FORGE | Auth, onboarding, cuentas | Embebido |
| ATLAS | Deploy, CI, migraciones | Embebido |

## DATOS DE REFERENCIA DEL PROYECTO

```
Proyecto:    Alquimia — Valorización RSU, ZM San Luis Potosí
Universo:    224,000 viviendas → 18 centros de acopio → 5 recicladoras
Fracciones:  Orgánicos / PET / Papel / Vidrio / Aluminio
Meta Año 3:  725.76 t/día | $361M MXN/año | 533,178 t CO2e evitadas
Gates:       G1 Cabildo → G2 Adenda → G3 Piloto → G4 60% → G5 100%
Modelo base: Modelo_BASED.xlsx | Gantt: Gantt_RSUSLP.xlsx
```
