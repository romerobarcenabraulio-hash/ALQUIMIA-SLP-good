import { describe, expect, it } from 'vitest'
import {
  SOCIAL_STATS_BUILD_ID,
  SOCIAL_STATS_PUBLIC_REL_PATH,
  SOCIAL_STATS_SLICES_FILENAME,
} from '@/data/socialStats/embeddedBundle'

describe('embeddedBundle · contrato ruta pública PR3', () => {
  it('filename y URL pública derivan del mismo buildId (anti-drift route vs fetch)', () => {
    expect(SOCIAL_STATS_SLICES_FILENAME).toBe(`slices-${SOCIAL_STATS_BUILD_ID}.json`)
    expect(SOCIAL_STATS_PUBLIC_REL_PATH).toBe(`/data/social-stats/${SOCIAL_STATS_SLICES_FILENAME}`)
  })
})
