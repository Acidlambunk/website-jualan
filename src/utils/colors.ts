export interface PredefinedColor {
  name: string;
  hex: string;
  category: string;
}

export const predefinedColors: PredefinedColor[] = [
  { name: 'biru tua', hex: '#1e3a8a', category: 'blue' },
  { name: 'biru muda', hex: '#3b82f6', category: 'blue' },
  { name: 'biru', hex: '#2563eb', category: 'blue' },
  { name: 'pink', hex: '#ec4899', category: 'pink' },
  { name: 'pink muda', hex: '#f9a8d4', category: 'pink' },
  { name: 'ijo', hex: '#16a34a', category: 'green' },
  { name: 'hijau tua', hex: '#15803d', category: 'green' },
  { name: 'hijau muda', hex: '#4ade80', category: 'green' },
  { name: 'kuning', hex: '#eab308', category: 'yellow' },
  { name: 'orange', hex: '#ea580c', category: 'orange' },
  { name: 'merah', hex: '#dc2626', category: 'red' },
  { name: 'ungu', hex: '#9333ea', category: 'purple' },
  { name: 'hitam', hex: '#000000', category: 'neutral' },
  { name: 'putih', hex: '#ffffff', category: 'neutral' },
  { name: 'abu-abu', hex: '#6b7280', category: 'neutral' },
  { name: 'coklat', hex: '#92400e', category: 'brown' }
];

export const getColorByName = (name: string): PredefinedColor | undefined => {
  return predefinedColors.find(color =>
    color.name.toLowerCase() === name.toLowerCase()
  );
};

export const getColorsByCategory = (category: string): PredefinedColor[] => {
  return predefinedColors.filter(color => color.category === category);
};

export const colorCategories = [
  { value: 'blue', label: 'Biru' },
  { value: 'green', label: 'Hijau' },
  { value: 'pink', label: 'Pink' },
  { value: 'yellow', label: 'Kuning' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Merah' },
  { value: 'purple', label: 'Ungu' },
  { value: 'neutral', label: 'Netral' },
  { value: 'brown', label: 'Coklat' }
];
