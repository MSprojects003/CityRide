'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/providers/auth-provider'
import { userApi } from '@/lib/api/user'
import { vendorApi } from '@/lib/api/vendor'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SRI_LANKAN_CITIES = [
  'Colombo',
  'Kandy',
  'Galle',
  'Jaffna',
  'Matara',
  'Trincomalee',
  'Kurunegala',
  'Anuradhapura',
  'Dambulla',
  'Badulla',
  'Negombo',
  'Kalutara',
  'Ratnapura',
  'Nuwara Eliya',
  'Hikkaduwa',
]

interface SignUpData {
  // Personal Details
  firstname: string
  lastname: string
  email: string
  password: string
  phone_number: string
  address: string
  city: string
  // Business Details
  business_name: string
  description: string
  have_business_phonenumber: boolean
  business_phonenumber: string
  image1: File | null
  image2: File | null
}

export default function SignUpPage() {
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleAuthData, setGoogleAuthData] = useState<{
    email: string
    firstname: string
    lastname: string
  } | null>(null)
  const { signUpWithEmail } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState<SignUpData>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    phone_number: '',
    address: '',
    city: '',
    business_name: '',
    description: '',
    have_business_phonenumber: false,
    business_phonenumber: '',
    image1: null,
    image2: null,
  })

  // Check for pre-filled Google data and handle URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // Check URL for auth data (from callback)
    const authDataParam = params.get('authData')
    if (authDataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(authDataParam))
        console.log('[v0] Auth data from callback found:', data)
        setGoogleAuthData(data)
        setFormData((prev) => ({
          ...prev,
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
        }))

        // If skipTab1 flag is set, activate Tab 2 directly
        if (data.skipTab1) {
          console.log('[v0] Skipping Tab 1, showing Tab 2 for vendor details')
          setActiveTab('business')
        }
      } catch (e) {
        console.error('[v0] Failed to parse auth data:', e)
      }
    }

    // Also check sessionStorage for backward compatibility
    const stored = sessionStorage.getItem('googleAuthData')
    if (stored && !authDataParam) {
      const data = JSON.parse(stored)
      console.log('[v0] Google auth data found in storage:', data)
      setGoogleAuthData(data)
      setFormData((prev) => ({
        ...prev,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
      }))

      if (data.skipTab1) {
        console.log('[v0] Skipping Tab 1, showing Tab 2 for vendor details')
        setActiveTab('business')
      }

      sessionStorage.removeItem('googleAuthData')
    }

    // Check URL params for tab override
    const tab = params.get('tab')
    if (tab === 'business') {
      setActiveTab('business')
    }
  }, [])

  const handlePersonalDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCityChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      city: value,
    }))
  }

  const handleBusinessDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    imageNumber: 1 | 2
  ) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({
      ...prev,
      [`image${imageNumber}`]: file,
    }))
  }

  const validatePersonalDetails = (): boolean => {
    // Skip validation if Google user (no password needed for OAuth)
    if (googleAuthData) {
      return true
    }

    if (
      !formData.firstname.trim() ||
      !formData.lastname.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.phone_number.trim() ||
      !formData.address.trim() ||
      !formData.city
    ) {
      setError('Please fill in all personal details')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    return true
  }

  const validateBusinessDetails = (): boolean => {
    if (!formData.business_name.trim() || !formData.description.trim()) {
      setError('Please fill in business name and description')
      return false
    }

    if (formData.have_business_phonenumber && !formData.business_phonenumber.trim()) {
      setError('Please enter business phone number')
      return false
    }

    if (
      formData.have_business_phonenumber &&
      formData.business_phonenumber === formData.phone_number
    ) {
      setError('Business phone number cannot be the same as personal phone number')
      return false
    }

    return true
  }

  const handleNextTab = async () => {
    setError(null)

    if (validatePersonalDetails()) {
      setActiveTab('business')
    }
  }

  const handleGoogleSignUp = async (userData?: {
    email: string
    firstname: string
    lastname: string
  }) => {
    if (!userData) return

    try {
      setLoading(true)
      setError(null)

      // Create user profile
      const user = await userApi.createUser({
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        phone_number: formData.phone_number,
        address: formData.address,
        city: formData.city,
      })

      // Create vendor profile
      await vendorApi.createVendor({
        user_id: user.id,
        business_name: formData.business_name,
        description: formData.description,
        have_business_phonenumber: formData.have_business_phonenumber,
        business_phonenumber: formData.business_phonenumber || null,
      })

      // Now authenticate with Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateBusinessDetails()) {
      return
    }

    try {
      setLoading(true)

      let userId: string | undefined

      // If this is a Google OAuth user
      if (googleAuthData) {
        console.log('[v0] Google OAuth signup - getting authenticated user ID')
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          throw new Error('Authentication failed. Please try again.')
        }

        userId = authUser.id
        console.log('[v0] Auth user ID:', userId)
      } else {
        // For email signup, sign up first
        console.log('[v0] Email signup - creating auth account')
        const signUpResult = await signUpWithEmail(formData.email, formData.password)
        if (signUpResult.error) {
          console.error('[v0] Auth signup error:', signUpResult.error)
          setError(signUpResult.error)
          return
        }

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          throw new Error('Authentication failed. Please try again.')
        }

        userId = authUser.id
        console.log('[v0] New auth user created:', userId)
      }

      // Create user profile via API (bypasses RLS)
      console.log('[v0] Creating user profile with personal details via API')
      const userRes = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          phone_number: formData.phone_number,
          address: formData.address,
          city: formData.city,
        }),
      })

      if (!userRes.ok) {
        const errorData = await userRes.json()
        throw new Error(errorData.error || 'Failed to create user profile')
      }

      const user = await userRes.json()
      console.log('[v0] User profile created:', user.id)

      // Upload images if provided
      let image1Url: string | null = null
      let image2Url: string | null = null

      if (formData.image1) {
        console.log('[v0] Uploading image 1')
        image1Url = await vendorApi.uploadVendorImage(user.id, 1, formData.image1)
      }

      if (formData.image2) {
        console.log('[v0] Uploading image 2')
        image2Url = await vendorApi.uploadVendorImage(user.id, 2, formData.image2)
      }

      // Create vendor profile via API (bypasses RLS)
      console.log('[v0] Creating vendor profile with business details via API')
      const vendorRes = await fetch('/api/vendors/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          business_name: formData.business_name,
          description: formData.description,
          image1: image1Url,
          image2: image2Url,
          have_business_phonenumber: formData.have_business_phonenumber,
          business_phonenumber: formData.business_phonenumber || null,
        }),
      })

      if (!vendorRes.ok) {
        const errorData = await vendorRes.json()
        throw new Error(errorData.error || 'Failed to create vendor profile')
      }

      console.log('[v0] Signup complete - user and vendor profiles created')
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      console.error('[v0] Signup error:', errorMessage, err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Join CityRide as a vendor today</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Details</TabsTrigger>
              <TabsTrigger value="business">Business Details</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstname" className="text-sm font-medium">
                      First Name
                    </label>
                    <Input
                      id="firstname"
                      name="firstname"
                      placeholder="John"
                      value={formData.firstname}
                      onChange={handlePersonalDetailsChange}
                      disabled={!!googleAuthData}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastname" className="text-sm font-medium">
                      Last Name
                    </label>
                    <Input
                      id="lastname"
                      name="lastname"
                      placeholder="Doe"
                      value={formData.lastname}
                      onChange={handlePersonalDetailsChange}
                      disabled={!!googleAuthData}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handlePersonalDetailsChange}
                    disabled={!!googleAuthData}
                  />
                </div>

                {!googleAuthData && (
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handlePersonalDetailsChange}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="phone_number" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="+94 71 234 5678"
                    value={formData.phone_number}
                    onChange={handlePersonalDetailsChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium">
                      Address
                    </label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main St"
                      value={formData.address}
                      onChange={handlePersonalDetailsChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">
                      City
                    </label>
                    <Select value={formData.city} onValueChange={handleCityChange}>
                      <SelectTrigger id="city">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {SRI_LANKAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button onClick={handleNextTab} className="w-full">
                  Next
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <GoogleAuthButton
                onSuccess={async (userData) => {
                  if (userData) {
                    setGoogleAuthData(userData)
                    setFormData((prev) => ({
                      ...prev,
                      email: userData.email,
                      firstname: userData.firstname,
                      lastname: userData.lastname,
                    }))
                    setActiveTab('business')
                  }
                }}
                isLoading={loading}
              />

              <p className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="business_name" className="text-sm font-medium">
                    Business Name
                  </label>
                  <Input
                    id="business_name"
                    name="business_name"
                    placeholder="Your Business Name"
                    value={formData.business_name}
                    onChange={handleBusinessDetailsChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Business Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about your business..."
                    value={formData.description}
                    onChange={handleBusinessDetailsChange}
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="have_business_phonenumber"
                    checked={formData.have_business_phonenumber}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        have_business_phonenumber: checked === true,
                      }))
                    }
                  />
                  <Label
                    htmlFor="have_business_phonenumber"
                    className="cursor-pointer text-sm font-medium"
                  >
                    I have a separate business phone number
                  </Label>
                </div>

                {formData.have_business_phonenumber && (
                  <div className="space-y-2">
                    <label htmlFor="business_phonenumber" className="text-sm font-medium">
                      Business Phone Number
                    </label>
                    <Input
                      id="business_phonenumber"
                      name="business_phonenumber"
                      type="tel"
                      placeholder="+94 71 234 5678"
                      value={formData.business_phonenumber}
                      onChange={handleBusinessDetailsChange}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="image1" className="text-sm font-medium">
                      Business Image 1
                    </label>
                    <Input
                      id="image1"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="image2" className="text-sm font-medium">
                      Business Image 2
                    </label>
                    <Input
                      id="image2"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 2)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
