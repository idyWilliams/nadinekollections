import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F2F0EB", // Warmer, richer cream/beige
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#1A1A1A", // Deep Charcoal/Black
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D4AF37", // Gold/Champagne
          foreground: "#1A1A1A",
        },
        accent: {
          DEFAULT: "#2C3E50", // Deep Blue/Navy
          foreground: "#FFFFFF",
        },
        success: "#A7E0B0",
        warning: "#FFD89C",
        error: "#FFB4B4",
        text: {
          primary: "#1A1A1A",
          secondary: "#4B5563",
          muted: "#9CA3AF",
        },
        muted: {
          DEFAULT: "#E5E7EB", // Gray-200 for skeletons
          foreground: "#6B7280",
        },
        border: {
          light: "#E5E7EB",
          focus: "#D4AF37", // Gold focus
        },
      },
      fontFamily: {
        sans: ["var(--font-helix)", "sans-serif"],
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        xl: "24px",
      },
      spacing: {
        "section-v": "80px",
        "section-h": "24px",
        "section-v-mobile": "48px",
        "section-h-mobile": "16px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.05)",
        hover: "0 10px 25px rgba(0,0,0,0.08)",
        modal: "0 20px 50px rgba(0,0,0,0.1)",
        glow: "0 0 20px rgba(212,175,55,0.2)", // Gold glow
      },
    },
  },
  plugins: [],
};
export default config;
