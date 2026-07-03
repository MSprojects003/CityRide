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
      console.log('[v0] Starting Google OAuth flow')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('[v0] OAuth error:', error)
        throw error
      }

      console.log('[v0] OAuth redirect initiated')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed'
      console.error('[v0] Google auth error:', errorMessage, error)
      alert(`Error: ${errorMessage}`)
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
