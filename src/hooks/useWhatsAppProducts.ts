import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  category: string;
  price?: number;
  images?: string[];
  description?: string;
}

export const useWhatsAppProducts = () => {
  const { data: products = [], isLoading: loading, error } = useQuery({
    queryKey: ['whatsapp-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, price, images, description')
        .eq('in_stock', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: 1,
  });

  return {
    products,
    loading,
    error: error ? (error as Error).message : null,
  };
};