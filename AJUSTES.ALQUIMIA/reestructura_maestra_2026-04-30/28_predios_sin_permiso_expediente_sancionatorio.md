# Fase 28 · Predios sin permiso — Expediente técnico sancionatorio

**Origen:** Solicitud CSA/Usuario 2026-05-05  
**Cola:** Q-016  
**OLA:** 3+ (depende de Q-009 selector Estado→Municipio y datos catastro oficial)  
**Riesgo:** Alto en geo (polígonos prediales) y legal (expediente ≠ acto de autoridad)

---

## Propósito

Permitir que un inspector municipal o funcionario use ALQUIMIA para:

1. **Identificar** predios con basura clandestina ("cagaderos") o centros de acopio operando sin permiso.
2. **Calcular** la sanción estimada según el reglamento municipal vigente (escalera de multas por UMA).
3. **Generar** un expediente técnico en PDF listo para iniciar el procedimiento administrativo sancionatorio.

> **ALQUIMIA no sanciona.** El municipio sanciona. ALQUIMIA genera el expediente técnico que habilita al inspector a actuar con base documental.

---

## Marco normativo de referencia

- **LGPGIR** Art. [VERIFICAR EN FUENTE OFICIAL] — obligaciones de propietarios respecto a residuos en su predio.
- **LGEEPA** Art. [VERIFICAR] — facultades municipales de inspección y vigilancia.
- **Reglamento Municipal de Aseo Público** de cada ciudad — base de la escalera de multas.
- **Ley de Responsabilidades Administrativas** — procedimiento sancionatorio.
- **Código Civil Federal** Art. [VERIFICAR] — responsabilidad del propietario por daños al entorno.

> Todos los artículos marcados [VERIFICAR] deben ser confirmados por CLC antes de que el expediente se use en un procedimiento real.

---

## Fuentes de datos — gate Navigator obligatorio

| Dato | Fuente oficial | Disponibilidad | Riesgo geo |
|------|---------------|---------------|-----------|
| Polígonos de predios | Catastro municipal (SEDATU / municipio) | Variable — no hay API federal | Alto: formato heterogéneo por ciudad |
| Uso de suelo declarado | DENUE INEGI (SCIAN) | API pública | Medio |
| Permisos CA vigentes | Registro municipal (no hay API) | Manual / carga humana | Bajo |
| Fotografías de infracción | Cámara inspector (upload) | Manual | Nulo (no geo) |

**Navigator debe aprobar** cada fuente de polígonos prediales antes de que se sirvan en mapa. Catastro municipal ≠ INEGI MGN.

---

## Modelo de datos (backend)

```python
class Predio(BaseModel):
    predio_id: str               # CVE catastral municipal
    municipio_id: str            # CVE INEGI municipio
    coordenadas_wkt: str | None  # EPSG:4326 — solo si Navigator aprobó fuente
    uso_suelo_scian: str | None
    area_m2: float | None

class InspeccionPredio(BaseModel):
    inspeccion_id: str
    predio_id: str
    fecha: str
    tipo_infraccion: Literal['basura_clandestina', 'ca_sin_permiso', 'mezcla_residuos', 'otro']
    descripcion: str
    fotos_refs: list[str]        # rutas o URLs de evidencia fotográfica
    inspector_id: str | None

class ExpedienteSancion(BaseModel):
    expediente_id: str
    inspeccion_id: str
    articulo_reglamento: str     # ejemplo: "Art. 37 Bis — Reglamento Aseo Público SLP 2018"
    nivel_sancion: Literal['aviso', 'advertencia', 'multa_1', 'multa_2', 'multa_maxima']
    monto_uma: float             # en UMAs según escalera del reglamento activo
    monto_mxn: float             # UMA × valor vigente INEGI
    genera_clausura: bool
    status: Literal['borrador', 'notificado', 'en_proceso', 'resuelto']
```

---

## Flujo de usuario (inspector municipal)

```
1. Selecciona municipio activo
2. Registra predio:
   - Ubica en mapa (polígono catastral o pin manual)
   - Describe la infracción + sube fotos
3. ALQUIMIA calcula:
   - Artículo del reglamento aplicable
   - Nivel de sanción (aviso / advertencia / multa 1–3)
   - Monto en UMAs → MXN (valor UMA vigente INEGI)
   - ¿Genera clausura?
4. Preview del expediente en pantalla
5. Descarga PDF del expediente técnico (con timestamp, datos del inspector, artículos citados)
6. El expediente queda registrado en el historial del predio
```

---

## Componentes frontend

| Componente | Función |
|-----------|---------|
| `PredioMap.tsx` | Mapa con predios marcados (Navigator gate) |
| `InspeccionForm.tsx` | Wizard: tipo infracción + fotos + descripción |
| `ExpedienteCalculator.tsx` | Calcula sanción según reglamento activo |
| `ExpedientePDF.tsx` | Genera PDF firmable con datos de la inspección |
| `HistorialPredio.tsx` | Timeline de inspecciones por predio |

---

## Restricciones de diseño

1. **El PDF lleva en cabecera:** `[BORRADOR DE EXPEDIENTE TÉCNICO — no es acto de autoridad hasta firma del funcionario competente]`
2. **ALQUIMIA no emite la sanción.** El PDF es insumo para el procedimiento — la resolución la firma el Director de Servicios Municipales o equivalente.
3. **La escalera de multas** usa el reglamento activo en la plataforma. Si el reglamento no está verificado por CLC, el expediente lleva advertencia de no-vinculancia.
4. **Fotos de evidencia:** se guardan en almacenamiento privado. No se publican. Solo el expediente las referencia.
5. **Soledad G.S. y municipios sin reglamento propio:** usar el reglamento base de SLP capital hasta que Q-013 Sprint 3 complete el reglamento nuevo.

---

## Roles y dependencias

| Rol | Acción |
|-----|--------|
| **Navigator** | Aprobar fuente de polígonos prediales por municipio antes del merge (§5.3) |
| **CLC** | Verificar artículos del reglamento; confirmar que el expediente no simula acto de autoridad |
| **Auditor** | Firma el módulo antes de release a usuarios reales |
| **Ejecutor** | Implementa modelos, API y componentes |
| **Aesthete** | Diseña la ficha de predio y el PDF institucional |

---

## Criterios de aceptación

- [ ] Expediente generado lleva disclaimer CLC en cabecera
- [ ] Monto de multa calculado en UMAs con valor INEGI vigente
- [ ] Artículo de reglamento citado verificado por CLC
- [ ] Mapa de predios usa solo fuentes aprobadas por Navigator
- [ ] PDF descargable con timestamp y datos de inspección
- [ ] `tsc --noEmit` y `pytest` pasan sin regresiones
