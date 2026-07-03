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

      console.log('[v0] Session exchanged successfully, checking user status')
      
      // Get current session to check provider and user
      const { data: { session } } = await supabase.auth.getSession()
      const provider = session?.user?.app_metadata?.provider
      const authUserId = session?.user?.id
      const authEmail = session?.user?.email
      
      console.log('[v0] Auth provider:', provider, 'User ID:', authUserId)

      // Check if user exists in database
      if (authUserId) {
        try {
          const checkRes = await fetch(
            new URL('/api/users/check-exists', request.url).toString(),
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: authUserId, email: authEmail }),
            }
          )

          const checkData = await checkRes.json()
          console.log('[v0] User existence check result:', checkData.exists)

          if (checkData.exists) {
            // User exists in database, proceed to dashboard
            console.log('[v0] User found in database, redirecting to dashboard')
            return NextResponse.redirect(new URL('/dashboard', request.url))
          } else {
            // User doesn't exist in database
            console.log('[v0] User not found in database, redirecting to signup')

            if (provider === 'google') {
              // For Google OAuth, extract name from user metadata
              const fullName = session?.user?.user_metadata?.full_name || ''
              const [firstname, ...lastnameParts] = fullName.split(' ')
              const lastname = lastnameParts.join(' ') || ''

              // Store Google auth data
              const authData = {
                email: authEmail,
                firstname: firstname || '',
                lastname: lastname || '',
                skipTab1: true,
              }

              // Redirect to signup with Tab 2 and auth data
              const signupUrl = new URL('/auth/signup', request.url)
              signupUrl.searchParams.set('tab', 'business')
              signupUrl.searchParams.set(
                'authData',
                encodeURIComponent(JSON.stringify(authData))
              )
              return NextResponse.redirect(signupUrl)
            } else {
              // For email signup, redirect to Tab 1
              return NextResponse.redirect(new URL('/auth/signup', request.url))
            }
          }
        } catch (checkError) {
          console.error('[v0] Error checking user existence:', checkError)
          // On error, redirect to signup to be safe
          return NextResponse.redirect(new URL('/auth/signup', request.url))
        }
      }

      console.log('[v0] No user ID found, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
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
