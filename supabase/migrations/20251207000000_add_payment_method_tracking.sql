-- Migration: Add payment method tracking to mpesa_transactions table
-- This allows tracking of both M-Pesa and Bank transactions in one table

-- Add payment_method column (defaults to 'mpesa' for backward compatibility)
ALTER TABLE public.mpesa_transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mpesa' 
CHECK (payment_method IN ('mpesa', 'bank', 'cash', 'card'));

-- Add bank_name column for bank transfer tracking
ALTER TABLE public.mpesa_transactions 
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Add reference_number column for bank transfer references
ALTER TABLE public.mpesa_transactions 
ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Add notes column for additional transaction details
ALTER TABLE public.mpesa_transactions 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records to have payment_method set
UPDATE public.mpesa_transactions 
SET payment_method = 'mpesa' 
WHERE payment_method IS NULL;

-- Create index for faster queries by payment method
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_payment_method 
ON public.mpesa_transactions(payment_method);

-- Create index for faster queries by status
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_status 
ON public.mpesa_transactions(status);

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_created_at 
ON public.mpesa_transactions(created_at DESC);

-- Add comment to table
COMMENT ON TABLE public.mpesa_transactions IS 
'Unified payment transactions table supporting M-Pesa, Bank transfers, and other payment methods';

-- Add comments to new columns
COMMENT ON COLUMN public.mpesa_transactions.payment_method IS 
'Payment method used: mpesa, bank, cash, or card';

COMMENT ON COLUMN public.mpesa_transactions.bank_name IS 
'Bank name for bank transfers (e.g., Equity Bank, KCB Bank)';

COMMENT ON COLUMN public.mpesa_transactions.reference_number IS 
'Bank transfer reference number or additional transaction reference';

COMMENT ON COLUMN public.mpesa_transactions.notes IS 
'Additional notes or comments about the transaction';
