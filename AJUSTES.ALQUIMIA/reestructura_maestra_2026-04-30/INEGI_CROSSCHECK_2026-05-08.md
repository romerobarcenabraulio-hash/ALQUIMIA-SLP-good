# Cross-check INEGI 2026-05-08

## Archivos revisados

- `/Users/braulioromerobarcena/Downloads/Poblacion_01.xlsx`
- `/Users/braulioromerobarcena/Downloads/Vivienda_01.xlsx`
- `/Users/braulioromerobarcena/Downloads/Vivienda_02.xlsx`

Consulta INEGI indicada en los archivos: 2026-05-08.

## Hallazgo principal

Los tres archivos son tabulados por entidad federativa. No son tabulados municipales ni de zona metropolitana.

Por tanto:

- Sirven para validar población estatal 2020.
- Sirven para validar viviendas particulares habitadas estatales 2020.
- Sirven para validar promedio estatal de ocupantes por vivienda 2020.
- No sirven para afirmar distribución municipal o ZM de `Casa independiente` vs `Departamento en edificio`.
- No justifican porcentajes como 50/50, 35/65, 42/58 por ciudad.

## Valores extraídos

| ZM simulador | Entidad INEGI | Población estatal 2020 | Viviendas habitadas 2020 | Ocupantes/vivienda 2020 |
|---|---:|---:|---:|---:|
| SLP | San Luis Potosí | 2,822,255 | 774,658 | 3.6 |
| MTY | Nuevo León | 5,784,442 | 1,655,256 | 3.5 |
| QRO | Querétaro | 2,368,467 | 668,487 | 3.5 |
| GDL | Jalisco | 8,348,151 | 2,330,706 | 3.6 |

## Comparación contra simulador

| ZM | Población simulador | % de población estatal | Viviendas simulador | % de viviendas estatales | Observación |
|---|---:|---:|---:|---:|---|
| SLP | 1,243,980 | 44.1% | 224,000 | 28.9% | `224,000` corresponde a viviendas objetivo del modelo SLP, no total estatal ni total ZM INEGI. |
| MTY | 5,341,171 | 92.3% | 890,000 | 53.8% | Población ZM plausible frente a estado; viviendas no deben presentarse como INEGI estatal. |
| QRO | 1,444,083 | 61.0% | 260,000 | 38.9% | Ocupantes del simulador 3.4 no coincide con entidad INEGI 3.5. Requiere fuente municipal/ZM antes de cambiar. |
| GDL | 3,097,600 | 37.1% | 627,000 | 26.9% | Ocupantes del simulador 3.5 no coincide con entidad INEGI 3.6. Requiere fuente municipal/ZM antes de cambiar. |

## Decisión aplicada

Se corrigió el frontend para no presentar porcentajes de casa/departamento como dato INEGI cuando los XLSX cargados no traen esa variable.

La UI ahora muestra:

- hechos estatales INEGI 2020;
- warning cuando no hay tabulado municipal por clase de vivienda;
- segmentos de vivienda solo como controles operativos del modelo, no como distribución oficial INEGI.

## Pendiente correcto

Para reactivar distribución de vivienda oficial por ciudad/municipio, cargar tabulado INEGI municipal por clase de vivienda particular, con al menos:

- municipio;
- clave de entidad;
- clave de municipio;
- casa independiente;
- departamento en edificio;
- vivienda en vecindad/cuarto/otros, si aplica;
- total de viviendas particulares habitadas;
- fecha de consulta y URL/API de INEGI.
