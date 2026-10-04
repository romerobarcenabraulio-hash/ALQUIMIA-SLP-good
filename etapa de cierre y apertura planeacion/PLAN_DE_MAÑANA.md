# ☀️ PLAN DE MAÑANA — de planear a CONSTRUIR
**Para:** Braulio · **De:** Claude Master · **Fecha:** 18 jun 2026
**Léelo primero. La planeación está completa (36 docs, 90 issues). Mañana se pone el primer ladrillo.**

---

## ESTADO AL CERRAR HOY
- ✅ RECON (ALQ-5) · ✅ rebase resuelto (ALQ-6) · ✅ memoria en repo AGENTS/CLAUDE/CODEMAP/memory (ALQ-8) · ✅ Greptile (ALQ-17).
- ⚠️ **CI BLOQUEADO (ALQ-7)** — el único desbloqueo pendiente. Es acción tuya.
- ⚙️ Claude Code en ALQ-16 (Design System).
- 📚 Roadmap completo en Linear (Hito 0→3 + Producción) + 36 docs + matriz de trazabilidad (doc 27) + pre-mortem (doc 32).
- 🧭 Filosofía build/integrate/buy **re-embebida en REGLAS** (ya no se pierde).

---

## EL ÚNICO DESBLOQUEO (hazlo primero)
**Repo público → CI verde (ALQ-7).** GitHub → Settings → Danger Zone → Make public (el escaneo de secretos salió limpio). Luego un push de prueba → confirma `ci.yml` verde. Sin esto no hay merge a main ni deploy; con esto, los agentes ejecutan el ciclo completo.

---

## SECUENCIA DE MAÑANA (en orden)
1. **TÚ:** repo público → CI verde (ALQ-7). 15 min.
2. **TÚ → Codex:** dispara **ALQ-9** (catálogo nacional, determinista, $0) y **ALQ-13** (GOV close, Escenario 2 = construir desde cero). Prompt de una línea: *"Lee REGLAS y [HO-DIAG / doc 12]. Ejecuta [T1 / Escenario 2]. Reporta con pytest."*
3. **TÚ → Codex:** **ALQ-31** (correr pytest, fijar la línea base real de tests). 
4. **Claude Code:** cierra **ALQ-16** (DESIGN_SYSTEM.md) → SCR de **ALQ-12**.
5. **TÚ → Codex:** **ALQ-32** (deploy de la plataforma existente a Render/Vercel + smoke).
6. **En paralelo, sin código (TÚ):** arranca **ALQ-73 / ALQ-83** — pipeline de venta + design-partner. No se vende hasta operar, pero se prepara desde ya.
7. **Claude Master (yo):** en cuanto GOV avance, arranco **ALQ-23 (COMPANY_PROFILE_SPEC)** — el contrato que desbloquea Empresarial.

---

## TABLERO DE MAÑANA (Todo)
ALQ-7 (CI, founder) · ALQ-16 (Design System, en progreso) · ALQ-9 (catálogo, Codex) · ALQ-13 (GOV Escenario 2, Codex) · ALQ-31 (pytest) · ALQ-32 (deploy existente). El resto se desbloquea al palomear estos.

---

## RECORDATORIO DE DISCIPLINA
- Ciclo de palomita (REGLAS §7): codificar → auto-auditar → corregir → PR → Greptile+CI → merge gated → palomear.
- Build/integrate/buy: si no es moat, intégralo o cómpralo.
- Costo-cero: ningún API de pago sin cliente/presupuesto.
- Anti-bola-de-nieve (REGLAS §3B): no sobrescribir lo que funciona; diff atómico.

**El mayor riesgo ya no es olvidar algo — es no arrancar. Mañana arrancamos.**

*Plan de Mañana · Alquimia Supermind · 18 jun 2026*
