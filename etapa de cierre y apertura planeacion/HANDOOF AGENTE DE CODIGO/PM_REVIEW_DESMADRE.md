# PM REVIEW · Diagnóstico exigente del estado del código y el frontend

**Fecha:** 19 junio 2026
**De:** Founder
**Para:** Project Manager
**Tono:** sin filtro. Necesito que entiendas qué está pasando y me regreses un plan, no una disculpa.

---

## El problema en una frase

Estamos gastando ciclos arreglando que el código pase nuestros propios tests, en vez de construir producto. Hay una discrepancia entre cómo debe verse el frontend y el código viejo que arrastramos, y nadie tiene el mapa completo de qué está vivo y qué está muerto. Necesito que tú lo construyas.

---

## Lo que los datos de deployment muestran (esto no es opinión, es el historial real)

Revisé los últimos 20 deployments. Esto es lo que veo, y es preocupante:

### Señal 1 · El equipo está atrapado en un loop de "arreglar tests"
La mayoría de los commits recientes del PR #32 son variaciones de lo mismo:
- "fix: resolve 3 remaining guardrail test failures"
- "fix(frontend): fix 3 more guardrails test failures"
- "fix: replace 'stakeholder' with canonical term per EIDOS terminology check"
- "fix(frontend): use literal strings in metodologia citation scheme"

**Qué significa:** tenemos un sistema de "guardrails" y un "EIDOS terminology check" que pelean contra el código. Alguien refactoriza una página, eso rompe un test que busca un string literal exacto, y luego hay que hacer otro commit para volver a meter el string. Es un perro mordiéndose la cola. **No es construcción, es reconciliación interminable.**

### Señal 2 · Hay confusión de fuentes de verdad
- El repo se llama `ALQUIMIA-SLP-good`. Ese "-good" es la huella de "hice una copia limpia para empezar de nuevo". Eso significa que probablemente existe un repo viejo con código que ya no usamos pero que nadie ha archivado oficialmente.
- Veo branches que compiten: `codex/frontend-clean-origin`, `codex/alq-104-reconcile`, `fix/ci-postgres-service`, `alq-16-design-system`, `claude/alq-13-container-inventory`, `claude/wizardly-sagan`. Hay al menos dos agentes (Codex y Claude Code) trabajando en paralelo, más branches de "clean" y "reconcile" que existen justamente porque las cosas no están limpias ni reconciliadas.

### Señal 3 · Lo bueno (para que no cunda el pánico)
No todo es ruido. En medio del loop hay trabajo real reciente y valioso:
- ALQ-16: un `DESIGN_SYSTEM.md` canónico (tokens, tipografía, accesibilidad, anti-patterns). **Esto es oro y es la base para limpiar el frontend.**
- ALQ-20: accesibilidad WCAG 2.2 AA (targets de 44px, reduced-motion, focus-visible).
- ALQ-13: ContainerInventory (modelo de contenedores físicos con aislamiento por tenant).
- Catálogo nacional de municipios cargado.
- Todos los deploys están en estado READY (no hay builds rotos en producción).

El frontend NO está como hace dos semanas. Avanzó. El problema es que el avance está disperso en branches y enterrado bajo el ruido de los fixes de tests, y por eso se SIENTE estancado.

---

## Lo que necesito que hagas, en orden estricto

### 1 · Establece UNA fuente de verdad (hoy mismo)
- Confirma que `ALQUIMIA-SLP-good` es EL repo. El viejo (`ALQUIMIA-SLP--` o como se llame) se archiva oficialmente: read-only, nadie commitea ahí, nota en el README diciendo "DEPRECADO, usar -good".
- Una sola persona (tú, mientras yo no esté encima) controla los merges a `main`. Codex y Claude Code construyen en branches, pero nadie mergea a main sin tu revisión. Esto detiene la bola de nieve en seco.

### 2 · Mapa de vivos y muertos del frontend (auditoría, NO borrado a ojo)
No borres nada "a mano" ni "a ojo". Corre una auditoría con el agente:
- Lista cada página (`app/`) y cada componente (`components/`).
- Para cada uno: ¿está importado por alguien? ¿está en la navegación real? ¿tiene cifras hardcoded?
- Marca los **huérfanos** (los que nadie importa). Esos son seguros de borrar.
- Los que sí se usan, no se tocan sin entender por qué.
- Entrégame esa lista: "estos N componentes están muertos, propongo borrarlos; estos M están vivos."

### 3 · Resuelve el loop de los guardrails (esto es la sangría)
Quiero una decisión explícita sobre el sistema de "guardrails" y el "EIDOS terminology check":
- ¿Estos tests nos están protegiendo de algo real, o solo nos hacen perseguir strings literales?
- Si protegen algo real (que el frontend no pierda la filosofía cero invención, los sellos de cita, etc.), entonces hay que reescribirlos para que validen COMPORTAMIENTO, no strings exactos. Un test que se rompe porque cambiaste "Formato Chicago" a "formato Chicago" es un test mal hecho.
- Si no protegen nada crítico, se relajan o se quitan. No podemos seguir gastando PRs enteros en complacer a un linter de terminología.
- Dame tu recomendación con ejemplos concretos de cuáles tests son útiles y cuáles son ruido.

### 4 · Inventario de PDFs y extracción (lo otro que me preocupa)
Por separado pero relacionado: necesito el inventario de todos los PDFs subidos (normas GRI, documentos de cliente, iniciativas) y a qué módulo alimenta cada uno. Y el diagnóstico de por qué el scraping no avanza —mi sospecha fuerte es que los PDFs de Periódico Oficial/DOF rompen la extracción de texto por codificación CID, y hay que rasterizar a imagen + OCR en vez de extraer texto directo. Verifícalo con un PDF de muestra.

---

## Lo que quiero de regreso (entregables concretos)

1. Confirmación de repo único + regla de merge única. (hoy)
2. Lista de componentes frontend vivos vs muertos. (esta semana)
3. Recomendación sobre los guardrails/EIDOS: cuáles sirven, cuáles son ruido, cómo arreglarlos. (esta semana)
4. Inventario de PDFs + diagnóstico del scraping con el paso exacto donde se rompe. (esta semana)

No quiero más PRs de "fix guardrail test" hasta que tengamos la decisión del punto 3. Cada uno de esos es tiempo que no estamos construyendo.

---

## La pregunta de fondo que quiero que respondas

¿Por qué se siente que avanzamos lento cuando el historial muestra trabajo real? Mi hipótesis: porque el 40% de los commits recientes son reconciliación (arreglar tests, reconciliar specs, limpiar branches) y solo el 60% es construcción. Quiero que me confirmes o corrijas ese número, y me digas cómo subimos la proporción de construcción real.

---

*PM REVIEW · Alquimia · 19 junio 2026*
