import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: "#f59e0b",
          "amber-dark": "#d97706",
        },
        surface: {
          1: "#0a0a0f",
          2: "#111118",
          3: "#1a1a28",
          4: "#252535",
        },
      },
      borderRadius: {
        5: "5px",
        6: "6px",
        8: "8px",
        10: "10px",
        12: "12px",
        16: "16px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "Menlo", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease",
        "slide-up": "slideUp 0.2s ease",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
