# 23 · Integridad geoespacial y capas defendibles

**Propósito:** anclar todo trabajo de mapas, geometrías y consultas espaciales a estándares y fuentes oficiales, con frontera clara **Municipio ↔ Zona Metropolitana**. Esta fase es **ajena a la Fase 22** (identidad/narrativa/UI); aquí manda el agente **Navigator** (`cursor-rules/NAVIGATOR.md`).

**Cuándo activar:** antes de publicar en producción cualquier capa consumida por decisión pública, o al extender cobertura nacional con geometría municipal.

---

## 0. Subfases (CSA)

| ID | Nombre | Qué es |
|----|--------|--------|
| **23.0** | Intake jurisdiccional **lógico** (sin geometría servida) | Catálogo semilla `municipio_id` ↔ `zm` y reglas API que ya distinguen municipio de ZM (`Navigator` §5 en modo **datos**, no tiles). Sin commits geo del Ejecutor hasta checklist Navigator sobre este alcance. |
| **23.1** | Primera **capa / Mapbox / GeoJSON** | Contrato de capa §3, SRID, fuentes INEGI/MGN, metadatos; solo después de **PASS 23.0** o decisión CSA explícita de paralelizar riesgo. |

**Apertura formal:** bitácora `CSA — REQUEST · Fase 23.0` con fecha; `COLA_Y_ROLES_AGENTES.md` marca Navigator **ACTIVO** para 23.0.

---

## 1. Alcance

| Incluye | Excluye |
|---------|---------|
| Mapbox / tiles / GeoJSON / centroides / polígonos | Purga de copy UI sin mapa |
| SRID, transformaciones, almacén vs vista | Lógica financiera pura |
| Metadatos ISO 19115 mínimos por capa | NarrativeBridge sin componente geo |
| Validador `jurisdiction_scope` + CVE INEGI | Marketing landing sin mapa |

---

## 2. Roles

| Rol | Responsabilidad |
|-----|-----------------|
| **Navigator** | Checklist geo, vetos espaciales, fuentes, SRID, §5–6 NAVIGATOR |
| **Ejecutor** | Implementación técnica (SDK mapas, API features, tests) |
| **Auditor** | Legal cuando la capa respalde sanciones, documentos “oficiales” o datos personales/locación |
| **Aesthete-1** | Leyenda, contraste, densidad visual del mapa (después de PASS geo) |

---

## 3. Entregables mínimos

1. **Contrato de capa** documentado (YAML o JSON en repo): `source`, `srid_storage`, `srid_display`, `jurisdiction_scope`, `municipio_id`, `zm_id` cuando aplique, `version_mgn`, `fitness_for_purpose`.
2. **Script o test** que valide que ningún feature mezcla alcance municipal con atribuciones de ZM indebidas (reglas §5.3 NAVIGATOR).
3. **Performance:** tiles objetivo según NAVIGATOR (p. ej. carga &lt; 200 ms referencia; documentar entorno de medición).
4. **Privacidad:** si hay puntos o agregaciones finas, documento breve k-anonimato / LFPDPPP.

---

## 4. Criterios de aceptación

- Navigator emite **PASS** explícito en checklist §5.3 o lista cerrada de FAIL corregidos.
- Sin uso de Web Mercator (3857) para **áreas o distancias** en backend.
- OSM no citado como fuente única para decisiones públicas (solo referencia si aplica).
- Auditor **sin veto Blocker** en aspectos legales/geo-jurisdiccionales del alcance declarado.

---

## 5. Dependencias de lectura

- `06_implementacion_espacio_tiempo.md`, `08_logistica_operativa_per.md` (contexto operativo).
- `17_1_publicacion_y_control_de_acceso.md` cuando el mapa sea usuario autenticado o lleve datos sensibles.

---

## 6. Orden sugerido de trabajo

```text
Navigator (spec + checklist) → Ejecutor (implementación + tests) → Navigator (re-PASS) → Aesthete (presentación) → Auditor (firma legal si aplica)
```
