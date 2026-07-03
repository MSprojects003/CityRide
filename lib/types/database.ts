export interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  phone_number: string | null
  address: string | null
  city: string | null
  profile_image: string | null
  is_customer: boolean | null
  is_vendor: boolean | null
  is_deleted: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface Vendor {
  id: string
  user_id: string
  business_name: string
  description: string | null
  image1: string | null
  image2: string | null
  nic_pic1: string | null
  nic_pic2: string | null
  vo_certificate: string | null
  is_nic_applied: boolean | null
  is_vo_certificate_submitted: boolean | null
  have_business_phonenumber: boolean | null
  business_phonenumber: string | null
  policies: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface SignUpFormData {
  // Personal Details
  firstname: string
  lastname: string
  email: string
  phone_number: string
  address: string
  city: string
  // Business Details
  business_name: string
  description: string
  have_business_phonenumber: boolean
  business_phonenumber?: string
  image1?: File | null
  image2?: File | null
}
