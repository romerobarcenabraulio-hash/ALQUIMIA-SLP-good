/**
 * adendos.ts — Data estática Q-013 Sprint 1
 * Textos de adendos propuestos: copia literal de los archivos .md del CLC
 * Textos vigentes: extraídos de PDFs disponibles (MTY verificado; SLP/QRO pendientes PDF)
 * [BORRADOR PARA REVISIÓN LEGAL — no produce efectos jurídicos]
 */

import type { AdendoData } from '@/types'

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

const ADENDO_1_PROPUESTO = `Se adicionan las fracciones siguientes al Artículo 4 del Reglamento de Aseo Público del Municipio de San Luis Potosí, para quedar como sigue:

"Fracción [X]. Vivienda en condominio / propiedad en régimen de condominio: Inmueble habitacional que forma parte de un conjunto sometido al régimen de propiedad en condominio o de un desarrollo residencial con administración común, que cuenta con áreas y servicios comunes, incluyendo espacios destinados al almacenamiento temporal de residuos sólidos urbanos."

"Fracción [X+1]. Administración de condominio: Persona física o moral designada conforme a la Ley sobre el Régimen de Propiedad en Condominio del Estado de San Luis Potosí y al reglamento interno respectivo, responsable de la operación y conservación de los bienes y servicios comunes del condominio, incluyendo la gestión de residuos sólidos urbanos en las áreas comunes."

"Fracción [X+2]. Centro de acopio condominial: Área o instalación común dentro de un condominio, debidamente autorizada por la Dirección de Aseo Público, destinada a la recepción, separación y almacenamiento temporal de residuos sólidos urbanos generados por las viviendas que lo integran, mediante contenedores diferenciados por fracción."

"Fracción [X+3]. Sistema de separación en cinco fracciones: Esquema de clasificación de residuos sólidos urbanos que comprende, como mínimo, las fracciones siguientes: a) plásticos y otros polímeros (PET, HDPE, LDPE, PP); b) vidrio (transparente, verde, ámbar); c) metales ligeros (aluminio, hojalata, lámina); d) papel y cartón; e) materia orgánica (restos de alimentos y de jardín). El código de colores de contenedores seguirá los lineamientos de SEMARNAT vigentes."`

const ADENDO_2_PROPUESTO = `"Artículo 20 Bis. En los inmuebles habitacionales ubicados en condominios y desarrollos residenciales con administración común, el servicio de recolección de residuos sólidos urbanos se organizará con base en los esquemas siguientes:

I. Esquema Modelo A — Centro de acopio condominial: Aplicable a condominios de baja y media densidad, en el cual las viviendas entregan sus residuos sólidos urbanos separados en cinco fracciones en un centro de acopio condominial dotado de contenedores diferenciados por fracción, y el vehículo recolector presta el servicio en dicho punto conforme al calendario que emita la Dirección de Aseo Público.

II. Esquema Modelo B — Recolección interna programada: Aplicable a condominios y desarrollos residenciales de urbanización más extensa, en el cual la administración organiza, en coordinación con la Dirección de Aseo Público o con el concesionario del servicio, una recolección interna en que, en días determinados de la semana, se recogen exclusivamente las fracciones señaladas por la autoridad conforme al sistema de separación en cinco fracciones.

La Dirección de Aseo Público determinará, mediante acuerdo administrativo, el esquema aplicable a cada condominio o desarrollo residencial, considerando la densidad habitacional, la infraestructura disponible, la accesibilidad para los vehículos recolectores y la capacidad operativa del Municipio o del concesionario.

Las disposiciones de este artículo serán aplicables exclusivamente a inmuebles habitacionales en régimen de condominio o desarrollos residenciales con administración común. El Ayuntamiento podrá, mediante acuerdos posteriores y en función de su capacidad operativa y madurez institucional, extender gradualmente el sistema de separación en cinco fracciones a otras tipologías de vivienda y zonas urbanas."`

const ADENDO_3_PROPUESTO = `Se adicionan las fracciones siguientes al Artículo 21 del Reglamento de Aseo Público del Municipio de San Luis Potosí, para quedar como sigue:

"Son obligaciones adicionales de los habitantes de viviendas ubicadas en condominios y desarrollos residenciales con administración común:

Fracción [X]. Separar los residuos sólidos urbanos que generen en su vivienda, conforme al sistema de separación en cinco fracciones definido en el presente Reglamento y en los lineamientos técnicos que emita la Dirección de Aseo Público, y depositarlos en los contenedores diferenciados que se instalen en el centro de acopio condominial o en los puntos de recolección interna programada.

Fracción [XI]. Abstenerse de entregar residuos sólidos urbanos mezclados en las áreas comunes o al servicio de recolección, cuando el condominio en que habiten se encuentre incorporado a los esquemas de separación establecidos en el Artículo 20 Bis del presente Reglamento.

Fracción [XII]. Atender las indicaciones de la administración del condominio y de la Dirección de Aseo Público respecto de horarios, puntos de entrega y reglas de separación de residuos sólidos urbanos."`

const ADENDO_4_PROPUESTO = `"Artículo 21 Bis. Las administraciones de condominios y desarrollos residenciales con administración común tendrán, además de las obligaciones que establezcan la Ley sobre el Régimen de Propiedad en Condominio del Estado de San Luis Potosí y sus reglamentos internos, las obligaciones siguientes en materia de residuos sólidos urbanos:

I. Implementar y mantener en operación un centro de acopio condominial o, en su caso, un sistema de recolección interna programada, conforme al esquema que determine la Dirección de Aseo Público, según lo establecido en el Artículo 20 Bis del presente Reglamento.

II. Instalar y conservar en buen estado contenedores diferenciados por fracción de residuos, conforme al sistema de separación en cinco fracciones y al código de colores y especificaciones técnicas que emita la Dirección de Ecología.

III. Informar a las personas habitantes del condominio sobre sus obligaciones de separación, horarios y puntos de entrega, mediante reglamento interno, circulares y señalización visible en las áreas comunes.

IV. Facilitar las labores de supervisión, inspección y verificación de la Dirección de Aseo Público y de la autoridad competente, incluyendo el acceso a las áreas de contenedores y centros de acopio, y atender las observaciones que se emitan.

V. Comunicar oportunamente a la Dirección de Aseo Público las incidencias relevantes en la operación del sistema de separación y recolección, para efectos de ajuste de rutas, contenedores o calendarios."`

const ADENDO_5_PROPUESTO = `"Artículo 37 Bis. De la Fiscalización y Sanción por Incumplimiento de Separación.

El Municipio y, en su caso, el concesionario del servicio de recolección de residuos sólidos urbanos, estarán facultados para documentar y reportar a la autoridad competente los incumplimientos a las obligaciones de separación y presentación de residuos previstas en el presente Reglamento, mediante la obtención de evidencia fotográfica u otros medios de prueba idóneos, con registro de geolocalización, fecha y hora automáticas.

Nivel 1 — Aviso (primera documentación):
Se notifica al habitante o a la administración del condominio. Registro en el sistema digital con folio único. Sin costo económico. Efecto: inicia el expediente del infractor.

Nivel 2 — Advertencia formal (segundo incumplimiento del mismo tipo dentro de 30 días naturales):
Se emite advertencia escrita con plazo de corrección de 15 días hábiles. Registro en expediente. Sin multa — registro acumulable para activar el Nivel 3.

Nivel 3 — Multa económica (tercer incumplimiento o reincidencia tras advertencia formal):
- Primera multa: 4 UMAs (≈ $500 MXN)
- Segunda multa (reincidencia): 8 UMAs (≈ $1,000 MXN)
- Tercera multa y subsecuentes: 12 UMAs fijas por evento (≈ $1,500 MXN)
El valor en MXN se actualiza automáticamente con el valor de la UMA vigente publicado por el INEGI al inicio de cada año.

Causales de infracción:
a) No separar: Entregar residuos mezclados en contenedores o al servicio de recolección cuando el condominio esté incorporado al sistema de separación en cinco fracciones.
b) Contenedor incorrecto: Depositar una fracción en el contenedor de otra.
c) Incumplir horarios: No respetar los días y horarios de recolección diferenciada establecidos por la Dirección.
d) Obstruir supervisión: Impedir el acceso del personal de inspección a las áreas de contenedores o centros de acopio.

Se considera reincidencia cuando el infractor cometa la misma falta dentro de un periodo menor a 12 meses calendario contados desde la última sanción notificada.

La multa es recurrible ante la autoridad municipal competente, garantizando en todo momento el derecho de audiencia previsto en el artículo 14 de la Constitución Política de los Estados Unidos Mexicanos."`

const ADENDO_6_PROPUESTO = `TRANSITORIO PRIMERO — Vigencia.
El presente decreto entra en vigor al día siguiente de su publicación en el Periódico Oficial del Estado / Gaceta Municipal, salvo las disposiciones cuya entrada en vigor escalonada se establezca en los transitorios siguientes.

TRANSITORIO SEGUNDO — Implementación gradual por tamaño de condominio.
Primera etapa: Condominios y desarrollos residenciales con 50 o más unidades habitacionales — 90 días naturales.
Segunda etapa: Condominios y desarrollos residenciales con 20 a 49 unidades habitacionales — 180 días naturales.
Tercera etapa: Condominios y desarrollos residenciales con menos de 20 unidades habitacionales — 365 días naturales.

El Ayuntamiento habilitará las rutas de recolección diferenciada y proveerá la señalización de contenedores en cada zona antes del inicio del plazo de la etapa correspondiente.

TRANSITORIO TERCERO — Periodo exclusivo de avisos educativos.
Durante los primeros 180 días naturales posteriores a la entrada en vigor de cada etapa para los sujetos obligados correspondientes, el régimen sancionatorio operará únicamente mediante el Nivel 1 (Aviso) y el Nivel 2 (Advertencia formal). No se aplicarán multas económicas sino hasta cumplido ese plazo y siempre que el generador haya recibido al menos una advertencia formal documentada en expediente.

TRANSITORIO CUARTO — Programa Municipal de Implementación.
La Dirección de Aseo Público, en coordinación con la Dirección Jurídica y la Tesorería, elaborará dentro de los 60 días naturales posteriores a la publicación del presente decreto un Programa Municipal de Implementación Gradual.

TRANSITORIO QUINTO — Derogación.
Se derogan las disposiciones del presente Reglamento y del Bando de Policía y Buen Gobierno que se opongan al presente decreto en materia de gestión de residuos sólidos urbanos en condominios y desarrollos residenciales.

TRANSITORIO SEXTO — Difusión.
El Ayuntamiento difundirá el presente decreto en lenguaje accesible y con material gráfico explicativo a través de medios oficiales, plataforma digital municipal y canales de comunicación directa con administraciones de condominios, dentro de los 30 días naturales siguientes a su publicación.`

// ─── Datos completos de los 6 adendos ────────────────────────────────────────

export const adendos: AdendoData[] = [
  {
    id: 1,
    titulo: 'Definiciones (Condominio, Administración, Centro de Acopio, 5 Fracciones)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público del Municipio de San Luis Potosí',
        anio: 2018,
        numeroArticulo: 'Art. 4 (adición de fracciones)',
        textoVigente: '[NO DISPONIBLE — PDF del Reglamento de Aseo Público SLP 2018 no cargado en REGLAMENTOS_BASE/. El archivo disponible es la Ley de Ingresos 2023, documento incorrecto. Requerido: cargar el Reglamento de Aseo Público 2018.]',
        pdfCargado: false,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Art. 3 (35 fracciones — verificado)',
        textoVigente: MTY_ART3_EXTRACTO,
        pdfCargado: true,
      },
      qro: {
        nombreReglamento: 'Reglamento Municipal de GIRS Querétaro',
        anio: 2021,
        numeroArticulo: 'Art. [📄 VERIFICAR]',
        textoVigente: '[NO DISPONIBLE — PDF del Reglamento GIRS QRO 2021 no cargado. El archivo disponible es la LOMEQ (Ley Orgánica Municipal), documento incorrecto para este fin.]',
        pdfCargado: false,
      },
    },
    adendoPropuesto: ADENDO_1_PROPUESTO,
    efectoOperativo: 'Diferencia jurídicamente el universo de condominios del resto de la ciudad. Crea las cuatro figuras que usan los artículos 20 Bis, 21 Bis y 37 Bis para asignar obligaciones y sanciones. Sin estas definiciones, cualquier adendo posterior queda en el aire.',
    estadoBorrador: true,
  },
  {
    id: 2,
    titulo: 'Esquemas de Separación en Condominios (Modelos A y B)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público del Municipio de San Luis Potosí',
        anio: 2018,
        numeroArticulo: 'Art. 20 Bis (nuevo — no existe)',
        textoVigente: '[NO EXISTE] El Reglamento de Aseo Público SLP 2018 no tiene un artículo equivalente. PDF no disponible para verificar el Art. 20 base de referencia. La técnica normativa es: Adicionar (nuevo artículo Art. 20 Bis).',
        pdfCargado: false,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Art. 7 Bis (nuevo — ref. Arts. 7 y 8)',
        textoVigente: MTY_ART7_8_EXTRACTO,
        pdfCargado: true,
      },
      qro: {
        nombreReglamento: 'Reglamento Municipal de GIRS Querétaro',
        anio: 2021,
        numeroArticulo: 'Art. [📄 VERIFICAR] Bis',
        textoVigente: '[NO DISPONIBLE — PDF del Reglamento GIRS QRO 2021 no cargado.]',
        pdfCargado: false,
      },
    },
    adendoPropuesto: ADENDO_2_PROPUESTO,
    efectoOperativo: 'Formaliza dos modelos de servicio diferenciados para condominios. Le da a la Dirección de Aseo base jurídica para decidir, caso por caso, qué modelo aplica a cada condominio. Sin este artículo, el municipio no puede exigir que un condominio instale un centro de acopio ni operar rutas diferenciadas.',
    estadoBorrador: true,
  },
  {
    id: 3,
    titulo: 'Obligaciones de Habitantes de Condominios (Separar, No Mezclar, Respetar Horarios)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público del Municipio de San Luis Potosí',
        anio: 2018,
        numeroArticulo: 'Art. 21 (adición fracs. X, XI, XII)',
        textoVigente: '[NO DISPONIBLE — PDF del Reglamento de Aseo Público SLP 2018 no cargado. Necesario para conocer el número total de fracciones actuales del Art. 21 y numerar correctamente las fracciones nuevas X, XI y XII.]',
        pdfCargado: false,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Art. 20 (adición fracciones — verificado)',
        textoVigente: MTY_ART20_EXTRACTO,
        pdfCargado: true,
      },
      qro: {
        nombreReglamento: 'Reglamento Municipal de GIRS Querétaro',
        anio: 2021,
        numeroArticulo: 'Art. [📄 VERIFICAR] fracciones',
        textoVigente: '[NO DISPONIBLE — PDF del Reglamento GIRS QRO 2021 no cargado.]',
        pdfCargado: false,
      },
    },
    adendoPropuesto: ADENDO_3_PROPUESTO,
    efectoOperativo: 'La fracción [X] crea el deber positivo de separar. La fracción [XI] crea el deber negativo de no mezclar — esta es la fracción que habilita directamente la sanción por entrega de basura mezclada (Art. 37 Bis). La fracción [XII] establece la cadena de autoridad (condominio → municipio) que el habitante está obligado a obedecer.',
    estadoBorrador: true,
  },
  {
    id: 4,
    titulo: 'Obligaciones de Administraciones de Condominio (5 Obligaciones RSU)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público del Municipio de San Luis Potosí',
        anio: 2018,
        numeroArticulo: 'Art. 21 Bis (nuevo — no existe)',
        textoVigente: '[NO EXISTE] El Reglamento de Aseo Público SLP 2018 no tiene un artículo equivalente que asigne obligaciones específicas RSU a las administraciones de condominios. PDF no disponible para verificar Art. 21 base. La técnica normativa es: Adicionar (nuevo artículo Art. 21 Bis).',
        pdfCargado: false,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Art. 8 Bis (nuevo — ref. Art. 8 párr. 2)',
        textoVigente: MTY_ART8_ADMIN_EXTRACTO,
        pdfCargado: true,
      },
      qro: {
        nombreReglamento: 'Reglamento Municipal de GIRS Querétaro',
        anio: 2021,
        numeroArticulo: 'Art. [📄 VERIFICAR] Bis',
        textoVigente: '[NO DISPONIBLE — PDF del Reglamento GIRS QRO 2021 no cargado.]',
        pdfCargado: false,
      },
    },
    adendoPropuesto: ADENDO_4_PROPUESTO,
    efectoOperativo: 'Fracción I: La Dirección puede exigir que el condominio opere con Modelo A o B. Fracción II: El municipio puede sancionar por contenedores sucios, mezclados o ausentes. Fracción III: La ignorancia del colono no exime a la administración. Fracción IV: Ancla jurídica para el sistema de evidencia fotográfica. Fracción V: Crea el canal oficial de comunicación condominio → municipio.',
    estadoBorrador: true,
  },
  {
    id: 5,
    titulo: 'Fiscalización y Régimen de Multas (Escalera 4→8→12 UMAs, 3 Niveles)',
    tecnica: 'Adicionar',
    ciudades: {
      slp: {
        nombreReglamento: 'Reglamento de Aseo Público del Municipio de San Luis Potosí',
        anio: 2018,
        numeroArticulo: 'Art. 37 Bis (nuevo — art. actual remite al Bando)',
        textoVigente: '[NO EXISTE] escalera específica RSU condominial. El reglamento actual remite al Bando de Policía y Buen Gobierno para infracciones en materia de aseo. PDF no disponible para verificar Art. 10/37 base. La técnica normativa es: Adicionar (nuevo artículo Art. 37 Bis).',
        pdfCargado: false,
      },
      mty: {
        nombreReglamento: 'Reglamento de Limpia Municipal de Monterrey',
        anio: 2020,
        numeroArticulo: 'Arts. 54-55 (reformar para escalera condominial — verificado)',
        textoVigente: MTY_ART54_55_EXTRACTO,
        pdfCargado: true,
      },
      qro: {
        nombreReglamento: 'Reglamento Municipal de GIRS Querétaro',
        anio: 2021,
        numeroArticulo: 'Art. [📄 VERIFICAR] Bis',
        textoVigente: '[NO DISPONIBLE — PDF del Reglamento GIRS QRO 2021 no cargado.]',
        pdfCargado: false,
      },
    },
    adendoPropuesto: ADENDO_5_PROPUESTO,
    efectoOperativo: 'Este artículo es la bisagra entre la norma y la realidad. Sin evidencia documentada no hay folio; sin folio no hay sanción; sin sanción no hay cambio de conducta. La escalera 4→8→12 UMAs es suficientemente progresiva para ser disuasiva sin ser confiscatoria. El Nivel 1 Aviso y Nivel 2 Advertencia protegen el debido proceso.',
    estadoBorrador: true,
  },
  {
    id: 6,
    titulo: 'Artículos Transitorios (Vigencia, Gradualidad, Periodo Educativo)',
    tecnica: 'Nuevo',
    ciudades: {
      slp: {
        nombreReglamento: 'Decreto de reforma al Reglamento de Aseo Público',
        anio: 2018,
        numeroArticulo: 'Transitorios 1-6 del decreto',
        textoVigente: 'No aplica — los transitorios son parte del decreto de reforma, no del reglamento vigente. No hay "artículo actual" que comparar. Los transitorios acompañan a los 5 artículos de fondo como el "plan de aterrizaje" del decreto.',
        pdfCargado: false,
      },
      mty: {
        nombreReglamento: 'Decreto de reforma al Reglamento de Limpia Municipal',
        anio: 2020,
        numeroArticulo: 'Transitorios 1-6 del decreto',
        textoVigente: 'No aplica — los transitorios son parte del decreto de reforma, no del reglamento vigente. El texto es idéntico en todas las ciudades; sólo cambian los números de artículos referenciados según el reglamento de cada municipio.',
        pdfCargado: true,
      },
      qro: {
        nombreReglamento: 'Decreto de reforma al Reglamento Municipal de GIRS',
        anio: 2021,
        numeroArticulo: 'Transitorios 1-6 del decreto',
        textoVigente: 'No aplica — los transitorios son parte del decreto de reforma. El texto es idéntico en todas las ciudades.',
        pdfCargado: false,
      },
    },
    adendoPropuesto: ADENDO_6_PROPUESTO,
    efectoOperativo: 'Define el "plan de aterrizaje" del decreto: cuándo entra en vigor, a quién aplica primero (condominios ≥50 unidades → 90 días), cuánto tiempo hay para adaptarse (180 días de periodo educativo sin multas) y qué puede hacer la autoridad mientras tanto.',
    estadoBorrador: true,
  },
]

export function getAdendo(id: number): AdendoData | undefined {
  return adendos.find(a => a.id === id)
}

export const CIUDADES_DISPONIBLES: Record<string, string> = {
  slp: 'San Luis Potosí',
  mty: 'Monterrey',
  qro: 'Querétaro',
  san_pedro: 'San Pedro G.G.',
  soledad: 'Soledad de G.S.',
  corregidora: 'Corregidora',
  el_marques: 'El Marqués',
}
