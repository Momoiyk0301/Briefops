/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "../../packages/shared/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf3ff",
          100: "#dbe7ff",
          300: "#8fb0ff",
          400: "#628fff",
          500: "#2f70ff",
          600: "#1f57da"
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          strong: "var(--color-ink-strong)",
          muted: "var(--color-ink-muted)",
          soft: "var(--color-ink-soft)"
        },
        surface: {
          page: "var(--color-surface-page)",
          card: "var(--color-surface-card)",
          muted: "var(--color-surface-card-muted)",
          chip: "var(--color-surface-chip)",
          line: "var(--color-surface-line)",
          lineStrong: "var(--color-surface-line-strong)"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
