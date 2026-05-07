# ADENDO 2 — ESQUEMAS DE SEPARACIÓN EN CONDOMINIOS
## Artículo 20 Bis (SLP) · Nuevo artículo — Modelos A y B de recolección

**trace:** CLC-005-ADENDO-2  
**Fuente:** Sección 4.2 del Capítulo San Luis Potosí  
**Técnica:** Adicionar nuevo artículo Bis inmediato al artículo de recolección general  
**Estado:** `[BORRADOR PARA REVISIÓN LEGAL]`

---

## 📄 ESTADO ACTUAL DEL REGLAMENTO

<!-- ═══════════════════════════════════════════════════════════════
     SECCIÓN PARA EL CSA:
     Pega aquí el texto del artículo de recolección general vigente
     (en SLP será el Art. 20 o el artículo más cercano al servicio
     de recolección domiciliaria). También pega la captura del PDF.
     ═══════════════════════════════════════════════════════════════ -->

**Reglamento:** Reglamento de Aseo Público del Municipio de San Luis Potosí (2018)  
**Artículo de referencia:** Art. 20 (recolección general — texto a confirmar)  
**Texto vigente:**

```
[PENDIENTE: texto del artículo de recolección general desde PDF oficial del Reglamento de Aseo Público — Municipalidad de San Luis Potosí.]
El PDF mal etiquetado era la Ley de Ingresos 2023 (antes `SLP_slp_capital_decreto_publicacion_reglamento_2023.pdf`); archivo archivado en:
ADENDOS: LEGAL/pdfs/reglamentos/_espejo_catalogo_erroneo/SLP_slp_erroneo_es_Ley_Ingresos_2023_no_Reglamento_Aseo_Publico.pdf
Acción requerida: colocar el reglamento correcto como ADENDOS: LEGAL/pdfs/reglamentos/SLP_slp_reglamento_aseo_publico.pdf y el symlink en frontend/public/reglamentos/, para verificar el artículo de recolección general (presumiblemente Art. 20).

[ARTÍCULO 20 BIS: NO EXISTE EN EL REGLAMENTO VIGENTE SLP 2018]
El reglamento actual no tiene un artículo equivalente al propuesto.
La técnica normativa es: Adicionar (nuevo artículo Art. 20 Bis).
Fuente: Reglamento de Aseo Público del Municipio de San Luis Potosí · 2018 · pendiente verificación PDF
```

**Referencia cruzada MTY (Reglamento de Limpia Municipal de Monterrey, 2020-2024):**  
**Artículos equivalentes:** Art. 7 (recolección domiciliaria) + Art. 8 (conjuntos habitacionales)

```
ARTÍCULO 7. La recolección y traslado de la basura domiciliaria de las casas habitación,
escuelas públicas, templos, áreas de propiedad o uso municipal y dependencias oficiales
de gobierno, se realizará por la Secretaría de Servicios Públicos en los horarios que
establezca la misma Secretaría.

ARTÍCULO 8. La Presidencia Municipal dotará a la Secretaría de Servicios Públicos del
equipo necesario para la prestación del servicio de limpia. [...] Los propietarios,
administradores o encargados de edificios, conjuntos habitacionales o propiedades de
régimen en condominio, tendrán la obligación de instalar en el interior de sus predios
depósitos o contenedores suficientes para la basura que se genere, debiendo ser instalados
en un lugar que permita las maniobras para su adecuada recolección.
[...] En concordancia con las leyes y normas ambientales actuales, a los habitantes del
municipio de Monterrey, se les exhorta para que realicen la separación de la basura en
reciclables, orgánicos e inorgánicos y sea colocada en los recipientes que se entregan al
servicio de recolección a fin de tener un mejor manejo y destino final de la basura.
```
Fuente: Reglamento de Limpia Municipal de Monterrey · Gobierno 2021-2024 · verificado íntegro
Diagnóstico MTY: menciona condominios en Art. 8 pero NO define modelos A/B de separación diferenciada. El artículo Bis es necesario también en MTY.

**Diagnóstico de la brecha:**
- La recolección se trata de forma homogénea para toda la ciudad
- NO distingue condominio de vivienda unifamiliar en calle
- NO reconoce ni regula centros de acopio condominiales
- NO define modelos de recolección diferenciada por tipo de vivienda
- **Consecuencia:** el municipio no tiene base jurídica para exigir a un condominio que instale un centro de acopio ni para operar una ruta diferenciada específica para condominios

---

## ✏️ ADENDO PROPUESTO

**Instrumento:** Nuevo Artículo 20 Bis del Reglamento de Aseo Público  
**Para SLP:** Artículo 20 Bis — nuevo, va inmediatamente después del Art. 20 vigente

---

**"Artículo 20 Bis. En los inmuebles habitacionales ubicados en condominios y desarrollos residenciales con administración común, el servicio de recolección de residuos sólidos urbanos se organizará con base en los esquemas siguientes:**

**I. Esquema Modelo A — Centro de acopio condominial:** Aplicable a condominios de baja y media densidad, en el cual las viviendas entregan sus residuos sólidos urbanos separados en cinco fracciones en un centro de acopio condominial dotado de contenedores diferenciados por fracción, y el vehículo recolector presta el servicio en dicho punto conforme al calendario que emita la Dirección de Aseo Público.

**II. Esquema Modelo B — Recolección interna programada:** Aplicable a condominios y desarrollos residenciales de urbanización más extensa, en el cual la administración organiza, en coordinación con la Dirección de Aseo Público o con el concesionario del servicio, una recolección interna en que, en días determinados de la semana, se recogen exclusivamente las fracciones señaladas por la autoridad conforme al sistema de separación en cinco fracciones.

La Dirección de Aseo Público determinará, mediante acuerdo administrativo, el esquema aplicable a cada condominio o desarrollo residencial, considerando la densidad habitacional, la infraestructura disponible, la accesibilidad para los vehículos recolectores y la capacidad operativa del Municipio o del concesionario.

Las disposiciones de este artículo serán aplicables exclusivamente a inmuebles habitacionales en régimen de condominio o desarrollos residenciales con administración común. El Ayuntamiento podrá, mediante acuerdos posteriores y en función de su capacidad operativa y madurez institucional, extender gradualmente el sistema de separación en cinco fracciones a otras tipologías de vivienda y zonas urbanas."**

---

### Árbol de decisión Modelo A / Modelo B

```
¿El condominio tiene área disponible ≥ 15 m² con acceso vehicular?
        │
       Sí ──────────────────────→  MODELO A
        │                          Centro de acopio condominial
        │                          (contenedores + báscula + señalización)
        │
        No ─────────────────────→  MODELO B
                                   Recolección interna programada
                                   (el vehículo entra por fracción en
                                   días/horarios asignados)
```

### Variantes para edificios verticales (Lineamiento Técnico RSU-01)

| Variante | Aplicación | Descripción |
|---|---|---|
| **V1** | Edificios ≤ 5 pisos | Cuarto de acopio en planta baja. Residentes bajan residuos separados. |
| **V2** | Edificios ≥ 6 pisos con elevador ≥ 1,000 kg | Cuartos de servicio por piso + elevador de carga al centro en PB. |
| **V3** | Proyectos nuevos con diseño especializado | Sistema de ductos (chutes) dual/múltiple por fracción. |

### Efecto operativo
Formaliza dos modelos de servicio diferenciados para condominios. Le da a la Dirección de Aseo base jurídica para decidir, caso por caso, qué modelo aplica a cada condominio. Sin este artículo, el municipio no puede exigir que un condominio instale un centro de acopio ni operar rutas diferenciadas.

---

## Tabla de adaptación multi-ciudad

| Ciudad | Artículo de recolección vigente | Nuevo artículo Bis | Nombre de Dirección competente |
|---|---|---|---|
| **San Luis Potosí** | **Art. 20** | **Art. 20 Bis** | Dirección de Aseo Público |
| **Querétaro** | **Art. [📄 VERIFICAR]** | **Art. [N° Bis]** | `[📄 VERIFICAR]` |
| **Monterrey** | **Art. [📄 VERIFICAR]** | **Art. [N° Bis]** | `[📄 VERIFICAR]` |
| **San Pedro G.G.** | **Art. [📄 VERIFICAR]** | **Art. [N° Bis]** | `[📄 VERIFICAR]` |
| **Soledad de G.S.** | — (nuevo reglamento) | **Art. [N°]** | Dirección de Aseo Público (SLP) |
| **Corregidora** | **Art. [📄 VERIFICAR]** | **Art. [N° Bis]** | `[📄 VERIFICAR]` |
| **El Marqués** | **Art. [📄 VERIFICAR]** | **Art. [N° Bis]** | `[📄 VERIFICAR]` |

---

> **NOTA DE NO VINCULANCIA:** borrador consultivo CLC-ALQUIMIA. No produce efectos jurídicos.
