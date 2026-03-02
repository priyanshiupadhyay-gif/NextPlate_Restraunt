'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Leaf, Soup, Users, Zap, Quote, ChevronRight, BarChart3 } from 'lucide-react'
import api from '@/lib/api'

interface DailySummary {
    headline: string
    summary: string
    highlights: string[]
    mood: string
    stitchQuote: string
    generatedBy: string
    generatedAt: string
    metrics: {
        todayMeals: number
        todayCO2: number
        todayOrders: number
        activeUsers: number
    }
}

export function DailyImpactSummary() {
    const [summary, setSummary] = useState<DailySummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await api.get('/daily-summary')
                if (res.data.success) {
                    setSummary(res.data.summary)
                }
            } catch (error) {
                console.warn('Daily summary unavailable')
            } finally {
                setLoading(false)
            }
        }
        fetchSummary()
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] p-8 border border-[#1C1207]/5 shadow-sm animate-pulse">
                <div className="h-4 w-48 bg-neutral-100 rounded-full mb-6" />
                <div className="h-8 w-full bg-neutral-100 rounded-full mb-4" />
                <div className="h-20 w-full bg-neutral-50 rounded-[20px] mb-6" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-neutral-50 rounded-[20px]" />
                    <div className="h-16 bg-neutral-50 rounded-[20px]" />
                </div>
            </div>
        )
    }

    if (!summary) return null

    const moodColors: Record<string, string> = {
        thriving: 'from-emerald-500 to-teal-600',
        growing: 'from-blue-500 to-indigo-600',
        steady: 'from-orange-500 to-amber-600',
        quiet: 'from-neutral-500 to-slate-600',
        launching: 'from-violet-500 to-purple-600'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white rounded-[32px] border border-[#1C1207]/5 shadow-2xl shadow-black/5"
        >
            {/* Mood Accent */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${moodColors[summary.mood] || moodColors.steady}`} />

            <div className="p-8 lg:p-10 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">
                            <Zap className="w-3 h-3" />
                            Intelligence Pulse
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black text-[#1C1207] tracking-tighter leading-none">
                            {summary.headline}
                        </h2>
                    </div>
                    <div className="flex items-center -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-neutral-100 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                            </div>
                        ))}
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600">
                            +{summary.metrics?.activeUsers || 0}
                        </div>
                    </div>
                </div>

                {/* AI Insight Box */}
                <div className="relative group p-6 lg:p-8 bg-neutral-50 rounded-[28px] border border-[#1C1207]/[0.03] hover:bg-neutral-100/50 transition-all duration-500">
                    <Quote className="absolute top-6 right-8 w-12 h-12 text-[#1C1207]/[0.02] group-hover:scale-110 transition-transform" />
                    <p className="text-lg lg:text-xl font-medium text-[#1C1207]/70 leading-relaxed relative z-10">
                        {summary.summary}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                            <span className="text-[10px] text-white font-black">S</span>
                        </div>
                        <span className="text-xs font-bold text-[#1C1207]/40">Stitch's Daily Insight</span>
                    </div>
                </div>

                {/* Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {summary.highlights.map((highlight, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -4 }}
                            className="p-4 bg-white border border-[#1C1207]/5 rounded-[22px] flex items-center gap-4 hover:shadow-lg hover:shadow-black/5 transition-all"
                        >
                            <div className="text-xl">{highlight.split(' ')[0]}</div>
                            <p className="text-[11px] font-black text-[#1C1207]/60 uppercase tracking-widest leading-tight">
                                {highlight.split(' ').slice(1).join(' ')}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Area */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t border-[#1C1207]/5 gap-6">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#1C1207]/20 uppercase tracking-widest">Rescues Today</span>
                            <span className="text-2xl font-black text-[#1C1207]">{summary.metrics?.todayOrders || 0}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#1C1207]/20 uppercase tracking-widest">CO2 Diverted</span>
                            <span className="text-2xl font-black text-[#1C1207]">{summary.metrics?.todayCO2 || 0}kg</span>
                        </div>
                    </div>

                    <button className="flex items-center gap-2 px-6 py-3 bg-[#1C1207] text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                        Explore Mesh
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
