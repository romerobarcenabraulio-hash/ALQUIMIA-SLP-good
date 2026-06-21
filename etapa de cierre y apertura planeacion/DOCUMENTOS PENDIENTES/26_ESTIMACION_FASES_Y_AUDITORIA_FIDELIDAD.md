# 26 · ESTIMACIÓN DE ACTIVIDADES + MAPA DE FASES + AUDITORÍA DE FIDELIDAD
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork)
**Responde a:** "¿cuántas actividades estimas para finalizar?" (founder estima 150–450)

---

## 1. EL REFRAME (importante): "finalizado" no es el marco correcto

Alquimia no es un proyecto con línea de meta fija; es una **plataforma viva**. Por diseño (call-on-request + fábrica de agentes), cada giro/capacidad nueva = **una spec**, no un proyecto nuevo. Eso significa:
- Hay un número FINITO de actividades para llegar a **auto-sostenible** (primera venta que financia el resto).
- A partir de ahí, el conteo es **abierto y deseable**: crece por cliente/giro, ~5–10 actividades por capacidad nueva. Eso no es "trabajo pendiente"; es el negocio escalando.

Por eso la pregunta útil no es "¿cuántas para terminar?" sino "¿cuántas para que el producto se pague solo?" — y de ahí, el resto se financia.

---

## 2. ESTIMACIÓN POR FASE (actividades = issues de Linear)

| Fase | Qué incluye | Estimado |
|---|---|---|
| **Hito 0** — Cierre GOV + Diagnóstico nacional | recuperación (hecho) + GOV close (Escenario 2) + diagnóstico por olas + frontend + auditorías + deploy | **25–35** |
| **Hito 1** — Fundación Empresarial | engine + 7 contratos (CM) + Agent Spec + ORG_BUILDER + interacción/evidencia + MASTER_SYSTEM/DATA_MODEL + Vercel separado + 3 entrevistas PyME | **30–45** |
| **Hito 2** — Primer módulo + primer cliente PAGANDO | LISTENER/ORCHESTRATOR/SECTOR build + 1º módulo (backend+SCR+frontend) + Stripe go-live + onboarding | **35–55** |
| **Hito 3** — Red de Comercio + fiscal + 2º módulo | ledger 18-J/CFDI + verificación SEMARNAT/REPAS + COMMERCE_AGENT + E2 + contador/abogado | **45–70** |
| **Escalado (continuo)** | cada giro/módulo nuevo + out-builds de inteligencia competitiva | **~5–10 por capacidad (abierto)** |

**Hitos a recordar:**
- **Hasta auto-sostenible (fin de Hito 2, primera venta):** ≈ **90–135 actividades.** ← la meta que de verdad importa.
- **Hasta red activa (fin de Hito 3, el moat real):** ≈ **135–205 actividades.**
- **Tu rango 150–450:** la mitad baja (150–205) ≈ "hasta Hito 3". La mitad alta (205–450) ≈ el **escalado** (más giros, más out-builds) — que es perpetuo, no una finalización.

**Mi estimación:** ~**150–220 actividades** para una plataforma auto-sostenible con red activa (Hito 3). Más allá, no se "finaliza": se expande por cliente. Tu intuición de 150–450 es correcta si el techo incluye el escalado.

*(Supuestos: actividad = issue tamaño Linear, 0.5–3 días; 2 streams paralelos Codex/Claude Code; costo-cero hasta Hito 2; el cuello de botella es tu validación, no el código — por eso los streams escalonados del doc 08.)*

---

## 3. AUDITORÍA DE FIDELIDAD — ¿el plan es fiel a tus ideas/ambiciones?

| Tu idea / ambición | ¿Capturada? | Dónde |
|---|---|---|
| Alcance UNIVERSAL (cualquier sector) | ✅ | doc 23 §1B, doc 22 (todo = 1 patrón) |
| El sistema se auto-construye + organigrama | ✅ | doc 23 §1B, ALQ-22 ORG_BUILDER |
| Jarvis por empleado (voz+comando) | ✅ | doc 23 §2, CM-5/CM ALQ-27 |
| Evidencia con fotos (ej. camión) → solicitud | ✅ | doc 23 §3, ALQ-29 |
| Consultoría instantánea (vs Palantir) | ✅ | doc 16 §4, doc 22 §1 |
| Orquestar IA existente, no construir LLM | ✅ | ADR-001, doc 14 §1 |
| Conocimiento que evoluciona (no quedarse atrás) | ✅ | ADR-001 rev.1 (tiers), doc 21 |
| Menos integraciones = accesibilidad/budget | ✅ | doc 24 §1, doc 19 |
| Red inter-empresa como moat | ✅ | doc 16 §4, Hito 3 |
| Out-build de apps existentes (finance/analytics) | ✅ | doc 21, ALQ-21 |
| Rigor/procedencia/honestidad como producto | ✅ | REGLAS, doc 14 protocolo, auditorías |
| GOV-RSU como piloto, negocio en PyME | ✅ | doc 08, doc 23 §4 |

**Veredicto:** el plan es fiel. No detecto ambición tuya sin hogar en un doc o issue. El único riesgo recurrente (y por eso lo repito) es la **dispersión**: la ambición es enorme y correcta, pero se materializa por hito, no de golpe — el filtro del doc 08 §7 lo gobierna.

---

## 4. RESEARCH A PREPARAR POR FASE (para aventajar, just-in-time)

No lo investigo todo hoy (anti-dispersión + costo-cero), pero esto es lo que conviene investigar al entrar a cada fase (web search = gratis):
- **Pre-Hito 1:** patrones de "agent factory" declarativa + org-mapping desde entrevista; schema de Company Profile (estándares de datos de empresa).
- **Hito 1/2:** stack de voz definitivo (ya tengo base: Whisper-class + MeloTTS, doc 23); el dominio del 1º módulo (lo definen las 3 entrevistas, ALQ-33).
- **Hito 2:** benchmarks de onboarding multimodal; out-build del 1º competidor (doc 21, ALQ-21).
- **Hito 3:** detalle fiscal 18-J LIVA + CFDI Carta Porte 3.1 (validar con especialista, ALQ-34); verificación REPAS/SEMARNAT.

Dime la fase y corro el research correspondiente cuando lleguemos.

---

## 5. RECOMENDACIÓN DE SOCIO
Apunta a la meta que importa: **~90–135 actividades hasta la primera venta (auto-sostenible).** Todo lo demás se financia desde ahí. No persigas "las 450" como meta — persíguelas como consecuencia de clientes. El tablero ya tiene el camino hasta Hito 1; los de Hito 2/3 se crean al cerrar el anterior (cadencia doc 17).

---

*26 · Estimación de Fases y Auditoría de Fidelidad · Alquimia Supermind · 17 jun 2026*
