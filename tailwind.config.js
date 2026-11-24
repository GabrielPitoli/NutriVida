/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
          500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)',
      },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop': { '0%': { transform: 'scale(.6)', opacity: 0 }, '60%': { transform: 'scale(1.08)', opacity: 1 }, '100%': { transform: 'scale(1)' } },
        'toast-in': { from: { transform: 'translate(-50%, -16px)', opacity: 0 }, to: { transform: 'translate(-50%, 0)', opacity: 1 } },
        'confetti': {
          '0%': { transform: 'translate(0,0) rotate(0)', opacity: 1 },
          '100%': { transform: 'translate(var(--dx), var(--dy)) rotate(var(--rot))', opacity: 0 },
        },
        'wave': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'bump': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.06)' } },
      },
      animation: {
        'slide-up': 'slide-up .32s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in .2s ease-out',
        'pop': 'pop .45s cubic-bezier(.2,.8,.2,1)',
        'toast-in': 'toast-in .3s cubic-bezier(.2,.8,.2,1)',
        'confetti': 'confetti 1.1s cubic-bezier(.1,.7,.3,1) forwards',
        'wave': 'wave 3s linear infinite',
        'bump': 'bump .35s ease-out',
      },
    },
  },
  plugins: [],
}
