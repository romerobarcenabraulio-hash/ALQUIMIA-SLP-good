# ORDEN CODEX 2

## Subfase asignada

Fase 16.2 - Seguridad de documentos, descargas y datos.

## Mision

Endurecer descargas y persistencia documental contra `package_id` malicioso, path traversal, filenames inseguros y ZIP con rutas externas. Esta subfase puede correr en paralelo con 10.1 porque no debe tocar store, tipos, API frontend ni componentes de portal.

## Archivos permitidos

- `backend/app/services/package_store.py`
- `backend/app/routers/generate_plan.py`
- `backend/app/export/package_renderer.py`
- `backend/tests/test_fase16_2_package_security.py`
- `backend/tests/test_fase10_release_candidate.py`
- `backend/tests/test_fase3c.py`
- `backend/tests/test_fase4_export_profesional.py`

## Archivos prohibidos

- `frontend/src/types/index.ts`
- `frontend/src/store/simulatorStore.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/app/simulator/page.tsx`
- `frontend/src/components/simulator/PortalEntrySelector.tsx`
- `frontend/src/components/simulator/CityFirstSelector.tsx`
- `frontend/src/components/simulator/CircularityBaselineCard.tsx`
- `backend/app/city/**`
- `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/00_*.md` a `17_*.md`
- `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/README_REESTRUCTURA.md`
- `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/CONTROL_REESTRUCTURA.csv`

Los blueprints 00-17 son constitucion del proyecto. No moverlos, no archivarlos, no marcarlos como ejecutados.

## Definition of Done

- `package_id` se valida con allowlist estricta o esquema equivalente.
- Cualquier `package_id` con `../`, slash, backslash, URL encoding peligroso, espacios ambiguos o caracteres fuera de contrato falla con error explicito.
- `package_store` nunca lee ni escribe fuera de `PACKAGES_DIR`.
- Los nombres de archivo de documentos y assets se sanitizan antes de escritura o inclusion en ZIP.
- Los ZIP base y profesional no incluyen rutas absolutas, `..`, backslashes ni entradas fuera de raiz esperada.
- Endpoints de manifest, assets, download, render y download-professional usan validacion comun.
- Errores de API no filtran rutas internas sensibles ni secretos.
- No cambia contratos frontend ni flujo de generacion documental salvo seguridad.

## Tests minimos

- `package_id` malicioso falla para manifest/download/render/download-professional.
- `save_package` rechaza o sanitiza filenames peligrosos.
- ZIP base no contiene rutas externas ni `.txt`.
- ZIP profesional no contiene rutas externas ni `.txt`.
- Descarga de paquete inexistente retorna error seguro.
- Si el entorno tiene pytest: ejecutar pruebas nuevas y relevantes:
  - `python3 -m pytest backend/tests/test_fase16_2_package_security.py`
  - `python3 -m pytest backend/tests/test_fase3c.py backend/tests/test_fase4_export_profesional.py backend/tests/test_fase10_release_candidate.py`

## Evidencia requerida al entregar

- Lista de archivos modificados.
- Resultado de pruebas/comandos, incluyendo si `pytest` no esta disponible.
- Ejemplos de payloads maliciosos probados y respuesta esperada.
- Confirmacion de que no tocaste archivos de 10.1 ni frontend.

## Si encuentras dependencia bloqueante

Detente y reporta. No debilites autenticacion existente, no ocultes warnings y no aceptes descarga insegura por compatibilidad.
