'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AdminMasterTable } from '@/components/admin/AdminMasterTable'
import { AdminTenantDrawer } from '@/components/admin/AdminTenantDrawer'

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
          <h1 className="text-2xl font-bold text-[#1C1B18]">Admin Master Table</h1>
          <p className="text-sm text-[#6B6760] mt-1">Sprint 10: Gestión de municipios y tenants</p>
        </div>

        <AdminMasterTable onRowClick={handleRowClick} />

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
