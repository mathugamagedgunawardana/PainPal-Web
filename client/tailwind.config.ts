import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lavender: '#b3c6fc',
        teal: '#7ad7d7',
        mint: '#60c5c5',
        blue: '#4b4b6b',
        softblue: '#e6e6fa',
        softmint: '#e0f7fa',
        dark: '#1a202c',
        primary: '#7ad7d7',
        secondary: '#b3c6fc',
        accent: '#60c5c5',
      },
    },
  },
  plugins: [],
};

export default config;
