# Post-MVP Sprint 3 · Evidencia de pruebas

Fecha: 2026-05-31

| Comando / prueba | Resultado | Salida relevante | Riesgo |
| --- | --- | --- | --- |
| `npm run type-check` | PASS | `tsc --noEmit` sin errores | Ninguno |
| `npm run test -- editorial.test.ts PillarModulePanel.test.tsx` | PASS | 2 archivos, 7 pruebas | Ninguno |
| `npm run build` | PASS | Next build completo; 33 rutas generadas | Ninguno |
| `npm run lint` | PASS | 0 errores, 162 warnings legacy | Warnings preexistentes fuera del alcance |
| Browser QA `localhost:3000` | PARTIAL/PASS | `/`, `/metodologia`, `/preparando`, `/pendiente-validacion`, `/v` sin overflow ni nombres internos | `/comenzar` en server stale mostró error no presente en build artifact |
| Build artifact `/comenzar` | PASS | `.next/server/app/comenzar.html` contiene formulario y shell público correcto | Navegador a puerto alterno bloqueado por política Browser |

## Nota

No se declara “todo jala” por browser alterno bloqueado. Se declara que el build producido contiene la ruta corregida, y que la verificación disponible no encontró overflow ni exposición de agentes internos.
