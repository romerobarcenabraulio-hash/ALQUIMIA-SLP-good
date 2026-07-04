# 28 · INVENTARIO DE COMPLETITUD DE SPECS — BARRIDO PARANOICO
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork)
**Propósito:** No olvidar NADA. Barrido exhaustivo de toda superficie, función, agente y módulo que la plataforma necesita, de RSU hasta el final. ✅ = ya specced (dónde) · ⚠️ GAP = hueco → issue nuevo creado.
**Reframe que sostiene todo:** los "cientos de empleos/giros" NO se enumeran (sería la trampa de los 110 .md y la arquitectura equivocada). Lo completo es la FÁBRICA que genera cualquier módulo (doc 22: todo = 1 patrón) + el REGISTRO de módulos. "No olvidar ningún módulo" = el sistema que produce cualquiera está completo.

---

## 1. SUPERFICIES DE USUARIO (pantallas — dónde el usuario VE/HACE)

| Superficie | Estado | Dónde |
|---|---|---|
| Login / registro institucional / 2FA (TOTP+SMS) | ✅ existe (auth + .env) | repo `app/auth` |
| Onboarding / entrevista (LISTENER, texto→voz) | ✅ | doc 23 §2; ALQ-36 |
| **Perfil de la empresa (el usuario ve su Company Profile)** | ⚠️ GAP (UI) | **ALQ-48** |
| **Organigrama de su empresa (con agentes por rol)** | ⚠️ GAP (UI) | **ALQ-49** (backend ORG_BUILDER = ALQ-22) |
| Jarvis por empleado (chat/voz/comando + subir evidencia/fotos) | ✅ | doc 23 §2-3; ALQ-27, ALQ-29 |
| Dashboard por rol (KPIs) | ✅ (GOV) / parcial Empresarial | ALQ-12; ALQ-39 |
| Vista de entregables de módulo + export | ✅ | ALQ-39 |
| Reportes / visor PDF (ReportBuilder) | ✅ | ALQ-15 |
| Captura de evidencia (archivo + fotos) | ✅ | ALQ-29 |
| **Bandeja de aprobación / GATE humano (firmar/pagar/enviar/solicitar)** | ⚠️ GAP — CRÍTICO | **ALQ-50** |
| Marketplace / Red de Comercio (listings, matching, estatus verificación) | ✅ (Hito 3) | ALQ-43 |
| Billing/suscripción cliente (planes, invoices, portal Stripe) | ✅ | ALQ-35 |
| Panel admin (admin prepara; cliente consume) | ✅ | CLAUDE.md; repo `app/admin` |
| Settings tenant + usuarios | ⚠️ parcial | cubierto por RBAC ALQ-51 |
| **Gestión de conectores del cliente (Gmail/Drive/Copilot/Gemini)** | ⚠️ GAP (UI) | **ALQ-52** (router = ALQ-27) |
| Centro de notificaciones / alertas | ⚠️ GAP | **ALQ-53** |
| Tablero de estándares (GRI/SASB/ODS/ISO) | ✅ | ALQ-12; `app/standards` |
| GOV-RSU: mapa nacional + semáforo + ficha municipal | ✅ | ALQ-12 |
| **Visor de procedencia / audit log (cada cifra → fuente)** | ⚠️ GAP (UI) | **ALQ-54** |

## 2. FUNCIONES FUNDAMENTALES ("obvias" que no se olvidan)

| Función | Estado | Dónde |
|---|---|---|
| Multi-tenancy + aislamiento (HasTenantId) | ✅ | repo |
| **RBAC / roles y permisos (admin/cliente/empleado)** | ⚠️ GAP | **ALQ-51** |
| Auth + 2FA (TOTP/SMS) | ✅ | repo + .env |
| Log inmutable / auditoría de acciones de agente | ✅ protocolo / ⚠️ persistencia formal | REGLAS; doc 14 §3; ALQ-54 |
| Notificaciones (email Resend, SMS Twilio, in-app) | ⚠️ GAP | **ALQ-53** |
| Company Profile = fuente única de verdad | ✅ | ALQ-23 |
| Sistema de procedencia (source+fecha+método) | ✅ | REGLAS; doc 14 |
| Framework de conectores (IA externa del cliente) | ✅ contrato | ALQ-27 |
| Almacenamiento de archivos/fotos/evidencia | ⚠️ incluir en | ALQ-29 |
| Rate limiting / error handling | ✅ | repo |
| **Privacidad de datos (LFPDPPP MX) + retención** | ⚠️ GAP | **ALQ-55** |
| i18n (español; futuro multi-idioma) | 🔵 futuro | — (escala) |

## 3. CAPA DE AGENTES (Class A + tipos)

| Agente | Estado | Dónde |
|---|---|---|
| Engine (ciclo del ejecutor + constitución de razonamiento) | ✅ spec | doc 14; ALQ-36 |
| ORCHESTRATOR (L0, ruteo) | ✅ | ALQ-26, ALQ-37 |
| LISTENER (L1, onboarding→Profile) | ✅ | ALQ-36 |
| SECTOR (L1, mapa de activación) | ✅ | ALQ-26, ALQ-37 |
| ORG_BUILDER (organigrama) | ✅ | ALQ-22 |
| Jarvis (Class B, por empleado/tenant) | ✅ | ALQ-27 |
| Agentes de módulo (E1, E2, …) | ✅ patrón | ALQ-38, ALQ-44 |
| COMMERCE_AGENT (Hito 3) | ✅ | ALQ-43 |
| GapDetector (nightly) | ✅ existe | repo |
| Router de capacidades (proveedor por costo) | ✅ | ALQ-27 |
| **Agent builder / fábrica (genera specs, gated)** | ✅ diferido al final | ADR-001; doc 14 §8 |
| **Module Registry (catálogo + lifecycle: spec→review→registrar→instanciar)** | ⚠️ GAP | **ALQ-56** |

## 4. FRAMEWORK DE MÓDULOS — "los cientos de giros" (sin enumerar)

No se listan cientos; se garantiza la **máquina** que produce cualquiera:
- **Plantilla de módulo = Agent Spec** (doc 14 §2): intake, knowledge_sources, cómputo determinista, output multiformato, autonomía, procedencia.
- **Categorías** (doc 22 §3): diseño/espacial · cuantificación/estimación · cotización/pricing · análisis financiero · investigación de mercado · generación documental · datos/analytics · legal/compliance · fiscal/contable · logística/operaciones · RRHH · energía · circularidad/residuos. (Abierto; cada giro nuevo = una spec.)
- **Semilla:** RSU (GOV), E1 Energía, E2 Circularidad.
- **Delegación:** ORCHESTRATOR identifica giro → SECTOR propone activación → instancia agentes de módulo on-request.
- **Registro:** Module Registry (⚠️ ALQ-56) = dónde viven los módulos disponibles y cómo se añaden con gate.
→ "No olvidar ningún módulo" se cumple porque el patrón + el registro cubren cualquier giro. Los específicos se crean por demanda de cliente (filtro 08 §7).

## 5. CROSS-CUTTING (nivel mercado, no MVP)

| Función | Estado | Dónde |
|---|---|---|
| Observabilidad + error tracking (Sentry) | ✅ issue | ALQ-46 |
| Backups/DR + performance | ✅ issue | ALQ-47 |
| Seguridad (secretos, injection firewall, isolation) | ✅ | ALQ-18; REGLAS |
| CI/CD + deploy (Render/Vercel) | ⚠️ CI bloqueado | ALQ-7, ALQ-32 |
| Gobernanza de costo (3 niveles de modelo, costo-cero) | ✅ | doc 19, doc 24 |
| Auditorías (seguridad/procedencia/a11y + Greptile gate) | ✅ | ALQ-17,18,19,20 |

## 6. COBERTURA DE PUNTA A PUNTA (RSU → el mero final)

- **GOV-RSU (Hito 0):** diagnóstico nacional + reporte. ✅ (ALQ-9–16)
- **Empresarial (Hito 1-2):** onboarding → Profile → organigrama → módulo → entregable + billing. ✅ (ALQ-22–41, +gaps de §1/§2)
- **Red de Comercio (Hito 3):** marketplace verificado + fiscal + COMMERCE_AGENT + E2. ✅ (ALQ-42–45)
- **Escalado:** más giros vía fábrica + registro + out-builds. ✅ patrón (ALQ-21, ALQ-56)
- **Producción:** observabilidad, backups, privacidad. ✅/⚠️ (ALQ-46,47,55)

---

## 7. HUECOS NUEVOS DETECTADOS EN ESTE BARRIDO (issues creados)
1. **ALQ-48** Vista de Perfil de empresa (UI). *(la mencionaste)*
2. **ALQ-49** Vista de Organigrama con agentes por rol (UI). *(la mencionaste)*
3. **ALQ-50** 🔴 Bandeja de aprobación / GATE humano (firmar/pagar/enviar/solicitar) — CRÍTICA: es donde aterriza TODO el firewall de acciones irreversibles. Sin esto, el principio "para en el borde" no tiene UI.
4. **ALQ-51** RBAC / roles y permisos.
5. **ALQ-52** Gestión de conectores del cliente (UI sobre el router).
6. **ALQ-53** Sistema de notificaciones (email/SMS/in-app + alertas + avisos de gate).
7. **ALQ-54** Visor de procedencia / audit log (cada cifra → fuente).
8. **ALQ-55** Privacidad de datos LFPDPPP + retención.
9. **ALQ-56** Module Registry (catálogo + lifecycle de módulos).

---

*28 · Inventario de Completitud de Specs · Alquimia Supermind · 17 jun 2026*
