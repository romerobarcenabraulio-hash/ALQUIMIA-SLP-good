# 38 · PATRÓN DE INTEGRACIÓN MCP-STYLE CON ERP/SAP Y SISTEMAS EXISTENTES
**Fecha:** 18 jun 2026
**Autor:** Claude Master (Cowork)
**Propósito:** Cómo el Jarvis "absorbe" un ERP/SAP/sistema existente como interfaz que puede interpretar — un conector estilo MCP. Integrar, no reemplazar (doc 36: ERP = integrar).

---

## 1. EL PATRÓN (estilo MCP, como este mismo entorno)
MCP estandariza cómo un agente habla con sistemas externos (tools/resources) de forma uniforme. Adoptamos el MISMO patrón: cada sistema externo (SAP, CONTPAQi, Slack, Gmail) se expone al Jarvis por un **conector** con interfaz uniforme. El Jarvis no conoce las entrañas de SAP; ve una **superficie de capacidades normalizada**.

```
JARVIS / agentes
   ↑ interfaz uniforme (estilo MCP)
ROUTER DE CAPACIDADES (ALQ-27)
   ↑
CONECTOR por sistema (MCP server)  ← uno por ERP/SAP/Slack/contabilidad…
   ↑
CAPA ANTI-CORRUPCIÓN (traduce el modelo externo → nuestro modelo canónico)
   ↑
SISTEMA EXISTENTE (SAP / CONTPAQi / Slack / …)
```

---

## 2. TRES VÍAS DE CONEXIÓN (en orden de preferencia)
1. **MCP oficial del proveedor** (si existe) → enchufar.
2. **API oficial** (SAP: OData/BAPI/REST; CONTPAQi: SDK/API; Slack/Gmail: API) → envolver en NUESTRO conector que habla MCP-style al Jarvis.
3. **Sin API / legacy** → RPA / importación de archivos (CSV/export) / scraping (`app/web_scraper`) como último recurso, menor fidelidad y con más cuidado de ToS.

---

## 3. CAPA ANTI-CORRUPCIÓN (la pieza clave — el rigor)
El conector NO expone el caos del ERP al Jarvis. **Traduce** el modelo externo (clientes, facturas, inventario, órdenes) a **nuestro modelo canónico** (Company Profile, ALQ-23), con **procedencia "origen: ERP" + fecha + confianza**. Beneficios:
- El Jarvis razona sobre un modelo limpio y uniforme, no sobre las rarezas de cada sistema.
- Si SAP cambia, solo se ajusta el conector, no el core.
- Procedencia preservada (nuestro moat).
(Patrón *anti-corruption layer* de DDD.)

---

## 4. LEER vs ESCRIBIR — el gate
- **Leer** (jalar clientes/facturas/inventario/KPIs) = reversible → el Jarvis lo usa libre.
- **Escribir** (crear factura, postear orden, mover dato en SAP) = **irreversible/externo → bandeja de gate (ALQ-50/74).** El Jarvis prepara la escritura, el humano aprueba, el conector ejecuta. Nunca escribe solo.

---

## 5. "ABSORBER" ≠ REEMPLAZAR
No tumbamos el ERP. Alquimia es la **capa inteligente encima** que lo lee, razona y propone. El cliente conserva SAP; con el tiempo depende más de la inteligencia de Alquimia que de la UI del ERP → niebla (doc 16). Eso es lo que vuelve irrelevante al incumbente sin pelear su juego.

---

## 6. NUESTROS CONECTORES COMO MCP SERVERS
Construimos cada conector como **MCP server** reusable → cualquier agente (Jarvis, Codex, Claude) lo usa igual. Estándar, gobernado por:
- Catálogo de capacidades (ALQ-64) + decisión build/integrate/buy (ALQ-90: ERP = INTEGRAR).
- Auth OAuth/API-key **por tenant**, permisos por conector, revocable, aislado (ALQ-52). Nunca exponer credenciales del ERP.
- (Tenemos la metodología mcp-builder para construirlos bien.)

---

## 7. CÓMO ENCAJA CON LO YA PLANEADO
- Router de capacidades = **ALQ-27**. Gestión de conectores del cliente = **ALQ-52**. Modelo canónico = **ALQ-23**. Gate de escrituras = **ALQ-50/74**. Decisión integrar = **ALQ-90**.
- Lo nuevo de este doc: el **contrato de conector MCP-style + capa anti-corrupción** como estándar → **ALQ-95**.
- El primer conector concreto (ej. contabilidad CONTPAQi para PyME MX) = **build-by-demand**, cuando un cliente lo pida (no ahora).

---

## 8. DISCIPLINA
No construir conectores especulativos. Se construye el **patrón/estándar** (ALQ-95) una vez; cada conector concreto entra por demanda de cliente, etiquetado integrar (ALQ-90). Preferir siempre API oficial > scraping.

---

*38 · Patrón de Integración MCP-style con ERP/SAP · Alquimia Supermind · 18 jun 2026*
