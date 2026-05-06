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
        navy: '#1e3a5f',
        'navy-light': '#2a4f82',
        accent: '#2e86de',
        danger: '#e74c3c',
        success: '#27ae60',
      },
    },
  },
  plugins: [],
}

export default config
