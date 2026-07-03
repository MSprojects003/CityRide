# Supabase RLS Policies Setup

## Important: Row Level Security (RLS) Configuration

The 403 Forbidden errors you're experiencing are due to missing Row Level Security (RLS) policies in Supabase. Follow these steps to fix them:

## Step 1: Disable RLS for Development (Quick Fix)

In your Supabase dashboard:

1. Go to **Authentication > Policies**
2. For the `users` table, click **"Disable RLS"** (temporarily for development)
3. For the `vendors` table, click **"Disable RLS"** (temporarily for development)

This allows your authenticated users to insert data without RLS policy restrictions.

## Step 2: Proper RLS Policies (Recommended for Production)

Once development works, implement proper RLS policies:

### Users Table Policy

```sql
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Vendors Table Policy

```sql
-- Allow vendors to read their own data
CREATE POLICY "Vendors can read own data"
ON public.vendors
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to insert vendor profile for themselves
CREATE POLICY "Users can create vendor profile"
ON public.vendors
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow vendors to update their own data
CREATE POLICY "Vendors can update own data"
ON public.vendors
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## Step 3: Environment Variables

Make sure you have these environment variables set in your Vercel project:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Google OAuth Configuration

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials (Web application)
3. Set Authorized redirect URIs to:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://yourdomain.com/auth/callback` (production)

4. In Supabase:
   - Go to **Authentication > Providers > Google**
   - Enable Google
   - Paste your Google OAuth Client ID and Secret

## Step 5: Testing the Auth Flow

### Test Email/Password Auth:
1. Go to `/auth/signup`
2. Fill in personal details (Tab 1)
3. Fill in business details (Tab 2)
4. Click "Sign Up"
5. Check browser console for any `[v0]` debug logs

### Test Google OAuth:
1. Click "Continue with Google" button
2. You'll be redirected to Google login
3. After auth, you'll be redirected to `/auth/callback`
4. Should auto-redirect to `/dashboard`

## Debugging Tips

Open browser DevTools (F12) and:
1. Check **Console** tab for `[v0]` debug logs
2. Check **Network** tab for API requests to Supabase
3. Look for 403 errors which indicate RLS policy issues
4. Check `user_id` mismatch in vendors table inserts

## Common Issues

### 403 Forbidden on User Creation
- **Cause**: RLS policies blocking the insert
- **Fix**: Disable RLS temporarily or implement proper policies above

### Google OAuth Loop
- **Cause**: Callback URL mismatch or missing credentials
- **Fix**: Verify redirect URI matches exactly in both Google Console and Supabase

### "User already exists" Error
- **Cause**: Email already registered
- **Fix**: Use a different email or delete the user from Supabase dashboard

### Auth State Not Persisting
- **Cause**: Session not being saved properly
- **Fix**: Clear browser storage and try again (browser DevTools > Application > Clear)

## Next Steps

1. Disable RLS for both tables to get basic flow working
2. Test email/password signup
3. Test Google OAuth
4. Once working, implement proper RLS policies
5. Re-enable RLS with the policies above

For more help, check [Supabase Docs - RLS](https://supabase.com/docs/guides/auth/row-level-security)
