'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { isFounderOrAdmin } from '@/components/platform/FounderViewModeSwitcher'

export default function PostLoginPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.replace('/sign-in')
      return
    }
    const email = user.primaryEmailAddress?.emailAddress
    const emails = user.emailAddresses.map(e => e.emailAddress)
    const admin = isFounderOrAdmin(
      user.publicMetadata as Record<string, unknown> | undefined,
      email,
      emails,
    )
    router.replace(admin ? '/v' : '/hub')
  }, [isLoaded, user, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F1]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B6D11] border-t-transparent" />
    </div>
  )
}
