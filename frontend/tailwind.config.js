/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f9f9f9',
                    100: '#f3f3f3',
                    900: '#0a0a0a',
                },
                secondary: {
                    50: '#ffffff',
                    900: '#1a1a1a',
                },
                accent: {
                    cyan: '#00d9ff',
                    magenta: '#ff00ff',
                    lime: '#00ff00',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Courier Prime', 'monospace'],
            },
            animation: {
                'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scan-line': 'scanLine 8s linear infinite',
                'glitch': 'glitch 0.15s infinite',
            },
            keyframes: {
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.5)' },
                    '50%': { boxShadow: '0 0 40px rgba(0, 217, 255, 0.8)' },
                },
                scanLine: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                glitch: {
                    '0%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(2px, 2px)' },
                    '40%': { transform: 'translate(-2px, -2px)' },
                    '60%': { transform: 'translate(2px, -2px)' },
                    '80%': { transform: 'translate(-2px, 2px)' },
                    '100%': { transform: 'translate(0)' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
