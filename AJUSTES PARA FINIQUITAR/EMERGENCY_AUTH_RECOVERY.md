# EMERGENCY AUTH RECOVERY · Prompt de ejecución inmediata para Codex

**Estado:** Crítico · Founder no puede acceder a la plataforma
**Fecha:** 29 mayo 2026
**Objetivo:** Restaurar acceso del founder en 30-60 minutos
**No es:** documento arquitectónico · No agregar features · No expandir scope

---

## Contexto operativo que el agente debe entender

El founder configuró Clerk dashboard correctamente: SMS desactivado, magic link habilitado, TOTP habilitado, backup codes habilitados. La tabla de Users en Clerk está vacía. El frontend todavía tiene código residual de Twilio que está rompiendo el flujo de login. Founder no puede ingresar a su propia plataforma para probar.

Twilio ya no opera. SMS-MFA queda descartado permanentemente por incompatibilidad con números mexicanos. Se reemplaza por magic link + TOTP + backup codes.

Este prompt restaura el acceso. Sin agregar features. Sin tocar nada fuera del flujo de autenticación.

---

## Reglas inviolables de este prompt

1. NO agregues features nuevas.
2. NO toques módulos del simulador (M01, M04, M13, M14, etc.).
3. NO cambies copy ni narrativa.
4. NO instales librerías nuevas excepto las que este prompt menciona.
5. Verifica cada paso antes de pasar al siguiente.
6. Si algo falla, repórtalo al founder antes de improvisar.

---

## Paso 1 · Verificar configuración de Clerk

Entra a clerk.com dashboard. Confirma que:

```
User & Authentication > Email, Phone, Username:
- Email address: ENABLED (como identifier)
- Phone number: DISABLED
- Username: DISABLED
- Verification methods email: "Email verification code" o "Email verification link" enabled

User & Authentication > Authentication strategies:
- Email verification code: ENABLED
- Password: DISABLED
- Phone number: DISABLED (todo lo relacionado con phone OFF)

User & Authentication > Multi-factor:
- Authenticator app (TOTP): ENABLED
- Backup codes: ENABLED
- SMS code: DISABLED

Customization > Emails:
- From email: confirmar que está configurado (default Clerk noreply@clerk.dev o
  custom verified domain)
- Si tienes custom domain: verificar que aparece "Verified" en verde
- Si NO está verified: usar el default de Clerk noreply@clerk.dev temporalmente
```

**Criterio binario:** todos los toggles arriba en estado correcto. Reporta screenshot.

---

## Paso 2 · Crear cuenta founder manualmente en Clerk

En clerk.com dashboard, Users, click "Create user":

```
Email: demo@alquimiaplatform.com
Password: (dejar vacío, no usar password)
First name: Founder
Last name: Alquimia

Public metadata (JSON):
{
  "role": "founder",
  "has_admin_access": true,
  "has_sandbox_tenant": true,
  "bypass_payment_gates": true,
  "tenant_status": "official"
}

Private metadata: {}
```

Click "Create." Confirma que el usuario aparece en la lista de Users.

**Criterio binario:** usuario demo@alquimiaplatform.com visible en lista de Users de Clerk dashboard.

---

## Paso 3 · Limpieza quirúrgica de código residual de Twilio

```bash
cd /Users/braulioromerobarcena/Documents/alquimia-slp
git checkout -b emergency/clerk-recovery
```

Busca todo código residual de Twilio:

```bash
grep -r "twilio\|TWILIO" --include="*.ts" --include="*.tsx" --include="*.js" src/
grep -r "phoneNumber\|phone_number" --include="*.ts" --include="*.tsx" src/
grep -r "sms\|SMS\|verifyPhone\|sendOtp" --include="*.ts" --include="*.tsx" src/
```

Para cada match encontrado:
- Si el archivo es del flujo de login/registro/MFA: COMENTAR la lógica, dejar el archivo
- Si el archivo es de notificaciones operativas (alertas, etc.): dejar pendiente para después
- NO eliminar archivos en este paso

Marcar cada comentario con: `// REMOVED_TWILIO_29MAY2026 - reemplazado por Clerk magic link`

**Criterio binario:** ningún código activo (sin comentar) llama a Twilio durante login/registro.

---

## Paso 4 · Reemplazar página de login con Clerk SignIn nativo

Archivo `/app/sign-in/[[...sign-in]]/page.tsx` o equivalente:

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-text-primary">ALQUIMIA</h1>
          <p className="text-sm text-text-secondary mt-2">
            Acceso a tu diagnóstico municipal
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              card: "shadow-none border border-border-subtle",
              formButtonPrimary: "bg-accent-primary hover:bg-accent-primary-hover",
            }
          }}
          afterSignInUrl="/v"
        />
      </div>
    </div>
  )
}
```

Asegúrate que `app/layout.tsx` tiene `<ClerkProvider>`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**Criterio binario:** /sign-in carga la UI de Clerk con branding ALQUIMIA en el header.

---

## Paso 5 · Middleware mínimo funcional

Archivo `/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/comenzar(.*)',
  '/metodologia(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return
  
  const { userId } = await auth()
  if (!userId) {
    return Response.redirect(new URL('/sign-in', req.url))
  }
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
```

NO agregar lógica compleja de routing por current_stage en este paso. Eso viene después. Ahora solo: si no autenticado → /sign-in.

**Criterio binario:** navegar a /v sin sesión redirige a /sign-in.

---

## Paso 6 · Variables de entorno

Verificar `.env.local` Y Vercel Environment Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... o pk_live_...
CLERK_SECRET_KEY=sk_test_... o sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/v
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/v
```

CRÍTICO: estas variables deben existir tanto en `.env.local` como en Vercel. Si solo están en local, producción no funciona.

**Criterio binario:** las seis variables presentes en ambos lugares.

---

## Paso 7 · Deploy y test end-to-end

```bash
git add .
git commit -m "fix(auth): emergency Clerk recovery, remove Twilio residue"
git push origin emergency/clerk-recovery
```

Merge a main si todo verifica, o deploy preview en Vercel para test.

Una vez en producción o preview:

1. Founder abre alquimiaplatform.com/sign-in en Chrome incognito
2. Captura email: demo@alquimiaplatform.com
3. Click "Sign in" o "Continue"
4. Clerk envía verification code o magic link al email
5. Founder revisa inbox de demo@alquimiaplatform.com (Gmail o donde sea)
6. Aplica código o click link
7. Redirige a /v

**Criterio binario:** founder entra a /v sin errores y ve la plataforma.

---

## Paso 8 · Si magic link/code no llega al email

Tres posibles causas, diagnóstico en orden:

**Causa A · Email en spam o promociones.**
Buscar en gmail: `from:noreply@clerk.dev OR from:clerk`. Si está en spam, marcar como "no spam." Si está en promociones, mover a primary.

**Causa B · Dominio de envío Clerk no responde.**
En clerk.com dashboard, Logs (o Events según versión), ver si el evento "email.created" o "verification.sent" aparece para el intento. Si NO aparece, el problema está antes del envío (configuración incorrecta). Si SÍ aparece pero email no llega, el problema es entrega.

**Causa C · Domain authentication issue.**
Si tienes custom domain configurado (no default Clerk), verificar DNS records SPF/DKIM en clerk.com dashboard, Customization, Emails. Si aparecen errores, copiar los registros correctos y agregarlos al panel DNS del registrador de alquimiaplatform.com.

**Si después de 30 minutos no se resuelve:** detener trabajo, reportar al founder con screenshots de:
- Clerk dashboard configuración
- Logs/Events de Clerk
- Inbox del email destino (incluyendo spam)

---

## Lo que este prompt NO hace deliberadamente

- NO implementa filtro institucional de dominios .gob.mx (Prompt 2 completo del MVP_CLOSURE_V2).
- NO implementa flujo /comenzar de registro custom.
- NO toca pipeline HERMES.
- NO toca módulos del simulador.
- NO toca narrativa de landing.

Esto es recuperación de acceso. Lo demás se construye después.

---

## Criterio de éxito de este prompt

1. Founder puede entrar a alquimiaplatform.com con demo@alquimiaplatform.com
2. Recibe magic link en email demo@alquimiaplatform.com (o donde redirija ese email)
3. Click en link entra a /v
4. Founder ve la plataforma sin errores
5. Puede navegar entre módulos del simulador
6. Puede activar TOTP desde perfil de Clerk si quiere

Una vez los seis criterios se cumplen, este prompt cierra. El siguiente paso es regresar al MVP_CLOSURE_V2 Prompt 2 completo (filtro institucional + flujo /comenzar) en otra sesión.

---

## Tiempo estimado

| Paso | Tiempo |
|---|---|
| 1 · Verificar Clerk dashboard | 5 min |
| 2 · Crear cuenta founder | 3 min |
| 3 · Limpieza Twilio | 15-20 min |
| 4 · Reemplazar /sign-in | 10 min |
| 5 · Middleware mínimo | 5 min |
| 6 · Variables de entorno | 5 min |
| 7 · Deploy y test | 10 min |
| 8 · Debug si email no llega | 0-30 min |

Total: 50-90 minutos en condiciones normales. Hasta 2 horas si hay problema con dominio de email.

---

*EMERGENCY AUTH RECOVERY · Alquimia · 29 mayo 2026 · Prioridad inmediata*
