# Gobernanza de verificación legal (reglamento marcado `verificado`)

**Ámbito:** decisión humana asociada al endpoint `PUT /legal/{municipio}/verificar` y a las banderas que alimentan `can_enable_sanctions` / `can_generate_official_document` en el simulador. **No** reemplaza publicación en periódico oficial ni auditoría contable.

## Roles

| Rol | Responsabilidad |
|-----|----------------|
| Jurídico institucional o autoridad competente | Decide si el texto del reglamento coincide con fuente oficial (POE o equivalente) y si procede usarlo en herramientas internas |
| Administrador técnico (backend) | Ejecuta `PUT` sólo después de evidencia acordada; puede adjuntar nota breve opcional (`justification` / `evidence_ref`) como trazabilidad manual |
| Auditor / CSA | Vigila que no se interprete la bandera como dictamen ni como capa geo MGN |

## Evidencia mínima (antes de `verificado=true`)

1. Localización estable del instrumento (URL canónico, expediente físico o archivo, o hash de descarga).
2. Identificación explícita de `municipio_id` (clave semilla actual; CVE INEGI cuando exista anclaje Navigator).
3. Registro de quién revisó y fecha (hoy: fuera de la base de datos — bitácora institucional o ticket interno).

## Cuándo `verificado=true`

- Cuando la revisión humana concluye que el reglamento seed o ingestado es el marco de referencia aceptado para **simulación y educación institucional** en ALQUIMIA, **sin** equivaler por sí solo a uso para imposición de sanciones reales hasta completar otros gates locales.

## Vínculo con `can_enable_sanctions`

- El frontend deriva bloqueos a partir del diagnóstico legal municipal (incl. validación y bloqueadores). La bandera `verificado` en repositorio puede alinear el seed con el modelo de diagnóstico, pero **no** sustituye el juicio institucional completo sobre procedimientos ejecutivos (`legal_validation_status`, manifest, brechas).

## Estado técnico 2026-Q2

- `set_verificado` actualiza sólo estado en memoria (semillas). Persistencia Alembic y libro de auditoría en BD están **fuera de alcance** hasta ADR CSA; cualquier promesa de auditoría completa debe documentarse allí antes de comunicar trazabilidad plena a usuarios externos.
