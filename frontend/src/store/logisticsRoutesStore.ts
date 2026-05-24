import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_TIMING_PARAMS,
  recalculateRoutePlan,
  type LogisticsTimingParams,
  type ResidentialRoutePlan,
} from '@/lib/residentialRouteTiming'

interface LogisticsRoutesState {
  timingParams: LogisticsTimingParams
  plansByZm: Record<string, ResidentialRoutePlan[]>
  selectedRouteId: string | null

  setTimingParam: <K extends keyof LogisticsTimingParams>(key: K, value: LogisticsTimingParams[K]) => void
  setPlansForZm: (zm: string, plans: ResidentialRoutePlan[]) => void
  updatePlan: (zm: string, plan: ResidentialRoutePlan) => void
  setStopMinServicio: (zm: string, routeId: string, colonia: string, min: number) => void
  setSelectedRouteId: (id: string | null) => void
  getPlans: (zm: string) => ResidentialRoutePlan[]
}

export const useLogisticsRoutesStore = create<LogisticsRoutesState>()(
  persist(
    (set, get) => ({
      timingParams: { ...DEFAULT_TIMING_PARAMS },
      plansByZm: {},
      selectedRouteId: null,

      setTimingParam: (key, value) => {
        set(state => {
          const timingParams = { ...state.timingParams, [key]: value }
          const plansByZm = { ...state.plansByZm }
          for (const zm of Object.keys(plansByZm)) {
            plansByZm[zm] = plansByZm[zm]!.map(p => recalculateRoutePlan(p, timingParams))
          }
          return { timingParams, plansByZm }
        })
      },

      setPlansForZm: (zm, plans) => {
        set(state => ({
          plansByZm: { ...state.plansByZm, [zm.toUpperCase()]: plans },
          selectedRouteId: plans[0]?.route_id ?? null,
        }))
      },

      updatePlan: (zm, plan) => {
        set(state => {
          const key = zm.toUpperCase()
          const prev = state.plansByZm[key] ?? []
          return {
            plansByZm: {
              ...state.plansByZm,
              [key]: prev.map(p => (p.route_id === plan.route_id ? plan : p)),
            },
          }
        })
      },

      setStopMinServicio: (zm, routeId, colonia, min) => {
        const timing = get().timingParams
        set(state => {
          const key = zm.toUpperCase()
          const plans = (state.plansByZm[key] ?? []).map(p => {
            if (p.route_id !== routeId) return p
            const stops = p.stops.map(s =>
              s.colonia === colonia ? { ...s, min_servicio: min } : s,
            )
            return recalculateRoutePlan({ ...p, stops }, timing)
          })
          return { plansByZm: { ...state.plansByZm, [key]: plans } }
        })
      },

      setSelectedRouteId: id => set({ selectedRouteId: id }),

      getPlans: zm => get().plansByZm[zm.toUpperCase()] ?? [],
    }),
    { name: 'alquimia-logistics-routes' },
  ),
)
