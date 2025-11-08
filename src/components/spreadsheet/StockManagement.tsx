import React from 'react';

const StockManagement: React.FC = () => {
  return (
    <div className="p-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Stock Management View
        </h3>
        <p className="text-blue-700">
          This view will show stock movements, low stock alerts, and stock
          history. Coming soon...
        </p>
      </div>
    </div>
  );
};

export default StockManagement;
