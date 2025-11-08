import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useEdit } from '../../contexts/EditContext';
import { predefinedColors } from '../../utils/colors';
import type { PredefinedColor } from '../../utils/colors';
import ColorSwatch from '../common/ColorSwatch';

interface ColorVariant {
  id?: string;
  color_name: string;
  color_code: string;
  stock_quantity: number;
  unit_price: number;
  reorder_level: number;
  notes: string;
}

const ProductInputForm: React.FC = () => {
  const { user } = useAuth();
  const { editingProduct, clearEditing } = useEdit();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [productId, setProductId] = useState<string | null>(null);

  // Product fields
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [category, setCategory] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');

  // Color variants
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [newColor, setNewColor] = useState<ColorVariant>({
    color_name: '',
    color_code: '#000000',
    stock_quantity: 0,
    unit_price: 0,
    reorder_level: 5,
    notes: '',
  });

  const [selectedPredefinedColor, setSelectedPredefinedColor] = useState<PredefinedColor | null>(null);

  const handleAddColor = () => {
    if (!newColor.color_name) {
      alert('Please select a color');
      return;
    }

    // Check for duplicate color names
    const isDuplicate = colorVariants.some(
      (variant) => variant.color_name.toLowerCase() === newColor.color_name.toLowerCase()
    );

    if (isDuplicate) {
      alert(`Color "${newColor.color_name}" already exists for this product. Please choose a different color.`);
      return;
    }

    setColorVariants([...colorVariants, newColor]);
    setNewColor({
      color_name: '',
      color_code: '#000000',
      stock_quantity: 0,
      unit_price: 0,
      reorder_level: 5,
      notes: '',
    });
    setSelectedPredefinedColor(null);
  };

  const handleRemoveColor = (index: number) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index));
  };

  const handleStockAdjustment = async (index: number, amount: number) => {
    const color = colorVariants[index];
    if (!color.id) return;

    const newStock = color.stock_quantity + amount;
    if (newStock < 0) {
      alert('Stock cannot be negative');
      return;
    }

    try {
      // Update stock in database
      const { error: updateError } = await supabase
        .from('product_colors')
        .update({ stock_quantity: newStock })
        .eq('id', color.id);

      if (updateError) throw updateError;

      // Log stock movement
      await supabase.from('stock_movements').insert({
        product_color_id: color.id,
        movement_type: amount > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(amount),
        reason: amount > 0 ? 'Restock' : 'Manual adjustment',
        performed_by: user?.id,
      });

      // Update local state
      const updatedVariants = [...colorVariants];
      updatedVariants[index] = { ...color, stock_quantity: newStock };
      setColorVariants(updatedVariants);

      // Show success message briefly
      const originalSuccess = success;
      setSuccess(true);
      setTimeout(() => setSuccess(originalSuccess), 1000);
    } catch (err: any) {
      setError(`Failed to adjust stock: ${err.message}`);
    }
  };

  const handlePredefinedColorSelect = (color: PredefinedColor) => {
    setSelectedPredefinedColor(color);
    setNewColor({
      ...newColor,
      color_name: color.name,
      color_code: color.hex,
    });
  };

  // Load editing product data
  useEffect(() => {
    if (editingProduct) {
      setProductId(editingProduct.id);
      setProductName(editingProduct.product_name);
      setProductCode(editingProduct.product_code || '');
      setCategory(editingProduct.category || '');
      setBasePrice(editingProduct.base_price?.toString() || '');
      setDescription(editingProduct.description || '');

      // Load existing colors
      setColorVariants(
        editingProduct.colors.map((color) => ({
          id: color.id,
          color_name: color.color_name,
          color_code: color.color_code || '#000000',
          stock_quantity: color.stock_quantity,
          unit_price: color.unit_price || 0,
          reorder_level: color.reorder_level,
          notes: color.notes || '',
        }))
      );
    }
  }, [editingProduct]);

  const resetForm = () => {
    setProductId(null);
    setProductName('');
    setProductCode('');
    setCategory('');
    setBasePrice('');
    setDescription('');
    setColorVariants([]);
    clearEditing();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      let productData;

      if (productId) {
        // Update existing product
        const { data, error: productError } = await supabase
          .from('products')
          .update({
            product_name: productName,
            product_code: productCode || null,
            category: category || null,
            base_price: basePrice ? parseFloat(basePrice) : null,
            description: description || null,
          })
          .eq('id', productId)
          .select()
          .single();

        if (productError) throw productError;
        productData = data;
      } else {
        // Insert new product
        const { data, error: productError } = await supabase
          .from('products')
          .insert({
            product_name: productName,
            product_code: productCode || null,
            category: category || null,
            base_price: basePrice ? parseFloat(basePrice) : null,
            description: description || null,
            created_by: user?.id,
          })
          .select()
          .single();

        if (productError) throw productError;
        productData = data;
      }

      // Handle color variants
      if (colorVariants.length > 0 && productData) {
        // Separate new colors (without ID) from existing colors (with ID)
        const newColors = colorVariants.filter((color) => !color.id);
        const existingColors = colorVariants.filter((color) => color.id);

        // Insert new colors only
        if (newColors.length > 0) {
          const colorData = newColors.map((color) => ({
            product_id: productData.id,
            color_name: color.color_name,
            color_code: color.color_code,
            stock_quantity: color.stock_quantity,
            unit_price: color.unit_price || null,
            reorder_level: color.reorder_level,
            notes: color.notes || null,
          }));

          const { error: colorsError } = await supabase
            .from('product_colors')
            .insert(colorData);

          if (colorsError) throw colorsError;

          // Log stock movements for initial stock (new colors only)
          const { data: insertedColors } = await supabase
            .from('product_colors')
            .select('id, color_name')
            .eq('product_id', productData.id)
            .in('color_name', newColors.map((c) => c.color_name));

          if (insertedColors) {
            const movements = newColors
              .filter((color) => color.stock_quantity > 0)
              .map((color) => {
                const matchingColor = insertedColors.find(
                  (c) => c.color_name === color.color_name
                );
                return {
                  product_color_id: matchingColor?.id,
                  movement_type: 'IN',
                  quantity: color.stock_quantity,
                  reason: 'Initial stock',
                  performed_by: user?.id,
                };
              });

            if (movements.length > 0) {
              await supabase.from('stock_movements').insert(movements);
            }
          }
        }

        // Update existing colors
        for (const color of existingColors) {
          if (color.id) {
            const { error: updateError } = await supabase
              .from('product_colors')
              .update({
                color_code: color.color_code,
                unit_price: color.unit_price || null,
                reorder_level: color.reorder_level,
                notes: color.notes || null,
                // Don't update stock_quantity here - use stock adjustment buttons instead
              })
              .eq('id', color.id);

            if (updateError) throw updateError;
          }
        }
      }

      setSuccess(true);
      resetForm();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      // Handle specific database errors with user-friendly messages
      if (err.message.includes('product_colors_product_id_color_name_key')) {
        setError('Duplicate color name detected. Each product can only have one variant of each color. Please check your color variants.');
      } else if (err.message.includes('duplicate key')) {
        setError('This item already exists in the database. Please check for duplicates.');
      } else {
        setError(err.message);
      }
      console.error('Error creating product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {productId ? 'Edit Product' : 'Add New Product'}
          </h2>
          {productId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to Create Mode
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Product created successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Information */}
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Product Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Code
                </label>
                <input
                  type="text"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tas, Sepatu, Pakaian"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (TWD)
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="10"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* Color Variants & Stock */}
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">
              Color Variants & Stock
            </h3>

            {/* Existing colors */}
            {colorVariants.length > 0 && (
              <div className="mb-4 space-y-2">
                {colorVariants.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-md"
                  >
                    <ColorSwatch
                      color={color.color_code}
                      size="lg"
                      showTooltip={false}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{color.color_name}</div>
                      <div className="text-sm text-gray-600">
                        Stock: {color.stock_quantity} | Price:{' '}
                        {color.unit_price > 0
                          ? new Intl.NumberFormat('zh-TW', {
                              style: 'currency',
                              currency: 'TWD',
                            }).format(color.unit_price)
                          : 'Use base price'}
                      </div>
                    </div>

                    {/* Stock adjustment controls (only show in edit mode) */}
                    {productId && color.id && (
                      <div className="flex items-center gap-2 border-l pl-4">
                        <span className="text-sm text-gray-600">Add Stock:</span>
                        <button
                          type="button"
                          onClick={() => handleStockAdjustment(index, 1)}
                          className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockAdjustment(index, 5)}
                          className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockAdjustment(index, 10)}
                          className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const amount = prompt('Enter stock to add:');
                            if (amount && !isNaN(parseInt(amount))) {
                              handleStockAdjustment(index, parseInt(amount));
                            }
                          }}
                          className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium"
                        >
                          Custom
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveColor(index)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new color */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Add New Color</h4>

              {/* Predefined colors selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Color
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handlePredefinedColorSelect(color)}
                      className={`p-2 border-2 rounded-md hover:border-blue-500 transition-colors ${
                        selectedPredefinedColor?.name === color.name
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                      title={color.name}
                    >
                      <ColorSwatch
                        color={color.hex}
                        name={color.name}
                        size="lg"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Color
                  </label>
                  <input
                    type="text"
                    value={newColor.color_name}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    placeholder="Select a color above"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newColor.stock_quantity}
                    onChange={(e) =>
                      setNewColor({
                        ...newColor,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Override
                  </label>
                  <input
                    type="number"
                    value={newColor.unit_price}
                    onChange={(e) =>
                      setNewColor({
                        ...newColor,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1000"
                    placeholder="Leave 0 for base price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    value={newColor.reorder_level}
                    onChange={(e) =>
                      setNewColor({
                        ...newColor,
                        reorder_level: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddColor}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Color to Product
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
                  resetForm();
                }
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !productName}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (productId ? 'Updating...' : 'Saving...') : (productId ? 'Update Product' : 'Save Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductInputForm;
