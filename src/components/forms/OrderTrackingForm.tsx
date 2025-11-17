import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrders } from '../../hooks/useOrders';
import { useEdit } from '../../contexts/EditContext';
import LoadingSpinner from '../common/LoadingSpinner';

const OrderTrackingForm: React.FC = () => {
  const { orders, loading: ordersLoading } = useOrders();
  const { editingTrackingOrder, setEditingTrackingOrder } = useEdit();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Tracking fields
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [packageNumber, setPackageNumber] = useState('');
  const [packageSentDate, setPackageSentDate] = useState('');
  const [packageReceivedDate, setPackageReceivedDate] = useState('');
  const [lastPickupDate, setLastPickupDate] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  // Load editing order when set from spreadsheet
  useEffect(() => {
    if (editingTrackingOrder) {
      handleOrderSelect(editingTrackingOrder.id);
    }
  }, [editingTrackingOrder]);

  // Load selected order data
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setPackageNumber(order.packet_number || '');
      setPackageSentDate(order.package_sent_date ? order.package_sent_date.split('T')[0] : '');
      setPackageReceivedDate(order.package_received_date ? order.package_received_date.split('T')[0] : '');
      setLastPickupDate(order.last_pickup_date || '');

      // Auto-set shipping cost to 38 for sevel/fami, manual for post
      const shippingMethod = order.shipping_method?.toLowerCase();
      if (shippingMethod === 'sevel' || shippingMethod === 'fami') {
        setShippingCost(38);
      } else {
        setShippingCost(order.shipping_cost || 0);
      }

      setIsConfirmed(order.is_confirmed);
      setIsAccepted(order.is_accepted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (!selectedOrderId) {
        throw new Error('Please select an order');
      }

      // Update order tracking information
      const { error: updateError } = await supabase
        .from('customer_orders')
        .update({
          packet_number: packageNumber || null,
          package_sent_date: packageSentDate || null,
          package_received_date: packageReceivedDate || null,
          last_pickup_date: lastPickupDate || null,
          shipping_cost: shippingCost,
          is_confirmed: isConfirmed,
          is_accepted: isAccepted,
        })
        .eq('id', selectedOrderId);

      if (updateError) throw updateError;

      setSuccess(true);
      setEditingTrackingOrder(null); // Clear editing state
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating tracking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedOrderId('');
    setPackageNumber('');
    setPackageSentDate('');
    setPackageReceivedDate('');
    setLastPickupDate('');
    setIsConfirmed(false);
    setIsAccepted(false);
    setEditingTrackingOrder(null); // Clear editing state
  };

  if (ordersLoading) {
    return <LoadingSpinner message="Loading orders..." />;
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Order Tracking</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Tracking information updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Order */}
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Select Order</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order *
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an order...</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.customer_name} - {order.phone_number} (
                    {new Date(order.order_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {selectedOrder && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-2">Order Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Customer:</span>{' '}
                    <span className="font-medium">{selectedOrder.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>{' '}
                    <span className="font-medium">{selectedOrder.phone_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Shipping:</span>{' '}
                    <span className="font-medium">{selectedOrder.shipping_method || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Address:</span>{' '}
                    <span className="font-medium">{selectedOrder.shipping_address || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Total:</span>{' '}
                    <span className="font-medium">
                      {new Intl.NumberFormat('zh-TW', {
                        style: 'currency',
                        currency: 'TWD',
                      }).format(selectedOrder.total_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Tracking Information */}
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Tracking Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Number
                </label>
                <input
                  type="text"
                  value={packageNumber}
                  onChange={(e) => setPackageNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter package tracking number"
                  disabled={!selectedOrderId}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Sent Date
                  </label>
                  <input
                    type="date"
                    value={packageSentDate}
                    onChange={(e) => setPackageSentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedOrderId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Arrival Date
                  </label>
                  <input
                    type="date"
                    value={packageReceivedDate}
                    onChange={(e) => setPackageReceivedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedOrderId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Pickup Date
                  </label>
                  <input
                    type="date"
                    value={lastPickupDate}
                    onChange={(e) => setLastPickupDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedOrderId}
                  />
                </div>
              </div>

              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Cost (TWD)
                </label>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  min="0"
                  step="1"
                  placeholder="0"
                  disabled={
                    !selectedOrderId ||
                    selectedOrder?.shipping_method?.toLowerCase() === 'sevel' ||
                    selectedOrder?.shipping_method?.toLowerCase() === 'fami'
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedOrder?.shipping_method?.toLowerCase() === 'sevel' ||
                  selectedOrder?.shipping_method?.toLowerCase() === 'fami'
                    ? 'Auto-set to 38 for Sevel/Fami shipping'
                    : 'Actual shipping cost paid'}
                </p>
              </div>
            </div>
          </section>

          {/* Status Checkboxes */}
          <section className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedOrderId}
                />
                <span className="text-sm font-medium text-gray-700">
                  Order Confirmed
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAccepted}
                  onChange={(e) => setIsAccepted(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedOrderId}
                />
                <span className="text-sm font-medium text-gray-700">
                  Order Accepted by Customer
                </span>
              </label>
            </div>
          </section>

          {/* Submit buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !selectedOrderId}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderTrackingForm;
