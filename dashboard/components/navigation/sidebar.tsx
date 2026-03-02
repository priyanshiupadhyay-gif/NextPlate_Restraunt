'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Menu,
  X,
  DollarSign,
  Settings,
  QrCode,
  CheckCircle,
  Store,
  AlertTriangle,
  PieChart,
  CreditCard,
  MessageSquare,
  ArrowLeftRight,
  LogOut,
  Soup,
  Search,
  Brain,
  Globe,
  Heart,
  ShieldCheck,
  FlaskConical,
  Star,
  Trophy
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, UserRole } from '@/contexts/auth-context'
import { getRoleConfig } from '@/lib/currency'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const RESTAURANT_NAV: NavItem[] = [
  { label: 'Control Center', href: '/restaurant', icon: LayoutDashboard },
  { label: 'Signal Emission', href: '/add-item', icon: Package },
  { label: 'Surplus Monitor', href: '/manage-listings', icon: Search },
  { label: 'Node Activity', href: '/orders', icon: ShoppingCart },
  { label: 'AI Rescue Engine', href: '/ai-rescue', icon: Brain },
  { label: 'Stitch Insights', href: '/stitch-insights', icon: Brain },
  { label: 'Recipe Alchemist', href: '/recipe-alchemist', icon: FlaskConical },
  { label: 'Value Capture', href: '/earnings', icon: TrendingUp },
  { label: 'Financial Flow', href: '/payouts', icon: DollarSign },
  { label: 'Packet Verify', href: '/qr-scanner', icon: QrCode },
  { label: 'Hall of Fame', href: '/leaderboard', icon: Trophy },
  { label: 'Protocol Config', href: '/settings', icon: Settings },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Command Center', href: '/admin', icon: LayoutDashboard },
  { label: 'Node Approval', href: '/admin/approvals', icon: CheckCircle },
  { label: 'Grid Registry', href: '/admin/restaurants', icon: Store },
  { label: 'Stream Monitor', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Anomaly Refund', href: '/admin/refunds', icon: AlertTriangle },
  { label: 'Meta Finance', href: '/admin/finance', icon: PieChart },
  { label: 'Capital Outflow', href: '/admin/payouts', icon: CreditCard },
  { label: 'Citizen Review', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Hall of Fame', href: '/leaderboard', icon: Trophy },
]

const NGO_NAV: NavItem[] = [
  { label: 'Rescue Protocol', href: '/ngo', icon: LayoutDashboard },
  { label: 'AI Rescue Engine', href: '/ai-rescue', icon: Brain },
  { label: 'Rescue Audit', href: '/rescue-audit', icon: ShieldCheck },
  { label: 'Recipe Alchemist', href: '/recipe-alchemist', icon: FlaskConical },
  { label: 'Resilience Mesh', href: '/live-map', icon: Globe },
  { label: 'Feed the Grid', href: '/community', icon: Heart },
  { label: 'Impact Ledger', href: '/impact-stats', icon: TrendingUp },
  { label: 'Hall of Fame', href: '/leaderboard', icon: Trophy },
  { label: 'Node Settings', href: '/settings', icon: Settings },
]

const USER_NAV: NavItem[] = [
  { label: 'Surplus Grid', href: '/feed', icon: LayoutDashboard },
  { label: 'Resilience Mesh', href: '/live-map', icon: Globe },
  { label: 'Feed the Grid', href: '/community', icon: Heart },
  { label: 'Grid Reviews', href: '/reviews', icon: Star },
  { label: 'Personal Impact', href: '/impact-stats', icon: TrendingUp },
  { label: 'Hall of Fame', href: '/leaderboard', icon: Trophy },
  { label: 'Dispatch Logs', href: '/orders', icon: ShoppingCart },
  { label: 'Grid Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { user, role, setRole, logout } = useAuth()

  const navItems = role === 'restaurant'
    ? RESTAURANT_NAV
    : role === 'admin'
      ? ADMIN_NAV
      : role === 'ngo'
        ? NGO_NAV
        : USER_NAV

  const roleLabel = role === 'restaurant'
    ? 'Restaurant Panel'
    : role === 'admin'
      ? 'Admin Panel'
      : role === 'ngo'
        ? 'NGO Rescue Protocol'
        : 'Rescuer Dashboard'

  const isActiveLink = (href: string) => {
    if (href === '/' || href === '/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const toggleRole = () => {
    setRole(role === 'restaurant' ? 'admin' : 'restaurant')
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-8 left-8 z-50 lg:hidden p-3 bg-[#1C1207] text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed left-0 top-0 h-screen w-[280px] lg:w-[300px] xl:w-[320px] bg-white/70 dark:bg-[#111111]/90 backdrop-blur-3xl border-r border-[#1C1207]/5 dark:border-white/5 z-40 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] lg:translate-x-0 flex flex-col`}
      >
        {/* Logo Section */}
        <div className="p-6 lg:p-10 pb-6 lg:pb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
            <div className="w-10 h-10 bg-[#1C1207] rounded-xl flex items-center justify-center text-white shadow-2xl group-hover:rotate-12 transition-transform duration-500">
              <Soup className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-display font-black text-[#1C1207] dark:text-white tracking-tight leading-none">NextPlate</h1>
              <span className="text-[9px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-[0.4em] mt-1.5 leading-none">Global Protocol</span>
            </div>
          </Link>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-[#1C1207]/40 dark:text-white/40 uppercase tracking-[0.2em]">{roleLabel}</p>
            <div className="h-[1px] w-12 bg-orange-500" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 lg:px-6 space-y-1 lg:space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveLink(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-[20px] lg:rounded-[24px] text-[12px] lg:text-[13px] font-bold transition-all duration-500 relative group ${isActive
                  ? 'bg-[#1C1207] dark:bg-white text-white dark:text-[#1C1207] shadow-[0_20px_40px_-10px_rgba(28,18,7,0.2)] dark:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)]'
                  : 'text-[#1C1207]/50 dark:text-white/50 hover:text-[#1C1207] dark:hover:text-white hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-white/5'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-[#1C1207] dark:bg-white rounded-[24px] -z-10"
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}
                <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${isActive ? 'text-orange-500' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="tracking-tight">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Action Buttons - Removed Visual Manifesto and Switch role as requested */}

        {/* Protocol Sync - Removed as requested */}

        {/* Legal Links */}
        <div className="px-10 py-4 flex flex-wrap gap-4 border-t border-[#1C1207]/5 dark:border-white/5 mx-6">
          <Link href="/terms" className="text-[10px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-[0.1em] hover:text-orange-500 transition-colors">Terms</Link>
          <span className="w-1 h-1 rounded-full bg-[#1C1207]/10 dark:bg-white/10 self-center" />
          <Link href="/privacy" className="text-[10px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-[0.1em] hover:text-orange-500 transition-colors">Privacy</Link>
          <span className="w-1 h-1 rounded-full bg-[#1C1207]/10 dark:bg-white/10 self-center" />
          <a href="https://restraunt-charity.onrender.com/api-docs" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-[0.1em] hover:text-orange-500 transition-colors">API</a>
        </div>

        {/* User Footer */}
        <div className="p-6">
          {(() => {
            const rc = getRoleConfig(role || 'user'); return (
              <div className="flex items-center gap-4 px-6 py-5 rounded-[32px] bg-white dark:bg-white/10 border border-[#1C1207]/5 dark:border-white/10 shadow-sm group hover:shadow-xl transition-all duration-500">
                <div className="w-12 h-12 bg-[#1C1207] rounded-full flex items-center justify-center text-white font-black text-lg relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
                  <span className="relative z-10">{user?.name?.charAt(0) || 'U'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-[#1C1207] dark:text-white truncate tracking-tight">{user?.name || 'Anonymous Rescuer'}</p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${rc.bgColor} ${rc.color} ${rc.borderColor}`}>
                    <span>{rc.emoji}</span>
                    <span>{rc.badge}</span>
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-3 text-[#1C1207]/20 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[18px] transition-all duration-300 group/logout"
                  title="Terminate Session"
                >
                  <LogOut className="w-5 h-5 group-hover/logout:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })()}
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1C1207]/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}
