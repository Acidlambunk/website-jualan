import React, { useState, useEffect } from 'react';
import { useEdit } from '../../contexts/EditContext';
import Header from './Header';
import TabNavigation from './TabNavigation';
import ProductsSpreadsheet from '../spreadsheet/ProductsSpreadsheet';
import OrdersSpreadsheet from '../spreadsheet/OrdersSpreadsheet';
import OrderTrackingSpreadsheet from '../spreadsheet/OrderTrackingSpreadsheet';
import ProductInputForm from '../forms/ProductInputForm';
import OrderInputForm from '../forms/OrderInputForm';
import OrderTrackingForm from '../forms/OrderTrackingForm';
import StatisticsView from '../statistics/StatisticsView';

const MainLayout: React.FC = () => {
  const { editingProduct, editingOrder, editingTrackingOrder } = useEdit();
  const [activeView, setActiveView] = useState<'products' | 'orders' | 'tracking' | 'statistics'>('products');
  const [activeMode, setActiveMode] = useState<'spreadsheet' | 'input'>('spreadsheet');

  // Automatically switch to input mode when editing
  useEffect(() => {
    if (editingProduct || editingOrder || editingTrackingOrder) {
      setActiveMode('input');
      if (editingProduct) setActiveView('products');
      if (editingOrder) setActiveView('orders');
      if (editingTrackingOrder) setActiveView('tracking');
    }
  }, [editingProduct, editingOrder, editingTrackingOrder]);

  const renderContent = () => {
    // Statistics view doesn't have spreadsheet/input modes
    if (activeView === 'statistics') {
      return <StatisticsView />;
    }

    if (activeMode === 'spreadsheet') {
      switch (activeView) {
        case 'products':
          return <ProductsSpreadsheet />;
        case 'orders':
          return <OrdersSpreadsheet />;
        case 'tracking':
          return <OrderTrackingSpreadsheet />;
        default:
          return <ProductsSpreadsheet />;
      }
    } else {
      switch (activeView) {
        case 'products':
          return <ProductInputForm />;
        case 'orders':
          return <OrderInputForm />;
        case 'tracking':
          return <OrderTrackingForm />;
        default:
          return <ProductInputForm />;
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <TabNavigation
        activeView={activeView}
        activeMode={activeMode}
        onViewChange={setActiveView}
        onModeChange={setActiveMode}
      />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainLayout;
