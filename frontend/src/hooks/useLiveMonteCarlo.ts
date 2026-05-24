'use client'

import { useEffect, useRef, useState } from 'react'
import {
  calcular,
  MONTE_CARLO_SPEC,
  percentileFromSorted,
  perturbStateMonteCarlo,
} from '@/lib/calculator'
import type { SimulatorState } from '@/types'

const BATCH_SIZE = 48

export function useLiveMonteCarlo(
  state: SimulatorState,
  metric: 'tir' | 'vpn' = 'vpn',
  n = MONTE_CARLO_SPEC.iterationsDefault,
) {
  const [samples, setSamples] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const runIdRef = useRef(0)

  useEffect(() => {
    const runId = ++runIdRef.current
    setSamples([])
    setProgress(0)
    setIsRunning(true)

    let i = 0
    const acc: number[] = []

    function tick() {
      if (runId !== runIdRef.current) return

      const end = Math.min(i + BATCH_SIZE, n)
      while (i < end) {
        const r = calcular(perturbStateMonteCarlo(state))
        acc.push(metric === 'tir' ? r.tir : r.vpn)
        i++
      }

      const sorted = [...acc].sort((a, b) => a - b)
      setSamples(sorted)
      setProgress(i / n)

      if (i < n) {
        requestAnimationFrame(tick)
      } else {
        setIsRunning(false)
      }
    }

    requestAnimationFrame(tick)
    return () => { runIdRef.current++ }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- entradas listadas; state completo cambia de identidad cada render
  }, [
    state.precios,
    state.pctCapturaPorAño,
    state.mermaLogPct,
    state.horizonte,
    state.zmActiva,
    state.municipiosActivos,
    state.wacc,
    metric,
    n,
  ])

  const p10 = percentileFromSorted(samples, 0.10)
  const p50 = percentileFromSorted(samples, 0.50)
  const p90 = percentileFromSorted(samples, 0.90)

  return { samples, progress, isRunning, p10, p50, p90, total: n }
}
