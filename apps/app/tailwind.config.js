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
        accent: {
          DEFAULT: "oklch(49% 0.22 258)",
          hover: "oklch(44% 0.22 258)",
          subtle: "oklch(92% 0.08 258)",
          tint: "oklch(55% 0.22 258 / 0.18)"
        },
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          4: "var(--ink-4)"
        },
        surface: {
          page: "var(--bg)",
          card: "var(--bg-2)",
          muted: "var(--bg-3)",
          chip: "var(--accent-s)",
          line: "var(--border)",
          lineStrong: "var(--border-2)"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
        card: "0 12px 32px rgba(15,23,42,0.08)",
        cta: "0 8px 24px oklch(49% 0.22 258 / 0.32)"
      }
    }
  },
  plugins: []
};
