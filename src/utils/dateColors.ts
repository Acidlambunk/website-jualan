import { differenceInDays } from 'date-fns';

/**
 * Returns background color class based on date
 * Today: Light green
 * Yesterday: Light yellow
 * Older: Progressive fade
 */
export const getDateBasedColor = (date: string): string => {
  const daysDiff = differenceInDays(new Date(), new Date(date));

  if (daysDiff === 0) {
    return 'bg-date-today'; // Light green
  } else if (daysDiff === 1) {
    return 'bg-date-yesterday'; // Light yellow
  } else if (daysDiff <= 7) {
    return 'bg-gray-50';
  } else {
    return 'bg-white';
  }
};

/**
 * Returns background color class based on status
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();

  if (statusLower === 'sudah' || statusLower === 'completed') {
    return 'bg-status-completed text-green-800'; // Green
  } else if (statusLower === 'belum' || statusLower === 'pending') {
    return 'bg-status-pending text-red-800'; // Red/pink
  } else if (statusLower === 'in progress') {
    return 'bg-status-progress text-yellow-800'; // Yellow/orange
  } else {
    return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Returns badge color for stock status
 */
export const getStockStatusColor = (status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'): string => {
  switch (status) {
    case 'IN_STOCK':
      return 'bg-green-100 text-green-800';
    case 'LOW_STOCK':
      return 'bg-orange-100 text-orange-800';
    case 'OUT_OF_STOCK':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
