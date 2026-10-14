/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        creme: '#f3eee7', areia: '#d8cbb9', texto: '#3a2b22', apoio: '#76665a',
        cafe: '#4a382d', oliva: '#4e5839', terracota: '#9a5a42', cobre: '#a26b55',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      borderRadius: { none: '0' },
    },
  },
  plugins: [],
}
