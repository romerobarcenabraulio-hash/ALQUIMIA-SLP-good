# 15 · FINALIZAR EL DIAGNÓSTICO RSU NACIONAL — INSTRUCCIONES
**Fecha:** 15 junio 2026 (noche)
**Autor:** Claude Master (Cowork) — verificado contra el repo
**Stream:** GOV-RSU (Hito 0 / cierre). NO toca Empresarial.
**Precondición:** la misma del `12`/`14` §10 (recon hecho, rebase resuelto, CI verde). Estas instrucciones se emiten como tickets DESPUÉS de eso.

---

## 1. ESTADO REAL DEL DIAGNÓSTICO (verificado, anti-mentira)

**Lo que SÍ existe y funciona** (no es suposición — está en el repo):
- **Motor de diagnóstico nacional** (`app/national/`): cobertura por municipio y por zona metropolitana (`coverage.py`), mapa de huella RSU (`rsu_footprint_map.py`), heatmap y grid de circularidad (`circularity_heatmap.py`, `zm_circularity_grid.py`), semilla demográfica (`rsu_demographics_seed.py`), ingesta legal (`legal_ingest.py`).
- **Adaptadores de datos públicos** (`app/data/adapters/`): SEMARNAT, CONAPO, CONEVAL, INEGI, DENUE, SMN (clima), Banxico (+ inflación), con `fallback.py` y `base.py`. La arquitectura para tirar de fuentes oficiales ESTÁ.
- **Mapeo a estándares internacionales** (`app/standards/mapper.py`): cada KPI → GRI 306 (Waste 2020), SASB EM-WM, ODS, ISO 9001:2015. `readiness.py` evalúa preparación.
- **Centros de acopio** (`app/centros_acopio/`): sync nacional (`nacional_sync.py`), geocoding, grafo de infraestructura, sync con Places/DENUE.
- **Catálogo municipal** (`app/city/municipios_mx.py`): estructura CVE INEGI (entidad+municipio).

**Lo que NO está (la brecha real):**
- El catálogo está **sembrado solo para 4 zonas metropolitanas (~11 municipios):** SLP, Querétaro, Monterrey, Guadalajara. México tiene **~2,469 municipios en 32 entidades.**
- La **cobertura legal** (reglamento de aseo/RSU por municipio) solo existe para los municipios sembrados. Es la brecha más cara: no hay reglamento curado a nivel nacional.
- **Perplexity está DIFERIDO** (sin presupuesto). El research de reglamentos hoy debe ir por Serper + Anthropic (que SÍ están), con caché.

**Veredicto honesto a tu pregunta ("¿está terminado el diagnóstico, da lo que necesitamos?"):** el *motor* está terminado y es bueno; la *cobertura nacional* NO. Tenemos un diagnóstico profundo de 4 ZMs y una máquina capaz de escalar a todo México. "Terminar" = poblar y operar esa máquina a escala nacional con procedencia.

---

## 2. DEFINICIÓN DE "DIAGNÓSTICO RSU DE TODO MÉXICO, SISTEMAS OPERATIVOS"

Se considera TERMINADO cuando, para los 2,469 municipios (o el subconjunto priorizado, ver §3):
1. Cada municipio tiene perfil base (CVE INEGI, población CONAPO, marginación CONEVAL, generación RSU estimada por factor).
2. Cada municipio tiene un `CoverageStatus` honesto: VERDE (datos+legal verificados), AMARILLO (datos sí, legal pendiente), ROJO (sin datos). **Nunca se inventa cobertura.**
3. El mapa de huella RSU y el grid de circularidad se generan nacionalmente desde datos reales (no semilla).
4. Cada KPI nacional mapea a su estándar (GRI/SASB/ODS/ISO) con cita.
5. Las APIs de datos públicos están encendidas y cacheadas; el pipeline corre sin claves LLM para lo determinista.
6. Todo dato trae procedencia (fuente + fecha). El research de reglamentos pasa por gate humano antes de marcar VERDE.

---

## 3. ESTRATEGIA DE ESCALADO (no 2,469 de golpe — anti-dispersión)

Poblar por olas, priorizadas por valor, no alfabético:
- **Ola 1 — las 4 ZMs actuales + completar sus estados** (SLP, QRO, NL, JAL completos). Valida el pipeline a escala estatal.
- **Ola 2 — las ~80 zonas metropolitanas de México** (donde vive ~63% de la población y se genera la mayor parte del RSU). Aquí está el 80% del valor.
- **Ola 3 — cola larga municipal** (resto), con `CoverageStatus` AMARILLO/ROJO honesto donde falte legal.

Regla: una ola no avanza hasta que la anterior corre verde en CI y el founder valida una muestra.

---

## 4. INSTRUCCIONES POR AGENTE (tickets, se emiten tras la precondición)

### HO-DIAG-CODEX · Backend / ingesta nacional
1. **Catálogo nacional:** poblar `municipios_mx` con los 2,469 CVE INEGI (fuente: catálogo INEGI MGN). Determinista, sin LLM.
2. **Ingesta por adaptador, con caché y procedencia:**
   - Población/proyección → CONAPO. Marginación → CONEVAL. Generación RSU → SEMARNAT (DBGIR) + factor por población. Centros de acopio → DENUE. Clima → SMN. Inflación/costos → Banxico.
   - Cada valor persiste con `source`, `fecha`, `método`.
3. **Cobertura:** correr `coverage_for_municipio` a escala; asignar `CoverageStatus` real. Donde no haya reglamento, AMARILLO (no inventar).
4. **Pipeline legal de reglamentos (la brecha):** usar `research/` con **Serper + Anthropic** (Perplexity sigue diferido), con caché DB <6h, salida = borrador de reglamento con URL fuente → **gate humano** antes de VERDE. Nunca auto-VERDE.
5. **Endpoints nacionales:** footprint map, circularity grid, coverage summary por estado/ZM/nacional.
6. Tests por ola. Pega `pytest -q` real (anti-mentira). Rama corta, merge mismo día.
7. **Env vars a confirmar en Render** (ver §5).

### HO-DIAG-CLAUDECODE · Frontend / mapa nacional + auditoría
1. SCR de las pantallas: mapa nacional de huella RSU, semáforo de cobertura por estado, ficha municipal, tablero de estándares (GRI/SASB/ODS/ISO).
2. Render del `CoverageStatus` con colores honestos (que el AMARILLO/ROJO se vea — la honestidad es feature, no defecto).
3. Auditoría de procedencia: cada cifra mostrada enlaza su fuente. Sin fuente → no se muestra como dato duro.
4. La ficha municipal alimenta el ReportBuilder PDF (reusa el patrón `empresa/pdf_perfil.py`).

---

## 5. APIS / DATASETS A ENCENDER (ahora posible vía Render conectado)

| Fuente | Variable | Para qué | Costo LLM |
|---|---|---|---|
| INEGI (MGN/DENUE/SAKBÉ) | `INEGI_API_TOKEN`, `INEGI_DENUE_TOKEN`, `INEGI_RUTEO_TOKEN` | catálogo municipal, centros de acopio, ruteo | $0 |
| CONAPO | (adapter) | población/proyección | $0 |
| CONEVAL | (adapter) | marginación/pobreza | $0 |
| SEMARNAT | (adapter) | generación RSU (DBGIR) | $0 |
| SMN | (adapter) | clima (afecta logística/orgánicos) | $0 |
| Banxico | `BANXICO_TOKEN` | inflación/costos | $0 |
| Google Places/Maps | `GOOGLE_PLACES_API_KEY`, `GEOCODING_API`, `MAPS_PLATFORM_API`, `OPTIMIZATION_ROUTE_API` | geolocalización, ruteo | $0 (cuota Google) |
| Serper | `SERPER_API_KEY` | research web reglamentos (con caché) | bajo |
| Anthropic (ÁGORA) | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | síntesis de reglamentos/documentos | medio (usar tras caché) |
| Perplexity | `PERPLEXITY_API_KEY` | **DIFERIDO** — no encender sin presupuesto | — |

Regla de costo (del `10` §5): lo determinista (catálogo, factores, cobertura) corre **sin LLM**. El LLM (Anthropic) solo para síntesis de reglamentos, y tras caché.

---

## 6. CRITERIO DE CIERRE ("todos los sistemas operativos")
- [ ] Ola 1 (4 ZMs + sus estados) poblada con datos reales y procedencia.
- [ ] Cobertura nacional con `CoverageStatus` honesto (sin invención).
- [ ] Mapa de huella + grid de circularidad nacionales renderizando datos reales.
- [ ] KPIs mapeados a GRI/SASB/ODS/ISO con cita.
- [ ] APIs públicas encendidas en Render y cacheadas; pipeline determinista sin LLM.
- [ ] Pipeline de reglamentos con gate humano operando (borrador→revisión→VERDE).
- [ ] CI verde con el número real de tests registrado en bitácora.
- [ ] Una ficha municipal genera su PDF ejecutivo.

---

## 7. NOTA DE RIGOR
El diferenciador del diagnóstico no es "tener un mapa bonito" — es que **cada número trae procedencia y el sistema dice la verdad sobre lo que NO sabe** (AMARILLO/ROJO). Eso es lo que un gobierno (o un inversionista) puede defender. Un diagnóstico que finge cobertura total es peor que uno honesto parcial. La honestidad de cobertura ES el producto.

---

*15 · Diagnóstico RSU Nacional · Alquimia Supermind · 15 junio 2026 (noche)*
