-- Update customer_orders table for new structure
-- Run this in your Supabase SQL Editor

-- Add new columns to customer_orders
ALTER TABLE customer_orders
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS preparation_status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS package_sent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS package_received_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_pickup_date DATE,
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;

-- Update existing columns (make some optional)
ALTER TABLE customer_orders
ALTER COLUMN order_number DROP NOT NULL,
ALTER COLUMN packet_number DROP NOT NULL;

-- Create index for shipping method
CREATE INDEX IF NOT EXISTS idx_orders_shipping_method ON customer_orders(shipping_method);
CREATE INDEX IF NOT EXISTS idx_orders_preparation_status ON customer_orders(preparation_status);
CREATE INDEX IF NOT EXISTS idx_orders_package_sent_date ON customer_orders(package_sent_date DESC);

-- Add check constraint for shipping method
ALTER TABLE customer_orders
DROP CONSTRAINT IF EXISTS check_shipping_method;

ALTER TABLE customer_orders
ADD CONSTRAINT check_shipping_method
CHECK (shipping_method IN ('SEVEL', 'FAMI', 'POS', 'Custom', NULL));

-- Add check constraint for preparation status
ALTER TABLE customer_orders
DROP CONSTRAINT IF EXISTS check_preparation_status;

ALTER TABLE customer_orders
ADD CONSTRAINT check_preparation_status
CHECK (preparation_status IN ('Pending', 'Prepared', 'Sent', 'Pending-Date'));

-- Insert default shipping options into dropdown_options
INSERT INTO dropdown_options (category, option_value, option_label, color_code, sort_order) VALUES
  ('shipping_method', 'SEVEL', 'SEVEL (7-Eleven)', '#4ade80', 1),
  ('shipping_method', 'FAMI', 'FAMI (FamilyMart)', '#60a5fa', 2),
  ('shipping_method', 'POS', 'POS (郵局)', '#f87171', 3),
  ('shipping_method', 'Custom', 'Custom Address', '#a78bfa', 4),
  ('preparation_status', 'Pending', 'Pending', '#fef3c7', 1),
  ('preparation_status', 'Prepared', 'Prepared', '#d1fae5', 2),
  ('preparation_status', 'Sent', 'Sent', '#bfdbfe', 3),
  ('preparation_status', 'Pending-Date', 'Pending (Specific Date)', '#fed7aa', 4)
ON CONFLICT (category, option_value) DO NOTHING;

-- Success message
SELECT 'Database updated successfully! Customer orders table now has shipping and tracking fields.' as message;
