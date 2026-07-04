# 01 · STATUS BASELINE VERIFICACIÓN
**Responsable:** Codex / Claude Code  
**Objetivo:** Validar qué existe realmente en producción vs lo documentado en el handoff de cierre (30 mayo 2026)  
**Tiempo estimado:** 2 horas  
**Status:** INSTRUCCIÓN EMITIDA — esperando ejecución  

---

## CÓMO LEER ESTE DOCUMENTO

Este es tu checklist de verificación. Cada sección te pide que verifiques algo REAL en el código. No es teórico. Necesito que me digas exactamente qué existe y qué no.

---

## INSTRUCCIÓN 1 · VERIFICAR ESTADO GIT + COMMITS

**Qué hacer:**
```bash
cd ~/ALQUIMIA-SLP--  # o donde esté tu repo local
git log --oneline -20
git status
git branch -a
```

**Qué reportar:**
- ¿Cuál es el último commit en `main`? ¿Está el mensaje y hash?
- ¿Hay branches pendientes de merge? (especialmente `codex/clean-rescue`, `codex/rescue-consulting-modules`)
- ¿Hay cambios sin commit en el working directory?

**Archivo de salida:** Copiar output a `STATUS_GIT_LOG.txt`

---

## INSTRUCCIÓN 2 · VERIFICAR DEPLOYMENT ACTUAL EN VERCEL

**Qué hacer:**
1. Abre https://alquimiaplatform.com en navegador incognito
2. Login con `demo@alquimiaplatform.com` (magic link vía Clerk)
3. Navega a `/hub` — ¿existe? ¿qué ve?
4. Navega a `/admin` (si existe) — ¿existe? ¿qué ve?
5. Abre DevTools (F12) → Console → paste: `console.log(navigator.userAgent)` — copiar versión

**Qué reportar:**
- ¿El sitio carga sin errores?
- ¿El login funciona con magic link?
- ¿Las rutas documentadas existen?
- ¿Hay errores en la consola de DevTools?

**Archivo de salida:** `STATUS_DEPLOYMENT_VISUAL.txt` con descripciones de lo que viste

---

## INSTRUCCIÓN 3 · VERIFICAR STACK TÉCNICO EN CÓDIGO

**Qué hacer:**
```bash
# Verificar package.json
cat package.json | grep -A 2 '"dependencies"'

# Verificar versión de Next.js
grep '"next"' package.json

# Verificar si existe Redis en código
grep -r "redis" --include="*.ts" --include="*.tsx" src/ | head -5

# Verificar si existe Neon connection
grep -r "neon" --include="*.ts" --include="*.py" . | head -5
```

**Qué reportar:**
- Versión exacta de Next.js (¿es 15?)
- ¿Está Redis importado? ¿Dónde se usa?
- ¿Está Neon Postgres conectado? ¿Dónde está la connection string?
- ¿Clerk está integrado?

**Archivo de salida:** `STATUS_STACK_VERIFICACION.txt`

---

## INSTRUCCIÓN 4 · INVENTARIO DE FEATURES SHIPPED (VERIFICACIÓN CÓDIGO)

Para CADA feature del listado en el handoff anterior, haz lo siguiente:

| Feature | Dónde buscarlo | Verificación |
|---------|---|---|
| Simulador con versionado | `/pages/simulador` o `/app/simulador` | ¿Existen los archivos? ¿Hay componente Simulador? |
| AdminMasterTable | `/components/AdminMasterTable` o `/admin` | ¿Existe el componente? ¿Tiene 12 columnas mínimo? |
| Generador registry CRUD | `/app/generators` o `/pages/generators` | ¿Existen rutas para GET/POST/PUT/DELETE? |
| Decision tree ISIC | `/components/DecisionTree` | ¿Existe componente? ¿Tiene lógica condicional? |
| Web scrapers (DOF, SEMARNAT, COFEMER) | `/api/scrapers` o `/lib/scrapers` | ¿Existen archivos con aiohttp + BeautifulSoup? |
| Residue tracking con IQR/Z-score | `/lib/analytics` o `/api/residue` | ¿Existe función de outlier detection? |
| Municipal aggregator | `/api/aggregation` | ¿Existen funciones de rollup? |
| Propuesta engine | `/api/propuesta` o `/lib/propuesta` | ¿Existe endpoint `/propuesta/public/{nombre}`? |
| NOUS v1 (6 patrones) | `/lib/nous` o `/api/nous` | ¿Existen definiciones de patrones? |
| BANOBRAS evaluación | `/api/banobras` | ¿Existe scoring de 7 criterios? |
| LogisticsDailySummary | `/lib/logistics` o `/api/logistics` | ¿Existe esquema de tracking? |

**Para cada feature:**
- ✅ EXISTE → copiar path exacto
- ❌ NO EXISTE → reportar como "faltante"
- ⚠️ INCOMPLETO → reportar qué falta exactamente

**Archivo de salida:** `STATUS_FEATURES_INVENTARIO.md` (tabla con hallazgos)

---

## INSTRUCCIÓN 5 · VERIFICAR SCHEMA DE DATOS

**Qué hacer:**

Si usas TypeScript, ejecuta:
```bash
# Buscar definición de DataPoint
grep -r "interface DataPoint\|type DataPoint" src/ lib/
```

Si usas Python (backend FastAPI), ejecuta:
```bash
# Buscar modelos Pydantic
grep -r "class DataPoint\|class.*Data" backend/ | head -20
```

**Qué reportar:**
- ¿Existe un esquema DataPoint?
- ¿Tiene las 7 categorías documentadas en el handoff? (investigado, calculado, cliente-provisto, etc.)
- ¿O tiene un schema diferente?

**Archivo de salida:** `STATUS_SCHEMA_DATAPOINT.txt` (copiar la definición exacta)

---

## INSTRUCCIÓN 6 · VERIFICAR AUTHENTIFICACIÓN

**Qué hacer:**
```bash
# Buscar Clerk integration
grep -r "clerk\|Clerk" src/ --include="*.ts" --include="*.tsx" | head -10

# Buscar magic link
grep -r "magic" src/ --include="*.ts" --include="*.tsx" 

# Buscar TOTP
grep -r "totp\|TOTP" src/ --include="*.ts" --include="*.tsx"

# Verificar JWT bridge mencionado en handoff
grep -r "/auth/clerk-exchange" src/ --include="*.ts" --include="*.tsx"
```

**Qué reportar:**
- ¿Clerk está integrado?
- ¿El magic link está implementado?
- ¿TOTP existe?
- ¿El endpoint `/auth/clerk-exchange` existe? (commit mencionado: c592588)

**Archivo de salida:** `STATUS_AUTH_VERIFICACION.txt`

---

## INSTRUCCIÓN 7 · LISTAR GAPS EVIDENTE

Después de completar 1-6, haz UNA revisión rápida y lista:

**Gaps claros detectados:**
- Feature documentada pero NO encontrada en código
- Feature que encontraste pero incompleta
- Código que encontraste pero NO documentado

**Formato:**

```markdown
## GAPS DETECTADOS

### Documentado pero NO implementado
- [ ] Feature X — se menciona en handoff pero no existe archivo
- [ ] Feature Y — existe archivo vacío

### Implementado pero INCOMPLETO
- [ ] Feature Z — existe pero solo 3 de 7 patrones

### Código que existe pero NO está documentado
- [ ] Función en `/api/xyz` — no mencionada en handoff
```

**Archivo de salida:** `STATUS_GAPS_SUMMARY.md`

---

## CRITERIOS DE ACEPTACIÓN

Este handoff se considera COMPLETADO cuando:

1. ✅ **Todos los 7 archivos de salida existen:**
   - `STATUS_GIT_LOG.txt`
   - `STATUS_DEPLOYMENT_VISUAL.txt`
   - `STATUS_STACK_VERIFICACION.txt`
   - `STATUS_FEATURES_INVENTARIO.md`
   - `STATUS_SCHEMA_DATAPOINT.txt`
   - `STATUS_AUTH_VERIFICACION.txt`
   - `STATUS_GAPS_SUMMARY.md`

2. ✅ **La información es honesta, no especulativa.** Si no puedes verificar algo, dices "NO VERIFICABLE" en lugar de adivinar.

3. ✅ **Hay un resumen ejecutivo de 200-300 palabras** que resume: "De 25-30% documentado como shipped, ¿qué porcentaje verificamos que existe realmente?"

4. ✅ **Los archivos se suben en PR a rama `verify/status-baseline`** con mensaje claro.

---

## BLOQUES ESPERADOS

- Necesitas acceso al repo local
- Necesitas poder deployar y acceder a https://alquimiaplatform.com
- Si el sitio está down, reporta eso explícitamente

---

## PRÓXIMOS PASOS DESPUÉS DE ESTE HANDOFF

Una vez Codex completa esto, Claude Master (yo) analizará los gaps y emitiré **HO-002: PLAN DE EJECUCIÓN SPRINT 1** basado en la realidad encontrada, no en lo que documenta dice.

---

*01 · STATUS BASELINE VERIFICACIÓN · Alquimia SLP · 14 junio 2026*
