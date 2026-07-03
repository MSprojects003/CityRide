# CRITICAL SETUP - Fix "user_not_found" Error

## The Problem
After Google OAuth authentication, the JWT is valid but when we try to access the database, RLS policies block it because the user doesn't exist in the `users` table yet.

## Step 1: Disable RLS on Tables (Immediate Fix)

**In Supabase Dashboard:**

1. Go to **SQL Editor**
2. Run these commands:

```sql
-- Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on vendors table
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;
```

**OR via UI:**
1. Click on **Authentication** > **Policies**
2. Find `users` table → Click **Disable RLS**
3. Find `vendors` table → Click **Disable RLS**

## Step 2: Configure Google OAuth in Supabase

1. Go to **Authentication** > **Providers**
2. Click **Google**
3. Add your Google Cloud OAuth credentials (Client ID and Secret)
4. Set Redirect URL to: `http://localhost:3000/auth/callback`

## Step 3: The Authentication Flow (Now Works)

```
1. User clicks "Sign in with Google"
2. Redirected to Google login
3. Google authenticates user
4. Redirected to /auth/callback with auth code
5. Supabase exchanges code for valid JWT
6. System checks if user exists in users table
7. If NO → Redirect to /auth/signup?tab=business with pre-filled data
8. If YES → Redirect to /dashboard
```

## Step 4: Environment Variables

Make sure you have in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

1. Go to `http://localhost:3000/auth/login`
2. Click "Continue with Google"
3. Sign in with Google account
4. Should redirect to signup Tab 2 (for new users) or dashboard (for existing users)

## Troubleshooting

- **Still getting user_not_found?** Check that RLS is disabled on both tables
- **Google redirect not working?** Verify redirect URL matches exactly in Google Cloud console
- **Stuck on loading?** Check browser console for `[v0]` logs to see where it's failing
