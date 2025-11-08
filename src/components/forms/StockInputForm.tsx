import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import ColorSwatch from '../common/ColorSwatch';
import LoadingSpinner from '../common/LoadingSpinner';

const StockInputForm: React.FC = () => {
  const { user } = useAuth();
  const { products, loading } = useProducts();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStockAdjustment = async (
    colorId: string,
    currentStock: number,
    amount: number,
    colorName: string
  ) => {
    const newStock = currentStock + amount;
    if (newStock < 0) {
      alert('Stock cannot be negative');
      return;
    }

    try {
      // Update stock
      const { error: updateError } = await supabase
        .from('product_colors')
        .update({ stock_quantity: newStock })
        .eq('id', colorId);

      if (updateError) throw updateError;

      // Log movement
      await supabase.from('stock_movements').insert({
        product_color_id: colorId,
        movement_type: amount > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(amount),
        reason: amount > 0 ? 'Restock' : 'Adjustment',
        performed_by: user?.id,
      });

      setSuccess(`✓ ${colorName}: ${amount > 0 ? '+' : ''}${amount} stock updated`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(`Failed: ${err.message}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCustomAdjustment = async (
    colorId: string,
    currentStock: number,
    colorName: string
  ) => {
    const amount = prompt(`Add stock for ${colorName}:\n(Use negative number to reduce)`);
    if (amount && !isNaN(parseInt(amount))) {
      await handleStockAdjustment(colorId, currentStock, parseInt(amount), colorName);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Stock Management</h2>
          <p className="text-gray-600">
            Adjust stock levels for your products. All changes are logged automatically.
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Products List */}
        <div className="space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{product.product_name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.category || 'No category'} • {product.product_code || 'No code'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total Stock</div>
                    <div className="text-2xl font-bold">
                      {product.colors.reduce((sum, c) => sum + c.stock_quantity, 0)}
                    </div>
                  </div>
                </div>

                {/* Color Variants */}
                <div className="space-y-2">
                  {product.colors.length === 0 ? (
                    <div className="text-sm text-gray-400 italic">No color variants</div>
                  ) : (
                    product.colors.map((color) => (
                      <div
                        key={color.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-md"
                      >
                        <ColorSwatch
                          color={color.color_code || '#000'}
                          size="md"
                          showTooltip={false}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{color.color_name}</div>
                          <div className="text-sm text-gray-600">
                            Available: {color.available_quantity} | Reserved: {color.reserved_quantity}
                          </div>
                        </div>

                        <div className="text-center min-w-[80px]">
                          <div className="text-xs text-gray-500">Current Stock</div>
                          <div className="text-xl font-bold">{color.stock_quantity}</div>
                        </div>

                        {/* Quick adjustment buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleStockAdjustment(color.id, color.stock_quantity, 1, color.color_name)
                            }
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium"
                          >
                            +1
                          </button>
                          <button
                            onClick={() =>
                              handleStockAdjustment(color.id, color.stock_quantity, 5, color.color_name)
                            }
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium"
                          >
                            +5
                          </button>
                          <button
                            onClick={() =>
                              handleStockAdjustment(color.id, color.stock_quantity, 10, color.color_name)
                            }
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium"
                          >
                            +10
                          </button>
                          <button
                            onClick={() =>
                              handleStockAdjustment(color.id, color.stock_quantity, -1, color.color_name)
                            }
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium"
                          >
                            -1
                          </button>
                          <button
                            onClick={() =>
                              handleCustomAdjustment(color.id, color.stock_quantity, color.color_name)
                            }
                            className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium"
                          >
                            Custom
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StockInputForm;
