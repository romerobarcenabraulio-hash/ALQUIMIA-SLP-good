import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function GET() {
  const registryPath = path.resolve(process.cwd(), '..', 'docs', 'architecture', 'capability_registry.json')
  const raw = await readFile(registryPath, 'utf8')
  return NextResponse.json(JSON.parse(raw))
}
