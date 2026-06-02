import { Sidebar } from '@/components/layout/Sidebar'
import { InstitutionalHeader } from '@/components/layout/InstitutionalHeader'

/**
 * Shell de aplicación completo: sidebar oscuro + header sticky + área de contenido.
 * Usar en todas las páginas autenticadas (simulator, hub, ca-studio, admin, etc.).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: '#F4F2ED' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstitutionalHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
