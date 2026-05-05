# 21 · Pulido Final y Release Controlado

Propósito: reservar espacio después de la Fase 20 para asegurar orden cronológico sin bloquear al Ejecutor/Auditor. Se activa una vez que 20 quede aprobada.

## Alcance preliminar
- QA visual y narrativa: checklists 18/19 aplicados a todo el simulador (incluye landing de acceso 17.x).
- Smoke E2E con Auth: login Supabase, navegación protegida, simulación básica registrada en `access_logs`.
- Revisión de dominios y DNS: confirmar resolución de dominio oficial y `api.` con TLS activo.
- Preparación de release notes: impacto, riesgos, mitigaciones, pasos de rollback.

## Criterios de activación
- Fases 17.1, 18 y 19 aprobadas por Auditor.
- Bitácora con evidencia de dominio/DNS, Auth operativo y registro de actividad.

## Criterios de aceptación (cuando se ejecute)
- E2E mínimas pasan (auth + simulador con log).
- Sin regresiones visuales ni de copy frente a estándares 18/19.
- Dominios responden y certificados válidos.
