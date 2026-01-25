'''import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          // A deep, "pure" black to minimize screen glow on the subject's face
          black: "#050505", 
          // A dark charcoal for secondary UI elements
          card: "#121212",
          // The high-visibility recording red
          red: "#FF3B30",
          // Soft white/grey for prompter text to reduce "ghosting"
          text: "#E5E5E5",
          // Muted border for the 70/30 grid lines
          border: "rgba(255, 255, 255, 0.05)",
        },
      },
      fontFamily: {
        // High-legibility serif or heavy sans for the prompter
        prompter: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        // A custom slow pulse for the "ON AIR" tally light
        'tally-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;'''