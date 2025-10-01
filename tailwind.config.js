/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        arsenalRed: '#DB0007',
        'arsenal-red': '#DB0007',
        arsenalGold: '#C49A3A',
        arsenalBeige: '#F5EDE2',
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DB0007',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        arsenal: {
          red: '#DB0007',
          'red-dark': '#B40006',
          gold: '#C49A3A',
          beige: '#F5EDE2',
          navy: '#1E2A5E'
        }
      },
      fontFamily: {
        'sf-pro': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        'nunito': ['Nunito', 'Poppins', 'Arial', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      boxShadow: {
        'arsenal': '0 4px 14px 0 rgba(219, 0, 7, 0.39)',
        'arsenal-lg': '0 10px 25px -3px rgba(219, 0, 7, 0.35)',
      },
    },
  },
  plugins: [],
};
