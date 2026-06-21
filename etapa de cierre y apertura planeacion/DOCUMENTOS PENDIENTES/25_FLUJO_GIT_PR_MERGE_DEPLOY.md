# 25 · FLUJO GIT → PR → AUDITORÍA → MERGE → DEPLOY (Vercel/Render)
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork)
**Aplica a:** Codex (backend→Render) y Claude Code (frontend→Vercel). Complementa REGLAS §3/§4/§7.

---

## 0. LA CORRECCIÓN CLAVE (no "push a main")

**Nunca hay push directo a `main`.** El flujo es: rama corta → PR → review de Greptile + CI verde → **merge a main (lo apruebas tú)** → ese merge dispara el deploy. El merge a main = la acción irreversible que escribe a prod, así que es **gate del founder** (REGLAS §2). El agente prepara y deja el PR listo; tú apruebas el merge.

---

## 1. EL FLUJO POR TAREA (CD completo)

```
1. git pull origin main → crear rama corta (usa el gitBranchName que da Linear).
2. CODIFICAR → AUTO-AUDITAR (REGLAS §7) → CORREGIR. La palomita se gana.
3. push de la RAMA (no main) → abrir PR con descripción + salida real de tests.
4. GATE INDEPENDIENTE: review de Greptile verde + CI verde. Si algo falla → corregir, no mergear.
5. FOUNDER APRUEBA EL MERGE → merge a main (squash). Palomear la tarea (Done).
6. El merge dispara DEPLOY automático: backend→Render, frontend→Vercel.
7. VERIFICAR el deploy: Render logs verdes / Vercel build verde + smoke test rápido.
8. ¿Deploy roto? Rollback (Render/Vercel guardan la versión anterior) + fix en rama nueva. Nunca dejar prod roto.
```

---

## 2. ORDEN DE DEPLOY (para que nada quede inconsistente)

- **Backend (Render) antes que frontend (Vercel)** cuando el frontend consume una API nueva — así el frontend nunca llama a un endpoint que aún no existe. Cambios backward-compatible siempre que se pueda.
- **Migraciones Alembic:** corren en el deploy de Render, **idempotentes** (IF NOT EXISTS), ANTES de servir tráfico nuevo. Nunca destructivas sin backup + gate.
- **Proyectos Vercel separados:** GOV vs Empresarial (dominios/env/analytics propios, regla doc 10).
- **Env vars:** en Render (backend) y Vercel (frontend) según el handoff; nunca secretos en el repo.

---

## 3. QUIÉN APRUEBA QUÉ (gates)
| Acción | Quién |
|---|---|
| Commits en rama, abrir PR, correr tests | Agente (libre) |
| Review de calidad | Greptile + CI (automático) |
| **Merge a main + deploy a prod** | **Founder (gate, irreversible)** |
| Migración destructiva, borrar servicio/datos, env prod | **Founder (gate)** |

---

## 4. CARRILES (sin colisión)
- **Claude Code:** solo `frontend/` → Vercel. NUNCA toca Render ni `backend/`.
- **Codex:** `backend/`, `alembic/`, configs Render → Render + migraciones. NUNCA toca `frontend/`.
- Nunca los mismos archivos el mismo día. GOV en `gov/`, Empresarial en `empresa/`.

---

## 5. SECUENCIA DE CLAUDE CODE (cada una con el flujo §1)
1. **ALQ-16** Design System (`frontend/DESIGN_SYSTEM.md`) — arranca ya, en paralelo.
2. **ALQ-12** SCR + mapa nacional + semáforo + ficha municipal (tras ALQ-16 y endpoints de Codex ALQ-11).
3. **ALQ-15** ReportBuilder PDF (reusa pdf_perfil.py).
4. **ALQ-20** Auditoría WCAG 2.2 AA + editorial Minto/McKinsey.

Cada una: rama → auto-auditar → PR → Greptile+CI → tu merge → deploy Vercel → verificar.

---

## 6. NOTA
Hasta que el repo esté limpio (rebase resuelto, ALQ-6) y CI encendido (ALQ-7), NO hay merge a main. Claude Code puede avanzar ALQ-16 en rama/borrador; el merge espera el repo sano. Deploy ordenado = backend listo → frontend.

---

*25 · Flujo Git → PR → Merge → Deploy · Alquimia Supermind · 17 jun 2026*
