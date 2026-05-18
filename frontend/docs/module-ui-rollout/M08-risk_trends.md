# Ejecutor — M08 `risk_trends`

## Prompt Ejecutor (una línea)

Ejecutarás íntegramente este archivo como única fuente de alcance; `{{RUTA_EJECUTOR_MD}}` = `frontend/docs/module-ui-rollout/M08-risk_trends.md`.

---

## Referencias MODULE_MAP

- **Row ID:** M08 (módulo dedicado; distinto de M07 `market_traceability` / Reasoning Graph)
- **`module_id`:** `risk_trends`
- **Audiencia:** functionary (exclusivo en `AUDIENCE_MODULES`)

---

## Alcance táctil (lista cerrada)

Únicamente:

| Ruta | Rol |
|------|-----|
| `frontend/src/components/simulator/RiskTrendsPanel.tsx` | UI principal |
| `frontend/src/app/api/trendscape/route.ts` | Agregador tendencias |
| `frontend/src/data/trendscapeBaseline.ts` | Baseline curado sin API externa |
| `frontend/src/app/simulator/renderDecisionModule.tsx` | Solo `case 'risk_trends'` / import dinámico — no otros `case` |
| `frontend/src/lib/audienceModules.ts` | Solo línea `risk_trends` en `functionary` si hay que corregir visibilidad |
| `backend/app/city/repository.py` | Solo el `DecisionModule` de `risk_trends` si hay que ajustar etiqueta copy |

**Prohibido:** cambiar `market_traceability` / `ReasoningGraphPanel` salvo bug demostrado fuera de este módulo; nuevas dependencias npm sin aprobación PM.

---

## Variables de entorno (servidor / Vercel)

| Variable | Uso |
|---------|-----|
| `TRENDSCAPE_UPSTREAM_URL` | URL GET del proveedor de tendencias (se reenvían query `zm`, `municipios`) |
| `TRENDSCAPE_API_KEY` | Opcional; `Authorization: Bearer` hacia upstream |

Sin variables: `/api/trendscape` devuelve baseline ALQUIMIA (`source: alquimia_baseline`).

---

## Navigator

Copy territorial: municipio vs ZM; no atribuir actos de autoridad municipales a la ZM. Texto ya incorporado en `RiskTrendsPanel`.

---

## CHECKLIST antes de merge

- [ ] `cd frontend && npm run type-check && npm run lint && npm run test`
- [ ] Probar manual: audiencia funcionario, paso “Riesgos y tendencias”, `/api/trendscape` 200
- [ ] Row **M08** citado en PR

---

## Git (rama sugerida)

`feat/ui-rollout-M08-risk-trends`
