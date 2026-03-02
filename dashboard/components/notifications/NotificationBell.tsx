'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellRing, Check, CheckCheck, Package, X } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

interface Notification {
    _id: string
    type: string
    title: string
    body: string
    isRead: boolean
    createdAt: string
    data?: Record<string, string>
}

export function NotificationBell() {
    const { isAuthenticated } = useAuth()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return
        try {
            setLoading(true)
            const res = await api.get('/fcm/notifications?limit=15')
            if (res.data.success) {
                setNotifications(res.data.notifications || [])
                setUnreadCount(res.data.unreadCount || 0)
            }
        } catch (err) {
            console.warn('Failed to fetch notifications')
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch on mount and then poll every 30 seconds
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    // Close panel when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/fcm/notifications/${id}/read`)
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch { }
    }

    const markAllRead = async () => {
        try {
            await api.patch('/fcm/notifications/read-all')
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch { }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return '📦'
            case 'ready': return '🏃'
            case 'new_order': return '🔔'
            case 'new_surplus': return '🌱'
            case 'pickup_reminder': return '⏰'
            case 'cancelled': return '❌'
            case 'promotion': return '🎉'
            default: return '📋'
        }
    }

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        return `${Math.floor(hrs / 24)}d ago`
    }

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setOpen(o => !o)
                    if (!open) fetchNotifications()
                }}
                className="relative w-10 h-10 rounded-[14px] bg-white/60 backdrop-blur border border-[#1C1207]/8 flex items-center justify-center text-[#1C1207]/50 hover:text-[#1C1207] hover:bg-white transition-all"
            >
                {unreadCount > 0 ? (
                    <BellRing className="w-[18px] h-[18px] text-orange-600" />
                ) : (
                    <Bell className="w-[18px] h-[18px]" />
                )}

                {/* Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full px-1 shadow-lg shadow-red-500/30"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="absolute top-14 right-0 w-[370px] max-h-[480px] bg-white rounded-[24px] shadow-2xl shadow-black/10 border border-[#1C1207]/5 flex flex-col overflow-hidden z-50"
                    >
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C1207]/5 flex-shrink-0">
                            <div>
                                <p className="font-black text-[13px] text-[#1C1207]">Notifications</p>
                                <p className="text-[10px] text-[#1C1207]/30 font-bold uppercase tracking-widest">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-orange-50 transition-all"
                                    >
                                        <CheckCheck className="w-3 h-3" /> Mark all read
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-[10px] bg-neutral-50 flex items-center justify-center text-[#1C1207]/30 hover:text-[#1C1207] hover:bg-neutral-100 transition-all">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {loading && notifications.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-14 h-14 rounded-[18px] bg-neutral-50 flex items-center justify-center mb-3">
                                        <Bell className="w-6 h-6 text-[#1C1207]/15" />
                                    </div>
                                    <p className="text-sm font-bold text-[#1C1207]/30">No notifications yet</p>
                                    <p className="text-[10px] text-[#1C1207]/20 mt-1">Order updates and alerts will appear here</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <motion.div
                                        key={notification._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => !notification.isRead && markAsRead(notification._id)}
                                        className={`flex items-start gap-3 px-5 py-3.5 border-b border-[#1C1207]/[0.03] cursor-pointer transition-all group ${notification.isRead
                                            ? 'bg-white hover:bg-neutral-50'
                                            : 'bg-orange-50/50 hover:bg-orange-50'
                                            }`}
                                    >
                                        <div className="text-lg mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[12px] leading-snug ${notification.isRead ? 'font-medium text-[#1C1207]/60' : 'font-bold text-[#1C1207]'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-[11px] text-[#1C1207]/40 mt-0.5 line-clamp-2">{notification.body}</p>
                                            <p className="text-[9px] text-[#1C1207]/20 font-bold uppercase tracking-widest mt-1">{timeAgo(notification.createdAt)}</p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
