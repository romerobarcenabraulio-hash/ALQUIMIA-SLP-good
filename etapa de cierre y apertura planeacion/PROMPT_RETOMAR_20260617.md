# PROMPT DE RETOMA — ALQUIMIA-SLP
**Fecha:** 2026-06-17  
**Rama activa:** `claude/brave-tesla-bO6fE`  
**PR abierto:** #28 (draft, base → main)

---

## Contexto para el agente que retoma

Eres Claude Code en el repo `romerobarcenabraulio-hash/ALQUIMIA-SLP--` (el repo se movió a `ALQUIMIA-SLP-good` en GitHub pero el remote local sigue apuntando correcto). Trabajas **solo en frontend/** — no toques `backend/` salvo que la tarea lo exija explícitamente.

### Estado del repo

- Suite de tests backend: **1 062 tests verdes** (1009 previos + 53 de esta sesión).
- PR #28 (`claude/brave-tesla-bO6fE` → `main`) está abierto como draft. Contiene:
  - ARCHIVO motor (PDF storage + OCR + DataPoint propagation)
  - §2 Company Survey + motor de estimación (13 tests)
  - §3 ObligationMatrix giro × jurisdicción (13 tests)
  - §4 ContainerInventory modelo + CSV import (11 tests)
  - E1 ORM tenant isolation (4 tests)
  - E2 Rate limiting (6 tests)
  - §5 GapDetector nightly (6 tests)
  - **ALQ-16** `frontend/DESIGN_SYSTEM.md` consolidado desde fuentes canónicas ✅

### ALQ-16 ya está hecho

`frontend/DESIGN_SYSTEM.md` existe, 409 líneas, commiteado en la rama activa.  
No lo rehagas.

---

## Tu tarea: cola Linear en orden

Ejecuta una tarea a la vez. Ciclo por tarea:
1. **Leer** el ticket de Linear (o lo que el founder te indique)
2. **Codificar** — solo dentro de `frontend/` salvo instrucción explícita
3. **Auto-auditar** contra `frontend/DESIGN_SYSTEM.md` §10 (checklist de 12 puntos)
4. **Corregir** lo que falle el checklist
5. **Abrir PR draft** — no mergees a `main`
6. **Reportar** al founder: URL del PR + qué hiciste + qué sigue

### Cola (en este orden)

| Tarea | Estado |
|-------|--------|
| **ALQ-16** `frontend/DESIGN_SYSTEM.md` | ✅ HECHO |
| **ALQ-12** | ⏳ Siguiente — pide el contenido del ticket si no tienes acceso a Linear |
| **ALQ-15** | ⏳ Bloqueada hasta que ALQ-12 esté en PR |
| **ALQ-20** | ⏳ Bloqueada hasta que ALQ-15 esté en PR |

---

## Archivos clave que debes leer antes de tocar frontend

| Archivo | Por qué |
|---------|---------|
| `frontend/DESIGN_SYSTEM.md` | Estándar editorial completo — tu contrato visual |
| `FRONTEND DEFINITIVO/MODULE_MAP.md` | Qué módulo_id corresponde a cada componente React |
| `frontend/src/components/editorial/index.ts` | Librería editorial activa (Conclusion, KpiAnchorGrid, NarrativeBridge, etc.) |
| `frontend/src/app/globals.css` | Tokens CSS activos |
| `frontend/tailwind.config.ts` | Tokens Tailwind activos |
| `docs/architecture/FASE8_AUDITORIA_VISUAL_MINTO_MCKINSEY.md` | Qué ya se auditó y corrigió |

## Estándares que aplica el DESIGN_SYSTEM.md

- **Editorial Minto/McKinsey:** conclusión → cifra protagonista → evidencia mínima → tabla limpia. Sin cajas decorativas, sin fondos de color, sin cards anidadas.
- **WCAG 2.2 AA** como piso: 4.5:1 texto normal, 3:1 texto grande, foco visible, `prefers-reduced-motion`.
- **OKLCH** para cualquier paleta nueva (los tokens actuales son HEX legacy, no los cambies, agrega nuevos en OKLCH).
- **NarrativeBridge** obligatorio en cada dato cuantitativo — derivado de `ComputedState`, nunca string estático.
- **8 estados** por componente nuevo: `loading · empty · error · blocked · warning · success/result · disabled · skeleton`.
- **Token** en lugar de hex crudo — cualquier valor hardcoded en componente es veto.
- **Segmentación:** Citizen (1 idea/pantalla) · Official (≤3 ideas + anclas legales) · Entrepreneur (≤4 KPIs).

---

## Comandos útiles

```bash
# Posicionarte en la rama activa
git checkout claude/brave-tesla-bO6fE

# Correr suite de backend (no toques esto, solo verifica que sigue verde)
cd backend && python -m pytest -q

# Typecheck frontend
cd frontend && npx tsc --noEmit

# Tests frontend
cd frontend && npx vitest run

# Build frontend
cd frontend && npm run build
```

---

## Si no tienes acceso a Linear

Dile al founder:
> "No tengo acceso a Linear en esta sesión. ¿Me pegas el título y descripción de ALQ-12?"

Y arranca con lo que te dé.

---

*Generado automáticamente el 2026-06-17. Siguiente acción: ejecutar ALQ-12.*
