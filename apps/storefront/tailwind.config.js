const path = require("path")

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: {
        brick: {
          DEFAULT: "#a13c2e",
          deep: "#7e2e24",
          light: "#c96a5a",
        },
        bronze: {
          DEFAULT: "#c4a06a",
          deep: "#9a7848",
          pale: "#e4d2ae",
        },
        moss: {
          DEFAULT: "#5a6a52",
          deep: "#2c352c",
        },
        dusk: {
          DEFAULT: "#3d5558",
          deep: "#243033",
        },
        clay: {
          DEFAULT: "#8a5a42",
          deep: "#2c1e18",
        },
        night: {
          DEFAULT: "#161311",
          soft: "#221c1a",
        },
        ink: {
          DEFAULT: "#161311",
          soft: "#3d3830",
          muted: "#6a5e54",
        },
        paper: {
          DEFAULT: "#f6eee6",
          dark: "#eadfce",
        },
        surface: "#fffaf4",
        cream: "#faf6f1",
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
      },
      borderRadius: {
        none: "0px",
        soft: "2px",
        base: "4px",
        rounded: "8px",
        large: "16px",
        circle: "9999px",
      },
      maxWidth: {
        "8xl": "100rem",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontSize: {
        "3xl": "2rem",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Outfit",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["var(--font-display)", "Syne", "sans-serif"],
      },
      boxShadow: {
        lift: "0 2px 6px rgba(22, 19, 17, 0.1), 0 16px 40px rgba(22, 19, 17, 0.16)",
        "lift-md":
          "0 8px 16px rgba(22, 19, 17, 0.12), 0 28px 56px rgba(22, 19, 17, 0.2)",
        "lift-lg":
          "0 16px 32px rgba(22, 19, 17, 0.2), 0 48px 80px rgba(22, 19, 17, 0.32)",
        shop: "0 12px 40px rgba(22, 19, 17, 0.28)",
        "shop-lg": "0 24px 60px rgba(22, 19, 17, 0.38)",
        glow: "0 0 0 1px rgba(196, 160, 106, 0.45), 0 22px 55px rgba(22, 19, 17, 0.4)",
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in-top": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-top": {
          "0%": {
            height: "100%",
          },
          "99%": {
            height: "0",
          },
          "100%": {
            visibility: "hidden",
          },
        },
        "accordion-slide-up": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": {
            height: "0",
            opacity: "0",
          },
        },
        "accordion-slide-down": {
          "0%": {
            "min-height": "0",
            "max-height": "0",
            opacity: "0",
          },
          "100%": {
            "min-height": "var(--radix-accordion-content-height)",
            "max-height": "none",
            opacity: "1",
          },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right":
          "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top":
          "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open":
          "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close":
          "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
