-- Add additional fee field to customer_orders table
-- Run this in your Supabase SQL Editor

-- Add additional_fee column
ALTER TABLE customer_orders
ADD COLUMN IF NOT EXISTS additional_fee DECIMAL(10, 2) DEFAULT 0;

-- Update the final_amount calculation to include additional fee
-- Drop the old generated column
ALTER TABLE customer_orders
DROP COLUMN IF EXISTS final_amount;

-- Recreate final_amount with additional fee included
ALTER TABLE customer_orders
ADD COLUMN final_amount DECIMAL(10, 2)
  GENERATED ALWAYS AS (
    GREATEST(0, COALESCE(total_amount, 0) - COALESCE(discount_amount, 0) + COALESCE(additional_fee, 0))
  ) STORED;

-- Success message
SELECT 'Additional fee field added successfully!' as message;
