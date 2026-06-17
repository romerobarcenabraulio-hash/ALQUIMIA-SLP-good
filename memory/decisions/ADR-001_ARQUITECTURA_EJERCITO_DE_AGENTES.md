# ADR-001: Arquitectura Del Ejercito De Agentes

**Status:** Proposed; pendiente firma founder.
**Fuente original:** `etapa de cierre y apertura planeacion/DOCUMENTOS PENDIENTES/13_ADR-001_ARQUITECTURA_EJERCITO_DE_AGENTES.md`
**Fecha:** 15 junio 2026

## Decision

ALQUIMIA adopta una fabrica declarativa de agentes: engine compartido + specs gobernadas. No se construye cada agente uno por uno ni se permite auto-modificacion libre desde internet.

## Capas

1. **Engine compartido:** ciclo del ejecutor, procedencia, razonamiento, gate irreversible y registro.
2. **Spec declarativa:** rol, intake, permisos, autonomia L0-L3, fuentes y criterios.
3. **Catalogo por tiers:** conocimiento abierto, soluciones generativas revisables, acciones irreversibles gobernadas.
4. **Learning store:** aprendizaje externo/auditable con procedencia; no muta comportamiento silenciosamente.

## Clases De Agentes

- **Class A - Builder agents:** internos de Alquimia, backend, compartidos, multi-tenant, fijos-versionados.
- **Class B - Jarvis del cliente:** instanciados por tenant desde entrevista/company profile, aislados por contexto.

## Regla De Seguridad

El conocimiento abierto puede alimentar propuestas, pero nunca dispara directamente una accion irreversible. Toda accion externa o irreversible requiere gate humano.

## Consecuencias

- Agregar agentes debe ser agregar specs validadas, no duplicar engines.
- La auto-generacion de specs se difiere hasta tener 2-3 specs vivas, schema estable y gate humano.
- GOV/Hito 0 no debe bloquearse por esta fabrica; se construye solo lo minimo que el modulo que cobra necesite.

## Action Items Derivados

- Definir frontera reversible/irreversible.
- Definir schema formal de Agent Spec.
- Definir reglas ORCHESTRATOR/SECTOR.
- Definir lifecycle Jarvis Class B.
- Definir router de capacidades/proveedores.
