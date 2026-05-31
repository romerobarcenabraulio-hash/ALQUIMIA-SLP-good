# Founder MVP V2 Runbook

Fecha: 2026-05-31

## URL

- Local: `http://127.0.0.1:3000`
- Producción: pendiente de configurar/verificar.

## Crear cuenta institucional

1. Abrir `/comenzar`.
2. Capturar estado, municipio, nombre, cargo, correo, teléfono opcional, institución opcional y contraseña.
3. Con correo institucional, la plataforma envía a `/preparando`.
4. Con Gmail/Outlook/Hotmail u otro genérico, la solicitud va a `/pendiente-validacion`.

Crear cuenta no crea un municipio oficial. El alta oficial de tenant/municipio requiere gate humano founder/admin.

## Aprobar manualmente

Para MVP, la aprobación completa de Plataforma 0 sigue siendo control founder/admin. Si no hay backoffice productivo configurado:

1. Revisar institución, cargo, municipio y correo.
2. Confirmar que el municipio no se toma como dato oficial solo por el dominio.
3. Asociar tenant/municipio por procedimiento admin seguro.
4. Registrar quién aprobó y fecha.

## Probar un municipio

Usar perfiles fixture:

- `/v?tenant=complete-city`
- `/v?tenant=partial-city`
- `/v?tenant=gap-city`

Los tres deben conservar mismo índice documental y mostrar contenido distinto por evidencia.

## Brechas documentales

Cuando falte evidencia, el módulo muestra brecha documental. El mensaje correcto es: falta documento o requiere validación, no “dato pendiente menor”.

## Subir documento

1. En módulo con brecha, usar `Subir documento`.
2. Acepta PDF, DOCX, XLSX, JPG y PNG.
3. Subir documento no valida automáticamente el dato.
4. La información queda pendiente de revisión humana.

## Marcar “no aplica”

Usar solo cuando el documento realmente no aplique al municipio o caso. No borra trazabilidad; conserva estado.

## Exportar ZIP

1. Entrar a `/v`, `/p` o `/e` con tenant.
2. Usar `Exportar ZIP preliminar`.
3. El ZIP incluye índice común, fuentes, confianza, brechas y marca de agua.
4. Límite MVP: 3 exportaciones preliminares por tenant/mes.

## Marca de agua

La marca indica diagnóstico inicial/preliminar. No es sello oficial. Sirve para evitar que una salida de MVP se use como documento validado.

## Citas y fuentes

Cada cifra debe tener fuente, fecha, método y confianza, o aparecer como brecha crítica. Si falta estudio local, decir brecha crítica.

## Qué decir

- “La plataforma organiza evidencia municipal y señala brechas.”
- “El diagnóstico inicial requiere revisión humana.”
- “Benchmark no es estudio local.”
- “Una estimación no es dato oficial.”

## Qué NO prometer

- No prometer ahorro garantizado.
- No decir que ALQUIMIA certifica resultados oficiales.
- No decir que una carga documental valida cifras automáticamente.
- No mezclar municipio y zona metropolitana.
- No mencionar nombres internos de agentes al cliente.

## Cómo reportar bug

Registrar:

- ruta;
- usuario/correo de prueba;
- tenant;
- acción;
- resultado esperado;
- resultado real;
- screenshot si aplica;
- severidad P0/P1/P2/P3.

## Qué bloquea compartir el MVP

- Crear cuenta no funciona.
- Login/TOTP no funciona.
- Ciudad incorrecta o datos cross-tenant.
- ZIP sin watermark o sin índice común.
- Nombres internos visibles al cliente.
- Claims sin fuente/método/confianza o brecha.
- Mobile/desktop inutilizable.

