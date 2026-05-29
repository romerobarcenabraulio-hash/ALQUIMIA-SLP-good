/**
 * Tokens compartidos — patrón consulting-editorial (sistema editorial / guardrail editorial).
 * Serif: Literata (--font-literata) ≈ Tiempos / Source Serif Pro en brief.
 */
export const editorial = {
  conclusion:
    'font-serif text-[22px] md:text-[23px] font-normal leading-[1.35] text-gray-900c max-w-[580px] mb-7',
  sectionLabel:
    'font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400c mb-2.5',
  anchorFigure: '28px',
  anchorContext: 'text-[14px] leading-[1.55] text-gray-600c pt-1',
  recommendationBody: 'font-serif text-[16px] leading-[1.6] text-gray-900c max-w-[620px]',
  marginalNote: 'font-sans text-[12px] leading-[1.5] text-gray-600c',
  divider: 'border-t border-[0.5px] border-gray-200c',
} as const
