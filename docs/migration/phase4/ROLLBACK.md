# Rollback Fase 4 · Piloto SLP

**Alcance:** regresar el tenant `slp-capital` al estado previo a la migracion por etapas sin borrar datos del piloto.

## Insumos

- Backup BIOS generado por `backend/scripts/slp_phase4_backup.py`.
- Manifest sha256 `slp-phase4-pre-migration-*.manifest.json`.
- Reporte AUDITOR `slp-phase4-comparison-report.json`.

## Procedimiento

1. Pausar acceso de cliente al tenant `slp-capital`.
2. Restaurar archivos desde el `.tgz` de backup solo si AUDITOR reporta diferencias de hash en buckets criticos.
3. En Plataforma 0, dejar `slp-capital.current_stage = "validation"` o desactivar tenant si founder decide volver a legacy temporal.
4. Re-ejecutar `backend/scripts/slp_phase4_compare.py --manifest <manifest>` hasta que no existan diferencias no explicadas.
5. Registrar accion en audit log con actor humano y evidencia del backup usado.

## Garantias

- La Fase 4 no borra modulos legacy.
- La arquitectura legacy `/simulator` no se retira en esta fase.
- Los modulos de ejecucion permanecen en codigo y registry; solo se ocultan para `slp-capital` mientras `current_stage = "validation"`.
