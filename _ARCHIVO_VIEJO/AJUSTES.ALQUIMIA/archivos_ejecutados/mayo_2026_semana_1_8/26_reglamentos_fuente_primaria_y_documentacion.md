# 26 · Reglamentos como fuente primaria + Documentación descargable completa

**Propósito:** que cualquier persona que use ALQUIMIA pueda **verificar directamente** las fuentes legales en las que se basa el simulador, y descargar el paquete documental completo por municipio/ZM. Principio rector: **el usuario no debe creer ciegamente en la plataforma** — tiene acceso en un clic a los reglamentos originales.

---

## 26.A · Visor de reglamentos por municipio (popup / modal)

### Concepto

Cada vez que el simulador cite un reglamento (Marco Legal, Gate jurídico, Advertencias, Diagnóstico Jurídico, etc.) aparece un **ícono de fuente** (📄 o enlace subrayado). Al hacer clic abre un **modal/drawer** con:

- Nombre oficial del reglamento.
- Municipio y año de versión.
- **Captura de pantalla** (imagen del artículo o portada oficial).
- **Enlace directo** al PDF/HTML oficial en el sitio del municipio o repositorio verificado.
- Nota de estado: "Vigente", "En revisión", "No localizado en fuente oficial" (con bandera de confianza).

### Datos mínimos por entrada

```ts
interface ReglamentoFuente {
  municipio_id: string           // 'slp' | 'soledad' | 'qro' | …
  nombre: string                 // "Reglamento de Aseo y Limpia del Municipio de SLP"
  anio_version: number
  url_fuente: string             // enlace oficial o archivo
  captura_url?: string           // imagen estática (screenshot portada)
  articulos_clave?: string[]     // p. ej. ["Art. 4", "Art. 12"]
  estado_verificacion: 'vigente' | 'en_revision' | 'no_localizado'
  fecha_verificacion: string     // ISO date de última comprobación
  verificado_por?: string        // iniciales o rol
}
```

### Criterios de aceptación

- Modal accesible (foco atrapado, `aria-modal`, cierre con Esc).
- En mobile: drawer desde abajo (no modal centrado).
- Si `url_fuente` está vacía: mostrar "Fuente pendiente de localización" y botón "Reportar fuente".
- Capturas: imágenes estáticas en `/public/reglamentos/[municipio_id]/` o CDN; no dependen de API externa.
- Datos: JSON estático en `frontend/src/data/reglamentos.ts` (no base de datos por ahora) — extensible a endpoint en 23.1+ si hay muchos municipios.

---

## 26.B · Documentación descargable completa por municipio

### Problema

El capítulo San Luis (y otros) tenía más documentos de lo que actualmente muestra el hub de exportación. El paquete descargable debe ser **completo y actualizable** sin depender del Ejecutor para cada municipio nuevo.

### Estructura de paquete por municipio

```
/descargas/slp/
├── reglamento_aseo_limpia_slp_2024.pdf
├── diagnostico_juridico_slp.pdf
├── simulacion_financiera_slp.pdf
├── plan_circularidad_slp.pdf
├── benchmarks_latam_slp.pdf
└── fuentes_y_provenance_slp.md
```

### Criterios de aceptación

- Hub (`/hub`) muestra **todos** los documentos disponibles por municipio, no solo los generados en la sesión.
- Cada documento tiene: nombre, descripción en una línea, fecha de versión, formato (PDF/XLSX/MD), botón de descarga.
- Los documentos que **aún no existen** se muestran con estado "En elaboración" (no ocultos).
- El paquete ZIP descargable incluye todos los disponibles + un `README_paquete.md` con índice y fuentes.

---

## 26.C · Criterio editorial de fuentes (qué se sube, qué no)

| Tipo de documento | ¿Se sube al repo / CDN? | Notas |
|-------------------|------------------------|-------|
| Reglamento oficial municipal (PDF público) | ✅ PDF en `public/reglamentos/` + enlace oficial | Solo PDFs en línea; copia local para modal embebido cuando la URL no es estable |
| Simulación generada por ALQUIMIA | ✅ Sí | Marcada como "Simulación — no documento oficial" |
| Propuesta elaborada por ALQUIMIA | ✅ Sí | Marcada como "Propuesta — requiere revisión institucional" |
| Dictamen legal o acuerdo de cabildo | ❌ Solo enlace | No reproducir sin permiso |
| Datos personales o expedientes | ❌ Nunca | |

---

## 2. Roles

- **Ejecutor:** estructura de datos `reglamentos.ts`, componente modal/drawer, integración en Marco Legal y Advertencias Gate; inventario de docs por municipio en hub.
- **Auditor:** verificar que ningún documento se presente como oficial sin serlo; revisar disclaimers.
- **Navigator:** si los reglamentos incluyen coordenadas o delimitaciones territoriales, validar que no confundan Municipio↔ZM.
- **Humano / CSA:** proveer URLs reales de reglamentos y capturas; definir qué documentos del capítulo SLP estaban antes y deben restaurarse.

---

## 3. Criterios de activación

- Puede iniciarse **en paralelo** con Q-003 (no depende del backend para los estáticos).
- Para el paquete ZIP descargable completo: requiere definir inventario de docs SLP (CSA confirma lista).
- Para el modal de reglamentos: solo necesita `reglamentos.ts` con datos mínimos (puede tener entradas con `estado_verificacion: 'no_localizado'`).

---

## 4. Criterios de aceptación globales

- Un ciudadano puede ver en qué artículo se basa cada afirmación del simulador y abrir el reglamento en un clic.
- El hub muestra todos los documentos del capítulo SLP (completo, no truncado).
- Sin documentos fantasma: si no existe, dice "En elaboración", no lo oculta.
- Auditor firma que ningún documento dice ser oficial sin serlo.
