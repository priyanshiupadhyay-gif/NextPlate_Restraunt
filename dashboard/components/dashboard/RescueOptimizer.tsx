'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, Package, Timer, Zap, ChevronRight, ShieldCheck, TrendingUp, Compass, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'

interface RouteStop {
    id: string
    name: string
    restaurant: string
    address: string
    reason: string
    estimatedImpact: string
}

export function RescueOptimizer() {
    const [route, setRoute] = useState<RouteStop[]>([])
    const [loading, setLoading] = useState(false)
    const [hasCalculated, setHasCalculated] = useState(false)

    const handleGenerateRoute = async () => {
        setLoading(true)
        try {
            // For demo, we use mock coordinates (Delhi)
            const res = await api.get('/ngo/route-optimizer?currentLat=28.6139&currentLng=77.2090')
            if (res.data.success) {
                setRoute(res.data.route || [])
                setHasCalculated(true)
            }
        } catch (error) {
            console.warn('Navigation node out of sync')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-[#1C1207] rounded-[48px] p-10 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 blur-[120px] rounded-full -mr-48 -mt-48 transition-transform group-hover:scale-110" />

            <div className="relative z-10 space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-600 rounded-lg">
                                <Compass className="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-display font-black tracking-tight uppercase">Stitch Navigator</h2>
                        </div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Optimizing local rescue trajectories</p>
                    </div>

                    <Button
                        disabled={loading}
                        onClick={handleGenerateRoute}
                        className="rounded-full px-10 py-8 bg-white text-[#1C1207] hover:bg-orange-600 hover:text-white transition-all font-black text-xs uppercase tracking-[0.3em] gap-3 shadow-2xl shadow-white/5 active:scale-95"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {hasCalculated ? 'Recalculate Grid' : 'Initialize Trajectory'}
                    </Button>
                </div>

                {!hasCalculated ? (
                    <div className="py-20 flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                            <Navigation className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-sm font-medium text-white/40 max-w-sm">
                            Current grid status: UNSTABLE. Initialize navigator to identify high-impact multi-stop rescue routes.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {route.length === 0 ? (
                            <div className="p-10 bg-white/5 rounded-[32px] border border-white/10 text-center">
                                <p className="text-sm font-bold text-white/60">No high-priority rescue signals detected in your immediate sector.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {route.map((stop, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex flex-col md:flex-row md:items-center gap-6 p-8 bg-white/5 rounded-[32px] border border-white/10 hover:bg-white/10 transition-colors group/stop"
                                    >
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-xs font-black shadow-lg shadow-orange-600/20">
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black tracking-tight">{stop.restaurant}</h3>
                                                <p className="text-xs text-white/40 font-medium flex items-center gap-2">
                                                    <MapPin className="w-3 h-3" />
                                                    {stop.address}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 md:px-10 border-l border-white/5">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Payload</p>
                                                <p className="text-sm font-bold text-orange-400">{stop.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Impact</p>
                                                <p className="text-sm font-bold text-emerald-400">{stop.estimatedImpact}</p>
                                            </div>
                                        </div>

                                        <div className="max-w-xs space-y-2">
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                <p className="text-[9px] font-medium leading-relaxed italic text-white/60">"{stop.reason}"</p>
                                            </div>
                                        </div>

                                        <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-600 transition-all">
                                            <Navigation className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                ))}

                                <div className="pt-6 flex items-center justify-center gap-10">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/20">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        Path Efficiency: 92%
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/20">
                                        <Timer className="w-4 h-4 text-orange-500" />
                                        Estimated Window: 1h 15m
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
