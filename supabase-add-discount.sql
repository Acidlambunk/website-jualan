-- Add discount field to customer_orders table
-- Run this in your Supabase SQL Editor

-- Add discount column (stores money value, not percentage)
ALTER TABLE customer_orders
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Add computed column for final amount (total_amount - discount)
ALTER TABLE customer_orders
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2)
GENERATED ALWAYS AS (COALESCE(total_amount, 0) - COALESCE(discount_amount, 0)) STORED;

-- Create index for discount
CREATE INDEX IF NOT EXISTS idx_orders_discount ON customer_orders(discount_amount);

-- Success message
SELECT 'Discount field added successfully!' as message;
