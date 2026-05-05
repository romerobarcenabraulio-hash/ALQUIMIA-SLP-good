'use client'
import { useEffect, useState } from 'react'

const RSU_DIA_MX = 120000  // toneladas/día México
const PCT_RELLENO = 0.75

export function ContadorRelleno() {
  const [tonRelleno, setTonRelleno] = useState(0)
  const [valor, setValor] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const rsuSegundo = (RSU_DIA_MX * PCT_RELLENO) / 86400
    const valorSegundo = rsuSegundo * 1000 * 4 // ~$4 MXN/kg promedio si se valorizara

    const interval = setInterval(() => {
      const seg = (Date.now() - start) / 1000
      setTonRelleno(seg * rsuSegundo)
      setValor(seg * valorSegundo)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#FBEAEA] border border-[#C0392B]/30 rounded-[14px] p-6">
          <p className="text-[11px] uppercase tracking-wide text-[#C0392B] mb-2">
            Toneladas al relleno sanitario desde que entraste
          </p>
          <p className="font-mono text-[38px] text-[#C0392B]">{tonRelleno.toFixed(1)} t</p>
          <p className="text-[12px] text-[#8A4F08] mt-1">México genera 120,000 t/día · 75% va al relleno</p>
        </div>
        <div className="bg-[#FEF7E7] border border-[#D4881E]/30 rounded-[14px] p-6">
          <p className="text-[11px] uppercase tracking-wide text-[#D4881E] mb-2">
            Valor enterrado (si se hubiera reciclado)
          </p>
          <p className="font-mono text-[38px] text-[#D4881E]">${valor.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN</p>
          <p className="text-[12px] text-[#8A4F08] mt-1">Calculado a precio promedio de commodities 2024</p>
        </div>
      </div>

      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5">
        <p className="text-[13px] font-medium text-[#1C1B18] mb-3">Rellenos sanitarios activos en México</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { ciudad: 'CDMX', nombre: 'Bordo Poniente', vidaUtil: 'Saturado' },
            { ciudad: 'MTY', nombre: 'El Guitarrón', vidaUtil: '~8 años' },
            { ciudad: 'SLP', nombre: 'El Eje', vidaUtil: '~12 años' },
            { ciudad: 'GDL', nombre: 'Picachos', vidaUtil: '~6 años' },
          ].map(r => (
            <div key={r.ciudad} className="text-center">
              <p className="font-mono text-[11px] text-[#1C1B18]">{r.ciudad}</p>
              <p className="text-[11px] text-[#6B6760]">{r.nombre}</p>
              <p className={`font-mono text-[12px] mt-1 ${r.vidaUtil === 'Saturado' ? 'text-[#C0392B]' : 'text-[#D4881E]'}`}>
                {r.vidaUtil}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
