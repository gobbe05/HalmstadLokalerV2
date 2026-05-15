// tailwind.config.js — Tailwind v4

export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
  ],

  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    spacing: {
      "sp-1": "var(--space-1)",
      "sp-2": "var(--space-2)",
      "sp-3": "var(--space-3)",
      "sp-4": "var(--space-4)",
      "sp-5": "var(--space-5)",
      "sp-6": "var(--space-6)",
    },

    fontFamily: {
      sans: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "sans-serif",
      ],
      heading: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "sans-serif",
      ],
    },

    colors: {
      border: "hsl(var(--color-border))",
      input: "hsl(var(--color-input))",
      ring: "hsl(var(--color-ring))",
      background: "hsl(var(--color-background))",
      foreground: "hsl(var(--color-foreground))",

      primary: {
        DEFAULT: "hsl(var(--color-primary))",
        foreground: "hsl(var(--color-primary-foreground))",
      },

      secondary: {
        DEFAULT: "hsl(var(--color-secondary))",
        foreground: "hsl(var(--color-secondary-foreground))",
      },

      destructive: {
        DEFAULT: "hsl(var(--color-destructive))",
        foreground: "hsl(var(--color-destructive-foreground))",
      },

      muted: {
        DEFAULT: "hsl(var(--color-muted))",
        foreground: "hsl(var(--color-muted-foreground))",
      },

      accent: {
        DEFAULT: "hsl(var(--color-accent))",
        foreground: "hsl(var(--color-accent-foreground))",
      },

      cta: {
        DEFAULT: "hsl(var(--color-cta))",
        hover: "hsl(var(--color-cta-hover))",
        foreground: "hsl(var(--color-cta-foreground))",
      },

      teal: {
        50: "hsl(var(--color-teal-50))",
        100: "hsl(var(--color-teal-100))",
        200: "hsl(var(--color-teal-200))",
        300: "hsl(var(--color-teal-300))",
        400: "hsl(var(--color-teal-400))",
        500: "hsl(var(--color-teal-500))",
        600: "hsl(var(--color-teal-600))",
        700: "hsl(var(--color-teal-700))",
        800: "hsl(var(--color-teal-800))",
        900: "hsl(var(--color-teal-900))",
      },

      popover: {
        DEFAULT: "hsl(var(--color-popover))",
        foreground: "hsl(var(--color-popover-foreground))",
      },

      card: {
        DEFAULT: "hsl(var(--color-card))",
        foreground: "hsl(var(--color-card-foreground))",
      },

      sidebar: {
        DEFAULT: "hsl(var(--color-sidebar-background))",
        foreground: "hsl(var(--color-sidebar-foreground))",
        primary: "hsl(var(--color-sidebar-primary))",
        "primary-foreground": "hsl(var(--color-sidebar-primary-foreground))",
        accent: "hsl(var(--color-sidebar-accent))",
        "accent-foreground": "hsl(var(--color-sidebar-accent-foreground))",
        border: "hsl(var(--color-sidebar-border))",
        ring: "hsl(var(--color-sidebar-ring))",
      },

      status: {
        new: {
          DEFAULT: "hsl(var(--color-status-new))",
          bg: "hsl(var(--color-status-new-bg))",
          text: "hsl(var(--color-status-new-text))",
        },
        contacted: {
          DEFAULT: "hsl(var(--color-status-contacted))",
          bg: "hsl(var(--color-status-contacted-bg))",
          text: "hsl(var(--color-status-contacted-text))",
        },
        viewing: {
          DEFAULT: "hsl(var(--color-status-viewing))",
          bg: "hsl(var(--color-status-viewing-bg))",
          text: "hsl(var(--color-status-viewing-text))",
        },
        negotiating: {
          DEFAULT: "hsl(var(--color-status-negotiating))",
          bg: "hsl(var(--color-status-negotiating-bg))",
          text: "hsl(var(--color-status-negotiating-text))",
        },
        won: {
          DEFAULT: "hsl(var(--color-status-won))",
          bg: "hsl(var(--color-status-won-bg))",
          text: "hsl(var(--color-status-won-text))",
        },
        lost: {
          DEFAULT: "hsl(var(--color-status-lost))",
          bg: "hsl(var(--color-status-lost-bg))",
          text: "hsl(var(--color-status-lost-text))",
        },
      },
    },

    borderRadius: {
      lg: "var(--radius)",
      md: "calc(var(--radius) - 2px)",
      sm: "calc(var(--radius) - 4px)",
    },

    boxShadow: {
      soft: "0 2px 8px -2px hsl(var(--foreground) / 0.08)",
      medium: "0 4px 16px -4px hsl(var(--foreground) / 0.12)",
      elevated: "0 8px 32px -8px hsl(var(--foreground) / 0.16)",
      float: "0 16px 48px -16px hsl(var(--foreground) / 0.2)",
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
      "fade-in": {
        from: { opacity: "0" },
        to: { opacity: "1" },
      },
      "fade-in-up": {
        from: { opacity: "0", transform: "translateY(16px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
      "scale-in": {
        from: { opacity: "0", transform: "scale(0.96)" },
        to: { opacity: "1", transform: "scale(1)" },
      },
      "slide-in-right": {
        from: { transform: "translateX(100%)" },
        to: { transform: "translateX(0)" },
      },
      "slide-in-left": {
        from: { transform: "translateX(-100%)" },
        to: { transform: "translateX(0)" },
      },
    },

    animation: {
      "accordion-down": "accordion-down 0.2s ease-out",
      "accordion-up": "accordion-up 0.2s ease-out",
      "fade-in": "fade-in 0.4s ease-out forwards",
      "fade-in-up": "fade-in-up 0.5s ease-out forwards",
      "scale-in": "scale-in 0.3s ease-out forwards",
      "slide-in-right": "slide-in-right 0.3s ease-out",
      "slide-in-left": "slide-in-left 0.3s ease-out",
    },

    transitionTimingFunction: {
      smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },
};
