import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Align the results explorer with the tests app: indigo accent (the tests
      // --accent is indigo-600 #4f46e5), slate neutrals, and the shared Georgian
      // font — recolours the whole results UI without touching each component.
      colors: {
        blue: colors.indigo,
        gray: colors.slate,
      },
      fontFamily: {
        sans: ['"Noto Sans Georgian"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        lg: "11px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
