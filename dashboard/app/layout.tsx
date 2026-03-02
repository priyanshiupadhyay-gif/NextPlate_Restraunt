import React from "react"
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { RouteGuard } from '@/components/auth/route-guard'
import { GlobalProviders } from '@/components/GlobalProviders'

import { Toaster } from 'sonner'

import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  title: 'NextPlate - Zero Waste Network',
  description: 'Restaurant surplus food management platform - Dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'NextPlate',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#1C1207',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className={`${dmSans.className} antialiased`}>
        <AuthProvider>
          <RouteGuard>
            <GlobalProviders>
              {children}
              <Toaster position="top-center" richColors />
            </GlobalProviders>
          </RouteGuard>
        </AuthProvider>
      </body>
    </html>
  )
}

