import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const middlewareSource = () => readFileSync(join(process.cwd(), 'middleware.ts'), 'utf8')

describe('middleware guardrails', () => {
  it('protects the platform, export hub, internal lab, and RSU government entry', () => {
    const source = middlewareSource()

    for (const route of ['/v', '/p', '/e', '/admin', '/api/admin', '/hub', '/ca-studio', '/gobierno/rsu', '/simulator']) {
      expect(source, route).toContain(`'${route}'`)
      expect(source, route).toContain(`'${route}/:path*'`)
    }
  })

  it('keeps legacy-cookie auth bypass disabled unless explicitly enabled by env', () => {
    const source = middlewareSource()

    expect(source).toContain("process.env.ALLOW_LEGACY_AUTH_BYPASS === '1'")
    expect(source).toContain("response.headers.set('X-Alquimia-Auth-Mode', 'legacy-cookie-bypass')")
    expect(source).toContain('await auth.protect()')
  })

  it('sets noindex headers on both protected and unprotected paths', () => {
    const source = middlewareSource()

    expect(source.match(/X-Robots-Tag/g)?.length).toBeGreaterThanOrEqual(3)
    expect(source).toContain("'noindex, nofollow'")
  })
})
