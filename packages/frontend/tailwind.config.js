/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      gridTemplateColumns: {
        'auto-fill-120': 'repeat(auto-fill, minmax(120px, 1fr))',
      },
      gridAutoRows: {
        'min': 'min-content',
      },
      colors: {
        // You can use these as fallbacks if needed, but the CSS variables are primary
        // Light Theme
        'light-primary': '#007AFF',
        'light-text-primary': '#000000',
        'light-text-secondary': '#3C3C43',
        'light-background': '#F2F2F7',
        'light-surface': 'rgba(242, 242, 247, 0.75)',
        // Dark Theme
        'dark-primary': '#0A84FF',
        'dark-text-primary': '#FFFFFF',
        'dark-text-secondary': '#EBEBF5',
        'dark-background': '#000000',
        'dark-surface': 'rgba(28, 28, 30, 0.75)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        // A more intense blur for the liquid glass effect
        '2xl': '24px',
      },
      // --- NEW KEYFRAMES AND ANIMATION ---
      keyframes: {
        // Animation for the lock screen password error
        shake: {
          '10%, 90%': {
            transform: 'translate3d(-1px, 0, 0)'
          },
          '20%, 80%': {
            transform: 'translate3d(2px, 0, 0)'
          },
          '30%, 50%, 70%': {
            transform: 'translate3d(-4px, 0, 0)'
          },
          '40%, 60%': {
            transform: 'translate3d(4px, 0, 0)'
          },
        },
      },
      animation: {
        // Class to apply the shake animation, e.g., 'animate-shake'
        shake: 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}