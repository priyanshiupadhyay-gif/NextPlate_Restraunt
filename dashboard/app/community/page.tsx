'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart,
    Gift,
    MapPin,
    Leaf,
    Sparkles,
    Users,
    ShoppingCart,
    CheckCircle2,
    Droplets,
    Package,
    MessageCircle,
    ArrowRight,
    Globe,
    Clock,
    Zap,
    ChefHat
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

// ─── COMMUNITY FRIDGES (simulator only) ───
const COMMUNITY_FRIDGES = [
    { id: 1, name: 'Downtown Community Fridge', address: '5th Ave & 42nd St, New York, NY 10001', status: 'accepting', lastRefill: '2h ago', capacity: '75%', items: 12 },
    { id: 2, name: 'Brooklyn Share Shelf', address: '123 Atlantic Ave, Brooklyn, NY 11201', status: 'accepting', lastRefill: '45m ago', capacity: '40%', items: 8 },
    { id: 3, name: 'Chinatown Food Hub', address: '88 Mott St, New York, NY 10013', status: 'full', lastRefill: '15m ago', capacity: '95%', items: 24 },
    { id: 4, name: 'Mission District Fridge', address: '2200 Mission St, San Francisco, CA 94110', status: 'accepting', lastRefill: '3h ago', capacity: '25%', items: 5 },
    { id: 5, name: 'West Loop Share Spot', address: '800 W Randolph St, Chicago, IL 60607', status: 'accepting', lastRefill: '1h ago', capacity: '60%', items: 15 },
    { id: 6, name: 'Capitol Hill Community Kitchen', address: '300 Broadway E, Seattle, WA 98102', status: 'accepting', lastRefill: '2h ago', capacity: '50%', items: 10 },
]

// Format relative time nicely
const formatRelativeTime = (timeStr: string) => {
    const match = timeStr?.match(/(\d+)/)
    if (!match) return timeStr || 'Just now'
    const mins = parseInt(match[1])
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

// Clean up seeded/test item names
const cleanItemName = (name: string) => {
    if (!name) return 'Meal Pack'
    const lower = name.toLowerCase()
    if (lower.includes('seeded') || lower.includes('data-packet') || lower.includes('test') || lower.includes('seed node')) {
        return 'Community Meal'
    }
    return name
}

export default function CommunityPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'sponsor' | 'fridges'>('sponsor')
    const [stats, setStats] = useState({ totalSponsored: 0, recentSponsors: [], activeCities: 0 })
    const [sponsorableItems, setSponsorableItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [sponsorMessage, setSponsorMessage] = useState('')
    const [sponsoredItem, setSponsoredItem] = useState<string | null>(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const [isSimulatorEnabled, setIsSimulatorEnabled] = useState(false)

    useEffect(() => {
        fetchSponsorableItems()
        fetchCommunityStats()
    }, [])

    const fetchCommunityStats = async () => {
        try {
            const res = await api.get('/impact/community')
            if (res.data.success) {
                setStats(res.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch community stats:', error)
        }
    }

    const fetchSponsorableItems = async () => {
        setIsLoading(true)
        try {
            // Try donation-eligible items first
            const donationRes = await api.get('/impact/donations')
            if (donationRes.data.success && donationRes.data.data?.length > 0) {
                const mapped = donationRes.data.data
                    .filter((item: any) => !(/seed|test|demo|simulator/i.test(item.name)))
                    .map((item: any) => ({
                        id: item._id,
                        name: cleanItemName(item.name),
                        restaurant: item.restaurantId?.name || 'Local Kitchen',
                        price: item.discountedPrice || item.price,
                        originalPrice: item.originalPrice || item.price * 2,
                        co2: item.carbonScore || 0.8,
                        image: item.imageUrl || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400`
                    }))
                if (mapped.length > 0) {
                    setSponsorableItems(mapped)
                    return
                }
            }

            // Fallback: try featured menu items
            const featuredRes = await api.get('/menu-items/featured?limit=12')
            if (featuredRes.data.success && featuredRes.data.items?.length > 0) {
                const mapped = featuredRes.data.items
                    .filter((item: any) => !(/seed|test|demo|simulator/i.test(item.name)))
                    .map((item: any) => ({
                        id: item._id,
                        name: cleanItemName(item.name),
                        restaurant: item.restaurantId?.name || 'Local Kitchen',
                        price: item.discountedPrice || item.price,
                        originalPrice: item.originalPrice || item.price * 2,
                        co2: item.carbonScore || 0.8,
                        image: item.imageUrl || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400`
                    }))
                setSponsorableItems(mapped)
                return
            }

            // No real data — leave empty
            setSponsorableItems([])
        } catch (error) {
            console.error('Failed to fetch items:', error)
            setSponsorableItems([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSponsor = async (item: any) => {

        setSponsoredItem(item.id)
        try {
            const res = await api.post('/ai/sponsor-meal', {
                itemId: item.id,
                message: sponsorMessage || 'A gift from the community'
            })

            if (res.data.success) {
                setShowSuccess(true)
                setStats(prev => ({ ...prev, totalSponsored: prev.totalSponsored + 1 }))
                toast.success('Meal Sponsored! 🎉', {
                    description: `"${item.name}" from ${item.restaurant} is now reserved for NGO pickup.`
                })
                setSponsorMessage('')
                fetchSponsorableItems() // Refresh list
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Sponsorship protocol failed')
        } finally {
            setTimeout(() => {
                setSponsoredItem(null)
                setShowSuccess(false)
            }, 3000)
        }
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-12 pb-32">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-[#1C1207] to-[#2D1E0F] rounded-[56px] p-12 md:p-20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(249,115,22,0.3), transparent 50%), radial-gradient(circle at 70% 80%, rgba(16,185,129,0.2), transparent 50%)'
                    }} />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 blur-[120px] rounded-full -mr-48 -mt-48" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-[18px] flex items-center justify-center shadow-xl">
                                    <Heart className="w-6 h-6 text-white fill-white" />
                                </div>
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em]">Community Powered</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase tracking-tighter leading-[0.85]">
                                Feed the <span className="text-orange-500">Grid</span>
                            </h1>
                            <p className="text-white/50 text-lg font-medium leading-relaxed max-w-xl">
                                Sponsor a meal for someone who needs it. Every "Ghost Meal" you buy is picked up by an NGO and delivered to a community kitchen. Small act, massive impact.
                            </p>
                            <div className="flex items-center gap-10">
                                <div className="space-y-1">
                                    <p className="text-4xl font-display font-black text-orange-500 tracking-tighter">{stats.totalSponsored}</p>
                                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Meals Sponsored</p>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div className="space-y-1">
                                    <p className="text-4xl font-display font-black text-emerald-500 tracking-tighter">{(stats.totalSponsored * 14.5).toFixed(0)}</p>
                                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">People Fed</p>
                                </div>
                                <div className="w-px h-12 bg-white/10" />
                                <div className="space-y-1">
                                    <p className="text-4xl font-display font-black text-white tracking-tighter">{stats.activeCities || 1}</p>
                                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Cities Active</p>
                                </div>
                            </div>
                        </div>

                        {/* Live Sponsor Ticker */}
                        <div className="w-full md:w-80 bg-white/5 backdrop-blur-xl rounded-[40px] p-8 border border-white/10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Live Kindness Stream</span>
                            </div>
                            <div className="space-y-4">
                                {stats.recentSponsors.length > 0 ? stats.recentSponsors.map((sp: any, i) => (
                                    <motion.div key={i}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.15 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="w-8 h-8 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Gift className="w-4 h-4 text-pink-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-bold truncate">{sp.name || 'A Kind Soul'} sponsored <span className="text-orange-400">{cleanItemName(sp.item)}</span></p>
                                            <p className="text-white/20 text-[9px] font-bold">{sp.city || 'Global Grid'} • {formatRelativeTime(sp.time)}</p>
                                            {sp.message && <p className="text-white/40 text-[10px] italic mt-1">"{sp.message}"</p>}
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-8 text-center text-white/20 text-[10px] font-black uppercase tracking-widest">
                                        Waiting for first act of kindness...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-3">
                    <button onClick={() => setActiveTab('sponsor')}
                        className={`flex items-center gap-3 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'sponsor' ? 'bg-[#1C1207] text-white shadow-2xl' : 'bg-white text-[#1C1207]/40 border border-[#1C1207]/5 hover:border-orange-200'}`}
                    >
                        <Gift className="w-5 h-5 text-pink-500" />
                        Sponsor a Plate
                    </button>
                    <button onClick={() => setActiveTab('fridges')}
                        className={`flex items-center gap-3 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'fridges' ? 'bg-[#1C1207] text-white shadow-2xl' : 'bg-white text-[#1C1207]/40 border border-[#1C1207]/5 hover:border-orange-200'}`}
                    >
                        <MapPin className="w-5 h-5 text-blue-500" />
                        Community Fridges
                    </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'sponsor' && (
                        <motion.div key="sponsor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {/* Sponsor Message */}
                            <div className="bg-white rounded-[40px] p-8 border border-[#1C1207]/5 mb-8 flex items-center gap-6">
                                <MessageCircle className="w-6 h-6 text-pink-500 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={sponsorMessage}
                                    onChange={(e) => setSponsorMessage(e.target.value)}
                                    placeholder="Leave a message with your sponsored meal (optional)..."
                                    className="flex-1 bg-transparent outline-none font-bold text-[#1C1207] placeholder:text-[#1C1207]/20"
                                />
                            </div>

                            {/* Sponsorable Items */}
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : sponsorableItems.length === 0 ? (
                                <div className="bg-white border-dashed border-2 border-[#1C1207]/10 rounded-[48px] py-20 text-center space-y-4">
                                    <Gift className="w-16 h-16 text-[#1C1207]/10 mx-auto" />
                                    <h3 className="text-xl font-display font-black text-[#1C1207]/40 uppercase tracking-tight">No Meals Available Yet</h3>
                                    <p className="text-sm font-bold text-[#1C1207]/20 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                                        Restaurants need to post surplus items first. Once they mark meals for donation, they will appear here for sponsorship.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {sponsorableItems.map((item, i) => (
                                        <motion.div key={item.id}
                                            initial={{ y: 30, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.08 }}
                                            className="bg-white rounded-[40px] overflow-hidden border border-[#1C1207]/5 shadow-sm hover:shadow-2xl transition-all group"
                                        >
                                            <div className="relative h-48 overflow-hidden">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                                    <div>
                                                        <p className="text-white font-black text-lg leading-tight">{item.name}</p>
                                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{item.restaurant}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 backdrop-blur-xl rounded-full border border-emerald-500/30">
                                                        <Leaf className="w-3 h-3 text-emerald-400" />
                                                        <span className="text-emerald-400 text-[10px] font-black">-{item.co2}kg</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[#1C1207]/30 text-sm font-black line-through">₹{item.originalPrice}</span>
                                                        <span className="text-3xl font-display font-black text-[#1C1207] ml-3">₹{item.price}</span>
                                                    </div>
                                                    <div className="px-3 py-1 bg-pink-50 rounded-full text-[9px] font-black text-pink-600 uppercase tracking-widest border border-pink-100">
                                                        Ghost Meal
                                                    </div>
                                                </div>

                                                <motion.button
                                                    onClick={() => handleSponsor(item)}
                                                    disabled={sponsoredItem === item.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${sponsoredItem === item.id
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-xl shadow-pink-500/20 hover:shadow-2xl'
                                                        }`}
                                                >
                                                    {sponsoredItem === item.id ? (
                                                        <>
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            Sponsored!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Heart className="w-5 h-5" />
                                                            Sponsor This Meal
                                                        </>
                                                    )}
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'fridges' && (
                        <motion.div key="fridges" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="mb-12 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-display font-black text-[#1C1207] uppercase tracking-tight">Active Fridge Mesh</h2>
                                    <p className="text-sm font-bold text-[#1C1207]/30 uppercase tracking-widest">Localized community distribution nodes</p>
                                </div>
                                <button
                                    onClick={() => setIsSimulatorEnabled(!isSimulatorEnabled)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center ${isSimulatorEnabled ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'bg-[#1C1207]/5 text-[#1C1207]/40 hover:bg-[#1C1207]/10'}`}
                                >
                                    <Zap className={`w-3 h-3 ${isSimulatorEnabled ? 'fill-white' : ''}`} />
                                    {isSimulatorEnabled ? 'Simulator Active' : 'Initialize Simulator'}
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {isSimulatorEnabled ? (
                                    COMMUNITY_FRIDGES.map((fridge, i) => {
                                        const capacityNum = parseInt(fridge.capacity)
                                        const isFull = fridge.status === 'full'
                                        return (
                                            <motion.div key={fridge.id}
                                                initial={{ y: 30, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="bg-white rounded-[40px] p-10 border border-[#1C1207]/5 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all relative overflow-hidden group"
                                            >
                                                <div className="absolute top-0 right-0 px-4 py-1 bg-neutral-100 text-[8px] font-black text-neutral-400 uppercase tracking-widest rounded-bl-xl border-l border-b border-neutral-200 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                    Simulator Node
                                                </div>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${isFull ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        <Package className="w-6 h-6" />
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isFull ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                        {isFull ? 'Full' : 'Accepting'}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-display font-black text-[#1C1207] uppercase tracking-tight mb-2">{fridge.name}</h3>
                                                <p className="text-[#1C1207]/40 text-sm font-medium mb-6 flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
                                                    {fridge.address}
                                                </p>

                                                <div className="space-y-3 mb-6">
                                                    <div className="flex items-center justify-between text-[10px] font-black text-[#1C1207]/40 uppercase tracking-widest">
                                                        <span>Capacity</span>
                                                        <span>{fridge.capacity}</span>
                                                    </div>
                                                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: fridge.capacity }}
                                                            transition={{ duration: 1, delay: i * 0.1 }}
                                                            className={`h-full rounded-full ${capacityNum > 80 ? 'bg-amber-500' : capacityNum > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-[#1C1207]/30">
                                                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3" />
                                                        Refill {fridge.lastRefill}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{fridge.items} items</span>
                                                </div>
                                            </motion.div>
                                        )
                                    })
                                ) : (
                                    <div className="col-span-full bg-white border-dashed border-2 border-[#1C1207]/10 rounded-[48px] py-32 text-center space-y-4">
                                        <Droplets className="w-16 h-16 text-[#1C1207]/10 mx-auto" />
                                        <h3 className="text-xl font-display font-black text-[#1C1207]/40 uppercase tracking-tight">Scanning Live Grid...</h3>
                                        <p className="text-sm font-bold text-[#1C1207]/20 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                                            No verified community fridges detected in your current radius. Initialize Simulator to view global examples.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    )
}
