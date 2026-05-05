# 27 · Selector Estado → Municipio + Generación universal de escenarios

**Propósito:** escalar ALQUIMIA de "plataforma de SLP" a **plataforma nacional** donde cualquier estado y municipio de México puede generar su escenario, descargar sus documentos y comparar con otros.

---

## 27.A · Selector Estado → Municipio (reemplaza el selector de ciudad actual)

### Flujo nuevo

```
1. Usuario entra a ALQUIMIA
2. Selecciona ESTADO (lista de 32 estados de la República)
3. Selecciona MUNICIPIO del estado elegido
4. Plataforma carga (o genera) el escenario base del municipio
5. Usuario simula, ajusta parámetros y descarga documentos
```

### Cambios en UI

- **Reemplazar** `CityFirstSelector` / `SelectorZM` por un **selector en dos pasos**:
  - **Paso 1:** dropdown o mapa de estados (32 entidades).
  - **Paso 2:** dropdown de municipios del estado seleccionado (catálogo INEGI).
- El header siempre muestra **Estado · Municipio** activos.
- Botón **"Cambiar municipio"** visible en todo momento (no solo en el selector inicial).
- **Botón ALQUIMIA (logo/home)** en header: regresa a la selección de estado/municipio y reinicia el escenario. Confirmación si hay datos sin guardar.

### Datos necesarios

- Catálogo completo de estados y municipios de México (fuente: **INEGI — Catálogo de Claves de Entidades Federativas, Municipios y Localidades**).
- Formato: JSON estático `frontend/src/data/estados_municipios.ts` generado desde INEGI MGN (alineado con Navigator §SRID/CVE).
- Cada municipio: `{ cve_ent, cve_mun, nombre_mun, nombre_estado, poblacion_referencia?, ... }`.

---

## 27.B · Generación de escenario por municipio

### Lógica

Cuando se selecciona un municipio:

1. **Si existe datos reales** (SLP, QRO, NL ya cargados): carga el escenario verificado.
2. **Si no existe datos reales**: genera un **escenario estimado** con:
   - Población del municipio (INEGI Censo 2020).
   - Tasa per cápita RSU nacional (0.86 kg/hab/día — fuente SEMARNAT).
   - Parámetros nacionales de referencia (composición RSU promedio nacional, costos promedio).
   - Banner claro: **"Escenario estimado — datos nacionales de referencia. No verificado para este municipio."**
3. Usuario puede **ajustar parámetros** sobre el escenario estimado.
4. Al guardar/exportar: el documento incluye la tabla de supuestos y fuentes.

### Jerarquía de confianza de datos

| Nivel | Descripción | Indicador visual |
|-------|-------------|-----------------|
| ✅ Verificado | Datos del municipio validados por ALQUIMIA | Badge verde "Verificado" |
| 🟡 Estimado | Datos nacionales de referencia aplicados al municipio | Banner amarillo "Estimado" |
| 🔴 Sin datos | Municipio sin información suficiente | "Datos insuficientes — solo parámetros manuales" |

---

## 27.C · Botón ALQUIMIA → regresa al inicio

### Comportamiento

- **Logo / nombre ALQUIMIA** en el header es siempre un botón.
- Click → modal de confirmación: "¿Regresar al inicio? El escenario actual no guardado se perderá."
  - **Guardar y salir** → guarda escenario en localStorage → regresa al selector.
  - **Salir sin guardar** → limpia estado → regresa al selector.
  - **Cancelar** → cierra modal, sigue en el simulador.
- En la pantalla de inicio (selector): sin confirmación, navegación directa.

---

## 27.D · Documentos universales por municipio

### Meta

Cualquier municipio que genere un escenario puede descargar el mismo **paquete de documentos** que SLP:

| Documento | Fuente | Notas |
|-----------|--------|-------|
| Diagnóstico RSU del municipio | Calculado por simulador | Incluye supuestos si es estimado |
| Plan de circularidad | Generado por simulador | Marcado "Propuesta — no documento oficial" |
| Marco legal aplicable | Reglamento del municipio (si existe en BD) | Si no existe: marco legal federal de referencia |
| Simulación financiera | Calculada con parámetros del municipio | |
| Benchmarks vs. municipios similares | Comparación con municipios de tamaño similar | Fuente SEMARNAT / INEGI |
| Paquete ZIP completo | Todos los anteriores + README de supuestos | |

---

## 27.E · Criterios de aceptación

- Selector Estado → Municipio funciona para los **2,469 municipios** de México (catálogo INEGI).
- Para municipios sin datos verificados: escenario estimado **con banner claro**, no pantalla vacía.
- Logo ALQUIMIA siempre es botón de regreso con confirmación.
- Documentos descargables disponibles para **cualquier** municipio seleccionado (aunque sean estimados).
- Navigator valida que los CVE usados sean los oficiales INEGI (no claves internas).

---

## Roles

- **Ejecutor:** selector UI, catálogo JSON desde INEGI, lógica escenario estimado, botón home.
- **Navigator:** validar CVE_ENT + CVE_MUN alineados a INEGI MGN; no mezclar municipio/ZM en el selector.
- **Auditor:** verificar que escenarios estimados no se presenten como datos reales; disclaimers correctos.
- **Humano / CSA:** confirmar fuente del catálogo INEGI a usar y si hay datos adicionales ya recopilados para otros municipios.

---

## Dependencias

- Requiere catálogo INEGI descargado y procesado (Navigator coordina fuente).
- Para escenarios estimados: confirmar parámetros nacionales de referencia con Auditor antes de hardcodear.
- Fase 26 (reglamentos) se extiende naturalmente: para municipio nuevo, campo `url_fuente` puede quedar vacío inicialmente.
