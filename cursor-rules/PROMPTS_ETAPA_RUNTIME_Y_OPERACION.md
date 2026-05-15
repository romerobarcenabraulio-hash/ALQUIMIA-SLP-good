# Siguiente etapa — Runtime, deploy y operación (post capa social en repo)

Objetivo: pasar de **«código mergeado»** a **servicio estable en URL pública**, con evidencia humana registrada en bitácora `Restore`.

Orden práctico: **23→24→25** pueden solaparse; **26–28** sólo si aplica.

Convención: línea inicial `@cursor-rules/ROL.md`, luego *Actúa como…*, luego `---TAREA---`.

---

## 23 · CSA · Despliegue listo para candidato staging/producción

`@cursor-rules/planner.rtf`  
(si no adjunta RTF: «Actúa como CSA Planner ALQUIMIA con mandato único siguiente».)

Actúas como CSA: priorizas un solo release candidate sin expandir alcance producto fuera capa social + hotfix infra.

---TAREA---

Producir tabla breve:

| Ítem | Staging necesario antes de prod | Sí/No/N/A | Dueño humano estimado |
|------|-----------------------------------|------------|------------------------|
| Vercel (o hosting actual) proyecto vinculado | | | |
| Variables `NEXT_PUBLIC_SOCIAL_STATS_SOURCE`, `NEXT_PUBLIC_SOCIAL_STATS_*`, `NEXT_PUBLIC_SOCIAL_CONTEXT_EXPORT_HIDDEN` documentadas `.env.example` | | | |
| GitHub Actions / CI último run verde en `main` | | | |
| URL canónica pública simulador (path `/simulator`) | | | |

Últimas 5 líneas: **lista de bloqueadores reales** (máximo) y siguiente **único** siguiente paso con nombre rol.

Sin pedir nuevo código frontend salvo impedimento explícito en CI.

---

## 24 · Ejecutor · Verificación técnica post-deploy «smoke infra»

`@cursor-rules/EJECUTOR.md`

Actúas como Ejecutor: ejecución y evidencia reproducible contra URL entregada por CSA — no código nuevo salvo hotfix necesario por fallo de build.

---TAREA---

1. Lista exacta comandos (curl o browser checklist) contra **BASE_URL** proporcionada: `HEAD /simulator`, `GET /robots.txt` opcional sin error 500.
2. Confirmar que assets estáticos de `frontend/public/data/social-stats/*.json` responden 200 cuando el build espera modo `static|remote`.
3. Si algo falla: diff mínimo (un archivo) o variable entorno mal seteada descrita sin dramatismo.
4. Salida obligatoriosa: tabla **endpoint | esperado | observado**.

---

## 25 · Auditor · Gate textual contra producción staging

`@cursor-rules/AUDITOR.md`

Actúas como Auditor sólo revisión texto visible en navegador en URL proporcionada; no modificas código en este prompt.

---TAREA---

Con URL **staging/publica** donde corra `/simulator` (usuario pega dominio):

1. **Pass/Fail** en 10 ítems: disclaimers sociales sin placeholder, etiquetas CVE/ZM legibles donde el simulador muestre estadísticas sociodemográficas, export Markdown sin promesas prohibidas (`SOCIAL_COPY_PROHIBITED_PUBLIC` equivalencia perceptual manual).
2. Si fallo: verbatim **máx. 120 caracteres** del texto problemático y recomendación de corrección (editorial).

Si no pueden darte login: marca **Smoke limitado público sólo vista landing + gateway** como N/A y documenta límites.

---

## 26 · Navigator · Cruce rápido post-deploy geo-jurisdiccional

`@cursor-rules/NAVIGATOR.md`

Actúas como Navigator sólo texto y consistencia etiquetas en UI vivas; maps fuera alcance aquí si no tocó código geoespacial nuevo.

---TAREA---

En URL proporcionada, verificar sólo declaraciones visibles relacionadas alcance territorial (ribbon simulador, fichas alcance «Municipio» vs «ZM»). Lista **PASS** o **VETO línea textual** corta máxima 90 palabras combinada si encuentras mezcla indebida.

Sin tickets de implementación nuevo — si VETO fuerte, CSA abre Issue con texto literal.

---

## 27 · Aesthete-1 · Regresión visual smoke (solo desktop)

`@cursor-rules/AESTHETE-1.md`

Actúa como Aesthete sólo chequeo rápido accesibilidad/jerarquización en modulo capa social vía navegador o capturas.

---TAREA---

Checklist 8 bullets sí/no WCAG perceptivo (contraste disclaimers ámbar, foco tras copiar export si navegador lo permite manualmente sin automatizar Playwright aquí si no existe infra). Resultado único línea «SHIPPABLE VISUAL MICRO» / «NO — ver bullet N».

---

## 28 · CSA · Runbook primera semana post-go-live social

«Actúa como CSA.»

---TAREA---

**Precondición:** en bitácora Restore ya existe línea con **URL canónica real** (`BASE_URL` + path `/simulator`) y **fecha** de go-live o primer deploy estable; **después** se pega o referencia este runbook.

### Runbook primera semana (bullets operativos)

- **Día 1 — Smoke completo:** lo ejecuta **Ejecutor** con `cursor-rules/SMOKE_SOCIAL_LAYER.md`; registrar en Restore una línea **pass/fail** por paso crítico (disclaimer, CVE/ZM, export PR5 si visible, JSON social-stats 200).
- **Día 3 — Smoke focalizado:** **Auditor** u **Ejecutor** designado repite pasos **6–9** del smoke (ámbito territorial + export + env relevantes); si solo hay feedback ciudadano informal, **Ejecutor** documenta síntoma sin reinterpretar texto legal.
- **Día 7 — Cierre de semana:** **CSA** revisa Restore + resultado smoke **Ejecutor** (re-ejecución corta o checklist firmado); si tres días seguidos sin incidencias sociales en soporte, marcar «ventana estable» en una línea Restore.
- **Glitch reportado por ciudadano** (UI capa social tranca, export vacío, bitácora inconsistente): pedir **URL exacta**, navegador y si usa **audiencia ciudadana** (`NEXT_PUBLIC_CITIZEN_UI`); **primer paso** borrar datos sitio / **localStorage** claves prefijo `alquimia.social.` (ver código `socialAssumptionsStorage.ts`); hard refresh; reintentar smoke paso export.
- Si tras **localStorage limpio** el fallo persiste: **Ejecutor** abre issue con pasos reproducibles + captura; **no** prometer fix sin reproducir en Preview con misma matriz env que prod.
- **Anexar fila en `fuentes de calculo/CHANGELOG_FUENTES_SOCIAL.md`** cuando cambie **cualquier** valor, `buildId`, fuente o vintage del bundle sociodemográfico versionado (Excel → extracto → `public/data/social-stats/` y/o embebido); misma PR debe citar hoja/fila o referencia humana acordada (`SOURCE_TRACE.md`).
- **No** anexar changelog solo por redeploy sin cambio de datos ni copy; usar Restore para «deploy sin cambio fuentes».
- **Escalar a Auditor (legal copy)** si aparece en prod texto que **violente** lista prohibida equivalente a `SOCIAL_COPY_PROHIBITED_PUBLIC`, disclaimers ausentes ante KPI nuevo, o promesa de aceptación/consenso; **CSA** pega verbatim ≤120 caracteres y solicita **Prompt 25** o veto explícito **LISTO/BLOQUEADO**.
- **Escalar a Auditor** también si **Navigator** ya emitió VETO territorial en vivo y el fix propuesto toca **strings** visibles (coordinar una sola pasada texto).
- **Hotfix de datos** sin cambio legal: **Ejecutor** + fila CHANGELOG; **Hotfix solo copy:** **Ejecutor** + **Auditor** approve antes de prod si la cadencia lo permite.
- **Variables env** alteradas en la semana (p. ej. `NEXT_PUBLIC_SOCIAL_STATS_SOURCE`, ocultación PR5): **CSA** anota en Restore **quién** cambió y **valor** (sin pegar secretos); **Ejecutor** re-ejecuta pasos smoke afectados el mismo día.

### Orden ejecutable rápido

1. CSA **23** fija tabla despliegue y dueños humanos  
2. Tras tener URL (**no antes** Ejecutor **24**)  
3. Paralelo posible Auditor **25** + Navigator **26** + Aesthete **27** (misma URL, ventana privada)  
4. Tras primera URL estable: CSA **28** runbook primera semana y **append corto Restore** línea resultado smoke humano

### Puntero relacionado archivos locales

| Doc | Para qué |
|-----|-----------|
| `cursor-rules/SMOKE_SOCIAL_LAYER.md` | Ejecución humana por release menor |
| `fuentes de calculo/README.md`, `CHANGELOG_FUENTES_SOCIAL.md` | Cambios de extracto desde Excel |

---

Versión archivo: **1.2 · 2026-05-15**. §28 runbook post-go-live social (texto operativo CSA). Próxima revisión tras primer deploy público donde capa social quede estable 7 días.

**Orden paso-a-paso para ejecutar esta etapa:** [`PROMPTS_ETAPA_RUNTIME_ORDEN_SERIAL.md`](PROMPTS_ETAPA_RUNTIME_ORDEN_SERIAL.md) (Pasos 1–9, con 4–6 en paralelo).
