/**
 * Google Maps JavaScript — Vercel: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 */

let loadPromise: Promise<typeof google.maps> | null = null

export function getGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim()
}

export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey().length > 0
}

export function loadGoogleMaps(libraries: string[] = ['places']): Promise<typeof google.maps> {
  const key = getGoogleMapsApiKey()
  if (!key) {
    return Promise.reject(new Error('Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en Vercel'))
  }
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const id = 'google-maps-js'
    if (document.getElementById(id)) {
      const wait = () => {
        if (window.google?.maps) resolve(window.google.maps)
        else setTimeout(wait, 50)
      }
      wait()
      return
    }
    const libs = libraries.length ? `&libraries=${libraries.join(',')}` : ''
    const script = document.createElement('script')
    script.id = id
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}${libs}&language=es&region=MX`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps)
      else reject(new Error('Google Maps no inicializó'))
    }
    script.onerror = () => reject(new Error('Error cargando Google Maps JS'))
    document.head.appendChild(script)
  })
  return loadPromise
}

export const GOOGLE_MAPS_MISSING_MSG =
  'Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en Vercel y redeploy.'

declare global {
  interface Window {
    google?: typeof google
  }
}
