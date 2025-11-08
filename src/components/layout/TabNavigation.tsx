import React from 'react';

interface TabNavigationProps {
  activeView: 'products' | 'orders' | 'tracking';
  activeMode: 'spreadsheet' | 'input';
  onViewChange: (view: 'products' | 'orders' | 'tracking') => void;
  onModeChange: (mode: 'spreadsheet' | 'input') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeView,
  activeMode,
  onViewChange,
  onModeChange,
}) => {
  const views = [
    { id: 'products' as const, label: 'Products' },
    { id: 'orders' as const, label: 'Customer Orders' },
    { id: 'tracking' as const, label: 'Order Tracking' },
  ];

  const modes = [
    { id: 'spreadsheet' as const, label: 'Spreadsheet View' },
    { id: 'input' as const, label: 'Input Form' },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Main view tabs */}
      <div className="px-4">
        <nav className="flex space-x-8" aria-label="Tabs">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`${
                activeView === view.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mode toggle */}
      <div className="px-4 py-2 bg-gray-50 flex items-center space-x-4">
        <span className="text-sm text-gray-600 font-medium">View Mode:</span>
        <div className="flex bg-white rounded-md shadow-sm">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`${
                activeMode === mode.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } px-4 py-2 text-sm font-medium first:rounded-l-md last:rounded-r-md transition-colors`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
