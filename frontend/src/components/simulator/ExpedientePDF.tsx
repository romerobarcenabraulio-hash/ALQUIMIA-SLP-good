'use client'

import { jsPDF } from 'jspdf'
import type { ExpedienteSancionDto, InspeccionPrediaDto, PredioRegistroDto } from '@/types/predios'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n)
}

const HEADER_PDF_LINE1 =
  '[BORRADOR DE EXPEDIENTE TÉCNICO — no es acto de autoridad hasta firma del funcionario competente]'
const HEADER_PDF_LINE2 =
  'ATENCIÓN: BORRADOR DE EXPEDIENTE TÉCNICO — no es acto de autoridad hasta firma del funcionario competente'

const NIVEL_LABEL: Record<string, string> = {
  aviso: 'Aviso',
  advertencia: 'Advertencia',
  multa_menor: 'Multa menor',
  multa_media: 'Multa media',
  multa_maxima: 'Multa máxima',
  clausura: 'Clausura',
}

export interface ExpedientePDFProps {
  predio: PredioRegistroDto
  inspeccion: InspeccionPrediaDto
  expediente: ExpedienteSancionDto
  disabled?: boolean
}

export function ExpedientePDF({ predio, inspeccion, expediente, disabled }: ExpedientePDFProps) {
  const descargar = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 18
    let y = 16

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    const h1 = doc.splitTextToSize(HEADER_PDF_LINE1, pageW - margin * 2)
    doc.text(h1, margin, y)
    y += h1.length * 5 + 2
    const h2 = doc.splitTextToSize(HEADER_PDF_LINE2, pageW - margin * 2)
    doc.text(h2, margin, y)
    y += h2.length * 5 + 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text('Expediente técnico sancionatorio (borrador)', margin, y)
    y += 8

    const bloques: string[] = [
      `Identificador expediente: ${expediente.expediente_id}`,
      `Municipio (referencia simulador): ${expediente.municipio_id}`,
      `Fecha de generación (UTC): ${expediente.fecha_generacion}`,
      '',
      '--- Predio ---',
      `Dirección declarada: ${predio.direccion_texto}`,
      predio.lat != null && predio.lon != null
        ? `Coordenadas manuales (WGS84): ${predio.lat}, ${predio.lon}`
        : 'Coordenadas manuales: no proporcionadas',
      predio.uso_suelo_declarado ? `Uso declarado: ${predio.uso_suelo_declarado}` : '',
      predio.area_m2 != null ? `Área declarada: ${predio.area_m2} m²` : '',
      '',
      '--- Inspección ---',
      `Fecha inspección: ${inspeccion.fecha_inspeccion}`,
      `Tipo de infracción: ${inspeccion.tipo_infraccion}`,
      `Descripción del hallazgo: ${inspeccion.descripcion_hallazgo}`,
      `Permiso de Centro de Acopio: ${inspeccion.tiene_permiso_ca ? 'Sí' : 'No'}`,
      inspeccion.tiene_permiso_ca
        ? `Permiso vigente: ${inspeccion.permiso_ca_vigente === null ? '—' : inspeccion.permiso_ca_vigente ? 'Sí' : 'No'}`
        : '',
      `Inspector: ${inspeccion.inspector_nombre ?? '—'} (${inspeccion.inspector_cargo ?? 'sin cargo'})`,
      '',
      '--- Sanción orientativa (UMA / MXN) ---',
      `Nivel: ${NIVEL_LABEL[expediente.nivel_sancion] ?? expediente.nivel_sancion}`,
      `Rango UMA (referencia): ${(expediente.monto_min_mxn / expediente.valor_uma_mxn).toFixed(4)} – ${(expediente.monto_max_mxn / expediente.valor_uma_mxn).toFixed(4)} UMA`,
      `Valor UMA de referencia: ${fmtMoney(expediente.valor_uma_mxn)}`,
      `Monto orientativo (${fmtMoney(expediente.monto_min_mxn)} – ${fmtMoney(expediente.monto_max_mxn)}); punto medio utilizado para trazabilidad: ${fmtMoney(expediente.uma_aplicado * expediente.valor_uma_mxn)}`,
      `¿Genera clausura orientativa?: ${expediente.genera_clausura ? 'Sí' : 'No'}`,
      `Artículo reglamento (texto oficial): ${expediente.articulo_reglamento}`,
      '',
      `Disclaimer sistémico: ${expediente.disclaimer}`,
    ]

    for (const line of bloques) {
      if (!line) continue
      const wrapped = doc.splitTextToSize(line, pageW - margin * 2)
      if (y + wrapped.length * 5 > doc.internal.pageSize.getHeight() - 28) {
        doc.addPage()
        y = 16
      }
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5 + 1
    }

    const pie =
      `Documento generado por ALQUIMIA el ${new Date().toLocaleString('es-MX')}. Este documento es un insumo técnico para ` +
      `el procedimiento administrativo municipal. La resolución sancionatoria corresponde exclusivamente ` +
      `a la autoridad municipal competente conforme al Reglamento de Aseo Público.`
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 76)
    const pieLines = doc.splitTextToSize(pie, pageW - margin * 2)
    doc.text(pieLines, margin, doc.internal.pageSize.getHeight() - 22)

    doc.save(`expediente_tecnico_${expediente.expediente_id}.pdf`)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={descargar}
      className="rounded-[10px] border border-[#3B6D11] bg-[#3B6D11] px-4 py-2.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:border-[#E8E4DC] disabled:bg-[#E2DED6] disabled:text-[#A8A49C]"
    >
      Descargar PDF del expediente
    </button>
  )
}
