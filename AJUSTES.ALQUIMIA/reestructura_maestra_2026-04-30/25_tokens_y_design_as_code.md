# 25 · Tokens y diseño como código (anti-drift visual)

**Propósito:** reducir divergencia entre módulos después de Fase 22: una sola fuente de **color, espacio, tipografía y radios** consumida por Ejecutor y auditada por **Aesthete-1**.

**Cuándo activar:** tras firma Auditor sobre 22.x, o cuando dos pantallas nuevas muestren paletas distintas sin justificación semántica.

---

## 1. Entregables

1. **Tabla de tokens** versionada (CSS variables en `:root`, Tailwind `theme.extend`, o JSON de tokens exportable).
2. **Regla de uso:** nuevos componentes no introducen hex arbitrarios salvo `semantic alias` documentado.
3. **Checklist Aesthete** de contraste WCAG sobre tokens primarios/secundarios.

---

## 2. Roles

| Rol | Acción |
|-----|--------|
| Aesthete-1 | Define o aprueba paleta y jerarquía |
| Ejecutor | Refactor incremental hacia tokens; sin cambiar copy legal |
| Auditor | Solo si tokens afectan estados legales (“oficial”, alertas críticas) |

---

## 3. Criterios de aceptación

- Documento de tokens enlazado desde `README_REESTRUCTURA.md` (orden de lectura).
- grep de `#rrggbb` sueltos en `frontend/src/components/simulator` tendiente a bajar (meta numérica acordada por CSA).

---

## 4. Relación con otras fases

- **22.5** ya empujó paleta editorial; **25** evita regresión.
- **23**: tokens de **mapa** (leyendas) pueden extender el mismo sistema con prefijo `map-*`.
