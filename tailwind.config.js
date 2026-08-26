/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mat: {
          950: '#141416',
          900: '#1C1C1E',
          800: '#26262A',
          700: '#333338',
        },
        gi: {
          50: '#FFFFFF',
          100: '#F2F2F3',
        },
        brand: {
          red: '#E22726',
          redDark: '#B01E1D',
          blue: '#1E5FA8',
          blueDark: '#164773',
        },
        faixa: {
          branca: '#F5F3EE',
          azul: '#1E5FA8',
          roxa: '#6B3FA0',
          marrom: '#6B4423',
          preta: '#17171A',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'sans-serif'],
        sans: ['Archivo', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
      },
    },
  },
  plugins: [],
}
