# BRIEFING ESTRATÉGICO — ALQUIMIA
## Para: KRONOS · EIDOS · HERMES (SUPREME como árbitro)
## Fecha: 22 mayo 2026 · Versión 2.0 · Commit `8c18c5bc`

---

## 1. QUÉ ES ALQUIMIA

**ALQUIMIA es una plataforma de consultoría integral para ciudades mexicanas.**

Organiza el análisis técnico, legal y financiero que gobiernos municipales y empresas necesitan para tomar decisiones sobre servicios urbanos — desde residuos hasta desarrollo urbano.

| Antes (hasta hoy) | Ahora y hacia adelante |
|-------------------|------------------------|
| Simulador RSU para ZM SLP | Plataforma multi-sector, multi-ciudad |
| Herramienta interna del equipo | SaaS de consultoría contratado por municipio |
| "Plataforma de circularidad municipal" | "Consultoría integral de gestión pública municipal" |
| RSU como el producto | RSU como **módulo 1** de un catálogo de 5 sectores |

**El cliente de ALQUIMIA no es San Luis Potosí. Es cualquier municipio de México.**

---

## 2. ARQUITECTURA DEL PRODUCTO — ESTADO ACTUAL (código en producción)

### Rutas del frontend (todas en `/frontend/src/app/`)

```
/                    Landing — 3 opciones: Gobierno · Privados · Iniciar sesión
/gobierno            Catálogo sectorial gobierno (RSU activo + 4 bloqueados)
/gobierno/rsu        Entry point RSU → redirect a /simulator (requiere login)
/privados            Sector privado (coming soon)
/login               Autenticación con redirect inteligente
/simulator           Simulador completo con onboarding + audiencia + módulos
/hub                 Biblioteca de documentos y adendos
/ca-studio           Diseñador de centros de acopio
/aprende             Centro educativo público (sin auth)
/admin               Panel de administración (equipo ALQUIMIA)
/informe/[id]        Informes dinámicos por municipio
/proyecto/[id]       Portal de proyecto vivo por municipio
```

### Rutas eliminadas (ya no existen — no intentar usar)

```
/acceso              ELIMINADO — reemplazado por /login + AudienceGateway en simulador
AccesoForm.tsx       ELIMINADO — el selector de rol vive dentro del simulador
```

### Flujo de usuario completo

```
/ (landing)
    │
    ├─ [Gobierno] ──► /gobierno ──► [RSU activo] ──► /gobierno/rsu
    │                                                      │
    │                                              ¿tiene token?
    │                                              ├─ SÍ → /simulator
    │                                              └─ NO → /login?next=/gobierno/rsu
    │
    ├─ [Privados] ──► /privados (coming soon)
    │
    └─ [Ya tengo cuenta] ──► form inline → /login
                                                │
                                         ¿es admin/analista?
                                         ├─ SÍ → /simulator (acceso directo)
                                         └─ NO → /gobierno (catálogo cliente)

/simulator
    │
    ├─ ¿isPlatformDeveloper()? → saltar onboarding
    └─ ¿clientSetupComplete? → NO → ClientOnboardingGate
                                         │
                                    estado + municipio + PDF
                                         │
                                    completeClientSetup()
                                         │
                               ¿audience seleccionada? → NO → AudienceGateway
                                         │
                               Simulador 4 capítulos × 34 módulos
```

### Roles de usuario

| Token / campo `rol` | Comportamiento |
|---------------------|----------------|
| `admin` o `analista` | `isPlatformDeveloper()` = true → sin onboarding, acceso directo a `/simulator` |
| cualquier otro rol | Cliente → onboarding obligatorio (estado + municipio + PDF) → catálogo gobierno |
| `demo-token` | Tratado como `analista` — acceso directo |

---

## 3. MÓDULOS RSU — LOS 4 CAPÍTULOS

El módulo RSU tiene 34 módulos organizados en 4 capítulos. Esta es la fuente de verdad en código:
`frontend/src/lib/chapterConfig.ts`

| Cap. | Nombre | Color | Rubros | Módulos |
|------|--------|-------|--------|---------|
| **1** | Diagnóstico | Verde `#3B6D11` | Ambiental · Social · Gobernanza operativa · Institucional-normativo · Financiero-económico · Teoría de cambio | 14 módulos (M01–M04C) |
| **2** | Planificación | Azul `#1A5FA8` | Estratégico · Operativo · Económico | 9 módulos (M05–M10) |
| **3** | Modelo | Ámbar `#D4881E` | Institucional · Financiero · Gobernanza | 6 módulos (M11–M15) |
| **4** | Control | Púrpura `#4A1C7A` | Cumplimiento · Monitoreo · Reporteo | 5 módulos (M16–M19) |

Más **M00** (Guía de circularidad) como entrada narrativa.

Documento completo de arquitectura: `frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md`

---

## 4. REGLA DE NEGOCIO CENTRAL

> **Sin PDF del reglamento municipal → sin análisis jurídico → sin módulos ÁGORA.**

```
POST /legal/{municipio}/upload-pdf
  → guarda PDF en frontend/public/reglamentos/
  → actualiza manifiesto
  → retorna { analysis_ready: true, can_enable_simulation: true }
  → desbloquea árbol jurídico completo (DiagnosticoJuridico, ÁGORA, Validador)
```

PDFs ya en línea (16 municipios): SLP, SOL, MTY, SPG, GUA, APO, GAR, QRO, COR, GDL, ZAP, CAD y variantes.
Municipios fuera de esa lista: el cliente los sube en onboarding.

---

## 5. STACK TÉCNICO

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Frontend | Next.js 16.2.4 · TypeScript · Tailwind · Zustand | En producción (Vercel) |
| Backend | FastAPI (Python 3.11) · SQLAlchemy 2.0 · Alembic | Local / estabilización |
| Base de datos | PostgreSQL (Neon) | Activo |
| IA principal | Claude `claude-sonnet-4-6` | ÁGORA, Validador, Research |
| IA rápida | Claude `claude-haiku-4-5-20251001` | Borradores, validación numérica |
| Mapas | Google Maps Platform (Maps JS, Places, Routes, Geocoding, Route Optimization) | Activo |
| Datos oficiales | INEGI DENUE · Banxico SIE · PDFs reglamentos | Activo |
| Research | Perplexity API + caché en DB (6h por municipio) | Activo (diferido) |
| Dev server | `npm run dev -p 3000` desde `/frontend` | localhost:3000 |

### Lo que NO está en producción todavía

- Autenticación JWT completa (hoy: token local + `demo-token`)
- Deploy backend a servidor permanente
- Módulos gobierno: Salud · Transporte · Educación · Desarrollo urbano
- Módulo privados
- GPS y básculas IoT (son Fase 4-5 de cada municipio, no Fase 0-1 actual)

---

## 6. ROADMAP SECTORIAL GOBIERNO

| Sector | Estado | Entregable para el municipio |
|--------|--------|------------------------------|
| **RSU** | **Activo — 34 módulos** | Diagnóstico + plan + modelo financiero + expediente Cabildo |
| Salud pública | En diseño | Cobertura sanitaria + inversión priorizada + indicadores OMS/OPS |
| Transporte público | En diseño | Eficiencia rutas + modelo tarifario + plan concesiones |
| Educación | En diseño | Rezago educativo AGEB + infraestructura INIFED + proyección matrícula |
| Desarrollo urbano / zonificación | En diseño | PDUM digital + uso suelo + riesgo CENAPRED |

Modelo de negocio: cada sector = servicio contratado independiente. El cliente paga solo por lo que necesita.

---

## 7. AJUSTE DE NORTE — INSTRUCCIONES POR AGENTE

### KRONOS — Planeación, Control y Finanzas

Tu cursor rule describe el motor financiero del **piloto SLP**. Eso sigue siendo correcto, pero ahora debes entenderlo como **la plantilla que cada municipio contratante recibe y calibra**.

**Qué cambia:**
- Los 5 gates (G1–G5) son el framework para cada municipio, con su propio calendario. No son una fecha fija de SLP.
- El EVM opera en dos niveles: (a) ALQUIMIA como empresa SaaS y (b) cada proyecto municipal
- Precios ancla (PET $5.50, aluminio $15.10, etc.) = defaults del simulador; cada municipio puede editarlos desde `SimulatorState.precios`
- El modelo financiero está en el frontend en `simulatorStore.ts` (estado) + `backend/app/statistical/` (PERT, Monte Carlo, multiplicadores IO)

**Qué NO cambia:**
- Ninguna proyección sin base en datos reales
- Ningún gate sin evidencia verificable
- Ningún riesgo crítico sin plan de mitigación activo
- Histórico inmutable: nunca sobreescribir, solo agregar

**Tu tarea más urgente:**
Parametrizar el motor financiero para cualquier municipio. Hoy tiene valores hardcoded de SLP. El simulador ya acepta inputs de ciudad (`applyMunicipioCatalog()` en el store) — el modelo debe usar esos inputs para calibrar proyecciones, no suponer ZM SLV.

---

### HERMES — Logística, Rutas y Optimización

Tu cursor rule describe la operación a **escala completa Año 3** (725 t/día, 18 CAs, GPS en tiempo real). Eso es correcto para cuando un municipio ya está operando. Pero la mayoría de clientes de ALQUIMIA hoy están en **Fase 0-1: diagnóstico y planeación**.

**Qué cambia:**
- Tu trabajo prioritario hoy es el módulo de **dimensionamiento conceptual** dentro del simulador: dado el municipio X, ¿cuántos CAs de qué escala (P/M/G), qué mix de flota, qué rutas base?
- El stack GPS + IoT + MQTT + básculas en tiempo real es Fase 4-5 de cada programa municipal, no Fase 0-1
- Las APIs Google Routes/Optimization documentadas en tu cursor rule SÍ se usan hoy, pero para calcular distancias y dimensionar logística en el simulador (`LogisticaOperativaStack`, `InfrastructureOperationsStack`), no para despacho real
- El módulo `backend/app/routing/` (INEGI + Google Routes) ya existe y está activo

**Qué NO cambia:**
- La arquitectura multi-depot VRP es el estándar técnico que ALQUIMIA entrega en el expediente
- Los KPIs logísticos (t/día, costo/t, km/t, pureza) son los mismos
- La cadena de custodia es irrompible en cualquier fase

**Tu tarea más urgente:**
Asegurar que `LogisticaOperativaStack` calcule el dimensionamiento de flota y rutas para cualquier municipio (no solo la red fija de SLP). El componente debe usar `municipiosActivos` y `zmActiva` del store, no valores hardcodeados.

---

### EIDOS — Coherencia Textual y Lenguaje

ALQUIMIA ahora tiene texto en **6 capas**: landing (marketing), gobierno (catálogo), privados (coming soon), simulador (técnico-operativo), agentes IA (ÁGORA/validador), y cursor rules internos.

**Qué cambia:**
- El **término central** cambió: ya no es "plataforma de circularidad municipal" — es "consultoría integral de gestión pública municipal". El cambio está en código (landing, login, header) pero puede no estar propagado en todos los stacks y documentos del simulador
- La plataforma habla en **dos registros** que deben ser consistentes en terminología pero diferentes en tono:
  - **Registro ejecutivo** (`/`, `/gobierno`, `/privados`): español directo, sin jerga técnica, orientado a alcaldes y directores
  - **Registro técnico** (`/simulator` y sus módulos): estructurado, con tablas y métricas, para equipos municipales
- El glosario debe anticipar los 4 sectores nuevos (Salud, Transporte, Educación, Desarrollo Urbano) antes de que se construyan, para evitar colisiones terminológicas con RSU

**Qué NO cambia:**
- Los términos canónicos RSU del glosario (`frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md`)
- "Centro de acopio" (no nodo, no punto)
- "Fracción" (no material, no residuo)
- "Valorización" (no reciclaje, no aprovechamiento)
- "Gate" (en todo el proyecto)
- "VPN" (no NPV), "TIR" (no IRR) en documentos en español

**Tu tarea más urgente:**
Auditar que el copy de `/gobierno/page.tsx` (catálogo de servicios) describa correctamente los 4 sectores futuros sin usar terminología que luego colisione con los módulos que se construyan. Esos 4 textos de "scope previsto" son el primer contrato de lenguaje con el mercado.

---

## 8. LO QUE NO CAMBIA — VERDADES IRROMPIBLES

1. **Sin datos verificables, no hay proyección.** Ningún agente inventa cifras.
2. **Sin PDF, sin análisis jurídico.** Gate de entrada obligatorio para clientes.
3. **Sin gate cruzado, no hay siguiente fase.** Restricciones duras para cada municipio.
4. **El municipio es la autoridad.** ALQUIMIA genera evidencia — nunca reemplaza el acto de autoridad.
5. **KRONOS** cuida que el modelo financiero de cada municipio sea auditable.
6. **HERMES** cuida que la trazabilidad logística no tenga huecos.
7. **EIDOS** cuida que el cliente no perciba desorden interno de lenguaje.

---

## 9. ARCHIVOS DE REFERENCIA RÁPIDA

| Pregunta | Dónde mirar |
|----------|-------------|
| ¿Qué módulos existen y en qué capítulo? | `frontend/src/lib/chapterConfig.ts` |
| ¿Qué ve cada audiencia? | `frontend/src/lib/audienceModules.ts` |
| ¿Cómo se renderiza cada módulo? | `frontend/src/app/simulator/renderDecisionModule.tsx` |
| ¿Estado global del simulador? | `frontend/src/store/simulatorStore.ts` |
| ¿Cómo funciona el onboarding de cliente? | `frontend/src/components/onboarding/ClientOnboardingGate.tsx` |
| ¿Cómo se detecta si es dev o cliente? | `frontend/src/lib/authSession.ts` |
| ¿Cómo se valida el PDF y se activa ÁGORA? | `backend/app/legal/router.py` + `pdf_storage.py` |
| ¿Cómo genera ÁGORA un plan? | `backend/app/agents/agora.py` |
| ¿Qué municipios tienen PDF en línea? | `frontend/public/reglamentos/manifest.json` |
| ¿Catálogo de servicios gobierno? | `frontend/src/app/gobierno/page.tsx` |
| ¿Logística operativa? | `backend/app/routing/` + `backend/app/statistical/` |
| Arquitectura completa capítulos/módulos | `frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md` |
| APIs externas y claves | `cursor-rules/AGENT_API_KEYS.md` |
| Base de datos Neon | `cursor-rules/NEON_DATABASE.md` |

---

## 10. PROTOCOLO DE INICIO PARA CUALQUIER AGENTE

```
1. git pull                              ← asegurarse de estar en commit 8c18c5bc o posterior
2. Leer este briefing completo
3. Leer frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md
4. git status                            ← nunca asumir el estado del repo
5. Ejecutar Regla Cero de tu cursor rule
6. Declarar estado antes de actuar
```

**No empezar a modificar código sin haber completado el paso 5.**

---

*Versión 2.0 — 22 mayo 2026 · Commit base: `8c18c5bc`*  
*Actualizar cuando cambie: rutas, módulos, roles, stack técnico o modelo de negocio*  
*KRONOS v1.0 · EIDOS v1.0 · HERMES v1.0 · SUPREME como árbitro*
