# Reestructura Maestra ALQUIMIA

Fecha: 30 de abril de 2026  
Uso: carpeta rectora para redisenar ALQUIMIA como plataforma guiada por ciudad, decisiones publicas, fases institucionales, trazabilidad y documentos defendibles.

---

## Orden De Lectura

1. `00_resumen_ejecutivo_reestructura.md`
2. `01_mapa_experiencia_usuario.md`
3. `02_modelo_fases_institucionales.md`
4. `03_marco_legal_expositivo.md`
5. `04_problema_rsu_y_educacion.md`
6. `05_macrogeneradores_y_grandes_generadores.md`
7. `06_implementacion_espacio_tiempo.md`
8. `07_infraestructura_centros_acopio.md`
9. `08_logistica_operativa_per.md`
10. `09_motor_financiero_roi.md`
11. `10_impacto_ambiental_y_economico.md`
12. `11_viabilidad_politica.md`
13. `12_causalidad_y_trazabilidad.md`
14. `13_comparacion_escenarios.md`
15. `14_exportacion_documental.md`
16. `15_backlog_fases_11_a_15.md`
17. `16_roadmap_granular_10_1_a_17.md`
18. `17_gobernanza_calidad_riesgo_y_dod.md`
19. `13_1_b_refinamiento_narrativo_y_visual.md`
20. `17_1_publicacion_y_control_de_acceso.md`
21. `18_estandar_estetico_y_narrativo_elite.md`
22. `18_estetica_causal_dinamica.md`
23. `19_refactorizacion_estetica_causal.md`
24. `19_narrativa_institucional_elite.md`
25. `20_ajuste_narrativo_institucional.md`
26. `21_pulido_final_release.md`
27. `22_0_audience_gateway.md`
28. `22_1_perfil_ciudadano.md`
29. `22_2_perfil_funcionario.md`
30. `22_3_perfil_empresario.md`
31. `22_4_narrative_bridge_spec.md`
32. `22_5_purgacion_visual.md`
33. `22_6_evolucion_backend_audience.md`
34. `23_integridad_geoespacial_y_capas.md`
35. `24_release_gate_e2e_observabilidad.md`
36. `25_tokens_y_design_as_code.md`

---

## Principio Rector

ALQUIMIA no debe sentirse como un scroll largo de modulos acumulados. Debe ser una experiencia guiada:

```text
seleccionar ciudad/municipio
  -> entender marco legal y problema RSU
  -> elegir horizonte de circularidad
  -> disenar fases, zonas, infraestructura y operacion
  -> simular economia, ambiente y politica
  -> explicar causalidad y fuentes
  -> comparar escenarios
  -> generar documentos por audiencia
```

La ciudad se selecciona primero. Todo lo demas se adapta a esa ciudad, a sus municipios, reglamentos, demografia, concesionario, infraestructura, mercado y riesgos.

---

## Fuentes De Verdad

Fuentes primarias para calculo y documentos:

- codigo actual del simulador;
- `DataProvenance`;
- `ClaimLedger`;
- snapshots de datos;
- bibliografia oficial o verificada;
- reglamentos municipales verificados;
- fuentes de mercado con estado de confianza;
- inputs manuales declarados como manuales.

Fuentes contextuales, no primarias:

- `Observaciones hasta ahora de alquimia.docx`;
- documentos historicos de SLP;
- capturas de pantalla;
- prompts anteriores;
- benchmarks no trazados.

Regla dura: documentos historicos SLP pueden inspirar estructura, lenguaje y memoria institucional, pero no son verdad nacional ni sustituyen reglamentos municipales.

---

## Definiciones Obligatorias

- `Ciudad/ZM`: territorio de trabajo metropolitano o urbano.
- `Municipio`: entidad juridica con reglamento propio.
- `Documento expositivo`: muestra explicativa o propuesta preliminar.
- `Dictamen`: evaluacion tecnica/legal formal emitida por autoridad competente.
- `Documento oficial`: documento aprobado por autoridad facultada.
- `Simulacion`: calculo con supuestos y fuentes trazadas.
- `Propuesta`: texto o accion sugerida para revision y aprobacion.

ALQUIMIA genera simulaciones, propuestas y documentos expositivos. No emite dictamen legal oficial ni aprueba politicas publicas.

---

## Regla De Implementacion

Cada archivo de esta carpeta debe poder entregarse a un agente codificador sin explicacion verbal adicional. Si un archivo necesita que el usuario explique "lo que quiso decir", el archivo no esta listo.

Para implementar, el agente debe leer `15_backlog_fases_11_a_15.md` como mapa rector, `16_roadmap_granular_10_1_a_17.md` como contrato operativo y `17_gobernanza_calidad_riesgo_y_dod.md` como regla de aceptacion. No debe tomar una fase grande completa si puede cerrarla por subfases verificables.

Orquestacion multi-agente (CSA): usar `COLA_Y_ROLES_AGENTES.md` en la raiz del repositorio. Fases **23–25** (geo, release gate, tokens) estan especificadas en esta carpeta y se leen despues de `22_6` segun el orden de lectura.
