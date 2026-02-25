/**
 * Tailwind CSS configuration for Japan Trip Planner
 * Add custom theme, screens, and plugins as needed
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e293b', // Slate-800
        accent: '#f59e42', // Orange
      },
    },
  },
  plugins: [],
};

export default config;
