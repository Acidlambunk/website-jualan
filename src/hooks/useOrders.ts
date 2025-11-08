import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { OrderWithItems } from '../types/database.types';

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('customer_orders')
        .select(`
          *,
          order_items (
            *,
            product_color:product_colors (
              *,
              product:products (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders((ordersData as any) || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_orders' },
        () => {
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { orders, loading, error, refetch: fetchOrders };
};
