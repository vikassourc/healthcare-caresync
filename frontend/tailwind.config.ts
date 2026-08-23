import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          900: '#2E3B24', // Deep rich forest sage green
          800: '#3D4C30',
          700: '#4A5D38', // Medium earthy sage green
          600: '#5C7347',
          500: '#6F8657', // Soft botanical sage green
          400: '#8DA672',
          300: '#ADC296',
          200: '#D1DEC2',
          100: '#E8EFE0',
          50: '#F4F7F0'
        },
        cream: {
          DEFAULT: '#F6F3EA',
          50: '#FBF9F2',
          100: '#F6F3EA',
          200: '#F3EFE2',
          300: '#E9E4D2',
          400: '#DCD8C0'
        },
        ink: {
          DEFAULT: '#23281F',
          muted: '#6B7364',
          light: '#8E9687'
        },
        surface: {
          white: '#FFFFFF',
          card: 'rgba(255, 255, 255, 0.85)',
          glass: 'rgba(255, 255, 255, 0.55)',
          'glass-border': 'rgba(255, 255, 255, 0.65)'
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif']
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '22px',
        '4xl': '34px',
        'pill': '999px'
      },
      boxShadow: {
        'glass': '0 20px 50px rgba(35, 40, 31, 0.08)',
        'glass-hover': '0 25px 60px rgba(35, 40, 31, 0.12)',
        'phone': '0 30px 70px rgba(35, 40, 31, 0.18), 0 1px 0 rgba(255, 255, 255, 0.8) inset',
        'pill': '0 8px 20px rgba(46, 59, 36, 0.25)'
      }
    }
  },
  plugins: []
} satisfies Config;
