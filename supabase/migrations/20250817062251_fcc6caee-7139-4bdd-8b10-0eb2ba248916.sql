
-- Create M-Pesa transactions table
CREATE TABLE public.mpesa_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin full access for mpesa_transactions" 
  ON public.mpesa_transactions 
  FOR ALL 
  USING (true);

-- Update system_settings table to use correct column name if needed
UPDATE public.system_settings SET setting_key = 'mpesa_config' WHERE setting_key = 'mpesa_config';
