# Bloques QHC (LOGOS)

Complemento pedagógico de `guia_estilo.md` y `glosario_canonico.md`.

## Definición

**QHC** = bloque obligatorio junto a todo elemento técnico complejo (gráfica, tabla, modelo, KPI, matriz).

| Rubro | Contenido | Máximo |
|-------|-----------|--------|
| **Qué** | Qué mide, calcula o muestra el elemento | 2 oraciones |
| **Cómo** | Cómo leerlo, interpretarlo o calcularlo | 2 oraciones |
| **Cuidado** | Límites, supuestos, horizonte, audiencia y qué **no** inferir | 2 oraciones |

> La **H** del acrónimo corresponde a **Cómo** (*how*). La **C** final es **Cuidado** (límites de uso).

## Formato Markdown (documentos)

```markdown
> **QHC · [Nombre del elemento]**
> - **Qué:** …
> - **Cómo:** …
> - **Cuidado:** …
```

## Formato UI (simulador)

En el frontend, el equivalente vive en:
- `frontend/src/data/chartBriefCatalog.ts` — catálogo central por `chart_id`
- `moduleEditorialBriefs.ts` → overrides por módulo + `getChartBrief()`
- Rail derecho: «Cómo se calcula», «Origen de datos», «Supuesto crítico»
- Microcopy: «Cómo leer este número» (`CircularityBaselineCard.tsx`)

No duplicar QHC en UI si ya existe metodología en rail; en export PDF sí incluir bloque compacto.

## Cuándo es obligatorio

- Tablas con ≥3 indicadores financieros u operativos
- Gráficas de sensibilidad, escenarios o evolución temporal
- Modelos (financiero, logístico, ambiental) referenciados en informes
- Siglas técnicas en audiencia Cabildo o ciudadana (VPN, TIR, AC, EVM, Gate)

## Aterrizaje de tecnicismos (audiencias no técnicas)

En Cabildo, ciudadano e informes ejecutivos, la **primera mención** de un término del glosario incluye definición en línea:

| Término | Aterrizaje en primera mención |
|---------|------------------------------|
| RSU | residuos sólidos urbanos (RSU) |
| Valorización | recuperación de materiales con valor de mercado (valorización) |
| Centro de acopio (CA) | punto municipal donde se reciben fracciones ya separadas |
| Gate | punto de control del plan — debe cumplirse antes de avanzar |
| VPN | valor presente neto (VPN) — suma de flujos futuros en pesos de hoy |
| TIR | tasa interna de retorno (TIR) — rendimiento anualizado del flujo |
| AC | costo real acumulado (AC) en el seguimiento del presupuesto |

## Palabras prohibidas

- **obviamente** — sustituir por explicación directa o eliminar
- **claramente**, **sin duda** — mismo criterio cuando implican conocimiento previo no declarado

---

*LOGOS · ALQUIMIA · Ver `cursor-rules/logos.md`*
