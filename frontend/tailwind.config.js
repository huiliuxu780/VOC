/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#05070A",
        panel: "#0B0F17",
        panelSoft: "rgba(255,255,255,0.03)",
        stroke: "rgba(255,255,255,0.10)",
        textPrimary: "#F5F7FA",
        textSecondary: "rgba(255,255,255,0.65)",
        accentA: "#5B6CFF",
        accentB: "#8B5CFF"
      },
      borderRadius: {
        xl2: "1rem"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,108,255,0.35), 0 0 30px rgba(91,108,255,0.20)"
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(120deg, #5B6CFF 0%, #8B5CFF 100%)"
      }
    }
  },
  plugins: []
};
