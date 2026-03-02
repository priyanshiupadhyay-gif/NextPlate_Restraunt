'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Leaf, Clock, Star, ChevronRight, RefreshCw, ShoppingCart } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface RecommendedItem {
    _id: string
    name: string
    description: string
    category: string
    originalPrice: number
    discountedPrice: number
    discountPercentage: number
    images: string[]
    isVegetarian: boolean
    isVegan: boolean
    availableQuantity: number
    carbonScore: number
    restaurantName: string
    restaurantRating: number
    aiReason: string
    expiryTime?: string
}

export function RecommendationWidget() {
    const [items, setItems] = useState<RecommendedItem[]>([])
    const [insight, setInsight] = useState('')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [source, setSource] = useState('')

    const fetchRecommendations = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            const res = await api.get('/recommendations?limit=6')

            if (res.data.success) {
                setItems(res.data.recommendations || [])
                setInsight(res.data.aiInsight || '')
                setSource(res.data.source || '')
            }
        } catch (error: any) {
            if (!isRefresh) {
                // Silently fail on initial load — widget is non-critical
                console.warn('Recommendations unavailable')
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchRecommendations()
    }, [])

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-[16px] flex items-center justify-center animate-pulse">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="h-4 w-40 bg-[#1C1207]/5 rounded-lg animate-pulse" />
                        <div className="h-3 w-56 bg-[#1C1207]/5 rounded-lg animate-pulse mt-1" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white rounded-[24px] animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (items.length === 0) return null

    const categoryEmoji: Record<string, string> = {
        mains: '🍛', appetizers: '🥗', desserts: '🍰', beverages: '☕',
        breads: '🍞', rice: '🍚', combos: '🎁', snacks: '🥨',
        bakery: '🧁', dairy: '🥛', produce: '🥬', meat_seafood: '🍖',
        prepared_meals: '🍱', sides: '🥘', other: '📦'
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-[16px] flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#1C1207] uppercase tracking-wide">AI Picks For You</h3>
                        <p className="text-[10px] text-[#1C1207]/30 font-bold uppercase tracking-widest">
                            {source === 'gemini' ? 'Powered by Stitch AI' : 'Top Impact Items'}
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchRecommendations(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-violet-100 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </motion.button>
            </div>

            {/* AI Insight */}
            {insight && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-[16px] border border-violet-100"
                >
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                    <p className="text-[11px] text-violet-700 font-medium">{insight}</p>
                </motion.div>
            )}

            {/* Recommendation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                        <motion.div
                            key={item._id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.08 }}
                            className="group bg-white rounded-[24px] border border-[#1C1207]/[0.04] overflow-hidden hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 cursor-pointer"
                        >
                            {/* Top accent bar */}
                            <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

                            <div className="p-5 space-y-3">
                                {/* Category + Veg Badge */}
                                <div className="flex items-center justify-between">
                                    <span className="text-lg">{categoryEmoji[item.category] || '📦'}</span>
                                    <div className="flex items-center gap-1.5">
                                        {item.isVegetarian && (
                                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-green-100">Veg</span>
                                        )}
                                        <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-orange-100">
                                            {item.discountPercentage}% off
                                        </span>
                                    </div>
                                </div>

                                {/* Name */}
                                <h4 className="text-sm font-black text-[#1C1207] leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
                                    {item.name}
                                </h4>

                                {/* Restaurant */}
                                <p className="text-[10px] text-[#1C1207]/40 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                    {item.restaurantName}
                                </p>

                                {/* AI Reason */}
                                <div className="flex items-start gap-2 px-3 py-2 bg-violet-50/60 rounded-[12px]">
                                    <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-violet-600 font-medium leading-snug">{item.aiReason}</p>
                                </div>

                                {/* Price + CO2 */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-black text-[#1C1207]">${item.discountedPrice}</span>
                                        <span className="text-[11px] text-[#1C1207]/30 line-through">${item.originalPrice}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-600">
                                        <Leaf className="w-3 h-3" />
                                        <span className="text-[10px] font-bold">{item.carbonScore}kg CO₂</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
