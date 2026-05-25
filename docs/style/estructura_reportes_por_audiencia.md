# Estructura de reportes por audiencia (LOGOS)

Aplicación de `guia_estilo.md` a informes y plantillas del sistema.

## Cabildo / Alcalde

**Marco:** SCQA (Situación → Complicación → Pregunta → Respuesta)  
**Registro:** ejecutivo-institucional — sin fórmulas en línea

| Orden | Sección | Propósito |
|-------|---------|-----------|
| 1 | Metadatos | Municipio, fecha, clasificación |
| 2 | **Pregunta de decisión** | Qué debe resolver el Cabildo en esta sesión |
| 3 | Síntesis ejecutiva | Conclusión en 3–5 oraciones |
| 4 | Situación / marco local | Operador, reglamento, contexto político |
| 5 | Propuesta en cifras | Tablas con bloque QHC |
| 6 | Próximo paso / Gate | Acción concreta post-sesión |
| 7 | Anexo técnico (opcional) | Metodología separada del cuerpo |

**Plantilla:** `data/municipalities/templates/informe_ejecutivo.template.md`

---

## Inversionista / finanzas

**Marco:** orientado a la acción (Hallazgos → Retorno → Riesgos)  
**Registro:** técnico-financiero con glosas en primera mención

| Orden | Sección |
|-------|---------|
| 1 | Resumen ejecutivo (CAPEX, OPEX, payback) |
| 2 | CAPEX por componente + QHC |
| 3 | Unit economics + QHC |
| 4 | Payback y sensibilidades |
| 5 | Riesgos de costo |
| 6 | Disclaimer de proyección |

**Plantilla:** `data/municipalities/templates/plantilla_inversionista.json`  
**Generador:** `modules/planning/budget/report_templates.py`

---

## Ambiental / BIOS (Cabildo + inversionista)

**Marco:** SCQA ambiental + retorno financiero  
**Registro:** ejecutivo con glosas VPN/TIR/CO₂e

| Orden | Sección |
|-------|---------|
| 1 | Pregunta de decisión (beneficio ambiental + retorno) |
| 2 | Resumen CO₂e + VPN/TIR + QHC |
| 3 | CO₂e por fracción + QHC |
| 4 | Sensibilidad VPN + QHC |
| 5 | Disclaimer |

**Generador:** `modules/lifecycle/report_templates.py`  
**Salida:** `data/environmental/reports/informe_{fecha}.md`

---

## PMO / equipo técnico municipal

**Marco:** operativo con gates y precondiciones  
**Registro:** técnico-riguroso — tablas, métricas, voz activa

| Orden | Sección |
|-------|---------|
| 1 | Resumen (AC, baseline, semáforos) |
| 2 | AC por categoría + QHC |
| 3 | Desviaciones vs. baseline |
| 4 | Costos de no-calidad |
| 5 | Indicadores de eficiencia + QHC |
| 6 | Alertas y acciones |
| 7 | Supuestos y fuentes |

**Plantilla:** `data/financial/reports/templates/plantilla_pmo.json`

---

## Operador de campo

**Marco:** protocolo operativo  
**Registro:** imperativo, una acción por bullet

| Orden | Sección |
|-------|---------|
| 1 | Objetivo del turno / ruta |
| 2 | Verificar antes de salir |
| 3 | Registrar durante operación |
| 4 | No mezclar / límites de seguridad |
| 5 | Escalar si… |

**Referencia:** `05_manual_operativo_90_dias` en `document_blueprints.py`  
**Nota:** informes operativos se generan desde KRONOS/HERMES; esta estructura aplica a manuales y bitácoras.

---

## Checklist LOGOS antes de publicar

- [ ] Audiencia identificable en sección 1 o 2
- [ ] Cada tabla/gráfica compleja tiene bloque QHC
- [ ] Tecnicismos aterrizados en audiencias Cabildo/ciudadano
- [ ] Sin «obviamente» ni supuestos de conocimiento previo no declarado
- [ ] Registro único por sección (no mezclar tono Cabildo con jerga PMO)

---

*LOGOS · ALQUIMIA*
