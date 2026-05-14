# Auditoría Lighthouse (`/simulator`)

Objetivo: evidencia reproducible para **§6.3** (Accessibility + LCP) frente a la bitácora.

## Prerrequisitos

- Dependencias instaladas: **`cd frontend && npm install`** (incluye `lighthouse` en `devDependencies`; sin esto verás *No se encontró lighthouse*).
- Chrome instalado (macOS: Google Chrome en `/Applications/…`)

Si olvidaste `npm install`, el script puede intentar **`npx lighthouse`** como respaldo (más lento la primera vez).

## Comando recomendado (todo en uno)

Construye el export estático de Next, sirve la carpeta `out/` en el puerto **3000** y ejecuta Lighthouse en modo **headless**:

```bash
cd frontend
npm run audit:lighthouse:ci
```

Salida:

- `audit_reports/lighthouse-simulator.report.html`
- `audit_reports/lighthouse-simulator.report.json`

Al final del comando se imprime un **resumen** (scores + LCP) listo para copiar a la bitácora.

## Solo Lighthouse (servidor ya corriendo)

Si ya tienes `npm run dev` u otro servidor en el puerto 3000:

```bash
cd frontend
npm run audit:lighthouse
```

Opcional:

```bash
LIGHTHOUSE_URL=http://127.0.0.1:3001/simulator npm run audit:lighthouse
```

## Variables de entorno

| Variable | Significado |
|----------|-------------|
| `LIGHTHOUSE_URL` | URL completa (default `http://127.0.0.1:3000/simulator`) |
| `CHROME_PATH` | Ruta al ejecutable Chrome si no es la de macOS por defecto |
| `LIGHTHOUSE_OUT` | Carpeta de salida (default `frontend/audit_reports`) |

## Solución de problemas

- **`npm install` → `ERESOLVE` / peer `eslint >= 9`:** Next 16 usa `eslint-config-next` que requiere ESLint 9; el `package.json` declara `eslint@^9`. Si venías de ESLint 8, borra `node_modules` y el lock antiguo si hace falta: `rm -rf node_modules && npm install`. Como último recurso: `npm install --legacy-peer-deps`.

- **`next lint` ya no existe en Next 16:** el script `npm run lint` ejecuta **`eslint .`** con `eslint.config.mjs` en la raíz de `frontend`.

- **`start-server-and-test: command not found`:** ejecuta `npm install` en `frontend`. El script `audit:lighthouse:ci` usa `npx start-server-and-test` para resolver el binario local.

## Bitácora y §6.3 (Accessibility + LCP)

Los scores finales se **append** en `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/BITACORA_AUDITORIA_PLANEACION.md` con fecha, URL medida y comando o enlace al job CI (ver checklist “Release serio” R6). No inventar números: copiar el resumen que imprime `npm run audit:lighthouse:ci` o el fragmento JSON de Lighthouse.
