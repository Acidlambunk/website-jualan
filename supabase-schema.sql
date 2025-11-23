-- POS System Database Schema for Supabase
-- Run this script in your Supabase SQL editor to create all tables

-- =====================================================
-- 1. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_code TEXT UNIQUE,
  base_price DECIMAL(10,2),
  category TEXT,
  description TEXT,
  supplier_info JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- =====================================================
-- 2. PRODUCT COLOR VARIANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_code TEXT,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
  reorder_level INTEGER DEFAULT 5,
  unit_price DECIMAL(10,2),
  supplier_color_code TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, color_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_colors_available ON product_colors(available_quantity);

-- =====================================================
-- 3. CUSTOMER ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  order_number TEXT UNIQUE,
  packet_number TEXT,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  sample_delivery_date DATE,
  package_pickup_date DATE,
  confirmation_status TEXT DEFAULT 'Belum',
  delivery_status TEXT DEFAULT 'Belum',
  total_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON customer_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON customer_orders(phone_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON customer_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON customer_orders(order_date DESC);

-- =====================================================
-- 4. ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES customer_orders(id) ON DELETE CASCADE,
  product_color_id UUID REFERENCES product_colors(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  status TEXT DEFAULT 'Ordered',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_color_id ON order_items(product_color_id);

-- =====================================================
-- 5. STOCK MOVEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_color_id UUID REFERENCES product_colors(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED')),
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_color_id ON stock_movements(product_color_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_performed_at ON stock_movements(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- =====================================================
-- 6. DROPDOWN OPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS dropdown_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  option_value TEXT NOT NULL,
  option_label TEXT NOT NULL,
  color_code TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, option_value)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_dropdown_options_category ON dropdown_options(category);

-- =====================================================
-- 7. INSERT DEFAULT DROPDOWN OPTIONS
-- =====================================================
INSERT INTO dropdown_options (category, option_value, option_label, color_code, sort_order) VALUES
  -- Status options
  ('confirmation_status', 'Belum', 'Belum', '#fee2e2', 1),
  ('confirmation_status', 'Sudah', 'Sudah', '#dcfce7', 2),
  ('delivery_status', 'Belum', 'Belum', '#fee2e2', 1),
  ('delivery_status', 'Sudah', 'Sudah', '#dcfce7', 2),
  ('delivery_status', 'In Progress', 'In Progress', '#fef3c7', 3),
  ('payment_status', 'Pending', 'Pending', '#fee2e2', 1),
  ('payment_status', 'Paid', 'Paid', '#dcfce7', 2),
  ('payment_status', 'Partial', 'Partial', '#fef3c7', 3)
ON CONFLICT (category, option_value) DO NOTHING;

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CREATE RLS POLICIES
-- =====================================================

-- Products policies
CREATE POLICY "Users can view all products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Product colors policies
CREATE POLICY "Users can view all product colors" ON product_colors
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert product colors" ON product_colors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product colors" ON product_colors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product colors" ON product_colors
  FOR DELETE USING (auth.role() = 'authenticated');

-- Customer orders policies
CREATE POLICY "Users can view all orders" ON customer_orders
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert orders" ON customer_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON customer_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders" ON customer_orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Order items policies
CREATE POLICY "Users can view all order items" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert order items" ON order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update order items" ON order_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete order items" ON order_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Stock movements policies
CREATE POLICY "Users can view all stock movements" ON stock_movements
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert stock movements" ON stock_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete stock movements" ON stock_movements
  FOR DELETE USING (auth.role() = 'authenticated');

-- Dropdown options policies
CREATE POLICY "Users can view dropdown options" ON dropdown_options
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage dropdown options" ON dropdown_options
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 10. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_product_colors_updated_at BEFORE UPDATE ON product_colors
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customer_orders_updated_at BEFORE UPDATE ON customer_orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- 11. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Products with total stock
CREATE OR REPLACE VIEW products_with_stock AS
SELECT
  p.*,
  COALESCE(SUM(pc.stock_quantity), 0) as total_stock,
  COALESCE(SUM(pc.available_quantity), 0) as total_available,
  COUNT(pc.id) as color_count
FROM products p
LEFT JOIN product_colors pc ON p.id = pc.product_id AND pc.is_active = true
WHERE p.is_active = true
GROUP BY p.id;

-- View: Low stock alerts
CREATE OR REPLACE VIEW low_stock_alerts AS
SELECT
  p.product_name,
  pc.color_name,
  pc.available_quantity,
  pc.reorder_level,
  p.category
FROM product_colors pc
JOIN products p ON pc.product_id = p.id
WHERE pc.available_quantity <= pc.reorder_level
  AND pc.is_active = true
  AND p.is_active = true
ORDER BY pc.available_quantity ASC;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- Note: After running this script:
-- 1. Update your .env file with Supabase credentials
-- 2. Test the connection from your app
-- 3. Create your first user via the authentication flow
-- 4. Start adding products and orders!
