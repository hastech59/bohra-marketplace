import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B4332",
          50: "#E8F5EE",
          100: "#C6E6D4",
          200: "#8ECFAA",
          300: "#56B880",
          400: "#2E9158",
          500: "#1B4332",
          600: "#163828",
          700: "#112D1F",
          800: "#0C2216",
          900: "#07170D",
        },
        gold: {
          DEFAULT: "#D4A017",
          50: "#FDF8E8",
          100: "#FAEFC4",
          200: "#F5DF89",
          300: "#EFCF4E",
          400: "#E8BF2A",
          500: "#D4A017",
          600: "#A87D12",
          700: "#7C5B0D",
          800: "#503A08",
          900: "#241903",
        },
        cream: {
          DEFAULT: "#FBF7EE",
          50: "#FFFFFF",
          100: "#FBF7EE",
          200: "#F5EDDA",
          300: "#EFE3C6",
          400: "#E9D9B2",
          500: "#E3CF9E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern": "url('/images/hero-pattern.svg')",
      },
      animation: {
        "slide-in-right": "slideInRight 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "skeleton-pulse": "skeletonPulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        skeletonPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
