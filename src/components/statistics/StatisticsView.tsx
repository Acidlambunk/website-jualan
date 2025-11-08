import React, { useMemo } from 'react';
import { useOrders } from '../../hooks/useOrders';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProductSalesData {
  productName: string;
  colorName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCapitalCost: number;
  totalProfit: number;
}

const StatisticsView: React.FC = () => {
  const { orders, loading, error } = useOrders();

  const statistics = useMemo(() => {
    // Filter completed sales (confirmed AND accepted)
    const completedSales = orders.filter(
      (order) => order.is_confirmed && order.is_accepted
    );

    let totalRevenue = 0;
    let totalCapitalCost = 0;
    let totalShippingCost = 0;
    let totalProfit = 0;

    // Track sales by product color
    const productColorSales: Map<string, ProductSalesData> = new Map();

    completedSales.forEach((order) => {
      const revenue = order.final_amount || order.total_amount || 0;
      const shippingCost = order.shipping_cost || 0;

      totalRevenue += revenue;
      totalShippingCost += shippingCost;

      // Calculate capital cost and track product sales
      order.order_items.forEach((item) => {
        // Use the actual capital price from product_color, not the selling price from order item
        const actualCapitalPrice = item.product_color.unit_price || 0;
        const capitalCost = actualCapitalPrice * item.quantity;
        totalCapitalCost += capitalCost;

        const key = `${item.product_color.product.product_name}-${item.product_color.color_name}`;

        if (productColorSales.has(key)) {
          const existing = productColorSales.get(key)!;
          existing.totalQuantitySold += item.quantity;
          existing.totalRevenue += item.unit_price * item.quantity;
          existing.totalCapitalCost += capitalCost;
        } else {
          productColorSales.set(key, {
            productName: item.product_color.product.product_name,
            colorName: item.product_color.color_name,
            totalQuantitySold: item.quantity,
            totalRevenue: item.quantity * item.total_price,
            totalCapitalCost: capitalCost,
            totalProfit: 0, // Will calculate after
          });
        }
      });
    });

    // Calculate total profit
    totalProfit = totalRevenue - totalCapitalCost - totalShippingCost;

    // Calculate profit for each product color
    productColorSales.forEach((data) => {
      data.totalProfit = data.totalRevenue - data.totalCapitalCost;
    });

    // Sort by quantity sold (most sold first)
    const topProducts = Array.from(productColorSales.values()).sort(
      (a, b) => b.totalQuantitySold - a.totalQuantitySold
    );

    return {
      totalRevenue,
      totalCapitalCost,
      totalShippingCost,
      totalProfit,
      completedOrdersCount: completedSales.length,
      topProducts,
    };
  }, [orders]);

  if (loading) {
    return <LoadingSpinner message="Loading statistics..." />;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
    }).format(amount);
  };

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics & Sales</h1>
          <p className="text-gray-600 mt-2">
            Sales data from completed orders (Confirmed & Accepted)
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Profit */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-sm font-medium text-gray-600">Total Profit</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(statistics.totalProfit)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              From {statistics.completedOrdersCount} completed orders
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-sm font-medium text-gray-600">Total Revenue</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {formatCurrency(statistics.totalRevenue)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              After discounts
            </div>
          </div>

          {/* Total Capital Cost */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="text-sm font-medium text-gray-600">Capital Cost</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">
              {formatCurrency(statistics.totalCapitalCost)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Product costs
            </div>
          </div>

          {/* Total Shipping Cost */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="text-sm font-medium text-gray-600">Shipping Cost</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {formatCurrency(statistics.totalShippingCost)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Delivery expenses
            </div>
          </div>
        </div>

        {/* Profit Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profit Calculation</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Revenue (after discounts)</span>
              <span className="font-semibold text-green-600">
                + {formatCurrency(statistics.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Capital Cost</span>
              <span className="font-semibold text-red-600">
                - {formatCurrency(statistics.totalCapitalCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Shipping Cost</span>
              <span className="font-semibold text-red-600">
                - {formatCurrency(statistics.totalShippingCost)}
              </span>
            </div>
            <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Profit</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(statistics.totalProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Best Selling Products (by Color)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ranked by total quantity sold
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty Sold
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No completed sales yet. Sales will appear here when orders are
                      both Confirmed and Accepted in Order Tracking.
                    </td>
                  </tr>
                ) : (
                  statistics.topProducts.map((product, index) => (
                    <tr
                      key={`${product.productName}-${product.colorName}`}
                      className={index < 3 ? 'bg-yellow-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 && (
                            <span className="text-2xl mr-2">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {product.colorName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {product.totalQuantitySold}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
