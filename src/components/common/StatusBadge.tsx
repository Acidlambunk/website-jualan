import React from 'react';
import { getStatusColor, getStockStatusColor } from '../../utils/dateColors';
import type { StockStatus } from '../../types/database.types';

interface StatusBadgeProps {
  status: string | StockStatus;
  type?: 'order' | 'stock';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  const getColorClass = () => {
    if (type === 'stock') {
      return getStockStatusColor(status as StockStatus);
    }
    return getStatusColor(status);
  };

  const getLabel = () => {
    if (type === 'stock') {
      const labels: Record<StockStatus, string> = {
        IN_STOCK: 'In Stock',
        LOW_STOCK: 'Low Stock',
        OUT_OF_STOCK: 'Out of Stock',
      };
      return labels[status as StockStatus] || status;
    }
    return status;
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass()}`}
    >
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
