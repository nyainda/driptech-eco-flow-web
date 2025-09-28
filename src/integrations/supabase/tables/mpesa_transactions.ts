
import { Json } from '../shared';

export type MpesaTransactions = {
  Row: {
    amount: number;
    created_at: string;
    id: string;
    phone_number: string;
    status: string;
    transaction_id: string;
    updated_at: string;
  };
  Insert: {
    amount: number;
    created_at?: string;
    id?: string;
    phone_number: string;
    status?: string;
    transaction_id: string;
    updated_at?: string;
  };
  Update: {
    amount?: number;
    created_at?: string;
    id?: string;
    phone_number?: string;
    status?: string;
    transaction_id?: string;
    updated_at?: string;
  };
  Relationships: [];
};