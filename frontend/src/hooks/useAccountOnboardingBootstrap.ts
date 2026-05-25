'use client'

import { useEffect } from 'react'
import { authMe } from '@/lib/authApi'
import { isPlatformDeveloper } from '@/lib/authSession'
import { useSimulatorStore } from '@/store/simulatorStore'

/** Si la cuenta ya completó onboarding con PDF, omite ClientOnboardingGate. */
export function useAccountOnboardingBootstrap() {
  const completeClientSetup = useSimulatorStore(s => s.completeClientSetup)
  const setMunicipioPdfHabilitado = useSimulatorStore(s => s.setMunicipioPdfHabilitado)
  const setZM = useSimulatorStore(s => s.setZM)
  const setMunicipiosPrograma = useSimulatorStore(s => s.setMunicipiosPrograma)
  const refreshAntecedentesReportaje = useSimulatorStore(s => s.refreshAntecedentesReportaje)
  const clientSetupComplete = useSimulatorStore(s => s.clientSetupComplete)

  useEffect(() => {
    if (isPlatformDeveloper() || clientSetupComplete) return
    void authMe().then(profile => {
      if (!profile?.onboarding_completed) return
      if (profile.zm) setZM(profile.zm)
      if (profile.municipio_id) {
        setMunicipiosPrograma([profile.municipio_id])
      }
      if (profile.reglamento_uploaded) {
        setMunicipioPdfHabilitado(true)
        completeClientSetup()
        void refreshAntecedentesReportaje({ refresh: true })
      }
    })
  }, [
    clientSetupComplete,
    completeClientSetup,
    refreshAntecedentesReportaje,
    setMunicipioPdfHabilitado,
    setMunicipiosPrograma,
    setZM,
  ])
}
