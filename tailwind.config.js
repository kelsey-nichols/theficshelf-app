/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Libre Baskerville"', 'serif'],
      },
      colors: {
        red: {
          600: "#4e2a21", // override Tailwind's default red-600
        },
      },
    },
  },
  plugins: [],
};
