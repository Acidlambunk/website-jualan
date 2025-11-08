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

const MainLayout: React.FC = () => {
  const { editingProduct, editingOrder } = useEdit();
  const [activeView, setActiveView] = useState<'products' | 'orders' | 'tracking'>('products');
  const [activeMode, setActiveMode] = useState<'spreadsheet' | 'input'>('spreadsheet');

  // Automatically switch to input mode when editing
  useEffect(() => {
    if (editingProduct || editingOrder) {
      setActiveMode('input');
      if (editingProduct) setActiveView('products');
      if (editingOrder) setActiveView('orders');
    }
  }, [editingProduct, editingOrder]);

  const renderContent = () => {
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
