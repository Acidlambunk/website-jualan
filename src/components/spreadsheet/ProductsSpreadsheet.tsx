import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useEdit } from '../../contexts/EditContext';
import { supabase } from '../../lib/supabase';
import type { ProductWithColors } from '../../types/database.types';
import ColorSwatch from '../common/ColorSwatch';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { getStockStatus, getTotalStock } from '../../utils/stockUtils';
import { getDateBasedColor } from '../../utils/dateColors';

const ProductsSpreadsheet: React.FC = () => {
  const { products, loading, error } = useProducts();
  const { setEditingProduct } = useEdit();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (product: ProductWithColors) => {
    const totalStock = getTotalStock(product.colors);

    // Check if product is in any orders
    const colorIds = product.colors.map(c => c.id);
    let orderCount = 0;

    if (colorIds.length > 0) {
      const { count } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .in('product_color_id', colorIds);

      orderCount = count || 0;
    }

    let confirmMessage = `Are you sure you want to delete "${product.product_name}"?\n\n`;

    if (totalStock > 0) {
      confirmMessage += `• This product has ${totalStock} units in stock and ${product.colors.length} color variants\n`;
    }

    if (orderCount > 0) {
      confirmMessage += `• WARNING: This product appears in ${orderCount} order item(s)\n`;
      confirmMessage += `• Deleting will remove it from those orders\n`;
    }

    confirmMessage += `• All stock movement history will be deleted\n\n`;
    confirmMessage += `This action cannot be undone!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Step 1: Delete all stock movements for this product's colors
      const colorIds = product.colors.map(c => c.id);
      if (colorIds.length > 0) {
        const { error: movementsError } = await supabase
          .from('stock_movements')
          .delete()
          .in('product_color_id', colorIds);

        if (movementsError) throw movementsError;

        // Step 2: Delete all order items that reference these product colors
        const { error: orderItemsError } = await supabase
          .from('order_items')
          .delete()
          .in('product_color_id', colorIds);

        if (orderItemsError) throw orderItemsError;
      }

      // Step 3: Delete product (colors will be cascade deleted)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      setDeleteSuccess(`Successfully deleted "${product.product_name}"`);
      setTimeout(() => setDeleteSuccess(''), 3000);
    } catch (err: any) {
      setDeleteError(`Failed to delete: ${err.message}`);
      setTimeout(() => setDeleteError(''), 3000);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.product_code?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedProducts = React.useMemo(() => {
    let sortableProducts = [...filteredProducts];
    if (sortConfig !== null) {
      sortableProducts.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [filteredProducts, sortConfig]);

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Success/Error Messages */}
      {deleteSuccess && (
        <div className="bg-green-100 border-b border-green-400 text-green-700 px-4 py-3">
          ✓ {deleteSuccess}
        </div>
      )}
      {deleteError && (
        <div className="bg-red-100 border-b border-red-400 text-red-700 px-4 py-3">
          ✗ {deleteError}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-sm text-gray-600">
            {sortedProducts.length} product(s)
          </div>
        </div>
        <button
          onClick={() => {
            /* Export to Excel */
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Export to Excel
        </button>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="sticky top-0 bg-excel-header border-b-2 border-excel-border flex">
            <div className="excel-header-cell w-12 text-center">#</div>
            <div
              className="excel-header-cell w-48 cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('product_name')}
            >
              Product Name
              {sortConfig?.key === 'product_name' && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
            <div
              className="excel-header-cell w-32 cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('product_code')}
            >
              Product Code
            </div>
            <div className="excel-header-cell w-32">Category</div>
            <div className="excel-header-cell w-48">Colors Available</div>
            <div className="excel-header-cell w-24 text-right">Total Stock</div>
            <div className="excel-header-cell w-24 text-right">Selling Price</div>
            <div className="excel-header-cell w-32">Status</div>
            <div className="excel-header-cell w-32 text-center">Actions</div>
          </div>

          {/* Data Rows */}
          {sortedProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No products found. Add your first product using the Input Form.
            </div>
          ) : (
            sortedProducts.map((product, index) => (
              <ProductRow
                key={product.id}
                product={product}
                index={index + 1}
                onEdit={setEditingProduct}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface ProductRowProps {
  product: ProductWithColors;
  index: number;
  onEdit: (product: ProductWithColors) => void;
  onDelete: (product: ProductWithColors) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, index, onEdit, onDelete }) => {
  const totalStock = getTotalStock(product.colors);
  const stockStatus = getStockStatus(product.colors);
  const rowColor = getDateBasedColor(product.created_at);

  return (
    <div className={`excel-row flex ${rowColor}`}>
      <div className="excel-cell w-12 text-center text-gray-500">{index}</div>
      <div className="excel-cell w-48 font-medium">{product.product_name}</div>
      <div className="excel-cell w-32 text-gray-600">
        {product.product_code || '-'}
      </div>
      <div className="excel-cell w-32">{product.category || '-'}</div>
      <div className="excel-cell w-48">
        <div className="flex gap-1 flex-wrap">
          {product.colors.length > 0 ? (
            product.colors.map((color) => (
              <ColorSwatch
                key={color.id}
                color={color.color_code || '#gray'}
                stock={color.available_quantity}
                name={color.color_name}
              />
            ))
          ) : (
            <span className="text-gray-400 text-xs">No colors</span>
          )}
        </div>
      </div>
      <div className="excel-cell w-24 text-right font-semibold">
        {totalStock}
      </div>
      <div className="excel-cell w-24 text-right">
        {product.base_price
          ? new Intl.NumberFormat('zh-TW', {
              style: 'currency',
              currency: 'TWD',
            }).format(product.base_price)
          : '-'}
      </div>
      <div className="excel-cell w-32">
        <StatusBadge status={stockStatus.status} type="stock" />
      </div>
      <div className="excel-cell w-32 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(product)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => onDelete(product)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsSpreadsheet;
