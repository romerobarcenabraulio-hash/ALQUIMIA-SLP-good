'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F8F6F1' }}>
        <main style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#1C1B18' }}>La aplicación dejó de responder</h1>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#6B6760' }}>
            Si ves esto tras abrir Metas futuras / Gantt-PERT, el navegador cerró la pestaña por memoria o por un bloque
            gráfico. Tras actualizar el sitio, entra al módulo y usa «Cargar Metas futuras» antes de abrir las gráficas.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: '1.25rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: '#3B6D11',
              color: '#fff',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  )
}
