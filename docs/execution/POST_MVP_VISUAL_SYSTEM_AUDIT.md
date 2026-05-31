# Post-MVP Sprint 3 · Auditoría de homogeneidad visual global

Fecha: 2026-05-31

## Gate previo

`docs/execution/POST_MVP_ARCHIVO_STATUS.md` termina en `POST-MVP ARCHIVO: PASS`.

## Correcciones aplicadas

- Se creó `frontend/src/components/public/PublicPageShell.tsx`.
- Se homogeneizaron header, ancho máximo, jerarquía de hero y CTA en:
  - `/`
  - `/metodologia`
  - `/comenzar`
  - `/preparando`
  - `/pendiente-validacion`
- Se mantuvo la plataforma `/v`, `/p`, `/e` sin rediseño masivo para evitar regresión.

## Auditoría

| Criterio | Evidencia | Estado |
| --- | --- | --- |
| Header público consistente | `PublicPageShell` usado en cinco rutas públicas | PASS |
| Conclusión primero, detalle después | `PublicHero` en landing/metodología; páginas de estado abren con tesis | PASS |
| Nada estimado se presenta como oficial | Copy preserva validación humana y brecha crítica | PASS |
| Sin nombres internos de agentes cliente-facing | Browser QA y HTML build sin términos internos en rutas públicas auditadas | PASS |
| No hay markdown crudo | HTML build contiene estructura semántica, no markdown pegado | PASS |
| No hay overflow horizontal evidente | Browser QA en rutas verificadas reportó `noHorizontalOverflow: true` | PASS |
| `/comenzar` no queda como documento pegado | Build estático contiene grid institucional y formulario contenido | PASS |

## Evidencia visual

Browser integrado verificó `/`, `/metodologia`, `/preparando`, `/pendiente-validacion` y `/v` en `localhost:3000`. La ruta `/comenzar` en ese servidor viejo mostró error de instancia stale; se reconstruyó con `npm run build` y el HTML generado en `.next/server/app/comenzar.html` contiene la página correcta sin error. El sandbox bloqueó navegación Browser a `127.0.0.1:3001`, por lo que la verificación final de `/comenzar` se hizo por build artifact.

Capturas:

- `/private/tmp/alquimia-sprint3-_.png`
- `/private/tmp/alquimia-sprint3-_metodologia.png`
- `/private/tmp/alquimia-sprint3-_preparando.png`
- `/private/tmp/alquimia-sprint3-_pendiente_validacion.png`
- `/private/tmp/alquimia-sprint3-_v_tenant_partial_city_module_city_baseline.png`

## Riesgos residuales

- La suite visual global de todos los módulos legacy del simulador sigue siendo amplia; Sprint 3 corrigió las superficies públicas y confirmó plataforma principal sin overflow evidente.
- Hay warnings legacy de lint no relacionados con este sprint.
