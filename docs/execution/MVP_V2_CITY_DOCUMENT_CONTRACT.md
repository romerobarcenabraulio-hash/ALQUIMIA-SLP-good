# MVP V2 CITY DOCUMENT CONTRACT

Fecha: 2026-05-29.

## Contrato estándar

Todas las ciudades generan el mismo paquete documental:

1. Resumen metodológico.
2. Diagnóstico de residuos sólidos.
3. Estado de estudios de campo.
4. Escenarios financieros preliminares.
5. Riesgos y brechas críticas.
6. Próximos pasos y validación humana.

## Reglas

- Mismo índice para todas las ciudades.
- Mismo número de documentos.
- Misma secuencia.
- Misma ubicación para fuentes, brechas críticas, claims bloqueados, próximos pasos y validación humana.
- Misma ubicación para bibliografía mínima al final del paquete.
- Misma marca metodológica en cada documento exportado:
  `Documento preliminar elaborado con metodología ALQUIMIA · Fuentes y confianza visibles · Revisión humana requerida antes de uso oficial.`
- Misma sección de `Brechas documentales y documentos pendientes`.
- Misma regla de cumplimiento de estándares: referencia metodológica / cumplimiento parcial / cumplimiento completo. Cumplimiento completo queda bloqueado si faltan campos obligatorios.
- El contenido cambia por investigación, cotejo, fuente, método, confianza y diagnóstico.
- Una ciudad con menos datos conserva el paquete completo con brechas críticas explícitas.

Implementación de referencia:

- `frontend/src/lib/tenantDiagnosticData.ts`
- `frontend/src/app/api/tenants/[id]/export-zip/route.ts`

Estado: PASS.
