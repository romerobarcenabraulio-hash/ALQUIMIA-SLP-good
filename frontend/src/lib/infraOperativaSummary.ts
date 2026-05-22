import type { ResultadosCalculados } from '@/types'
import { CA_CONFIG } from '@/lib/constants'

export type InfraOperativaSummary = {
  centrosActivos: number
  capInstaladaTonDia: number
  brechaTonDia: number
  label: string
  sub: string
}

export function infraOperativaFromStore(
  mixCAs: Record<'P' | 'M' | 'G', number>,
  resultados: ResultadosCalculados | null,
): InfraOperativaSummary {
  const centrosActivos = (mixCAs.P ?? 0) + (mixCAs.M ?? 0) + (mixCAs.G ?? 0)
  const capFromMix =
    (mixCAs.P ?? 0) * CA_CONFIG.P.capTonDia +
    (mixCAs.M ?? 0) * CA_CONFIG.M.capTonDia +
    (mixCAs.G ?? 0) * CA_CONFIG.G.capTonDia
  const capInstaladaTonDia = capFromMix
  const rsuCapturable = resultados?.rsuTotalTonDia ?? 0
  const brechaTonDia = Math.max(0, rsuCapturable - capInstaladaTonDia)
  const label =
    centrosActivos > 0
      ? `${centrosActivos} centro${centrosActivos === 1 ? '' : 's'} · ${capInstaladaTonDia.toFixed(1)} t/día cap.`
      : 'Sin centros activos — configurar en M06'
  const sub =
    rsuCapturable > 0
      ? `Brecha operativa: ${brechaTonDia.toFixed(1)} t/día`
      : 'Complete M01 para calcular brecha'
  return { centrosActivos, capInstaladaTonDia, brechaTonDia, label, sub }
}
