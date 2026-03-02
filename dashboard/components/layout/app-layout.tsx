import React from 'react'
import { Sidebar } from '@/components/navigation/sidebar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { RoleBadge } from '@/components/layout/role-badge'
import { DarkModeToggle } from '@/components/layout/dark-mode-toggle'
import { LanguageSelector } from '@/components/layout/language-selector'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FFF8F0] dark:bg-[#0a0a0a] relative overflow-hidden font-body">
      {/* ═══ GRAIN OVERLAY ═══ */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <Sidebar />
      <main id="main-content" role="main" className="flex-1 overflow-auto lg:pl-[300px] xl:pl-[320px] relative z-10">
        {/* ═══ TOP BAR ═══ */}
        <header role="banner" className="sticky top-0 z-30 flex items-center justify-end gap-3 md:gap-4 px-4 md:px-8 lg:px-12 py-3 md:py-4 bg-[#FFF8F0]/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg">
          <LanguageSelector />
          <DarkModeToggle />
          <RoleBadge />
          <NotificationBell />
        </header>
        <section aria-label="Page Content" className="px-4 md:px-8 lg:px-12 pb-12 max-w-[1800px] mx-auto">{children}</section>
      </main>
    </div>
  )
}

