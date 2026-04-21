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
      },
    },
  },
  plugins: [],
};
export default config;
