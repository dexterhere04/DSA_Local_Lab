/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0f172a",
        panel: "#111827",
        accent: "#22c55e",
        muted: "#94a3b8"
      }
    }
  },
  plugins: []
};
