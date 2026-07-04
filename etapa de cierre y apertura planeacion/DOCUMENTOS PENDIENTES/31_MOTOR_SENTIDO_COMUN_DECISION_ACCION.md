# 31 · MOTOR DE SENTIDO COMÚN — MAPA DECISIÓN → ACCIÓN (ECA)
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork) — verificado contra el repo
**Propósito:** Codificar el "sentido común": los enlaces explícitos *situación → por qué → qué ejecuta el backend* (por qué un Excel ahora, por qué avisar al mecánico de los aceites, por qué facturar tanto). Sin sacrificar rigor ni caer en sesgo humano o de IA.
**Relacionado:** doc 14 (protocolo), ADR-002 (juicio), doc 29 (capacidades).

---

## 1. EL PATRÓN: Evento–Condición–Acción (ECA), no intuición del LLM

El sentido común NO se deja a que el LLM "adivine" qué hacer (ahí vive el sesgo). Se **codifica explícitamente** como un catálogo gobernado de reglas, cada una con esta forma:

```
DISPARADOR (evento/condición)  →  ACCIÓN (qué ejecuta el backend)
  · RAZÓN (por qué = estándar/regla, con procedencia)
  · TIMING (cuándo / cada cuánto)
  · TIER (determinista / LLM / template)
  · AUTONOMÍA (L0–L3) + GATE si es irreversible
  · FUENTE (de dónde sale la regla)
```

- **Disparador determinista donde se pueda** (umbral KPI, fecha de vencimiento, evento de datos) → cero sesgo.
- **El LLM solo interpreta/redacta**, nunca decide la regla ni da la cifra.
- **Irreversible → bandeja de gate (ALQ-50).** El motor propone la acción; el humano aprueba lo consequencial.
- **Anclado a un estándar/regla con procedencia** → "obvio" para un humano con sentido común, pero TRAZABLE (no inventado).

Semillas que ya existen en el repo (se reusan, no se reinventan): `app/cron/` (jobs programados), `GapDetector` (escanea huecos→alerta), `app/decision_tree/engine.py`, `app/nous/` (patrones).

---

## 2. EJEMPLOS (tus casos, codificados)

| Disparador | Acción backend | Razón (estándar/regla) | Tier | Gate |
|---|---|---|---|---|
| Eficiencia de un equipo < umbral / X horas de uso | Avisar al mecánico: revisar aceites/mantenimiento | Plan de mantenimiento preventivo (ficha del equipo/NOM) | determinista dispara · LLM redacta | Enviar mensaje = gate (o L2 si el cliente lo autoriza) |
| Obligación/fecha fiscal próxima | Generar la factura / el Excel correspondiente | Calendario fiscal + ObligationMatrix | template + determinista | Facturar/presentar = gate |
| KPI de cobertura baja en una zona | Proponer ajuste de ruta / recurso | Estándar operativo de cobertura | determinista | Reasignar recurso = gate si afecta a terceros |
| Residuo valorizable acumulado | Publicar en la Red de Comercio (cuando exista) | Datos del Sankey (E2) | determinista | Publicar/transar = gate + verificación |
| Documento por vencer (concesión, REPAS) | Alertar + preparar renovación | GapDetector + calendario regulatorio | determinista | Presentar = gate |
| Costo de insumo sube > umbral | Recalcular cotización + alertar | PriceSeries + cost_model | determinista | Reenviar cotización = gate |

→ Cada fila es una regla registrada, con su razón y procedencia. "Obvio para un humano", pero auditable.

---

## 3. CÓMO EVITA EL SESGO (humano Y de IA)
- La **regla** sale de un estándar/calendario/umbral, no del humor del LLM.
- El **cálculo** es determinista (cost_model, KPIs); el LLM no da cifras.
- La **redacción** (correo, propuesta) usa **estándares de estilo** (Minto/McKinsey, doc 28) + el pase de crítica/abogado del diablo (ADR-002) — no "mil maneras al azar", sino la mejor según estándar.
- **Registro gobernado:** las reglas se añaden con revisión humana (como el Module/Capability Registry). Nada se improvisa; nada se olvida.

---

## 4. GAPS DETECTADOS (verificados en el repo) → ISSUES
- **Motor Decisión→Acción (ECA) + catálogo de disparadores:** no existe unificado (hay cron+GapDetector+decision_tree sueltos). → **ALQ-69**
- **DB de equipo/maquinaria + eficiencia + mantenimiento:** NO hay modelo Asset/Equipment ni umbrales de mantenimiento (necesario para "avisar al mecánico"). → **ALQ-70**
- **Cotización para Empresarial + APIs/fuentes de precio:** existe `app/cotizacion` (GOV/municipal) + `PriceSeries`; falta generalizar a Empresarial e integrar fuentes de precio. → **ALQ-71**
- **Propuestas de negocio + presentaciones:** generación (pptx/docx) con estándares de estilo, envío gated. → **ALQ-72**

---

## 5. DISCIPLINA (anti-dispersión)
El catálogo ECA arranca con un puñado de reglas de alto valor (las de §2), no con mil. Cada giro/cliente añade las suyas vía registro con gate. El motor (mecanismo) se construye una vez; las reglas (política) crecen por demanda. Igual que la fábrica de agentes: se construye el constructor, no cada caso.

---

*31 · Motor de Sentido Común (Decisión→Acción) · Alquimia Supermind · 17 jun 2026*
