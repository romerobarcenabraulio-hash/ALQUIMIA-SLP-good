'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, ShieldCheck } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type FounderViewMode = 'admin' | 'client'

const STORAGE_KEY = 'alquimia.viewMode'
const AUDIT_KEY = 'alquimia.viewModeAudit'
const TEMPORARY_ADMIN_EMAILS = new Set(['romero.barcena.braulio@gmail.com'])

export function isFounderOrAdmin(
  metadata: Record<string, unknown> | undefined,
  email?: string | null,
  emails: Array<string | null | undefined> = [],
): boolean {
  const normalizedEmails = [email, ...emails]
    .map(value => value?.toLowerCase().trim())
    .filter((value): value is string => Boolean(value))
  if (normalizedEmails.some(value => TEMPORARY_ADMIN_EMAILS.has(value))) return true
  if (!metadata) return false
  const role = metadata.role
  return (
    role === 'founder' ||
    role === 'admin' ||
    metadata.has_admin_access === true ||
    metadata.bypass_payment_gates === true
  )
}

function readStoredMode(): FounderViewMode {
  if (typeof window === 'undefined') return 'admin'
  return window.localStorage.getItem(STORAGE_KEY) === 'client' ? 'client' : 'admin'
}

function writeModeAudit(mode: FounderViewMode) {
  try {
    const raw = window.localStorage.getItem(AUDIT_KEY)
    const current = raw ? JSON.parse(raw) : []
    const entries = Array.isArray(current) ? current : []
    const next = [
      { mode, changed_at: new Date().toISOString() },
      ...entries,
    ].slice(0, 20)
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(next))
  } catch {
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify([{ mode, changed_at: new Date().toISOString() }]))
  }
}

export function readFounderViewMode(): FounderViewMode {
  return readStoredMode()
}

export function FounderViewModeSwitcher() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress
  const emails = user?.emailAddresses.map(item => item.emailAddress) ?? []
  const canSwitch = useMemo(
    () => isFounderOrAdmin(user?.publicMetadata as Record<string, unknown> | undefined, email, emails),
    [email, emails, user?.publicMetadata],
  )
  const [mode, setMode] = useState<FounderViewMode>('admin')

  useEffect(() => {
    setMode(readStoredMode())
  }, [])

  if (!isLoaded || !canSwitch) return null

  function updateMode(nextMode: FounderViewMode) {
    setMode(nextMode)
    window.localStorage.setItem(STORAGE_KEY, nextMode)
    writeModeAudit(nextMode)
    window.dispatchEvent(new CustomEvent('alquimia:view-mode-change', { detail: { mode: nextMode } }))
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Cambiar vista de plataforma">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C8880]">
        Vista
      </span>
      <div className="inline-flex rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-0.5">
        <button
          type="button"
          onClick={() => updateMode('admin')}
          aria-pressed={mode === 'admin'}
          className={
            mode === 'admin'
              ? 'inline-flex items-center gap-1.5 rounded-[6px] bg-[#1C2B15] px-2.5 py-1.5 text-[12px] font-semibold text-white'
              : 'inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[12px] font-semibold text-[#5C574F] hover:text-[#1C1B18]'
          }
        >
          <ShieldCheck size={14} aria-hidden="true" />
          Interna
        </button>
        <button
          type="button"
          onClick={() => updateMode('client')}
          aria-pressed={mode === 'client'}
          className={
            mode === 'client'
              ? 'inline-flex items-center gap-1.5 rounded-[6px] bg-[#1C2B15] px-2.5 py-1.5 text-[12px] font-semibold text-white'
              : 'inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[12px] font-semibold text-[#5C574F] hover:text-[#1C1B18]'
          }
        >
          <Eye size={14} aria-hidden="true" />
          Cliente
        </button>
      </div>
      <Link
        href={`${pathname}?tenant_id=municipio-demo`}
        className="rounded-[8px] border border-[#D8D2C5] px-2.5 py-1.5 text-[12px] font-semibold text-[#5C574F] hover:text-[#1C1B18]"
      >
        Sandbox interno
      </Link>
    </div>
  )
}
