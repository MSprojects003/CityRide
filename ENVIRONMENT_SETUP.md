# Environment Setup - CityRide Authentication

## Critical: Add Environment Variables

Your Supabase service role key is needed for user/vendor creation to bypass RLS policies.

### 1. **Get Service Role Key from Supabase**
   - Go to Supabase Dashboard > Project Settings > API
   - Copy the **Service Role** key (NOT anon key)
   - This bypasses RLS policies for server-side operations

### 2. **Add to Environment Variables**
   Create or update `.env.local` in your project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 3. **For Vercel Deployment**
   - Go to Vercel Project > Settings > Environment Variables
   - Add the three variables above for production

## How the Auth Flow Works (With This Fix)

### Email Signup:
1. User fills Tab 1 (personal details) → clicks "Next"
2. Fills Tab 2 (business details) → clicks "Sign Up"
3. **Backend flow:**
   - Create auth account in Supabase Auth
   - Call `/api/users/create` with service role (bypasses RLS)
   - Call `/api/vendors/create` with service role (bypasses RLS)
   - Redirect to dashboard

### Google OAuth:
1. User clicks "Continue with Google"
2. OAuth callback redirects to `/auth/google-callback`
3. **If user doesn't exist in database:**
   - Redirect to signup Tab 2 (skip Tab 1)
   - Pre-fill: email, firstname, lastname
   - User fills business details
   - Same backend flow as above
4. **If user exists:**
   - Redirect directly to dashboard

## Why This Works

- **The Problem:** RLS policies block direct user inserts from client
- **The Solution:** API routes use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS
- **Result:** User and vendor profiles are created immediately after auth signup

## Testing

1. Go to `http://localhost:3000/auth/signup`
2. Fill personal details (Tab 1) → Click "Next"
3. Fill business details (Tab 2) → Click "Sign Up"
4. Watch browser console for `[v0]` debug logs
5. Check Supabase Dashboard > Auth to verify user account
6. Check Database > users table to verify user profile
7. Check Database > vendors table to verify vendor profile

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is not defined"
- Make sure you added it to `.env.local`
- Restart dev server: `npm run dev`

### Still getting "user_not_found"
- Check that user was created in Supabase Auth dashboard
- Check that user record exists in `users` table
- Enable RLS debug mode by checking Network tab in dev tools

### Images not uploading
- Check storage bucket exists in Supabase
- Verify bucket allows public access
- Check file size limits (default 50MB)
