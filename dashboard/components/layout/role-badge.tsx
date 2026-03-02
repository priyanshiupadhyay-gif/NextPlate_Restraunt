'use client'

import { useAuth } from '@/contexts/auth-context'
import { getRoleConfig } from '@/lib/currency'

export function RoleBadge() {
    const { user, role } = useAuth()
    const rc = getRoleConfig(role || 'user')

    if (!user) return null

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${rc.bgColor} ${rc.borderColor} transition-all duration-300 hover:scale-105`}>
            <span className="text-sm">{rc.emoji}</span>
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${rc.color}`}>
                {rc.badge}
            </span>
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        </div>
    )
}
