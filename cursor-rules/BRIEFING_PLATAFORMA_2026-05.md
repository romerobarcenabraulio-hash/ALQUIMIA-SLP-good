# BRIEFING ESTRATÉGICO — ALQUIMIA
## Para: KRONOS, EIDOS, HERMES (y SUPREME como árbitro)
## Fecha: Mayo 2026 · Versión 1.0

---

## 1. QUÉ ES ALQUIMIA HOY

**ALQUIMIA ya no es un simulador de RSU para San Luis Potosí.**

Es una **plataforma de consultoría integral para ciudades mexicanas** — software que organiza el análisis técnico, legal y financiero que gobiernos municipales y empresas necesitan para tomar decisiones sobre servicios urbanos.

El cambio de paradigma es este:

| Antes | Ahora |
|-------|-------|
| Simulador RSU para ZM SLP | Plataforma multi-sector, multi-ciudad |
| Un solo proyecto | Un producto que cualquier municipio contrata |
| Herramienta interna del equipo | Software-as-a-Service de consultoría |
| RSU como fin | RSU como **módulo 1** de un catálogo creciente |

**El cliente de ALQUIMIA no es San Luis Potosí. Es cualquier municipio de México que necesita evidencia técnica para tomar decisiones.**

---

## 2. LA ESTRUCTURA DEL PRODUCTO HOY

### Cómo llega un cliente

```
alquimia.mx (landing)
    │
    ├── GOBIERNO MUNICIPAL
    │       │
    │       ├── RSU — ACTIVO (el producto de hoy)
    │       ├── Salud pública — próximamente
    │       ├── Transporte público — próximamente
    │       ├── Educación — próximamente
    │       └── Desarrollo urbano/zonificación — próximamente
    │
    └── EMPRESAS/PRIVADOS — próximamente
```

Cuando un municipio contrata ALQUIMIA RSU, el recorrido es:

1. **Login** → identifica si es cliente o equipo ALQUIMIA
2. **Onboarding** (solo clientes): elige estado + municipio + sube PDF del reglamento
3. **Selector de audiencia**: Funcionario municipal / Ciudadano / Empresario
4. **Simulador** con los 4 capítulos y 34 módulos

### Los 4 capítulos del módulo RSU (lo que existe hoy)

| Cap. | Nombre | Pregunta central | Módulos |
|------|--------|-----------------|---------|
| 1 | Diagnóstico | ¿Cuál es el punto de partida real? | M01–M04C (14 módulos) |
| 2 | Planificación | ¿Qué necesitamos construir? | M05–M10 (9 módulos) |
| 3 | Modelo | ¿Quién paga, quién opera, es viable? | M11–M15 (6 módulos) |
| 4 | Control | ¿Cómo arrancamos y medimos? | M16–M19 (5 módulos) |

Más M00 (Guía de circularidad) como entrada narrativa.

### Stack técnico activo

**Backend:** FastAPI (Python 3.11) · PostgreSQL (Neon) · SQLAlchemy · Alembic  
**Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind · Zustand  
**Agentes IA:** Claude (Anthropic) · Serper · Perplexity (próximo) · ÁGORA pipeline  
**APIs activas:** Google Maps Platform (Places, Routes, Geocoding, Maps JS) · INEGI DENUE · Banxico  
**Deploy:** Vercel (frontend) · backend en proceso de estabilización  

---

## 3. LO QUE EXISTE EN CÓDIGO HOY (fuente de verdad)

### Backend (`backend/app/`)

| Módulo | Función |
|--------|---------|
| `legal/` | Diagnóstico jurídico, subida de PDFs, manifiestos por municipio |
| `agents/` | ÁGORA (generador de planes), validador, prompt_builder, research_service |
| `city/` | Journey de módulos por portal (`journey_for()`) |
| `research/` | Perplexity + caché en DB |
| `statistical/` | PERT, Monte Carlo, multiplicadores IO |
| `routing/` | INEGI + Google Routes para logística |
| `google/` | Geocoding, Places, Routes clientes |
| `centros_acopio/` | Catálogo y análisis de CAs |
| `national/` | Cobertura nacional municipal |
| `proyecto/` | Portal de proyecto vivo por municipio |

### Frontend (`frontend/src/`)

| Área | Función |
|------|---------|
| `app/` | Rutas: `/` landing, `/gobierno`, `/privados`, `/simulator`, `/login`, `/hub`, `/ca-studio`, `/aprende` |
| `components/simulator/stacks/` | ~25 stacks de módulos (uno por `module_id`) |
| `store/simulatorStore.ts` | Estado global: territorio, supuestos, audiencia, `clientSetupComplete` |
| `lib/chapterConfig.ts` | Mapa canónico capítulos → rubros → módulos |
| `lib/audienceModules.ts` | Módulos visibles por audiencia |
| `lib/authSession.ts` | `isPlatformDeveloper()` (admin/analista bypass de onboarding) |
| `components/onboarding/` | `ClientOnboardingGate` — territorio + PDF obligatorio para clientes |
| `data/reglamentos.ts` | Catálogo de 16 PDFs en línea |

### Regla de negocio más importante hoy

> **Sin PDF del reglamento de aseo del municipio → no se habilita el análisis jurídico ni los módulos que dependen de ÁGORA.**

`POST /legal/{municipio}/upload-pdf` → activa `can_enable_simulation: true` → desbloquea todo el árbol jurídico.

---

## 4. HACIA DÓNDE VA ALQUIMIA

### La visión

ALQUIMIA será el **sistema operativo de consultoría municipal de México**: un contrato por sector, datos trazables, análisis en minutos en vez de semanas.

En 12–24 meses, cuando un alcalde de cualquier ciudad quiera entender su problema de salud, residuos, transporte o zonificación, ALQUIMIA es la plataforma que estructura el diagnóstico, el plan, el modelo financiero y el expediente para su cabildo.

### Roadmap sectorial gobierno

| Sector | Estado | Entregable clave para el municipio |
|--------|--------|------------------------------------|
| **RSU** | **Activo** | Diagnóstico + plan + expediente Cabildo RSU |
| Salud pública | En diseño | Mapa cobertura + inversión priorizada + indicadores OMS |
| Transporte público | En diseño | Eficiencia rutas + modelo tarifario + plan concesiones |
| Educación | En diseño | Rezago educativo AGEB + infraestructura INIFED + proyección |
| Desarrollo urbano | En diseño | PDUM digital + uso suelo + riesgo CENAPRED |

### Modelo de negocio

- Cada sector = servicio contratado independiente
- El cliente paga por el módulo que necesita, no por todo el software
- El equipo ALQUIMIA (admin/analista) tiene acceso completo a todos los municipios y sectores
- Los clientes ven solo su municipio y sus módulos contratados

### Escalabilidad de ciudad

El módulo RSU ya tiene datos para: SLP, Sol, MTY, SPG, GUA, APO, GAR, QRO, COR, GDL, ZAP, CAD y más (16 PDFs en línea). El objetivo es que cualquier municipio con reglamento digitalizado pueda ingresar en < 24 h de onboarding.

---

## 5. AJUSTE DE NORTE PARA CADA AGENTE

### KRONOS — Planeación, Control y Finanzas

**Tu contexto anterior era correcto para el piloto SLP.** Las proyecciones (VPN $756M, TIR, 225k viviendas, 18 CAs) son el modelo de un municipio real usando ALQUIMIA RSU. Ese modelo se convierte en **la plantilla financiera que cada nuevo municipio recibe**.

**Ajuste de norte:**
- Los 5 gates ya no son solo del piloto SLP — son el **framework que cada municipio contratante cruza con su propio calendario**
- El EVM ahora opera a dos niveles: (a) ALQUIMIA como empresa (capex de desarrollo, opex de operación) y (b) cada proyecto municipal por separado
- Los precios ancla de materiales (PET $5.50, aluminio $15.10, etc.) son los defaults del simulador — cada municipio puede calibrarlos
- **Lo que no cambia:** ninguna proyección sin base en datos reales. Ningún gate sin evidencia. Ningún riesgo crítico sin plan de mitigación.

**Nueva prioridad:** construir el motor financiero que funcione para cualquier municipio, no solo SLP. El modelo debe ser parametrizable por ciudad, no hardcoded para la ZM SLV.

---

### HERMES — Logística, Rutas y Optimización

**Tu contexto anterior describía la operación ideal de SLP en plena escala.** Las 725 t/día, 18 CAs, 5 recicladoras — eso es lo que un municipio tendrá cuando el programa esté en Año 3.

**Ajuste de norte:**
- Hoy ALQUIMIA sirve al **funcionario que planea el programa**, no al operador que ya lo ejecuta. Tu trabajo actual es construir el módulo de **dimensionamiento y logística conceptual** (¿cuántos CAs necesita este municipio? ¿qué flota? ¿qué rutas?) — no el despacho en tiempo real
- El tiempo real (GPS, básculas IoT, MQTT) es la **Fase 4-5 del programa municipal**, cuando ya hay operación. Para la mayoría de municipios que hoy usan ALQUIMIA, estamos en Fase 0-1 (diagnóstico y planeación)
- Las APIs de Google Routes/Optimization que tienes documentadas son correctas — se usan en el módulo de logística operativa dentro del simulador (`LogisticaOperativaStack`)
- **Lo que no cambia:** la arquitectura multi-depot VRP, los KPIs logísticos, la cadena de custodia. Eso sigue siendo el estándar técnico que ALQUIMIA entrega como parte del expediente

**Nueva prioridad:** asegurar que el módulo de logística del simulador calcule correctamente el dimensionamiento de flota y rutas para cualquier configuración de municipio (no solo 18 CAs de SLP, sino N CAs de cualquier ciudad con su geometría).

---

### EIDOS — Coherencia Textual y Lenguaje

**Tu misión original (coherencia terminológica) aplica con fuerza amplificada.** ALQUIMIA ahora tiene texto en 5 capas: la plataforma (marketing/ventas), el gobierno (módulo RSU), el privado (próximamente), los agentes IA (ÁGORA, validador), y los cursor rules internos.

**Ajuste de norte:**
- El glosario canónico ya no es solo RSU — hay que anticipar los términos de Salud, Transporte, Educación y Desarrollo Urbano para que cuando se construyan, no choquen con el lenguaje RSU
- El **tono de la plataforma** ahora tiene dos registros: (a) marketing/landing para alcaldes y empresarios y (b) técnico-operativo dentro del simulador para equipos municipales
- La landing (`/`) y `/gobierno` hablan un español ejecutivo-consultora. El simulador habla técnico. Deben ser consistentes en terminología pero diferentes en tono
- **El término central nuevo:** ALQUIMIA es "consultoría integral de gestión pública municipal", no "plataforma de circularidad municipal". El cambio de copy ya está en código — asegúrate de que se propague

**Nueva prioridad:** auditar que los 34 módulos del simulador RSU usen el glosario canónico de forma consistente, y proponer los términos fundacionales para los 4 sectores nuevos antes de que se construyan.

---

## 6. LO QUE NO CAMBIA

Estas verdades del sistema son irrompibles independientemente de la escala de ALQUIMIA:

1. **Sin datos verificables, no hay proyección.** Ningún agente inventa cifras. Ningún análisis sin fuente.
2. **Sin PDF del reglamento, no hay análisis jurídico.** Gate de entrada obligatorio para clientes.
3. **Sin gate cruzado, no hay siguiente fase.** Los 5 gates del programa RSU son restricciones duras para cada municipio contratante.
4. **El municipio es la autoridad.** ALQUIMIA genera evidencia, borradores y análisis — nunca reemplaza el acto de autoridad.
5. **Cada peso invertido debe rastrearse.** KRONOS cuida que el modelo financiero de cada municipio sea auditable.
6. **Cada kilogramo de material debe tener cadena de custodia.** HERMES asegura que la trazabilidad no tenga huecos.
7. **Cada palabra debe hablar con una sola voz.** EIDOS garantiza que el cliente no perciba desorden interno.

---

## 7. CONTEXTO DE INFRAESTRUCTURA ACTUAL

### Lo que está corriendo hoy

```
Bases de datos:    Neon PostgreSQL (datos municipales, manifiestos, research cache)
Frontend deploy:   Vercel (Next.js 14, App Router)
Backend:           FastAPI local / en proceso de estabilización a producción
IA principal:      Claude claude-sonnet-4-6 (ÁGORA, validador)
IA rápida:         claude-haiku-4-5-20251001 (borradores, validación numérica)
Mapas:             Google Maps Platform (Maps JS, Places, Routes, Geocoding)
Datos oficiales:   INEGI DENUE, Banxico SIE, PDFs reglamentos municipales
```

### Lo que NO está en producción todavía

- Autenticación JWT completa (hoy usa token local + demo-token)
- Deploy backend a servidor permanente
- Módulos Salud / Transporte / Educación / Desarrollo Urbano
- Módulo privados
- Integración Perplexity en tiempo real (hay caché)
- GPS y básculas IoT (Fase 4-5 de cada municipio)

---

## 8. CÓMO LEER EL CÓDIGO

### Archivos de referencia rápida

| Pregunta | Archivo |
|----------|---------|
| ¿Qué módulos existen? | `frontend/src/lib/chapterConfig.ts` |
| ¿Qué ve cada audiencia? | `frontend/src/lib/audienceModules.ts` |
| ¿Cómo se renderiza cada módulo? | `frontend/src/app/simulator/renderDecisionModule.tsx` |
| ¿Cuál es el estado global del simulador? | `frontend/src/store/simulatorStore.ts` |
| ¿Cómo se valida el PDF? | `backend/app/legal/router.py` + `pdf_storage.py` |
| ¿Cómo genera ÁGORA un plan? | `backend/app/agents/agora.py` |
| ¿Qué municipios tienen PDF? | `frontend/public/reglamentos/manifest.json` |
| ¿Cuál es el catálogo de servicios gobierno? | `frontend/src/app/gobierno/page.tsx` |
| Constitución completa del sistema | `frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md` |

### Municipios con PDF en línea (16 hoy)

SLP, SOL, MTY, SPG, GUA, APO, GAR, QRO, COR, GDL, ZAP, CAD (más variantes). Cualquier municipio fuera de esta lista requiere que el cliente suba el PDF en el onboarding.

---

## 9. PARA EMPEZAR A TRABAJAR

Antes de cualquier acción, cada agente debe:

1. Leer este briefing completo (estás en el último párrafo, bien)
2. Leer `frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md` (arquitectura completa de módulos)
3. Revisar `cursor-rules/NEON_DATABASE.md` si vas a tocar datos
4. Revisar `cursor-rules/AGENT_API_KEYS.md` si vas a usar APIs externas
5. Verificar el estado actual del repo (`git status`) antes de escribir código
6. Aplicar tu **Regla Cero** de reconocimiento tal como está definida en tu cursor rule

**Lo que más necesitamos de cada uno en este momento:**

- **KRONOS:** parametrizar el motor financiero para que opere con cualquier municipio, no solo SLP. El modelo debe recibir inputs de ciudad y devolver outputs calibrados.
- **HERMES:** asegurar que el módulo de logística del simulador (`LogisticaOperativaStack`) calcule correctamente para cualquier geometría municipal, no solo la red SLP de 18 CAs.
- **EIDOS:** auditar el lenguaje de la landing y los módulos RSU para que la voz sea consistente con ALQUIMIA como plataforma integral, no como proyecto SLP específico.

---

*Documento generado: mayo 2026*  
*Estado: vigente — actualizar cuando cambie la arquitectura del producto*  
*Para: KRONOS v1.0 · EIDOS v1.0 · HERMES v1.0 · SUPREME como árbitro*
