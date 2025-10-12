-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin', 'editor', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create security definer function to check if user is any admin
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
      AND role IN ('admin', 'super_admin', 'editor')
  );
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only super admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Fix admin_users table RLS policies
DROP POLICY IF EXISTS "Admin users can manage themselves" ON public.admin_users;

CREATE POLICY "Users can only view their own admin record"
ON public.admin_users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all admin users"
ON public.admin_users FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Fix mpesa_transactions table RLS policies
DROP POLICY IF EXISTS "Admin full access for mpesa_transactions" ON public.mpesa_transactions;

CREATE POLICY "Admins can view all mpesa transactions"
ON public.mpesa_transactions FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert mpesa transactions"
ON public.mpesa_transactions FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update mpesa transactions"
ON public.mpesa_transactions FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Fix system_settings table RLS policies
DROP POLICY IF EXISTS "Admin full access for system_settings" ON public.system_settings;

CREATE POLICY "Admins can view system settings"
ON public.system_settings FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage system settings"
ON public.system_settings FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Fix contact_submissions table RLS policies
DROP POLICY IF EXISTS "Admin full access for contact_submissions" ON public.contact_submissions;

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

-- Create trigger to auto-update updated_at on user_roles
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_roles_updated_at();