'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { userApi } from '@/lib/api/user'

export default function GoogleCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[v0] Handling Google OAuth callback')

        // Get the authenticated user
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !authUser) {
          console.error('[v0] Auth user error:', authError)
          setError('Failed to authenticate. Please try again.')
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }

        console.log('[v0] Auth user:', authUser.email)

        // Check if user already exists in database
        const existingUser = await userApi.getUserByEmail(authUser.email!)
        console.log('[v0] Existing user check:', existingUser ? 'found' : 'not found')

        if (existingUser) {
          // User exists - sign them in and redirect to dashboard
          console.log('[v0] User exists, redirecting to dashboard')
          router.push('/dashboard')
        } else {
          // User doesn't exist - redirect to signup Tab 2 with prefilled data
          console.log('[v0] New user, redirecting to signup Tab 2')

          // Extract name from Google profile
          const fullName = authUser.user_metadata?.full_name || ''
          const [firstname, ...lastnameParts] = fullName.split(' ')
          const lastname = lastnameParts.join(' ') || ''

          // Store data and redirect to signup with Tab 2 active
          sessionStorage.setItem(
            'googleAuthData',
            JSON.stringify({
              email: authUser.email,
              firstname: firstname || '',
              lastname: lastname || '',
              userId: authUser.id,
              skipTab1: true, // Flag to skip Tab 1
            })
          )

          router.push('/auth/signup?tab=business')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        console.error('[v0] Callback error:', message)
        setError(message)
        setTimeout(() => router.push('/auth/login'), 2000)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-4 p-6">
        {loading ? (
          <>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Processing your authentication...
            </p>
          </>
        ) : error ? (
          <>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Redirecting to login...
            </p>
          </>
        ) : null}
      </div>
    </div>
  )
}
