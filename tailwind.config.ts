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
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        background: "#111111",
        foreground: "#F5F5F5",
        card: {
          DEFAULT: "#1A1A1A",
          foreground: "#F5F5F5",
        },
        border: "#2A2A2A",
        input: "#252525",
        ring: "#00C896",
        primary: {
          DEFAULT: "#00C896",
          foreground: "#0D0D0D",
        },
        secondary: {
          DEFAULT: "#252525",
          foreground: "#F5F5F5",
        },
        muted: {
          DEFAULT: "#252525",
          foreground: "#888888",
        },
        accent: {
          DEFAULT: "#00C896",
          foreground: "#0D0D0D",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#F5F5F5",
        },
        sidebar: {
          DEFAULT: "#161616",
          foreground: "#F5F5F5",
          border: "#2A2A2A",
        },
        upflu: {
          green: "#00C896",
          dark: "#0D0D0D",
          bg: "#111111",
          card: "#1A1A1A",
          sidebar: "#161616",
          border: "#2A2A2A",
          text: "#F5F5F5",
          muted: "#888888",
          hover: "#252525",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
