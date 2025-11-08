import React, { createContext, useContext, useState } from 'react';
import type { ProductWithColors, OrderWithItems } from '../types/database.types';

interface EditContextType {
  editingProduct: ProductWithColors | null;
  editingOrder: OrderWithItems | null;
  setEditingProduct: (product: ProductWithColors | null) => void;
  setEditingOrder: (order: OrderWithItems | null) => void;
  clearEditing: () => void;
}

const EditContext = createContext<EditContextType | undefined>(undefined);

export const EditProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [editingProduct, setEditingProduct] = useState<ProductWithColors | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderWithItems | null>(null);

  const clearEditing = () => {
    setEditingProduct(null);
    setEditingOrder(null);
  };

  return (
    <EditContext.Provider
      value={{
        editingProduct,
        editingOrder,
        setEditingProduct,
        setEditingOrder,
        clearEditing,
      }}
    >
      {children}
    </EditContext.Provider>
  );
};

export const useEdit = () => {
  const context = useContext(EditContext);
  if (context === undefined) {
    throw new Error('useEdit must be used within an EditProvider');
  }
  return context;
};
