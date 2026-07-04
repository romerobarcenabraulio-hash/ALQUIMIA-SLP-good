# Gotchas

- **SQLAlchemy `metadata`:** es nombre reservado en declarative models; no usar como atributo de modelo.
- **Rebase 13/17 jun:** el repo quedo congelado en rebase de `codex/frontend-clean-origin`; se resolvio conflicto en `frontend/src/app/admin/page.tsx` y el commit resultante fue `3ea6f8087`.
- **Render MCP:** puede estar declarado como plugin sin exponer `list_services/list_deploys/list_logs`; no marcar Render verde sin logs, deploy o `/health` verificable.
- **DNS sandbox:** `curl` desde Codex puede fallar con `Could not resolve host`; distinguir bloqueo local de caida real del servicio.
- **Untracked grandes:** no agregar por accidente `Alquimia_Supermind_Maestro_v4_DEFINITIVO.docx`, `codex-marketplaces/`, `plugins/` ni handoffs sin revisar alcance.
- **Admin vs cliente:** `/admin` puede mostrar gates, tenants e IDs internos; `/v` debe ser consultivo y limpio.
- **Simulator legacy:** `frontend/src/components/simulator/` contiene legado util pero no debe reintroducir vocabulario de simulador en cliente.
- **Procedencia:** si un dato no tiene fuente/fecha/metodo, mostrar gap acotado o bloquear; nunca inventar.
