export interface Product {
  id: string;
  product_name: string;
  product_code: string | null;
  base_price: number | null;
  category: string | null;
  description: string | null;
  supplier_info: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProductColor {
  id: string;
  product_id: string;
  color_name: string;
  color_code: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_level: number;
  unit_price: number | null;
  supplier_color_code: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrder {
  id: string;
  customer_name: string;
  phone_number: string;
  order_number: string | null;
  packet_number: string | null;
  order_date: string;
  shipping_method: string | null;
  shipping_address: string | null;
  delivery_notes: string | null;
  delivery_date: string | null;
  preparation_status: string;
  sample_delivery_date: string | null;
  package_pickup_date: string | null;
  package_sent_date: string | null;
  package_received_date: string | null;
  last_pickup_date: string | null;
  is_confirmed: boolean;
  is_accepted: boolean;
  confirmation_status: string;
  delivery_status: string;
  total_amount: number | null;
  discount_amount: number | null;
  additional_fee: number | null;
  final_amount: number | null;
  shipping_cost: number | null;
  payment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_color_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_color_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  performed_by: string | null;
  performed_at: string;
  notes: string | null;
}

export interface DropdownOption {
  id: string;
  category: string;
  option_value: string;
  option_label: string;
  color_code: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NEGATIVE_STOCK';

export interface ProductWithColors extends Product {
  colors: ProductColor[];
}

export interface OrderWithItems extends CustomerOrder {
  order_items: (OrderItem & {
    product_color: ProductColor & {
      product: Product;
    };
  })[];
}
