-- Migration: Add DELETE policies to all tables
-- Run this in your Supabase SQL editor to enable deletions

-- Add DELETE policy for products
CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add DELETE policy for product_colors
CREATE POLICY "Authenticated users can delete product colors" ON product_colors
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add DELETE policy for customer_orders
CREATE POLICY "Authenticated users can delete orders" ON customer_orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add DELETE policy for order_items
CREATE POLICY "Authenticated users can delete order items" ON order_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add DELETE policy for stock_movements
CREATE POLICY "Authenticated users can delete stock movements" ON stock_movements
  FOR DELETE USING (auth.role() = 'authenticated');

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND cmd = 'DELETE'
ORDER BY tablename, policyname;
