import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProductWithColors, Product, ProductColor } from '../types/database.types';

export const useProducts = () => {
  const [products, setProducts] = useState<ProductWithColors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      if (productsData) {
        // Fetch colors for each product
        const productsWithColors = await Promise.all(
          productsData.map(async (product: Product) => {
            const { data: colors, error: colorsError } = await supabase
              .from('product_colors')
              .select('*')
              .eq('product_id', product.id)
              .eq('is_active', true)
              .order('color_name');

            if (colorsError) {
              console.error('Error fetching colors:', colorsError);
              return { ...product, colors: [] };
            }

            return { ...product, colors: colors as ProductColor[] };
          })
        );

        setProducts(productsWithColors);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Set up real-time subscription
    const subscription = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_colors' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};
