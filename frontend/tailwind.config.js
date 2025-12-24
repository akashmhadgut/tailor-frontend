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
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                },
                secondary: '#64748b',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-down': 'slideDown 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(-5px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
