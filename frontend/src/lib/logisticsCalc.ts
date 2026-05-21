/** Cálculo dinámico de flota logística desde RSU diario. */

const MATERIAL_SHARE: Record<string, number> = {
  'Materia orgánica': 0.52,
  'Papel / cartón': 0.167,
  'Plásticos': 0.187,
  'Vidrio': 0.055,
  'Metales': 0.018,
  'Otros': 0.103,
}

const TRUCK_CAPACITY_TON = 8
const TRIPS_BY_FREQ: Record<string, number> = {
  'Diaria': 1,
  '3×/sem': 3 / 7,
  '2×/sem': 2 / 7,
  '1×/sem': 1 / 7,
}

export interface TruckRow {
  material: string
  volDia: number
  camiones: number
  frecuencia: string
  riesgo: string
  obs: string
}

const META: Record<string, { frecuencia: string; riesgo: string; obs: string }> = {
  'Materia orgánica': { frecuencia: 'Diaria', riesgo: 'Alto', obs: 'Perecible — no retrasar recolección' },
  'Papel / cartón': { frecuencia: '3×/sem', riesgo: 'Medio', obs: 'Compactar para reducir viajes' },
  'Plásticos': { frecuencia: '3×/sem', riesgo: 'Alto', obs: 'Alta densidad variable; revisar carga' },
  'Vidrio': { frecuencia: '2×/sem', riesgo: 'Bajo', obs: 'Pesado — camión de bajo perfil' },
  'Metales': { frecuencia: '1×/sem', riesgo: 'Bajo', obs: 'Alto valor por peso; prioritario' },
  'Otros': { frecuencia: '2×/sem', riesgo: 'Bajo', obs: 'Consolidar con ruta de residuos mixtos' },
}

export function computeTrucksByMaterial(rsuDia: number): TruckRow[] {
  return Object.entries(MATERIAL_SHARE).map(([material, share]) => {
    const volDia = Math.round(rsuDia * share * 10) / 10
    const meta = META[material]!
    const tripsPerDay = TRIPS_BY_FREQ[meta.frecuencia] ?? 1
    const camiones = Math.max(1, Math.ceil(volDia / (TRUCK_CAPACITY_TON * Math.max(tripsPerDay, 0.15))))
    return { material, volDia, camiones, ...meta }
  })
}

export function computeLogisticsKpis(trucks: TruckRow[]) {
  const totalCamiones = trucks.reduce((s, t) => s + t.camiones, 0)
  const volMovilizado = trucks.reduce((s, t) => s + t.volDia, 0)
  const mermaPct = Math.round((1 - volMovilizado / Math.max(volMovilizado * 1.05, 1)) * 100 + 18)
  return {
    totalCamiones,
    visitasMes: Math.round(totalCamiones * 22 * 10) / 10,
    mermaPct: Math.min(25, Math.max(8, mermaPct)),
    presion: totalCamiones > 20 ? 'Alta' : totalCamiones > 12 ? 'Media-alta' : 'Media',
  }
}
