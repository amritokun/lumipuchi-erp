/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
        white: "#111827", // Invert text-white to dark gray for light theme
        slate: {
          50: "#000000",
          100: "#111827",
          200: "#1f2937",
          300: "#374151",
          400: "#4b5563",
          450: "#6b7280",
          500: "#9ca3af",
          600: "#d1d5db",
          700: "#e5e7eb",
          800: "#f3f4f6",
          900: "#ffffff", // Make bg-slate-900 pure white for light theme cards
          950: "#fdfbf7", // Make bg-slate-950 match cream background
        },
        // Theme override: Map indigo and purple to custom rose/pink shades from the brand asset
        indigo: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#b24e83", // Muted pink from logo
          450: "#d6336c", // Vibrant brand pink
          500: "#d6336c", // Core brand rose/pink from logo
          550: "#c22c60",
          600: "#d6336c", // Primary brand button color (exact match)
          650: "#b24e83", // Deep rose/magenta from logo
          700: "#9f1239",
          800: "#880525",
          900: "#4c0519",
          950: "#1e0108",
        },
        purple: {
          400: "#b24e83",
          500: "#d6336c",
          600: "#c22c60",
        }
      },
    },
  },
  plugins: [],
}
