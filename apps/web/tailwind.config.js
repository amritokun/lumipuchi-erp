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
        // Theme override: Map indigo and purple to custom rose/pink shades from the brand asset
        indigo: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          450: "#e11d48", // Custom accent shade
          500: "#d13670", // Core brand rose/pink from logo
          550: "#be123c",
          600: "#be123c", // Primary brand button color
          650: "#9f1239", // Deep rose/magenta
          700: "#9f1239",
          800: "#880525",
          900: "#4c0519",
          950: "#1e0108",
        },
        purple: {
          400: "#f472b6",
          500: "#db2777",
          600: "#c2185b",
        }
      },
    },
  },
  plugins: [],
}
