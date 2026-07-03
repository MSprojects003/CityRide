import { supabase } from '@/lib/supabase/client'
import { Vendor } from '@/lib/types/database'

export const vendorApi = {
  // Create vendor profile
  async createVendor(vendorData: {
    user_id: string
    business_name: string
    description?: string
    image1?: string | null
    image2?: string | null
    have_business_phonenumber?: boolean
    business_phonenumber?: string | null
  }): Promise<Vendor> {
    const { data, error } = await supabase
      .from('vendors')
      .insert([
        {
          user_id: vendorData.user_id,
          business_name: vendorData.business_name,
          description: vendorData.description || null,
          image1: vendorData.image1 || null,
          image2: vendorData.image2 || null,
          have_business_phonenumber: vendorData.have_business_phonenumber || false,
          business_phonenumber: vendorData.business_phonenumber || null,
          is_nic_applied: false,
          is_vo_certificate_submitted: false,
          is_active: false,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get vendor by user ID
  async getVendorByUserId(userId: string): Promise<Vendor | null> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      return null
    }

    if (error) throw error
    return data
  },

  // Get vendor by ID
  async getVendorById(id: string): Promise<Vendor | null> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code === 'PGRST116') {
      return null
    }

    if (error) throw error
    return data
  },

  // Update vendor
  async updateVendor(
    id: string,
    updates: Partial<Vendor>
  ): Promise<Vendor> {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Upload vendor image
  async uploadVendorImage(
    userId: string,
    imageNumber: 1 | 2,
    file: File
  ): Promise<string> {
    const fileName = `${userId}-image-${imageNumber}-${Date.now()}`
    const { data, error } = await supabase.storage
      .from('vendor-images')
      .upload(`vendor-images/${fileName}`, file)

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(`vendor-images/${fileName}`)

    return publicUrl
  },
}
