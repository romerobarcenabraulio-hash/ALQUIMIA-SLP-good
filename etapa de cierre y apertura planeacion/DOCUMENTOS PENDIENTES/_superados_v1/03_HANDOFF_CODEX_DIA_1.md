# HANDOFF CODEX (CLAUDE CODE) · SPRINT 1
**Para:** Claude Code ejecutando en Cursor  
**De:** Claude Master (estrategia/validación)  
**Fecha:** 14 junio 2026  
**Validez:** Hasta 28 junio 2026  
**Estado:** LISTO PARA LECTURA  

---

## ANTES DE TOCAR CÓDIGO: LEE ESTO PRIMERO

NO EMPIECES A CODEAR HASTA QUE HAYAS LEÍDO ESTO EN ORDEN:

### 0. ORIENTACIÓN GENERAL (5 min)
**Lee:** `/cierre-apertura-planeacion/BITACORA_MAESTRA.md`
- Entenderás cómo te comunico avances/bloques
- Cómo verificas estado con "status" en bitácora

### 1. EL PROYECTO (10 min)
**Lee:** El usuario memoria/context sobre Alquimia (te lo dará el founder)
- **Qué es:** Sistema operativo para gobiernos municipales mexicanos, enfocado en residuos sólidos urbanos
- **Estado:** 25-30% construido, necesita validación + features defensibles
- **Hoy:** Necesitamos saber exactamente qué existe realmente (no lo que dice documentos)

### 2. PLAN OPERATIVO (15 min)
**Lee:** `/documentos-pendientes/02_PLAN_SPRINT_1_EJECUTABLE.md`
- Este es tu mapa de ruta para 14 días
- HO-001, HO-002, etc. son tus handoffs numerados
- Cada día tiene entregables concretos

### 3. TU PRIMER HANDOFF (10 min)
**Lee:** `/documentos-pendientes/01_STATUS_BASELINE_VERIFICACION.md`
- ESTO ES LO QUE HACES HOY
- 7 instrucciones claras
- 7 archivos de salida esperados

**Total: ~40 min de lectura. No saltees nada.**

---

## CONTEXTO OPERATIVO (RESUMEN EJECUTIVO)

**Dónde estamos:**
- Alquimia tiene 6 meses de development cargado. Hay mucho código.
- Documentación dice qué "debería" existir. Realidad puede ser diferente.
- Hoy: verificar qué existe realmente, honestamente, sin adivinar.

**Qué se espera de ti:**
- Verificación rigurosa (no especulativa)
- Documentación clara (no ambigua)
- Criterios de aceptación 100% cumplidos
- Comunicación de bloques inmediata

**Cómo me reportas:**
- PRs contra ramas `feature/*` claras
- Comentarios explicativos en código
- Archivo de salida documentado
- Status en bitácora (me lo envía el founder cuando cierre sesión)

**Dónde reporto yo:**
- `/bitacora-handoffs-codex/BITACORA_MAESTRA.md` — status de cada HO-XXX
- `/documentos-pendientes/` — próximas instrucciones
- `/documentos-completados/` — lo que ya usamos y archivamos

---

## LOS 12 PRINCIPIOS QUE RESPETAMOS

Estos NO son negociables. Vienen del fundador y de 6 meses de decisiones:

1. **Cero invención de datos.** Solo 7 categorías permitidas. Si no sé de dónde vino un número, no lo pongo.
2. **Cero SMS para auth.** Clerk magic link + TOTP únicamente.
3. **Cero auto-registro.** Invitación institucional solamente.
4. **Cero modification de tenant real sin audit log.**
5. **Cero exports con compliance < 80%.**
6. **Cero partners activos antes de 3 contratos directos.**
7. **Cero datos de un tenant visibles a otro.**
8. **No detenerse por información imperfecta.** Solo el reglamento bloquea.
9. **No mostrar ausencia como fracaso.** Mostrarla como límite metodológico.
10. **La plataforma es un simulador.** Excel models son derivatives, no source of truth.
11. **Cero agentes hardcodeando datos.** Todo dinámico desde knowledge base del proyecto.
12. **Evidence Registry es activo único.** Cada claim debe tener cita verificable.

Si algo contradice estos principios, lo escalas inmediatamente.

---

## TU RESPONSABILIDAD HOY (DÍA 1)

### ACCIÓN 1: GIT + REPO LOCAL (30 min)

```bash
# 1a. Verifica que tienes el repo
cd ~/ALQUIMIA-SLP--
git status

# 1b. Última hora de commits
git log --oneline -20

# 1c. Branches actuales
git branch -a

# 1d. Estado de working directory
git diff HEAD
```

**Si hay cambios sin commit:** reporta qué está sin commitear
**Si hay conflictos:** reporta dónde

### ACCIÓN 2: LEER `/documentos-pendientes/01_STATUS_BASELINE_VERIFICACION.md` COMPLETO

Este documento tiene 7 instrucciones. Cada una genera 1 archivo de salida.

No es opcional. No es "si tienes tiempo." Es requerida.

### ACCIÓN 3: EJECUTAR LAS 7 INSTRUCCIONES

Cada instrucción tiene formato claro:
- Qué hacer (comando bash o búsqueda manual)
- Qué reportar (información concreta)
- Dónde guardar output (nombre de archivo)

Guardarás los 7 archivos aquí:
```
~/ALQUIMIA-SLP--/status-baseline-reports/
  ├── STATUS_GIT_LOG.txt
  ├── STATUS_DEPLOYMENT_VISUAL.txt
  ├── STATUS_STACK_VERIFICACION.txt
  ├── STATUS_FEATURES_INVENTARIO.md
  ├── STATUS_SCHEMA_DATAPOINT.txt
  ├── STATUS_AUTH_VERIFICACION.txt
  └── STATUS_GAPS_SUMMARY.md
```

### ACCIÓN 4: CREAR PR

```bash
git checkout -b verify/status-baseline
# (todos los 7 archivos están uncommitted)
git add status-baseline-reports/
git commit -m "HO-001: Status baseline verification

- Verified current state against deployment
- 7 verification files generated
- Gaps identified and categorized
- See /status-baseline-reports/ for details"
git push origin verify/status-baseline
```

**No mergees todavía.** Solo PR. Yo valido, luego mergeo.

### ACCIÓN 5: REPORTAR INMEDIATAMENTE

Envía al founder:
- Link del PR
- Resumen ejecutivo (200-300 palabras):
  - "De 25-30% documentado como shipped, encontramos X% realmente existiendo"
  - Gaps principales
  - Posibles sorpresas

---

## CRITERIOS DE ACEPTACIÓN PARA HOY

Tu HO-001 se considera COMPLETADO si:

1. ✅ **7 archivos de salida existen** — Todos están en PR
2. ✅ **Información es honesta** — No especulativa. Si no puedes verificar, dices "NO VERIFICABLE"
3. ✅ **Resumen ejecutivo está** — 200-300 palabras, claro, con números
4. ✅ **Gaps están categorizados** — No es lista random; está organizado
5. ✅ **PR tiene descripción clara** — Alguien que NO eres tú entiende qué contiene
6. ✅ **Código no está tocado** — Esta instrucción es VERIFICACIÓN, no refactoring

---

## POSIBLES BLOQUEADORES (Y CÓMO ESCALARLOS)

| Bloqueador | Solución | A quién reportar |
|---|---|---|
| "No sé cómo verificar feature X" | Leo el código que encontraste + documento cómo está (incompleto, completo, etc.) | Claude Master inmediato |
| "El sitio está down, no puedo acceder" | Verifica si es tu red o deployment real. Si es deployment real, prueba staging | Claude Master + Founder |
| "Hay 1000 líneas de código y no sé por dónde empezar" | Empieza por `/components/` y `/pages/`, luego `/api/`. No leas TODO; haz búsquedas específicas | Claude Master — te guío |
| "Encontré código que NO está documentado" | Documéntalo en STATUS_GAPS_SUMMARY.md bajo "Implementado pero NO documentado" | Incluir en PR |

**Escalar = enviar mensaje a Braulio (el founder) diciendo EXACTAMENTE cuál es el bloque y qué necesitas**

---

## COMUNICACIÓN CONMIGO (CLAUDE MASTER)

**Cómo reportas progreso:**
1. PR con archivos de salida
2. Mensaje corto al founder: "Codex completó HO-001, link: [PR link]"
3. Yo valido, comento en PR
4. Founder o yo decimos si mergea o si necesita ajustes

**Cuándo escalas bloqueadores:**
- Antes de bloquear por más de 30 min, reporta al founder
- Sé específico: "No puedo verificar feature X porque..."
- No hagas adivinanzas; reporta honestamente

**Respuesta esperada:**
- Claude Master responde dentro de 2-4 horas (en horas de trabajo)
- Founder puede haber desaparecido hasta mañana (trabaja bloques intensos)
- Si founder no responde en 8 horas, Claude Master toma decisión y procede

---

## DESPUÉS DE HOY

Una vez entreges HO-001, Claude Master genera:
- **HO-002:** Qué refactorizar basado en gaps reales
- **Próximas instrucciones** claras para mañana

No necesitas pensar en "qué construir después." Yo te digo, día por día.

---

## LAST MILE CHECKLIST ANTES DE EMPEZAR

- [ ] Tienes acceso al repo local
- [ ] Leíste `/documentos-pendientes/01_STATUS_BASELINE_VERIFICACION.md` COMPLETO
- [ ] Entiendes las 7 instrucciones
- [ ] Sabes dónde guardar los 7 archivos
- [ ] Sabes cómo hacer el PR
- [ ] Tienes forma de reportar al founder si hay bloqueador

Si algo de esto es "NO", reporta al founder ahora, antes de empezar.

---

## FINAL REMINDER

**No es "trata de hacer lo mejor que puedas."**

Es "Entrega exactamente esto, con criterios de aceptación 100% cumplidos."

Si no puedes cumplir un criterio, reporta bloqueador. No hagas lo mejor que puedas alrededor del criterio.

---

**Buena suerte. Estamos contigo. Empieza con la lectura de 40 min y avisa cuando hayas leído todo.**

*HANDOFF CODEX SPRINT 1 · Alquimia SLP · 14 junio 2026*
