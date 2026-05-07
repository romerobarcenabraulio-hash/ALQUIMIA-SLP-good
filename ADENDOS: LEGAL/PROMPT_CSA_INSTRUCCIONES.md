# INSTRUCCIONES PARA EL CSA
## Carga de reglamentos y activación del sistema de adendos

---

## ¿Qué hace el CSA con los reglamentos?

Cuando descargues el PDF de un reglamento municipal, haces lo siguiente:

### Paso 1 — Guardar el PDF
Coloca el PDF en esta ruta del repo:
```
SLP /DOCS/ADENDOS/REGLAMENTOS_BASE/
  [CIUDAD]_reglamento_aseo_[AÑO].pdf
```

Ejemplo:
```
SLP /DOCS/ADENDOS/REGLAMENTOS_BASE/
  SLP_reglamento_aseo_2018.pdf
  QUERETARO_reglamento_GIRS_2021.pdf
  MONTERREY_reglamento_GIRS_2023.pdf
  SANPEDRO_reglamento_ambiental_RSU_2022.pdf
  CORREGIDORA_reglamento_servicios_2020.pdf
  ELMARQUES_reglamento_limpia_2015.pdf
```

---

### Paso 2 — Buscar estos 5 artículos en cada reglamento

Por cada PDF, localiza y anota el número de artículo de:

| # | Qué buscar | Palabras clave en el PDF |
|---|---|---|
| 1 | **Artículo de definiciones** | "definiciones", "glosario", "para efectos de este reglamento" |
| 2 | **Artículo de recolección general** | "recolección", "prestación del servicio", "servicio de limpia" |
| 3 | **Artículo de obligaciones de los habitantes/usuarios** | "obligaciones", "usuarios", "generadores", "habitantes" |
| 4 | **Artículo de infracciones / sanciones** | "infracciones", "sanciones", "multas", "faltas" |
| 5 | **¿Existe artículo específico para condominios?** | "condominio", "administrador", "régimen de propiedad" |

---

### Paso 3 — Pegar el texto en los archivos de adendos

Una vez que tengas el texto del artículo vigente, pégalo en la sección `📄 ESTADO ACTUAL DEL REGLAMENTO` del archivo `.md` correspondiente.

**Ejemplo para SLP:**

Abre `01_ADENDO_DEFINICIONES_ART4.md` y reemplaza esto:
```
[PENDIENTE — CSA: pegar aquí el texto del Art. 4 vigente del Reglamento de Aseo 2018]
```

Con el texto real del artículo, por ejemplo:
```
Artículo 4. Para los efectos del presente Reglamento se entiende por:
I. Aseo Público: servicio municipal consistente en...
II. Basura: conjunto de desperdicios sólidos y semisólidos...
[etc.]
```

---

### Paso 4 — Actualizar la tabla comparativa

En `MULTI_CIUDAD/TABLA_COMPARATIVA.md`, reemplaza los `[📄]` de la ciudad procesada con el número de artículo real.

**Ejemplo:**
```
Antes: | Querétaro | Art. [📄] |
Después: | Querétaro | Art. 3 |
```

---

### Paso 5 — Marcar el PDF como cargado en el índice

En `00_INDICE_ADENDOS.md`, cambia el estado del reglamento de:
```
⏳ Pendiente
```
a:
```
✅ Cargado — [fecha]
```

---

## Reglamentos prioritarios

Prioridad de descarga sugerida:

1. **SLP** — Reglamento de Aseo Público 2018 (es el modelo base, ya tenemos el capítulo completo)
2. **Querétaro** — Reglamento GIRS 2021 (segunda ciudad más importante del programa)
3. **Monterrey** — Reglamento GIRS 2023 (ya tiene multas — solo ajustar)
4. **San Pedro G.G.** — el más avanzado en sanciones
5. Corregidora y El Marqués

---

## Cómo se ve el sistema cuando esté completo

La vista que tendremos para cada adendo en pantalla:

```
┌─────────────────────────────────────────────────────────┐
│  📄 ARTÍCULO VIGENTE (texto del PDF del reglamento)      │
│  [texto completo del artículo actual — cargado por CSA]  │
│                                                          │
│  Reglamento de Aseo Público SLP 2018 · Art. 4           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ✏️ ADENDO PROPUESTO                                     │
│  [texto del nuevo artículo / reforma]                    │
│                                                          │
│  Técnica: Adicionar fracciones X, X+1, X+2, X+3         │
│  Efecto: crea sujetos jurídicos para los arts. siguientes│
└─────────────────────────────────────────────────────────┘
```

---

## Archivos generados (ya listos para llenar)

```
SLP /DOCS/ADENDOS/
  00_INDICE_ADENDOS.md          ← índice maestro
  00_GLOSARIO.md                ← términos universales
  01_ADENDO_DEFINICIONES_ART4.md
  02_ADENDO_ESQUEMAS_CONDOMINIO_ART20BIS.md
  03_ADENDO_OBLIGACIONES_HABITANTES_ART21.md
  04_ADENDO_OBLIGACIONES_ADMIN_ART21BIS.md
  05_ADENDO_SANCIONES_ART37BIS.md
  06_ADENDO_TRANSITORIOS.md
  07_LINEAMIENTO_TECNICO_RSU01.md
  PROMPT_CSA_INSTRUCCIONES.md   ← este archivo
  MULTI_CIUDAD/
    TABLA_COMPARATIVA.md        ← mapa de artículos por ciudad
  REGLAMENTOS_BASE/             ← aquí van los PDFs (carpeta por crear con los PDFs)
```
