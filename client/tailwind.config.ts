import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Enables dark mode using class strategy
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        // Theme colors
        lavender: "#b3c6fc",
        teal: "#7ad7d7",
        mint: "#60c5c5",
        blue: "#4b4b6b",
        purple: "#9b87f5",
        softblue: "#e6e6fa",
        softmint: "#e0f7fa",
        dark: "#1a202c",
        
        // Primary, Secondary, Accent mappings
        primary: {
          DEFAULT: "#60c5c5", // mint
          light: "#7ad7d7",   // teal
          dark: "#4db8b8",
        },
        secondary: {
          DEFAULT: "#b3c6fc", // lavender
          light: "#c9d8fd",
          dark: "#9fb4fb",
        },
        accent: {
          DEFAULT: "#9b87f5", // purple
          light: "#b5a4f7",
          dark: "#8470f3",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },

      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.06)",
        medium: "0 10px 40px rgba(0,0,0,0.1)",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },

      screens: {
        xs: "475px",
      },
    },
  },


  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};

export default config;
