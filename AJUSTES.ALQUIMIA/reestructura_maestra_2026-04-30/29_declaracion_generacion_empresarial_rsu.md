# Fase 29 · Declaración de Generación Empresarial RSU

**Origen:** Solicitud CSA/Usuario 2026-05-05  
**Cola:** Q-017  
**OLA:** 2–3 (puede iniciar antes de Q-009; se potencia después)  
**Riesgo:** Legal medio (no sustituye COA federal) · técnico bajo

---

## Propósito

Permitir que una empresa declare —de forma voluntaria y estructurada— cuánto residuo sólido urbano **no peligroso** va a generar, por tipo de material, para que ALQUIMIA:

1. **Calcule** su perfil de generación estimada por giro SCIAN.
2. **Integre** ese volumen al módulo de Macrogeneradores de la ZM activa.
3. **Genere** un perfil descargable que la empresa puede usar internamente o presentar al municipio como línea base voluntaria.

> **Este módulo NO sustituye la COA (Cédula de Operación Anual) de SEMARNAT.** La COA aplica a grandes generadores de residuos de manejo especial o peligrosos. Este módulo es para residuos sólidos urbanos no peligrosos, de carácter voluntario y estimativo.

---

## Distinción legal crítica (CLC debe confirmar)

| | COA SEMARNAT | Declaración ALQUIMIA |
|--|-------------|---------------------|
| **Obligatoriedad** | Obligatoria para grandes generadores | Voluntaria |
| **Tipo de residuo** | Manejo especial + peligrosos | RSU no peligrosos |
| **Autoridad** | SEMARNAT federal | Sin autoridad — es herramienta de gestión |
| **Efectos legales** | Vinculante | Ninguno — es estimación interna |
| **Nombre sugerido** | COA | "Perfil de Generación Estimada RSU" o "Declaración Voluntaria de Generación" |

---

## Marco normativo de referencia

- **LGPGIR** Art. [VERIFICAR] — clasificación de generadores y obligaciones de reporte.
- **NOM-161-SEMARNAT-2011** — planes de manejo para residuos de manejo especial.
- **LGEEPA** Art. [VERIFICAR] — facultades municipales sobre RSU.
- **Clasificador SCIAN 2018 INEGI** — base para factores de generación por giro.

---

## Lógica de cálculo

```
Generación estimada (ton/año) =
  Producción declarada (unidad por giro)
  × Factor de generación RSU por giro SCIAN
  × Factor de composición por material
  × Ajuste estacionalidad (opcional)
```

**Factores de generación por giro SCIAN:** basados en SEMARNAT DBGIR 2020 + literatura técnica. Deben ser marcados como `[ESTIMADO — verificar con datos propios de la empresa]`.

---

## Modelo de datos (backend)

```python
class EmpresaDeclaracionRSU(BaseModel):
    declaracion_id: str
    empresa_nombre: str
    rfc: str | None
    municipio_id: str            # CVE INEGI
    giro_scian: str              # 6 dígitos SCIAN 2018
    produccion_anual: float      # en unidades del giro (ton, piezas, m², etc.)
    unidad_produccion: str
    generacion_estimada: dict[str, float]  # {"organico": X, "papel": Y, "plastico": Z, ...}
    frecuencia_recoleccion_req: str        # "diaria" | "2x_semana" | "semanal"
    tiene_plan_manejo: bool
    notas: str | None
    fecha_declaracion: str
    status: Literal['borrador', 'confirmada']
```

---

## Flujo de usuario (empresa)

```
Paso 1 — Identificación
  Nombre empresa + municipio + giro SCIAN (dropdown con búsqueda por sector)

Paso 2 — Producción
  Ingresar volumen de producción anual en la unidad del giro
  ALQUIMIA muestra: "Para este giro, el factor SEMARNAT es X kg RSU / unidad"

Paso 3 — Revisión por material
  Tabla editable: empresa puede ajustar porcentajes por tipo
  ("En mi operación genero más cartón que el promedio del giro")

Paso 4 — Resumen
  - Generación total estimada: X ton/año
  - Composición por material: gráfica proporcional
  - Frecuencia de recolección recomendada
  - ¿Aplica como gran generador bajo LGPGIR? (aviso automático si >10 ton/año especiales)

Paso 5 — Descarga
  PDF "Perfil de Generación Estimada RSU [Empresa] [Año]"
  Disclaimer: no oficial, no sustituye COA SEMARNAT
```

---

## Integración con Macrogeneradores

Cuando la empresa confirma su declaración:
- Aparece en el módulo `Macrogeneradores.tsx` como fuente `declaracion_voluntaria`
- El impacto incremental se calcula sobre el RSU total de la ZM
- El inspector municipal puede ver el agregado de declaraciones en su territorio

---

## Componentes frontend

| Componente | Función |
|-----------|---------|
| `DeclaracionWizard.tsx` | Formulario paso a paso (4 pasos) |
| `GiroScianSelector.tsx` | Dropdown con búsqueda por sector / subsector |
| `GeneracionTable.tsx` | Tabla editable por material con totales reactivos |
| `PerfilGeneracionPDF.tsx` | PDF descargable con disclaimer |
| `MacrogeneradorCard.tsx` | Tarjeta en Macrogeneradores con fuente `declaracion_voluntaria` |

---

## Restricciones de diseño

1. **Nombre del módulo:** "Perfil de Generación Estimada RSU" — nunca "COA" ni "Cédula" ni "Declaración oficial".
2. **Disclaimer en PDF:** `[ESTIMACIÓN VOLUNTARIA — no oficial, no sustituye COA SEMARNAT ni obligaciones de reporte federal]`
3. **Aviso automático gran generador:** si `generacion_estimada_total > 10_000 kg/año` en residuos de manejo especial → mostrar banner: *"Tu volumen podría estar sujeto a COA federal. Consulta a un especialista."*
4. **Datos del RFC:** opcional y no validado — ALQUIMIA no es autoridad fiscal.
5. **Factores SCIAN** llevan etiqueta `[ESTIMADO SEMARNAT DBGIR 2020]` — la empresa puede ajustar.

---

## Roles y dependencias

| Rol | Acción |
|-----|--------|
| **CLC** | Confirmar que el nombre y el disclaimer son suficientes para no confundir con COA federal |
| **Ejecutor** | Implementar wizard, modelos y PDF |
| **Auditor** | Revisar que el aviso de gran generador dispara correctamente y que los factores SCIAN tienen fuente declarada |
| **Aesthete** | Diseñar el wizard y la tarjeta en Macrogeneradores |

---

## Criterios de aceptación

- [ ] Nombre del módulo NO contiene "COA" ni "Cédula" ni "oficial"
- [ ] Disclaimer en PDF verificado por CLC
- [ ] Aviso automático gran generador funciona con umbral 10,000 kg/año
- [ ] Factores SCIAN tienen fuente citada: `SEMARNAT DBGIR 2020 [ESTIMADO]`
- [ ] Declaración confirmada aparece en `Macrogeneradores.tsx` con fuente `declaracion_voluntaria`
- [ ] `tsc --noEmit` y `pytest` sin regresiones
