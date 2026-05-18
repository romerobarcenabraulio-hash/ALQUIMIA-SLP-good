/**
 * adendos.ts — Semilla/template Q-013 Sprint 1
 * Base normativa SLP + localizaciones MTY / QRO / SPGG / Corregidora / El Marqués (CLC).
 * Cada municipio activo debe usar `ciudades.{id}.adendoPropuesto` cuando exista; evita copy-paste intermunicipal.
 *
 * Los adendos definitivos los generan los agentes de ALQUIMIA; este archivo es
 * semilla estática hasta que el endpoint de agentes los sustituya.
 * [BORRADOR PARA REVISIÓN LEGAL — no produce efectos jurídicos]
 */

import type { AdendoData } from '@/types'
import { extendedCiudadesPorAdendo } from './adendosExtendedCiudades'

// Textos de artículos vigentes verificados en PDF
const MTY_ART3_EXTRACTO = `ARTÍCULO 3. Para los efectos del presente reglamento, se entiende por:
[...fracciones I-VI: Acopio, Almacenamiento, Amonestación, Aprovechamiento, Basura, Confinamiento...]
VII. Contenedor: El recipiente destinado al depósito temporal de los residuos sólidos;
[...]
XVI. Manejo Integral: las actividades de reducción en la fuente, separación, reutilización,
reciclaje, co-procesamiento, tratamiento biológico, químico, físico o térmico, acopio,
almacenamiento, transporte y disposición final de residuos, individualmente realizadas o
combinadas de manera apropiada, para adaptarse a las condiciones y necesidades de cada
lugar, cumpliendo objetivos de valorización, eficiencia sanitaria, ambiental, tecnológica,
económica y social.
[...]
XXVI. Residuos Sólidos Urbanos: los generados en las casas habitación, que resultan de la
eliminación de los materiales que utilizan en sus actividades domésticas, de los productos
que consumen y de sus envases, embalajes o empaques; los residuos que provienen de
cualquier otra actividad dentro de establecimientos o en la vía pública que genere residuos
con características domiciliarias, y los resultantes de la limpieza de las vías y lugares
públicos, siempre que no sean considerados por la Ley General para la Prevención y
Gestión Integral de los Residuos como residuo de otra índole.
XXVII. Secretaría: Secretaría de Servicios Públicos del Municipio de Monterrey.
XXVIII. Separación Primaria: acción de segregar entre sí los residuos sólidos urbanos y de
manejo especial en orgánicos e inorgánicos, en los términos de la Ley General para la
Prevención y Gestión Integral de los Residuos.
XXIX. Separación Secundaria: acción de segregar entre sí los residuos sólidos urbanos y de
manejo especial que sean inorgánicos y susceptibles de ser valorizados en los términos de la
Ley General para la Prevención y Gestión Integral de los Residuos.
[Fuente: Reglamento de Limpia Municipal de Monterrey · Gobierno 2021-2024 · Art. 3 íntegro verificado]`

const MTY_ART7_8_EXTRACTO = `ARTÍCULO 7. La recolección y traslado de la basura domiciliaria de las casas habitación,
escuelas públicas, templos, áreas de propiedad o uso municipal y dependencias oficiales
de gobierno, se realizará por la Secretaría de Servicios Públicos en los horarios que
establezca la misma Secretaría.

ARTÍCULO 8 (párrafo relevante). Los propietarios, administradores o encargados de edificios,
conjuntos habitacionales o propiedades de régimen en condominio, tendrán la obligación de
instalar en el interior de sus predios depósitos o contenedores suficientes para la basura que
se genere, debiendo ser instalados en un lugar que permita las maniobras para su adecuada
recolección. [...] En concordancia con las leyes y normas ambientales actuales, a los
habitantes del municipio de Monterrey, se les exhorta para que realicen la separación de la
basura en reciclables, orgánicos e inorgánicos y sea colocada en los recipientes que se
entregan al servicio de recolección a fin de tener un mejor manejo y destino final de la basura.

NOTA: MTY Art. 8 menciona condominios pero NO establece Modelo A / Modelo B ni recolección
diferenciada. El artículo 7 Bis es igualmente necesario en Monterrey.
[Fuente: Reglamento de Limpia Municipal de Monterrey · Gobierno 2021-2024 · Arts. 7-8 verificados]`

const MTY_ART20_EXTRACTO = `ARTÍCULO 20. Es obligación de los habitantes de Monterrey, y de las personas que
transiten por su territorio, el participar activamente en la conservación de la limpieza
de la ciudad.

I. La recolección de basura domiciliaria se hará en el horario y con la frecuencia que
determine la Secretaría de Servicios Públicos. La basura deberá ser puesta en recipientes
en buenas condiciones para que no se derrame, así como, colocarse en la banqueta
únicamente durante el día que se preste el servicio previo al paso del camión, que será
anunciado con anticipación. El peso total de la basura, incluyendo el recipiente, no
deberá exceder los 20 kilogramos.

II. Los propietarios de casa-habitación, encargados, poseedores originarios o derivados,
así como los dueños o representantes de establecimientos comerciales, industriales,
profesionales o de cualquier otra índole, tienen la obligación de mantener limpias las
fachadas, aparadores, banquetas y medias calles.

IV. Entregar los residuos urbanos no reciclables en horarios, días y modalidades
establecidos. En el caso de los residuos sólidos urbanos reciclables podrán depositarse
en las zonas verdes determinadas por la Secretaría.

NOTA: MTY Art. 20 establece obligaciones generales pero NO exige separar en 5 fracciones
ni distingue obligaciones específicas de habitantes en condominios. Las fracciones propuestas
son igualmente necesarias en MTY.
[Fuente: Reglamento de Limpia Municipal de Monterrey · Gobierno 2021-2024 · Art. 20 verificado]`

const MTY_ART8_ADMIN_EXTRACTO = `ARTÍCULO 8 (párrafo segundo — obligación de administradores de condominios):
Los propietarios, administradores o encargados de edificios, conjuntos habitacionales o
propiedades de régimen en condominio, tendrán la obligación de instalar en el interior de
sus predios depósitos o contenedores suficientes para la basura que se genere, debiendo
ser instalados en un lugar que permita las maniobras para su adecuada recolección.

DIAGNÓSTICO: Art. 8 sólo obliga a instalar depósitos/contenedores genéricos. NO asigna
obligaciones específicas de separación en 5 fracciones, información a residentes,
facilitación de inspecciones ni comunicación con la Dirección. El artículo Bis propuesto
es igualmente necesario en MTY.
[Fuente: Reglamento de Limpia Municipal de Monterrey · Gobierno 2021-2024 · Art. 8 verificado]`

const MTY_ART54_55_EXTRACTO = `ARTÍCULO 54. Con independencia de las sanciones que señalan otros reglamentos municipales,
las infracciones al presente reglamento serán sancionadas indistintamente como:
I. Amonestación.
II. Multa, cuyo monto será referido en cuotas de la Unidad de Medida y Actualización vigente
al momento de la infracción de acuerdo a lo establecido en el Tabulador de Multas.
III. La reparación del daño causado al patrimonio municipal.
IV. Retiro de la publicidad colocada en la infraestructura urbana que forma parte de la vía pública.
V. La aplicación de medidas de seguridad que pudieren consistir en la clausura temporal,
parcial o total de las instalaciones ubicadas en la vía pública que generen un riesgo, la
inmovilización, el aseguramiento o secuestro de bienes, materiales, objetos, equipos,
utensilios e instrumentos directamente relacionados con la infracción.
VI. Retiro de instalaciones ubicadas en la vía pública.
VII. Revocación de la autorización a las personas físicas o morales autorizadas para la
recolección y traslado de residuos.
VIII. Servicio Comunitario.

ARTÍCULO 55. De conformidad con lo dispuesto por la fracción II del artículo anterior, las
infracciones o faltas al presente Reglamento serán calificadas de acuerdo a las sanciones del
TABULADOR DE MULTAS [52 supuestos, sanciones de 3 a 2,000 cuotas UMA]. Los supuestos más
relevantes para RSU domiciliario incluyen multas de 3 a 50 UMAs (Art. 20 frac. I — basura
fuera de horario), 51 a 100 UMAs (Art. 20 frac. II — fachadas sucias), 200 a 400 UMAs
(Art. 37 frac. XXI — tirar basura en baldíos).

ARTÍCULO 62. En el caso de reincidencia se aplicará el doble de la multa correspondiente.

DIAGNÓSTICO: MTY tiene procedimiento completo con multas en cuotas UMA y régimen de
reincidencia. Sin embargo, NO incluye supuesto específico para "entrega de residuos mezclados
en condominio incorporado a sistema de 5 fracciones" ni escalera progresiva condominial
(Aviso → Advertencia → Multa). La técnica normativa para MTY: reformar Art. 55 para
agregar supuesto específico condominial con escalera 4→8→12 UMAs.
[Fuente: Reglamento de Limpia Municipal de Monterrey · Gobierno 2021-2024 · Arts. 54-55 verificados]`

// ─── Textos de adendos propuestos (copia literal de archivos .md CLC) ────────

const ADENDO_1_PROPUESTO = `Se adicionan las fracciones siguientes al Artículo 3 del Reglamento de Aseo Público del Municipio de San Luis Potosí, en el capítulo de definiciones, renumerando en su caso la secuencia corrida del propio artículo, para quedar como sigue:

"Fracción [X]. Vivienda en condominio / propiedad en régimen de condominio: Inmueble habitacional que forma parte de un conjunto sometido al régimen de propiedad en condominio o de un desarrollo residencial con administración común, que cuenta con áreas y servicios comunes, incluyendo espacios destinados al almacenamiento temporal de residuos sólidos urbanos."

"Fracción [X+1]. Administración de condominio: Persona física o moral designada conforme a la Ley sobre el Régimen de Propiedad en Condominio del Estado de San Luis Potosí y al reglamento interno respectivo, responsable de la operación y conservación de los bienes y servicios comunes del condominio, incluyendo la gestión de residuos sólidos urbanos en las áreas comunes."

"Fracción [X+2]. Centro de acopio condominial: Área o instalación común dentro de un condominio, debidamente autorizada por la Dirección de Ecología y Aseo Público Municipal, destinada a la recepción, separación y almacenamiento temporal de residuos sólidos urbanos generados por las viviendas que lo integran, mediante contenedores diferenciados por fracción."

"Fracción [X+3]. Sistema de separación en cinco fracciones: Esquema de clasificación de residuos sólidos urbanos que comprende, como mínimo, las fracciones siguientes: a) plásticos y otros polímeros (PET, HDPE, LDPE, PP); b) vidrio (transparente, verde, ámbar); c) metales ligeros (aluminio, hojalata, lámina); d) papel y cartón; e) materia orgánica (restos de alimentos y de jardín). El código de colores de contenedores seguirá los lineamientos de SEMARNAT vigentes."`

const ADENDO_2_PROPUESTO = `"Artículo 20 Bis. En los inmuebles habitacionales ubicados en condominios y desarrollos residenciales con administración común, el servicio de recolección de residuos sólidos urbanos se organizará con base en los esquemas siguientes:

I. Esquema Modelo A — Centro de acopio condominial: Aplicable a condominios de baja y media densidad, en el cual las viviendas entregan sus residuos sólidos urbanos separados en cinco fracciones en un centro de acopio condominial dotado de contenedores diferenciados por fracción, y el vehículo recolector presta el servicio en dicho punto conforme al calendario que emita la Dirección de Ecología y Aseo Público Municipal.

II. Esquema Modelo B — Recolección interna programada: Aplicable a condominios y desarrollos residenciales de urbanización más extensa, en el cual la administración organiza, en coordinación con la Dirección de Ecología y Aseo Público Municipal o con el concesionario del servicio, una recolección interna en que, en días determinados de la semana, se recogen exclusivamente las fracciones señaladas por la autoridad conforme al sistema de separación en cinco fracciones.

La Dirección de Ecología y Aseo Público Municipal determinará, mediante acuerdo administrativo, el esquema aplicable a cada condominio o desarrollo residencial, considerando la densidad habitacional, la infraestructura disponible, la accesibilidad para los vehículos recolectores y la capacidad operativa del Municipio o del concesionario.

Las disposiciones de este artículo serán aplicables exclusivamente a inmuebles habitacionales en régimen de condominio o desarrollos residenciales con administración común. El Ayuntamiento podrá, mediante acuerdos posteriores y en función de su capacidad operativa y madurez institucional, extender gradualmente el sistema de separación en cinco fracciones a otras tipologías de vivienda y zonas urbanas."`

const ADENDO_3_PROPUESTO = `Se adicionan las fracciones siguientes al ARTÍCULO 73 del Reglamento de Aseo Público del Municipio de San Luis Potosí (Capítulo I del Título Tercero — obligaciones de los habitantes), sin perjuicio de reformar en el mismo decreto el párrafo de separación del ARTÍCULO 21 cuando el condominio esté sujeto al sistema de cinco fracciones, para quedar como sigue:

"Son obligaciones adicionales de los habitantes de viviendas ubicadas en condominios y desarrollos residenciales con administración común:

Fracción XVII. Separar los residuos sólidos urbanos que generen en su vivienda, conforme al sistema de separación en cinco fracciones definido en el presente Reglamento y en los lineamientos técnicos que emita la Dirección de Ecología y Aseo Público Municipal, y depositarlos en los contenedores diferenciados que se instalen en el centro de acopio condominial o en los puntos de recolección interna programada.

Fracción XVIII. Abstenerse de entregar residuos sólidos urbanos mezclados en las áreas comunes o al servicio de recolección, cuando el condominio en que habiten se encuentre incorporado a los esquemas de separación establecidos en el Artículo 20 Bis del presente Reglamento.

Fracción XIX. Atender las indicaciones de la administración del condominio y de la Dirección de Ecología y Aseo Público Municipal respecto de horarios, puntos de entrega y reglas de separación de residuos sólidos urbanos."`

const ADENDO_4_PROPUESTO = `"Artículo 21 Bis. Las administraciones de condominios y desarrollos residenciales con administración común tendrán, además de las obligaciones que establezcan la Ley sobre el Régimen de Propiedad en Condominio del Estado de San Luis Potosí y sus reglamentos internos, las obligaciones siguientes en materia de residuos sólidos urbanos:

I. Implementar y mantener en operación un centro de acopio condominial o, en su caso, un sistema de recolección interna programada, conforme al esquema que determine la Dirección de Ecología y Aseo Público Municipal, según lo establecido en el Artículo 20 Bis del presente Reglamento.

II. Instalar y conservar en buen estado contenedores diferenciados por fracción de residuos, conforme al sistema de separación en cinco fracciones y al código de colores y especificaciones técnicas que emita la Dirección de Ecología y Aseo Público Municipal.

III. Informar a las personas habitantes del condominio sobre sus obligaciones de separación, horarios y puntos de entrega, mediante reglamento interno, circulares y señalización visible en las áreas comunes.

IV. Facilitar las labores de supervisión, inspección y verificación de la Dirección de Ecología y Aseo Público Municipal y de la autoridad competente, incluyendo el acceso a las áreas de contenedores y centros de acopio, y atender las observaciones que se emitan.

V. Comunicar oportunamente a la Dirección de Ecología y Aseo Público Municipal las incidencias relevantes en la operación del sistema de separación y recolección, para efectos de ajuste de rutas, contenedores o calendarios."`

const ADENDO_5_PROPUESTO = `"Artículo [●]. De la fiscalización y sanción por incumplimiento de separación en condominios sujetos al sistema de cinco fracciones. **Nota de encaje (SLP 2017):** el artículo 37 del reglamento vigente ya establece la naturaleza del servicio público de limpia; la numeración del presente precepto debe asignar el Cabildo al integrar el bloque sancionador sin colisión con el 37 material ni con el Catálogo/Bando ya citados en el Título Tercero.

El Municipio y, en su caso, el concesionario del servicio de recolección de residuos sólidos urbanos, estarán facultados para documentar y reportar a la autoridad competente los incumplimientos a las obligaciones de separación y presentación de residuos previstas en el presente Reglamento, mediante la obtención de evidencia fotográfica u otros medios de prueba idóneos, con registro de geolocalización, fecha y hora automáticas.

Nivel 1 — Aviso (primera documentación):
Se notifica al habitante o a la administración del condominio. Registro en el sistema digital con folio único. Sin costo económico. Efecto: inicia el expediente del infractor.

Nivel 2 — Advertencia formal (segundo incumplimiento del mismo tipo dentro de 30 días naturales):
Se emite advertencia escrita con plazo de corrección de 15 días hábiles. Registro en expediente. Sin multa — registro acumulable para activar el Nivel 3.

Nivel 3 — Multa económica (tercer incumplimiento o reincidencia tras advertencia formal):
- Primera multa: 4 UMAs (cuotas conforme a la UMA anual publicada por el INEGI).
- Segunda multa (reincidencia): 8 UMAs.
- Tercera multa y subsecuentes: 12 UMAs fijas por evento.
El valor en moneda nacional se determina multiplicando las cuotas UMA por el valor oficial vigente; las cantidades deben actualizarse año con año sin aproximaciones meramente ilustrativas en actos administrativos.

Causales de infracción:
a) No separar: Entregar residuos mezclados en contenedores o al servicio de recolección cuando el condominio esté incorporado al sistema de separación en cinco fracciones.
b) Contenedor incorrecto: Depositar una fracción en el contenedor de otra.
c) Incumplir horarios: No respetar los días y horarios de recolección diferenciada establecidos por la Dirección de Ecología y Aseo Público Municipal.
d) Obstruir supervisión: Impedir el acceso del personal de inspección a las áreas de contenedores o centros de acopio.

Se considera reincidencia cuando el infractor cometa la misma falta dentro de un periodo menor a 12 meses calendario contados desde la última sanción notificada.

La multa es recurrible ante la autoridad municipal competente, garantizando en todo momento el derecho de audiencia previsto en el artículo 14 de la Constitución Política de los Estados Unidos Mexicanos."`

const ADENDO_6_PROPUESTO = `TRANSITORIO PRIMERO — Vigencia.
El presente decreto entra en vigor al día siguiente de su publicación en el Periódico Oficial del Estado y/o en la Gaceta u órgano de difusión normativa municipal que resulte competente para San Luis Potosí, salvo las disposiciones cuya entrada en vigor escalonada se establezca en los transitorios siguientes.

TRANSITORIO SEGUNDO — Implementación gradual por tamaño de condominio.
Primera etapa: Condominios y desarrollos residenciales con 50 o más unidades habitacionales — 90 días naturales.
Segunda etapa: Condominios y desarrollos residenciales con 20 a 49 unidades habitacionales — 180 días naturales.
Tercera etapa: Condominios y desarrollos residenciales con menos de 20 unidades habitacionales — 365 días naturales.

El Ayuntamiento habilitará las rutas de recolección diferenciada y proveerá la señalización de contenedores en cada zona antes del inicio del plazo de la etapa correspondiente.

TRANSITORIO TERCERO — Periodo exclusivo de avisos educativos.
Durante los primeros 180 días naturales posteriores a la entrada en vigor de cada etapa para los sujetos obligados correspondientes, el régimen sancionatorio operará únicamente mediante el Nivel 1 (Aviso) y el Nivel 2 (Advertencia formal). No se aplicarán multas económicas sino hasta cumplido ese plazo y siempre que el generador haya recibido al menos una advertencia formal documentada en expediente.

TRANSITORIO CUARTO — Programa Municipal de Implementación.
La Dirección de Ecología y Aseo Público Municipal, en coordinación con la Dirección Jurídica y la Tesorería, elaborará dentro de los 60 días naturales posteriores a la publicación del presente decreto un Programa Municipal de Implementación Gradual.

TRANSITORIO QUINTO — Derogación.
Se derogan las disposiciones del ordenamiento municipal de San Luis Potosí (incluyendo, en su caso, el Bando de Policía y Buen Gobierno y demás normativa aplicable) que resulten contrarias al presente decreto en materia de gestión de residuos sólidos urbanos en condominios y desarrollos residenciales.

TRANSITORIO SEXTO — Difusión.
El Ayuntamiento difundirá el presente decreto en lenguaje accesible y con material gráfico explicativo a través de medios oficiales, plataforma digital municipal y canales de comunicación directa con administraciones de condominios, dentro de los 30 días naturales siguientes a su publicación.`

// ─── Localización CLC: separar propuesta ALQUIMIA vs texto base SLP ─────────

const NOTA_PROPUESTA_ALQUIMIA_NO_EFECTOS =
  '\n\n—\nNOTA DE VIGENCIA (propuesta ALQUIMIA · borrador): lo anterior **no surte efectos jurídicos** hasta su aprobación por el Ayuntamiento competente, publicación en el órgano oficial correspondiente y observancia del debido proceso; requiere **cotejo** con el PDF íntegro y dictamen de la Dirección Jurídica municipal.'

const QRO_NOMBRE_REG =
  'Reglamento de Limpia y Aseo Público del Municipio de Querétaro, Querétaro'

const QRO_SINTESIS_MARCO_NORMATIVO = `MARCO NORMATIVO EXISTENTE (síntesis CLC — no constituye cita literal).
El reglamento municipal de limpia y aseo **sí contiene** obligaciones y un esquema de infracciones/fiscalización aplicable a generadores, condominios y bienes privados; incluye definiciones (capítulo inicial), disposiciones vinculadas al régimen de condominio (referencia de trabajo: Art. 15 y correlativos), obligaciones (ref. Art. 16), acumulación en predios/baldíos (ref. Art. 17), prohibiciones (ref. Art. 18) e inspección/sanciones (refs. Arts. 8 a 11 — **verificar numeración, títulos y tabuladores en el PDF oficial publicado por el municipio**).

BRECHA JURÍDICO-OPERATIVA (no “ausencia normativa total”): hace falta **instrumentar** con precisión el sistema de cinco fracciones SEMARNAT en condominio, rutas A/B, cadena probatoria digital, expediente verificable y transitorios graduales, alineados al tabulador y procedimientos ya previstos. Para Querétaro capital, la mejora no consiste en inventar nueva sancionalidad, sino en fortalecer evidencia, trazabilidad y encaje operativo con el régimen municipal existente.`

const MAR_TEXTO_FUENTE_PENDIENTE =
  'Reglamento de limpia/RSU de El Marqués, Qro.: **PDF** y mapeo artículo por artículo **pendientes** en el repositorio ALQUIMIA. No se presume vacío absoluto de norma municipal; se suspende la localización de adendos hasta anexar fuente oficial.'

const MAR_ADENDO_BORRADOR =
  `[BORRADOR ALQUIMIA — Municipio de El Marqués, Qro.]\n` +
  `Antes de redactar adendos, debe colocarse en REGLAMENTOS_BASE el texto vigente y repetir el ejercicio de encaje (definiciones, condominio, obligaciones, sanciones, transitorios). **No** copiar literalmente texto de Querétaro capital ni de otros municipios.\n` +
  NOTA_PROPUESTA_ALQUIMIA_NO_EFECTOS

/** Monterrey, N.L.: misma estructura que SLP con remisiones al reglamento de limpia local (Arts. 3, 7 Bis, 8 Bis, etc.). */
function localizeAdendoMty(slp: string): string {
  return (
    slp
      .replace(
        /Se adicionan las fracciones siguientes al ARTÍCULO 73 del Reglamento de Aseo Público del Municipio de San Luis Potosí \(Capítulo I del Título Tercero — obligaciones de los habitantes\), sin perjuicio de reformar en el mismo decreto el párrafo de separación del ARTÍCULO 21 cuando el condominio esté sujeto al sistema de cinco fracciones, para quedar como sigue:/g,
        'Se adicionan las fracciones siguientes al Artículo 20 del Reglamento de Limpia Municipal de Monterrey (obligaciones de habitantes y condominios conforme permita el texto local), sin perjuicio de reformar preceptos sobre separación en origen cuando proceda, para quedar como sigue:',
      )
      .replace(/Reglamento de Aseo Público del Municipio de San Luis Potosí/g, 'Reglamento de Limpia Municipal de Monterrey')
      .replace(/Dirección de Ecología y Aseo Público Municipal/g, 'Secretaría de Servicios Públicos del Municipio de Monterrey')
      .replace(/Dirección de Aseo Público/g, 'Secretaría de Servicios Públicos del Municipio de Monterrey')
      .replace(/Ley sobre el Régimen de Propiedad en Condominio del Estado de San Luis Potosí/g, 'Ley que Regula el Régimen de Propiedad en Condominio del Estado de Nuevo León')
      .replace(/"Artículo 20 Bis\./g, '"Artículo 7 Bis.')
      .replace(/ el Artículo 20 Bis del presente Reglamento/g, ' el Artículo 7 Bis del presente Reglamento')
      .replace(/ el Artículo 20 Bis /g, ' el Artículo 7 Bis ')
      .replace(/"Artículo 21 Bis\./g, '"Artículo 8 Bis.')
      .replace(
        /El presente decreto entra en vigor al día siguiente de su publicación en el Periódico Oficial del Estado y\/o en la Gaceta u órgano de difusión normativa municipal que resulte competente para San Luis Potosí/g,
        'El presente decreto entra en vigor al día siguiente de su publicación en el medio de difusión normativa estatal y/o municipal competente para Monterrey, Nuevo León',
      )
      .replace(
        /Se derogan las disposiciones del ordenamiento municipal de San Luis Potosí \(incluyendo, en su caso, el Bando de Policía y Buen Gobierno y demás normativa aplicable\) que resulten contrarias/g,
        'Se derogan las disposiciones del ordenamiento municipal de Monterrey que resulten contrarias',
      )
      .replace(/Programa Municipal de Implementación Gradual\./g, 'Programa Municipal de Implementación Gradual para Monterrey.')
  ) + NOTA_PROPUESTA_ALQUIMIA_NO_EFECTOS
}

/** Querétaro capital: encaje sobre reglamento de limpia y aseo; enfatiza que la madurez pendiente es probatoria/operativa. */
function localizeAdendoQro(slp: string): string {
  return (
    slp
      .replace(
        /Se adicionan las fracciones siguientes al ARTÍCULO 73 del Reglamento de Aseo Público del Municipio de San Luis Potosí \(Capítulo I del Título Tercero — obligaciones de los habitantes\), sin perjuicio de reformar en el mismo decreto el párrafo de separación del ARTÍCULO 21 cuando el condominio esté sujeto al sistema de cinco fracciones, para quedar como sigue:/g,
        `Se adicionan las fracciones siguientes al Artículo 16 del ${QRO_NOMBRE_REG}, sin perjuicio de reformar el bloque aplicable a generadores en condominio (cotejar numeración en PDF oficial), para quedar como sigue:`,
      )
      .replace(/Reglamento de Aseo Público del Municipio de San Luis Potosí/g, QRO_NOMBRE_REG)
      .replace(/Dirección de Ecología y Aseo Público Municipal/g, 'Secretaría de Servicios Públicos Municipales del Municipio de Querétaro')
      .replace(/Dirección de Aseo Público/g, 'Secretaría de Servicios Públicos Municipales del Municipio de Querétaro')
      .replace(/Ley sobre el Régimen de Propiedad en Condominio del Estado de San Luis Potosí/g, 'Ley que Regula el Régimen de Propiedad en Condominio del Estado de Querétaro')
      .replace(/Se adicionan las fracciones siguientes al Artículo 3 /g, 'Se adicionan las fracciones siguientes al Artículo 2 ')
      .replace(/Se adicionan las fracciones siguientes al Artículo 4 /g, 'Se adicionan las fracciones siguientes al Artículo 2 ')
      .replace(
        /"Artículo 20 Bis\./g,
        '"Artículo [●] Bis (ubicación sugerida: inmediatamente después de las disposiciones sobre condominio — ref. Art. 15; verificar numeración en fuente oficial).',
      )
      .replace(/ el Artículo 20 Bis del presente Reglamento/g, ' el citado artículo Bis del presente Reglamento')
      .replace(/ el Artículo 20 Bis /g, ' el citado artículo Bis ')
      .replace(/Se adicionan las fracciones siguientes al Artículo 21 /g, 'Se adicionan las fracciones siguientes al Artículo 16 ')
      .replace(
        /"Artículo 21 Bis\./g,
        '"Artículo [●] Bis (obligaciones de administraciones — concordar con Arts. 15 y 16; verificar numeración).',
      )
      .replace(
        /"Artículo \[●\]\. De la fiscalización y sanción/g,
        '"Lineamiento técnico probatorio [●] (ubicación sugerida: capítulo operativo o anexo técnico; verificar encaje con Arts. 8-11 y tabulador existente). De la evidencia y expediente para fiscalización',
      )
      .replace(
        /El presente decreto entra en vigor al día siguiente de su publicación en el Periódico Oficial del Estado y\/o en la Gaceta u órgano de difusión normativa municipal que resulte competente para San Luis Potosí/g,
        'El presente decreto entra en vigor al día siguiente de su publicación en el órgano de difusión normativa estatal y/o municipal competente para Querétaro',
      )
      .replace(
        /Se derogan las disposiciones del ordenamiento municipal de San Luis Potosí \(incluyendo, en su caso, el Bando de Policía y Buen Gobierno y demás normativa aplicable\) que resulten contrarias/g,
        'Se derogan las disposiciones del ordenamiento municipal de la capital queretana que resulten contrarias',
      )
  ) + NOTA_PROPUESTA_ALQUIMIA_NO_EFECTOS
}

/** San Pedro G.G., N.L. — numeración [VERIFICAR] hasta anexar PDF íntegro en repo. */
function localizeAdendoSpg(slp: string): string {
  return (
    slp
      .replace(
        /Se adicionan las fracciones siguientes al ARTÍCULO 73 del Reglamento de Aseo Público del Municipio de San Luis Potosí \(Capítulo I del Título Tercero — obligaciones de los habitantes\), sin perjuicio de reformar en el mismo decreto el párrafo de separación del ARTÍCULO 21 cuando el condominio esté sujeto al sistema de cinco fracciones, para quedar como sigue:/g,
        'Se adicionan las fracciones siguientes al artículo aplicable a obligaciones de generadores y habitantes [VERIFICAR numeración en el PDF RSU SPGG vigente 2024–2025], sin perjuicio de reformar preceptos de condominio, para quedar como sigue:',
      )
      .replace(
        /Reglamento de Aseo Público del Municipio de San Luis Potosí/g,
        'Reglamento para el Manejo de Residuos Sólidos Urbanos y Aseo Público del Municipio de San Pedro Garza García, Nuevo León',
      )
      .replace(/Dirección de Ecología y Aseo Público Municipal/g, 'la Secretaría de Servicios Públicos y, en su caso, la instancia municipal de protección ambiental competente [VERIFICAR organigrama vigente]')
      .replace(
        /Dirección de Aseo Público/g,
        'la Secretaría de Servicios Públicos y, en su caso, la instancia municipal de protección ambiental competente [VERIFICAR organigrama vigente]',
      )
      .replace(/Ley sobre el Régimen de Propiedad en Condominio del Estado de San Luis Potosí/g, 'Ley que Regula el Régimen de Propiedad en Condominio del Estado de Nuevo León')
      .replace(/Se adicionan las fracciones siguientes al Artículo 4 /g, 'Se adicionan las fracciones siguientes al Artículo 3 [VERIFICAR capítulo de definiciones en PDF SPGG] ')
      .replace(/"Artículo 20 Bis\./g, '"Artículo [●] Bis [VERIFICAR; articular con arts. 21–23 de RSU en PDF].')
      .replace(/ el Artículo 20 Bis del presente Reglamento/g, ' el citado artículo Bis del presente Reglamento')
      .replace(/ el Artículo 20 Bis /g, ' el citado artículo Bis ')
      .replace(/Se adicionan las fracciones siguientes al Artículo 21 /g, 'Se adicionan las fracciones siguientes al artículo de obligaciones de generadores/habitantes [VERIFICAR no. en PDF SPGG] ')
      .replace(/"Artículo 21 Bis\./g, '"Artículo [●] Bis [VERIFICAR — obligacion administraciones condominio].')
      .replace(
        /"Artículo \[●\]\. De la fiscalización y sanción/g,
        '"Infracción específica [VERIFICAR artículo de sanciones en PDF SPGG]. De la fiscalización y sanción',
      )
      .replace(
        /El presente decreto entra en vigor al día siguiente de su publicación en el Periódico Oficial del Estado y\/o en la Gaceta u órgano de difusión normativa municipal que resulte competente para San Luis Potosí/g,
        'El presente decreto entra en vigor al día siguiente de su publicación en el medio oficial competente (Gaceta municipal y/o estatal, según proceda) para San Pedro Garza García',
      )
      .replace(
        /Se derogan las disposiciones del ordenamiento municipal de San Luis Potosí \(incluyendo, en su caso, el Bando de Policía y Buen Gobierno y demás normativa aplicable\) que resulten contrarias/g,
        'Se derogan las disposiciones del ordenamiento municipal de San Pedro Garza García que resulten contrarias',
      )
  ) + NOTA_PROPUESTA_ALQUIMIA_NO_EFECTOS
}

/** Corregidora, Qro. */
function localizeAdendoCor(slp: string): string {
  return (
    slp
      .replace(
        /Se adicionan las fracciones siguientes al ARTÍCULO 73 del Reglamento de Aseo Público del Municipio de San Luis Potosí \(Capítulo I del Título Tercero — obligaciones de los habitantes\), sin perjuicio de reformar en el mismo decreto el párrafo de separación del ARTÍCULO 21 cuando el condominio esté sujeto al sistema de cinco fracciones, para quedar como sigue:/g,
        'Se adicionan las fracciones siguientes al artículo de obligaciones aplicables en Corregidora [VERIFICAR numeración en PDF local], sin perjuicio de reformar preceptos de condominio, para quedar como sigue:',
      )
      .replace(
        /Reglamento de Aseo Público del Municipio de San Luis Potosí/g,
        'Reglamento de Servicios Públicos Municipales y/o instrumento ambiental del Municipio de Corregidora, Querétaro [VERIFICAR título y año en POE/PDF oficial]',
      )
      .replace(/Dirección de Ecología y Aseo Público Municipal/g, 'Dirección de Servicios Públicos Municipales de Corregidora [VERIFICAR denominación en cabildo vigente]')
      .replace(
        /Dirección de Aseo Público/g,
        'Dirección de Servicios Públicos Municipales de Corregidora [VERIFICAR denominación en cabildo vigente]',
      )
      .replace(/Ley sobre el Régimen de Propiedad en Condominio del Estado de San Luis Potosí/g, 'Ley que Regula el Régimen de Propiedad en Condominio del Estado de Querétaro')
      .replace(/Se adicionan las fracciones siguientes al Artículo 3 /g, 'Se adicionan las fracciones siguientes al artículo de definiciones [VERIFICAR numeración local] ')
      .replace(/Se adicionan las fracciones siguientes al Artículo 4 /g, 'Se adicionan las fracciones siguientes al artículo de definiciones [VERIFICAR numeración local] ')
      .replace(/"Artículo 20 Bis\./g, '"Artículo [●] Bis [VERIFICAR ubicación en reglamento Corregidora].')
      .replace(/ el Artículo 20 Bis del presente Reglamento/g, ' el citado artículo Bis del presente Reglamento')
      .replace(/ el Artículo 20 Bis /g, ' el citado artículo Bis ')
      .replace(/Se adicionan las fracciones siguientes al Artículo 21 /g, 'Se adicionan las fracciones siguientes al artículo de obligaciones aplicables [VERIFICAR numeración local] ')
      .replace(/"Artículo 21 Bis\./g, '"Artículo [●] Bis [VERIFICAR].')
      .replace(
        /"Artículo \[●\]\. De la fiscalización y sanción/g,
        '"Supuesto de fiscalización/sanción [VERIFICAR capítulo local]. De la fiscalización y sanción',
      )
      .replace(
        /El presente decreto entra en vigor al día siguiente de su publicación en el Periódico Oficial del Estado y\/o en la Gaceta u órgano de difusión normativa municipal que resulte competente para San Luis Potosí/g,
        'El presente decreto entra en vigor al día siguiente de su publicación en el órgano oficial competente para Corregidora, Querétaro',
      )
      .replace(
        /Se derogan las disposiciones del ordenamiento municipal de San Luis Potosí \(incluyendo, en su caso, el Bando de Policía y Buen Gobierno y demás normativa aplicable\) que resulten contrarias/g,
        'Se derogan las disposiciones del Municipio de Corregidora que resulten contrarias',
      )
  ) + NOTA_PROPUESTA_ALQUIMIA_NO_EFECTOS
}

/** Monterrey: reforma al Tabulador (Art. 55), no un artículo Bis nuevo paralelo al encaje fiscalización/sanción de SLP [●]. */
const ADENDO_5_PROPUESTO_MTY =
  `TÉCNICA NORMATIVA SUGERIDA (Monterrey, Nuevo León): **reforma** al artículo 55 del Reglamento de Limpia Municipal de Monterrey y, en su caso, Concordancia con los arts. 54 y 62 del mismo ordenamiento, para **adicionar** al Tabulador de Multas un supuesto específico de incumplimiento del esquema de separación en cinco fracciones en condominios incorporados al sistema, **sin desplazar** los demás incisos del Tabulador.

La Secretaría de Servicios Públicos del Municipio de Monterrey y, en su caso, el concesionario del servicio de recolección, documentarán incumplimientos mediante evidencia fotográfica u otros medios idóneos, con metadatos de georreferencia, fecha y hora.

Nivel 1 — Aviso documentado (primera constancia):
Notificación al habitante o a la administración del condominio; registro con folio. Sin multa. Efecto: apertura de expediente.

Nivel 2 — Advertencia formal (segunda constancia del mismo tipo en 30 días naturales):
Aviso por escrito y plazo de corrección de 15 días hábiles. Sin multa acumulable de cuotas hasta agotar la etapa educativa conforme a transitorios.

Nivel 3 — Multa vía Tabulador reformado (tercera constancia o reincidencia tras advertencia):
Cuotas en términos de UMA conforme **nuevo inciso** del Tabulador, con **escala orientativa** de 4 → 8 → 12 UMA por evento, respetando topes y técnica de integración que apruebe el Cabildo (coherente con arts. 54–62).

Causales de infracción:
a) Entregar residuos mezclados cuando el condominio esté incorporado al sistema de cinco fracciones.
b) Depositar una fracción en contenedor de otra.
c) Incumplir horarios de recolección diferenciada establecidos por la Secretaría.
d) Obstruir inspección en áreas de contenedores o centros de acopio.

Reincidencia: aplicar el artículo 62 del reglamento local (doble de multa) **solo** en la medida en que sea jurídicamente compatible con el nuevo inciso y sin doble sanción prohibida.

La sanción será recurrible ante la autoridad municipal competente, con garantía de audiencia (artículo 14 constitucional).` +
  NOTA_PROPUESTA_ALQUIMIA_NO_EFECTOS

/** Querétaro capital: no afirmar vacío legal ni proponer nueva sancionalidad; madurar evidencia y expediente. */
const ADENDO_5_PROPUESTO_QRO =
  `TÉCNICA OPERATIVA SUGERIDA (Querétaro capital): el ${QRO_NOMBRE_REG} **ya prevé** infracciones, inspección y sanciones. Esta propuesta ALQUIMIA **no crea** sancionalidad nueva, no propone una escala UMA paralela y no sustituye el tabulador o procedimiento municipal existente. Su objetivo es madurar la evidencia y el expediente para que, cuando proceda, la autoridad competente pueda aplicar el régimen queretano vigente con trazabilidad suficiente.

Ruta de mejora sugerida: emitir lineamiento/protocolo técnico probatorio o anexo operativo, sin desplazar el reglamento ni convertir esta propuesta en acto oficial.

1. Evidencia mínima: fotografía o registro verificable, fecha/hora, georreferencia, ruta o zona, inspector/operador responsable, tipo de residuo **RSU municipal**, vínculo con condominio o predio y descripción del hecho observado.
2. Cadena administrativa: folio, bitácora, resguardo, responsable de captura, responsable de revisión, posibilidad de corrección educativa y estado del expediente.
3. Integración de expediente: acta o reporte operativo, evidencia de notificación cuando aplique, reincidencia documentada si existe, trazabilidad de seguimiento y remisión a la autoridad competente.
4. Armonización: toda multa, medida o determinación formal se define conforme al reglamento, tabulador y procedimiento queretano vigentes; ALQUIMIA solo sugiere estándares de evidencia, trazabilidad y mejora operativa.

No se proponen cuotas 4/8/12 UMA para Querétaro capital. Si el municipio decide ajustar tabulador, procedimiento o técnica normativa, eso corresponde a revisión jurídica municipal, dictamen competente y aprobación del Ayuntamiento.` +
  NOTA_PROPUESTA_ALQUIMIA_NO_EFECTOS

// ─── Datos completos de los 6 adendos ────────────────────────────────────────

const ADENDOS_BASE: AdendoData[] = [
  {
    id: 1,
    titulo: 'Definiciones (Condominio, Administración, Centro de Acopio, 5 Fracciones)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público para el Municipio de San Luis Potosí',
        anio: 2017,
        numeroArticulo: 'Art. 3 (definiciones — adición; el Art. 4 regula servicios de limpia, no definiciones)',
        textoVigente:
          'Espejo en repo: `REGLAMENTOS DE ASEO PUBBLICO/REGLAMENTO DE ASEO PÚBLICO PARA EL MUNICIPIO DE SAN LUIS POTOSI.pdf` — publicado 5-ene-2017. Art. 3: definiciones (ej. Coordinación de Aseo Público; Dirección de Ecología y Aseo Público). Art. 4: alcance de “servicios de limpia”. Autoridad: Dirección de Ecología y Aseo Público Municipal y Coordinación de Aseo Público.',
        pdfCargado: true,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Art. 3 (35 fracciones — verificado)',
        textoVigente: MTY_ART3_EXTRACTO,
        pdfCargado: true,
        adendoPropuesto: localizeAdendoMty(ADENDO_1_PROPUESTO),
      },
      qro: {
        nombreReglamento: QRO_NOMBRE_REG,
        anio: 2021,
        numeroArticulo: 'Art. 2 (adición de fracciones — verificar en PDF oficial)',
        textoVigente: QRO_SINTESIS_MARCO_NORMATIVO,
        pdfCargado: false,
        adendoPropuesto: localizeAdendoQro(ADENDO_1_PROPUESTO),
      },
      spg: {
        nombreReglamento:
          'Reglamento para el Manejo de Residuos Sólidos Urbanos y Aseo Público del Municipio de San Pedro Garza García, N.L. [VERIFICAR título en Gaceta/PDF]',
        anio: 2009,
        numeroArticulo: 'Art. 3 (definiciones — [VERIFICAR en PDF RSU SPGG])',
        textoVigente:
          'MARCO DE REFERENCIA: instrumento municipal de RSU y aseo / Ambiental SPGG — requiere cotejo PDF íntegro en repo; no usar solo Reglamento Ambiental 2009 como sustituto sin verificar instrumento RSU aplicable.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoSpg(ADENDO_1_PROPUESTO),
      },
      cor: {
        nombreReglamento:
          'Reglamento de Servicios Públicos Municipales / normativa ambiental del Municipio de Corregidora, Qro. [VERIFICAR titulación]',
        anio: 2020,
        numeroArticulo: 'Definiciones [VERIFICAR artículo en PDF]',
        textoVigente:
          'Pendiente extracto verificado del instrumento corregidorense; prioridad: no copiar numeración de Querétaro capital.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoCor(ADENDO_1_PROPUESTO),
      },
      mar: {
        nombreReglamento: 'Reglamento de Limpia Municipal u homólogo (El Marqués, Qro.) [VERIFICAR]',
        anio: 2015,
        numeroArticulo: '[VERIFICAR]',
        textoVigente: MAR_TEXTO_FUENTE_PENDIENTE,
        pdfCargado: false,
        adendoPropuesto: MAR_ADENDO_BORRADOR,
      },
    },
    adendoPropuesto: ADENDO_1_PROPUESTO,
    efectoOperativo:
      'Diferencia jurídicamente el universo de condominios del resto del municipio. Crea figuras definitorias que anclan obligaciones, modelos A/B y fiscalización. Sin estas definiciones, los artículos sustantivos carecen de sujeto y objeto normativo claro.',
    estadoBorrador: true,
  },
  {
    id: 2,
    titulo: 'Esquemas de Separación en Condominios (Modelos A y B)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público para el Municipio de San Luis Potosí',
        anio: 2017,
        numeroArticulo: 'Art. 20 Bis (nuevo; ref. recolección Arts. 20–26 y Art. 26 condominios)',
        textoVigente:
          'PDF 2017: Cap. III Arts. 20-22 regulan recolección domiciliaria; Art. 21 obliga separación orgánica/inorgánica en casas habitación; Art. 26 condominios no municipalizados. El Bis propuesto instrumenta modelos A/B y cinco fracciones sin sustituir de un solo golpe el binomio vigente hasta reforma expresa.',
        pdfCargado: true,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Art. 7 Bis (nuevo — ref. Arts. 7 y 8)',
        textoVigente: MTY_ART7_8_EXTRACTO,
        pdfCargado: true,
        adendoPropuesto: localizeAdendoMty(ADENDO_2_PROPUESTO),
      },
      qro: {
        nombreReglamento: QRO_NOMBRE_REG,
        anio: 2021,
        numeroArticulo:
          'Art. [●] Bis sugerido (posterior a condominio — ref. Art. 15; verificar PDF)',
        textoVigente: QRO_SINTESIS_MARCO_NORMATIVO,
        pdfCargado: false,
        adendoPropuesto: localizeAdendoQro(ADENDO_2_PROPUESTO),
      },
      spg: {
        nombreReglamento:
          'Reglamento para el Manejo de Residuos Sólidos Urbanos y Aseo Público del Municipio de San Pedro Garza García, N.L. [VERIFICAR]',
        anio: 2009,
        numeroArticulo: 'Art. [●] Bis [VERIFICAR tras arts. 21–23 RSU]',
        textoVigente:
          'Pendiente cotejo PDF RSU SPGG para ubicar ancla de recolección en condominios.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoSpg(ADENDO_2_PROPUESTO),
      },
      cor: {
        nombreReglamento:
          'Reglamento de Servicios Públicos Municipales y/o ambiental (Corregidora) [VERIFICAR]',
        anio: 2020,
        numeroArticulo: 'Art. [●] Bis [VERIFICAR]',
        textoVigente: 'Pendiente mapeo local; no asumir texto de la capital.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoCor(ADENDO_2_PROPUESTO),
      },
      mar: {
        nombreReglamento: 'Reglamento homólogo El Marqués [VERIFICAR]',
        anio: 2015,
        numeroArticulo: '[VERIFICAR]',
        textoVigente: MAR_TEXTO_FUENTE_PENDIENTE,
        pdfCargado: false,
        adendoPropuesto: MAR_ADENDO_BORRADOR,
      },
    },
    adendoPropuesto: ADENDO_2_PROPUESTO,
    efectoOperativo:
      'Formaliza dos modelos de servicio diferenciados para condominios y otorga a la autoridad municipal de limpia base jurídica para asignar Modelo A o B conforme a densidad e infraestructura. Sin este artículo, no hay regla clara de operación de centros de acopio ni rutas diferenciadas.',
    estadoBorrador: true,
  },
  {
    id: 3,
    titulo: 'Obligaciones de Habitantes de Condominios (Separar, No Mezclar, Respetar Horarios)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público para el Municipio de San Luis Potosí',
        anio: 2017,
        numeroArticulo: 'Art. 73 (adición fracs. XVII–XIX; coherente con título tercero) + reforma acorde Art. 21',
        textoVigente:
          'PDF 2017: obligaciones generales de habitantes en Art. 73 (fracs. I–XVI); ya existe separación binaria org./inorg. (ej. fracc. XIV). Art. 21 párr. usuarios separan org./inorg. El paquete ALQUIMIA ubica obligaciones específicas condominiales en 73 XVII-XIX y puede reformar 21 para cinco fracciones donde aplique.',
        pdfCargado: true,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Art. 20 (adición fracciones — verificado)',
        textoVigente: MTY_ART20_EXTRACTO,
        pdfCargado: true,
        adendoPropuesto: localizeAdendoMty(ADENDO_3_PROPUESTO),
      },
      qro: {
        nombreReglamento: QRO_NOMBRE_REG,
        anio: 2021,
        numeroArticulo: 'Art. 16 (adición de fracciones — verificar PDF)',
        textoVigente: QRO_SINTESIS_MARCO_NORMATIVO,
        pdfCargado: false,
        adendoPropuesto: localizeAdendoQro(ADENDO_3_PROPUESTO),
      },
      spg: {
        nombreReglamento:
          'Reglamento para el Manejo de Residuos Sólidos Urbanos y Aseo Público del Municipio de San Pedro Garza García, N.L. [VERIFICAR]',
        anio: 2009,
        numeroArticulo: 'Art. [●] [VERIFICAR arts. 21–23]',
        textoVigente: 'Pendiente extracto PDF SPGG.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoSpg(ADENDO_3_PROPUESTO),
      },
      cor: {
        nombreReglamento:
          'Reglamento de Servicios Públicos Municipales y/o ambiental (Corregidora) [VERIFICAR]',
        anio: 2020,
        numeroArticulo: 'Obligaciones [VERIFICAR no.]',
        textoVigente: 'Pendiente mapeo local.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoCor(ADENDO_3_PROPUESTO),
      },
      mar: {
        nombreReglamento: 'Reglamento homólogo El Marqués [VERIFICAR]',
        anio: 2015,
        numeroArticulo: '[VERIFICAR]',
        textoVigente: MAR_TEXTO_FUENTE_PENDIENTE,
        pdfCargado: false,
        adendoPropuesto: MAR_ADENDO_BORRADOR,
      },
    },
    adendoPropuesto: ADENDO_3_PROPUESTO,
    efectoOperativo:
      'La fracción de separar crea el deber positivo; la de no mezclar habilita la sanción por entrega impropia; la de coordinación fija la cadena condominio → autoridad. Sin estas tres, el régimen sancionador carece de causalidad jurídica clara.',
    estadoBorrador: true,
  },
  {
    id: 4,
    titulo: 'Obligaciones de Administraciones de Condominio (5 Obligaciones RSU)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público para el Municipio de San Luis Potosí',
        anio: 2017,
        numeroArticulo: 'Art. 21 Bis (nuevo; obligaciones administración condominio)',
        textoVigente:
          'PDF 2017: no existe artículo dedicado a administraciones de condominio en RSU; el Art. 73 fracc. IV regula limpieza de frente en condominios. El 21 Bis propuesto es adición lógica junto al capítulo de recolección.',
        pdfCargado: true,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Art. 8 Bis (nuevo — ref. Art. 8 párr. 2)',
        textoVigente: MTY_ART8_ADMIN_EXTRACTO,
        pdfCargado: true,
        adendoPropuesto: localizeAdendoMty(ADENDO_4_PROPUESTO),
      },
      qro: {
        nombreReglamento: QRO_NOMBRE_REG,
        anio: 2021,
        numeroArticulo: 'Art. [●] Bis administraciones (concordar con Arts. 15–16)',
        textoVigente: QRO_SINTESIS_MARCO_NORMATIVO,
        pdfCargado: false,
        adendoPropuesto: localizeAdendoQro(ADENDO_4_PROPUESTO),
      },
      spg: {
        nombreReglamento:
          'Reglamento para el Manejo de Residuos Sólidos Urbanos y Aseo Público del Municipio de San Pedro Garza García, N.L. [VERIFICAR]',
        anio: 2009,
        numeroArticulo: 'Art. [●] Bis [VERIFICAR]',
        textoVigente: 'Pendiente extracto PDF SPGG.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoSpg(ADENDO_4_PROPUESTO),
      },
      cor: {
        nombreReglamento:
          'Reglamento de Servicios Públicos Municipales y/o ambiental (Corregidora) [VERIFICAR]',
        anio: 2020,
        numeroArticulo: 'Art. [●] Bis [VERIFICAR]',
        textoVigente: 'Pendiente mapeo local.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoCor(ADENDO_4_PROPUESTO),
      },
      mar: {
        nombreReglamento: 'Reglamento homólogo El Marqués [VERIFICAR]',
        anio: 2015,
        numeroArticulo: '[VERIFICAR]',
        textoVigente: MAR_TEXTO_FUENTE_PENDIENTE,
        pdfCargado: false,
        adendoPropuesto: MAR_ADENDO_BORRADOR,
      },
    },
    adendoPropuesto: ADENDO_4_PROPUESTO,
    efectoOperativo:
      'Operativiza obligaciones de la administración: infraestructura, contenedores, información a residentes, acceso inspectivo y comunicación a la autoridad. Es el soporte normativo del esquema A/B frente a terceros y residentes.',
    estadoBorrador: true,
  },
  {
    id: 5,
    titulo: 'Fiscalización y Régimen de Multas (Escalera 4→8→12 UMAs, 3 Niveles)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público para el Municipio de San Luis Potosí',
        anio: 2017,
        numeroArticulo: 'Art. [●] (nuevo — bloque fiscalización condominial; sin colisión con Art. 37 material sobre naturaleza del servicio)',
        textoVigente:
          'PDF en repo: `REGLAMENTOS DE ASEO PUBBLICO/REGLAMENTO DE ASEO PÚBLICO PARA EL MUNICIPIO DE SAN LUIS POTOSI.pdf` (5-ene-2017). El Art. 37 ya regula la naturaleza del servicio de limpia; la propuesta ALQUIMIA asigna otra numeración al artículo sancionador. Las infracciones generales pueden remitir al Bando; este adendo instrumenta la escalera específica para condominios en cinco fracciones.',
        pdfCargado: true,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Arts. 54-55 + reforma Tabulador (supuesto condominial) — verificado base',
        textoVigente: MTY_ART54_55_EXTRACTO,
        pdfCargado: true,
        adendoPropuesto: ADENDO_5_PROPUESTO_MTY,
      },
      qro: {
        nombreReglamento: QRO_NOMBRE_REG,
        anio: 2021,
        numeroArticulo: 'Integración al bloque de infracciones (refs. Arts. 8–11 — verificar PDF)',
        textoVigente: QRO_SINTESIS_MARCO_NORMATIVO,
        pdfCargado: false,
        adendoPropuesto: ADENDO_5_PROPUESTO_QRO,
      },
      spg: {
        nombreReglamento:
          'Reglamento para el Manejo de Residuos Sólidos Urbanos y Aseo Público del Municipio de San Pedro Garza García, N.L. [VERIFICAR]',
        anio: 2009,
        numeroArticulo: 'Capítulo sanciones [VERIFICAR]',
        textoVigente: 'Pendiente cotejo PDF SPGG; catálogo paralelo incluye Reglamento Ambiental 2009.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoSpg(ADENDO_5_PROPUESTO),
      },
      cor: {
        nombreReglamento:
          'Reglamento de Servicios Públicos Municipales y/o ambiental (Corregidora) [VERIFICAR]',
        anio: 2020,
        numeroArticulo: 'Sanciones [VERIFICAR]',
        textoVigente: 'Pendiente mapeo local.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoCor(ADENDO_5_PROPUESTO),
      },
      mar: {
        nombreReglamento: 'Reglamento homólogo El Marqués [VERIFICAR]',
        anio: 2015,
        numeroArticulo: '[VERIFICAR]',
        textoVigente: MAR_TEXTO_FUENTE_PENDIENTE,
        pdfCargado: false,
        adendoPropuesto: MAR_ADENDO_BORRADOR,
      },
    },
    adendoPropuesto: ADENDO_5_PROPUESTO,
    efectoOperativo:
      'Ancla probidad técnica del expediente sancionador: evidencia, graduación y compatibilidad con el tabulador/local. Los niveles 1 y 2 amortiguan riesgo constitucional antes de multa.',
    estadoBorrador: true,
  },
  {
    id: 6,
    titulo: 'Artículos Transitorios (Vigencia, Gradualidad, Periodo Educativo)',
    tecnica: 'Nuevo',
    ciudades: {
      slp: {
        nombreReglamento: 'Decreto de reforma al Reglamento de Aseo Público (propuesta)',
        anio: 2017,
        numeroArticulo: 'Transitorios 1–6 del decreto',
        textoVigente:
          'Los transitorios forman parte del decreto de reforma, no del texto publicado del reglamento base (2017 en repo: `REGLAMENTOS DE ASEO PUBBLICO/REGLAMENTO DE ASEO PÚBLICO PARA EL MUNICIPIO DE SAN LUIS POTOSI.pdf`). No hay artículo homólogo “vigente” que comparar; son el plan de aterrizaje junto a los adendos de fondo.',
        pdfCargado: true,
      },
      mty: {
        nombreReglamento: 'Decreto de reforma al Reglamento de Limpia Municipal',
        anio: 2020,
        numeroArticulo: 'Transitorios 1-6 del decreto',
        textoVigente:
          'No aplica texto comparado “reglamento vigente”: los transitorios forman parte del decreto de reforma. Deben armonizarse con la Secretaría de Servicios Públicos y el orden de publicación de NL.',
        pdfCargado: true,
        adendoPropuesto: localizeAdendoMty(ADENDO_6_PROPUESTO),
      },
      qro: {
        nombreReglamento: `Decreto de reforma al ${QRO_NOMBRE_REG}`,
        anio: 2021,
        numeroArticulo: 'Transitorios 1-6 del decreto',
        textoVigente:
          'Los transitorios acompañan el paquete de reforma; verificar órgano de publicación estatal/municipal aplicable en Querétaro.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoQro(ADENDO_6_PROPUESTO),
      },
      spg: {
        nombreReglamento: 'Decreto de reforma reglamentaria (SPGG, N.L.) [VERIFICAR]',
        anio: 2009,
        numeroArticulo: 'Transitorios 1-6 del decreto',
        textoVigente: 'Armonizar con calendario cabildo y Gaceta SPGG.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoSpg(ADENDO_6_PROPUESTO),
      },
      cor: {
        nombreReglamento: 'Decreto de reforma reglamentaria (Corregidora) [VERIFICAR]',
        anio: 2020,
        numeroArticulo: 'Transitorios 1-6 del decreto',
        textoVigente: 'Verificar publicación en medios oficiales de Corregidora.',
        pdfCargado: false,
        adendoPropuesto: localizeAdendoCor(ADENDO_6_PROPUESTO),
      },
      mar: {
        nombreReglamento: 'Decreto de reforma (El Marqués) — pendiente fuente',
        anio: 2015,
        numeroArticulo: '[VERIFICAR]',
        textoVigente: MAR_TEXTO_FUENTE_PENDIENTE,
        pdfCargado: false,
        adendoPropuesto: MAR_ADENDO_BORRADOR,
      },
    },
    adendoPropuesto: ADENDO_6_PROPUESTO,
    efectoOperativo:
      'Gradúa entrada en vigor, etapas por tamaño de condominio, periodo educativo sin multa y programa operativo — evitando “big bang” y vicios de imposibilidad jurídica.',
    estadoBorrador: true,
  },
]

export const adendos: AdendoData[] = ADENDOS_BASE.map(a => ({
  ...a,
  ciudades: { ...a.ciudades, ...(extendedCiudadesPorAdendo[a.id] ?? {}) },
}))

export function getAdendo(id: number): AdendoData | undefined {
  return adendos.find(a => a.id === id)
}

export const CIUDADES_DISPONIBLES: Record<string, string> = {
  slp: 'San Luis Potosí',
  sol: 'Soledad de Graciano Sánchez',
  csp: 'Cerro de San Pedro',
  vip: 'Villa de Pozos',
  mty: 'Monterrey',
  qro: 'Querétaro',
  /** Catálogo simulador ZM MTY */
  spg: 'San Pedro Garza García',
  snl: 'San Nicolás de los Garza',
  gua: 'Guadalupe',
  apo: 'Apodaca',
  sca: 'Santa Catarina',
  gar: 'García',
  esc: 'General Escobedo',
  jua: 'Juárez',
  hui: 'Huimilpan',
  gdl: 'Guadalajara',
  zap: 'Zapopan',
  tla: 'San Pedro Tlaquepaque',
  /** Alias legado — preferir `spg` */
  san_pedro: 'San Pedro Garza García',
  /** Catálogo simulador ZM QRO */
  cor: 'Corregidora',
  corregidora: 'Corregidora',
  mar: 'El Marqués',
  el_marques: 'El Marqués',
  soledad: 'Soledad de G.S.',
}
