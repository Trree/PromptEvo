/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fresh: {
          50: '#F0FDF4', // Mint white
          100: '#DCFCE7', // Soft mint
          200: '#BBF7D0',
          500: '#10B981', // Sage/Mint primary
          600: '#059669',
          700: '#047857',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
        },
        petal: {
          50: '#FFF1F2', // Soft pink
          100: '#FFE4E6',
          500: '#F43F5E',
        },
        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          500: '#8B5CF6',
        },
        cream: {
          50: '#FDFCFB', // Warm off-white
          100: '#F7F4F1',
        }
      },
      borderRadius: {
        '3xl': '1.8rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(0, 0, 0, 0.04)',
        'fresh-hover': '0 20px 40px -15px rgba(16, 185, 129, 0.1)',
      }
    },
  },
  plugins: [],
}
