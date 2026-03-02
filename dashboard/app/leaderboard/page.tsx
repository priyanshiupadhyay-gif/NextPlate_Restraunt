'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import {
    Trophy,
    Medal,
    Star,
    TrendingUp,
    Users,
    ShieldCheck,
    Store,
    Flame,
    Award,
    Zap,
    Loader2,
    RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { toast } from 'sonner'

interface LeaderboardEntry {
    id: string
    name: string
    avatar: string
    role: 'user' | 'restaurant' | 'ngo'
    score: number
    impact: string
    rank: number
    trend: 'up' | 'down' | 'stable'
}

export default function LeaderboardPage() {
    const [category, setCategory] = useState('overall')
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSimulating, setIsSimulating] = useState(false)

    const fetchLeaderboard = async (cat: string) => {
        setIsLoading(true)
        try {
            const res = await api.get(`/impact/leaderboard?category=${cat}`)
            setEntries(res.data.data || [])
        } catch {
            setEntries([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLeaderboard(category)
    }, [category])

    // Simulator form state
    const [showSimulator, setShowSimulator] = useState(false)
    const [restaurants, setRestaurants] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [simForm, setSimForm] = useState({
        restaurantId: '',
        userId: '',
        itemName: 'Paneer Tikka Platter',
        quantity: 2,
        price: 150
    })

    const ITEM_PRESETS = [
        'Paneer Tikka Platter', 'Veg Biryani Family Pack', 'Dal Makhani Bowl',
        'Butter Chicken Combo', 'Mixed Grill Box', 'Fresh Naan Basket',
        'Chole Bhature Set', 'Rajma Chawal Bowl', 'Masala Dosa Combo',
        'Idli Sambar Plate', 'Pav Bhaji Special', 'Samosa Party Pack'
    ]

    const fetchSimulatorData = async () => {
        try {
            const [restRes, userRes] = await Promise.all([
                api.get('/restaurants'),
                api.get('/admin/users').catch(() => ({ data: { data: [] } }))
            ])
            setRestaurants(restRes.data.data || restRes.data.restaurants || [])
            setUsers(userRes.data.data || userRes.data.users || [])
        } catch {
            // Fallback — try leaderboard data
            toast.error('Could not load simulator data')
        }
    }

    const handleOpenSimulator = () => {
        setShowSimulator(true)
        fetchSimulatorData()
    }

    const handleSimulateSingle = async () => {
        if (!simForm.restaurantId || !simForm.userId) {
            toast.error('Select a restaurant and user')
            return
        }
        setIsSimulating(true)
        try {
            const co2 = parseFloat((simForm.quantity * (Math.random() * 1.2 + 0.5)).toFixed(2))
            const res = await api.post('/impact/simulate-single', {
                restaurantId: simForm.restaurantId,
                customerId: simForm.userId,
                itemName: simForm.itemName,
                quantity: simForm.quantity,
                price: simForm.price,
                co2
            })
            toast.success(`✅ ${simForm.itemName} rescued from ${restaurants.find(r => r._id === simForm.restaurantId)?.name || 'restaurant'}!`)
            fetchLeaderboard(category)
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Simulation failed')
        } finally {
            setIsSimulating(false)
        }
    }

    const handleBulkSimulate = async () => {
        setIsSimulating(true)
        try {
            const res = await api.post('/impact/simulate', { count: 10 })
            toast.success(res.data.message || 'Simulation complete!')
            fetchLeaderboard(category)
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Simulation failed — register restaurants & users first')
        } finally {
            setIsSimulating(false)
        }
    }

    const top3 = entries.slice(0, 3)
    const hasData = entries.length >= 3

    return (
        <AppLayout>
            <div className="space-y-12 pb-20">
                {/* ═══ HEADER ═══ */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-[#1C1207] dark:text-white uppercase tracking-tighter">
                                Global Hall of Fame
                            </h1>
                        </div>
                        <p className="text-[#1C1207]/40 dark:text-white/40 font-bold max-w-lg">
                            Real-time rankings from the NextPlate grid. Rank up by rescuing more meals and saving more carbon.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Simulate Button */}
                        <button
                            onClick={handleOpenSimulator}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/20"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            Simulator
                        </button>

                        <button
                            onClick={handleBulkSimulate}
                            disabled={isSimulating}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1207] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                        >
                            {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            Bulk ×10
                        </button>

                        <button
                            onClick={() => fetchLeaderboard(category)}
                            className="p-2.5 bg-[#1C1207]/5 dark:bg-white/5 rounded-xl hover:bg-orange-500/10 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 text-[#1C1207]/40 dark:text-white/40" />
                        </button>

                        <div className="flex bg-[#1C1207]/5 dark:bg-white/5 p-1.5 rounded-2xl border border-[#1C1207]/5 dark:border-white/5">
                            {[
                                { id: 'overall', label: 'Overall', icon: Award },
                                { id: 'restaurants', label: 'Restaurants', icon: Store },
                                { id: 'ngos', label: 'NGOs', icon: Users },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setCategory(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${category === tab.id
                                        ? 'bg-[#1C1207] text-white shadow-xl shadow-black/20 scale-[1.02]'
                                        : 'text-[#1C1207]/40 dark:text-white/40 hover:text-[#1C1207] dark:hover:text-white'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ SIMULATOR FORM ═══ */}
                {showSimulator && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="max-w-5xl mx-auto bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-[32px] p-8 border border-purple-200 dark:border-purple-500/20 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-sm font-black text-[#1C1207] dark:text-white uppercase tracking-widest">Rescue Simulator</h3>
                            </div>
                            <button onClick={() => setShowSimulator(false)} className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest hover:text-red-500 transition-colors">Close</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Restaurant Select */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1C1207]/40 dark:text-white/40 uppercase tracking-[0.2em]">Restaurant</label>
                                <select value={simForm.restaurantId} onChange={e => setSimForm({ ...simForm, restaurantId: e.target.value })}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-purple-200 dark:border-purple-500/20 rounded-2xl py-3 px-4 text-sm font-bold text-[#1C1207] dark:text-white appearance-none focus:ring-4 focus:ring-purple-500/10 outline-none">
                                    <option value="">Select Restaurant</option>
                                    {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                            </div>

                            {/* User Select */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1C1207]/40 dark:text-white/40 uppercase tracking-[0.2em]">Rescuer / NGO</label>
                                <select value={simForm.userId} onChange={e => setSimForm({ ...simForm, userId: e.target.value })}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-purple-200 dark:border-purple-500/20 rounded-2xl py-3 px-4 text-sm font-bold text-[#1C1207] dark:text-white appearance-none focus:ring-4 focus:ring-purple-500/10 outline-none">
                                    <option value="">Select User</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.fullName} ({u.role})</option>)}
                                </select>
                            </div>

                            {/* Item Select */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1C1207]/40 dark:text-white/40 uppercase tracking-[0.2em]">Food Item</label>
                                <select value={simForm.itemName} onChange={e => setSimForm({ ...simForm, itemName: e.target.value })}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-purple-200 dark:border-purple-500/20 rounded-2xl py-3 px-4 text-sm font-bold text-[#1C1207] dark:text-white appearance-none focus:ring-4 focus:ring-purple-500/10 outline-none">
                                    {ITEM_PRESETS.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1C1207]/40 dark:text-white/40 uppercase tracking-[0.2em]">Quantity</label>
                                <input type="number" min={1} max={20} value={simForm.quantity} onChange={e => setSimForm({ ...simForm, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-purple-200 dark:border-purple-500/20 rounded-2xl py-3 px-4 text-sm font-bold text-[#1C1207] dark:text-white focus:ring-4 focus:ring-purple-500/10 outline-none" />
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1C1207]/40 dark:text-white/40 uppercase tracking-[0.2em]">Rescue Price (₹)</label>
                                <input type="number" min={10} max={5000} value={simForm.price} onChange={e => setSimForm({ ...simForm, price: parseInt(e.target.value) || 50 })}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-purple-200 dark:border-purple-500/20 rounded-2xl py-3 px-4 text-sm font-bold text-[#1C1207] dark:text-white focus:ring-4 focus:ring-purple-500/10 outline-none" />
                            </div>

                            {/* Submit */}
                            <div className="space-y-2 flex items-end">
                                <button onClick={handleSimulateSingle} disabled={isSimulating}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    Execute Rescue
                                </button>
                            </div>
                        </div>

                        <p className="mt-4 text-[9px] font-bold text-purple-500/50 uppercase tracking-widest text-center">
                            Creates a real completed order in the database • CO₂ score auto-calculated
                        </p>
                    </motion.div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-32 space-y-6">
                        <Trophy className="w-16 h-16 text-[#1C1207]/10 dark:text-white/10 mx-auto" />
                        <h2 className="text-2xl font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-tight">No Data Yet</h2>
                        <p className="text-[#1C1207]/20 dark:text-white/20 font-bold max-w-md mx-auto">
                            Open the <strong className="text-purple-500">Simulator</strong> or click <strong className="text-[#1C1207]">Bulk ×10</strong> to generate demo activity.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={handleOpenSimulator}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                                <Zap className="w-4 h-4" /> Open Simulator
                            </button>
                            <button onClick={handleBulkSimulate} disabled={isSimulating}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[#1C1207] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl disabled:opacity-50">
                                {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                Bulk Simulate ×10
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ═══ TOP 3 PODIUM ═══ */}
                        {hasData && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto pt-10">
                                {/* 2nd Place */}
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                                    className="order-2 md:order-1 flex flex-col items-center group cursor-pointer">
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-4 bg-neutral-300/20 rounded-full blur-xl group-hover:bg-neutral-300/30 transition-all" />
                                        <img src={top3[1].avatar} className="w-24 h-24 rounded-full border-4 border-[#C0C0C0] relative z-10 bg-white" alt="" />
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#C0C0C0] rounded-full flex items-center justify-center text-white font-black text-xl border-4 border-white dark:border-[#0a0a0a] z-20">2</div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-black text-[#1C1207] dark:text-white uppercase truncate max-w-[180px]">{top3[1].name}</h3>
                                        <p className="text-orange-500 font-black text-sm">{top3[1].score.toLocaleString()} PTS</p>
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-[10px] font-black text-neutral-500 uppercase">
                                            <TrendingUp className="w-3 h-3" />
                                            {top3[1].impact}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* 1st Place */}
                                <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    className="order-1 md:order-2 flex flex-col items-center group cursor-pointer">
                                    <div className="relative mb-8 transform scale-125">
                                        <div className="absolute -inset-8 bg-orange-500/30 rounded-full blur-2xl group-hover:bg-orange-500/40 transition-all animate-pulse" />
                                        <img src={top3[0].avatar} className="w-32 h-32 rounded-full border-4 border-orange-500 relative z-10 bg-white" alt="" />
                                        <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-2xl border-4 border-white dark:border-[#0a0a0a] z-20">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="text-center pt-8">
                                        <h3 className="text-2xl font-black text-[#1C1207] dark:text-white uppercase tracking-tight">{top3[0].name}</h3>
                                        <p className="text-orange-500 font-black text-xl">{top3[0].score.toLocaleString()} PTS</p>
                                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 rounded-full text-[12px] font-black text-orange-600 uppercase">
                                            <Flame className="w-4 h-4" />
                                            {top3[0].impact} SAVED
                                        </div>
                                    </div>
                                </motion.div>

                                {/* 3rd Place */}
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                                    className="order-3 flex flex-col items-center group cursor-pointer">
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-4 bg-orange-900/10 rounded-full blur-xl group-hover:bg-orange-900/20 transition-all" />
                                        <img src={top3[2].avatar} className="w-20 h-20 rounded-full border-4 border-[#CD7F32] relative z-10 bg-white" alt="" />
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#CD7F32] rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white dark:border-[#0a0a0a] z-20">3</div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-base font-black text-[#1C1207] dark:text-white uppercase truncate max-w-[160px]">{top3[2].name}</h3>
                                        <p className="text-orange-500 font-black text-xs">{top3[2].score.toLocaleString()} PTS</p>
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-[10px] font-black text-neutral-500 uppercase">
                                            <TrendingUp className="w-3 h-3" />
                                            {top3[2].impact}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* ═══ FULL LIST ═══ */}
                        <div className="card-base bg-white dark:bg-[#121212] overflow-hidden border border-[#1C1207]/5 dark:border-white/5 max-w-5xl mx-auto shadow-2xl shadow-[#1C1207]/5">
                            <div className="flex items-center justify-between px-8 py-6 border-b border-[#1C1207]/5 dark:border-white/5 bg-[#1C1207]/[0.02] dark:bg-white/[0.02]">
                                <h2 className="text-sm font-black text-[#1C1207] dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <Medal className="w-4 h-4 text-orange-500" />
                                    Full Grid Rankings — Live Data
                                </h2>
                                <span className="text-[10px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-widest">
                                    {entries.length} nodes ranked
                                </span>
                            </div>

                            <div className="divide-y divide-[#1C1207]/5 dark:divide-white/5">
                                {entries.map((entry, idx) => (
                                    <motion.div
                                        key={entry.id + '-' + idx}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.05 * idx }}
                                        className="flex items-center justify-between px-8 py-5 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className={`w-8 text-xl font-black ${idx < 3 ? 'text-orange-500' : 'text-[#1C1207]/20 dark:text-white/20'}`}>
                                                #{entry.rank}
                                            </span>
                                            <div className="relative">
                                                <img src={entry.avatar} className="w-12 h-12 rounded-xl border-2 border-white dark:border-[#121212] shadow-md group-hover:scale-110 transition-transform bg-white" alt="" />
                                                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[#121212] ${entry.role === 'restaurant' ? 'bg-orange-500' : entry.role === 'ngo' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                                                    {entry.role === 'restaurant' ? <Store className="w-2 h-2 text-white" /> : entry.role === 'ngo' ? <Users className="w-2 h-2 text-white" /> : <ShieldCheck className="w-2 h-2 text-white" />}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#1C1207] dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                    {entry.name}
                                                    {entry.rank === 1 && <Trophy className="w-3.5 h-3.5 text-orange-500" />}
                                                </h4>
                                                <p className="text-[10px] font-bold text-[#1C1207]/40 dark:text-white/40 uppercase tracking-widest">{entry.role}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-widest">Impact</p>
                                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{entry.impact}</p>
                                            </div>
                                            <div className="text-right min-w-[100px]">
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Total Pts</p>
                                                <p className="text-xl font-black text-[#1C1207] dark:text-white tracking-tighter">{entry.score.toLocaleString()}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600">
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ REWARDS BANNER ═══ */}
                <div className="max-w-5xl mx-auto">
                    <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 rounded-[32px] p-10 shadow-2xl shadow-orange-500/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center flex-shrink-0 animate-bounce">
                                <Star className="w-12 h-12 text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">Be an Eco Warrior</h2>
                                <p className="text-white/80 font-bold max-w-lg">
                                    Every 1,000 points unlocks exclusive badges, platform credits, and physical certificates for your restaurant or NGO.
                                </p>
                            </div>
                            <button
                                onClick={handleBulkSimulate}
                                disabled={isSimulating}
                                className="px-8 py-4 bg-white text-orange-600 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                            >
                                {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                Simulate More Activity
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
