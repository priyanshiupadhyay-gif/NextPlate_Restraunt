'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { StatCard } from '@/components/dashboard/stat-card'
import { impactService } from '@/lib/impact-service'
import {
    Heart,
    Leaf,
    MapPin,
    Clock,
    ShieldCheck,
    ChevronRight,
    Package,
    AlertCircle,
    Shield,
    FileCheck,
    Star,
    Lock,
    CheckCircle2,
    Upload,
    ShoppingCart,
    Mail
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { DailyImpactSummary } from '@/components/dashboard/DailyImpactSummary'
import { RescueOptimizer } from '@/components/dashboard/RescueOptimizer'
import { RecipeAlchemist } from '@/components/dashboard/RecipeAlchemist'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

// ─── NGO Verification Tier System ───
type VerificationTier = 1 | 2 | 3

const TIER_CONFIG = {
    1: {
        name: 'Self-Declared',
        icon: Shield,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-700',
        weeklyCaption: '5 claims/week',
        weeklyCap: 5,
        description: 'Signed up & agreed to terms. Weekly claim cap applies.',
    },
    2: {
        name: 'Document-Verified',
        icon: FileCheck,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        weeklyCaption: 'Unlimited claims',
        weeklyCap: Infinity,
        description: 'Registration certificate verified by admin. No claim cap.',
    },
    3: {
        name: 'Root Access',
        icon: ShieldCheck,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-700',
        weeklyCaption: 'Full access + priority',
        weeklyCap: Infinity,
        description: '10+ successful rescues with positive ratings. Full trust.',
    },
}

// ─── National Seeded Demo Donations ───
// Removed: All demo data has been replaced with real backend data.

export default function NGODashboardPage() {
    const { user } = useAuth()
    const [donations, setDonations] = useState<any[]>([])
    const [sponsoredOrders, setSponsoredOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isClaiming, setIsClaiming] = useState<string | null>(null)
    const [isDispatching, setIsDispatching] = useState<string | null>(null)
    const [claimsThisWeek, setClaimsThisWeek] = useState(0)
    const [activeTab, setActiveTab] = useState<'donations' | 'sponsored'>('donations')

    // Determine verification tier
    const verificationTier: VerificationTier = user?.isVerifiedNGO ? 3 : (user as any)?.ngoVerificationStatus === 'verified' ? 2 : 1
    const tierConfig = TIER_CONFIG[verificationTier]
    const TierIcon = tierConfig.icon
    const remainingClaims = tierConfig.weeklyCap === Infinity ? null : Math.max(0, tierConfig.weeklyCap - claimsThisWeek)
    const isCapReached = remainingClaims !== null && remainingClaims <= 0

    useEffect(() => {
        fetchDonations()
        fetchSponsoredOrders()
        fetchNGOMetrics()
    }, [])

    const fetchNGOMetrics = async () => {
        try {
            const res = await api.get('/users/ngo-metrics')
            if (res.data.success) {
                setClaimsThisWeek(res.data.claimsThisWeek || 0)
            }
        } catch (error) {
            console.error('Failed to fetch NGO metrics:', error)
        }
    }

    const fetchDonations = async () => {
        setIsLoading(true)
        try {
            const res = await impactService.getDonations()
            if (res.success && res.data) {
                setDonations(res.data)
            } else {
                setDonations([])
            }
        } catch (error) {
            console.error('Failed to fetch donations:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSponsoredOrders = async () => {
        try {
            const res = await api.get('/ai/sponsored-orders')
            if (res.data.success) {
                setSponsoredOrders(res.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch sponsored orders:', error)
        }
    }

    const handleDispatch = async (orderId: string) => {
        setIsDispatching(orderId)
        try {
            const res = await api.post(`/ai/dispatch-order/${orderId}`)
            if (res.data.success) {
                toast.success('Dispatch Initialized', {
                    description: 'You are now the authorized logistics partner for this meal.'
                })
                fetchSponsoredOrders()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Dispatch protocol failure')
        } finally {
            setIsDispatching(null)
        }
    }

    const handleClaim = async (item: any) => {
        if (isCapReached) {
            toast.error('Weekly claim cap reached', {
                description: `Tier ${verificationTier} (${tierConfig.name}) allows ${tierConfig.weeklyCap} claims/week.`
            })
            return
        }

        setIsClaiming(item._id)
        try {
            const res = await api.post('/orders', {
                restaurantId: item.restaurantId._id || item.restaurantId,
                items: [{ itemId: item._id, quantity: item.availableQuantity }],
                paymentMethod: 'cod'
            })

            if (res.data.success) {
                toast.success('Resource Allocated', {
                    description: `Successfully claimed ${item.availableQuantity}x ${item.name}.`
                })
                setClaimsThisWeek(prev => prev + 1)
                fetchDonations()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Protocol failure during allocation')
        } finally {
            setIsClaiming(null)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            toast.loading("Transmitting documentation to Resilience Node...", { id: 'v-upload' })

            // Step 1: Upload to secure storage
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await api.post('/upload/doc', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const docUrl = uploadRes.data.data.url

            // Step 2: Protocol handoff
            await api.put('/users/ngo-verification', { docUrl })

            toast.success("Document Recorded", {
                id: 'v-upload',
                description: "Node cleared for verification. Authority review in 24h."
            })

            // Re-fetch metrics and refresh page to pick up 'pending' status
            fetchNGOMetrics()
            setTimeout(() => window.location.reload(), 1500)
        } catch (err: any) {
            toast.error("Protocol Rejection", {
                id: 'v-upload',
                description: err.response?.data?.message || err.message || "File transmission failed."
            })
        }
    }

    const triggerUpload = () => {
        const input = document.getElementById('ngo-cert-upload') as HTMLInputElement
        if (input) input.click()
    }

    return (
        <AppLayout>
            <div className="space-y-12 pb-20">
                {/* Daily AI Pulse */}
                <DailyImpactSummary />

                {/* Stitch Navigator (Route Optimizer) */}
                <RescueOptimizer />

                {/* Protocol Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
                    <div className="space-y-4">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 ${tierConfig.bg} ${tierConfig.color} rounded-full text-[10px] font-black uppercase tracking-[0.3em] border ${tierConfig.border}`}>
                            <TierIcon className="w-3" />
                            Security Clearance: {tierConfig.name}
                        </div>
                        <h1 className="text-6xl font-display font-black text-[#1C1207] tracking-tighter leading-none uppercase">Rescue Protocol</h1>
                        <p className="text-[#1C1207]/50 font-medium max-w-xl text-lg">
                            Operating under Neighborhood Resilience Protocol 1.0. Redirecting surplus biological data-packets (food) to community nodes at $0.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white rounded-3xl border border-[#1C1207]/5 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                                <Leaf className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest leading-none mb-1.5">Ecological Offset</p>
                                <p className="text-2xl font-black text-[#1C1207] leading-none">{user?.totalCarbonSaved?.toFixed(1) || '0.0'} kg</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tier & Security Clearance */}
                <section className="relative group">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-orange-50/50 to-transparent pointer-events-none -mb-8 rounded-3xl" />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative overflow-hidden ${tierConfig.bg} border ${tierConfig.border} rounded-[40px] p-10 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl shadow-neutral-200/50`}
                    >
                        <div className="flex items-center gap-10">
                            <div className={`w-32 h-32 rounded-[32px] bg-white flex items-center justify-center shadow-2xl ${tierConfig.color} border ${tierConfig.border}`}>
                                <TierIcon className="w-16 h-16" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-display font-black text-[#1C1207] tracking-tight">{tierConfig.name} Access Level</h3>
                                <p className="text-[#1C1207]/60 font-medium max-w-md">{tierConfig.description}</p>
                                {remainingClaims !== null && (
                                    <div className="flex items-center gap-3 mt-4">
                                        <div className="flex gap-1">
                                            {[...Array(tierConfig.weeklyCap)].map((_, i) => (
                                                <div key={i} className={`w-1.5 h-6 rounded-full ${i < claimsThisWeek ? 'bg-orange-600' : 'bg-[#1C1207]/10'}`} />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-widest">{remainingClaims} Tokens Remaining</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                id="ngo-cert-upload"
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {(user as any)?.ngoVerificationStatus === 'pending' ? (
                                <div className="px-8 py-4 bg-orange-100 text-orange-700 rounded-2xl font-black text-xs uppercase tracking-widest border border-orange-200 flex items-center gap-2">
                                    <Clock className="w-4 h-4 animate-spin-slow" />
                                    Verification in Progress
                                </div>
                            ) : verificationTier < 3 ? (
                                <button
                                    onClick={triggerUpload}
                                    className="px-10 py-5 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all flex items-center gap-3 group"
                                >
                                    <Upload className="w-4 h-4 group-hover:animate-bounce" />
                                    Initialize Verification
                                </button>
                            ) : (
                                <div className="px-8 py-4 bg-green-100 text-green-700 rounded-2xl font-black text-xs uppercase tracking-widest border border-green-200 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    Protocol Full Authority
                                </div>
                            )}
                        </div>
                    </motion.div>
                </section>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <StatCard
                        title="Meals Distributed"
                        value={String(user?.totalMealsRescued || 0)}
                        icon={<Package className="w-6 h-6" />}
                        variant="success"
                    />
                    <StatCard
                        title="Active Grid Claims"
                        value={String(claimsThisWeek)}
                        icon={<Clock className="w-6 h-6" />}
                        variant="info"
                    />
                    <StatCard
                        title="Node Trust Rating"
                        value="9.8"
                        icon={<Star className="w-6 h-6" />}
                        variant="warning"
                    />
                    <StatCard
                        title="Clearance Tier"
                        value={verificationTier}
                        icon={<TierIcon className="w-6 h-6" />}
                        variant="default"
                    />
                </div>

                {/* Available Resource Grid */}
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-3xl font-display font-black text-[#1C1207] tracking-tight">RESILIENCE MONITOR</h2>
                            <p className="text-sm font-bold text-[#1C1207]/30 uppercase tracking-widest mt-1">Live Feed from National Rescue Nodes</p>
                        </div>

                        <div className="flex bg-white p-1.5 rounded-2xl border border-[#1C1207]/5 shadow-sm">
                            <button
                                onClick={() => setActiveTab('donations')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'donations' ? 'bg-[#1C1207] text-white shadow-lg' : 'text-[#1C1207]/40 hover:text-[#1C1207]'}`}
                            >
                                Donation Grid ({donations.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('sponsored')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sponsored' ? 'bg-[#1C1207] text-white shadow-lg' : 'text-[#1C1207]/40 hover:text-[#1C1207]'}`}
                            >
                                Sponsored Dispatch ({sponsoredOrders.length})
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'donations' ? (
                            <motion.div
                                key="donations"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                {isCapReached && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-orange-50 border border-orange-200 rounded-[32px] p-8 flex items-center gap-6">
                                        <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-600/20">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-display font-black text-[#1C1207] text-lg">Weekly Allocation Exhausted</h4>
                                            <p className="text-[#1C1207]/50 font-medium">Clearance Level {verificationTier} limited to {tierConfig.weeklyCap} rescues per cycle.</p>
                                        </div>
                                    </motion.div>
                                )}

                                {isLoading ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-[400px] bg-white rounded-[40px] animate-pulse border border-[#1C1207]/5" />
                                        ))}
                                    </div>
                                ) : donations.length === 0 ? (
                                    <div className="bg-white border-dashed border-2 border-[#1C1207]/10 rounded-[48px] py-40 text-center space-y-4">
                                        <Package className="w-16 h-16 text-[#1C1207]/10 mx-auto" />
                                        <h3 className="text-xl font-display font-black text-[#1C1207]/40">Donation Grid Empty</h3>
                                        <p className="text-sm font-bold text-[#1C1207]/20 uppercase tracking-widest">No unhandled surplus exceptions detected.</p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {donations.map((item, i) => (
                                            <motion.div
                                                key={item._id}
                                                layout
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`group relative bg-white border border-[#1C1207]/5 rounded-[44px] hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500 overflow-hidden ${isCapReached ? 'grayscale opacity-50' : ''}`}
                                            >
                                                {/* Image Header */}
                                                <div className="relative h-48 overflow-hidden bg-neutral-100">
                                                    <img
                                                        src={item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1488459711615-228220e40b4b?q=80&w=800&auto=format&fit=crop'}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                                    <div className="absolute top-4 left-4">
                                                        <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-sm">
                                                            {item.category}
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-white bg-green-600/80 backdrop-blur-md px-3 py-1 rounded-full font-black text-xs">
                                                        <Leaf className="w-3.5 h-3.5" />
                                                        {item.carbonScore}kg CO2e
                                                    </div>
                                                </div>

                                                <div className="p-10">
                                                    <h3 className="text-2xl font-display font-black text-[#1C1207] mb-4 truncate group-hover:text-orange-600 transition-colors">{item.name}</h3>

                                                    <div className="space-y-4 mb-10 relative z-10">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-3 text-[#1C1207]/40 text-xs font-bold uppercase tracking-widest">
                                                                <MapPin className="w-4 h-4 text-sky-500" />
                                                                {item.restaurantId?.name || 'Partner Restaurant'}
                                                            </div>
                                                            <p className="text-[10px] font-bold text-[#1C1207]/30 ml-7 leading-tight">
                                                                {item.restaurantId?.address?.street}, {item.restaurantId?.address?.city}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-sky-600/60 ml-7 flex items-center gap-2">
                                                                <Mail className="w-3 h-3" />
                                                                {item.restaurantId?.contactEmail}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[#1C1207] text-sm font-black uppercase tracking-tight">
                                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                                            {item.availableQuantity} Biological Units
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleClaim(item)}
                                                        disabled={isClaiming === item._id || isCapReached}
                                                        className="w-full py-5 bg-[#1C1207] text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl disabled:opacity-30"
                                                    >
                                                        {isClaiming === item._id ? 'ALLOCATING...' : (isCapReached ? 'CAP_LOCKED' : 'Claim Protocol $0')}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="sponsored"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {sponsoredOrders.length === 0 ? (
                                    <div className="bg-white border-dashed border-2 border-[#1C1207]/10 rounded-[48px] py-40 text-center space-y-4">
                                        <Heart className="w-16 h-16 text-pink-200 mx-auto" />
                                        <h3 className="text-xl font-display font-black text-[#1C1207]/40">Dispatch Pool Clear</h3>
                                        <p className="text-sm font-bold text-[#1C1207]/20 uppercase tracking-widest">No sponsored meals awaiting dispatch.</p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {sponsoredOrders.map((order, i) => (
                                            <motion.div
                                                key={order._id}
                                                layout
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="group relative bg-[#1C1207] text-white border border-white/5 rounded-[44px] p-10 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700" />

                                                <div className="flex justify-between items-start mb-8 relative z-10">
                                                    <div className="bg-pink-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-pink-500/20">
                                                        Sponsored
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
                                                        <Leaf className="w-4 h-4" />
                                                        -{order.totalCarbonSaved}kg
                                                    </div>
                                                </div>

                                                <h3 className="text-2xl font-display font-black text-white mb-2 truncate">{order.items[0]?.name}</h3>
                                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-8">From kind stranger: {order.specialInstructions?.split('"')[1] || 'Anonymous'}</p>

                                                <div className="space-y-4 mb-10 relative z-10">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-3 text-white/60 text-xs font-bold uppercase tracking-widest">
                                                            <MapPin className="w-4 h-4 text-pink-400" />
                                                            {order.restaurantId?.name}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-white/40 ml-7 leading-tight">
                                                            {order.restaurantId?.address?.street}, {order.restaurantId?.address?.city}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-pink-400/60 ml-7 flex items-center gap-2">
                                                            <Mail className="w-3 h-3" />
                                                            {order.restaurantId?.contactEmail}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-emerald-400 text-sm font-black uppercase tracking-tight">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Fully Funded • Ready for Hub
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDispatch(order._id)}
                                                    disabled={isDispatching === order._id}
                                                    className="w-full py-5 bg-white text-[#1C1207] rounded-[28px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-pink-500 hover:text-white transition-all shadow-xl active:scale-95"
                                                >
                                                    {isDispatching === order._id ? 'INITIALIZING DISPATCH...' : (
                                                        <>
                                                            <ShoppingCart className="w-4 h-4" />
                                                            Dispatch via NGO
                                                        </>
                                                    )}
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Recipe Alchemist */}
                <RecipeAlchemist />

                {/* Protocol Documentation */}
                <div className="bg-[#1C1207] rounded-[48px] p-12 flex flex-col md:flex-row items-center gap-12 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-orange-600/20 transition-colors" />
                    <div className="w-24 h-24 bg-orange-600 rounded-[32px] flex items-center justify-center flex-shrink-0 relative z-10 shadow-2xl rotate-3 group-hover:rotate-6 transition-transform">
                        <AlertCircle className="w-12 h-12" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <h4 className="text-2xl font-display font-black tracking-tight leading-none">COMMUNITY RESILIENCE DIRECTIVE</h4>
                        <p className="text-white/40 font-medium text-sm leading-relaxed max-w-2xl">
                            All NGO claims are logged in the Public Resilience Ledger. Ensure pickup within the physical expiry window. Trust scores update symmetrically after each successful node closure. Abuse of protocol will result in immediate clearance revocation.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
