/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/*.{html,js}"],
  theme: {
    extend: {
      animation: {
        'infinite-scroll': 'infinite-scroll 25s linear infinite',
      },
      keyframes: {
        'infinite-scroll': {
          from: { tranform: 'tranlateX(0)' },
          to: { transform: 'translateX(100%)' },
        }
      }
    },
    container: {
      center: true,
    },
  },
  plugins: [],
}

