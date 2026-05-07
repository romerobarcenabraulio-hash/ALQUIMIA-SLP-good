# MÓDULO NORMATIVO · Incumplimiento de Separación en Propiedad Privada
## Spec legal + producto · Listo para Ejecutor

**trace:** CLC-PD&SA-008-MOD-SEP  
**Agentes:** CLC + PD&SA  
**Estado:** `[BORRADOR PARA REVISIÓN LEGAL]`  
**Fecha:** 2026-05-06  
**Referencia cruzada:** `05_ADENDO_SANCIONES_ART37BIS.md` (escalera base SLP) · `03_ADENDO_OBLIGACIONES_HABITANTES_ART21.md` · `04_ADENDO_OBLIGACIONES_ADMIN_ART21BIS.md`

> **Nota de no-vinculancia:** todo lo contenido es borrador consultivo. No dictamen oficial. Antes de cualquier efecto jurídico, revisión y firma por abogado con cédula profesional vigente.

---

## PARTE I — SUPUESTO JURÍDICO

### 1.1 Obligación de separación en fuente

La obligación de separar los residuos sólidos urbanos (RSU) en el origen de generación deriva de la concurrencia de tres niveles normativos:

| Nivel | Instrumento | Contenido relevante |
|---|---|---|
| **Federal** | Ley General para la Prevención y Gestión Integral de los Residuos (LGPGIR), Art. [VERIFICAR EN DOF] | Establece obligación de los generadores de separar RSU conforme a los planes municipales; otorga al municipio facultad reglamentaria para definir fracciones y esquemas de recolección diferenciada |
| **Federal** | Ley General del Equilibrio Ecológico y la Protección al Ambiente (LGEEPA), Art. [VERIFICAR EN DOF] | Marco ambiental general; principio de prevención y reducción en la fuente |
| **Municipal** | Reglamento de Aseo Público / Limpia del municipio activo | Define fracciones, horarios, puntos de entrega y tipo de contenedor; es el instrumento ejecutable por la autoridad municipal |

> **Anti-hallucination check CLC:** los números de artículo de LGPGIR y LGEEPA están marcados `[VERIFICAR EN DOF]` porque la versión vigente 2026 puede diferir de versiones conocidas por el modelo. Usar solo como marco, no citar número de artículo ante autoridad sin verificación en DOF.

**Principio rector:** la obligación de separar no es una preferencia ambiental — es una obligación reglamentaria ejecutable. Su incumplimiento es una infracción administrativa tipificada, con procedimiento, evidencia y consecuencia.

---

### 1.2 Sujetos obligados

| Sujeto | Supuesto de aplicación | Fundamento |
|---|---|---|
| **Propietario** de vivienda individual | Generador directo; entrega residuos al servicio de recolección | LGPGIR Art. [VERIFICAR]; Reglamento municipal |
| **Poseedor** o habitante | Quien tiene control material de la vivienda, aunque no sea propietario (arrendatario, comodatario, usufructuario) | Código Civil aplicable supletorio; Reglamento municipal |
| **Administrador de condominio** | Persona física o moral que gestiona las áreas comunes y los sistemas de recolección internos | Ley de Propiedad en Condominio estatal aplicable [VERIFICAR EN GACETA ESTATAL] |
| **Propietario del inmueble condominial** | Cuando no existe administrador designado formalmente | Reglamento de Condominio + Reglamento municipal |

**Regla de imputación:** en condominios, la infracción se documenta inicialmente contra la **administración** cuando el incumplimiento es sistémico (contenedor colectivo). Se documenta contra el **habitante** cuando la falta es individual y trazable (e.g., disposición en saco o acción en vía pública capturada con evidencia). Si no hay administración formal, la multa recae en el **representante del régimen de condominio** o, en su defecto, en el **propietario del predio**.

---

## PARTE II — ESCALERA SANCIONATORIA

### 2.1 Estructura de tres niveles

```
NIVEL 1 — APERCIBIMIENTO
    ↓ (reincidencia dentro de 30 días naturales)
NIVEL 2 — MULTA BASE
    ↓ (reincidencia dentro de 12 meses desde última sanción notificada)
NIVEL 3 — MULTA AGRAVADA + MEDIDAS CORRECTIVAS
```

---

### 2.2 Detalle por nivel

#### NIVEL 1 · Apercibimiento + plazo de corrección

| Atributo | Valor |
|---|---|
| **Nombre** | Apercibimiento con instrucción de corrección |
| **Costo económico** | Ninguno |
| **Plazo de corrección** | 15 días hábiles contados desde la notificación |
| **Efecto jurídico** | Inicia expediente con folio único; sienta precedente para Nivel 2 |
| **Quién lo emite** | Inspector de la Dirección de Aseo Público / Servicios Municipales |
| **Requisitos mínimos** | Acta de inspección + evidencia fotográfica georreferenciada + identificación del sujeto obligado |
| **Notificación** | Personal (firma de recibido) o electrónica si existe canal habilitado |
| **Efecto en el expediente** | Estado: `apercibido` · Folio: activo · Plazo: corriendo |

> **Nota PD&SA:** el Nivel 1 es la palanca de cambio conductual más poderosa. La mayoría de propietarios corrige en este punto. Es costoso eliminar este nivel — hacerlo aumenta impugnaciones y genera percepción de arbitrariedad.

---

#### NIVEL 2 · Multa base

| Atributo | Valor |
|---|---|
| **Nombre** | Multa por incumplimiento de obligación de separación |
| **Condición de activación** | Segunda documentación de la misma falta dentro de 30 días naturales desde el Nivel 1, **o** incumplimiento del plazo de corrección del Nivel 1 |
| **Monto** | **4 UMAs** [VERIFICAR UMA VIGENTE EN INEGI — actualización anual publicada en DOF cada febrero] |
| **Equivalencia referencial** | ≈ $460–$530 MXN según año [solo orientativa — usar UMA oficial vigente] |
| **Plazo de pago** | 15 días hábiles desde notificación |
| **Quién lo emite** | Dirección de Aseo Público / Tesorería Municipal según procedimiento local |
| **Recurso** | Recurso de inconformidad ante la misma autoridad dentro de 15 días hábiles (derecho de audiencia — Art. 14 CPEUM) |
| **Efecto en el expediente** | Estado: `multado_nivel_2` · Folio: activo · Plazo de pago: corriendo |

---

#### NIVEL 3 · Multa agravada + medidas correctivas

| Atributo | Valor |
|---|---|
| **Nombre** | Multa agravada por reincidencia |
| **Condición de activación** | Reincidencia: misma falta dentro de 12 meses desde la última sanción notificada y pagada |
| **Monto primera recurrencia** | **8 UMAs** [VERIFICAR UMA VIGENTE EN INEGI] |
| **Monto segunda recurrencia y subsecuentes** | **12 UMAs por evento** [VERIFICAR tope máximo en Bando de Policía y Buen Gobierno / Ley de Ingresos municipal] |
| **Medidas correctivas adicionales** | A criterio de la Dirección, con fundamento en el reglamento: requerimiento de participación en programa de educación ambiental, revisión del plan de manejo interno del condominio, o intervención técnica del servicio municipal |
| **Efecto en el expediente** | Estado: `reincidente` · Folio: activo · Escalado |

> **Límite legal CLC:** el monto de 12 UMAs debe verificarse contra el **tope máximo de sanciones** que establezca el Bando de Policía y Buen Gobierno de cada municipio. Si el Bando tiene un tope menor, la multa debe ajustarse al tope, nunca superarlo. [VERIFICAR EN FUENTE OFICIAL POR MUNICIPIO]

---

### 2.3 Tabla resumen de la escalera

| Nivel | Nombre | Monto | Condición de activación | Estado backend |
|---|---|---|---|---|
| 1 | Apercibimiento | $0 / 0 UMAs | Primera documentación | `apercibido` |
| 2 | Multa base | 4 UMAs | 2a falta en 30 días / vence plazo N1 | `multado_nivel_2` |
| 3a | Multa agravada | 8 UMAs | Reincidencia en 12 meses | `reincidente_nivel_3a` |
| 3b | Multa máxima | 12 UMAs (fija) | 2a+ reincidencia | `reincidente_nivel_3b` |

---

## PARTE III — DEBIDO PROCESO MÍNIMO

Fundamento constitucional: **Art. 14 CPEUM** (garantía de audiencia) + **Art. 16 CPEUM** (fundamento y motivación de todo acto de autoridad).

```
┌─────────────────────────────────────────────────────────┐
│  1. ACTA DE INSPECCIÓN (origen del expediente)         │
│     Inspector en campo documenta la falta               │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. EVIDENCIA MÍNIMA REQUERIDA                         │
│     • Fotografía georreferenciada (lat/lng automático)  │
│     • Fecha y hora del sistema (no editable por campo)  │
│     • Tipo de falta (catálogo — ver Parte IV)           │
│     • Folio único generado por el sistema               │
│     • Identificación del sujeto obligado (o nota de     │
│       imposibilidad de identificación)                  │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. NOTIFICACIÓN AL SUJETO OBLIGADO                    │
│     • Personal con firma de recibido (preferido)        │
│     • Por estrados si no es localizable (procedimiento  │
│       conforme al Código Administrativo estatal)        │
│     • Contenido: descripción de la falta, fundamento    │
│       jurídico, nivel de sanción, plazo de respuesta    │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. DERECHO DE AUDIENCIA (Art. 14 CPEUM)               │
│     • Plazo: 5 días hábiles desde la notificación para  │
│       presentar pruebas y alegatos                      │
│     • Canal: presencial en ventanilla o escrito ante    │
│       la Dirección de Aseo Público                      │
│     • El sujeto puede: negar la falta, acreditar        │
│       corrección inmediata, o impugnar la evidencia     │
│     • La autoridad está OBLIGADA a considerarlo         │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  5. RESOLUCIÓN FUNDADA Y MOTIVADA (Art. 16 CPEUM)      │
│     • Emitida por autoridad competente (Director/a      │
│       de Aseo Público o delegado)                       │
│     • Debe indicar: norma aplicada + artículo +         │
│       hecho probado + nivel de sanción + monto + plazo  │
│     • Plazo para resolver: [VERIFICAR EN CÓDIGO         │
│       ADMINISTRATIVO ESTATAL — típicamente 30 días      │
│       hábiles desde el cierre de audiencia]             │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  6. MEDIOS DE IMPUGNACIÓN (cierre del debido proceso)  │
│     • Recurso de inconformidad ante la misma autoridad  │
│     • En su caso: juicio contencioso-administrativo     │
│       ante el Tribunal local [VERIFICAR COMPETENCIA     │
│       POR MUNICIPIO]                                    │
└─────────────────────────────────────────────────────────┘
```

### Estados del expediente (para Ejecutor — backend state machine)

```
NUEVO → NOTIFICADO → EN_AUDIENCIA → RESUELTO → [PAGADO | IMPUGNADO | ARCHIVADO]
                                         ↓
                                    REINCIDENTE → (reinicia flujo en N3)
```

| Estado | Descripción | Acción permitida |
|---|---|---|
| `NUEVO` | Acta creada, no notificada aún | Solo lectura interna |
| `NOTIFICADO` | Folio enviado al sujeto obligado | Esperar respuesta o vencimiento de plazo |
| `EN_AUDIENCIA` | Sujeto presentó alegatos en plazo | Revisar evidencia contrastada |
| `RESUELTO_SIN_SANCION` | Audiencia exitosa, falta no acreditada | Cerrar expediente |
| `RESUELTO_CON_SANCION` | Resolución emitida con multa | Esperar pago |
| `PAGADO` | Multa cubierta en plazo | Cerrar expediente |
| `IMPUGNADO` | Recurso de inconformidad activo | Suspender cobro hasta resolución |
| `VENCIDO_SIN_PAGO` | No pagó en plazo + no impugnó | Escalar a cobro coactivo [VERIFICAR FACULTAD MUNICIPAL] |
| `REINCIDENTE` | Nueva falta tras sanción en 12 meses | Reiniciar flujo en Nivel 3 |

---

## PARTE IV — CATÁLOGO DE FALTAS

### F-01 · No separar en origen

**Descripción:** El generador entrega residuos mezclados (dos o más fracciones combinadas) al servicio de recolección o en el contenedor colectivo del condominio, cuando el predio está incorporado al sistema de separación en cinco fracciones.

**Evidencia típica:** fotografía del contenedor o del material entregado mostrando mezcla de fracciones; declaración del operador de recolección en acta.

**Gravedad base:** Nivel 1 (primera vez) → Nivel 2 (reincidencia en 30 días).

---

### F-02 · Mezclar después de separar

**Descripción:** El generador separa correctamente en su vivienda pero, al depositar en el contenedor colectivo o entregarlo al recolector, mezcla intencionalmente las fracciones previamente separadas, o permite que sus residuos ya separados sean mezclados por acción propia.

**Evidencia típica:** fotografía de contenedor colectivo donde se verifica mezcla imputable; testimonio del operador de recolección.

**Nota de prueba CLC:** esta falta es más difícil de acreditar que F-01 porque requiere probar intencionalidad o negligencia del habitante específico. En condominios grandes se documenta como falta de la administración salvo que la falta sea claramente individual.

**Gravedad base:** Nivel 1 (primera vez) → Nivel 2 (reincidencia en 30 días).

---

### F-03 · Disposición en sitio no autorizado

**Descripción:** El generador deposita cualquier fracción de RSU en un lugar distinto al punto de entrega autorizado: vía pública, predio baldío, áreas verdes, contenedores de terceros, drenaje, o cualquier otro sitio no designado por la Dirección de Aseo Público.

**Evidencia típica:** fotografía del material depositado con geolocalización; identificación del sujeto mediante cámaras, testigos o documentación en el sitio.

**Gravedad base:** Nivel 2 directo (sin necesidad de Nivel 1 previo, dado que afecta a terceros y al espacio público) → Nivel 3 en reincidencia.

**Fundamento de agravación directa:** la disposición en sitio no autorizado no es un error de procedimiento — es una afectación activa al bien común. El Nivel 1 sería insuficientemente disuasorio. [VERIFICAR que el Reglamento municipal habilite esta diferenciación]

---

### F-04 · Obstruir supervisión o inspección

**Descripción:** El sujeto obligado impide, dificulta o niega el acceso del personal inspector de la Dirección de Aseo Público a las áreas de contenedores, centro de acopio condominial o instalaciones donde se gestionen residuos, durante el ejercicio de una inspección formalmente notificada.

**Evidencia típica:** acta de inspección levantada en el lugar con constatación de negativa; testigos (dos inspectores como mínimo recomendado).

**Gravedad base:** Nivel 2 directo → Nivel 3 en reincidencia.

**Nota CLC:** esta falta es autónoma e independiente de F-01, F-02 y F-03. Puede concurrir con cualquiera de ellas sin que una absorba a la otra.

---

### F-05 · Incumplimiento de horarios y días de recolección diferenciada

**Descripción:** El generador presenta sus residuos en días u horarios distintos a los establecidos por la Dirección de Aseo Público para la fracción correspondiente, generando acumulación en vía pública o impidiendo la recolección diferenciada programada.

**Evidencia típica:** fotografía con geolocalización y hora del sistema.

**Gravedad base:** Nivel 1 → Nivel 2 (reincidencia en 30 días).

---

### Tabla de faltas para el Ejecutor (enum backend)

```python
class TipoFaltaSeparacion(str, Enum):
    F01_NO_SEPARAR                = "f01_no_separar"
    F02_MEZCLAR_DESPUES_SEPARAR   = "f02_mezclar_despues_separar"
    F03_DISPOSICION_NO_AUTORIZADA = "f03_disposicion_no_autorizada"
    F04_OBSTRUIR_INSPECCION       = "f04_obstruir_inspeccion"
    F05_HORARIO_INCORRECTO        = "f05_horario_incorrecto"

# Nivel de inicio por falta
NIVEL_INICIO: dict[TipoFaltaSeparacion, int] = {
    TipoFaltaSeparacion.F01_NO_SEPARAR:                1,
    TipoFaltaSeparacion.F02_MEZCLAR_DESPUES_SEPARAR:   1,
    TipoFaltaSeparacion.F03_DISPOSICION_NO_AUTORIZADA: 2,  # directo nivel 2
    TipoFaltaSeparacion.F04_OBSTRUIR_INSPECCION:       2,  # directo nivel 2
    TipoFaltaSeparacion.F05_HORARIO_INCORRECTO:        1,
}
```

---

## PARTE V — TEXTO DE ADENDO BORRADOR PARA REGLAMENTO

`[BORRADOR PARA REVISIÓN LEGAL — no produce efectos jurídicos hasta revisión por abogado con cédula]`

---

> **ARTÍCULO [N°] BIS. — Del Régimen de Faltas e Infracciones por Incumplimiento de Separación en Propiedad Privada.**
>
> **I. OBLIGACIÓN Y SUJETOS OBLIGADOS**
>
> Los propietarios, poseedores y administradores de inmuebles de uso habitacional — incluyendo vivienda individual, conjuntos habitacionales y propiedades sujetas al régimen de condominio — están obligados a separar los residuos sólidos urbanos generados en el origen conforme al sistema de fracciones establecido por la Dirección de Aseo Público [o la dependencia equivalente], y a entregarlos en los puntos, horarios y condiciones que esta Dirección determine.
>
> En propiedades bajo régimen de condominio, la responsabilidad de cumplimiento del sistema de separación recae sobre la administración del condominio; en ausencia de esta, sobre el representante del régimen o, en su defecto, sobre los propietarios de cada unidad privativa en forma solidaria respecto de los espacios comunes.
>
> **II. CATÁLOGO DE INFRACCIONES**
>
> Constituyen infracciones al presente artículo:
>
> **a)** Entregar residuos mezclados al servicio de recolección o depositarlos en contenedores colectivos sin la separación por fracciones requerida (no separar en origen).
>
> **b)** Mezclar residuos previamente separados antes de su entrega al servicio de recolección o depósito en el contenedor autorizado.
>
> **c)** Disponer residuos, en cualquier fracción, en sitios distintos a los autorizados por la Dirección de Aseo Público, incluyendo vía pública, áreas comunes no habilitadas, predios de terceros o drenaje.
>
> **d)** Impedir u obstaculizar la función de supervisión e inspección del personal de la Dirección de Aseo Público debidamente acreditado, respecto de las áreas de manejo de residuos del inmueble.
>
> **e)** Presentar residuos en días u horarios distintos a los establecidos por la Dirección para la fracción correspondiente.
>
> **III. ESCALERA DE SANCIONES**
>
> Las infracciones señaladas en la fracción II del presente artículo se sancionarán conforme a la siguiente escala progresiva, garantizando en todo momento el derecho de audiencia establecido en el artículo 14 de la Constitución Política de los Estados Unidos Mexicanos:
>
> **Primer nivel — Apercibimiento:** ante la primera documentación de una infracción, la autoridad municipal emitirá apercibimiento escrito con instrucción de corrección en un plazo no mayor a quince días hábiles. El apercibimiento no implica sanción económica y da inicio al expediente del infractor con folio único en el sistema de fiscalización municipal.
>
> **Segundo nivel — Multa base:** si el sujeto obligado reincide en la misma infracción dentro de los treinta días naturales siguientes al apercibimiento, o no acredita la corrección dentro del plazo otorgado, la autoridad impondrá una multa equivalente a **cuatro Unidades de Medida y Actualización (4 UMAs)** vigentes al momento de la infracción. Las infracciones tipificadas en los incisos c) y d) del apartado II podrán sancionarse directamente en este nivel ante su primera documentación, sin necesidad de apercibimiento previo, por afectar a terceros o al espacio público.
>
> **Tercer nivel — Multa agravada por reincidencia:** se considera reincidente al infractor que cometa la misma infracción dentro de un periodo de doce meses contados desde la última sanción notificada. La multa por primera reincidencia será de **ocho Unidades de Medida y Actualización (8 UMAs)**; por segunda reincidencia y subsecuentes, de **doce Unidades de Medida y Actualización (12 UMAs)** por evento. La autoridad podrá adicionalmente ordenar la participación obligatoria del infractor en el programa municipal de educación ambiental o disponer medidas correctivas sobre el sistema de manejo de residuos del inmueble.
>
> En ningún caso podrán imponerse sanciones que excedan los montos máximos previstos en el Bando de Policía y Buen Gobierno del municipio y en la Ley de Ingresos municipal vigente.
>
> **IV. PROCEDIMIENTO DE FISCALIZACIÓN Y EVIDENCIA**
>
> La documentación de infracciones requerirá como mínimo: acta de inspección levantada por personal acreditado de la Dirección, evidencia fotográfica con registro automático de geolocalización, fecha y hora, identificación del sujeto obligado o nota de las circunstancias que imposibilitaron su identificación, y folio único asignado por el sistema de fiscalización municipal.
>
> **V. NOTIFICACIÓN Y DERECHO DE AUDIENCIA**
>
> Toda sanción deberá ser notificada al sujeto obligado de forma personal o, en los supuestos previstos por el Código Administrativo del Estado, por estrados. El sujeto obligado contará con un plazo de cinco días hábiles contados desde la notificación para presentar pruebas y alegatos ante la Dirección de Aseo Público. La autoridad resolverá dentro del plazo que establezca la normatividad administrativa aplicable, en forma fundada y motivada conforme al artículo 16 constitucional.
>
> **VI. DESTINO DE LOS RECURSOS**
>
> Los recursos obtenidos por concepto de multas aplicadas conforme al presente artículo se destinarán, de manera preferente, a programas de educación ambiental ciudadana, adquisición y mantenimiento de infraestructura de separación y recolección diferenciada, y fortalecimiento del sistema de fiscalización del servicio de aseo público.

---

> **ARTÍCULO TRANSITORIO ÚNICO.** El presente artículo Bis entrará en vigor al día siguiente de su publicación en el Periódico Oficial del Estado. Durante los primeros noventa días naturales de vigencia, la autoridad municipal aplicará únicamente las sanciones de Nivel 1 (apercibimiento) con fines de difusión y capacitación ciudadana, sin imposición de multas económicas.

---

## PARTE VI — SPEC PARA EJECUTOR

### Entidades de datos requeridas

```python
# Expediente de infracción
class ExpedienteInfraccion(BaseModel):
    folio: str                          # único, generado por sistema
    municipio_id: str
    tipo_falta: TipoFaltaSeparacion
    sujeto_tipo: Literal["propietario", "poseedor", "administrador"]
    sujeto_id: str | None               # si identificado
    nivel_actual: Literal[1, 2, 3]
    estado: EstadoExpediente
    nivel_umas: Decimal                  # 0, 4, 8 o 12
    evidencia: list[EvidenciaFoto]
    fecha_infraccion: datetime
    fecha_notificacion: datetime | None
    fecha_vencimiento_audiencia: datetime | None
    fecha_resolucion: datetime | None
    reincidencia_count: int              # 0 = primera vez

class EvidenciaFoto(BaseModel):
    url: str
    lat: float
    lng: float
    timestamp: datetime                  # no editable post-capture
    capturado_por: str                   # inspector_id

class EstadoExpediente(str, Enum):
    NUEVO                  = "nuevo"
    NOTIFICADO             = "notificado"
    EN_AUDIENCIA           = "en_audiencia"
    RESUELTO_SIN_SANCION   = "resuelto_sin_sancion"
    RESUELTO_CON_SANCION   = "resuelto_con_sancion"
    PAGADO                 = "pagado"
    IMPUGNADO              = "impugnado"
    VENCIDO_SIN_PAGO       = "vencido_sin_pago"
    REINCIDENTE            = "reincidente"
```

### Endpoints sugeridos

```
POST   /multas/expedientes                → crear expediente (nivel 1)
GET    /multas/expedientes/{folio}        → detalle del expediente
PATCH  /multas/expedientes/{folio}/estado → transición de estado
POST   /multas/expedientes/{folio}/evidencia → agregar foto georreferenciada
GET    /multas/expedientes?municipio_id=&estado=&tipo_falta= → listar con filtros
GET    /multas/dashboard/{municipio_id}   → KPIs: faltas/nivel/mes, tasa reincidencia
```

### KPIs del tablero municipal (para Ejecutor + PD&SA)

| KPI | Descripción |
|---|---|
| `expedientes_activos` | Expedientes en estado no terminal por municipio |
| `tasa_correccion_n1` | % que corrige en Nivel 1 sin llegar a multa |
| `tasa_reincidencia` | % que reincide dentro de 12 meses |
| `recaudacion_uma` | Total de UMAs emitidas vs cobradas en el periodo |
| `faltas_por_tipo` | Distribución F-01 a F-05 |
| `tiempo_resolucion_p50` | Mediana de días para cerrar expediente |

---

## VERIFICACIONES PENDIENTES ANTES DE IMPLEMENTACIÓN

- [ ] Confirmar número de artículo de LGPGIR que establece obligación de separación en fuente — [VERIFICAR EN DOF]
- [ ] Confirmar tope máximo de multas en Bando de Policía y Buen Gobierno por municipio (SLP, MTY, QRO, etc.)
- [ ] Verificar UMA vigente para el año de implementación — [INEGI, publicación anual en DOF cada febrero]
- [ ] Revisar Código Administrativo estatal de SLP / NL / QRO para plazos de resolución y notificación por estrados
- [ ] Confirmar si la Ley de Propiedad en Condominio estatal habilita la responsabilidad de la administración como sujeto obligado directo
- [ ] Revisar que los montos propuestos no excedan los topes de la Ley de Ingresos municipal vigente en cada ciudad

---

*[BORRADOR PARA REVISIÓN LEGAL] — CLC + PD&SA · ALQUIMIA · 2026-05-06*  
*No dictamen oficial. No produce efectos jurídicos. Requiere revisión por abogado con cédula profesional vigente antes de presentación ante cabildo o publicación en Periódico Oficial.*
