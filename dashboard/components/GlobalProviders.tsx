'use client'

import React from 'react'
import { useNotifications } from '@/hooks/use-notifications'
import { StitchChat } from '@/components/chat/StitchChat'
import { EchoListener } from '@/components/notifications/EchoListener'
import { SocketProvider } from '@/contexts/socket-context'
import { ThemeProvider } from 'next-themes'
import { I18nProvider } from '@/contexts/i18n-context'
import { PWAInstallPrompt } from '@/components/pwa/install-prompt'
import { ProductTour } from '@/components/onboarding/product-tour'

/**
 * GlobalProviders
 * Client component wrapper that activates:
 * 1. Firebase Push Notification registration
 * 2. Stitch AI floating chat widget
 * 3. Echo price-drop notification listener
 * 4. Socket.IO Real-time context
 * 5. Theme context (Light/Dark mode)
 * 6. i18n (Multi-language)
 * 7. PWA Install Prompt
 * Must be rendered inside AuthContext (after login checks)
 */
export function GlobalProviders({ children }: { children: React.ReactNode }) {
    useNotifications()

    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <I18nProvider>
                <SocketProvider>
                    {children}
                    <StitchChat />
                    <EchoListener />
                    <PWAInstallPrompt />
                    <ProductTour />
                </SocketProvider>
            </I18nProvider>
        </ThemeProvider>
    )
}
