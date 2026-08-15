import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        serif: ["DM Serif Display", "serif"],
        arabic: ["Amiri", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Noor Circles custom colors
        gold: {
          DEFAULT: "hsl(var(--gold))",
          lt: "hsl(var(--gold-lt))",
          dim: "hsl(var(--gold-dim))",
        },
        teal: {
          DEFAULT: "hsl(var(--teal))",
          lt: "hsl(var(--teal-lt))",
          md: "hsl(var(--teal-md))",
          dk: "hsl(var(--teal-dk))",
        },
        "nc-dark": {
          DEFAULT: "hsl(var(--nc-dark))",
          "2": "hsl(var(--nc-dark2))",
          "3": "hsl(var(--nc-dark3))",
        },
        slate: "hsl(var(--slate))",
        "nc-muted": "hsl(var(--nc-muted))",
        pale: "hsl(var(--pale))",
        "nc-green": {
          DEFAULT: "hsl(var(--nc-green))",
          lt: "hsl(var(--nc-green-lt))",
        },
        "nc-amber": {
          DEFAULT: "hsl(var(--nc-amber))",
          lt: "hsl(var(--nc-amber-lt))",
        },
        "nc-purple": {
          DEFAULT: "hsl(var(--nc-purple))",
          lt: "hsl(var(--nc-purple-lt))",
        },
        "nc-red": {
          DEFAULT: "hsl(var(--nc-red))",
          lt: "hsl(var(--nc-red-lt))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        nc: "var(--shadow)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
} satisfies Config;
