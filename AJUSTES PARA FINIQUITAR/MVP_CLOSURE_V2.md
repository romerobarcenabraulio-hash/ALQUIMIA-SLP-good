# MVP CLOSURE V2 · Secuencia ejecutable refinada para Codex

**Estado:** Plan de cierre del MVP comercial
**Fecha:** 29 mayo 2026 · v2 (reemplaza v1)
**Reemplaza:** MVP_CLOSURE_PROMPT_SEQUENCE.md (v1)
**Objetivo:** MVP comercial listo para recibir leads institucionales en 3-4 días
**Método:** Cinco prompts secuenciales con criterios binarios verificables en pantalla

---

## Cambios versus v1

La v1 contemplaba demo público con SLP como caso vivo. La v2 corrige seis cosas según decisiones del founder del 29 mayo:

1. **Sin demo público.** Cada cliente ve SU propio municipio precargado desde el primer login. No existe "modo demostración" como concepto.
2. **Registro restringido a dominios institucionales.** Opción A+: dominios `.gob.mx` y derivados pasan automático; dominios genéricos (gmail, outlook) pasan a validación manual del founder.
3. **Limit de 3-5 emails por municipio.** Constraint en base de datos. El sexto registro del mismo municipio recibe email de coordinación interna.
4. **Narrativa de "súmate al cambio"** en lugar de "Cabildo." Tono de invitación, no de compromiso institucional.
5. **Posicionamiento de categoría:** "Plataforma dedicada a crear, impulsar y aterrizar política pública" con cuña inicial en vivienda en condominio.
6. **Marca de agua en cada página** de la versión preliminar: "ALQUIMIA · Diagnóstico inicial · Versión [N] · [fecha]"

---

## Regla operativa absoluta

**No pases al siguiente prompt hasta verificar el criterio del anterior abriendo Chrome y confirmando con tus ojos que el cambio está en producción.**

Si un prompt falla, paramos ahí, diagnosticamos y arreglamos. No acumulamos cinco frentes rotos. Esta es la única regla que rompe el loop de "veo cambios pero no avance."

---

## Prompt 1 · Limpieza quirúrgica del código legacy (4-6 horas)

Sin cambios versus v1. El prompt 1 se mantiene exactamente igual porque la limpieza es prerrequisito independiente de la dirección comercial.

```
TAREA: LIMPIEZA QUIRÚRGICA DEL CÓDIGO LEGACY

Contexto: el repo /Users/braulioromerobarcena/Documents/alquimia-slp/
acumuló seis meses de iteraciones. Hay código muerto, componentes
duplicados, referencias a módulos eliminados, rutas viejas, archivos
sin uso. Esto está confundiendo a todos los agentes (incluido tú,
Codex/Cursor) y produce cambios que no se reflejan en producción.

ANTES DE TOCAR NADA:
1. Crea branch nuevo: feature/mvp-closure-cleanup
2. Commit del estado actual con mensaje "pre-cleanup snapshot"
3. Lee /docs/architecture/ADR-0010_stage_based_platform_separation.md
4. Lee /docs/architecture/MODULE_MATURITY_AND_PERSONALIZATION.md
   Arquitectura aprobada: 23 módulos consolidados en tres plataformas
   más Plataforma 0. Lo que no está en esa lista es código a eliminar.

REGLA INVIOLABLE:
NO elimines código sin asegurarte de que está desactivado en producción.
Si tienes duda sobre algo, márcalo con // TODO_CLEANUP_REVIEW y déjalo.
Preferible dejar 10 archivos dudosos que romper 1 funcional.

ACCIONES CONCRETAS EN ORDEN:

PASO 1 · Identificación de código muerto.
Ejecuta y dame el output:
  - npx ts-prune
  - npx depcheck
  - grep -r "TODO\|FIXME\|XXX\|HACK\|DEPRECATED" --include="*.tsx" --include="*.ts" src/
  - grep -r "console.log" --include="*.tsx" --include="*.ts" src/

PASO 2 · Eliminación de archivos legacy explícitos.
Busca y elimina (después de confirmar en el output):
  - Archivos que mencionen "modo Validar/Implementar" como toggle
    (esa arquitectura fue reemplazada por ADR-0010)
  - Componente ChapterSeparator decorativo si existe
  - Referencias a módulos no presentes en MODULE_MATURITY:
    M01B, M02D como módulo independiente, M03C como página separada,
    M03D como página separada, M04C como página separada, M05B/C/D
    como páginas separadas, M08B como página separada, M11/M12
    separados, M20B como página separada, M21B como página separada
  - Rutas /api antiguas sin componente que las llame
  - Imports rotos en cualquier archivo

PASO 3 · Consolidación de utilities.
  - Funciones duplicadas (formatCurrency, formatDate) en /lib/utils.ts
  - Tipos duplicados en /types/index.ts

PASO 4 · Lint y format.
  - npm run lint -- --fix
  - npx prettier --write "src/**/*.{ts,tsx}"

CRITERIO BINARIO DE CIERRE:
1. npm run build pasa sin errores
2. npm run dev levanta sin warnings
3. /simulator carga igual que antes (cero regresión visual)
4. Branch tiene un solo commit "feat(cleanup): remove legacy code"

LO QUE NO DEBES HACER:
- No instales librerías nuevas
- No cambies estructura de carpetas
- No modifiques estilos
- No toques contenido editorial de módulos pilar (M01, M13, M14, M21)
- No elimines archivos sin confirmar en el output

REPORTE FINAL:
- Lista de archivos eliminados
- Lista de imports limpiados
- Lista de TODOs marcados para revisión
- Screenshot de los cuatro criterios cumplidos
```

**Verificación antes de pasar al Prompt 2:** Chrome incognito, alquimiaplatform.com/simulator debe verse igual que antes. Si algo se rompió, párate aquí.

---

## Prompt 2 · Clerk con filtro institucional A+ (4-6 horas)

Versión refinada del Prompt 2 de v1 con la lógica de dominios institucionales integrada.

```
TAREA: INSTALAR CLERK CON FILTRO INSTITUCIONAL DE DOMINIOS

Contexto: Twilio para SMS no funciona consistentemente. Migración a
Clerk porque (a) TOTP nativo, (b) organizations multi-tenant mapean a
municipios, (c) componentes pre-construidos reducen plomería a horas.

Cambio crítico v2: el registro NO es abierto. Acepta solo correos
de dominios institucionales (.gob.mx y derivados). Dominios genéricos
(gmail, outlook, hotmail) pasan a validación manual del founder.
Esto reduce costo de tokens HERMES y filtra leads no calificados.

ANTES DE TOCAR NADA:
1. Branch feature/clerk-auth desde feature/mvp-closure-cleanup
2. Cuenta Clerk creada en clerk.com
3. Sigue la guía oficial en /docs/setup/clerk_installation_guide.md
   (la que entregó el founder con los siete pasos)

ACCIONES CONCRETAS EN ORDEN:

PASO 1 · Instalación base de Clerk siguiendo guía oficial.
  - npm install @clerk/nextjs
  - clerk auth login
  - clerk init --framework next --pm npm
  - Variables de entorno en .env.local Y en Vercel:
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
    CLERK_SECRET_KEY=...

PASO 2 · Configura el dashboard de Clerk para tu caso.
En clerk.com dashboard:
  - User & Authentication > Email > Magic links: enabled
  - User & Authentication > Email > Password: disabled
    (en B2B gubernamental, password adds friction sin valor real;
     magic link es superior)
  - User & Authentication > Multi-factor:
    Toggle "Authenticator app (TOTP)" = enabled
    Toggle "Backup codes" = enabled
  - Organizations > Enable organizations
  - Customization > Branding > Logo: subir logo ALQUIMIA

PASO 3 · Lista de dominios institucionales autorizados.
Crea /lib/institutional_domains.ts:

export const INSTITUTIONAL_DOMAINS_AUTO_APPROVE = [
  // Federales
  '.gob.mx',

  // Estatales (lista expandible)
  '.slp.gob.mx',
  '.queretaro.gob.mx',
  '.guanajuato.gob.mx',
  '.jalisco.gob.mx',
  '.nl.gob.mx',
  '.cdmx.gob.mx',
  // ... agregar el resto de estados

  // Universidades públicas con histórico RSU
  '.unam.mx',
  '.ipn.mx',
  '.uaslp.mx',
  '.uanl.mx',
  '.udg.mx',
  '.colmex.mx',

  // Concesionarios conocidos del sector
  '.proactiva.com.mx',
  '.redambiental.com',
  '.promotoraambiental.com',
]

export function isInstitutionalDomain(email: string): boolean {
  const domain = '@' + email.split('@')[1]?.toLowerCase()
  return INSTITUTIONAL_DOMAINS_AUTO_APPROVE.some(d =>
    domain === d || domain.endsWith(d.startsWith('.') ? d : '.' + d)
  )
}

PASO 4 · Página de registro /comenzar (reemplaza /sign-up de Clerk default).
Crea /app/comenzar/page.tsx con formulario custom (NO usar <SignUp />
de Clerk porque necesitas la lógica de filtro):

Campos:
  - Estado (dropdown poblado desde lista de 32 estados mexicanos)
  - Municipio (dropdown poblado dinámicamente vía INEGI según estado)
  - Tu nombre completo
  - Tu cargo (dropdown):
    "Presidente Municipal", "Síndico", "Tesorero",
    "Director de Servicios Públicos", "Regidor", "Secretario del Ayuntamiento",
    "Otro funcionario", "Académico", "Consultor", "Otro"
  - Email institucional

Submit:
  1. Verifica que el email NO esté ya registrado.
  2. Cuenta cuántos registros previos hay para ese inegi_clave municipal.
     Si > 5, responde: "Tu municipio ya tiene 5 funcionarios registrados.
     Por favor contacta a quien se registró primero para coordinar acceso."
  3. Verifica con isInstitutionalDomain(email):
     - Si TRUE: crea Clerk user con status "active", envía magic link,
       dispara webhook a HERMES para iniciar inferencia, redirige a
       pantalla "Tu diagnóstico está siendo preparado"
     - Si FALSE: crea Clerk user con status "pending_manual_validation",
       NO dispara HERMES, envía email al founder con datos del lead,
       envía email al usuario con texto:
       "Recibimos tu solicitud para [Municipio]. Para confirmar tu rol
       institucional, agendamos llamada breve esta semana.
       [Link Calendly del founder]"

PASO 5 · Pantalla intermedia /preparando.
Crea /app/preparando/page.tsx:
  - Mensaje grande: "Estamos preparando tu diagnóstico, [Nombre]"
  - Subtexto: "Recopilamos datos oficiales de [Municipio] desde INEGI,
    SEMARNAT y el Periódico Oficial del Estado. Toma 10-15 minutos.
    Te avisaremos por email cuando esté listo."
  - Sin progress bar engañoso (el pipeline es backend, no es lineal)

PASO 6 · Middleware.
/middleware.ts:

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/comenzar(.*)',
  '/preparando(.*)',
  '/metodologia(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return

  const { userId, sessionClaims } = await auth()
  if (!userId) return Response.redirect(new URL('/sign-in', req.url))

  const status = sessionClaims?.publicMetadata?.status
  if (status === 'pending_manual_validation') {
    return Response.redirect(new URL('/pendiente-validacion', req.url))
  }

  const role = sessionClaims?.publicMetadata?.role
  if (isAdminRoute(req) && role !== 'founder' && role !== 'admin') {
    return Response.redirect(new URL('/v', req.url))
  }
})

PASO 7 · Twilio retirement.
- Comenta (NO elimines) código Twilio
- Marca con // LEGACY_TWILIO_DELETE_AFTER_DAYS_30
- En 30 días si Clerk va bien, eliminación formal

CRITERIO BINARIO DE CIERRE:
1. /comenzar carga formulario nuevo con dropdowns funcionales
2. Submit con email .gob.mx crea cuenta, dispara HERMES, redirige
   a /preparando
3. Submit con gmail crea cuenta en pending_manual_validation
4. Founder recibe email con datos del lead pendiente
5. Magic link funciona (sin password)
6. TOTP se puede activar desde perfil de Clerk
7. Constraint 5 registros por municipio funciona
8. Cero referencias activas a Twilio en código que se ejecuta

LO QUE NO DEBES HACER:
- No uses <SignUp /> de Clerk default (necesitas form custom)
- No actives password (solo magic link + TOTP)
- No olvides variables en Vercel (no solo .env.local)
- No publiques a producción hasta cerrar Prompt 3
- No elimines Twilio, solo desactívalo

REPORTE FINAL:
- Screenshots de /comenzar, /preparando, email recibido
- Confirmación 8 criterios
- Lista de variables en Vercel
- Lista de dominios autorizados configurada
```

**Verificación antes de pasar al Prompt 3:** Regístrate con tu email gmail personal — debe entrar en pending. Regístrate después con email tuyo .gob.mx falso configurado en tu DNS — debe pasar automático. Si los dos comportamientos funcionan, Prompt 2 está cerrado.

---

## Prompt 3 · Landing nueva con narrativa de "súmate al cambio" (4-6 horas)

Reescrito completamente versus v1 porque cambia la dirección comercial.

```
TAREA: LANDING PÚBLICA CON POSICIONAMIENTO DE CATEGORÍA Y CUÑA CONDOMINIO

Contexto: hoy alquimiaplatform.com muestra solo login. No declara qué
es Alquimia ni para qué sirve. El founder articuló posicionamiento:
plataforma dedicada a política pública con cuña inicial en vivienda
en condominio. La narrativa de venta usa tono de invitación
("súmate al cambio") en lugar de compromiso institucional
("preséntalo al Cabildo"). Esto es diferenciador comercial crítico.

ANTES DE TOCAR NADA:
1. Branch feature/landing-narrativa desde feature/clerk-auth
2. Lee este prompt completo antes de comenzar
3. Confirma con el founder cualquier ajuste de copy antes de publicar

NARRATIVA APROBADA POR EL FOUNDER:

Hero (above the fold):
  H1: "La circularidad en tu ciudad sí se puede."
  H2: "Súmate al cambio. Toma las medidas. Hazlas acción."
  Body: "Alquimia es una plataforma dedicada a crear, impulsar y
        aterrizar política pública. Hoy enfocados en una cosa:
        hacer que la circularidad de residuos suceda en la vivienda
        en condominio mexicana."
  CTA primario: "Ver el diagnóstico para mi municipio"
  CTA secundario: "Conocer la metodología"

Sección 2 · El viaje del cambio:
  Tres tarjetas horizontales con tono de invitación, NO de compromiso.

  Tarjeta 1 (Validación):
    Título: "Comienza viendo dónde estás"
    Body: "Datos oficiales de tu municipio, costo de no actuar,
          escenarios financieros, riesgos del cambio. Cuatro a ocho
          semanas con tu equipo."

  Tarjeta 2 (Planeación):
    Título: "Diseña cómo lo vas a hacer"
    Body: "Plan operativo, infraestructura, organigrama, presupuesto.
          Aterriza la idea sin perder rigor. Ocho a doce semanas."

  Tarjeta 3 (Ejecución):
    Título: "Demuestra que funciona"
    Body: "Monitoreo mensual, control presupuestal, reportes ESG.
          Operación continua que tu Cabildo y tus ciudadanos pueden ver."

Sección 3 · Respaldo institucional:
  Texto: "Metodología respaldada por estándares internacionales."
  Pills tipográficas (sin imágenes):
    GRI · ISO · PMI · CSRD · NMX-AA · SDG 11.6
  Subtexto: "Diagnóstico técnicamente defendible. Cero invención de cifras."

Sección 4 · Por qué condominio:
  Título: "Por qué empezamos por vivienda en condominio"
  Body: "Es donde más se desperdicia, donde menos se separa, y donde
        un cambio rinde más por peso invertido. El mercado mexicano
        tiene más de tres millones de hogares en condominio.
        Aquí empieza la transformación."

Sección 5 · Footer:
  Links: /sign-in, /comenzar, /metodologia, contacto
  Aviso de privacidad
  Copyright

ACCIONES CONCRETAS EN ORDEN:

PASO 1 · Crea /app/page.tsx (raíz).
Implementa las cinco secciones con tipografía y design system actual
de Alquimia. Mobile-first. Cero imágenes grandes (tu producto es
texto e institucional).

PASO 2 · Crea /app/metodologia/page.tsx.
Página educativa con cinco bloques:
  1. Cómo se construye el diagnóstico inicial (HERMES, fuentes públicas)
  2. Cómo se validan las cifras (proceso con el cliente)
  3. Qué estándares respaldan cada módulo (referencia a standards_map)
  4. Cómo se evita la invención de datos (sellos de confianza)
  5. Cómo el cliente exporta su diagnóstico (versión preliminar y oficial)

Esta página no es necesaria para la conversión pero responde objeciones
de tesoreros y síndicos que preguntan "¿cómo me garantizan que esto
no es invento?". Tener la respuesta lista por escrito acelera ventas.

PASO 3 · Modifica comportamiento de /simulator.
Hoy /simulator carga simulador directo. Cámbialo:
  - Si usuario no autenticado: redirige a /
  - Si usuario autenticado: redirige a la plataforma que corresponde
    a su current_stage (/v, /p, o /e)
  - /simulator se mantiene como ruta legacy pero solo redirige

PASO 4 · Verifica el flujo end-to-end.
Visitante anónimo entra a /:
  - Click "Ver diagnóstico para mi municipio" → /comenzar
  - Click "Conocer la metodología" → /metodologia
  - Click cualquier sección scrolleable → scroll suave

CRITERIO BINARIO DE CIERRE:
1. alquimiaplatform.com (raíz) muestra landing nueva
2. Las cinco secciones renderizan correctamente en desktop y mobile
3. CTA primario lleva a /comenzar funcional (del Prompt 2)
4. /metodologia existe y carga las cinco subsecciones
5. /simulator redirige correctamente según estado del usuario
6. Cero referencia a "demo" o "modo demostración" en el copy
7. Cero referencia a "Cabildo" en hero o tarjetas principales
   (sí puede mencionarse en /metodologia y módulos internos)
8. Cero menciones de precios o tiers en landing pública

LO QUE NO DEBES HACER:
- No reuses copy del simulador antiguo
- No agregues testimoniales falsos
- No metas video hero (carga lenta, fricción)
- No metas chat widget en landing
- No agregues múltiples CTAs en hero (uno primario, uno secundario)

REPORTE FINAL:
- Screenshots de las cinco secciones desktop
- Screenshots de las cinco secciones mobile
- Confirmación 8 criterios
```

**Verificación antes de pasar al Prompt 4:** Abre alquimiaplatform.com en mobile. Lee la primera sección como si fueras un alcalde sin contexto. ¿Entiendes qué es Alquimia en 30 segundos? ¿Sientes invitación o compromiso? Si la respuesta es invitación, Prompt 3 está cerrado.

---

## Prompt 4 · Diagnóstico inicial + títulos legibles + marca de agua + brechas documentales (5-7 horas)

El más denso. Tres cosas técnicas pero todas necesarias para que el cliente vea SU municipio precargado con confianza.

```
TAREA: DIAGNÓSTICO INICIAL + TÍTULOS LEGIBLES + MARCA DE AGUA + BRECHAS DOCUMENTALES

Contexto: cuando un funcionario se registra desde dominio institucional,
la plataforma debe precargar datos de SU municipio desde fuentes públicas
en menos de 15 minutos y registrar las brechas documentales que impiden
cerrar módulos. Mientras tanto, cada módulo debe mostrar título humano
(no "M08"). Cada página debe llevar marca de agua honesta mientras los
datos están en estado preliminar.

ANTES DE TOCAR NADA:
1. Branch feature/hermes-titulos-marcaagua desde feature/landing-narrativa
2. API key de Perplexity activa (PERPLEXITY_API_KEY en .env.local y Vercel)
3. Para esta primera versión, el motor de diagnóstico es minimalista.
   Si algo falla, degrada graceful: carga lo que pueda, registra
   `document_gaps` y marca el resto como pendiente o brecha crítica.

ACCIONES CONCRETAS EN ORDEN:

PASO 1 · Crea /lib/module_titles.ts con mapeo completo.

export const MODULE_TITLES = {
  // Plataforma 1 · Validación
  M00:  { title: "Cómo leer este diagnóstico", subtitle: "Guía de navegación" },
  M00B: { title: "Antecedentes de tu municipio", subtitle: "Contexto institucional" },
  M01:  { title: "Diagnóstico de residuos sólidos", subtitle: "Línea base · M01" },
  M02:  { title: "Mapa social y de decisión", subtitle: "Actores, autoridad, ciudadanía · M02" },
  M03:  { title: "Capacidad institucional", subtitle: "Marco normativo y cobertura · M03" },
  M03B: { title: "Reforma reglamentaria propuesta", subtitle: "Tres artículos faltantes · M03B" },
  M04:  { title: "Costo de no actuar", subtitle: "Impacto financiero acumulado · M04" },
  M13:  { title: "Escenarios financieros", subtitle: "TIR · VPN · Monte Carlo · M13" },
  M14:  { title: "Riesgos del programa", subtitle: "ISO 31000 · M14" },
  M15:  { title: "Borrador de expediente", subtitle: "Documento de soporte · M15" },

  // Plataforma 2 · Planeación
  M05:  { title: "Plan maestro de implementación", subtitle: "Cronograma y ruta crítica · M05" },
  M06:  { title: "Infraestructura propuesta", subtitle: "Centros de acopio · M06" },
  M07:  { title: "Estructura operativa", subtitle: "Organigrama y turnos · M07" },
  M08:  { title: "Operación piloto", subtitle: "Rutas y comunicación · M08" },
  M09:  { title: "Presupuesto del programa", subtitle: "CAPEX y OPEX · M09" },
  M10:  { title: "Mercado de materiales", subtitle: "Recicladoras y compradores · M10" },
  M11:  { title: "Estructura financiera", subtitle: "Concesión y financiamiento · M11" },

  // Plataforma 3 · Ejecución
  M16:  { title: "Inspección y cumplimiento", subtitle: "Enforcement · M16" },
  M17:  { title: "Avance real vs plan", subtitle: "Monitoreo mensual · M17" },
  M18:  { title: "Reporte ESG", subtitle: "Doble materialidad · M18" },
  M19:  { title: "Trazabilidad de cifras", subtitle: "Origen de cada dato · M19" },
  M20:  { title: "Control presupuestal", subtitle: "EVM · M20" },
  M21:  { title: "Tablero de riesgos y gates", subtitle: "Estado del programa · M21" },
}

PASO 2 · Reemplaza referencias visibles a códigos M0X en todo el código.
  grep -r "M0[0-9]\|M1[0-9]\|M2[0-9]" --include="*.tsx" src/

Cada lugar donde aparece código como título visible:
  <h1>{MODULE_TITLES[moduleId].title}</h1>
  <span className="text-sm text-text-tertiary">
    {MODULE_TITLES[moduleId].subtitle}
  </span>

Sidebar:
  Cómo leer este diagnóstico       (en gris pequeño debajo o tooltip: M00)
  Antecedentes de tu municipio     (M00B)
  ...

PASO 3 · Crea componente <Watermark />.
/components/watermark.tsx:

import { auth } from '@clerk/nextjs/server'

export async function Watermark() {
  const { sessionClaims } = await auth()
  const tenantStatus = sessionClaims?.publicMetadata?.tenantStatus

  // Marca de agua solo si el diagnóstico está en estado preliminar
  if (tenantStatus !== 'preliminary') return null

  const version = sessionClaims?.publicMetadata?.diagnosticVersion || '1'
  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 select-none"
      style={{
        background: `
          repeating-linear-gradient(
            -30deg,
            transparent,
            transparent 200px,
            rgba(0,0,0,0.025) 200px,
            rgba(0,0,0,0.025) 400px
          )
        `,
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-30">
        <div className="text-center text-text-tertiary text-xs uppercase tracking-widest opacity-20 font-mono">
          ALQUIMIA · Diagnóstico inicial · Versión {version} · {today}
        </div>
      </div>
    </div>
  )
}

Inclúyelo en los layouts de /v, /p, /e.
Cuando el cliente firma contrato (tenantStatus pasa a "official"),
la marca de agua desaparece automáticamente.

PASO 4 · Endpoint /api/diagnostic/start.

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { inngest } from '@/lib/inngest'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { tenantId, municipio, estado, inegiClave } = await req.json()

  // Dispara pipeline asíncrono via Inngest
  await inngest.send({
    name: 'diagnostic/start',
    data: { tenantId, municipio, estado, inegiClave, requestedBy: userId }
  })

  return NextResponse.json({ status: 'started', tenantId })
}

PASO 5 · Función del pipeline de diagnóstico inicial.

import { inngest } from '@/lib/inngest'

export const initialDiagnostic = inngest.createFunction(
  { id: 'initial-diagnostic', name: 'Initial Diagnostic' },
  { event: 'diagnostic/start' },
  async ({ event, step }) => {
    const { tenantId, municipio, estado, inegiClave } = event.data

    // Paralelo: fuentes oficiales (alta confianza)
    const [inegiData, ineData, pntData] = await Promise.all([
      step.run('fetch-inegi', () => fetchINEGI(inegiClave)),
      step.run('fetch-ine', () => fetchINEElectoral(municipio, estado)),
      step.run('fetch-pnt', () => fetchPNT(municipio)),
    ])

    await step.run('save-base-profile', () =>
      saveTenantData(tenantId, {
        poblacion: inegiData.poblacion,
        viviendas: inegiData.viviendas,
        agebs: inegiData.agebs,
        presidente: ineData.presidente,
        cabildo: ineData.cabildo,
        organigrama: pntData.organigrama,
        confidence: 'verified_official',
      })
    )

    // Secundario: Periódico Oficial estatal (puede fallar)
    try {
      const reglamento = await step.run('fetch-periodico-oficial', () =>
        fetchPeriodicoOficial(estado, 'reglamento limpia')
      )
      await step.run('save-reglamento', () =>
        saveTenantData(tenantId, { reglamento, confidence: 'verified_secondary' })
      )
    } catch (e) {
      await step.run('mark-reglamento-pending', () =>
        createDocumentGap(tenantId, {
          module_id: 'marco_legal',
          document_type: 'reglamento_limpia',
          reason: 'No se localizó reglamento vigente en fuente pública accesible.',
          detection_method: 'initial_inference',
          priority: 'critical'
        })
      )
    }

    // Inferencia con benchmarks (media confianza)
    await step.run('infer-baseline-rsu', () => {
      const generacionPerCapita = inferGeneracionPerCapita(
        inegiData.poblacion,
        estado
      )
      const composicion = inferComposicion(estado)
      const costoOmision = calculateCostoOmision(
        inegiData.poblacion,
        generacionPerCapita
      )
      return saveTenantData(tenantId, {
        generacion_per_capita: { value: generacionPerCapita, confidence: 'inferred_medium' },
        composicion: { value: composicion, confidence: 'inferred_medium' },
        costo_omision: { value: costoOmision, confidence: 'inferred_medium' },
      })
    })

    // Marca tenant como listo
    await step.run('mark-tenant-ready', () =>
      updateTenantStatus(tenantId, 'preliminary_ready')
    )

    // Envía email al usuario
    await step.run('send-ready-email', () =>
      sendDiagnosticReadyEmail(tenantId)
    )
  }
)

NOTA: las funciones fetchINEGI, fetchINE, fetchPNT, fetchPeriodicoOficial,
inferGeneracionPerCapita, etc., son stubs que retornan datos hardcodeados
realistas para este MVP. La inferencia real se construye después.

Para MVP, usar:
  - inegiData = mock con población real de la API pública de INEGI
  - ineData = mock para SLP, Querétaro y 3-5 municipios más
  - pntData = mock genérico
  - reglamento = mock o null
  - document_gaps = brechas para reglamento, presupuesto, organigrama,
    plan municipal, cuenta pública, padrón o acuerdo si faltan fuentes

El objetivo del MVP es que el FLUJO funcione end-to-end. La inferencia
real se itera después.

PASO 6 · Pantalla "diagnóstico listo".
Cuando inference termina, usuario recibe email con magic link a /v.
Al entrar a /v primera vez:
  - Pantalla de bienvenida con su municipio nombrado
  - Banner sage: "Diagnóstico inicial preparado · algunos datos requieren validación"
  - Sidebar con módulos de Validación
  - Watermark activa

PASO 7 · Brecha documental visible por módulo.
Cuando un módulo tenga `document_gaps.status = pending`, muestra banner:

Título:
  Documento pendiente para completar este módulo

Texto:
  La plataforma no pudo acceder a [tipo de documento]. Si tu municipio
  lo tiene, súbelo aquí para mejorar la trazabilidad del diagnóstico.
  Si no aplica, puedes marcarlo como no aplicable.

Botones:
  - Subir documento
  - Marcar como no aplica

No usar nombres internos de agentes. No decir que la plataforma validó
el documento. El módulo permanece visible y conserva brecha crítica.

CRITERIO BINARIO DE CIERRE:
1. Cero módulos muestran "M0X" como título principal
2. Cada módulo tiene título humano + código M0X como subtítulo discreto
3. Sidebar muestra títulos humanos primero
4. Watermark visible en cada página cuando tenantStatus = preliminary
5. Watermark desaparece cuando tenantStatus = official
6. /api/diagnostic/start inicia preparación de diagnóstico
7. Pipeline completa para municipio mock en <15 min
8. Email de "diagnóstico listo" llega al usuario
9. Magic link entra a /v con su municipio precargado
10. Cifras precargadas tienen sello de confianza visible
11. Faltantes crean `document_gaps` por tenant/módulo
12. Módulo con brecha documental muestra banner y no se oculta
13. Opción "no aplica" conserva trazabilidad sin borrar el gap

LO QUE NO DEBES HACER:
- No construyas integración real con APIs gubernamentales en este prompt
  (eso es trabajo de mes 2-3, no de MVP)
- No bloquees al usuario si una fuente falla (degradación graceful)
- No expongas PERPLEXITY_API_KEY al cliente
- No uses nombres internos de agentes en UI cliente-facing
- No conviertas documento faltante en claim ni ocultes el módulo
- No olvides el caso donde el usuario entra antes de que termine
  HERMES (mostrar pantalla "todavía preparando")

REPORTE FINAL:
- Screenshots de cada módulo con título legible
- Screenshot de la marca de agua en una página
- Screenshot del sidebar nuevo
- Screenshot del email de diagnóstico listo
- Log de Inngest mostrando pipeline completando
- Confirmación de los 10 criterios
```

**Verificación antes de pasar al Prompt 5:** Regístrate con email institucional. Espera 15 min. Recibe email. Entra. Debes ver: tu municipio nombrado, watermark, módulos con títulos humanos, sidebar legible.

---

## Prompt 5 · Personalización por tenant + ZIP exportable + upload documental mínimo (4-5 horas)

Último prompt. Cierra el círculo del MVP comercial.

```
TAREA: PERSONALIZACIÓN POR TENANT + EXPORTACIÓN A ZIP CON CONTRASEÑA + DOCUMENTOS RECIBIDOS

Contexto: el usuario ya entró y ve su municipio precargado con marca
de agua. Falta dos cosas para cerrar MVP: (1) que los módulos
muestren cifras del tenant correcto, no de SLP hardcodeado, (2) que
el usuario pueda exportar su diagnóstico preliminar a ZIP con contraseña,
(3) que pueda subir documentos mínimos para cerrar brechas documentales
sin que eso los convierta automáticamente en datos validados.

ANTES DE TOCAR NADA:
1. Branch feature/personalization-export desde feature/hermes-titulos-marcaagua
2. Verifica que tenants se crean correctamente en Clerk con publicMetadata
3. Asegúrate que la tabla tenant_data en Postgres está poblada

ACCIONES CONCRETAS EN ORDEN:

PASO 1 · Hook useTenantData() para todos los módulos.

/hooks/use-tenant-data.ts:

'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export function useTenantData() {
  const { user } = useUser()
  const tenantId = user?.publicMetadata?.tenantId as string | undefined
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenants/${tenantId}/data`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [tenantId])

  return { data, loading, tenantId }
}

PASO 2 · Endpoint /api/tenants/[id]/data.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_, { params }) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const tenantIdFromUser = sessionClaims?.publicMetadata?.tenantId
  if (params.id !== tenantIdFromUser && sessionClaims?.publicMetadata?.role !== 'founder') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const data = await db.tenant_data.findFirst({ where: { tenant_id: params.id } })
  return NextResponse.json(data)
}

La respuesta debe incluir:
  - document_gaps
  - tenant_documents
  - document_index con mismo número de documentos por ciudad
  - estado documental por módulo

PASO 3 · Refactor de cada módulo pilar para consumir useTenantData.

Hoy los módulos M01, M04, M13, M14 tienen cifras hardcodeadas de SLP.
Refactorízalos:

// Antes:
const poblacion = 824229  // SLP capital hardcoded

// Después:
const { data, loading } = useTenantData()
if (loading) return <ModuleSkeleton />
const poblacion = data?.poblacion ?? 0

Cada cifra debe poder marcar su confidence:
  <Metric
    value={data.generacion_per_capita.value}
    confidence={data.generacion_per_capita.confidence}
    label="Generación per cápita"
    unit="kg/día"
  />

Componente <Metric /> muestra:
  - El número grande
  - Unit pequeño abajo
  - Pill de confidence al lado:
    "Verificado oficial" (verde)
    "Inferido" (amarillo)
    "Pendiente validación" (naranja)

PASO 4 · Endpoint /api/tenants/[id]/export-zip.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import archiver from 'archiver'
import { generateRandomPassword } from '@/lib/passwords'
import { generatePDFsForTenant } from '@/lib/pdf-generator'
import { sendEmailWithPassword } from '@/lib/email'

export async function POST(_, { params }) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const tenantId = params.id

  // Genera contraseña random fuerte
  const password = generateRandomPassword(16)

  // Genera PDFs de los módulos con watermark embedded
  const pdfs = await generatePDFsForTenant(tenantId, { watermark: true })

  // Empaqueta en ZIP encriptado
  const zipBuffer = await createEncryptedZip(pdfs, password)

  // Sube ZIP a almacenamiento (S3 o equivalente) con URL temporal 7 días
  const zipUrl = await uploadToStorage(zipBuffer, `diagnostico-${tenantId}.zip`)

  // Envía email al usuario con link al ZIP
  await sendEmail({
    to: userEmail,
    subject: 'Tu diagnóstico Alquimia · ZIP descargable',
    body: 'Tu diagnóstico preliminar está listo para descargar. Link válido 7 días: ' + zipUrl,
  })

  // Envía email SEPARADO al usuario con la contraseña
  await sendEmail({
    to: userEmail,
    subject: 'Contraseña para tu diagnóstico Alquimia',
    body: 'La contraseña de tu ZIP es: ' + password + '. Por seguridad, NO compartas este correo.',
    delaySeconds: 60, // Envía 1 min después del primero
  })

  // Notifica al founder
  await notifyFounder({
    type: 'zip_exported',
    tenantId,
    userId,
  })

  return NextResponse.json({ status: 'sent', zipUrl })
}

PASO 5 · Botón "Descargar diagnóstico" en /v.

En el header de /v, agrega botón discreto:
  "Descargar diagnóstico (ZIP)"

Al click:
  1. Modal de confirmación: "Generaremos un ZIP encriptado con tu
     diagnóstico completo. Te enviamos el link por email y la
     contraseña por separado. ¿Continuar?"
  2. Submit dispara /api/tenants/[id]/export-zip
  3. Pantalla de confirmación: "Listo. Revisa tu correo en 2 minutos."

Límite: máximo 3 exportaciones por mes por tenant en estado preliminary.
Después de firmar contrato, ilimitado.

PASO 6 · Upload documental mínimo.

Crea:
  - tabla/modelo `document_gaps`
  - tabla/modelo `tenant_documents`
  - endpoint `/api/tenants/[id]/documents/upload`
  - endpoint `/api/tenants/[id]/document-gaps/[gapId]/not-applicable`

Validaciones obligatorias:
  - PDF, DOCX, XLSX, JPG, PNG solamente
  - tamaño máximo 25 MB
  - tenant ownership; bloquear cross-tenant
  - rechazo explícito si falla
  - no ejecutar archivos ni procesar macros

El upload debe registrar:
  - tenant_id
  - uploaded_by_user_id
  - module_id
  - document_type
  - original_filename
  - mime_type
  - file_size_bytes
  - storage_path/url
  - upload_status
  - classification_confidence
  - uploaded_at
  - processed_at nullable

El cliente ve:
  - documento recibido
  - pendiente de validación
  - módulo afectado
  - responsable humano

Advertencia obligatoria:
  Subir un documento no lo convierte automáticamente en dato validado.
  La información extraída requiere revisión humana.

PASO 7 · El momento de conversión.
Modificación al /v: después de que el usuario haya estado activo
en la plataforma >5 minutos (medible con analytics simple), aparece
slide-in suave desde la derecha:

  "Has visto tu diagnóstico inicial. El siguiente paso es validarlo
   con el equipo Alquimia y prepararlo para presentar a tu municipio.
   Toma de cuatro a ocho semanas y comenzamos esta semana.

   [Sí, agendar conversación]   [Seguir explorando]"

Click en "Sí, agendar conversación":
  - Modal con datos del usuario ya prellenados
  - Campo "Mejor horario para llamar" (dropdown)
  - Submit envía email al founder con info del lead
  - Confirma al usuario: "Recibido. Te contactamos en menos de 24h hábiles"

Click en "Seguir explorando":
  - Cierra slide-in
  - Reaparece 5 min después o al navegar a otro módulo

PASO 8 · Pantalla /pendiente-validacion.
Para usuarios que entraron por dominio genérico (gmail) y esperan
aprobación manual del founder:

"Hola [Nombre],

Recibimos tu solicitud para [Municipio]. Como tu correo no es
institucional, necesitamos confirmar tu rol antes de generar el
diagnóstico.

Agenda una llamada breve con el equipo Alquimia para validar:
[Botón: Agendar llamada · Calendly]

O contáctanos directamente:
[Email del founder]"

CRITERIO BINARIO DE CIERRE:
1. Módulos pilar (M01, M04, M13, M14) muestran datos del tenant correcto
2. Cifras llevan pill de confidence visible
3. Botón "Descargar diagnóstico" funciona y genera ZIP
4. Email con link ZIP llega al usuario
5. Email con contraseña llega 60s después
6. ZIP está realmente encriptado (no abre sin contraseña)
7. ZIP contiene PDFs con watermark embedded
8. Slide-in de conversión aparece después de 5 min de actividad
9. Submit de "Agendar conversación" envía email al founder
10. /pendiente-validacion existe para usuarios gmail
11. Founder puede aprobar manualmente desde Plataforma 0 (botón simple)
12. Aprobación manual inicia diagnóstico y notifica al usuario
13. Upload acepta documento válido y lo asocia al tenant/módulo
14. Upload rechaza tipo no permitido y archivo demasiado grande
15. Opción "no aplica" oculta solicitud sin borrar trazabilidad
16. ZIP refleja estado documental: pendiente, recibido, no aplica o brecha crítica

LO QUE NO DEBES HACER:
- No exportes ZIPs sin watermark embedded en los PDFs
- No envíes link y contraseña en el mismo email (riesgo de seguridad)
- No permitas exportar más de 3 ZIPs por mes en estado preliminary
- No olvides el caso de gmail pendiente de validación
- No conviertas documento subido en dato validado sin revisión humana
- No uses nombres internos de agentes en UI, email, ZIP o reportes cliente-facing

REPORTE FINAL:
- Screenshots del flujo completo:
  /comenzar → /preparando → email → /v personalizado → exportar ZIP
- Confirmación 12 criterios
- Email de prueba con ZIP funcional
- ZIP descargado y abierto correctamente con contraseña

```

**Verificación final del MVP:** Pasa el link de alquimiaplatform.com a un funcionario público real (puede ser conocido tuyo). Debe poder:

1. Entender qué es Alquimia en la landing
2. Registrarse con su correo institucional
3. Recibir email de "preparando"
4. Recibir email de "listo" en 15 min
5. Entrar y ver SU municipio precargado con watermark
6. Navegar los módulos con títulos humanos
7. Ver el slide-in de conversión
8. Exportar su diagnóstico a ZIP

Si los 8 pasos funcionan en su flujo real, tienes MVP comercial listo.

---

## Lo que NO se construye en esta secuencia (deliberadamente)

1. Plataforma 0 backoffice completa. Founder maneja tenants con Clerk dashboard + scripts. Plataforma 0 viene después.
2. Pipeline HERMES con APIs reales gubernamentales. Mock data para MVP. APIs reales en mes 2-3.
3. NOUS agente de aprendizaje. Espera 3+ clientes operando.
4. Stripe + Facturapi + Mifiel. Billing manual hasta tener tres contratos firmados.
5. Consolidación M02/M03/M05/M08 a pestañas. Se quedan separados temporalmente, solo títulos nuevos. Fusión real en semanas 9-12.
6. Las plataformas /p y /e funcionales. MVP solo necesita /v funcional con conversión. /p y /e quedan accesibles con módulos mock.
7. Pago con QR o transferencia. Conversión hoy es "agenda llamada", no checkout directo.

Esto es deliberado. El MVP existe para conseguir los primeros tres contratos. Cada feature adicional retrasa la primera venta.

---

## Cronograma realista

| Día | Prompt | Esfuerzo Codex | Verificación founder |
|---|---|---|---|
| Día 1 mañana | Prompt 1 · Limpieza | 4-6 horas | 30 min |
| Día 1 tarde + Día 2 mañana | Prompt 2 · Clerk + filtro institucional | 4-6 horas | 30 min |
| Día 2 tarde | Prompt 3 · Landing nueva | 4-6 horas | 30 min |
| Día 3 mañana + tarde | Prompt 4 · HERMES + títulos + watermark | 5-7 horas | 1 hora |
| Día 4 mañana | Prompt 5 · Personalización + ZIP | 4-5 horas | 1 hora recorrido completo |

Total: 4 días si todo va bien. Hasta 7 si hay problema serio.

---

## Tres principios sostienen este MVP

**Uno.** El cliente ve SU propio municipio desde el primer login. No hay vista demo. Esto es radicalmente más vendible que cualquier showcase de SLP.

**Dos.** La fricción está concentrada en el registro (filtro institucional) y al final (conversación humana). En medio, el cliente ve valor personalizado sin interrupciones.

**Tres.** La marca de agua es honestidad operacional. El cliente sabe exactamente qué es preliminar y qué se convierte en oficial cuando firma. Eso construye confianza, no la destruye.

---

## Lo que NO recomiendo aunque te tiente

- No agregues video hero al landing (carga lenta, fricción mobile)
- No abras chat widget público (no tienes equipo de soporte para responder)
- No publiques precios en la landing (eso pertenece a la conversación humana)
- No agregues testimoniales falsos (gobierno detecta esto)
- No prometas tiempos imposibles (cuatro a ocho semanas es real, dos no lo es)

---

*MVP CLOSURE V2 · Alquimia · 29 mayo 2026 · Founder gate firmado*
