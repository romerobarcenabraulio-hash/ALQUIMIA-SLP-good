#!/usr/bin/env node
/**
 * Lighthouse sobre /simulator.
 * Tras `next build`, sirve la app con `next start` (ver `audit:lighthouse:ci` en package.json).
 * Salida: audit_reports/lighthouse-simulator.report.{html,json}
 *
 * Si falta lighthouse en node_modules: ejecuta `npm install` en frontend.
 * Como respaldo intenta `npx lighthouse` (puede descargar si hace falta).
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

function resolveLhCliEntry() {
  try {
    const pkgJsonPath = require.resolve('lighthouse/package.json', { paths: [root] })
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    const bin = pkg.bin
    const rel =
      typeof bin === 'string'
        ? bin
        : bin?.lighthouse || bin?.['lighthouse-cli']
    if (typeof rel === 'string') {
      const abs = path.resolve(path.dirname(pkgJsonPath), rel)
      if (fs.existsSync(abs)) return { mode: 'node', cmd: process.execPath, args: [abs] }
    }
  } catch {
    /* fall through */
  }
  const legacy = ['lighthouse/cli/cli.js', 'lighthouse/cli/index.js']
  for (const rel of legacy) {
    try {
      const abs = require.resolve(rel, { paths: [root] })
      return { mode: 'node', cmd: process.execPath, args: [abs] }
    } catch {
      /* next */
    }
  }
  return null
}

const url = process.env.LIGHTHOUSE_URL || 'http://127.0.0.1:3000/simulator'
const outDir = path.resolve(root, process.env.LIGHTHOUSE_OUT || 'audit_reports')
fs.mkdirSync(outDir, { recursive: true })
const outBase = path.join(outDir, 'lighthouse-simulator')

let chromePath = process.env.CHROME_PATH || ''
if (!chromePath && process.platform === 'darwin') {
  const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (fs.existsSync(p)) chromePath = p
}

const lhArgs = [
  url,
  '--preset=desktop',
  '--only-categories=performance,accessibility',
  '--output=json',
  '--output=html',
  `--output-path=${outBase}`,
  '--quiet',
  '--chrome-flags=--headless=new --disable-gpu --no-sandbox',
]

if (chromePath) lhArgs.push(`--chrome-path=${chromePath}`)

const resolved = resolveLhCliEntry()
let r
if (resolved) {
  r = spawnSync(resolved.cmd, [...resolved.args, ...lhArgs], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env },
  })
} else {
  console.warn(
    '[lighthouse] No hay paquete local. Ejecuta: cd frontend && npm install\n' +
      '[lighthouse] Intentando npx lighthouse (puede tardar la primera vez)...',
  )
  r = spawnSync('npx', ['--yes', 'lighthouse', ...lhArgs], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env },
  })
}

const jsonCandidates = [`${outBase}.report.json`, `${outBase}.json`]
let jsonPath = jsonCandidates.find(f => fs.existsSync(f))
if (!jsonPath) {
  try {
    const dir = fs.readdirSync(outDir)
    const hit = dir.find(n => n.includes('lighthouse') && n.endsWith('.json'))
    if (hit) jsonPath = path.join(outDir, hit)
  } catch {
    /* skip */
  }
}

if (jsonPath && fs.existsSync(jsonPath)) {
  try {
    const lhr = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const perf = lhr.categories?.performance?.score
    const a11y = lhr.categories?.accessibility?.score
    const lcpAud = lhr.audits?.['largest-contentful-paint']
    const lcpMs = typeof lcpAud?.numericValue === 'number' ? lcpAud.numericValue : null
    const fmtPct = s => (s != null ? Math.round(s * 100) : 'n/a')

    console.log('\n--- Resumen ALQUIMIA (pegar en bitácora §6.3) ---')
    console.log(`URL: ${url}`)
    console.log(`Informe JSON: ${jsonPath}`)
    console.log(`Accessibility score: ${fmtPct(a11y)} / 100`)
    console.log(`Performance score: ${fmtPct(perf)} / 100`)
    console.log(`LCP (ms): ${lcpMs != null ? Math.round(lcpMs) : 'n/a'}`)
    console.log('---------------------------------------------------\n')
  } catch (e) {
    console.warn('No se pudo resumir el JSON:', e.message)
  }
} else {
  console.warn('No se encontró JSON del reporte para resumen automático.')
}

process.exit(r.status ?? 1)
