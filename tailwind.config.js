/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vdOrange: "#FF6F0D",
      },
      dropShadow: {
        md: ["0 2px 4px rgb(0 0 0 / 0.07)", "0 1px 3px rgb(0 0 0 / 0.06)"],
      },
      fontFamily: {
        noto: ['"Noto Sans TC"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

