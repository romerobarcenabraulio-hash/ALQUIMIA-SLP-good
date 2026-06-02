import { redirect } from 'next/navigation'
import { sanitizeAuthRedirectPath } from '@/lib/authRedirects'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  const next = `?redirect_url=${encodeURIComponent(sanitizeAuthRedirectPath(params.next))}`
  redirect(`/sign-in${next}`)
}
