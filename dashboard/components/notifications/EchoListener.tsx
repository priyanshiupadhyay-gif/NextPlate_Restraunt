'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, X, Zap, DollarSign, Clock, ArrowRight } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

interface EchoAlert {
    type: string
    userId: string
    title: string
    body: string
    data: {
        itemId: string
        itemName: string
        newPrice: number
        discount: number
        minutesLeft: number | null
    }
    receivedAt: number
}

export function EchoListener() {
    const { user } = useAuth()
    const router = useRouter()
    const [alerts, setAlerts] = useState<EchoAlert[]>([])
    const [visible, setVisible] = useState<EchoAlert | null>(null)
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        if (!(user as any)?._id) return

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
        const SOCKET_URL = API_URL.replace('/api/v1', '')

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
        socketRef.current = socket

        socket.on(`echo:${(user as any)._id}`, (notification: EchoAlert) => {
            const alert = { ...notification, receivedAt: Date.now() }
            setAlerts(prev => [alert, ...prev].slice(0, 10))
            setVisible(alert)

            // Auto-dismiss after 8 seconds
            setTimeout(() => {
                setVisible(prev => prev?.receivedAt === alert.receivedAt ? null : prev)
            }, 8000)
        })

        return () => {
            socket.disconnect()
        }
    }, [(user as any)?._id])

    const handleNavigate = (itemId: string) => {
        setVisible(null)
        router.push(`/feed?highlight=${itemId}`)
    }

    if (!user) return null

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -40, x: 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: -40, x: 20 }}
                    className="fixed top-6 right-6 z-[60] w-[380px]"
                >
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[28px] p-6 text-white shadow-2xl shadow-violet-500/30 relative overflow-hidden">
                        {/* Background pulse */}
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-transparent animate-pulse" />

                        <button
                            onClick={() => setVisible(null)}
                            className="absolute top-4 right-4 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-violet-200 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Echo Alert</span>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-lg font-black tracking-tight">{visible.data.itemName}</h4>
                                <p className="text-sm text-white/70 font-medium">{visible.body}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                    <DollarSign className="w-3 h-3 text-green-300" />
                                    <span className="text-xs font-black text-green-300">${visible.data.newPrice}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                    <Zap className="w-3 h-3 text-amber-300" />
                                    <span className="text-xs font-black text-amber-300">{visible.data.discount}% OFF</span>
                                </div>
                                {visible.data.minutesLeft && (
                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                                        <Clock className="w-3 h-3 text-red-300" />
                                        <span className="text-xs font-black text-red-300">{visible.data.minutesLeft}m left</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleNavigate(visible.data.itemId)}
                                className="w-full py-3 bg-white text-violet-700 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-violet-100 transition-colors active:scale-95"
                            >
                                Rescue Now <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
