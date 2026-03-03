/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8fafc",
          900: "#0f172a"
        },
        brand: {
          500: "#0ea5e9",
          600: "#0284c7"
        }
      },
      boxShadow: {
        panel: "0 1px 3px rgba(15,23,42,0.15), 0 12px 24px rgba(15,23,42,0.08)"
      }
    }
  },
  plugins: []
};
