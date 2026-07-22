-- Logify Express - Supabase Admin Authentication Migration
-- Target Table: admin_profiles
-- Allowed Admin Email: owighoyotaemmanuel424@gmail.com

-- 1. Create the admin_profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS Security Policies
-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Admins can view admin_profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can modify admin_profiles" ON public.admin_profiles;

-- Policy: Authenticated users can read their own profile or any profile if role is 'admin' or 'super_admin'
CREATE POLICY "Admins can view admin_profiles"
ON public.admin_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  )
);

-- Policy: Only admin role can insert or update admin_profiles
CREATE POLICY "Admins can modify admin_profiles"
ON public.admin_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  )
);

-- 4. Trigger function to automatically seed admin profile when user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Restrict admin_profiles creation specifically to the authorized admin email
  IF LOWER(NEW.email) = 'owighoyotaemmanuel424@gmail.com' THEN
    INSERT INTO public.admin_profiles (id, email, role)
    VALUES (NEW.id, LOWER(NEW.email), 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();

-- 6. Helper function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_profiles_modtime ON public.admin_profiles;
CREATE TRIGGER update_admin_profiles_modtime
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
