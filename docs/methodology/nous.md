# Metodologia capa de aprendizaje supervisado

**Estado:** metodologia interna operativa  
**Proposito:** explicar como ALQUIMIA observa, audita y gobierna aprendizaje supervisado sin caja negra.

## Principio

capa de aprendizaje supervisado observa, registra y sugiere. No decide, no firma, no aprueba, no cambia gates, no actualiza `capability_registry.json` y no recalibra automaticamente.

La maquina puede equivocarse. Por eso todo patron debe poder pausarse, retirarse o bloquearse con motivo auditable.

## Capas

### Capa 1 · Correcciones de inferencia

Registra cuando un cliente confirma, ajusta, reemplaza o marca no aplicable un dato inferido.

Umbrales:

- `n >= 3`: patron emergente interno.
- `n >= 5`: minimo para publicacion futura, si pasa gates.

### Capa 2 · Outcomes de gates

Registra snapshots de G1-G5: exito, falla, diferimiento o cierre con modificaciones.

Umbrales:

- `n >= 8`: emergente interno.
- `n >= 15`: establecido y publicable solo con gates.
- `n >= 30`: robusto.

### Capa 3 · Deltas proyectado vs real

Registra diferencias entre proyeccion y dato real en M01, M09, M13, M17 u otros modulos con medicion confiable.

Umbrales:

- minimo 6 meses;
- minimo 3 tenants comparables;
- `n >= 18` observaciones para publicacion futura.

## Opt-in

Sin opt-in explicito, los datos de un tenant solo sirven para su propia operacion. No alimentan analytics agregada ni patrones cross-tenant.

## Bias filter

capa de aprendizaje supervisado no aprende ni publica correlaciones con variables protegidas, nombres de funcionarios, partido politico especifico, datos personales o municipios origen identificables.

revision metodologica puede vetar y retirar cualquier patron.

## Founder gate

Ningun patron se publica sin founder gate. El founder puede:

- aprobar publicacion;
- posponer;
- retirar;
- pausar capa de aprendizaje supervisado globalmente.

## revision de estandares y validacion de arquitectura

revision de estandares valida que una sugerencia no contradiga estandares declarados en `standards_map.json`.

validacion de arquitectura valida que el patron respete schema, modulo destino y dependencias.

## guardrail editorial

Las sugerencias deben ser claras y no autoritarias.

Lenguaje bloqueado:

- "capa de aprendizaje supervisado predice";
- "modelo predice";
- "debes";
- "tienes que";
- "obligatorio";
- "la IA decidio".

Lenguaje permitido:

- "sugerimos";
- "considera";
- "la evidencia agregada indica";
- "requiere validacion humana".

## Self-report trimestral

Cada trimestre capa de aprendizaje supervisado genera reporte con:

- patrones detectados;
- aprobados;
- rechazados;
- retirados;
- motivos de retiro;
- sugerencias aceptadas, ajustadas y rechazadas;
- motivos principales de rechazo;
- correlacion con outcomes posteriores cuando exista evidencia;
- riesgos de sesgo detectados.

El self-report no debe maquillar performance. Si falta evidencia posterior, se declara insuficiente.

El self-report tambien declara:

- recomendacion revision founder: continuar, pausar o ajustar;
- validacion validacion de arquitectura: ningun cambio automatico a `capability_registry.json`;
- archivo integridad operativa: audit log retenido y prohibicion de eliminacion silenciosa.

## Criterios de retiro

Un patron se retira o marca para revision si ocurre cualquiera de estos casos:

- bias check fallido;
- performance peor que baseline;
- N insuficiente tras revision;
- contradiccion con estandar;
- rechazo sostenido por clientes;
- cambio regulatorio;
- decision founder.

## Estados de patron

- `active`
- `under_review`
- `retired_bias`
- `retired_low_performance`
- `retired_stale`
- `paused_by_founder`
- `superseded`

## Que NO hace capa de aprendizaje supervisado

- No decide por clientes.
- No emite recomendaciones politicas personales.
- No publica patrones con N bajo.
- No usa datos privados sin opt-in.
- No expone tenants comparables identificables.
- No recalibra automaticamente.
- No actualiza registros normativos ni capability registry.
- No sustituye a fundador, consultor, Cabildo, juridico municipal ni revision metodologica.
