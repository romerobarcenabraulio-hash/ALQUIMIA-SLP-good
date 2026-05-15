'use client'

import type { SocialRiskMatrixItem } from '@/data/socialRiskMatrixContent'
import {
  SOCIAL_RISK_MATRIX_CONTENT_VERSION,
  SOCIAL_RISK_MATRIX_ITEMS,
} from '@/data/socialRiskMatrixContent'

function FuenteLine({ fuente }: Pick<SocialRiskMatrixItem, 'fuente'>) {
  const canLink =
    fuente.estado === 'url_estable' &&
    typeof fuente.url === 'string' &&
    /^https?:\/\//i.test(fuente.url.trim())

  if (canLink) {
    return (
      <p className="mt-2 text-[11px] text-[#3B6D11]">
        <span className="text-[#6B6760]">Fuente: </span>
        <a
          href={fuente.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline-offset-2 hover:underline"
        >
          {fuente.etiqueta}
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </p>
    )
  }

  return (
    <p className="mt-2 text-[11px] text-[#6B6760]">
      <span className="text-[#6B6760]">Fuente: </span>
      <span className="font-medium text-[#1C1B18]">{fuente.etiqueta}</span>
      <span className="ml-2 rounded-[4px] border border-[#E8E4DC] bg-[#FAFAF8] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#6B6760]">
        pendiente de fuente
      </span>
    </p>
  )
}

export function SocialRiskMatrixCards() {
  return (
    <section
      data-testid="social-context-risk-matrix"
      data-content-version={SOCIAL_RISK_MATRIX_CONTENT_VERSION}
      className="mt-6 border-t border-[#E8E4DC] pt-6"
      aria-label="Fichas de riesgos — lectura estática"
    >
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760]">Matriz de riesgos (contenido versionado)</p>
      <h4 className="mt-1 font-serif text-[18px] text-[#1C1B18]">Lecturas de riesgo — sin indicadores numéricos</h4>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#6B6760]">
        Fichas cualitativas para acompañar el análisis. No se muestran KPIs agregados ni porcentajes de aceptación; ante duda de
        unidad territorial, solo ámbito en etiqueta y estado vacío conforme a Navigator.
      </p>
      <p className="mt-1 font-mono text-[10px] text-[#6B6760]">Versión de contenido: {SOCIAL_RISK_MATRIX_CONTENT_VERSION}</p>

      <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-1 md:grid-cols-2">
        {SOCIAL_RISK_MATRIX_ITEMS.map(item => (
          <li key={item.id}>
            <article
              data-testid="social-context-risk-card"
              data-risk-id={item.id}
              className="h-full rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3 shadow-[0_1px_0_rgba(28,27,24,0.02)]"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-[#6B6760]">{item.ambito_etiqueta}</p>
              <h5 className="mt-1 text-[14px] font-semibold text-[#1C1B18]">{item.titulo}</h5>
              <p className="mt-2 text-[12px] leading-relaxed text-[#6B6760]">{item.descripcion}</p>
              <FuenteLine fuente={item.fuente} />
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
