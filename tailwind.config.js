/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /(bg|text|border|from|via|to|shadow)-(purple|cyan|pink|emerald|rose|slate)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
  ],
  plugins: [],
}
