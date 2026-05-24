import { apiFetch, getApiUrl } from '@/lib/api'
import type { ColoniaStop, RouteLegSaved } from '@/lib/residentialRouteTiming'

export interface GeocodeResult {
  formatted_address?: string
  lat?: number
  lon?: number
}

export interface GoogleRoutePlanResponse {
  municipio_id: string
  zm: string
  legs: Array<{
    from_label: string
    to_label: string
    segment: {
      distance_km?: number
      duration_min?: number
      encoded_polyline?: string
    }
  }>
  total_distance_km: number
  total_duration_min: number
  source: string
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const res = await apiFetch(`${getApiUrl()}/api/v1/google/geocoding/forward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, region: 'mx' }),
  })
  if (!res.ok) return null
  return res.json() as Promise<GeocodeResult>
}

export async function geocodeColoniaStop(stop: ColoniaStop): Promise<ColoniaStop> {
  const query = `${stop.colonia}, ${stop.municipio_nombre}, México`
  const geo = await geocodeAddress(query)
  if (geo?.lat != null && geo.lon != null) {
    return { ...stop, lat: geo.lat, lon: geo.lon }
  }
  return stop
}

export async function planGoogleRoute(params: {
  zm: string
  municipio_id: string
  depot: { lat: number; lon: number; label: string }
  stops: ColoniaStop[]
  returnToDepot?: boolean
}): Promise<{ legs: RouteLegSaved[]; total_km: number; total_min: number } | null> {
  const geocoded = await Promise.all(params.stops.map(geocodeColoniaStop))
  const withCoords = geocoded.filter(s => s.lat != null && s.lon != null)
  if (withCoords.length === 0) return null

  const body = {
    municipio_id: params.municipio_id,
    zm: params.zm,
    depot: { lat: params.depot.lat, lon: params.depot.lon, label: params.depot.label },
    stops: withCoords.map(s => ({
      lat: s.lat!,
      lon: s.lon!,
      label: s.colonia,
    })),
    return_to_depot: params.returnToDepot ?? true,
  }

  const res = await apiFetch(`${getApiUrl()}/api/v1/google/routes/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null

  const data = (await res.json()) as GoogleRoutePlanResponse
  const legs: RouteLegSaved[] = data.legs.map(l => ({
    from_label: l.from_label,
    to_label: l.to_label,
    distance_km: l.segment.distance_km ?? null,
    duration_min: l.segment.duration_min ?? null,
    encoded_polyline: l.segment.encoded_polyline ?? null,
  }))

  return {
    legs,
    total_km: data.total_distance_km,
    total_min: data.total_duration_min,
  }
}
