'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AdminMasterTable } from '@/components/admin/AdminMasterTable'
import { AdminTenantDrawer } from '@/components/admin/AdminTenantDrawer'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AdminNotificationCenter } from '@/components/admin/AdminNotificationCenter'
import { useAdminNotifications } from '@/hooks/useAdminNotifications'

export default function AdminMasterTablePage() {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { notifications, addNotification, removeNotification, markAsRead, markAllAsRead, unreadCount } =
    useAdminNotifications()

  const handleRowClick = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setDrawerOpen(true)
  }

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1B18]">Panel de administración</h1>
            <p className="text-sm text-[#6B6760] mt-1">Gestión integral de municipios y tenants</p>
          </div>
          <AdminNotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onRemove={removeNotification}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1C1B18] mb-4">Estadísticas generales</h2>
          <AdminDashboard />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1C1B18] mb-4">Municipios</h2>
          <AdminMasterTable onRowClick={handleRowClick} onNotify={addNotification} />
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
