'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useI18n, LOCALE_LABELS, LOCALE_FLAGS, Locale } from '@/contexts/i18n-context'
import { Globe } from 'lucide-react'

export function LanguageSelector() {
    const { locale, setLocale } = useI18n()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const locales: Locale[] = ['en', 'es', 'fr', 'hi']

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1C1207]/5 dark:bg-white/5 hover:bg-[#1C1207]/10 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-[#1C1207]/50 dark:text-white/50"
            >
                <Globe className="w-3.5 h-3.5" />
                {LOCALE_FLAGS[locale]} {locale.toUpperCase()}
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-[#1C1207]/5 dark:border-white/5 p-2 z-50 min-w-[160px]">
                    {locales.map(l => (
                        <button
                            key={l}
                            onClick={() => { setLocale(l); setOpen(false) }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${locale === l ? 'bg-orange-50 dark:bg-orange-950 text-orange-600' : 'text-[#1C1207]/60 dark:text-white/60 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                        >
                            <span className="text-lg">{LOCALE_FLAGS[l]}</span>
                            {LOCALE_LABELS[l]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
