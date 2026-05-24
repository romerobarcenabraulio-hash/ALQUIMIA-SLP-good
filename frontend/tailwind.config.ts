import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Superficies (layout canónico: blanco)
        'surface-base':   '#FFFFFF',
        'surface-muted':  '#F8FAF8',
        'surface-border': '#ECEAE6',
        // Fondo marfil (legacy — preferir surface-*)
        'ivory-base':   '#FFFFFF',
        'ivory-card':   '#FFFFFF',
        'ivory-border': '#ECEAE6',
        'ivory-hover':  '#F8FAF8',
        // Grises cálidos
        'gray-200c':  '#E2DED6',
        'gray-400c':  '#A8A49C',
        'gray-600c':  '#6B6760',
        'gray-900c':  '#1C1B18',
        // Verde Alquimia
        'green-50a':  '#EAF3DE',
        'green-500a': '#3B6D11',
        'green-600a': '#2D5409',
        'green-700a': '#1F3B06',
        // Ámbar
        'amber-50a':  '#FEF7E7',
        'amber-300a': '#F6C84B',
        'amber-500a': '#D4881E',
        'amber-700a': '#8A4F08',
        // Azul datos
        'blue-50a':   '#EBF3FB',
        'blue-600a':  '#1A5FA8',
        'blue-900a':  '#051D45',
        // Rojo riesgo
        'red-50a':   '#FBEAEA',
        'red-500a':  '#C0392B',
        // Tierra
        'earth-100': '#F0E8DC',
        'earth-500': '#8B6B4A',
        // Materiales
        'mat-organico':  '#639922',
        'mat-papel':     '#D4881E',
        'mat-plastico':  '#1A5FA8',
        'mat-vidrio':    '#1D9E75',
        'mat-aluminio':  '#8B6B4A',
        'mat-otros':     '#A8A49C',
      },
      fontFamily: {
        serif:   ['var(--font-literata)', 'Georgia', 'serif'],
        sans:    ['var(--font-source-sans)', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'hero':  ['52px', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'h1':    ['38px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'h2':    ['28px', { lineHeight: '1.1' }],
        'h3':    ['20px', { lineHeight: '1.2', fontWeight: '600' }],
        'base':  ['14px', { lineHeight: '1.6' }],
        'label': ['12px', { lineHeight: '1.3', fontWeight: '500' }],
        'micro': ['10px', { lineHeight: '1', letterSpacing: '0.04em' }],
      },
      spacing: {
        'sp-1': '4px',  'sp-2': '8px',   'sp-3': '12px',  'sp-4': '16px',
        'sp-6': '24px', 'sp-8': '32px',  'sp-12': '48px', 'sp-16': '64px',
      },
      borderRadius: {
        'sm': '6px', 'md': '10px', 'lg': '14px', 'xl': '20px',
      },
      boxShadow: {
        'sm':  '0 1px 3px rgba(28,27,24,.07)',
        'md':  '0 4px 12px rgba(28,27,24,.08)',
        'lg':  '0 8px 24px rgba(28,27,24,.10)',
      },
      keyframes: {
        pulse: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.4' } },
        'count-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
      animation: {
        'pulse-dot': 'pulse 1.5s ease-in-out infinite',
        'count-up':  'count-up 0.3s ease-out',
        'slide-in':  'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
