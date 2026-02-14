/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6faf8",
          100: "#edf5f0",
          200: "#d4e8db",
          500: "#2c8a4b",
          700: "#205f34",
          900: "#163f23"
        }
      }
    }
  },
  plugins: []
};

