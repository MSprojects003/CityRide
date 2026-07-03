import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let existingUser = null

    // Check by user ID (priority)
    if (userId) {
      console.log('[v0] Checking if user exists by ID:', userId)
      const { data } = await supabase
        .from('users')
        .select('id, email, firstname, lastname')
        .eq('id', userId)
        .single()

      existingUser = data
    }

    // If not found and email provided, check by email
    if (!existingUser && email) {
      console.log('[v0] Checking if user exists by email:', email)
      const { data } = await supabase
        .from('users')
        .select('id, email, firstname, lastname')
        .eq('email', email)
        .single()

      existingUser = data
    }

    if (existingUser) {
      console.log('[v0] User found in database:', existingUser.id)
      return NextResponse.json({ exists: true, user: existingUser })
    }

    console.log('[v0] User not found in database')
    return NextResponse.json({ exists: false, user: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Check user error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
