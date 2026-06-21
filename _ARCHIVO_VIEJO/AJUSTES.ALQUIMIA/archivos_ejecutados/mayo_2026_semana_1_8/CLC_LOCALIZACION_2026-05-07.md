# CLC — Localización legal multimunicipio (cierre auditoría P0/P1)

**Fecha:** 2026-05-07  
**Agente:** CLC (ALQUIMIA)  
**Apego:** `cursor-rules/CLC.md`  
**Estado:** entrega técnica — sin efectos jurídicos

---

## Alcance

- **4 ZMs · 20 municipios:** SLP (4), MTY (9), QRO (4), GDL (3).
- Sustitución del texto genérico único de `legal_disclaimer` y `next_action` en el motor de diagnóstico por **20 pares municipalizados**, con **brecha crítica canónica** tomada del backend (`brecha_critica`, tope mostrado 8).
- **14 municipios** reciben paquete de **6 adendos** localizados vía `frontend/src/data/adendosExtendedCiudades.ts` (fusión en `adendos.ts`).
- Actualización de **`ADENDOS: LEGAL/MULTI_CIUDAD/TABLA_COMPARATIVA.md`** con matriz extendida.
- **JSON de referencia** (snapshot): `backend/data/municipal_legal_disclaimers_2026-05-07.json`.

---

## Decisiones

1. **Disclaimer y next_action (20 municipios):** contenido en `backend/data/municipal_legal_disclaimers_2026-05-07.json`, cargado por `municipal_legal_copy.py` al iniciar. Sin archivo JSON, el disclaimer cae al formato corto `municipio · reglamento · brecha` y el `next_action` sigue la estrategia A/B/C/D.
2. **Disclaimer (≤220 caracteres) en JSON:** nombre del municipio, instrumento (truncado en el generador original), año cuando aplica, autoridad local y **Brecha crítica X/8** acoplada al cómputo canónico del backend en el momento del snapshot.
3. **next_action en JSON:** infinitivo, plazo tentativo y titular; sin “Validar” aislado.
4. **Adendos sin reglamento RSU propio** (`sol`, `csp`, `vip`, `hui`, `jua`, `gdl`, `zap`, `tla`): proyecto de reglamento + ley estatal supletoria `[VERIFICAR]` + `Art. [●]` + bloque Bando explícito en sanciones.
5. **NL con reglamento seed sin PDF:** `snl`, `gua`, `apo`, `sca`, `gar`, `esc` — `[VERIFICAR EN FUENTE OFICIAL: …]` en cada bloque.
6. **Querétaro capital:** sin afirmar vacío legal total (tabla comparativa).
7. **Tests:** repositorio y `ALL_MUNICIPIOS` = **20**; mapa RSU incluye ZM GDL; `TestCLCExpositorMunicipal` exige 20 cadenas únicas y ≤220 caracteres en disclaimers.

---

## Pendientes [VERIFICAR]

- Descarga y anexión de PDFs POE estatales/municipales por cada ruta sugerida en `adendosExtendedCiudades.ts`.
- Validar denominaciones exactas de secretarías y reglamentos en cabildos vigentes.
- Ajustar `Reglamento.nombre` en `repository.py` cuando el CSA confirme título oficial distinto al seed.
- Prueba `TestFase111LegalMunicipal.test_endpoint_zm_context_...` requiere entorno con dependencia `python-jose` instalada (fallo local por import, no por lógica CLC).

---

## Enlaces / artefactos

| Artefacto | Ruta |
|---|---|
| Copy municipal | `backend/app/legal/municipal_legal_copy.py` |
| Diagnóstico | `backend/app/legal/diagnostic.py` |
| JSON snapshot | `backend/data/municipal_legal_disclaimers_2026-05-07.json` |
| Adendos extendidos | `frontend/src/data/adendosExtendedCiudades.ts` |
| Fusión adendos | `frontend/src/data/adendos.ts` |
| Tabla comparativa | `ADENDOS: LEGAL/MULTI_CIUDAD/TABLA_COMPARATIVA.md` |
| Índice adendos | `ADENDOS: LEGAL/00_INDICE_ADENDOS.md` |

---

> Nota de no vinculancia: borrador CLC-ALQUIMIA. No sustituye dictamen de autoridad competente.
