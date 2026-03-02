'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    // Check if already dismissed or installed on mount
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed')
        const installed = localStorage.getItem('pwa-installed')
        if (dismissed || installed) {
            return // Don't even add the event listener
        }

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setTimeout(() => {
                // Double check before showing
                const isDismissed = localStorage.getItem('pwa-prompt-dismissed')
                const isInstalled = localStorage.getItem('pwa-installed')
                if (!isDismissed && !isInstalled) {
                    setShowPrompt(true)
                }
            }, 5000)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        setShowPrompt(false)
        setDeferredPrompt(null)
        if (outcome === 'accepted') {
            localStorage.setItem('pwa-installed', 'true')
        }
        // Mark as dismissed regardless of outcome so it never shows again
        localStorage.setItem('pwa-prompt-dismissed', 'true')
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        // Permanently dismiss — prompt will never appear again
        localStorage.setItem('pwa-prompt-dismissed', 'true')
    }

    // Never show if already installed or dismissed
    if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed')
        const installed = localStorage.getItem('pwa-installed')
        if (dismissed || installed) {
            return null
        }
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-[200] bg-[#1C1207] rounded-[28px] p-6 shadow-2xl shadow-black/20"
                >
                    <button onClick={handleDismiss} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Smartphone className="w-7 h-7 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-black text-sm uppercase tracking-wider">Install NextPlate</h3>
                            <p className="text-white/40 text-xs font-medium mt-1">
                                Get instant access with push notifications, offline support, and a native app experience.
                            </p>
                            <button onClick={handleInstall}
                                className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/30">
                                <Download className="w-4 h-4" />
                                Install App
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
