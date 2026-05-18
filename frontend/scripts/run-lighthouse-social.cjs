#!/usr/bin/env node
/**
 * Lighthouse accesibilidad sobre la capa social (funcionario · municipal_context).
 *
 * Flujo:
 *  1. Lanza Chrome (chrome-launcher, mismo criterio que run-lighthouse.cjs).
 *  2. Puppeteer intercepta llamadas al backend `/city/**` con stubs (sin Docker backend).
 *  3. Sesión audiencia funcionario + navegación al paso `municipal_context` (etiqueta «Contexto sociodemográfico…»).
 *  4. Ejecuta Lighthouse (solo accessibility + performance opcional) reutilizando la pestaña (API programmatic).
 *
 * Prerrequisito: `next start` en LIGHTHOUSE_ORIGIN (por defecto http://127.0.0.1:3000).
 *
 * Salida: audit_reports/lighthouse-social-context.report.{json,html}
 *
 * Variables:
 *   LIGHTHOUSE_ORIGIN      — origen Next (default http://127.0.0.1:3000)
 *   LIGHTHOUSE_A11Y_MIN    — si está definido y es número, exit 1 cuando score < umbral (ej. 95)
 *   CHROME_PATH            — binario Chrome/Chromium
 *
 * Los stubs interceptan rutas `/city/...` (cualquier host; p. ej. localhost vs 127.0.0.1).
 *
 * Nota: solo persistir `alquimia.audience` no ejecuta `setAudience`; el journey queda vacío. Este script
 * limpia almacenamiento de sesión, usa el gateway y el CTA «Continuar como funcionario».
 */

const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const root = path.join(__dirname, '..')

const lhRoot = path.dirname(require.resolve('lighthouse/package.json', { paths: [root] }))
const puppeteer = require(require.resolve('puppeteer-core', { paths: [lhRoot] }))
const chromeLauncher = require(require.resolve('chrome-launcher', { paths: [lhRoot, root] }))

const ORIGIN = process.env.LIGHTHOUSE_ORIGIN || 'http://127.0.0.1:3000'
const OUT_DIR = path.resolve(root, process.env.LIGHTHOUSE_OUT || 'audit_reports')
const OUT_BASE = path.join(OUT_DIR, 'lighthouse-social-context')

let chromePath = process.env.CHROME_PATH || ''
if (!chromePath && process.platform === 'darwin') {
  const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (fs.existsSync(p)) chromePath = p
}

const CITY_ID = 'SLP'

/** Cookie que exige `middleware.ts` para `/simulator` (misma que entrega `/api/acceso` al validar ACCESS_CODE). */
const ACCESS_COOKIE = { name: 'alquimia_access', value: 'granted' }

/** Respuesta mínima compatible con fetch paralelo portal + baseline gate UI */
const CONTEXT_STUB = {
  city_id: CITY_ID,
  nombre: `ZM ${CITY_ID} (stub Lighthouse)`,
  estado_principal: CITY_ID,
  municipios: [
    {
      municipio_id: 'slp',
      nombre: 'San Luis Potosí',
      estado: CITY_ID,
      legal_scope: 'municipio',
      jurisdiction_scope: 'Municipality',
    },
  ],
  geography_scope: 'city_zm',
  jurisdiction_scope: 'MetropolitanZone',
  catalog_simulation_epoch: 'lh-social-audit-stub',
  legal_notice: 'Datos simulados únicamente para medición Lighthouse.',
  audience_mode: 'city_team',
  supported_entries: ['city_plan'],
}

const BASELINE_STUB = {
  city_id: CITY_ID,
  city_name: 'San Luis Potosí',
  rsu_scope: 'rsu_municipal',
  current_circularity_pct: 14.2,
  material_recovery_ton_day_est: 120,
  rsu_total_ton_day_est: 920,
  official_status: 'estimated_not_official',
  confidence: 0.62,
  uncertainty_pct_points: 4,
  provenance: {
    tipo: 'estimado',
    fuente_nombre: 'Stub Lighthouse',
    fuente_organismo: 'CI ALQUIMIA',
    fuente_url: null,
    fecha_dato: null,
    fecha_consulta: null,
    confianza: 0.62,
    advertencia: null,
    requiere_clave_api: false,
    error_detalle: null,
  },
  warnings: [],
  interpretation: 'Lectura stub para auditoría automatizada de accesibilidad.',
}

function journeyStub() {
  const mk = (id, label) => ({
    module_id: id,
    label,
    audience_mode: 'city_team',
    decision: 'stub',
    evidence: 'stub',
    status: 'ready',
    next_action: 'stub',
  })
  return [
    mk('city_baseline', 'Problema y resumen ejecutivo'),
    mk('municipal_context', 'Contexto sociodemográfico y marco legal municipal'),
    mk('future_goals', 'Metas futuras / Gantt-PERT'),
    mk('infrastructure_operations', 'Infraestructura en espacio-tiempo'),
    mk('market_traceability', 'Mercado y causalidad'),
    mk('inspeccion_predios', 'Inspección de predios / estrategia administrativa'),
    mk('scenarios_export', 'Escenarios, derrama y salida'),
    mk('source_traceability', 'Bibliografía y cálculos'),
  ]
}

/** CORS + `X-Request-ID` en el cliente implican preflight OPTIONS sobre orígenes distintos (3000 vs :8000). */
function jsonStub200(bodyObj) {
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Request-ID',
    },
    body: JSON.stringify(bodyObj),
  }
}

async function seedRoutes(page) {
  await page.setRequestInterception(true)
  page.on('request', req => {
    const reqUrl = req.url()
    if (!reqUrl.includes('/city/')) {
      req.continue()
      return
    }
    if (req.method() === 'OPTIONS') {
      req.respond({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Request-ID',
          'Access-Control-Max-Age': '86400',
        },
      })
      return
    }
    let u
    try {
      u = new URL(reqUrl)
    } catch {
      req.continue()
      return
    }
    try {
      const m = u.pathname.match(/^\/city\/([^/]+)\/(context|baseline)\/?$/)
      if (m) {
        const city = m[1].toUpperCase()
        if (city === CITY_ID && m[2] === 'context') {
          req.respond(jsonStub200(CONTEXT_STUB))
          return
        }
        if (city === CITY_ID && m[2] === 'baseline') {
          req.respond(jsonStub200(BASELINE_STUB))
          return
        }
      }
      if (u.pathname.includes('/city/journey/steps') && u.searchParams.get('entry') === 'city_plan') {
        req.respond(jsonStub200(journeyStub()))
        return
      }
    } catch {
      /* fallthrough */
    }
    req.continue()
  })
}

async function selectFunctionaryViaGateway(page) {
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('button')].some(b =>
        (b.textContent || '').includes('Continuar como funcionario'),
      ),
    { timeout: 60_000 },
  )
  await page.evaluate(() => {
    const target = [...document.querySelectorAll('button')].find(b =>
      (b.textContent || '').includes('Continuar como funcionario'),
    )
    target?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
  await page.waitForSelector('nav[aria-label="Modulos de decision"]', { timeout: 120_000 })
}

async function clickMunicipalContextModule(page) {
  const ok = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Modulos de decision"]')
    if (!nav) return false
    const buttons = [...nav.querySelectorAll('button')]
    const target = buttons.find(b => (b.textContent || '').includes('Contexto sociodemográfico'))
    target?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    return Boolean(target)
  })
  if (!ok) throw new Error('No se encontró el botón del módulo «Contexto sociodemográfico y marco legal municipal».')
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--disable-gpu', '--no-sandbox'],
    ...(chromePath ? { chromePath } : {}),
  })

  let browser
  try {
    browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${chrome.port}`,
      defaultViewport: null,
    })
    const pages = await browser.pages()
    const page = pages[0] || (await browser.newPage())

    await seedRoutes(page)

    await page.setCookie({ ...ACCESS_COOKIE, url: ORIGIN })

    await page.goto(`${ORIGIN}/simulator`, { waitUntil: 'networkidle2', timeout: 120_000 })
    await page.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {
        /* ignore */
      }
    })
    await page.reload({ waitUntil: 'networkidle2', timeout: 120_000 })

    await selectFunctionaryViaGateway(page)

    await clickMunicipalContextModule(page)
    await page.waitForSelector('[data-testid="social-context-root"]', { timeout: 45_000 })

    const url = page.url()
    const { default: lighthouseMod } = await import('lighthouse')
    const lighthouse = lighthouseMod.default ?? lighthouseMod

    const flags = {
      port: chrome.port,
      logLevel: 'error',
      output: ['json', 'html'],
      outputPath: OUT_BASE,
      onlyCategories: ['accessibility', 'performance'],
      preset: 'desktop',
    }

    const runnerResult = await lighthouse(url, flags, undefined, page)

    if (runnerResult) {
      const { saveResults } = await import(pathToFileURL(path.join(lhRoot, 'cli/run.js')).href)
      await saveResults(runnerResult, { ...flags, channel: 'node' })
    }

    const lhr = runnerResult?.lhr
    if (!lhr) {
      console.error('[lighthouse-social] Sin resultado LHR.')
      process.exitCode = 1
      return
    }

    const a11y = lhr.categories?.accessibility?.score
    const perf = lhr.categories?.performance?.score
    const fmtPct = s => (s != null ? Math.round(Number(s) * 100) : 'n/a')

    console.log('\n--- Lighthouse · capa social (municipal_context) ---')
    console.log(`URL final: ${url}`)
    console.log(`Accessibility score: ${fmtPct(a11y)} / 100`)
    console.log(`Performance score: ${fmtPct(perf)} / 100`)
    console.log(`Informe base: ${OUT_BASE}`)
    console.log('---------------------------------------------------\n')

    const minRaw = process.env.LIGHTHOUSE_A11Y_MIN
    if (minRaw !== undefined && minRaw !== '') {
      const min = Number(minRaw)
      if (!Number.isNaN(min) && a11y != null && Math.round(a11y * 100) < min) {
        console.error(`[lighthouse-social] FAIL: accesibilidad ${fmtPct(a11y)} < mínimo ${min}`)
        process.exitCode = 1
      }
    }
  } finally {
    if (browser) {
      await browser.disconnect().catch(() => {})
    }
    try {
      await Promise.resolve(chrome.kill())
    } catch {
      /* ignore */
    }
  }
}

main().catch(err => {
  console.error('[lighthouse-social]', err)
  process.exit(1)
})
