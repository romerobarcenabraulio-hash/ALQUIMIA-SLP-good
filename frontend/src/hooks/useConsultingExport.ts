'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSimulatorStore } from '@/store/simulatorStore'
import { buildAgoraPlanPayload } from '@/lib/agoraPlanPayload'
import {
  downloadExecutivePdf,
  fetchAgoraPlanZip,
  triggerBrowserDownload,
} from '@/lib/api'
import { EXPORT_DISCLAIMER } from '@/lib/consultingDeliverables'
import { snapshotFuentesUsadas } from '@/lib/snapshotFuentes'

export type ExportAction = 'executive_pdf' | 'full_zip' | 'hub_professional' | 'share_url'

export interface ExportOptions {
  moduleLabel?: string
}

export function useConsultingExport() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildPayload = useCallback(() => {
    const st = useSimulatorStore.getState()
    const r = st.resultados
    if (!r) return null
    return {
      st,
      r,
      agoraBody: buildAgoraPlanPayload(
        st.zmActiva,
        st.municipiosActivos,
        st.horizonte,
        st.presetTrayectoria,
        st.snapshotDatos,
        r,
      ),
    }
  }, [])

  const runExport = useCallback(
    async (action: ExportAction, options?: ExportOptions) => {
      setError(null)
      const payload = buildPayload()

      if (action === 'share_url') {
        try {
          await navigator.clipboard.writeText(window.location.href)
        } catch {
          setError('No se pudo copiar el enlace.')
        }
        return
      }

      if (action === 'hub_professional') {
        router.push('/hub')
        return
      }

      if (!payload) {
        setError('Complete la línea base (M01) antes de generar documentos.')
        return
      }

      const { st, r, agoraBody } = payload
      setLoading(true)
      try {
        if (action === 'executive_pdf') {
          await downloadExecutivePdf({
            zm: st.zmActiva,
            municipio_id: st.municipiosActivos[0] ?? st.zmActiva,
            municipio_nombre:
              st.seleccionMunicipioCatalog?.nombre ?? st.cityContext?.nombre ?? st.zmActiva,
            module_label: options?.moduleLabel,
            resultados: {
              tir: r.tir,
              vpn: r.vpn,
              capex_total: r.capexTotal,
              payback_meses: r.paybackMeses,
              empleos_directos: r.empleosTotalesDirectos,
              co2e_evitadas_anual: r.co2eEvitadasAnualTon,
              ingresos_brutos: r.ingresosBrutos,
            },
            snapshot_datos: st.snapshotDatos
              ? {
                  score_datos: st.snapshotDatos.score_datos,
                  advertencias: st.snapshotDatos.advertencias?.map(a => a.advertencia) ?? [],
                  fuentes_usadas: snapshotFuentesUsadas(st.snapshotDatos),
                }
              : null,
          })
          return
        }

        if (action === 'full_zip') {
          st.openAgoraPlanConfirm(() => {
            void (async () => {
              try {
                const { blob, filename } = await fetchAgoraPlanZip(agoraBody)
                triggerBrowserDownload(blob, filename)
              } catch (e) {
                setError(e instanceof Error ? e.message : 'No se pudo generar el ZIP')
              } finally {
                setLoading(false)
              }
            })()
          })
          return
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al generar documento')
      } finally {
        if (action !== 'full_zip') setLoading(false)
      }
    },
    [buildPayload, router],
  )

  const goToExpediente = useCallback(() => {
    router.push('/simulator?module=expediente_cabildo')
  }, [router])

  return {
    loading,
    error,
    disclaimer: EXPORT_DISCLAIMER,
    runExport,
    goToExpediente,
    openAgoraModal: () => {
      useSimulatorStore.getState().openAgoraPlanConfirm(() => {
        useSimulatorStore.getState().setGeneratingPlan(true, 0, 'Iniciando ALQUIMIA...')
      })
    },
  }
}
