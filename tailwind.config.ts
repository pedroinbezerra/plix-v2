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
        background: "#07080a",
        surface: {
          DEFAULT: "#121319",
          light: "#1b1c24",
          card: "#14151e",
          hover: "#1f202b",
          glass: "rgba(255, 255, 255, 0.08)",
          "glass-hover": "rgba(255, 255, 255, 0.14)",
        },
        primary: {
          DEFAULT: "#ffffff",
          hover: "#e5e5ea",
          dark: "#1c1c1e",
          red: "#e50914",
          blue: "#0071e3",
          subtle: "rgba(255, 255, 255, 0.12)",
        },
        accent: {
          blue: "#2997ff",
          gold: "#ffd60a",
          purple: "#af52de",
        },
        tv: {
          focus: "#ffffff",
          glow: "rgba(255, 255, 255, 0.4)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'Helvetica Neue'",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        tv: "0 0 0 3px #ffffff, 0 20px 45px rgba(0, 0, 0, 0.85), 0 0 30px rgba(255, 255, 255, 0.35)",
        "apple-card": "0 12px 32px rgba(0, 0, 0, 0.7)",
        "apple-float": "0 24px 60px rgba(0, 0, 0, 0.85)",
        "apple-glow": "0 0 40px rgba(255, 255, 255, 0.2)",
        card: "0 10px 28px rgba(0, 0, 0, 0.65)",
      },
      scale: {
        102: "1.02",
        104: "1.04",
        105: "1.05",
      },
    },
  },
  plugins: [],
};
export default config;
