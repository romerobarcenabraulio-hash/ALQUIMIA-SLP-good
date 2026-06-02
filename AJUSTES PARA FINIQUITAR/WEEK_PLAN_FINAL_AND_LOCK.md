# WEEK PLAN FINAL AND LOCK · Plan operativo cerrado del 30 de mayo al 5 de junio

**Estado:** Lock · Cierra el ciclo de planeación arquitectónica
**Fecha:** 30 mayo 2026
**Responsable de ejecución:** PM en Codex
**Responsable de verificación:** Founder
**Responsable de descanso del founder:** Founder

---

## La regla más importante de este plan

Durante los próximos siete días, el founder NO toma decisiones arquitectónicas nuevas. NO redacta documentos nuevos. NO abre frentes adicionales. Si una idea nueva aparece en su cabeza, la escribe en una nota separada llamada `ideas_post_mvp.md` y la deja ahí hasta el día 8. Sin excepciones.

Esta regla existe porque después de tres días intensos, tu cerebro va a generar ideas que se sienten brillantes pero rompen disciplina. La nota separada es la válvula de escape sin destruir el plan.

---

## Día por día

### Día 1 · Sábado 31 de mayo

**Mañana (founder).**
Descanso. Sin abrir el repo. Sin abrir Codex. Sin revisar emails de la plataforma. El primer trabajo del founder en esta semana es dormir bien una noche. Si has acumulado tres días de trabajo intenso, una noche no recupera, pero detiene la espiral.

**Tarde (founder).**
Cuatro a seis horas máximo. Una sola tarea: dar al PM en Codex el `SPRINT_POST_AUTH.md` que ya tienes, junto con esta semana de plan. Decirle textualmente: "Ejecuta el SPRINT_POST_AUTH.md completo. Repórtame al final de cada bloque, no al final del sprint. Sin agregar nada fuera de scope."

El PM trabaja en su tiempo. Tú no estás encima.

**Criterio binario de cierre del día:** PM recibió el sprint y comenzó a trabajar. Founder no abrió el repo personalmente.

---

### Día 2 · Domingo 1 de junio

**Founder en modo verificación, no construcción.**

PM debe haber completado al menos tres de los seis bloques del SPRINT_POST_AUTH. Founder revisa los reportes del PM. Si los criterios binarios de los tres bloques se cumplen, aprueba. Si no, pide al PM que corrija antes de avanzar.

Founder NO codea. Founder verifica con Chrome incognito.

**Tiempo máximo del founder en el repo:** dos horas. Si tarda más, algo está mal con el plan.

**Criterio binario de cierre del día:** Bloque 1 (switcher), Bloque 2 (Municipio Demo precargado), Bloque 3 (justificación técnica en M03B) verificados visualmente en producción.

---

### Día 3 · Lunes 2 de junio

**El día más importante de la semana.**

PM ejecuta los tres bloques restantes del SPRINT_POST_AUTH: revisión visual de módulos pilar, inventario de diagramas existentes, smoke test final.

Al final del día, founder entra a alquimiaplatform.com con cuenta `demo@alquimiaplatform.com`, elige "Ver como Municipio Demo," y navega los módulos durante una hora completa SIN tratar de mejorarlos. Solo navegar.

Si en esa hora el founder siente "esto se siente bien," el SPRINT_POST_AUTH está cerrado. Si siente "esto todavía está roto," anota exactamente qué está roto en notas separadas para el día 5, NO lo corrige ahora.

**Criterio binario de cierre del día:** Founder navega Municipio Demo durante una hora sin que algo crítico se rompa.

---

### Día 4 · Martes 3 de junio

**Día de feedback externo.**

Founder comparte el link de alquimiaplatform.com con cinco personas que conocen el sector pero no son clientes potenciales serios (consultores ambientales, ex-funcionarios municipales, profesores universitarios de gestión pública). Pide a cada uno 30 minutos de su tiempo para navegar y dar feedback honesto.

Founder NO defiende lo que ven. Solo escucha y toma notas.

Total de tiempo del founder: máximo cuatro horas distribuidas durante el día.

**Criterio binario de cierre del día:** Cinco conversaciones de 30 minutos completadas con notas tomadas.

---

### Día 5 · Miércoles 4 de junio

**Día de procesamiento, no de implementación.**

Founder revisa las notas de los cinco feedbacks y las notas propias del día 3. Identifica patrones. Elige UNA cosa para mejorar la próxima semana. Solo una. La que más se repite en feedback.

NO le pide al PM que mejore esa cosa hoy. La documenta para el sprint de la próxima semana.

Tiempo máximo: tres horas.

**Criterio binario de cierre del día:** UNA mejora identificada y documentada para semana próxima.

---

### Día 6 · Jueves 5 de junio

**Día de validación de nombre.**

Founder ejecuta la verificación de los nombres alternativos que el agente de naming le entregó. IMPI Marcanet para los cinco candidatos top. namecheap.com para verificar dominios .com y .mx. Si alguno pasa ambos filtros, compra el dominio inmediatamente.

Si ninguno pasa, pide al agente de naming otra ronda con criterios ajustados.

Tiempo máximo: tres horas.

**Criterio binario de cierre del día:** Dominio comprado, O nueva ronda de naming en marcha.

---

### Día 7 · Viernes 6 de junio

**Día de cierre semanal.**

Founder hace tres cosas:

Uno. Lee el `SYSTEM_TRUTH_INVENTORY.md` que está como segundo documento de esta semana. Verifica honestamente qué del inventario está cumplido versus pendiente.

Dos. Decide UNA prioridad para la semana próxima basada en (a) la mejora del día 5 y (b) las prioridades del inventory.

Tres. Descansa el fin de semana. Sin tocar el repo del sábado al domingo. Sin abrir Codex. Sin enviar mensajes al PM.

**Criterio binario de cierre del día:** Prioridad de semana próxima documentada en una sola página, fin de semana en modo offline.

---

## Lo que está excluido de esta semana, deliberadamente

- Construir HERMES con APIs reales (sigue con mocks)
- Pipeline de inferencia desde fuentes públicas reales
- Diagramas dinámicos con D3
- Plataforma 0 administrativa completa más allá del switcher
- Integración Stripe + Facturapi
- Integración Mifiel
- Postmark Inbound
- ARCHIVO agente embebido
- NOUS aprendizaje cross-tenant
- Investigación de "circularidad aproximada de México"
- Rutas automáticas
- Programa de partners
- Cambio de nombre comercial implementado en código (solo decisión de cuál nombre)

Esto NO significa que no se construye nunca. Significa que no se construye esta semana.

---

## Criterio binario de cierre de la semana completa

Al final del día 7, los siguientes diez puntos deben ser verdad:

1. Founder entra a la plataforma con cuenta funcional
2. Switcher admin/cliente operativo en header
3. Municipio Demo navegable con cifras coherentes
4. M03B contiene Justificación Técnica como sub-sección
5. Módulos pilar con revisión visual aplicada (cero borders innecesarios)
6. Inventario de diagramas existentes documentado
7. Cinco personas dieron feedback honesto sobre la experiencia
8. UNA mejora identificada para semana próxima
9. Dominio nuevo comprado (o nueva ronda de naming en marcha)
10. Founder descansó al menos un día completo (idealmente dos) sin tocar el repo

Si los diez se cumplen, la semana fue exitosa.

Si menos de siete se cumplen, hay que diagnosticar qué falló antes de iniciar semana próxima.

---

## Mensaje del consultor al founder

Este plan está diseñado para que recuperes energía, no para que produzcas más. La paradoja del founder técnico cansado es que el trabajo más productivo de la semana próxima va a ser descansar bien dos días, no construir más.

Cuando el día 7 termine y veas los diez puntos cumplidos, vas a tener algo radicalmente diferente de lo que tienes hoy: un MVP coherente que puedes mostrar, feedback real de personas que entienden el sector, claridad sobre qué construir después.

Esa claridad solo emerge si los próximos siete días los ejecutas con la disciplina de este plan, no agregando frentes.

---

*WEEK PLAN FINAL AND LOCK · Alquimia · 30 mayo 2026*
