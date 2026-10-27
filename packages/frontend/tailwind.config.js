/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luminous Blue Glass — base surfaces
        background: {
          base: '#000000',
          surface: '#03195B',
          elevated: '#0B2CB1',
        },
        blue: {
          100: '#CBE9FD',
          500: '#5BB8FB',
          600: '#3781FC',
          700: '#1951FC',
          800: '#0B2CB1',
          900: '#03195B',
        },
        brand: {
          DEFAULT: '#1951FC',
          hover: '#3781FC',
          active: '#03195B',
          border: 'rgba(91, 184, 251, 0.35)',
        },
        // Text
        text: {
          primary: '#FFFFFF',
          secondary: '#CBE9FD',
          muted: '#5BB8FB',
        },
        // Borders
        border: {
          DEFAULT: 'rgba(203, 233, 253, 0.35)',
        },
        // Semantic States
        error: '#5BB8FB',
        warning: '#3781FC',
        info: '#5BB8FB',
        dark: {
          50: '#CBE9FD',
          100: '#B5D9FC',
          200: '#91C4FB',
          300: '#6EAEFB',
          400: '#5BB8FB',
          500: '#3781FC',
          600: '#1951FC',
          700: '#0B2CB1',
          800: '#03195B',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Urbanist', 'Sora', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(55, 129, 252, 0.45)',
      },
    },
  },
  plugins: [],
}
