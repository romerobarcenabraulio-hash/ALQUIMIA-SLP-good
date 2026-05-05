# 17.1 · Publicación y Control de Acceso (Vercel + Railway/Supabase)

Objetivo: desplegar ALQUIMIA con control de acceso trazable, manteniendo Vercel para frontend y Railway/Supabase para backend/DB/Auth.

## Stack y dominios
- Dominio oficial: configurar DNS (A/AAAA o CNAME) para dominio .mx o .gob.mx apuntando a Vercel. Subdominio `api.` para backend en Railway/Supabase (custom domain) con TLS.
- Frontend: Next.js en Vercel, uso de `output: export` solo para auditorías; producción con `next start`/SSR cuando aplique. Variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Backend: FastAPI en Railway (o Supabase functions) con DB Postgres (Supabase) o Railway Postgres. Env: `DATABASE_URL`, `ALQUIMIA_SECRET_KEY`, `SUPABASE_JWT_SECRET` (si aplica).
- Storage/logs: Supabase storage para adjuntos; Railway logs y alertas básicas.

## Auth y control de acceso
- Supabase Auth (email magic link / contraseña) para registro/login institucional y trazabilidad.
- Registro de actividad: tabla `access_logs` (user_id, email, ip_hash, user_agent, path, verb, at, payload_hash). Registrar: login, entrada a `/simulator`, submit de simulaciones.
- Middleware frontend: proteger rutas `/simulator`, `/ca-studio`, `/hub` verificando sesión Supabase; mostrar landing de acceso si no autenticado. Adjuntar correlación de sesión en cada fetch.
- Backend: middleware que valide JWT de Supabase en endpoints sensibles; health público (`/health`), resto autenticado. Loggear user_id/email en cada request y guardar actividad mínima en DB.

## UX de acceso (carta de presentación)
- Landing de entrada con hero claro: “Plataforma de consultoría en circularidad municipal”.
- CTA dual: “Explorar demo guiada” (sin datos reales) y “Acceder con cuenta institucional”.
- Panel de beneficios y trazabilidad (qué se registra, qué no es oficial), tono de consultoría senior, visual limpio con badges de oficialidad. Mostrar aviso de registro de actividad y privacidad.

## Flujo de entrega
- Definir `.env.example` con claves Supabase/Vercel/Railway.
- Scripts: `vercel deploy` para frontend; `railway up` o CI para backend. Chequear `tsc --noEmit` y `pytest` antes de deploy.
- Monitoreo mínimo: health checks Vercel/ Railway; logs y alertas en Supabase/ Railway.

## Criterios de aceptación
- DNS configurado y documentado (registros propuestos).
- Supabase Auth operativo; rutas protegidas en frontend y backend.
- Landing de acceso implementada con estética de consultoría (jerarquía, badges, ayuda breve).
- Pipelines de despliegue documentados en la bitácora; sin romper entorno dev.
