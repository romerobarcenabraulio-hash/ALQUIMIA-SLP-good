# AESTHETE - Pulido visual y copy reconciliado (2026-05-07)

Estado del documento: reconciliado contra `main` despues del commit `084c9713`.

Este archivo describe direccion de producto y verificacion pendiente. No sustituye pruebas, browser QA ni auditoria de cierre.

## Direccion de pagina

La pagina de ALQUIMIA debe sentirse como una mesa tecnica municipal viva:

- primero seleccion de audiencia y municipio;
- despues baseline RSU municipal con fuente/confianza/incertidumbre;
- despues modulos de decision conectados;
- siempre con municipio separado de ZM;
- siempre diferenciando simulacion, propuesta, revision competente y documento oficial;
- sin landing decorativa ni tarjetas de marketing que oculten la herramienta real.

## Lenguaje legal visible

Usar:

- alcance legal;
- fuente localizada o descargada;
- revision competente;
- oficialidad restringida;
- propuesta expositiva;
- accion siguiente;
- evidencia y expediente.

Evitar en copy de usuario:

- lenguaje de compuerta legal como eje de producto;
- compuerta legal;
- bloqueo legal como concepto rector;
- sugerir que ALQUIMIA emite dictamen, documento oficial, sancion firme o acto municipal.

## Querétaro

Direccion corregida:

- Querétaro capital ya tiene esquema de obligaciones, inspeccion y sanciones.
- ALQUIMIA no debe proponer nueva sancionalidad ni escala UMA paralela para QRO.
- La propuesta correcta se centra en evidencia, protocolo probatorio, expediente, trazabilidad, cadena administrativa y armonizacion con el regimen existente.

## Fuentes legales

La descarga o checksum de un PDF no equivale a validacion juridica ni vigencia certificada.

- GDL y Zapopan tienen PDF descargado/verificado por checksum, pero siguen en revision para oficialidad.
- San Pedro Garza Garcia tiene candidato SISTEC de limpia; no debe presentarse como reglamento maestro validado.
- QRO capital: PDF en línea (`QRO_qro_reglamento_aseo_publico.pdf`) + portal reglamentario; extracción de artículos pendiente agentes ALQUIMIA.

## P2 visual

Integrado:

- `TraceRibbon` compartido.
- Portal empresarial con trazabilidad de KPIs.
- Copy de varios modulos cambiado de gate/bloqueo a alcance/restriccion.

No certificado:

- eliminacion de componentes huerfanos;
- Lighthouse local posterior al ultimo commit;
- QA visual 20 municipios posterior al merge en `main`.

## Criterio de cierre visual futuro

No cerrar por `tsc` ni por CI verde. Cerrar cuando browser QA confirme:

- no hay textos `semilla Q-*`, `trace:`, `Context API`, `Hidratando` en interfaz publica;
- GDL se muestra u oculta segun envs front/back de forma coherente;
- cada municipio cambia copy, fuente o razon tecnica donde corresponda;
- QRO no ofrece nueva sancionalidad;
- las restricciones no impiden educacion, analisis ni propuesta.
