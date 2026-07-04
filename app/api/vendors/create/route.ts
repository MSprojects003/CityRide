import { createServiceRoleClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      business_name,
      description,
      image1,
      image2,
      have_business_phonenumber,
      business_phonenumber,
    } = body

    console.log('[v0] Creating vendor via API:', { user_id, business_name })

    if (!user_id || !business_name || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseService = createServiceRoleClient()

    const { data, error } = await supabaseService
      .from('vendors')
      .insert([
        {
          user_id,
          business_name,
          description,
          image1: image1 || null,
          image2: image2 || null,
          have_business_phonenumber: have_business_phonenumber || false,
          business_phonenumber: business_phonenumber || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] Vendor creation API error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Mark the user as a vendor now that their vendor profile exists
    const { error: updateError } = await supabaseService
      .from('users')
      .update({ is_vendor: true })
      .eq('id', user_id)

    if (updateError) {
      console.error('[v0] Failed to flag user as vendor:', updateError)
      // Not fatal — vendor row exists, just log it
    }

    console.log('[v0] Vendor created successfully:', data.id)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Vendor creation exception:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}