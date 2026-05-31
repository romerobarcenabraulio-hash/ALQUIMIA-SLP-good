# MVP V2 Deploy Checklist

Fecha: 2026-05-31

Alcance: verificación local/founder-ready. Producción externa no pudo verificarse desde este entorno; queda marcada como pendiente, no como aprobada.

| Variable/config | Requerida | Presente local | Presente producción | Riesgo | Bloqueo | Acción requerida |
| --- | --- | --- | --- | --- | --- | --- |
| Framework frontend | Sí | PASS: Next.js 16 en `frontend/package.json` | No verificable | Bajo | No | Configurar Vercel/hosting con root `frontend`. |
| Build command | Sí | PASS: `npm run build` | No verificable | Bajo | No | Usar `npm run build`. |
| Start command | Sí | PASS: `npm run start -- --port 3000` | No verificable | Bajo | No | Usar runtime compatible Next. |
| Output directory | Sí | PASS: `.next` generado por build | No verificable | Bajo | No | No versionar `.next`. |
| Backend | Sí | PASS: FastAPI/uvicorn en `backend/app/main.py` | No verificable | Medio | No para local | Desplegar backend en Render/Railway/Fly u otro. |
| `NEXT_PUBLIC_API_URL` | Sí | Ausente en `frontend/.env.local`; fallback dev a `http://localhost:8000` | No verificable | Alto en producción | Sí para producción | Definir URL backend pública antes de deploy. |
| `SECRET_KEY` | Sí | Configurado solo para smoke local, no impreso | No verificable | Alto | Sí para producción | Configurar secreto fuerte en backend. |
| `DATABASE_URL` | Sí | SQLite local de smoke; Postgres en example | No verificable | Alto | Sí para producción | Provisionar Postgres y ejecutar migraciones. |
| Email provider | Sí | `EMAIL_PROVIDER=console` documentado | No verificable | Medio | Sí para producción real | Configurar Resend u otro proveedor. |
| SMS/TOTP | TOTP sí; SMS según flujo | SMS console/TOTP verificado por API | No verificable | Medio | No para demo local | Configurar Twilio solo si se requiere SMS real. |
| Storage documentos | Sí para producción | MVP memory/local | No verificable | Alto | Sí para producción documental | Provisionar storage persistente y retención. |
| ZIP/export | Sí | PASS: ZIP local 9 archivos, watermark, límite 3 | No verificable | Medio | No para local | Persistir contador de exportaciones en DB para producción. |
| CORS | Sí | `ALLOWED_ORIGINS=http://localhost:3000` en example | No verificable | Alto | Sí para producción | Agregar dominio frontend real. |
| Rutas públicas/protegidas | Sí | Browser smoke PASS | No verificable | Medio | No | Repetir smoke en URL productiva. |
| Admin/founder secrets | Sí | No impresos | No verificable | Alto | Sí para producción | Definir admin/founder y rotación de secretos. |
| Perplexity/research | No para MVP RC | No requerido | No verificable | Bajo | No | Mantener desactivado si no hay presupuesto/gate. |

## Decisión

- Local/founder-ready: PASS.
- Producción externa: PENDING CONFIGURATION.

