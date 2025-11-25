/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                accent: 'var(--color-accent)',
                background: 'var(--color-background)',
                surface: 'var(--color-surface)',
                muted: 'var(--color-muted)',
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                error: 'var(--color-error)',
                info: 'var(--color-info)',
            },
            fontFamily: {
                sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['var(--font-heading)', 'monospace'],
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
            },
            borderWidth: {
                DEFAULT: 'var(--border-width)',
            }
        },
    },
    plugins: [],
}
