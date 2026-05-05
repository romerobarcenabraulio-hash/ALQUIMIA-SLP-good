# 14 Exportación Documental

## Propósito

Definir el paquete documental profesional que ALQUIMIA debe generar, con audiencia, nivel de oficialidad, fuentes, estado, bloqueos y acciones de desbloqueo.

## Alcance

Incluye documento ciudadano, memo legal expositivo, plan de implementación, plan financiero, plan operativo, reporte ambiental, comparativo de escenarios, anexos de ClaimLedger, anexo de fuentes y ZIP profesional.

## Problema Que Corrige

La generación documental pierde valor si produce archivos sueltos o textos sin estructura verificable. El producto final debe ser un paquete defendible, descargable, trazable y comprensible por audiencia.

## Decisiones De Producto

- No usar `.txt` como producto final.
- Cada documento debe declarar audiencia y nivel de oficialidad.
- Todo documento legal debe decir propuesta expositiva si no hay validación formal.
- Cada archivo debe tener estado: borrador, revisión, defendible o bloqueado.
- Todo bloqueo debe incluir acción de desbloqueo.
- El ZIP debe incluir manifest, fuentes, ClaimLedger, documentos principales y anexos.
- La descarga debe estar disponible desde plataforma y no depender solo de Drive.

## Modelo De Datos Sugerido

```ts
type OfficialityLevel = 'informativo' | 'propuesta_expositiva' | 'revision_tecnica' | 'dictamen_externo' | 'documento_oficial'
type DocumentStatus = 'borrador' | 'revision' | 'defendible' | 'bloqueado'

interface ExportableDocument {
  id: string
  nombre_archivo: string
  titulo: string
  audiencia: string[]
  nivel_oficialidad: OfficialityLevel
  estado: DocumentStatus
  fuentes: string[]
  bloqueos: string[]
  acciones_desbloqueo: string[]
  formato: 'docx' | 'xlsx' | 'pdf' | 'json'
}

interface ProfessionalPackage {
  package_id: string
  ciudad_id: string
  documentos: ExportableDocument[]
  manifest_url: string
  zip_url: string
  claimledger_url: string
  creado_en: string
}
```

## Endpoints Sugeridos

- `POST /generate/plan`
- `GET /generate/plan/{package_id}/manifest`
- `GET /generate/plan/{package_id}/assets`
- `GET /generate/plan/{package_id}/download`
- `GET /generate/plan/{package_id}/download-professional`
- `POST /export/render-professional`

## Componentes Frontend Sugeridos

- `DocumentPackageStatus`
- `ExportableDocumentCards`
- `DownloadProfessionalZipButton`
- `DocumentOfficialityBadge`
- `DocumentBlockerActions`
- `ClaimLedgerAnnexPreview`

## Relación Con Código Actual

Ya existen funciones frontend para manifest, assets, ZIP base y ZIP profesional en `frontend/src/lib/api.ts`. En backend existen agentes y exportación profesional. Esta fase debe asegurar que el producto final sea paquete profesional, no texto suelto, y que se pueda descargar desde la plataforma.

## Criterios De Aceptación

- Cada documento exportado declara audiencia, oficialidad, estado y fuentes.
- El ZIP contiene manifest y anexo de ClaimLedger.
- La plataforma permite descargar el paquete profesional.
- Los bloqueos aparecen con acción de desbloqueo.
- No hay `.txt` como salida principal.

## Riesgos De Mala Implementación

- Generar documentos vistosos sin evidencia.
- Ocultar que un memo legal es propuesta expositiva.
- Depender solo de Drive para entregar resultados.
- Exportar documentos con claims no soportados.

## Qué NO Hacer

- No llamar oficial a un documento generado por IA.
- No exportar `.txt` como entregable final.
- No permitir descarga sin manifest.
- No quitar warnings para que el paquete se vea limpio.

## Prompt Final Para Agente Codificador

Consolida exportación documental alrededor de `ProfessionalPackage` y `ExportableDocument`. Verifica que todos los documentos tengan audiencia, oficialidad, estado, fuentes, bloqueos y acciones. La plataforma debe permitir descargar ZIP profesional con manifest, fuentes y ClaimLedger. Agrega tests para impedir salidas `.txt` como producto final y documentos sin nivel de oficialidad.
