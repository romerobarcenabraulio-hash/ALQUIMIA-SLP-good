'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 's1',   label: 'Introducción' },
  { id: 's2',   label: 'Fuentes de datos' },
  { id: 's4',   label: 'Zona Metropolitana' },
  { id: 's4-5', label: 'Marco legal' },
  { id: 's6',   label: 'Composición RSU' },
  { id: 's8',   label: 'Horizonte' },
  { id: 's10',  label: 'Centros de acopio' },
  { id: 's14',  label: 'Impacto financiero' },
  { id: 's15',  label: 'Impacto ambiental' },
  { id: 's17',  label: 'Score político' },
  { id: 's18-25', label: 'Macrogeneradores' },
  { id: 's18-5', label: 'Precolocación' },
  { id: 's18-75', label: 'Causalidad' },
  { id: 's18-9', label: 'Cobertura legal' },
  { id: 's18-95', label: 'Operación' },
  { id: 's20',  label: 'Exportar' },
]

export function Sidebar() {
  const [active, setActive] = useState('s1')

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { threshold: 0.4 }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <aside className="hidden xl:flex flex-col w-52 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-6 px-4">
      <nav className="flex flex-col gap-1">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={cn(
              'text-left text-[12px] px-3 py-2 rounded-[6px] transition-colors',
              active === s.id
                ? 'bg-[#EAF3DE] text-[#3B6D11] font-medium'
                : 'text-[#6B6760] hover:bg-[#F0EDE5]'
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
