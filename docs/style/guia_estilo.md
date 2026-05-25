# Guía de estilo por audiencia (EIDOS)

Complemento de `glosario_canonico.md`. Define **cómo** escribir, no solo **qué** términos usar.

## Dos registros válidos

| Registro | Dónde | Características |
|----------|-------|-----------------|
| **Ejecutivo-institucional** | Portadas de capítulo, guía M00, PDF a Cabildo, landing gobierno | Párrafos cortos; conclusión al inicio; sin fórmulas en línea |
| **Técnico-riguroso** | Simulador (módulos M01–M21), anexos, rails de metodología | Supuestos explícitos; VPN/TIR; tablas; referencia a fuente |

No mezclar registros en el mismo bloque sin separación visual (acordeón, rail derecho, anexo).

## Por audiencia

### Alcalde / Cabildo
- Pregunta de decisión visible antes que la metodología.
- Evitar siglas sin definir (excepto RSU en primera mención).
- Cifras con unidad y horizonte: «en 10 años», «MXN/año».
- No prometer dictamen ni resultado garantizado.

### PMO / equipo técnico municipal
- Listas numeradas para secuencias operativas.
- Gates y precondiciones en voz activa: «Debe existir…», «Antes de…».
- Referencias cruzadas a módulo (M06, M10) sin código de sección S* en UI.

### Inversionistas / finanzas
- VPN, TIR, payback, escenario P10/P50/P90.
- Separar derrama por venta de materiales de ahorro presupuestal municipal.
- Riesgo en probabilidad × impacto, no adjetivos vagos.

### Operadores de campo
- Imperativo claro: «Verifique», «Registre», «No mezcle».
- Una acción por bullet.
- Sin metáforas.

### Ciudadano
- Segunda persona plural respetuosa («su hogar», «su municipio»).
- Sin anglicismos; KPI → «indicador clave» si aparece.
- Aviso de no obligación legal cuando aplique.

## Estructura UI simulador

1. **M00 (guía):** orientación del recorrido completo — no repetir portadas de capítulo.
2. **Portada de capítulo:** intro breve (2–3 oraciones) + índice por rubros — no duplicar narrativa larga de M00.
3. **Módulo:** dato + acción; metodología en rail derecho.
4. **Export PDF:** registro ejecutivo; anexos técnicos separados.

## Formato

- Títulos de módulo: frase de pregunta o decisión, no código interno.
- Números: separador de miles es-MX; moneda MXN explícita en primera cifra financiera.
- Fechas: `22 may 2026` o formato largo es-MX en documentos formales.

## Checklist antes de publicar copy

- [ ] Glosario canónico aplicado
- [ ] Registro único por pantalla o sección
- [ ] Audiencia identificable en primer párrafo
- [ ] Sin variantes prohibidas (`scripts/eidos_check_docs.py` en verde)

---

*EIDOS · ALQUIMIA*
