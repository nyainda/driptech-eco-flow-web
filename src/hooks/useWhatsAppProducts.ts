import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  category: string;
  price?: number;
}

export const useWhatsAppProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, category, price')
          .eq('in_stock', true)
          .order('category', { ascending: true });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const generateWhatsAppMessage = (whatsappNumber: string) => {
    if (products.length === 0) {
      return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        "Hi DripTech! I'm interested in your irrigation systems. Could you provide more information? Thank you!"
      )}`;
    }

    const productsByCategory = products.reduce((acc, product) => {
      const category = product.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    let message = "Hi DripTech! 🌿\n\n";
    message += "I'm interested in learning more about your irrigation products:\n\n";

    Object.entries(productsByCategory).forEach(([category, items]) => {
      const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      message += `*${categoryName}*\n`;
      items.forEach((product, index) => {
        message += `${index + 1}. ${product.name}`;
        if (product.price) {
          message += ` - KSh ${product.price.toLocaleString()}`;
        }
        message += `\n`;
      });
      message += `\n`;
    });

    message += "Could you please provide more details on pricing, availability, and installation services?\n\n";
    message += "Thank you! 💧";

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return {
    products,
    loading,
    error,
    generateWhatsAppMessage,
  };
};