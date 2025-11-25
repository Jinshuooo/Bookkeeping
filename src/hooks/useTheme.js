import { useState, useEffect } from 'react'

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system'
        }
        return 'system'
    })

    useEffect(() => {
        const root = window.document.documentElement

        const removeOldTheme = () => {
            root.classList.remove('dark')
        }

        const applyTheme = (theme) => {
            removeOldTheme()
            if (theme === 'dark') {
                root.classList.add('dark')
            } else if (theme === 'light') {
                // do nothing, default is light
            } else if (theme === 'system') {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark')
                }
            }
        }

        applyTheme(theme)
        localStorage.setItem('theme', theme)

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system')
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    return { theme, setTheme }
}
