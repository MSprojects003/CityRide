import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  console.log('[v0] Auth callback received:', { code: !!code, error, error_description })

  // Handle OAuth errors
  if (error) {
    console.error('[v0] OAuth error:', error_description || error)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    )
  }

  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('[v0] Session exchange error:', exchangeError)
        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
        )
      }

      console.log('[v0] Session exchanged successfully, checking provider')
      
      // Get current session to check provider
      const { data: { session } } = await supabase.auth.getSession()
      const provider = session?.user?.app_metadata?.provider
      
      console.log('[v0] Auth provider:', provider)

      if (provider === 'google') {
        console.log('[v0] Google OAuth detected, checking if user exists in database')
        return NextResponse.redirect(new URL('/auth/google-callback', request.url))
      }

      console.log('[v0] Email signup, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      console.error('[v0] Callback exception:', message)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(message)}`, request.url)
      )
    }
  }

  console.warn('[v0] No code in callback, redirecting to login')
  return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
}
