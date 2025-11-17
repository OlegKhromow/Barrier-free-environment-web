/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors:{
        'light-olive-green': '#CED46A',
        'deep-jungle-green': '#034a34',
        'deep-dark-blue': '#0A1828',
      }
    },
  },
  plugins: [],
}

