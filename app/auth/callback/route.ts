import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  console.log('[v0] Auth callback received:', { code: !!code, error, error_description })

  if (error) {
    console.error('[v0] OAuth error:', error_description || error)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url)
    )
  }

  if (!code) {
    console.warn('[v0] No code in callback, redirecting to login')
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  }

  try {
    const supabase = await createServerSupabaseClient()

    const { data: exchangeData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[v0] Session exchange error:', exchangeError.message)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, request.url)
      )
    }

    const authUser = exchangeData.user
    const provider = authUser?.app_metadata?.provider
    const authUserId = authUser?.id
    const authEmail = authUser?.email

    console.log('[v0] Auth successful:', { provider, authUserId, authEmail })

    if (!authUserId) {
      console.error('[v0] No user ID in session')
      return NextResponse.redirect(new URL('/auth/login?error=no_user_id', request.url))
    }

    // Check directly against the users table (RLS should allow a user to read their own row)
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUserId)
      .maybeSingle()

    if (lookupError) {
      console.error('[v0] Error checking user:', lookupError.message)
      return NextResponse.redirect(new URL('/auth/signup', request.url))
    }

    if (existingUser) {
      console.log('[v0] User exists in database, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    console.log('[v0] User not in database, must complete signup')

    if (provider === 'google') {
      const fullName =
        authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || ''
      const [firstname, ...lastnameParts] = fullName.split(' ')
      const lastname = lastnameParts.join(' ') || ''

      const authData = {
        email: authEmail,
        firstname: firstname || '',
        lastname: lastname || '',
        isGoogleAuth: true,
      }

      const signupUrl = new URL('/auth/signup', request.url)
      signupUrl.searchParams.set('tab', 'business')
      signupUrl.searchParams.set('authData', encodeURIComponent(JSON.stringify(authData)))
      return NextResponse.redirect(signupUrl)
    }

    console.log('[v0] Email signup, redirecting to signup Tab 1')
    return NextResponse.redirect(new URL('/auth/signup', request.url))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed'
    console.error('[v0] Callback exception:', message)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(message)}`, request.url))
  }
}