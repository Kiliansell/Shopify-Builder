import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bestehende Intranet-Tokens (Backwards-Compat)
        ziegler: {
          dark: "#1a1a1a",
          accent: "#3556B8",
          muted: "#f5f5f5",
        },
        // Neutrals fuer die oeffentliche Site
        paper: {
          50: "#ffffff",
          100: "#fafafb",
          200: "#f1f2f4",
          300: "#e4e6ea",
        },
        ink: {
          50: "#5d6675",
          100: "#3a4150",
          200: "#1f242e",
          300: "#0c0e13",
        },
        // Ziegler-Blau (aus Screenshot extrahiert)
        // Hauptverlauf des Headers: ~#5170D0 -> ~#2E47A8
        // Pfeil im Logo: ~#3556B8
        ziegler_blau: {
          50: "#eef2fb",
          100: "#dde5f7",
          200: "#b3c2ee",
          300: "#7e93de",
          400: "#5170D0",
          500: "#3556B8",
          600: "#2E47A8",
          700: "#243a8a",
          800: "#1c2e6e",
          900: "#152352",
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
