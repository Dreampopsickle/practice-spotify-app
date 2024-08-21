/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index/html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      width: {
        "album-cover-sm": "100px",
        "album-cover-md": "200px",
        "album-cover-lg": "300px"
      },
      height: {
        "album-cover-sm": "100px",
        "album-cover-md": "200px",
        "album-cover-lg": "300px"
      }
    }
  },
  plugins: []
};
