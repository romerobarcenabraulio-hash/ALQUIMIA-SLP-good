'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AdminMasterTable } from '@/components/admin/AdminMasterTable'
import { AdminTenantDrawer } from '@/components/admin/AdminTenantDrawer'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function AdminMasterTablePage() {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleRowClick = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setDrawerOpen(true)
  }

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1B18]">Panel de administración</h1>
          <p className="text-sm text-[#6B6760] mt-1">Gestión integral de municipios y tenants</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1C1B18] mb-4">Estadísticas generales</h2>
          <AdminDashboard />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1C1B18] mb-4">Municipios</h2>
          <AdminMasterTable onRowClick={handleRowClick} />
        </div>

        <AdminTenantDrawer
          tenantId={selectedTenantId}
          isOpen={drawerOpen}
          onClose={() => {
            setDrawerOpen(false)
            setSelectedTenantId(null)
          }}
        />
      </div>
    </AppShell>
  )
}
