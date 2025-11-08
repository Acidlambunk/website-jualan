-- Add shipping cost field to customer_orders table
-- Run this in your Supabase SQL Editor

-- Add shipping_cost column
ALTER TABLE customer_orders
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0;

-- Create index for shipping cost
CREATE INDEX IF NOT EXISTS idx_orders_shipping_cost ON customer_orders(shipping_cost);

-- Success message
SELECT 'Shipping cost field added successfully!' as message;
