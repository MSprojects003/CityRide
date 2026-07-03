# CityRide Authentication Setup

## Overview
This document explains the complete authentication system implemented for CityRide with Supabase, Google OAuth, and a two-tab signup flow.

## Features

### 1. Authentication Methods
- **Email & Password**: Traditional signup and login
- **Google OAuth**: One-click authentication with Google account
- **Protected Routes**: Dashboard and other protected pages redirect to login if not authenticated

### 2. Signup Flow (Two-Tab System)

#### Tab 1: Personal Details
Collects:
- First Name & Last Name (same row)
- Email Address
- Password (6+ characters)
- Phone Number
- Address & City (same row, city is a select dropdown with Sri Lankan cities)
- "Next" button to proceed to Tab 2

#### Tab 2: Business Details
Collects:
- Business Name
- Business Description
- Business Phone Number (optional with toggle)
  - Validation: Must be different from personal phone number
- Business Image 1 (optional, file upload)
- Business Image 2 (optional, file upload)
- Sign Up button

### 3. Database Schema

#### Users Table
```sql
- id (uuid, primary key)
- firstname (text)
- lastname (text)
- email (text, unique)
- phone_number (text)
- address (text)
- city (text)
- profile_image (text)
- is_customer (boolean)
- is_vendor (boolean)
- is_deleted (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Vendors Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- business_name (text)
- description (text)
- image1 (text)
- image2 (text)
- nic_pic1 (text)
- nic_pic2 (text)
- vo_certificate (text)
- is_nic_applied (boolean)
- is_vo_certificate_submitted (boolean)
- have_business_phonenumber (boolean)
- business_phonenumber (text)
- policies (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

## File Structure

```
lib/
├── api/
│   ├── user.ts         # User API operations
│   └── vendor.ts       # Vendor API operations
├── supabase/
│   └── client.ts       # Supabase client initialization
├── types/
│   └── database.ts     # TypeScript interfaces for database models
└── providers/
    ├── auth-provider.tsx    # Auth context and hooks
    └── query-provider.tsx   # TanStack Query provider

components/
└── auth/
    └── GoogleAuthButton.tsx # Reusable Google OAuth button

app/
├── auth/
│   ├── login/
│   │   └── page.tsx    # Login page
│   ├── signup/
│   │   └── page.tsx    # Signup page with tabs
│   ├── callback/
│   │   └── route.ts    # OAuth callback handler
│   └── layout.tsx
└── dashboard/
    ├── layout.tsx
    └── layout-client.tsx # Protected layout with auth check
```

## Environment Variables

Add these to your `.env.local` or Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production domain
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
7. In Supabase dashboard, go to Authentication > Providers > Google
8. Add your Google Client ID and Client Secret

## API Client Usage

### User Operations
```typescript
import { userApi } from '@/lib/api/user'

// Check if email exists
const exists = await userApi.checkEmailExists('user@example.com')

// Create user
const user = await userApi.createUser({
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  phone_number: '+94701234567',
  address: '123 Main St',
  city: 'Colombo'
})

// Get user by email or ID
const user = await userApi.getUserByEmail('john@example.com')
const user = await userApi.getUserById('user-id')

// Update user
const updated = await userApi.updateUser('user-id', {
  phone_number: '+94702345678'
})
```

### Vendor Operations
```typescript
import { vendorApi } from '@/lib/api/vendor'

// Create vendor profile
const vendor = await vendorApi.createVendor({
  user_id: 'user-id',
  business_name: 'My Business',
  description: 'Business description',
  image1: 'https://...',
  have_business_phonenumber: true,
  business_phonenumber: '+94701234567'
})

// Get vendor by user ID or ID
const vendor = await vendorApi.getVendorByUserId('user-id')
const vendor = await vendorApi.getVendorById('vendor-id')

// Upload vendor image
const url = await vendorApi.uploadVendorImage(
  'user-id',
  1,  // image number (1 or 2)
  file  // File object
)

// Update vendor
const updated = await vendorApi.updateVendor('vendor-id', {
  business_name: 'Updated Name'
})
```

## Authentication Flow

### Email & Password Flow

1. User visits `/auth/signup`
2. Fills Tab 1: Personal details
3. Clicks "Next" → Tab 2: Business details
4. Fills Tab 2: Business details
5. Clicks "Sign Up":
   - Email/password authentication with Supabase
   - Creates user record in users table
   - Uploads images to storage
   - Creates vendor record in vendors table
   - Redirects to `/dashboard`

### Google OAuth Flow

#### Existing User
1. User clicks "Continue with Google" on login page
2. Redirects to Google consent screen
3. After authentication:
   - Checks if email exists in users table
   - If exists: Signs in and redirects to dashboard
   - If not exists: Proceeds to signup with pre-filled data

#### New User
1. User clicks "Continue with Google" on signup page
2. Redirects to Google consent screen
3. After authentication:
   - Extracts name from Google profile
   - Pre-fills email, firstname, lastname
   - User proceeds to Tab 2: Business details
   - After completing business details and clicking "Sign Up":
     - Creates user record
     - Creates vendor record
     - Authenticates with Google
     - Redirects to dashboard

## Protected Routes

The following routes require authentication:
- `/dashboard` and all sub-routes (`/customers`, `/reservations`, `/vehicles`)
- Root `/` redirects to `/auth/login` if not authenticated, or `/dashboard` if authenticated

Unauthenticated routes:
- `/auth/login`
- `/auth/signup`
- `/auth/callback`

## Using Auth Context

```typescript
import { useAuth } from '@/lib/providers/auth-provider'

export function MyComponent() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {user ? (
        <p>Welcome, {user.email}</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  )
}
```

## Using TanStack Query

```typescript
import { useMutation, useQuery } from '@tanstack/react-query'
import { userApi } from '@/lib/api/user'

// Example: Create user mutation
const { mutate: createUser, isPending } = useMutation({
  mutationFn: userApi.createUser,
  onSuccess: (data) => {
    console.log('User created:', data)
  },
})

// Example: Get user query
const { data: user, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userApi.getUserById(userId),
})
```

## Validation Rules

### Personal Details
- First Name: Required, non-empty
- Last Name: Required, non-empty
- Email: Required, valid email format
- Password: Required, minimum 6 characters
- Phone Number: Required, non-empty
- Address: Required, non-empty
- City: Required, must select from dropdown

### Business Details
- Business Name: Required, non-empty
- Description: Required, non-empty
- Business Phone (if enabled): Must be non-empty and different from personal phone
- Images: Optional

## Error Handling

All API calls include proper error handling. Errors are caught and displayed to users in error messages on the pages.

## Session Management

- Sessions are managed by Supabase Auth
- Auth state is persisted in browser
- On page refresh, authentication status is checked
- `onAuthStateChange` listener updates auth state globally
- Automatic logout can be triggered with `signOut()`

## Next Steps

1. Configure Supabase and Google OAuth
2. Set environment variables
3. Test login/signup flow
4. Customize user profile and vendor dashboard pages
5. Implement vendor verification process
6. Add role-based access control if needed
