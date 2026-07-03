'use client'

import { useAuth } from '@/lib/providers/auth-provider'
import { supabase } from '@/lib/supabase/client'
import { userApi } from '@/lib/api/user'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GoogleAuthButtonProps {
  onSuccess?: (userData?: { email: string; firstname: string; lastname: string }) => Promise<void>
  isLoading?: boolean
  variant?: 'default' | 'outline'
}

export function GoogleAuthButton({
  onSuccess,
  isLoading: externalLoading,
  variant = 'outline',
}: GoogleAuthButtonProps) {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGoogleAuth = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Check if this is a new user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const existingUser = await userApi.getUserByEmail(authUser.email!)

        if (!existingUser) {
          // New user - extract name from Google profile
          const fullName = authUser.user_metadata?.full_name || ''
          const [firstname, ...lastnameParts] = fullName.split(' ')
          const lastname = lastnameParts.join(' ') || ''

          if (onSuccess) {
            await onSuccess({
              email: authUser.email!,
              firstname: firstname || '',
              lastname: lastname || '',
            })
          } else {
            // Redirect to signup with pre-filled data
            sessionStorage.setItem(
              'googleAuthData',
              JSON.stringify({
                email: authUser.email!,
                firstname: firstname || '',
                lastname: lastname || '',
              })
            )
            router.push('/auth/signup')
          }
        } else {
          // Existing user - redirect to dashboard
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Google auth error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      onClick={handleGoogleAuth}
      disabled={loading || externalLoading}
      className="w-full"
    >
      {loading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  )
}
