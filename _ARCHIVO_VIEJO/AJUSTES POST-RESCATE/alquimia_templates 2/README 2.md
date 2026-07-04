# Alquimia Templates Pack v1.0

Paquete de templates institucionales que el sistema usa como base cuando genera los documentos finales que el cliente exporta. Cada template está estructurado con jerarquía McKinsey/BCG/Deloitte adaptada al contexto de consultoría municipal mexicana.

---

## Templates incluidos

| Archivo | Etapa | Propósito |
|---|---|---|
| `00_PORTADA_INSTITUCIONAL.docx` | Universal | Portada que abre cualquier documento formal |
| `V01_EXPEDIENTE_DIAGNOSTICO_CABILDO.docx` | Validación | Documento principal del Tier Diagnóstico, listo para Cabildo |
| `V02_RESUMEN_EJECUTIVO.docx` | Validación | Versión 2-3 páginas para alcalde, síndico, tesorero |
| `P01_PLAN_MAESTRO_IMPLEMENTACION.docx` | Planeación | Documento principal del Tier Implementación |
| `E01_REPORTE_ESG_TRIMESTRAL.docx` | Ejecución | Reporte ESG con doble materialidad GRI/CSRD |
| `T01_MEMORIA_TECNICA_METODOLOGICA.docx` | Transversal | Documenta cómo se construye cada cifra del sistema |
| `T02_BIBLIOGRAFIA_FORMATO_ALQUIMIA.docx` | Transversal | Plantilla de bibliografía formato Alquimia adaptado de Chicago |

---

## Variables que el sistema reemplaza automáticamente

Cada template usa variables entre corchetes que el sistema reemplaza con datos del tenant antes de exportar al cliente:

| Variable | Reemplazo |
|---|---|
| `[MUNICIPIO]` | Nombre del municipio cliente |
| `[ESTADO]` | Estado de la república |
| `[CLAVE_INEGI]` | Clave INEGI del municipio |
| `[FECHA]` | Fecha de generación en formato "DD de [mes] de YYYY" |
| `[VERSION]` | Versión del documento (1.0, 1.1, etc.) |
| `[PRESIDENTE_MUNICIPAL]` | Nombre del Presidente Municipal |
| `[PERIODO]` | Periodo de gobierno (formato YYYY-YYYY) |
| `[POBLACION]` | Población del municipio según INEGI |
| `[GENERACION_TOTAL]` | Generación total de RSU diaria |
| `[N_VALIDADO]` | Porcentaje de validación del diagnóstico |
| `[N_MODULOS_COMPLETOS]` | Módulos completos sobre total |

---

## Filosofía aplicada en cada template

Los templates siguen la filosofía inamovible de Alquimia:

**Cero invención.** Cada cifra en cualquier template lleva su sello de origen (🟢 Investigado / 🟡 Calculado / 🔵 De tu documento) y cita verificable en notas al pie.

**Bibliografía formato Alquimia adaptado de Chicago notes-bibliography.** Cada documento cierra con sección "Bibliografía" compilada automáticamente desde las citas usadas.

**Watermark institucional.** Mientras el diagnóstico está en construcción, cada página lleva watermark: "ALQUIMIA · Diagnóstico en construcción · [N] de [M] módulos completos · [FECHA]"

**Estructura McKinsey-style.** Pyramid principle aplicado: respuesta principal arriba, evidencia desplegada después, recomendaciones al cierre. Cada documento empieza con resumen ejecutivo, no con metodología.

---

## Cómo el sistema usa estos templates

Cuando el cliente solicita exportar a PDF/ZIP:

1. Sistema identifica qué tipo de documento se solicita (Expediente Cabildo, Resumen Ejecutivo, Plan Maestro, etc.).
2. Sistema lee el template correspondiente desde `/templates/alquimia/`.
3. Sistema sustituye todas las variables `[XXX]` con datos reales del tenant.
4. Sistema inserta gráficas embebidas según el módulo correspondiente.
5. Sistema compila bibliografía a partir de citas usadas.
6. Sistema embebe los tres marcadores institucionales (firma metodológica, cita Alquimia en bibliografía, trazabilidad cruzada).
7. AUDITOR verifica cumplimiento de estándares declarados antes de generar el archivo final.
8. Sistema empaqueta en ZIP encriptado y envía link + contraseña separada al cliente.

---

## Versión y mantenimiento

**Versión actual:** 1.0
**Fecha de release:** 30 mayo 2026
**Próxima revisión:** después de Sprint 2 con feedback de SLP como primer cliente real.

Cuando se modifique un template, incrementar versión en metadatos del archivo. El sistema mantiene compatibilidad con templates v1.x mientras se construye v2.

---

*Alquimia Templates Pack · 30 mayo 2026*
