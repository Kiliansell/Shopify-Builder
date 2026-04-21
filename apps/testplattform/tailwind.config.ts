import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ziegler: {
          dark: "#1a1a1a",
          accent: "#b8860b",
          muted: "#f5f5f0",
        },
        paper: {
          50: "#fbfaf7",
          100: "#f5f2ea",
          200: "#e9e4d6",
        },
        ink: {
          50: "#4a4a4a",
          100: "#2b2b2b",
          200: "#1a1a1a",
          300: "#0f0f0f",
        },
        gold: {
          100: "#f4ecd8",
          400: "#c99b2c",
          500: "#b8860b",
          600: "#9a6f08",
        },
      },
      fontFamily: {
        serif: [
          "Playfair Display",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
