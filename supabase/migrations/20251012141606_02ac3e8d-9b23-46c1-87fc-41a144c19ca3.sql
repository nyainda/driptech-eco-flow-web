-- Step 1: Create enum only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'editor', 'user');
  END IF;
END $$;

-- Step 2: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Step 3: Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::public.app_role, 'super_admin'::public.app_role, 'editor'::public.app_role)
  );
$$;

-- Step 5: Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only super admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Step 6: Fix admin_users table policies
DROP POLICY IF EXISTS "Admin users can manage themselves" ON public.admin_users;
DROP POLICY IF EXISTS "Users can only view their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage all admin users" ON public.admin_users;

CREATE POLICY "Users can only view their own admin record"
ON public.admin_users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all admin users"
ON public.admin_users FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Step 7: Fix mpesa_transactions policies
DROP POLICY IF EXISTS "Admin full access for mpesa_transactions" ON public.mpesa_transactions;
DROP POLICY IF EXISTS "Admins can view all mpesa transactions" ON public.mpesa_transactions;
DROP POLICY IF EXISTS "Admins can insert mpesa transactions" ON public.mpesa_transactions;
DROP POLICY IF EXISTS "Admins can update mpesa transactions" ON public.mpesa_transactions;

CREATE POLICY "Admins can view all mpesa transactions"
ON public.mpesa_transactions FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert mpesa transactions"
ON public.mpesa_transactions FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update mpesa transactions"
ON public.mpesa_transactions FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Step 8: Fix system_settings policies
DROP POLICY IF EXISTS "Admin full access for system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can manage system settings" ON public.system_settings;

CREATE POLICY "Admins can view system settings"
ON public.system_settings FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage system settings"
ON public.system_settings FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Step 9: Fix contact_submissions policies
DROP POLICY IF EXISTS "Admin full access for contact_submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Public can insert contact submissions" ON public.contact_submissions;

CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update contact submissions"
ON public.contact_submissions FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete contact submissions"
ON public.contact_submissions FOR DELETE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Public can insert contact submissions"
ON public.contact_submissions FOR INSERT
WITH CHECK (true);

-- Step 10: Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_roles_updated_at();