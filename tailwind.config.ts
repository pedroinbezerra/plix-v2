import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090a0f",
        surface: {
          DEFAULT: "#12141d",
          light: "#1c1f2e",
          card: "#171a26",
          hover: "#23273a",
        },
        primary: {
          DEFAULT: "#e50914",
          hover: "#f40612",
          subtle: "rgba(229, 9, 20, 0.15)",
        },
        accent: {
          blue: "#3b82f6",
          gold: "#f59e0b",
        },
        tv: {
          focus: "#ffffff",
          glow: "rgba(255, 255, 255, 0.4)",
        }
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
      },
      boxShadow: {
        tv: "0 0 0 4px #ffffff, 0 10px 25px -5px rgba(0, 0, 0, 0.8)",
        "tv-red": "0 0 0 4px #e50914, 0 10px 25px -5px rgba(229, 9, 20, 0.5)",
        card: "0 8px 24px rgba(0, 0, 0, 0.6)",
      },
      scale: {
        102: "1.02",
        105: "1.05",
      }
    },
  },
  plugins: [],
};
export default config;
