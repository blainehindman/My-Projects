/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1d29',
        secondary: '#4a154b',
        accent: '#ff2765',
        surface: '#ffffff',
        background: '#f8f9fa',
        border: '#e1e5e9',
        'text-primary': '#1d1c1d',
        'text-secondary': '#616061',
        'text-muted': '#868686',
        success: '#007a5a',
        warning: '#f79009',
        error: '#d93025',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h1': ['24px', { lineHeight: '1.33', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h2': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.47', fontWeight: '400' }],
        'small': ['13px', { lineHeight: '1.38', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '1.36', fontWeight: '500', letterSpacing: '0.06em' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      screens: {
        'mobile': { 'max': '767px' },
        'tablet': { 'min': '768px', 'max': '1023px' },
        'desktop': { 'min': '1024px', 'max': '1439px' },
        'large': { 'min': '1440px' },
      },
      maxWidth: {
        'content': '768px',
        'narrow': '512px',
        'container': '1200px',
      },
    },
  },
  plugins: [],
} 