# MVP CITY PACKAGE QA

Fecha: 2026-05-29.

Decisión multi-ciudad: PARTIAL. Se corrigió una brecha real: el hub documental devolvía menos documentos para QRO/MTY que para SLP. Ahora `documentosHub(zm)` normaliza toda ciudad al índice SLP de 21 documentos y conserva faltantes como brecha crítica. Falta probar generación/export real completa por tres perfiles de ciudad desde navegador.

## Contrato documental

| Criterio | Resultado | Evidencia | Estado |
|---|---|---|---|
| Mismo número de documentos | `SLP` tiene 21 slots; `documentosHub('QRO')` y `documentosHub('MTY')` se normalizan a la misma longitud | `frontend/src/data/hubDocumentosCapitulo.ts` | PASS |
| Mismo índice | Las ciudades no-SLP se mapean contra el índice base SLP | `normalizeCityPackage()` | PASS |
| Brechas críticas visibles | Los documentos faltantes usan `Brecha crítica: pendiente integrar evidencia local...` | `normalizedDocumentForCity()` | PASS |
| SLP no privilegiado como única demo | SLP sigue siendo fixture base del índice, pero QRO/MTY ya no producen menos paquete | `documentosHub()` | PARTIAL |
| Ciudad con datos completos | SLP actúa como fixture más completo | Hub SLP | PASS |
| Ciudad con datos parciales | QRO actúa como paquete parcial normalizado | Hub QRO normalizado | PASS |
| Ciudad con brechas críticas | MTY/QRO muestran brechas en slots faltantes | Hub MTY/QRO normalizado | PASS |
| Export real por ciudad | No se probó export completo por tres ciudades desde navegador | No disponible en esta auditoría | PARTIAL |

## Prueba agregada

Se agregó test:

- `frontend/src/data/hubDocumentosCapitulo.test.ts`
- Caso: `todas las ciudades mantienen el mismo índice documental visible`
- Resultado: PASS, 5 tests del archivo.

## Decisión

El contrato visible del hub queda corregido. El MVP multi-ciudad queda PARTIAL hasta probar export/reportes completos por ciudad, no solo catálogo documental.
