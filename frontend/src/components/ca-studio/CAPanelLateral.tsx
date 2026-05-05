'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CA_CONFIG } from '@/lib/constants'
import { fmt } from '@/lib/utils'

export function CAPanelLateral({ escala }: { escala: 'P' | 'M' | 'G' }) {
  const { resultados } = useSimulatorStore()
  const ca = CA_CONFIG[escala]
  const r  = resultados

  const maquinas = [
    { nombre: 'Banda transportadora', status: 'ok' },
    { nombre: 'Prensa 1',             status: 'ok' },
    { nombre: 'Prensa 2',             status: escala !== 'P' ? 'ok' : null },
    { nombre: 'Prensa 3',             status: escala === 'G' ? 'warning' : null },
    { nombre: 'Montacargas',          status: escala !== 'P' ? 'ok' : null },
    { nombre: 'Digestor orgánico',    status: escala === 'G' ? 'ok' : null },
  ].filter(m => m.status !== null)

  return (
    <div className="flex flex-col gap-4">
      {/* Entradas hoy */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-4">
        <p className="text-[11px] uppercase tracking-wide text-[#A8A49C] mb-3">ENTRADAS HOY (t)</p>
        {[
          { mat: 'Plásticos', vol: r?.volCapturablePorMat.plastico ?? 0, color: '#1A5FA8' },
          { mat: 'Papel',     vol: r?.volCapturablePorMat.papel     ?? 0, color: '#D4881E' },
          { mat: 'Vidrio',    vol: r?.volCapturablePorMat.vidrio    ?? 0, color: '#1D9E75' },
          { mat: 'Orgánico',  vol: r?.volCapturablePorMat.organico  ?? 0, color: '#639922' },
        ].map(m => (
          <div key={m.mat} className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-[#6B6760] w-16">{m.mat}</span>
            <div className="flex-1 h-1.5 bg-[#E2DED6] rounded-full">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, m.vol * 10)}%`, background: m.color }} />
            </div>
            <span className="font-mono text-[11px] text-[#1C1B18] w-10 text-right">{m.vol.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Salidas este mes */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-4">
        <p className="text-[11px] uppercase tracking-wide text-[#A8A49C] mb-3">SALIDAS ESTE MES</p>
        <div className="flex flex-col gap-2 text-[11px]">
          <div className="flex justify-between">
            <span className="text-[#6B6760]">A recicladoras:</span>
            <span className="font-mono text-[#3B6D11]">
              {r ? (Object.values(r.volCapturablePorMat).reduce((s,v) => s+v, 0) * 30 / 1000).toFixed(0) : '—'} K t → {fmt.mxnK(ca.ingresoMesA3)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B6760]">A composta:</span>
            <span className="font-mono text-[#639922]">
              {r ? ((r.volCapturablePorMat.organico ?? 0) * 0.70 * 30 / 1000).toFixed(0) : '—'} K t
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B6760]">Biogás generado:</span>
            <span className="font-mono text-[#1A5FA8]">{r ? fmt.kwh(r.kwhBiogas / 12) : '—'}</span>
          </div>
        </div>
      </div>

      {/* Personal en turno */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-4">
        <p className="text-[11px] uppercase tracking-wide text-[#A8A49C] mb-2">PERSONAL EN TURNO</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {Array.from({ length: ca.empleos }, (_, i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-[#3B6D11] opacity-80" />
          ))}
        </div>
        <p className="font-mono text-[13px] text-[#1C1B18]">{ca.empleos}/{ca.empleos} empleados</p>
      </div>

      {/* Estado maquinaria */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-4">
        <p className="text-[11px] uppercase tracking-wide text-[#A8A49C] mb-2">ESTADO MAQUINARIA</p>
        <div className="flex flex-col gap-1">
          {maquinas.map(m => (
            <div key={m.nombre} className="flex items-center gap-2 text-[11px]">
              <span className={m.status === 'ok' ? 'text-[#3B6D11]' : 'text-[#D4881E]'}>
                {m.status === 'ok' ? '✓' : '⚠'}
              </span>
              <span className="text-[#6B6760]">{m.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
