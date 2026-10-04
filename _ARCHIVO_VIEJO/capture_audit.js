#!/usr/bin/env node
/**
 * Launcher JS para auditoria PDF.
 * Ejecuta el capturador Python (Playwright) y consolida en un solo PDF.
 */
const { spawn } = require('node:child_process')
const { existsSync } = require('node:fs')
const { resolve } = require('node:path')

const python = resolve('backend/.venv/bin/python')
const script = resolve('capture_audit.py')

if (!existsSync(python)) {
  console.error(`[error] No existe Python virtualenv en ${python}`)
  process.exit(1)
}
if (!existsSync(script)) {
  console.error(`[error] No existe script ${script}`)
  process.exit(1)
}

const child = spawn(python, [script], { stdio: 'inherit' })
child.on('exit', code => process.exit(code ?? 1))
