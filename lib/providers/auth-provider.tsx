'use client'

import { supabase } from '@/lib/supabase/client'
import { User as AuthUser } from '@supabase/supabase-js'
import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('[v0] Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[v0] Auth state changed:', _event)
      setUser(session?.user || null)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        console.error('[v0] Sign in error:', error)
        return { error: error.message }
      }
      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Sign in exception:', message)
      return { error: message }
    }
  }

  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        console.error('[v0] Sign up error:', error)
        return { error: error.message }
      }
      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Sign up exception:', message)
      return { error: message }
    }
  }

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
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
        console.error('[v0] Google OAuth error:', error)
        return { error: error.message }
      }
      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Google OAuth exception:', message)
      return { error: message }
    }
  }

  const signOut = async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[v0] Sign out error:', error)
        return { error: error.message }
      }
      return { error: null }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Sign out exception:', message)
      return { error: message }
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
