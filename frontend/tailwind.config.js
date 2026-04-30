/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#edfff7",
          100: "#d5fff0",
          200: "#adffe0",
          300: "#70ffc8",
          400: "#2dfaaa",
          500: "#00e68e",
          600: "#00c478",
          700: "#009a61",
          800: "#00794d",
          900: "#006340",
          950: "#003821",
        },
        surface: {
          DEFAULT: "#0a0f1e",
          50: "#f0f4ff",
          100: "#e0e8ff",
          700: "#131929",
          800: "#0d1220",
          900: "#080c18",
          950: "#050810",
        },
        glass: "rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "glass-card":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glass-sm": "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow: "0 0 40px rgba(0,198,120,0.25)",
        "glow-red": "0 0 40px rgba(255,71,87,0.25)",
        "glow-amber": "0 0 40px rgba(255,179,0,0.25)",
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        "fade-up": {
          "0%": { transform: "translateY(16px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16,1,0.3,1)",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1)",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
