import { NextResponse } from 'next/server'

/** Bloqueo total hasta decisión explícita de abrir índice público (demo institucional). */
export function GET() {
  const body = 'User-agent: *\nDisallow: /\n'
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
