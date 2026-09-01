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
        // ---------------------------------------------------------
        // Camada semântica do design system — usar estes nomes em
        // vez de mat-900/gi-50 direto sempre que o significado for
        // "fundo", "superfície", "borda" etc. Mantém a interface
        // consistente e permite trocar o tema num só lugar depois.
        // ---------------------------------------------------------
        bg: {
          DEFAULT: '#FBFBFA', // fundo principal da aplicação
          subtle: '#F2F2F0', // fundo secundário (ex: filtros, barras)
        },
        surface: {
          DEFAULT: '#FFFFFF', // cards, modais, inputs
          raised: '#FFFFFF', // superfície elevada (usa shadow-raised junto)
        },
        border: {
          DEFAULT: '#E4E4E1',
          subtle: '#EDEDEB',
          strong: '#C7C7C3',
        },
        content: {
          primary: '#1C1C1E',
          secondary: '#5B5B60',
          muted: '#8B8B90',
          inverse: '#FFFFFF',
        },
        success: { DEFAULT: '#1E7A4E', bg: '#E8F5EE' },
        warning: { DEFAULT: '#966B0A', bg: '#FBF2DF' },
        danger: { DEFAULT: '#B01E1D', bg: '#FBEAEA' },
        info: { DEFAULT: '#1E5FA8', bg: '#EAF1FA' },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'sans-serif'],
        sans: ['Archivo', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        // Escala tipográfica — números financeiros sempre em mono para alinhar dígitos.
        h1: ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        h2: ['1.375rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        h3: ['1.0625rem', { lineHeight: '1.3' }],
        h4: ['0.9375rem', { lineHeight: '1.35' }],
        caption: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        sm: '4px', // inputs, botões pequenos, badges
        DEFAULT: '6px', // botões, campos
        md: '8px', // cards
        lg: '12px', // modais, painéis grandes
      },
      boxShadow: {
        // Sombras propositalmente sutis — profundidade vem de espaçamento/contraste, não de sombra pesada.
        xs: '0 1px 2px 0 rgb(28 28 30 / 0.04)',
        sm: '0 1px 3px 0 rgb(28 28 30 / 0.06), 0 1px 2px -1px rgb(28 28 30 / 0.06)',
        raised: '0 4px 16px -4px rgb(28 28 30 / 0.10), 0 2px 6px -2px rgb(28 28 30 / 0.06)',
        modal: '0 24px 48px -12px rgb(28 28 30 / 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
