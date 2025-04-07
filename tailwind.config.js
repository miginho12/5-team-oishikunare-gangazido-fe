/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'fade-up': 'fadeUp 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'fade-out-down': 'fadeOutDown 0.4s ease-in forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)', // 아래에서 위로
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInUp: {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        fadeOutDown: {
          '0%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
          '100%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
        },
      },
    },
  },
  plugins: [],
}