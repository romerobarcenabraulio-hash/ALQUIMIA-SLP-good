# 24 · SECUENCIA MAESTRA + MAPA DE ACTIVACIÓN DE APIS
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork)
**Propósito:** Confirmar la secuencia (no precipitarnos) y dejar CRISTALINO cuándo se enciende cada API/integración. Que nada se active antes de tiempo ni cueste antes de que toque.

---

## 1. LA SECUENCIA MAESTRA (no nos precipitamos)

Dos frentes en paralelo, escalonados (doc 08/10), SIN romper el gate:

- **Frente A — Piloto RSU (GOV):** el diagnóstico nacional + cierre GOV. Es el Hito 0. **Es la prioridad.**
- **Frente B — Deploy de la plataforma EXISTENTE de Supermind:** poner en vivo lo que YA está construido (shells `/v`, `/p`, `/e` + backend), en paralelo. **NO es "construir todo Supermind ahora"** — es desplegar lo que existe y dejarlo corriendo. Los módulos nuevos siguen entrando por hito, no de golpe.

**El gate sigue firme (no nos precipitamos):** RECON → resolver rebase → CI verde → recién entonces build y deploy. Los dos prompts que ya disparaste no encienden nada de pago ni tocan lo irreversible (RECON es read-only; Design System es leer+redactar).

---

## 2. ACLARACIÓN: "DEPLOY LA PLATAFORMA ENTERA"

Significa: **desplegar la plataforma que ya existe** (infra + shells + RSU) a Render/Vercel y dejarla operativa — NO construir cada módulo de Supermind en paralelo. La universalidad (cualquier sector, org-builder, voz, evidencia) es Hito 1+, por demanda. Deploy ≠ build-all. El stream 2 (Empresarial) se enciende cuando GOV cierre (regla de oro doc 08 §3).

---

## 3. MAPA DE ACTIVACIÓN DE APIS — CUÁNDO SE ENCIENDE CADA UNA

| Integración | Cuándo | Por qué entonces | Costo |
|---|---|---|---|
| **Linear, Render, Vercel, Greptile** | YA (conectadas) | tablero, deploy, logs, navegación | gratis/incluido |
| **APIs públicas de datos** (INEGI, CONAPO, CONEVAL, SEMARNAT, SMN, Banxico) | **Hito 0 — encender ahora** | son el motor del diagnóstico RSU; con caché | **$0** (token gratis de registro) |
| **Serper** (research reglamentos web) | Hito 0, **diferible** | llenar cobertura legal; mientras, municipios en AMARILLO | bajo (diferir) |
| **Anthropic / ÁGORA** (síntesis de docs) | **Hito 1** (cuando haya módulo/cliente) | síntesis solo tras caché; texto primero | medio — **no encender sin presupuesto** |
| **STT** (Whisper-class, voz→texto) | **Hito 1+** (al activar voz) | hospedado pago-por-uso; self-host solo a 3,000+ hrs/mes | ~$0.003–0.006/min, diferido |
| **TTS open-source** (MeloTTS/XTTS) | **Hito 1+** (al activar voz) | voz de salida casi $0 en edge — **empezar por aquí** | ≈ $0 |
| **ElevenLabs** (TTS premium) | **Hito 2+**, OPCIONAL | solo si la voz premium es diferenciador Y hay ingreso; primero open-source | pago — **no encender sin ingreso** |
| **Vision-LLM** (fotos→datos, evidencia) | **Hito 1+** (al activar evidencia) | Llama 3.2 Vision (abierto, ~$0) o hospedado | diferido |
| **Stripe (en vivo)** | **Hito 2** | cuando haya primer cliente pagando | comisión por transacción |
| **Fiscal** (SAT/CFDI, Carta Porte) | **Hito 3** | solo tras validación contador+abogado | post-ingreso |
| **Perplexity** | Diferido indefinido | Serper+Anthropic ya cubren research | — (apagado) |

---

## 3B. HOSTING / SERVIDOR 24/7 — CUÁNDO COMPRAR (verificado jun 2026)
⚠️ Trampa: Render free **borra el Postgres a los 30 días** y el web service duerme (cold-start 30-60s). Free = construir/probar, NO 24/7 real ni datos que persistan.

| Cuándo (evento) | Comprar | Costo aprox |
|---|---|---|
| Build + test (Hito 0) | nada (free; Postgres free = desechable) | $0 |
| Piloto demoable **o** datos a persistir >30 días | Render Starter web ($7) + Postgres Starter ($7) → always-on + persistente | ~$14/mes |
| Primer cliente / comercial (Hito 2) | Vercel Pro ($20, Hobby es solo no-comercial por ToS) + tier prod Render + backups (ALQ-47) | ~$34+/mes |

**Distinción vs costo-cero:** el **piso de hosting (~$14/mes) sí se compra temprano** — es fijo, predecible, y habilita el piloto vivo que destraba la venta. Las **APIs de uso** (Anthropic/voz/vision) esperan a haber ingreso porque escalan con consumo. → **ALQ-106**.

Fuentes: [Render Pricing](https://render.com/pricing) · [Render Postgres free 30-día/límites](https://kuberns.com/blogs/render-postgres-pricing-setup-limits/) · [Vercel Pricing (Hobby no-comercial / Pro $20)](https://vercel.com/pricing)

## 4. LA REGLA QUE GOBIERNA TODO ESTO
**Ningún API de pago se enciende sin (a) presupuesto real o (b) un cliente que lo pague** (doc 19). El orden lo dictan el hito + el firewall (conocimiento abierto nunca dispara acción/costo irreversible solo). ElevenLabs y compañía esperan su turno; el diagnóstico RSU corre HOY a ~$0 con datos públicos + cómputo determinista.

---

## 5. RESUMEN PARA ESTAR TRANQUILO
- Prioridad: **RSU (Hito 0)**. En paralelo: **deploy de lo existente**, no construir todo.
- APIs gratis ahora: solo las de **datos públicos**. Todo lo de pago (Anthropic, voz, ElevenLabs, vision, Stripe) **espera su hito**.
- El gate (RECON→rebase→CI) va primero. No nos precipitamos.

---

*24 · Secuencia Maestra y Mapa de APIs · Alquimia Supermind · 17 jun 2026*
