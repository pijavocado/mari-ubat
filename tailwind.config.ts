import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B2545",
        "navy-2": "#153B6B",
        blue: "#2563EB",
        "blue-dark": "#1D4ED8",
        sky: "#DCEAFE",
        paper: "#F5F8FC",
        slate: "#5B6B82",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11, 37, 69, 0.06), 0 20px 44px -12px rgba(11, 37, 69, 0.18)",
      },
      keyframes: {
        "fill-bar": { from: { width: "0%" } },
      },
      animation: {
        "fill-bar": "fill-bar 0.8s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
