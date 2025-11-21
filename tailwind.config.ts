import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			surface: '#FFFFFF',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			success: '#A7E0B0',
  			warning: '#FFD89C',
  			error: '#FFB4B4',
  			text: {
  				primary: '#1A1A1A',
  				secondary: '#4B5563',
  				muted: '#9CA3AF'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
            gold: {
                DEFAULT: 'hsl(var(--gold))',
                foreground: '#FFFFFF'
            }
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-helix)',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			xl: '24px',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			'section-v': '80px',
  			'section-h': '24px',
  			'section-v-mobile': '48px',
  			'section-h-mobile': '16px'
  		},
  		boxShadow: {
  			card: '0 4px 20px rgba(0,0,0,0.05)',
  			hover: '0 10px 25px rgba(0,0,0,0.08)',
  			modal: '0 20px 50px rgba(0,0,0,0.1)',
  			glow: '0 0 20px rgba(212,175,55,0.2)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
