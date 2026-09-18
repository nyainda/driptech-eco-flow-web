-- Check if enum exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'editor', 'user');
  END IF;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
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
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin', 'editor')
  );
$$;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Admin users can manage themselves" ON public.admin_users;
DROP POLICY IF EXISTS "Admin full access for mpesa_transactions" ON public.mpesa_transactions;
DROP POLICY IF EXISTS "Admin full access for system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admin full access for contact_submissions" ON public.contact_submissions;

-- RLS for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only super admins can manage roles" ON public.user_roles;
CREATE POLICY "Only super admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Secure admin_users table
DROP POLICY IF EXISTS "Users can only view their own admin record" ON public.admin_users;
CREATE POLICY "Users can only view their own admin record"
ON public.admin_users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can manage all admin users" ON public.admin_users;
CREATE POLICY "Super admins can manage all admin users"
ON public.admin_users FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Secure mpesa_transactions
DROP POLICY IF EXISTS "Admins can view mpesa" ON public.mpesa_transactions;
CREATE POLICY "Admins can view mpesa"
ON public.mpesa_transactions FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert mpesa" ON public.mpesa_transactions;
CREATE POLICY "Admins can insert mpesa"
ON public.mpesa_transactions FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update mpesa" ON public.mpesa_transactions;
CREATE POLICY "Admins can update mpesa"
ON public.mpesa_transactions FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Secure system_settings
DROP POLICY IF EXISTS "Admins view settings" ON public.system_settings;
CREATE POLICY "Admins view settings"
ON public.system_settings FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage settings" ON public.system_settings;
CREATE POLICY "Super admins manage settings"
ON public.system_settings FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Secure contact_submissions
DROP POLICY IF EXISTS "Admins view contacts" ON public.contact_submissions;
CREATE POLICY "Admins view contacts"
ON public.contact_submissions FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update contacts" ON public.contact_submissions;
CREATE POLICY "Admins update contacts"
ON public.contact_submissions FOR UPDATE
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete contacts" ON public.contact_submissions;
CREATE POLICY "Admins delete contacts"
ON public.contact_submissions FOR DELETE
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public insert contacts" ON public.contact_submissions;
CREATE POLICY "Public insert contacts"
ON public.contact_submissions FOR INSERT
WITH CHECK (true);

-- Update trigger
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