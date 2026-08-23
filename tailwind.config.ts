import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media", // honours prefers-color-scheme
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Re-skin the whole site by changing these two ramps.
        accent: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        cream: "#fffaf5",
        ink: "#1c1917",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        chunk: "1.75rem",
      },
      boxShadow: {
        chunk: "0 10px 0 0 rgba(0,0,0,0.08)",
        "chunk-dark": "0 10px 0 0 rgba(0,0,0,0.45)",
      },
      keyframes: {
        wiggle: {
          "0%,100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "bounce-check": {
          "0%": { transform: "scale(0)" },
          "60%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        wiggle: "wiggle 0.4s ease-in-out 2",
        "pop-in": "pop-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "bounce-check": "bounce-check 0.45s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
