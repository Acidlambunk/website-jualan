-- Migration: Add missing columns to customer_orders table
-- Run this in your Supabase SQL Editor

-- Add missing columns to customer_orders
ALTER TABLE customer_orders
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS preparation_status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_fee DECIMAL(10,2) DEFAULT 0;

-- Add index for delivery_date for faster sorting
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON customer_orders(delivery_date);

-- Add index for preparation_status
CREATE INDEX IF NOT EXISTS idx_orders_preparation_status ON customer_orders(preparation_status);

-- Comment: These columns are used by the order management system
COMMENT ON COLUMN customer_orders.shipping_method IS 'Shipping method (SEVEL, FAMI, POS, or custom)';
COMMENT ON COLUMN customer_orders.shipping_address IS 'Store code or full shipping address';
COMMENT ON COLUMN customer_orders.delivery_notes IS 'Special delivery instructions';
COMMENT ON COLUMN customer_orders.delivery_date IS 'Requested delivery date (NULL = ASAP)';
COMMENT ON COLUMN customer_orders.preparation_status IS 'Order preparation status (Pending, Pending-Date, Ready, etc.)';
COMMENT ON COLUMN customer_orders.discount_amount IS 'Discount applied to order';
COMMENT ON COLUMN customer_orders.additional_fee IS 'Additional fees (packaging, handling, etc.)';
