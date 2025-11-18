import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { ProductWithColors, ProductColor } from '../../types/database.types';
import { useProducts } from '../../hooks/useProducts';
import LoadingSpinner from '../common/LoadingSpinner';

interface OrderItem {
  product_color_id: string;
  product_name: string;
  color_name: string;
  quantity: number;
  unit_price: number;
  available_stock: number;
}

const OrderInputForm: React.FC = () => {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [customShipping, setCustomShipping] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  // Order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithColors | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);

  const shippingOptions = [
    { value: 'SEVEL', label: 'SEVEL (7-Eleven)' },
    { value: 'FAMI', label: 'FAMI (FamilyMart)' },
    { value: 'POS', label: 'POS (郵局)' },
    { value: 'Custom', label: 'Custom Address' },
  ];

  const handleAddItem = () => {
    if (!selectedProduct || !selectedColor) {
      alert('Please select a product and color');
      return;
    }

    if (quantity > selectedColor.available_quantity) {
      alert(
        `Not enough stock. Available: ${selectedColor.available_quantity}`
      );
      return;
    }

    const price = selectedProduct.base_price || 0;

    const newItem: OrderItem = {
      product_color_id: selectedColor.id,
      product_name: selectedProduct.product_name,
      color_name: selectedColor.color_name,
      quantity,
      unit_price: price,
      available_stock: selectedColor.available_quantity,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct(null);
    setSelectedColor(null);
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const totalAmount = calculateTotal();
      const finalShippingMethod = shippingMethod === 'Custom' ? customShipping : shippingMethod;

      // Determine preparation status based on delivery notes
      const prepStatus = deliveryNotes && deliveryNotes.toLowerCase().includes('date')
        ? 'Pending-Date'
        : 'Pending';

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('customer_orders')
        .insert({
          customer_name: customerName,
          phone_number: phoneNumber,
          shipping_method: finalShippingMethod,
          shipping_address: shippingAddress || null,
          delivery_notes: deliveryNotes || null,
          delivery_date: deliveryDate || null,
          preparation_status: prepStatus,
          total_amount: totalAmount,
          created_by: user?.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      if (orderItems.length > 0 && orderData) {
        const items = orderItems.map((item) => ({
          order_id: orderData.id,
          product_color_id: item.product_color_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(items);

        if (itemsError) throw itemsError;

        // Reserve stock and log movements
        for (const item of orderItems) {
          const { data: colorData } = await supabase
            .from('product_colors')
            .select('reserved_quantity')
            .eq('id', item.product_color_id)
            .single();

          if (colorData) {
            await supabase
              .from('product_colors')
              .update({
                reserved_quantity: colorData.reserved_quantity + item.quantity,
              })
              .eq('id', item.product_color_id);

            await supabase.from('stock_movements').insert({
              product_color_id: item.product_color_id,
              movement_type: 'RESERVED',
              quantity: -item.quantity,
              reference_type: 'order',
              reference_id: orderData.id,
              reason: `Order ${orderData.id}`,
              performed_by: user?.id,
            });
          }
        }
      }

      setSuccess(true);
      // Reset form
      setCustomerName('');
      setPhoneNumber('');
      setShippingMethod('');
      setCustomShipping('');
      setShippingAddress('');
      setDeliveryNotes('');
      setDeliveryDate('');
      setOrderItems([]);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (productsLoading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Create New Order</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Order created successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </section>

          {/* Shipping Information */}
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Method *
                </label>
                <select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select shipping method...</option>
                  {shippingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {shippingMethod === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Shipping Name
                  </label>
                  <input
                    type="text"
                    value={customShipping}
                    onChange={(e) => setCustomShipping(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter custom shipping method"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Address
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Store code or full address (English or 中文)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter store code (e.g., "7-11-12345") or full address
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Notes
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Special instructions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Select delivery date (leave blank for ASAP)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank for ASAP delivery
                </p>
              </div>
            </div>
          </section>

          {/* Order Items */}
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>

            {/* Existing items */}
            {orderItems.length > 0 && (
              <div className="mb-4 space-y-2">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.product_name} - {item.color_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.quantity} × {new Intl.NumberFormat('zh-TW', {
                          style: 'currency',
                          currency: 'TWD',
                        }).format(item.unit_price)} = {' '}
                        {new Intl.NumberFormat('zh-TW', {
                          style: 'currency',
                          currency: 'TWD',
                        }).format(item.quantity * item.unit_price)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="text-right font-bold text-lg pt-2">
                  Total: {new Intl.NumberFormat('zh-TW', {
                    style: 'currency',
                    currency: 'TWD',
                  }).format(calculateTotal())}
                </div>
              </div>
            )}

            {/* Add new item */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Add Item</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Product
                  </label>
                  <select
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const product = products.find(
                        (p) => p.id === e.target.value
                      );
                      setSelectedProduct(product || null);
                      setSelectedColor(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Color
                  </label>
                  <select
                    value={selectedColor?.id || ''}
                    onChange={(e) => {
                      const color = selectedProduct?.colors.find(
                        (c) => c.id === e.target.value
                      );
                      setSelectedColor(color || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedProduct}
                  >
                    <option value="">Choose color...</option>
                    {selectedProduct?.colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.color_name} (Stock: {color.available_quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max={selectedColor?.available_quantity || 1}
                    disabled={!selectedColor}
                  />
                </div>
              </div>
              {selectedColor && (
                <div className="mt-2 text-sm text-gray-600">
                  Available: {selectedColor.available_quantity} | Price:{' '}
                  {new Intl.NumberFormat('zh-TW', {
                    style: 'currency',
                    currency: 'TWD',
                  }).format(selectedProduct?.base_price || 0)}
                </div>
              )}
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Item to Order
              </button>
            </div>
          </section>

          {/* Submit buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm('Are you sure you want to cancel? All data will be lost.')
                ) {
                  setCustomerName('');
                  setPhoneNumber('');
                  setShippingMethod('');
                  setCustomShipping('');
                  setShippingAddress('');
                  setDeliveryNotes('');
                  setDeliveryDate('');
                  setOrderItems([]);
                }
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !customerName || !phoneNumber || !shippingMethod || orderItems.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderInputForm;