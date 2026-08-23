import type { Config } from "tailwindcss";

/**
 * Light-only by design. The palette lives as CSS custom properties in
 * globals.css; these tokens exist so utility classes can reach the same
 * values. Re-skin by editing the `--clay-*` vars there.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-tint": "var(--paper-tint)",
        card: "var(--card)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        line: "var(--line)",
        clay: {
          50: "var(--clay-50)",
          100: "var(--clay-100)",
          300: "var(--clay-300)",
          500: "var(--clay-500)",
          600: "var(--clay-600)",
        },
        tint: {
          sage: "var(--tint-sage)",
          sky: "var(--tint-sky)",
          butter: "var(--tint-butter)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
      },
      borderRadius: {
        chunk: "1.5rem",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        nudge: {
          "0%,100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        "bounce-check": {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "60%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.32s cubic-bezier(0.22,1,0.36,1) both",
        nudge: "nudge 0.3s ease-in-out 2",
        "bounce-check": "bounce-check 0.4s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
