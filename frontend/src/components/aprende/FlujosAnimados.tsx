'use client'
import { useState } from 'react'

const FLUJOS = [
  {
    material: 'PET', color: '#1A5FA8',
    pasos: ['Tu casa', 'Cubeta azul', 'Camión separado', 'Centro de acopio', 'PetStar', 'Fibra para ropa'],
    destino: 'Fibra para ropa y alfombras (Ciclo: 30 días)',
  },
  {
    material: 'Aluminio', color: '#8B6B4A',
    pasos: ['Tu casa', 'Cubeta gris', 'Centro de acopio', 'Fundición', 'Nueva lata'],
    destino: 'Nueva lata de aluminio en 60 días (Ahorra 95% energía)',
  },
  {
    material: 'Papel', color: '#D4881E',
    pasos: ['Tu casa', 'Cubeta café', 'Centro de acopio', 'IPSL', 'Papel reciclado'],
    destino: 'Cajas y papel industrial (Ciclo: 2 semanas)',
  },
  {
    material: 'Orgánico', color: '#639922',
    pasos: ['Tu casa', 'Cubeta verde', 'Centro de acopio', 'Biodigestor / Composta', 'Gas + Tierra'],
    destino: 'Biogás para cocinar y composta para agricultura',
  },
]

export function FlujosAnimados() {
  const [activoIdx, setActivoIdx] = useState(0)
  const activo = FLUJOS[activoIdx]

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FLUJOS.map((f, i) => (
          <button key={f.material} onClick={() => setActivoIdx(i)}
            className="px-4 py-2 rounded-[8px] text-[12px] font-medium border transition-colors"
            style={{
              background: activoIdx === i ? f.color : 'transparent',
              color: activoIdx === i ? '#fff' : f.color,
              borderColor: f.color + '60',
            }}>
            {f.material}
          </button>
        ))}
      </div>

      {/* Flujo animado */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-6">
        <div className="flex items-center flex-wrap gap-2">
          {activo.pasos.map((paso, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-[8px] text-[12px] font-medium text-white"
                style={{ background: activo.color, opacity: 0.7 + i * 0.05 }}>
                {paso}
              </div>
              {i < activo.pasos.length - 1 && (
                <span className="text-[#A8A49C]">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 px-4 py-3 rounded-[10px]" style={{ background: activo.color + '15', borderLeft: `4px solid ${activo.color}` }}>
          <p className="text-[13px]" style={{ color: activo.color }}>{activo.destino}</p>
        </div>
      </div>
    </div>
  )
}
