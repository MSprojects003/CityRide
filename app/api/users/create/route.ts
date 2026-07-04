import { createServiceRoleClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, firstname, lastname, email, phone_number, address, city } = body

    console.log('[v0] Creating user via API:', { id, email })

    if (!id || !firstname || !lastname || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseService = createServiceRoleClient()

    const { data, error } = await supabaseService
      .from('users')
      .insert([
        {
          id,
          firstname,
          lastname,
          email,
          phone_number: phone_number || null,
          address: address || null,
          city: city || null,
          is_customer: false,
          is_vendor: false,
          is_deleted: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] User creation API error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('[v0] User created successfully:', data.id)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] User creation exception:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}