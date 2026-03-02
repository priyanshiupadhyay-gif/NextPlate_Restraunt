'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

export function DarkModeToggle() {
    const { theme, setTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative w-12 h-7 bg-[#1C1207]/10 dark:bg-white/10 rounded-full transition-all duration-300 flex items-center px-1 group hover:shadow-md"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${isDark ? 'translate-x-5 bg-violet-500' : 'translate-x-0 bg-orange-500'}`}>
                {isDark ? <Moon className="w-3 h-3 text-white" /> : <Sun className="w-3 h-3 text-white" />}
            </div>
        </button>
    )
}
