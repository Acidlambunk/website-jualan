import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useEdit } from '../../contexts/EditContext';
import { useOrders } from '../../hooks/useOrders';
import type { OrderWithItems } from '../../types/database.types';
import LoadingSpinner from '../common/LoadingSpinner';
import { getDateBasedColor, getStatusColor } from '../../utils/dateColors';
import { format } from 'date-fns';

const getPreparationStatusColor = (status: string) => {
  switch (status) {
    case 'Prepared':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Sent':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Pending-Date':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Pending':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
};

const OrdersSpreadsheet: React.FC = () => {
  const { user } = useAuth();
  const { setEditingOrder } = useEdit();
  const { orders, loading, error, refetch } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredOrders = orders.filter(
    (order) =>
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone_number.includes(searchTerm) ||
      (order.shipping_method?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUpdatePrepStatus = async (orderId: string, newStatus: string, oldStatus: string) => {
    try {
      // If changing to "Sent", decrease actual stock quantity
      if (newStatus === 'Sent' && oldStatus !== 'Sent') {
        // Get the order items
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_color_id, quantity')
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        if (orderItems && orderItems.length > 0) {
          for (const item of orderItems) {
            // Get current stock and reserved quantity
            const { data: colorData, error: colorError } = await supabase
              .from('product_colors')
              .select('stock_quantity, reserved_quantity')
              .eq('id', item.product_color_id)
              .single();

            if (colorError) throw colorError;

            if (colorData) {
              // Decrease stock_quantity and reserved_quantity
              await supabase
                .from('product_colors')
                .update({
                  stock_quantity: Math.max(0, colorData.stock_quantity - item.quantity),
                  reserved_quantity: Math.max(0, colorData.reserved_quantity - item.quantity),
                })
                .eq('id', item.product_color_id);

              // Log stock movement as OUT
              await supabase.from('stock_movements').insert({
                product_color_id: item.product_color_id,
                movement_type: 'OUT',
                quantity: item.quantity,
                reference_type: 'order_sent',
                reference_id: orderId,
                reason: `Order sent: ${orderId}`,
                performed_by: user?.id,
              });
            }
          }
        }
      }

      // Update the preparation status
      const { error } = await supabase
        .from('customer_orders')
        .update({ preparation_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      refetch();
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (order: OrderWithItems) => {
    if (!confirm(`Are you sure you want to delete order for ${order.customer_name}? This will release all reserved stock.`)) {
      return;
    }

    setDeleting(order.id);

    try {
      // Step 1: Release reserved stock for each order item
      for (const item of order.order_items) {
        const productColorId = item.product_color_id;
        const quantity = item.quantity;

        // Get current reserved quantity
        const { data: colorData } = await supabase
          .from('product_colors')
          .select('reserved_quantity')
          .eq('id', productColorId)
          .single();

        if (colorData) {
          // Decrease reserved quantity
          await supabase
            .from('product_colors')
            .update({
              reserved_quantity: Math.max(0, colorData.reserved_quantity - quantity),
            })
            .eq('id', productColorId);

          // Log stock movement
          await supabase.from('stock_movements').insert({
            product_color_id: productColorId,
            movement_type: 'RELEASED',
            quantity: quantity,
            reference_type: 'order_cancelled',
            reference_id: order.id,
            reason: `Order cancelled: ${order.customer_name}`,
            performed_by: user?.id,
          });
        }
      }

      // Step 2: Delete stock movements related to this order
      await supabase
        .from('stock_movements')
        .delete()
        .eq('reference_type', 'order')
        .eq('reference_id', order.id);

      // Step 3: Delete order items
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id);

      // Step 4: Delete the order itself
      const { error: deleteError } = await supabase
        .from('customer_orders')
        .delete()
        .eq('id', order.id);

      if (deleteError) throw deleteError;

      alert('Order deleted successfully!');
      refetch();
    } catch (err: any) {
      alert(`Failed to delete order: ${err.message}`);
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading orders..." />;
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
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-sm text-gray-600">
            {filteredOrders.length} order(s)
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
            <div className="excel-header-cell w-40">Customer Name</div>
            <div className="excel-header-cell w-32">Phone</div>
            <div className="excel-header-cell w-32">Shipping Method</div>
            <div className="excel-header-cell w-48">Shipping Address</div>
            <div className="excel-header-cell w-48">Delivery Notes</div>
            <div className="excel-header-cell w-32">Order Date</div>
            <div className="excel-header-cell w-40">Prep Status</div>
            <div className="excel-header-cell w-32 text-right">Subtotal</div>
            <div className="excel-header-cell w-32 text-right">Discount</div>
            <div className="excel-header-cell w-32 text-right">Final Total</div>
            <div className="excel-header-cell w-32 text-center">Actions</div>
          </div>

          {/* Data Rows */}
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orders found. Create your first order using the Input Form.
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <OrderRow
                key={order.id}
                order={order}
                index={index + 1}
                onDelete={handleDeleteOrder}
                onUpdatePrepStatus={handleUpdatePrepStatus}
                onEdit={setEditingOrder}
                isDeleting={deleting === order.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface OrderRowProps {
  order: OrderWithItems;
  index: number;
  onDelete: (order: OrderWithItems) => void;
  onUpdatePrepStatus: (orderId: string, newStatus: string, oldStatus: string) => void;
  onEdit: (order: OrderWithItems) => void;
  isDeleting: boolean;
}

const OrderRow: React.FC<OrderRowProps> = ({
  order,
  index,
  onDelete,
  onUpdatePrepStatus,
  onEdit,
  isDeleting
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
    }).format(amount);
  };

  return (
    <div className="excel-row flex">
      <div className="excel-cell w-12 text-center text-gray-500">{index}</div>
      <div className="excel-cell w-40 font-medium">{order.customer_name}</div>
      <div className="excel-cell w-32">{order.phone_number}</div>
      <div className="excel-cell w-32">{order.shipping_method || '-'}</div>
      <div className="excel-cell w-48 text-sm">{order.shipping_address || '-'}</div>
      <div className="excel-cell w-48 text-sm text-gray-600">{order.delivery_notes || '-'}</div>
      <div className="excel-cell w-32">{formatDate(order.order_date)}</div>
      <div className="excel-cell w-40">
        <select
          value={order.preparation_status}
          onChange={(e) => onUpdatePrepStatus(order.id, e.target.value, order.preparation_status)}
          className={`w-full px-2 py-1 rounded text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPreparationStatusColor(
            order.preparation_status
          )}`}
        >
          <option value="Pending">Pending</option>
          <option value="Pending-Date">Pending-Date</option>
          <option value="Prepared">Prepared</option>
          <option value="Sent">Sent</option>
        </select>
      </div>
      <div className="excel-cell w-32 text-right">
        {formatCurrency(order.total_amount)}
      </div>
      <div className="excel-cell w-32 text-right text-red-600">
        {order.discount_amount && order.discount_amount > 0
          ? `-${formatCurrency(order.discount_amount)}`
          : '-'}
      </div>
      <div className="excel-cell w-32 text-right font-semibold">
        {formatCurrency(order.final_amount || order.total_amount)}
      </div>
      <div className="excel-cell w-32 text-center space-x-2">
        <button
          onClick={() => onEdit(order)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(order)}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default OrdersSpreadsheet;
