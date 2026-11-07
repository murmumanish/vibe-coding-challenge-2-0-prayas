import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        cardBorder: "var(--card-border)",
        "card-border": "var(--card-border)",
        cardHover: "var(--card-hover)",
        "card-hover": "var(--card-hover)",
        primary: "var(--primary)",
        "main-color": "var(--main-color)",
        primaryHover: "var(--primary-hover)",
        "primary-hover": "var(--primary-hover)",
        primaryContainer: "var(--primary-container)",
        "primary-container": "var(--primary-container)",
        primaryOnContainer: "var(--primary-on-container)",
        "primary-on-container": "var(--primary-on-container)",
        primaryForeground: "var(--primary-foreground)",
        "primary-foreground": "var(--primary-foreground)",
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
    },
  },
  plugins: [],
};

export default config;
