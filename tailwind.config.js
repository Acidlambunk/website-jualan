/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Excel-like color scheme
        'excel-header': '#f3f4f6',
        'excel-row-even': '#ffffff',
        'excel-row-odd': '#f9fafb',
        'excel-border': '#e5e7eb',
        // Status colors
        'status-completed': '#dcfce7',
        'status-pending': '#fee2e2',
        'status-progress': '#fef3c7',
        // Date-based colors
        'date-today': '#d1fae5',
        'date-yesterday': '#fef9c3',
      },
    },
  },
  plugins: [],
}
