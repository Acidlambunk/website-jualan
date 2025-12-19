import React from 'react';

interface ColorSwatchProps {
  color: string;
  stock?: number;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  stock,
  name,
  size = 'md',
  showTooltip = true,
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const isLowStock = stock !== undefined && stock <= 5 && stock > 0;
  const isOutOfStock = stock !== undefined && stock <= 0;

  return (
    <div className="relative inline-block group">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 ${
          isOutOfStock
            ? 'border-red-500 opacity-40'
            : isLowStock
            ? 'border-orange-400'
            : 'border-gray-300'
        } cursor-pointer hover:scale-110 transition-transform`}
        style={{ backgroundColor: color }}
        title={showTooltip && name ? `${name} (${stock ?? 0} in stock)` : undefined}
      />
      {stock !== undefined && stock > 0 && (
        <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {stock > 99 ? '99+' : stock}
        </div>
      )}
      {stock !== undefined && stock < 0 && (
        <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
          {stock}
        </div>
      )}
      {showTooltip && (name || stock !== undefined) && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {name && <div className="font-medium">{name}</div>}
          {stock !== undefined && <div>Stock: {stock}</div>}
        </div>
      )}
    </div>
  );
};

export default ColorSwatch;
