import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy:      '#0D2D5E',
        navydark:  '#091F42',
        navylight: '#E8F0FE',
        gold:      '#F5A623',
        golddark:  '#C8890A',
        goldlight: '#FEF3DC',
        green:     '#1A9E6A',
        greenlight:'#D9F5EC',
      },
    },
  },
  plugins: [],
}
export default config
