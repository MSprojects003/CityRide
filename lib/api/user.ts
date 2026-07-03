import { supabase } from '@/lib/supabase/client'
import { User, SignUpFormData } from '@/lib/types/database'

export const userApi = {
  // Check if email already exists
  async checkEmailExists(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows found
      return false
    }

    return !!data
  },

  // Create user with personal details
  async createUser(userData: {
    id?: string
    firstname: string
    lastname: string
    email: string
    phone_number: string
    address: string
    city: string
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          ...(userData.id && { id: userData.id }),
          firstname: userData.firstname,
          lastname: userData.lastname,
          email: userData.email,
          phone_number: userData.phone_number,
          address: userData.address,
          city: userData.city,
          is_customer: false,
          is_vendor: false,
          is_deleted: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] User creation error:', error)
      throw error
    }
    return data
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code === 'PGRST116') {
      return null
    }

    if (error) throw error
    return data
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code === 'PGRST116') {
      return null
    }

    if (error) throw error
    return data
  },

  // Update user
  async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
