'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import {
    Search,
    MapPin,
    Clock,
    Leaf,
    ArrowRight,
    Filter,
    ShoppingCart,
    Heart,
    TrendingDown,
    Info,
    Timer,
    Navigation,
    Utensils,
    Droplets,
    ChevronLeft,
    ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import api from '@/lib/api'
import { RecommendationWidget } from '@/components/recommendations/RecommendationWidget'
import { DailyImpactSummary } from '@/components/dashboard/DailyImpactSummary'
import { ImpactCertificates } from '@/components/dashboard/ImpactCertificates'
import { Skeleton } from '@/components/ui/skeleton'

const CORE_LOCATIONS = ['All Locations', 'Delhi NCR', 'Mumbai', 'Bangalore', 'New York', 'London', 'Sydney', 'Paris']

export default function FeedPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLocating, setIsLocating] = useState(false)
    const [selectedZone, setSelectedZone] = useState('All Locations')
    const [cart, setCart] = useState<any[]>([])
    const [selectedItem, setSelectedItem] = useState<any>(null)

    const availableZones = Array.from(new Set([...CORE_LOCATIONS, ...items.map(i => i.zone || 'Other')]))

    const fetchItems = async () => {
        setIsLoading(true)
        try {
            const res = await api.get('/menu-items/search')
            const rawItems = res.data.items || []
            const liveItems = rawItems.map((item: any) => ({
                ...item,
                imageUrl: item.imageUrl || item.images?.[0] || '',
                restaurantName: item.restaurantName || item.restaurantId?.name || 'Partner Restaurant',
                zone: item.zone || item.restaurantId?.address?.city || 'Global',
                carbonScore: item.carbonScore || 0,
                waterSaved: item.waterSaved || Math.round((item.carbonScore || 0) * 500),
            }))
            setItems(liveItems)
        } catch {
            setItems([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const detectLocation = () => {
        setIsLocating(true)
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                    const data = await response.json()
                    const city = data.city || data.locality || data.principalSubdivision

                    if (city) {
                        toast.success(`Location Synced: ${city}`, {
                            description: `Showing food available in ${city}`
                        })
                        const matchedItem = items.find(i => i.zone?.toLowerCase().includes(city.toLowerCase()))
                        if (matchedItem) {
                            setSelectedZone(matchedItem.zone)
                        } else {
                            toast.info(`No food available in ${city}. Showing all locations.`)
                            setSelectedZone('All Locations')
                        }
                    }
                } catch (err) {
                    toast.error('Location Error', { description: 'Could not get your location.' })
                } finally {
                    setIsLocating(false)
                }
            }, () => {
                toast.error('Location Access Denied', { description: 'Please enable location access to find food near you.' })
                setIsLocating(false)
            })
        }
    }

    const addToCart = (item: any) => {
        setCart(prev => [...prev, item])
        toast.success(`${item.name} added to cart`, {
            icon: <ShoppingCart className="w-4 h-4" />
        })
        api.post(`/menu-items/${item._id}/view`).catch(() => { })
    }

    const handleRescue = async () => {
        if (cart.length === 0) return
        localStorage.setItem('s2p_cart', JSON.stringify(cart))
        router.push('/checkout')
    }

    const displayedItems = selectedZone === 'All Locations'
        ? items
        : items.filter(i => i.zone === selectedZone)

    if (isLoading && items.length === 0) {
        return (
            <AppLayout>
                <div className="space-y-12 pb-32">
                    <Skeleton className="h-[200px] w-full rounded-[48px]" />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="aspect-[3/4] p-8 space-y-6 bg-white border border-[#1C1207]/5 rounded-[56px]">
                                <Skeleton className="aspect-square w-full rounded-[40px]" />
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-24 rounded-full" />
                                    <Skeleton className="h-8 w-full rounded-xl" />
                                    <Skeleton className="h-10 w-full rounded-2xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AppLayout>
        )
    }

    const noScrollbarStyles = `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;

    return (
        <AppLayout>
            <div className="space-y-12 pb-32">
                <DailyImpactSummary />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                            <Navigation className="w-3 h-3" />
                            Food Network
                        </div>
                        <h1 className="text-6xl font-display font-black text-[#1C1207] dark:text-white tracking-tighter leading-none uppercase">Rescue Feed</h1>
                        <p className="text-[#1C1207]/50 dark:text-white/50 font-medium max-w-xl text-lg">
                            Available surplus food from nearby restaurants at discounted prices.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="p-6 bg-white dark:bg-white/10 rounded-[32px] border border-[#1C1207]/5 dark:border-white/10 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-500/20 rounded-[24px] flex items-center justify-center group-hover:rotate-12 transition-transform">
                                <Leaf className="text-green-600 dark:text-green-400 w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-[0.3em] leading-none mb-2">Carbon Saved</p>
                                <p className="text-3xl font-black text-[#1C1207] dark:text-white leading-none">{user?.totalCarbonSaved || 0}kg</p>
                            </div>
                        </div>
                    </div>
                </div>

                <RecommendationWidget />

                {displayedItems.length === 0 ? (
                    <div className="py-60 text-center space-y-6">
                        <div className="w-32 h-32 bg-orange-50 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto text-5xl grayscale opacity-50">🍱</div>
                        <h3 className="text-3xl font-display font-black text-[#1C1207] dark:text-white">No Food Available</h3>
                        <p className="text-[#1C1207]/40 dark:text-white/40 font-bold uppercase tracking-widest text-xs">No surplus food available in this area right now.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {displayedItems.map((item, idx) => {
                            const discount = Math.round(((item.originalPrice - item.discountedPrice) / item.originalPrice) * 100)
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                                    key={item._id}
                                    onClick={() => setSelectedItem(item)}
                                    className="group relative bg-white border border-[#1C1207]/5 rounded-[56px] overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(28,18,7,0.15)] transition-all duration-700 cursor-pointer"
                                >
                                    <div className="absolute top-6 left-6 z-10 px-5 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                                        Save: -{discount}%
                                    </div>
                                    <div className="aspect-[4/4] bg-neutral-100 overflow-hidden relative">
                                        <img
                                            src={item.imageUrl}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] ease-out"
                                            alt={item.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1207]/80 via-transparent to-transparent opacity-60" />
                                        <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end">
                                            <div className="flex items-center gap-2 text-white/90 text-[10px] font-black uppercase tracking-widest">
                                                <MapPin className="w-3 h-3 text-orange-500" />
                                                {item.zone || 'Location'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-10 space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.3em] mb-1">{item.restaurantName || "Restaurant"}</p>
                                            <h3 className="text-2xl font-display font-black text-[#1C1207] dark:text-white leading-tight group-hover:text-orange-600 transition-colors uppercase tracking-tight">{item.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-6 border-y border-[#1C1207]/5 dark:border-white/10 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-widest">CO2 Saved</span>
                                                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-extrabold text-sm">
                                                    <Leaf className="w-3.5 h-3.5" />
                                                    {item.carbonScore}kg
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-[#1C1207]/5 dark:bg-white/10" />
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-widest">Water Saved</span>
                                                <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-extrabold text-sm">
                                                    <Droplets className="w-3.5 h-3.5" />
                                                    {item.waterSaved}L
                                                </div>
                                            </div>
                                            <div className="ml-auto flex flex-col items-end gap-1">
                                                <span className="text-[9px] font-black text-[#1C1207]/30 dark:text-white/30 uppercase tracking-widest">Pickup</span>
                                                <div className="flex items-center gap-1.5 text-orange-500 font-extrabold text-xs">
                                                    <Timer className="w-3.5 h-3.5" />
                                                    3h
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] text-[#1C1207]/30 dark:text-white/30 font-black line-through tracking-widest">${item.originalPrice}</span>
                                                <span className="text-3xl font-display font-black text-[#1C1207] dark:text-white">${item.discountedPrice}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    addToCart(item)
                                                }}
                                                className="bg-[#1C1207] text-white p-6 rounded-[28px] hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-[#1C1207]/20 group-hover:rotate-6"
                                            >
                                                <ShoppingCart className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}

                <ImpactCertificates />
            </div>

            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 px-12 py-8 bg-[#1C1207] text-white rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.3)] flex items-center gap-10 border border-white/10"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Items</span>
                            <span className="text-2xl font-display font-black leading-none">{cart.length} Units</span>
                        </div>
                        <div className="w-[1px] h-12 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">You Save</span>
                            <span className="text-2xl font-display font-black leading-none">${cart.reduce((s, d) => s + (d.originalPrice - d.discountedPrice), 0)}</span>
                        </div>
                        <button
                            onClick={handleRescue}
                            disabled={isLoading}
                            className="bg-orange-600 text-white px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 hover:bg-orange-500 transition-all active:scale-95 shadow-2xl shadow-orange-600/30 disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Checkout'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-[#1C1207]/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="relative max-w-4xl w-full bg-[#FFF8F0] rounded-[64px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                        >
                            <div className="w-full md:w-1/2 relative bg-neutral-200">
                                <img src={selectedItem.imageUrl} className="w-full h-full object-cover" alt={selectedItem.name} />
                                <div className="absolute top-8 left-8">
                                    <div className="px-6 py-2 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                        -{Math.round(((selectedItem.originalPrice - selectedItem.discountedPrice) / selectedItem.originalPrice) * 100)}% Savings
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 p-10 md:p-16 overflow-y-auto space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.4em] leading-none">{selectedItem.restaurantName || selectedItem.restaurantId?.name || "Partner Node"}</p>
                                    </div>
                                    <h2 className="text-5xl font-display font-black text-[#1C1207] uppercase tracking-tighter leading-[0.9]">{selectedItem.name}</h2>
                                    <p className="text-[#1C1207]/60 font-medium text-lg leading-relaxed">
                                        {selectedItem.description || "Premium surplus liquidation from the national food grid."}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-8 py-8 border-y border-[#1C1207]/5">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em]">Status</p>
                                        <div className="flex items-center gap-2 text-green-600 font-bold">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                            <span>Freshness Verified</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em]">H2O Footprint</p>
                                        <div className="flex items-center gap-2 text-sky-600 font-bold">
                                            <Droplets className="w-5 h-5" />
                                            <span>{selectedItem.waterSaved}L Saved</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-[#1C1207]/30 font-black line-through tracking-[0.2em] mb-1">${selectedItem.originalPrice}</span>
                                        <span className="text-5xl font-display font-black text-[#1C1207] leading-none">${selectedItem.discountedPrice}</span>
                                    </div>
                                    <button
                                        onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}
                                        className="bg-[#1C1207] text-white px-12 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center gap-4"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-8 right-8 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-[#1C1207] hover:text-white transition-all shadow-xl"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: noScrollbarStyles }} />
        </AppLayout>
    )
}
