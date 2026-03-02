'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { aiService, RescueStrategy } from '@/lib/ai-service'
import {
    Brain,
    Loader2,
    Leaf,
    Droplets,
    Clock,
    ChefHat,
    Package,
    AlertTriangle,
    Sparkles,
    RefreshCw,
    Utensils,
    Truck,
    Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIRescuePage() {
    const [strategy, setStrategy] = useState<RescueStrategy | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [noData, setNoData] = useState(false)
    const [aiConfigured, setAiConfigured] = useState(true)

    const fetchStrategy = async () => {
        setIsLoading(true)
        setNoData(false)
        try {
            const res = await aiService.getRescueStrategy()
            if (res.success && res.data) {
                setStrategy(res.data)
            } else {
                setNoData(true)
                setStrategy(null)
            }
        } catch {
            setNoData(true)
        } finally {
            setIsLoading(false)
        }
    }

    const checkAIStatus = async () => {
        const status = await aiService.getStatus()
        setAiConfigured(status.aiConfigured)
    }

    useEffect(() => {
        fetchStrategy()
        checkAIStatus()
    }, [])

    return (
        <AppLayout>
            <div className="space-y-12 pb-32 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                            <Brain className="w-3" />
                            {aiConfigured ? 'Gemini 1.5 Flash' : 'Deterministic Fallback'}
                        </div>
                        <h1 className="text-6xl font-display font-black text-[#1C1207] tracking-tighter leading-none uppercase">AI Rescue Engine</h1>
                        <p className="text-[#1C1207]/50 font-medium max-w-xl text-lg">
                            Neural network analyzes expiring surplus across the grid and generates real-time rescue strategies with recipes, nutrition data, and distribution plans.
                        </p>
                    </div>

                    <button
                        onClick={fetchStrategy}
                        disabled={isLoading}
                        className="px-10 py-5 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:bg-purple-600 transition-all shadow-2xl flex items-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        {isLoading ? 'ANALYZING...' : 'RE-SCAN GRID'}
                    </button>
                </div>

                {/* AI Status Banner */}
                {!aiConfigured && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-[32px] p-8 flex items-center gap-6"
                    >
                        <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="font-display font-black text-[#1C1207]">RUNNING IN FALLBACK MODE</h3>
                            <p className="text-sm text-[#1C1207]/50">
                                Add your free <strong>GEMINI_API_KEY</strong> to <code className="bg-amber-100 px-2 py-0.5 rounded">.env</code> for real AI-powered strategies. Get one at{' '}
                                <a href="https://aistudio.google.com/apikey" target="_blank" className="text-purple-600 underline">aistudio.google.com</a>
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Loading State */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-40 text-center space-y-8"
                        >
                            <div className="w-24 h-24 rounded-[32px] bg-purple-50 flex items-center justify-center mx-auto relative">
                                <Brain className="w-12 h-12 text-purple-600 animate-pulse" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-display font-black text-[#1C1207]">Neural Mesh Computing...</h3>
                                <p className="text-sm text-[#1C1207]/40 font-bold uppercase tracking-widest mt-2">Analyzing {aiConfigured ? 'via Gemini LLM' : 'via local heuristics'}</p>
                            </div>
                        </motion.div>
                    ) : noData ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-40 bg-white border border-[#1C1207]/5 rounded-[56px] text-center space-y-8"
                        >
                            <div className="w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center mx-auto text-emerald-600">
                                <Leaf className="w-12 h-12" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-display font-black text-emerald-600 uppercase">Grid Stable</h3>
                                <p className="text-[#1C1207]/40 font-medium max-w-md mx-auto">
                                    No surplus items are currently expiring. The neighborhood network is operating at optimal efficiency.
                                </p>
                            </div>
                        </motion.div>
                    ) : strategy ? (
                        <motion.div
                            key="strategy"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-10"
                        >
                            {/* Strategy Header */}
                            <div className="bg-[#1C1207] rounded-[48px] p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full -mr-32 -mt-32" />
                                <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${strategy.priority === 'URGENT' ? 'bg-red-600 text-white' :
                                                    strategy.priority === 'HIGH' ? 'bg-orange-600 text-white' :
                                                        'bg-yellow-500 text-black'
                                                }`}>
                                                {strategy.priority}
                                            </span>
                                            {strategy.aiPowered && (
                                                <span className="px-4 py-1 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> AI Generated
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-4xl font-display font-black tracking-tight leading-tight">{strategy.title}</h2>
                                        <p className="text-white/40 text-sm font-medium uppercase tracking-widest">{strategy.itemsAnalyzed} items analyzed • {new Date(strategy.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Impact Grid */}
                            {strategy.impactEstimate && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Meals Created', value: strategy.impactEstimate.mealsCreated, icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
                                        { label: 'CO₂ Saved', value: `${strategy.impactEstimate.carbonSavedKg}kg`, icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Water Saved', value: `${strategy.impactEstimate.waterSavedLiters}L`, icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50' },
                                        { label: 'Waste Prevented', value: `${strategy.impactEstimate.wastePreventedKg}kg`, icon: Package, color: 'text-pink-600', bg: 'bg-pink-50' },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`${stat.bg} rounded-[32px] p-8 text-center space-y-4 border border-[#1C1207]/5`}
                                        >
                                            <stat.icon className={`w-8 h-8 ${stat.color} mx-auto`} />
                                            <div>
                                                <p className="text-3xl font-display font-black text-[#1C1207]">{stat.value}</p>
                                                <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest mt-1">{stat.label}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Urgency Note */}
                            {strategy.urgencyNote && (
                                <div className="bg-red-50 border border-red-200 rounded-[32px] p-8 flex items-center gap-6">
                                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <p className="text-red-800 font-bold text-sm">{strategy.urgencyNote}</p>
                                </div>
                            )}

                            {/* Recipe Suggestions */}
                            {strategy.recipeSuggestions && strategy.recipeSuggestions.length > 0 && (
                                <div className="space-y-8">
                                    <h3 className="text-3xl font-display font-black text-[#1C1207] tracking-tight flex items-center gap-3">
                                        <ChefHat className="w-8 h-8 text-orange-600" />
                                        RESCUE RECIPES
                                    </h3>

                                    {strategy.recipeSuggestions.map((recipe, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.15 }}
                                            className="bg-white border border-[#1C1207]/5 rounded-[48px] p-10 space-y-8"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h4 className="text-2xl font-display font-black text-[#1C1207] tracking-tight">{recipe.name}</h4>
                                                    <p className="text-[#1C1207]/50 font-medium mt-1">{recipe.description}</p>
                                                </div>
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    <div className="bg-orange-50 px-5 py-3 rounded-2xl text-center border border-orange-100">
                                                        <p className="text-xl font-black text-orange-600">{recipe.servings}</p>
                                                        <p className="text-[9px] font-black text-orange-600/50 uppercase tracking-widest">Servings</p>
                                                    </div>
                                                    <div className="bg-blue-50 px-5 py-3 rounded-2xl text-center border border-blue-100">
                                                        <p className="text-xl font-black text-blue-600">{recipe.prepTimeMinutes}m</p>
                                                        <p className="text-[9px] font-black text-blue-600/50 uppercase tracking-widest">Prep Time</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Nutrition */}
                                            {recipe.nutritionEstimate && (
                                                <div className="grid grid-cols-4 gap-4">
                                                    {[
                                                        { label: 'Calories', value: recipe.nutritionEstimate.calories },
                                                        { label: 'Protein', value: recipe.nutritionEstimate.protein },
                                                        { label: 'Carbs', value: recipe.nutritionEstimate.carbs },
                                                        { label: 'Fat', value: recipe.nutritionEstimate.fat },
                                                    ].map((n, i) => (
                                                        <div key={i} className="bg-[#FFF8F0] rounded-2xl p-4 text-center border border-[#1C1207]/5">
                                                            <p className="text-lg font-black text-[#1C1207]">{n.value}</p>
                                                            <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">{n.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Steps */}
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em]">Preparation Protocol</p>
                                                {recipe.steps.map((step, i) => (
                                                    <div key={i} className="flex gap-4 items-start">
                                                        <span className="text-[10px] font-black text-orange-600 mt-1">{String(i + 1).padStart(2, '0')}</span>
                                                        <p className="text-sm font-medium text-[#1C1207]/60 leading-relaxed">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Distribution Plan */}
                            {strategy.distributionPlan && (
                                <div className="bg-[#1C1207] rounded-[48px] p-10 text-white space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                                    <h3 className="text-2xl font-display font-black tracking-tight flex items-center gap-3 relative z-10">
                                        <Truck className="w-7 h-7 text-emerald-500" />
                                        DISTRIBUTION PROTOCOL
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-8 relative z-10">
                                        {[
                                            { label: 'Recommended NGOs', value: strategy.distributionPlan.recommendedNGOs, icon: Shield },
                                            { label: 'Packaging Advice', value: strategy.distributionPlan.packagingAdvice, icon: Package },
                                            { label: 'Shelf Life', value: strategy.distributionPlan.shelfLife, icon: Clock },
                                            { label: 'Transport Notes', value: strategy.distributionPlan.transportNotes, icon: Truck },
                                        ].map((item, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 rounded-[28px] p-8 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-5 h-5 text-emerald-500" />
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{item.label}</p>
                                                </div>
                                                <p className="text-white/60 text-sm font-medium leading-relaxed">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </AppLayout>
    )
}
