# PROMPT PARA EL CSA
## Tarea: Carga de reglamentos municipales al sistema de adendos

---

Hola, necesito que programes esta actividad en tu agenda.

**Contexto:** Estamos construyendo el sistema de adendos al reglamento de aseo público para varias ciudades de México. Ya tenemos redactados todos los textos de reforma. Lo que falta es cargar los reglamentos vigentes de cada ciudad para poder ver, lado a lado, el texto actual del reglamento y el texto del cambio propuesto.

---

## Tu tarea concreta

### 1. Descargar los reglamentos de estas ciudades (en este orden de prioridad)

| # | Ciudad | Qué buscar | Dónde buscar |
|---|---|---|---|
| 1 | **San Luis Potosí** | "Reglamento de Aseo Público del Municipio de San Luis Potosí" — versión 2018 | POE del Estado de SLP / sitio del municipio SLP / INAFED |
| 2 | **Querétaro** | "Reglamento Municipal de Gestión Integral de Residuos Sólidos" — versión 2021 | Gaceta Municipal de Querétaro / sitio del municipio |
| 3 | **Monterrey** | "Reglamento de Gestión Integral de Residuos Sólidos" — versión 2023 | Gaceta Municipal de Monterrey / sitio del municipio NL |
| 4 | **San Pedro Garza García** | "Reglamento Ambiental y RSU" — versión 2022 | Sitio del municipio San Pedro G.G. |
| 5 | **Corregidora** | "Reglamento de Servicios Municipales" — sección de limpia, versión 2020 | Sitio del municipio Corregidora QRO |
| 6 | **El Marqués** | "Reglamento de Limpia Municipal" — versión 2015 | Sitio del municipio El Marqués QRO |

> Si no encuentras la versión exacta, descarga la más reciente disponible y anota el año real del documento.

---

### 2. Guardar los PDFs en esta ruta del repo

```
SLP /DOCS/ADENDOS/REGLAMENTOS_BASE/
```

Nombrarlos así:
```
SLP_reglamento_aseo_2018.pdf
QUERETARO_reglamento_GIRS_2021.pdf
MONTERREY_reglamento_GIRS_2023.pdf
SANPEDRO_reglamento_ambiental_RSU_2022.pdf
CORREGIDORA_reglamento_servicios_2020.pdf
ELMARQUES_reglamento_limpia_2015.pdf
```

---

### 3. En cada PDF, localizar y anotar el número de estos 5 artículos

Por cada reglamento que descargues, busca y anota el número exacto del artículo de:

1. **Definiciones** — el artículo que tiene el glosario del reglamento (palabras clave: "para efectos de este reglamento se entiende por", "definiciones")
2. **Recolección general** — el artículo que describe cómo opera el servicio de recolección (palabras clave: "recolección", "prestación del servicio", "vehículo recolector")
3. **Obligaciones de los habitantes / usuarios / generadores** — el artículo que lista qué deben hacer los ciudadanos (palabras clave: "obligaciones", "usuarios", "habitantes", "generadores")
4. **Infracciones y sanciones** — el artículo que describe multas y consecuencias (palabras clave: "infracciones", "sanciones", "multas")
5. **¿Existe algún artículo específico para condominios?** — sí o no, y si sí, qué número

---

### 4. Pegar el texto de esos artículos en los archivos correspondientes

Abre estos archivos en el repo y reemplaza las secciones marcadas con `[PENDIENTE — CSA:]` con el texto real del artículo:

| Archivo | Artículo que pegar |
|---|---|
| `01_ADENDO_DEFINICIONES_ART4.md` | Texto completo del artículo de definiciones |
| `02_ADENDO_ESQUEMAS_CONDOMINIO_ART20BIS.md` | Texto del artículo de recolección general |
| `03_ADENDO_OBLIGACIONES_HABITANTES_ART21.md` | Texto completo del artículo de obligaciones de habitantes |
| `04_ADENDO_OBLIGACIONES_ADMIN_ART21BIS.md` | Mismo artículo de obligaciones (para ver el contraste) |
| `05_ADENDO_SANCIONES_ART37BIS.md` | Texto del artículo de infracciones y sanciones |

---

### 5. Actualizar la tabla comparativa

Abre `MULTI_CIUDAD/TABLA_COMPARATIVA.md` y reemplaza cada `[📄]` con el número de artículo real que encontraste.

---

### 6. Reportar cuando termines cada ciudad

Cuando termines una ciudad, mándame un mensaje con:
- Ciudad procesada
- Nombre exacto del reglamento y año
- Los 5 números de artículos encontrados
- Si encontraste artículo específico de condominios (sí/no)
- Cualquier cosa rara que hayas notado (por ejemplo: "este reglamento no tiene artículo de definiciones" o "las sanciones remiten a otro reglamento")

---

## Referencia de archivos ya listos

Para que entiendas qué estamos armando, abre estos archivos:
- `00_INDICE_ADENDOS.md` — el índice general del proyecto
- `PROMPT_CSA_INSTRUCCIONES.md` — instrucciones técnicas detalladas paso a paso
- Cualquiera de los `01` al `07` para ver cómo luce un adendo ya redactado

---

## Plazo sugerido

- SLP: esta semana (es la ciudad base, necesitamos confirmar los artículos primero)
- Querétaro y Monterrey: semana siguiente
- Resto: cuando puedas

Gracias.
