const ESTUDIOS = [
  {
    id: 'A',
    titulo: 'Torre residencial — CA en planta baja + chutes',
    desc: 'Centro de acopio en planta baja o semisótano con chutes de separación por piso. Requiere adecuación arquitectónica y permisos condominales.',
    viabilidad: 'Alta',
    capex_extra: '$180K MXN',
    requisitos: ['Superficie mínima 80 m² planta baja', '4 chutes codificados por color', 'Báscula de mostrador', 'Ventilación forzada'],
  },
  {
    id: 'B',
    titulo: 'Torre con tubería de separación integrada',
    desc: 'Sistema de tuberías verticales instaladas en etapa de construcción o remodelación mayor. Flujo por gravedad, sin camioneta interna.',
    viabilidad: 'Media',
    capex_extra: '$320K MXN',
    requisitos: ['Diseño estructural integrado', 'Pendiente mínima 10°', 'Contenedores en basement', 'Mantenimiento mensual tuberías'],
  },
  {
    id: 'C',
    titulo: 'Privada residencial — CA central + carrito eléctrico',
    desc: 'Centro de acopio en caseta de entrada o área común con ruta de carrito eléctrico que recoge casa por casa cada 3 días.',
    viabilidad: 'Muy alta',
    capex_extra: '$95K MXN',
    requisitos: ['Espacio en entrada ≥40 m²', '1 carrito eléctrico 500 kg', 'Ruta 2-3 veces/semana', 'App para avisos de recogida'],
  },
  {
    id: 'D',
    titulo: 'Door-to-door casa habitación',
    desc: 'Recolección diferenciada directa en la puerta. El habitante saca 3 cubetas codificadas. El camión clasifica in situ.',
    viabilidad: 'Alta con comunicación',
    capex_extra: '$0 adicional',
    requisitos: ['Kit 3 cubetas por hogar ($280)', 'Ruta programada bisemanal', 'App de seguimiento', 'Campaña comunicación 3 meses'],
  },
]

export function EstudiosIdoneidad() {
  return (
    <div>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Estudios de idoneidad</h2>
      <p className="text-[13px] text-[#6B6760] mb-6">
        Cuatro modelos de integración del centro de acopio según tipología urbana.
        Cada uno tiene distinta viabilidad, CAPEX adicional y requisitos operativos.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ESTUDIOS.map(e => (
          <div key={e.id} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[13px] font-medium text-[#1C1B18] flex-1">{e.titulo}</p>
              <span className="font-mono text-[10px] bg-[#EAF3DE] text-[#3B6D11] px-2 py-0.5 rounded-full ml-2 shrink-0">
                {e.id}
              </span>
            </div>
            <p className="text-[12px] text-[#6B6760] mb-4 leading-relaxed">{e.desc}</p>
            <div className="flex gap-4 mb-3">
              <div>
                <p className="text-[10px] text-[#A8A49C]">Viabilidad</p>
                <p className="text-[12px] font-medium text-[#3B6D11]">{e.viabilidad}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#A8A49C]">CAPEX adicional</p>
                <p className="font-mono text-[12px] text-[#1C1B18]">{e.capex_extra}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {e.requisitos.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-[#6B6760]">
                  <span className="w-1 h-1 rounded-full bg-[#A8A49C] shrink-0" />
                  {r}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
