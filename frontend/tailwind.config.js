/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#6C47FF",
          600: "#5a39dc",
          700: "#4d2fc2"
        },
        surface: {
          50: "#F8F8FC",
          100: "#f1f2f7",
          900: "#0D0D0D"
        }
      },
      boxShadow: {
        panel: "0 4px 24px rgba(0,0,0,0.08)"
      },
      borderRadius: {
        panel: "20px"
      }
    }
  },
  plugins: []
};
