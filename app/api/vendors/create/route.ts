import { supabaseServer } from '@/lib/supabase/server'
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

    if (!user_id || !business_name) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, business_name' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const { data, error } = await supabaseServer
      .from('vendors')
      .insert([
        {
          user_id,
          business_name,
          description: description || null,
          image1: image1 || null,
          image2: image2 || null,
          have_business_phonenumber: have_business_phonenumber || false,
          business_phonenumber: business_phonenumber || null,
          is_nic_applied: false,
          is_vo_certificate_submitted: false,
          is_active: false,
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
