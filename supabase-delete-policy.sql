-- Add DELETE policies for all tables
-- Run this in your Supabase SQL Editor

-- Allow authenticated users to delete products
CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete product colors
CREATE POLICY "Authenticated users can delete product colors" ON product_colors
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete stock movements (REQUIRED!)
CREATE POLICY "Authenticated users can delete stock movements" ON stock_movements
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete orders
CREATE POLICY "Authenticated users can delete orders" ON customer_orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete order items
CREATE POLICY "Authenticated users can delete order items" ON order_items
  FOR DELETE USING (auth.role() = 'authenticated');
