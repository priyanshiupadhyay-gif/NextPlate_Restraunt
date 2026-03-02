'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Brain,
    Sparkles,
    TrendingDown,
    Clock,
    AlertTriangle,
    Zap,
    ChefHat,
    Leaf,
    Droplets,
    RefreshCw,
    ArrowDown,
    DollarSign,
    Loader2,
    BarChart3,
    Users,
    Package
} from 'lucide-react'
import api from '@/lib/api'

interface PredictiveItem {
    itemId: string; name: string; restaurant: string; currentQuantity: number
    predictedLeftover: number; hoursUntilExpiry: number; riskLevel: string; recommendation: string
}

interface DynamicPriceItem {
    itemId: string; name: string; originalPrice: number; currentPrice: number
    suggestedPrice: number; suggestedDiscount: number; hoursLeft: number; reasoning: string
}

interface Recipe {
    name: string; description: string; itemsUsed: string[]; servings: number; prepTimeMinutes: number
}

interface StitchData {
    timestamp: string
    todayPattern: { day: string; expectedOrders: number; trend: string }
    predictiveSurplus: PredictiveItem[]
    dynamicPricing: DynamicPriceItem[]
    recipeSuggestions: Recipe[]
    networkStats: { totalActiveItems: number; totalOrdersThisWeek: number; busiestDay: string }
}

export default function StitchInsightsPage() {
    const [data, setData] = useState<StitchData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'predict' | 'pricing' | 'recipes'>('predict')

    const fetchInsights = async () => {
        setIsLoading(true)
        try {
            const res = await api.get('/ai/stitch-insights')
            if (res.data.success) setData(res.data.data)
        } catch (err) {
            console.error('Failed to fetch Stitch insights', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchInsights() }, [])

    const riskColors: Record<string, string> = {
        critical: 'bg-red-500 text-white',
        high: 'bg-orange-500 text-white',
        moderate: 'bg-emerald-500 text-white'
    }

    const tabs = [
        { id: 'predict' as const, label: 'Predictive Surplus', icon: Brain, color: 'text-purple-500' },
        { id: 'pricing' as const, label: 'Dynamic Pricing', icon: DollarSign, color: 'text-orange-500' },
        { id: 'recipes' as const, label: 'Recipe Engine', icon: ChefHat, color: 'text-emerald-500' }
    ]

    if (isLoading) {
        return (
            <AppLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                        <Brain className="w-16 h-16 text-purple-500" />
                    </motion.div>
                    <div className="text-center space-y-2">
                        <p className="text-2xl font-display font-black text-[#1C1207] uppercase tracking-tight">Stitch is Thinking...</p>
                        <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em]">Analyzing surplus patterns across the network</p>
                    </div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-12 pb-32">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[18px] flex items-center justify-center shadow-xl shadow-purple-500/20">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-50 rounded-full border border-purple-100">
                                <Sparkles className="w-3 h-3 text-purple-500" />
                                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">AI-Powered</span>
                            </div>
                        </div>
                        <h1 className="text-6xl font-display font-black text-[#1C1207] uppercase tracking-tighter leading-none">Stitch Insights</h1>
                        <p className="text-[#1C1207]/40 font-medium text-lg max-w-lg">
                            Neural analysis of surplus patterns, pricing optimization, and community meal planning.
                        </p>
                    </div>
                    <button onClick={fetchInsights} className="flex items-center gap-3 px-8 py-4 bg-white border border-[#1C1207]/5 rounded-[22px] text-[10px] font-black uppercase tracking-widest hover:bg-[#1C1207] hover:text-white transition-all group">
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        Refresh Neural Map
                    </button>
                </div>

                {/* Network Stats */}
                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#1C1207] text-white rounded-[36px] p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                            <div className="relative z-10 space-y-3">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">{data.todayPattern.day}</p>
                                <p className="text-4xl font-display font-black tracking-tighter">{data.todayPattern.expectedOrders}</p>
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Orders Today</p>
                            </div>
                        </motion.div>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white border border-[#1C1207]/5 rounded-[36px] p-8">
                            <div className="space-y-3">
                                <Package className="w-6 h-6 text-orange-500" />
                                <p className="text-4xl font-display font-black text-[#1C1207] tracking-tighter">{data.networkStats.totalActiveItems}</p>
                                <p className="text-[#1C1207]/30 text-[10px] font-black uppercase tracking-widest">Live Surplus Items</p>
                            </div>
                        </motion.div>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white border border-[#1C1207]/5 rounded-[36px] p-8">
                            <div className="space-y-3">
                                <BarChart3 className="w-6 h-6 text-blue-500" />
                                <p className="text-4xl font-display font-black text-[#1C1207] tracking-tighter">{data.networkStats.totalOrdersThisWeek}</p>
                                <p className="text-[#1C1207]/30 text-[10px] font-black uppercase tracking-widest">Orders This Week</p>
                            </div>
                        </motion.div>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-emerald-50 border border-emerald-100 rounded-[36px] p-8">
                            <div className="space-y-3">
                                <Zap className="w-6 h-6 text-emerald-600" />
                                <p className="text-4xl font-display font-black text-emerald-600 tracking-tighter">{data.networkStats.busiestDay.slice(0, 3)}</p>
                                <p className="text-emerald-600/50 text-[10px] font-black uppercase tracking-widest">Peak Day</p>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-3">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id
                                    ? 'bg-[#1C1207] text-white shadow-2xl'
                                    : 'bg-white text-[#1C1207]/40 border border-[#1C1207]/5 hover:border-orange-200'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-orange-500' : tab.color}`} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'predict' && data && (
                        <motion.div key="predict" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                            <h2 className="text-3xl font-display font-black text-[#1C1207] uppercase tracking-tight">Surplus Forecast</h2>
                            {data.predictiveSurplus.length === 0 ? (
                                <div className="bg-white rounded-[40px] p-16 text-center border border-[#1C1207]/5">
                                    <Leaf className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                    <p className="text-[#1C1207]/40 font-bold">No active surplus items detected. Grid is clean!</p>
                                </div>
                            ) : (
                                data.predictiveSurplus.map((item, i) => (
                                    <motion.div key={item.itemId} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                                        className="bg-white rounded-[40px] p-8 border border-[#1C1207]/5 shadow-sm hover:shadow-xl transition-all flex items-center gap-8"
                                    >
                                        <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center text-xs font-black ${riskColors[item.riskLevel]}`}>
                                            {item.riskLevel === 'critical' ? <AlertTriangle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-lg font-black text-[#1C1207]">{item.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${riskColors[item.riskLevel]}`}>{item.riskLevel}</span>
                                            </div>
                                            <p className="text-[#1C1207]/40 text-sm font-medium">{item.restaurant}</p>
                                            <p className="text-[11px] font-bold text-[#1C1207]/60">{item.recommendation}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-3xl font-display font-black text-[#1C1207]">{item.currentQuantity}</p>
                                            <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest">units left</p>
                                            <p className="text-orange-600 text-xs font-bold">{item.hoursUntilExpiry}h remaining</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'pricing' && data && (
                        <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                            <h2 className="text-3xl font-display font-black text-[#1C1207] uppercase tracking-tight">Pricing Optimizer</h2>
                            {data.dynamicPricing.length === 0 ? (
                                <div className="bg-white rounded-[40px] p-16 text-center border border-[#1C1207]/5">
                                    <DollarSign className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                    <p className="text-[#1C1207]/40 font-bold">No items to optimize right now.</p>
                                </div>
                            ) : (
                                data.dynamicPricing.map((item, i) => (
                                    <motion.div key={item.itemId} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                                        className="bg-white rounded-[40px] p-8 border border-[#1C1207]/5 shadow-sm hover:shadow-xl transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-black text-[#1C1207]">{item.name}</h3>
                                                <p className="text-[11px] font-bold text-[#1C1207]/50">{item.reasoning}</p>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest mb-1">Current</p>
                                                    <p className="text-2xl font-black text-[#1C1207]">${item.currentPrice}</p>
                                                </div>
                                                <ArrowDown className="w-5 h-5 text-orange-500 animate-bounce" />
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Suggested</p>
                                                    <p className="text-2xl font-black text-emerald-600">${item.suggestedPrice}</p>
                                                </div>
                                                <div className="px-4 py-2 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    -{item.suggestedDiscount}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${100 - (item.hoursLeft / 8) * 100}%` }}
                                                className={`h-full rounded-full ${item.hoursLeft < 2 ? 'bg-red-500' : item.hoursLeft < 4 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                            />
                                        </div>
                                        <p className="text-[9px] text-[#1C1207]/20 font-black uppercase tracking-widest mt-2">{item.hoursLeft}h until expiry deadline</p>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'recipes' && data && (
                        <motion.div key="recipes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                            <h2 className="text-3xl font-display font-black text-[#1C1207] uppercase tracking-tight">Community Recipe Engine</h2>
                            <div className="grid md:grid-cols-3 gap-8">
                                {data.recipeSuggestions.map((recipe, i) => (
                                    <motion.div key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}
                                        className="bg-white rounded-[40px] p-10 border border-[#1C1207]/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group"
                                    >
                                        <div className="w-14 h-14 bg-emerald-50 rounded-[20px] flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <ChefHat className="w-7 h-7 text-emerald-600 group-hover:text-white transition-all" />
                                        </div>
                                        <h3 className="text-xl font-display font-black text-[#1C1207] uppercase tracking-tight mb-3">{recipe.name}</h3>
                                        <p className="text-[#1C1207]/50 text-sm font-medium mb-6 leading-relaxed">{recipe.description}</p>
                                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-[#1C1207]/30 mb-6">
                                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {recipe.servings} Servings</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {recipe.prepTimeMinutes}min</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {recipe.itemsUsed?.slice(0, 3).map((ingr, j) => (
                                                <span key={j} className="px-3 py-1.5 bg-[#FFF8F0] rounded-full text-[9px] font-black text-orange-600 uppercase tracking-widest border border-orange-100">{ingr?.slice(0, 20)}</span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    )
}
