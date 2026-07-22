# Logify Express - Supabase Admin Authentication Setup Guide

## Application & Credentials Overview
- **Application URL**: `https://logify-express-jhy1.vercel.app/`
- **Admin Account**: `owighoyotaemmanuel424@gmail.com`
- **Default Password**: `Owighoyota12345`
- **Admin Role**: `admin` / `super_admin`
- **Login Route**: `/admin/login`
- **Dashboard Route**: `/admin/dashboard`

---

## 1. Database Schema (`admin_profiles`)

Run the migration script located at `supabase/migrations/20260722_admin_profiles.sql` in your Supabase SQL Editor:

```sql
-- Create admin_profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Read Policy
CREATE POLICY "Admins can view admin_profiles"
ON public.admin_profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  )
);

-- Write Policy
CREATE POLICY "Admins can modify admin_profiles"
ON public.admin_profiles FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  )
);
```

---

## 2. Supabase Auth Redirect URLs

In your Supabase Dashboard -> **Authentication** -> **URL Configuration**:

- **Site URL**: `https://logify-express-jhy1.vercel.app`
- **Redirect URLs**:
  - `https://logify-express-jhy1.vercel.app/secure-admin-portal-9x7k`
  - `https://logify-express-jhy1.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

---

## 3. Vercel Environment Variables Configuration

Add the following environment variables in your Vercel Project Settings -> **Environment Variables**:

| Variable Name | Value | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Frontend Supabase Client URL |
| `VITE_SUPABASE_ANON_KEY` | `<your-anon-key>` | Frontend Supabase Client Anon Key |
| `SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Server-side Supabase URL |
| `SUPABASE_ANON_KEY` | `<your-anon-key>` | Server-side Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `<your-service-role-key>` | Protected Server Actions (Kept secret) |

---

## 4. Middleware & Route Protection

All `/admin/*` routes (`/admin/dashboard`, `/admin/shipments`, etc.) are protected. Any unauthenticated access or access by non-admin roles automatically triggers a redirect to `/admin/login`.
