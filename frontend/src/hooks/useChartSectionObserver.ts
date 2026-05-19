'use client'

import { RefObject, useEffect, useState } from 'react'

/**
 * Observa secciones con `data-chart-id` dentro del contenedor de módulo
 * y devuelve el id de la gráfica más visible en viewport.
 */
export function useChartSectionObserver(
  rootRef: RefObject<HTMLElement | null>,
  moduleId: string | null,
): string | null {
  const [activeChartId, setActiveChartId] = useState<string | null>(null)

  useEffect(() => {
    setActiveChartId(null)
    const root = rootRef.current
    if (!root || !moduleId) return

    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-chart-id]'))
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = visible[0]?.target as HTMLElement | undefined
        const id = top?.dataset.chartId
        if (id) setActiveChartId(id)
      },
      { root: null, rootMargin: '-15% 0px -50% 0px', threshold: [0.15, 0.35, 0.55, 0.75] },
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootRef, moduleId])

  return activeChartId
}
