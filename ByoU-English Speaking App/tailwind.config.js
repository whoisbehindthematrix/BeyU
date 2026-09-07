/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#1F2937",
          800: "#374151",
          700: "#4B5563",
          600: "#6B7280",
          500: "#9CA3AF",
          400: "#B0B6C0",
          300: "#D1D5DB",
          200: "#E5E7EB",
          100: "#F3F4F6",
        },
        brand: {
          50: "#EEF0FF",
          100: "#E0E3FF",
          200: "#C7CEFF",
          300: "#A5B0FF",
          400: "#7B86F8",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
          800: "#312E81",
        },
        accent: {
          50: "#FFF5ED",
          100: "#FFE8D1",
          200: "#FFCFA3",
          300: "#FFB074",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
        },
        success: {
          400: "#22C55E",
          500: "#16A34A",
          600: "#15803D",
        },
        amber: {
          400: "#FBBF24",
          500: "#D97706",
          600: "#B45309",
        },
        surface: {
          0: "#FFFFFF",
          1: "#FAF9F6",
          2: "#F5F4F0",
          3: "#EEEEE9",
        },
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(31,41,55,0.08)",
        card: "0 6px 24px -8px rgba(31,41,55,0.14)",
        pop: "0 12px 40px -12px rgba(79,70,229,0.35)",
        popAccent: "0 12px 44px -10px rgba(249,115,22,0.50)",
        popSuccess: "0 12px 40px -12px rgba(22,163,74,0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.25s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.22,1,0.36,1)",
        "pulse-ring": "pulseRing 1.6s ease-out infinite",
        "wave": "wave 0.8s ease-in-out infinite",
        "confetti-fall": "confettiFall 1s ease-out forwards",
        "shimmer": "shimmer 1.5s infinite",
        "bounce-in": "bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.8)", opacity: "0" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        confettiFall: {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(260px) rotate(360deg)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "60%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
