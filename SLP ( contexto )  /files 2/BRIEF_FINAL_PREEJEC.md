# BRIEF FINAL PRE-EJECUCIÓN — PLATAFORMA ÚNICA
# Agregar al inicio del BOOTSTRAP_UNICO_DEFINITIVO.md antes de ejecutar
# Este documento define la arquitectura unificada y la integración con Drive

---

# ARQUITECTURA: UN SOLO PRODUCTO

ALQUIMIA y ÁGORA NO son proyectos separados.
Son el frontend y el backend de UNA SOLA plataforma.

```
┌─────────────────────────────────────────────────────────┐
│                   PLATAFORMA ALQUIMIA                   │
│                                                         │
│  FRONTEND (lo que ve el municipio)                      │
│  ├── Simulador interactivo (scroll vertical)            │
│  ├── CA-Studio (SimCity)                                │
│  ├── Hub de documentos                                  │
│  └── Centro educativo /aprende                          │
│                                                         │
│  BACKEND (invisible, se activa con un botón)            │
│  └── Motor ÁGORA — 7 agentes autónomos                  │
│      Director → Arquitecto → Ghostwriter                │
│      → Comparador → Mapeador → Validador → Humanizador  │
│                                                         │
│  TRIGGER: botón "Genera mi plan de circularidad"        │
│  INPUT:   escenario configurado en el simulador         │
│  OUTPUT:  documentos completos en Drive del municipio   │
└─────────────────────────────────────────────────────────┘
```

---

# EL TRIGGER — cómo funciona

El usuario (municipio o concesionario) configura su escenario:
- Selecciona su ZM y municipios
- Define horizonte y trayectoria de captura
- Ajusta precios y mix de CAs
- Revisa impacto financiero, ambiental, social

Cuando está conforme, hace clic en:

**[ Genera mi plan de circularidad ]**

Esto dispara en background:

```python
# backend/routers/generate_plan.py

async def generate_plan(municipio: str, scenario: ScenarioData):
    """
    1. ALQUIMIA corre simulación completa → JSON con todos los KPIs
    2. Director.py recibe JSON → arma plan de trabajo para agentes
    3. Agentes corren en paralelo donde pueden:
       - Arquitecto: diagnóstica reglamento vigente del municipio
       - Comparador: busca benchmarks LATAM relevantes
       - Mapeador: identifica stakeholders locales
    4. Ghostwriter recibe outputs de los 3 → redacta documentos
    5. Validador verifica consistencia con datos del simulador
    6. Humanizador pasa todo por filtro de voz y estilo
    7. Director consolida → sube a Drive del municipio
    8. Hub se actualiza → usuario recibe notificación
    """
```

El usuario ve una barra de progreso con 7 pasos. En ~8-15 minutos tiene su plan completo.

---

# INTEGRACIÓN GOOGLE DRIVE

## IDs de carpetas (ya mapeadas — NO hardcodear, leer del env)

```python
# .env
DRIVE_ROOT_ID         = "1mVC_ay_qvmT08QZReoKp2X8jTHZiPoMW"  # RECICAJE LEG
DRIVE_SLP_ID          = "1btaIFfZiEFIoocFdbDAWN1O-lNKwyTWC"   # SLP (ADN)
DRIVE_QRO_ID          = "1KVXVzwMpXKE8a8IZCHEOimn32NBCeL-h"   # QRO
DRIVE_NL_ID           = "1I1nVxDzs4iKdUiiOpVviCvH9k_w-gZTv"   # NUEVO LEON
DRIVE_GTO_ID          = "1CXBIvK82Aa1RqDKIa82SoXGiBLqozwb2"   # GUANAJUATO

# IDs documentos fuente SLP (ADN — solo lectura)
DRIVE_CAPITULO_SLP_ID       = "1EauAowFQCm2s67gNogF27L29m9qLJqxCqFp5p9E3xQ4"
DRIVE_MODELO_BASED_ID       = "1fdtOgWQ0rstpNiv7g_d0a-2LqFS6QFaflQz1NtJHcag"
DRIVE_CENTROS_ACOPIO_ID     = "1UiTHuvc-8Ozdu0BYEvsurX19ztB8uk94Dwm9XuaPNnI"
DRIVE_RECICLADORAS_ID       = "12__CE0tiv8XAzWIve7xszwdLaCqLNNYzZO1d5Ds9h6M"
DRIVE_ESTRATEGIA_SLP_ID     = "1scCxAihTJrHqkjuinXlq1ewbZjtfLyTd"
DRIVE_GANTT_SLP_ID          = "1L9R7ieqJtk4YxD7LMZHTOHeJcf0wyEcg"
DRIVE_BITACORA_ID           = "1trv7XqXXEAynaUwJeLvmGTAjLoThJOQS1CqOpWiU8dI"
```

## Flujo de lectura (ADN → agentes)

```python
# agents/dna_loader.py
# Al arrancar el servidor, carga los docs SLP en memoria como contexto base

async def load_slp_dna():
    """Lee los 7 documentos fuente de SLP desde Drive.
    Los agentes los usan como plantilla y referencia.
    SLP es solo lectura — nunca se modifica."""
    capitulo = await drive.read(DRIVE_CAPITULO_SLP_ID)
    modelo   = await drive.read(DRIVE_MODELO_BASED_ID)
    # ... etc
    return DNAContext(capitulo=capitulo, modelo=modelo, ...)
```

## Flujo de escritura (agentes → Drive del municipio)

```python
# Cuando ÁGORA termina de generar documentos para QRO:
municipio_folder = {
    "QRO":  DRIVE_QRO_ID,
    "NL":   DRIVE_NL_ID,
    "GTO":  DRIVE_GTO_ID,
    "SLP":  DRIVE_SLP_ID,  # outputs nuevos van a subcarpeta, no sobreescribe ADN
}

# Estructura de salida por municipio:
# RECICAJE LEG/{MUNICIPIO}/
#   ├── GENERADO_{fecha}/
#   │   ├── 01_marco_legal_{municipio}.docx
#   │   ├── 02_iniciativa_reforma_{municipio}.docx
#   │   ├── 03_modelo_CFO_{municipio}.xlsx
#   │   ├── 04_plan_implementacion_{municipio}.pdf
#   │   ├── 05_benchmark_latam_{municipio}.pdf
#   │   ├── 06_mapeo_stakeholders_{municipio}.pdf
#   │   └── 07_reporte_ejecutivo_{municipio}.pdf
```

---

# ESTRUCTURA DE SUBTAREAS DENTRO DE CADA CARPETA

Cuando ÁGORA genere documentos para QRO, NL o GTO, crea esta estructura automáticamente dentro de la carpeta existente:

```
QRO/
  ├── Marco_Legal/
  │   ├── Diagnostico_Reglamento_QRO.docx
  │   ├── Iniciativa_Reforma_QRO.docx
  │   └── Adenda_Concesion_QRO.docx
  ├── Modelo_Financiero/
  │   ├── CFO_QRO.xlsx          ← alimentado por ALQUIMIA directamente
  │   └── Reporte_Ejecutivo_QRO.pdf
  ├── Operativo/
  │   ├── Plan_Implementacion_QRO.pdf
  │   ├── Manual_CA_P_QRO.docx
  │   └── Bitacora_QRO.xlsx
  └── Comunicacion/
      ├── Presentacion_Cabildo_QRO.pptx
      └── Carta_Ciudadanos_QRO.pdf
```

---

# MODELO DE NEGOCIO IMPLÍCITO

Cada municipio o concesionario que usa la plataforma recibe:

1. **Simulación en tiempo real** (inmediata, gratis en modo demo)
2. **Plan de circularidad completo** (trigger → agentes → 8-15 min)
3. **Documentos listos para Cabildo** (en su carpeta Drive)
4. **Acceso público a su hub** (difusión, transparencia, presión política)

El botón "Genera mi plan" es el momento de conversión. Antes de presionarlo, el municipio ya vio sus números, ya sabe que es viable, ya está convencido. El botón convierte convicción en acción.

---

# PRESENTACIÓN DE DATOS — CAPAS DEFINIDAS

Para evitar conflictos en la implementación del frontend:

```
CAPA 1 — Header sticky (siempre visible, 1 línea):
  [RSU: 725 t/d] [Ingreso: $370M/año] [CO₂e: 533K t] [Empleos: 288]
  → font-mono, actualización tiempo real, sin decimales salvo necesario

CAPA 2 — Hero de sección (primer bloque de cada S):
  Número grande + 1 label + 1 línea de contexto
  → lo que lee el alcalde en 3 segundos
  → sin gráficas, sin tablas

CAPA 3 — Detalle de sección (debajo del hero, visible al scroll):
  Gráfica principal + controles + tabla de desglose
  → el analista encuentra aquí lo que necesita

CAPA 4 — Narrativa dinámica (debajo de capa 3):
  Párrafo de 2-3 líneas, lenguaje ejecutivo
  → se reescribe con debounce 400ms al mover cualquier control
  → compara con benchmarks, contextualiza el número

CAPA 5 — Fundamento (tooltip o drawer lateral):
  "Ver fuente" → fragmento del capítulo SLP o referencia bibliográfica
  → accesible pero no intrusivo
```

Los conceptos se repiten intencionalmente: el RSU total aparece en el header, en el hero de S6, en el desglose de S7 por tipo de vivienda, y en el volumen capturable de S10. Cada vez con más profundidad. Eso es pedagogía de datos.

---

# INSTRUCCIÓN FINAL PARA CLAUDE CODE

Lee este documento PRIMERO, luego el BOOTSTRAP_UNICO_DEFINITIVO.md.

La plataforma se llama **ALQUIMIA**. Es un solo producto. Las rutas son:
```
/           → Landing
/login      → Auth
/simulator  → Simulador (scroll 20 secciones + botón "Genera mi plan")
/ca-studio  → SimCity CA
/hub        → Documentos por municipio (lee/escribe Drive con IDs del .env)
/aprende    → Educativo público
/admin      → Panel admin
```

El botón "Genera mi plan de circularidad" vive al final de S20 (Exportar) Y como CTA flotante que aparece después de que el usuario haya interactuado con al menos 3 secciones del simulador.

Al hacer clic: modal de confirmación → barra de progreso 7 pasos → documentos aparecen en /hub → notificación → opción de compartir URL pública.

Los docs SLP en Drive son ADN de solo lectura. Las carpetas QRO, NL, GTO son destino de escritura de ÁGORA.

Credenciales Drive: usar Google Drive API con service account. Las variables de entorno están en .env (IDs arriba).

**Construye todo. Una sola plataforma. Sin preguntas.**
