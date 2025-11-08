import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrders } from '../../hooks/useOrders';
import type { OrderWithItems } from '../../types/database.types';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

const OrderTrackingSpreadsheet: React.FC = () => {
  const { orders, loading, error, refetch } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(
    (order) =>
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone_number.includes(searchTerm) ||
      (order.packet_number?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleToggleConfirmed = async (orderId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ is_confirmed: !currentValue })
        .eq('id', orderId);

      if (error) throw error;
      refetch();
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`);
    }
  };

  const handleToggleAccepted = async (orderId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ is_accepted: !currentValue })
        .eq('id', orderId);

      if (error) throw error;
      refetch();
    } catch (err: any) {
      alert(`Failed to update: ${err.message}`);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading tracking data..." />;
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
            placeholder="Search tracking..."
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
            <div className="excel-header-cell w-32">Package Number</div>
            <div className="excel-header-cell w-32">Sent Date</div>
            <div className="excel-header-cell w-32">Arrival Date</div>
            <div className="excel-header-cell w-32">Last Pickup</div>
            <div className="excel-header-cell w-24 text-center">Confirmed</div>
            <div className="excel-header-cell w-24 text-center">Accepted</div>
            <div className="excel-header-cell w-32">Shipping Method</div>
            <div className="excel-header-cell w-48">Address</div>
          </div>

          {/* Data Rows */}
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No orders found for tracking.
            </div>
          ) : (
            filteredOrders.map((order, index) => (
              <TrackingRow
                key={order.id}
                order={order}
                index={index + 1}
                onToggleConfirmed={handleToggleConfirmed}
                onToggleAccepted={handleToggleAccepted}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface TrackingRowProps {
  order: OrderWithItems;
  index: number;
  onToggleConfirmed: (orderId: string, currentValue: boolean) => void;
  onToggleAccepted: (orderId: string, currentValue: boolean) => void;
}

const TrackingRow: React.FC<TrackingRowProps> = ({
  order,
  index,
  onToggleConfirmed,
  onToggleAccepted
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <div className="excel-row flex">
      <div className="excel-cell w-12 text-center text-gray-500">{index}</div>
      <div className="excel-cell w-40 font-medium">{order.customer_name}</div>
      <div className="excel-cell w-32">{order.phone_number}</div>
      <div className="excel-cell w-32 font-mono text-sm">
        {order.packet_number || '-'}
      </div>
      <div className="excel-cell w-32">{formatDate(order.package_sent_date)}</div>
      <div className="excel-cell w-32">{formatDate(order.package_received_date)}</div>
      <div className="excel-cell w-32">{formatDate(order.last_pickup_date)}</div>
      <div className="excel-cell w-24 flex justify-center items-center">
        <input
          type="checkbox"
          checked={order.is_confirmed}
          onChange={() => onToggleConfirmed(order.id, order.is_confirmed)}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          title="Order Confirmed"
        />
      </div>
      <div className="excel-cell w-24 flex justify-center items-center">
        <input
          type="checkbox"
          checked={order.is_accepted}
          onChange={() => onToggleAccepted(order.id, order.is_accepted)}
          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
          title="Order Accepted by Customer"
        />
      </div>
      <div className="excel-cell w-32">{order.shipping_method || '-'}</div>
      <div className="excel-cell w-48 text-sm">{order.shipping_address || '-'}</div>
    </div>
  );
};

export default OrderTrackingSpreadsheet;
