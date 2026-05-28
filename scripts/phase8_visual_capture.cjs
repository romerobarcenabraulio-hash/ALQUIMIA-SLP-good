#!/usr/bin/env node
/* Capturas Fase 8 para auditoria visual Minto/McKinsey. */
const fs = require('node:fs/promises')
const fsSync = require('node:fs')
const path = require('node:path')
const puppeteer = require('../frontend/node_modules/puppeteer-core')

const BASE_URL = process.env.ALQUIMIA_BASE_URL || 'http://localhost:3000'
const OUT = path.resolve('docs/architecture/phase8_visual_evidence')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const REGISTRY = JSON.parse(fsSync.readFileSync(path.resolve('docs/architecture/capability_registry.json'), 'utf8'))
const TENANT_STAGE = {
  'slp-capital': 'validation',
  'planning-demo': 'planning',
  'execution-demo': 'execution',
}
const JSON_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
}

async function mockBackend(page) {
  await page.setRequestInterception(true)
  page.on('request', request => {
    const url = request.url()
    const stateMatch = url.match(/\/admin\/tenants\/([^/]+)\/state/)
    const accessMatch = url.match(/\/admin\/tenants\/([^/]+)\/platform-access\/([^/?]+)/)
    const profileMatch = url.match(/\/admin\/tenants\/([^/]+)\/municipal-profile/)
    if (stateMatch) {
      const tenantId = decodeURIComponent(stateMatch[1])
      const stage = TENANT_STAGE[tenantId] || 'validation'
      const activeCapabilities = REGISTRY.modules
        .filter(module => module.default_active && module.platforms.includes(stage))
        .map(module => ({ module_id: module.module_id, active: true, source: 'phase8_visual_mock' }))
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          tenant_id: tenantId,
          state: {
            tenant_id: tenantId,
            current_stage: stage,
            fecha_ingreso: '2026-05-28T00:00:00Z',
            fecha_cambio_stage: '2026-05-28T00:00:00Z',
            transition_mode: 'manual_only',
            notas: null,
          },
          gates: [],
          capabilities: activeCapabilities,
          audit_log: [],
        }),
      })
      return
    }
    if (accessMatch) {
      const tenantId = decodeURIComponent(accessMatch[1])
      const requested = accessMatch[2]
      const stage = TENANT_STAGE[tenantId] || 'validation'
      if (requested === stage || (stage === 'execution' && requested === 'execution')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          headers: JSON_HEADERS,
          body: JSON.stringify({ access: 'allowed', tenant_id: tenantId, current_stage: stage, requested_stage: requested }),
        })
        return
      }
      request.respond({
        status: 403,
        contentType: 'application/json',
        headers: JSON_HEADERS,
        body: JSON.stringify({ detail: `Tenant en ${stage} no puede acceder a ${requested}` }),
      })
      return
    }
    if (profileMatch) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          tenant_id: decodeURIComponent(profileMatch[1]),
          municipio: 'San Luis Potosí',
          estado: 'San Luis Potosí',
          municipio_id: 'slp',
          profile: {
            mode: 'carga_inicial',
            antecedentes: {},
            mapa_social: { actores: [] },
            organigrama_servicio: {},
            provenance_status: 'pendiente_verificacion',
          },
        }),
      })
      return
    }
    request.continue()
  })
}

async function openFunctionarySimulator(page) {
  await page.goto(`${BASE_URL}/simulator`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')]
      .find(el => (el.textContent || '').includes('Entrar como funcionario'))
    if (button instanceof HTMLElement) button.click()
  }).catch(() => null)
  await page.waitForSelector('select', { timeout: 10000 }).catch(() => null)
  await page.select('select', 'antecedentes_municipales').catch(() => null)
  await page.waitForSelector('button[aria-label="Abrir Qué intentó el municipio antes de este programa"]', { timeout: 5000 })
    .then(button => button.click())
    .catch(() => null)
  await new Promise(resolve => setTimeout(resolve, 1000))
}

async function captureViewport(browser, width, height, name) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await mockBackend(page)
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('alquimia_token', 'demo-token')
    localStorage.setItem('alquimia.tenantId', 'slp-capital')
    localStorage.setItem('alquimia.audience', JSON.stringify('functionary'))
    localStorage.setItem('alquimia-simulator', JSON.stringify({
      state: {
        audience: 'functionary',
        clientSetupComplete: true,
        journeyMode: 'validar',
        municipiosActivos: ['slp'],
        zmActiva: 'slp',
      },
      version: 2,
    }))
  })
  await openFunctionarySimulator(page)
  await page.screenshot({ path: path.join(OUT, `${name}-simulator-m00b.png`), fullPage: false })

  for (const [route, tenantId] of [['/v', 'slp-capital'], ['/p', 'planning-demo'], ['/e', 'execution-demo']]) {
    await page.goto(`${BASE_URL}${route}?tenant_id=${tenantId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await new Promise(resolve => setTimeout(resolve, 1000))
    await page.screenshot({ path: path.join(OUT, `${name}${route.replace('/', '-')}-shell.png`), fullPage: false })
  }
  await page.close()
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  await captureViewport(browser, 1440, 1100, 'desktop')
  await captureViewport(browser, 390, 844, 'mobile')
  await browser.close()
  console.log(`[ok] Capturas Fase 8: ${OUT}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
