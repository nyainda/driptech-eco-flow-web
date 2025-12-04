import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';

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
      const data = await dataService.getProducts();

      // Filter and map to match expected interface
      return data
        .filter((p: any) => p.in_stock)
        .sort((a: any, b: any) => a.category.localeCompare(b.category))
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          images: p.images,
          description: p.description,
        })) as Product[];
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