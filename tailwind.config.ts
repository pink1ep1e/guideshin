import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Unbounded", "system-ui", "sans-serif"],
        genshin: ["var(--font-genshin)", "Unbounded", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        navy: {
          DEFAULT: "#0b1f44",
          deep: "#071533",
        },
        vtb: {
          blue: "#0a4cff",
          dark: "#0839c4",
          soft: "#e8edf5",
          cyan: "#00a3e0",
        },
        legend: "#c68e3f",
        epic: "#a256e1",
        el: {
          pyro: "#ef7333",
          hydro: "#4cc2f1",
          anemo: "#63c6a5",
          electro: "#bf7fdb",
          dendro: "#a5c83b",
          cryo: "#a5e3f0",
          geo: "#f7b93e",
        },
      },
      maxWidth: {
        page: "1240px",
        "page-wide": "1480px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "hero-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        "hero-float": "hero-float 5.5s ease-in-out infinite",
        "reveal-up": "reveal-up 0.6s ease both",
      },
      backgroundImage: {
        "grid-glow": "radial-gradient(circle at top, hsl(var(--primary)/0.18), transparent 60%)",
        "hero-vtb":
          "radial-gradient(ellipse 70% 80% at 85% 40%, rgba(0,163,224,0.35), transparent 55%), radial-gradient(ellipse 50% 60% at 10% 90%, rgba(10,76,255,0.45), transparent 50%), linear-gradient(120deg, #071533 0%, #0b1f44 45%, #123a7a 100%)",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(11, 31, 68, 0.06)",
        panel: "0 8px 28px rgba(11, 31, 68, 0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
