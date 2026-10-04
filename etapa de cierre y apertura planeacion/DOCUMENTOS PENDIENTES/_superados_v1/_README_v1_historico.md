# 🏗️ ALQUIMIA SLP · CIERRE-APERTURA-PLANEACIÓN
**Período:** 14 junio - 28 junio 2026  
**Responsable:** Claude Master (estrategia) + Codex (ejecución)  
**Estado:** 🟢 LISTO PARA INICIAR SPRINT 1  

---

## ESTRUCTURA DE CARPETAS

```
cierre-apertura-planeacion/
├── README.md (este archivo)
├── bitacora-handoffs-codex/          ← Registro de cada instrucción a Codex
│   └── BITACORA_MAESTRA.md          ← Acceso aquí para ver status de HO-001, HO-002, etc.
│
├── documentos-pendientes/            ← DOCUMENTOS QUE AÚN NECESITAN CIERRE
│   ├── 00_ANALISIS_ESTRATEGICO_CLAUDE_MASTER.md   ← Mi análisis: qué riesgos, oportunidades
│   ├── 00_INVENTARIO_MAESTRO_Y_PLAN_CIERRE.md     ← Qué documentos faltan, cómo cerrar cada uno
│   ├── 01_STATUS_BASELINE_VERIFICACION.md         ← HANDOFF DÍA 1 A CODEX: verificar qué existe
│   ├── 02_PLAN_SPRINT_1_EJECUTABLE.md             ← Roadmap 14 días, HO-001 a HO-006
│   ├── 03_HANDOFF_CODEX_DIA_1.md                  ← Qué Codex debe leer ANTES de tocar código
│   └── ... (más documentos se agregan conforme avanzamos)
│
└── documentos-completados/          ← DOCUMENTOS QUE TERMINARON SU CICLO
    └── (vacío hoy; se llenan conforme usamos y archivamos)
```

---

## CÓMO USAR ESTA ESTRUCTURA

### Para el FOUNDER (Braulio)

**Hoy mismo (14 junio):**
1. Lee `/documentos-pendientes/00_ANALISIS_ESTRATEGICO_CLAUDE_MASTER.md` — mi síntesis del plan
2. Cierra tu sesión con Codex, trae status report
3. Mañana a las 8am, entra a nueva sesión, valida el plan con migo

**Cada día de Sprint 1:**
1. Abre `/bitacora-handoffs-codex/BITACORA_MAESTRA.md` — ¿qué handoff está en ejecución?
2. Si hay bloqueador, Codex te lo reporta → tú escalas conmigo
3. Yo actualizo bitácora con status actual
4. Mañana Codex sabe qué hacer sin preguntar

**Cuando algo se "completa":**
1. Codex abre PR, comentario en PR
2. Yo reviso y comento ("✅ merged" o "⚠️ ajusta y reenvía")
3. Si merged, documento se mueve de `documentos-pendientes/` a `documentos-completados/`

### Para CODEX (Claude Code)

**ANTES de cualquier otra cosa:**
1. Lee `/documentos-pendientes/03_HANDOFF_CODEX_DIA_1.md` completo (40 min de lectura)
2. Ejecuta los pasos que ahí están descritos
3. Reporta al founder con PR link

**Cada día durante Sprint 1:**
1. Mira `/bitacora-handoffs-codex/BITACORA_MAESTRA.md`
2. ¿Cuál es tu HO actual (handoff)? 
3. ¿Está en [EMITIDA]? → tienes instrucción clara en `/documentos-pendientes/`
4. Haz el trabajo
5. Abre PR, reporta

**Si tienes bloqueador:**
1. Reporta al founder INMEDIATAMENTE (no esperes a fin de día)
2. Describe: qué estás haciendo, cuál es el bloque, qué necesitas
3. Yo respondo con solución o ajuste (dentro de 2-4 horas)

### Para CLAUDE MASTER (yo)

**Cada vez que Codex abre PR:**
1. Reviso código contra criterios de aceptación en el handoff original
2. Comento en PR: "✅ merge" o "⚠️ ajusta porque X"
3. Si merge, actualizo BITACORA_MAESTRA.md (HO-00X pasa a [MERGED])
4. Genero próximo handoff (HO-00X+1) si está listo

**Cada vez que hay bloqueador:**
1. Analizo qué significa para el plan
2. Actualizo PLAN_SPRINT_1 con "bloqueador identificado"
3. Comunico al founder opción A vs opción B para continuar

**Fin de cada semana:**
1. Resumen: qué se completó, qué quedó, por qué
2. Ajuste de expectativas si es necesario
3. Confirmación de continuidad para semana siguiente

---

## DOCUMENTOS CLAVE PARA HOYAHORA

| Documento | Para quién | Por qué ahora | Acción |
|---|---|---|---|
| `BITACORA_MAESTRA.md` | Founder + Codex | Es el registro vivo de progreso | 👀 Revisar para ver estado actual |
| `00_ANALISIS_ESTRATEGICO_CLAUDE_MASTER.md` | Founder | Síntesis de riesgos/oportunidades | 📖 LEER HOY |
| `00_INVENTARIO_MAESTRO_Y_PLAN_CIERRE.md` | Claude Master + Founder (referencia) | Qué documentos faltan y cómo cerrar | 📋 Referencia para próximas 4 semanas |
| `01_STATUS_BASELINE_VERIFICACION.md` | Codex | HANDOFF DÍA 1 — exactamente qué hacer | 🚀 Codex empieza aquí mañana |
| `02_PLAN_SPRINT_1_EJECUTABLE.md` | Founder + Codex | Roadmap claro 14 días | 🗺️ Referencia para "¿en qué día estamos?" |
| `03_HANDOFF_CODEX_DIA_1.md` | Codex | Qué leer antes de tocar código | 📚 Codex lee esto FIRST |

---

## LÍNEA DE BASE · CÓMO SABER SI VAMOS BIEN

### Final de SEMANA 1 (20 junio)
- [ ] HO-001 (Status Baseline) ✅ MERGED
- [ ] HO-002 (DataPoint refactor) ✅ MERGED
- [ ] HO-003 (Aislamiento auditoría) ✅ MERGED  
- [ ] HO-004 (FOD especificación) 🟡 EMITIDA

Si estos 3 están merged, confianza = 85%.

### Final de SEMANA 2 (28 junio)
- [ ] HO-004 (FOD implementado) ✅ MERGED
- [ ] HO-005 (Modo B MVP) ✅ MERGED
- [ ] HO-006 (Monte Carlo) ✅ MERGED
- [ ] Sprint 1 Closure document generado

Si se cumple, Sprint 1 = EXITOSO.

---

## PRINCIPIOS OPERACIONALES NO NEGOCIABLES

**Estos son sagrados. Si algo los viola, lo escalamos:**

1. 🔐 **Cero invención de datos** — solo 7 categorías documentadas
2. 🔐 **Cero ambigüedad en instrucciones** — cada handoff dice exactamente qué hacer
3. 🔐 **Cero cambios sin criterios de aceptación** — si no es medible, no cuenta como "listo"
4. 🔐 **Cero bloqueadores ocultados** — si hay un problema, se reporta inmediatamente
5. 🔐 **Cero documentación innecesaria** — solo lo que se necesita para ejecutar

---

## CÓMO ESCALABILAR BLOQUEADORES

**Si algo detiene el trabajo:**

1. Paso 1: Codex reporta al founder con claridad (qué estoy haciendo, cuál es el bloque, qué necesito)
2. Paso 2: Founder trae bloqueador a sesión con Claude Master
3. Paso 3: Claude Master analiza 2 opciones (Opción A, Opción B)
4. Paso 4: Founder elige, Codex continúa

**Ejemplo:**
- Codex: "HO-002 está bloqueado: DataPoint se usa en 47 archivos, no 5. Refactoring es 3x mayor. Qué hago?"
- Founder trae a Claude Master
- Claude Master: "Opción A: aislamiento primero (HO-003), refactor DataPoint después. Opción B: refactor todo ahora, atrasa Modo B MVP."
- Founder: "Opción A"
- Codex: "Entendido, pivoteo a HO-003"

---

## CAMBIOS ESPERADOS A ESTA ESTRUCTURA

**Conforme avanzen Sprint 1:**

1. `documentos-pendientes/` crece (más handoffs se generan)
2. `documentos-completados/` crece (documentos archivados)
3. `bitacora-handoffs-codex/BITACORA_MAESTRA.md` se actualiza diariamente

**IMPORTANTE:** No reescribas documentos que ya existen. Si necesitas cambiar algo, crea uno nuevo versionado (v2, v3, etc.) para auditoría.

---

## SIGUIENTE ACCIÓN DEL FOUNDER

**Hoy/mañana:**
1. ✅ Lee `/documentos-pendientes/00_ANALISIS_ESTRATEGICO_CLAUDE_MASTER.md` 
2. ✅ Valida que opción Híbrida tiene sentido para ti (o propone ajuste)
3. ✅ Cierra con Codex, trae status
4. ✅ Mañana a 8am, nueva sesión conmigo, confirmamos marcha

**Cuando Codex esté listo:**
- Codex lee `/documentos-pendientes/03_HANDOFF_CODEX_DIA_1.md`
- Codex sigue instrucciones
- Codex abre PR con HO-001

**No hay nada más complejo que eso para hoy.**

---

## NOTAS FINALES

Esta estructura está diseñada para:
- ✅ **Claridad:** Siempre sabes dónde está lo que necesitas
- ✅ **Trazabilidad:** Todo está registrado, auditable, sin ambigüedad
- ✅ **Escalabilidad:** Si entra un 4to agente (otro Claude), puede retomar sin confusión
- ✅ **Disciplina:** No hay "me olvidé en qué estaba"

Si algo de esta estructura NO funciona prácticamente, dímelo. Ajustamos.

---

**Status actual:** 🟢 LISTO PARA INICIAR  
**Próximo checkpoint:** Mañana 8am — Founder + Claude Master + Codex status → Confirmación de marcha  

---

*CIERRE-APERTURA-PLANEACIÓN · Alquimia SLP · 14 junio 2026*
