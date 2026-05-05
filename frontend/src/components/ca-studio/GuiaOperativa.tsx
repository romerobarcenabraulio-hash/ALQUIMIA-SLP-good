const PASOS = [
  { n: 1, titulo: 'Recepción y pesaje',       desc: 'El camión accede a la báscula. Se registra peso bruto, tara y hora de llegada.' },
  { n: 2, titulo: 'Clasificación inicial',     desc: 'El operador verifica la carga separada. Materiales mezclados van a línea de separación manual.' },
  { n: 3, titulo: 'Separación por fracción',   desc: 'Se separan: PET, HDPE, papel, cartón, vidrio, aluminio y orgánicos.' },
  { n: 4, titulo: 'Compactación',              desc: 'Los materiales clasificados pasan por la prensa hidráulica. PET y papel se embailan (pacas de 400-600 kg).' },
  { n: 5, titulo: 'Almacenamiento',            desc: 'Las pacas se almacenan por material en zonas señalizadas. Máximo 72h antes de despacho.' },
  { n: 6, titulo: 'Despacho a recicladora',    desc: 'El camión de la recicladora recoge y firma bitácora de salida con peso neto y precio acordado.' },
  { n: 7, titulo: 'Registro / trazabilidad',   desc: 'Se sube al sistema: entradas, salidas, rechazos, incidentes. Genera reporte semanal automático.' },
  { n: 8, titulo: 'Mantenimiento diario',      desc: 'Revisión de bandas, niveles de aceite prensa, limpieza de área orgánica y revisión de báscula.' },
]

export function GuiaOperativa() {
  return (
    <div>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-6">Guía operativa del centro de acopio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PASOS.map(p => (
          <div key={p.n} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-5">
            <div className="flex items-start gap-4">
              <span className="font-mono text-[32px] text-[#E2DED6] leading-none shrink-0">
                {String(p.n).padStart(2, '0')}
              </span>
              <div>
                <p className="text-[13px] font-medium text-[#1C1B18] mb-1">{p.titulo}</p>
                <p className="text-[12px] text-[#6B6760] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
