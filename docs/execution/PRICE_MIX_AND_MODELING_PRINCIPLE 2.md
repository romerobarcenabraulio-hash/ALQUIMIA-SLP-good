# Price Mix And Modeling Principle

Fecha: 2026-06-02

## Decision

ALQUIMIA si debe calcular precios, derrama y escenarios economicos de residuos, pero no debe mostrarlos como cotizacion oficial, estudio local o verdad municipal cuando provienen de modelo, inferencia o benchmark.

La limpieza de calculadoras publicas no significa eliminar calculo. Significa eliminar calculo no trazado en superficies cliente.

## Product Principle

El motor de precios de residuos debe operar con un mix fijo de escenario por material y por ciudad. Ese mix puede variar segun ciudad, evidencia disponible, compradores, calidad, merma, logistica y revision founder/admin.

La plataforma debe distinguir siempre entre:

- Datos investigados: web, APIs, documentos locales, cotizaciones, compradores, reglamentos, contratos, estudios y fuentes publicas.
- Datos calculados: transformaciones deterministicas, ponderaciones, modelos estadisticos, distribuciones, sensibilidad, regresiones simples o modelos lineales.
- Supuestos internos: valores usados para planeacion cuando no existe evidencia suficiente.
- Brechas criticas: datos faltantes que impiden afirmar, cotizar o defender una cifra como local.

## Material Price Mix

Para cada material, el motor debe poder calcular un precio ponderado de escenario con:

- precio local investigado;
- precio regional comparable;
- precio premium posible;
- castigo por calidad;
- rechazo o merma;
- costo logistico;
- comprador probable;
- fecha de fuente;
- metodo de ponderacion;
- confianza;
- limite de uso.

Materiales minimos:

- PET;
- HDPE;
- carton/papel;
- vidrio;
- aluminio;
- organico;
- otros recuperables.

## UI Rule

Cliente no debe operar sliders libres de precio. Cliente ve escenarios cerrados y explicados:

- minimo viable;
- conservador;
- base realista;
- optimizado;
- estres.

Founder/admin puede calibrar supuestos internos y mix de precios.

## Non-Negotiables

- Precio ponderado de escenario no es precio oficial.
- Benchmark no sustituye cotizacion local.
- Fuente comparable no desbloquea estudio local.
- Si falta comprador o cotizacion, se puede planear con supuesto marcado, pero no afirmar derrama local como validada.
- Cada cifra economica cliente-facing necesita claim ledger: fuente, fecha, metodo, alcance, tipo, confianza y estado humano.
- Municipio, ZM, estado y nacional no se mezclan.

## Implementation Direction

Futuras limpiezas no deben borrar motores de calculo utiles. Deben moverlos de UI publica o simulador legacy hacia motores puros trazables:

- `material_price_mix`;
- `private_circularity_engine`;
- `consulting_package_engine`;
- `claim_ledger`;
- `bibliography_intelligence`;
- export con limites de uso.

