-- Insert admin role for admin@driptech.com
-- First, we need to get the user_id from auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'super_admin'::public.app_role
FROM auth.users
WHERE email = 'admin@driptech.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also add regular admin role as backup
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@driptech.com'
ON CONFLICT (user_id, role) DO NOTHING;