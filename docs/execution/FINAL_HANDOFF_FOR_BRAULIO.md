# Final Handoff for Braulio

Fecha: 2026-05-31

## Qué se cerró

- MVP V2 completo para revisión founder/local.
- Auditoría maestra con `MASTER AUDIT: PASS`.
- ARCHIVO embebido y post-MVP con migración Alembic.
- Sistema visual público homogéneo.
- Guardrails de partners sin activación prematura.
- Defensibility roadmap founder-only.

## Qué quedó listo para usar

- Landing y metodología sobria.
- Registro/login local documentado.
- Rutas `/v`, `/p`, `/e`.
- Tres perfiles de ciudad con mismo índice documental.
- Export ZIP preliminar con marca de agua.
- Gaps documentales, upload mínimo y estado documental.

## Qué quedó solo documentado o condicionado

- Producción externa.
- Legal/compliance final.
- Billing/contracts.
- Programa de partners comercial.
- Defensibility real de 36 meses.

## Qué está bloqueado

- Storage persistente productivo.
- Email provider real.
- Seed founder/admin productivo.
- Revisión de abogado.
- Pricing/contratos.

## Qué no activar todavía

- Partners comerciales antes de 3 contratos directos.
- Claims de certificación o ahorro garantizado.
- Publicación externa de documentos como oficiales.
- OCR/LLM documental sin revisión humana.
- Producción externa sin configurar DB, storage, email, CORS y secretos.

## Cómo correr local

1. Backend: usar el procedimiento ya documentado en los runbooks MVP.
2. Frontend: desde `frontend/`, ejecutar comandos de desarrollo/build disponibles en `package.json`.
3. Para verificar migraciones: desde `backend/`, ejecutar `.venv/bin/alembic heads`.

## Cómo revisar MVP

- Abrir `/`, `/metodologia`, `/comenzar`, `/sign-in`.
- Revisar `/v`, `/p`, `/e`.
- Confirmar que no hay nombres internos de agentes visibles.

## Cómo revisar multi-ciudad

- Usar perfiles `complete-city`, `partial-city`, `gap-city`.
- Confirmar mismo índice, mismo número de documentos y brechas críticas visibles.

## Cómo revisar export ZIP

- Usar `/api/tenants/[id]/export-zip`.
- Confirmar watermark, índice, fuentes, confianza, brechas y límite preliminar.

## Cómo revisar ARCHIVO

- Revisar módulo con brecha documental.
- Subir archivo permitido.
- Probar rechazo de archivo no permitido.
- Probar `Marcar como no aplica`.
- Confirmar que documento recibido queda pendiente de validación humana.

## Cómo validar visual

- Revisar desktop y mobile.
- Confirmar que no hay texto pegado como documento crudo.
- Confirmar jerarquía sobria y brechas visibles.

## Cómo reportar bugs

Registrar:

- Ruta.
- Tenant/ciudad usada.
- Acción exacta.
- Resultado esperado.
- Resultado real.
- Screenshot o salida relevante.
- Severidad P0/P1/P2/P3.

## Próximo paso recomendado

Configurar entorno de staging con DB, storage, email provider, CORS y seed founder/admin; después correr smoke completo antes de declarar producción externa.
