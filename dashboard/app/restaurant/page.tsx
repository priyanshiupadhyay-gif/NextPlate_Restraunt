'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { StatCard } from '@/components/dashboard/stat-card'
import { AlertsSection } from '@/components/dashboard/alerts-section'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { Package, ShoppingCart, DollarSign, TrendingUp, Leaf, AlertTriangle, Award, Share2 } from 'lucide-react'
import { restaurantService, Order as ApiOrder } from '@/lib/restaurant-service'
import { useAuth } from '@/contexts/auth-context'
import { motion } from 'framer-motion'
import { DailyImpactSummary } from '@/components/dashboard/DailyImpactSummary'
import { CSRReportGenerator } from '@/components/dashboard/CSRReportGenerator'

import { Skeleton } from '@/components/ui/skeleton'

export default function RestaurantDashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<any>(null)
    const [recentOrders, setRecentOrders] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isNoRestaurant, setIsNoRestaurant] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                restaurantService.getStats(),
                restaurantService.getOrders({ limit: 5 }),
            ])

            if (!statsRes.success) {
                if (statsRes.message?.includes('No restaurant associated')) {
                    setIsNoRestaurant(true)
                } else {
                    setError(statsRes.message || 'Failed to sync with grid')
                }
            } else if (statsRes.stats) {
                setStats(statsRes.stats)
                setError(null)
                setIsNoRestaurant(false)
            }

            if (ordersRes.success) {
                setRecentOrders(
                    ordersRes.orders.map((order: ApiOrder) => ({
                        id: order.orderNumber || order._id.slice(-6).toUpperCase(),
                        realId: order._id,
                        customer: typeof order.customerId === 'object' ? order.customerId.fullName : 'Customer',
                        items: order.items.length,
                        total: order.totalAmount,
                        status: order.orderStatus === 'placed' ? 'new' : order.orderStatus,
                        time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }))
                )
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            setError('Protocol failure: Metadata stream interrupted.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            const res = await restaurantService.updateOrderStatus(orderId, status)
            if (res.success) {
                fetchData()
            } else {
                setError(res.message || 'Failed to sync status update')
            }
        } catch (err) {
            setError('Upstream communication failure.')
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [])

    // Real alerts based on data
    const alerts = []
    if (stats?.pendingOrders > 0) {
        alerts.push({
            id: 'pending-orders',
            type: 'low-stock' as const,
            title: 'Active Dispatch Signals',
            description: `You have ${stats.pendingOrders} orders awaiting processing.`,
            itemName: 'Global Marketplace Signal',
            severity: 'high' as const,
        })
    }
    if (stats?.activeMenuItems === 0) {
        alerts.push({
            id: 'no-items',
            type: 'low-stock' as const,
            title: 'Node Inactive',
            description: 'Your menu is empty. No surplus packets are being broadcasted.',
            itemName: 'Inventory Stream',
            severity: 'medium' as const,
        })
    }

    const totalRevenue = stats?.totalRevenue || 0
    const carbonSaved = stats?.totalCarbonSaved?.toFixed(1) ?? '0'
    const mealsRescued = stats?.totalMealsRescued ?? 0
    const waterSavedLiters = Math.round(mealsRescued * 0.4 * 1000)

    const restaurantName = user?.restaurantName || 'NextPlate Node'

    if (isLoading) {
        return (
            <AppLayout>
                <div className="space-y-12 pb-20">
                    <Skeleton className="h-[200px] w-full rounded-[48px]" />
                    <div className="flex flex-col md:flex-row justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-48 rounded-full" />
                            <Skeleton className="h-16 w-96 rounded-2xl" />
                            <Skeleton className="h-6 w-[500px] rounded-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-40 w-full rounded-[32px]" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Skeleton className="lg:col-span-2 h-[400px] rounded-[48px]" />
                        <Skeleton className="h-[400px] rounded-[48px]" />
                    </div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-12 pb-20">
                {/* Daily AI Pulse */}
                <DailyImpactSummary />

                {/* Node Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 dark:border-white/10 pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1C1207] dark:bg-white text-white dark:text-[#1C1207] rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Reliability Status: High
                        </div>
                        <h1 className="text-6xl font-display font-black text-[#1C1207] dark:text-white tracking-tighter leading-none uppercase">Resource Center</h1>
                        <p className="text-[#1C1207]/50 dark:text-white/50 font-medium max-w-xl text-lg">
                            Welcome back, <span className="text-[#1C1207] dark:text-white font-black font-display">{restaurantName}</span>. Managing node output and mitigating financial leakage across the grid.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {error && (
                            <div className="px-5 py-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {isNoRestaurant ? (
                    <div className="bg-white border-2 border-dashed border-[#1C1207]/10 rounded-[48px] p-24 text-center space-y-8">
                        <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto">
                            <Package className="w-10 h-10 text-orange-600" />
                        </div>
                        <div className="max-w-md mx-auto space-y-4">
                            <h2 className="text-3xl font-display font-black text-[#1C1207] tracking-tight">ORPHAN NODE DETECTED</h2>
                            <p className="text-[#1C1207]/50 font-medium">
                                Your account is not yet mapped to a physical resource node. Initialize your restaurant profile to start the protocol.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/settings'}
                            className="px-12 py-5 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl"
                        >
                            Initialize Profile
                        </button>
                    </div>
                ) : (
                    <>
                        {/* CSR Impact Portfolio */}
                        <CSRReportGenerator />

                        {/* Core Dynamics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <StatCard
                                title="Carbon Offset"
                                value={`${carbonSaved} kg`}
                                icon={<Leaf className="w-6 h-6" />}
                                variant="success"
                            />
                            <StatCard
                                title="Packets Rescued"
                                value={String(mealsRescued)}
                                icon={<Package className="w-6 h-6" />}
                                variant="default"
                            />
                            <StatCard
                                title="Today's Active"
                                value={String(stats?.todayOrders ?? 0)}
                                icon={<ShoppingCart className="w-6 h-6" />}
                                variant="info"
                            />
                            <StatCard
                                title="Total Earnings"
                                value={`$${totalRevenue.toLocaleString()}`}
                                icon={<DollarSign className="w-6 h-6" />}
                                variant="warning"
                            />
                        </div>

                        {/* Intelligence Row */}
                        <div className="grid md:grid-cols-2 gap-10">
                            {/* Leakage Monitor */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#1C1207] rounded-[48px] p-12 text-white relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-red-600/20 transition-colors" />

                                <div className="flex items-center justify-between mb-12">
                                    <div className="space-y-1">
                                        <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Leakage Monitor</h3>
                                        <p className="text-2xl font-display font-black tracking-tight">Financial Value Recovered</p>
                                    </div>
                                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Total Recouped</p>
                                            <p className="text-5xl font-black tracking-tighter text-emerald-500">${totalRevenue.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Impact Score</p>
                                            <p className="text-2xl font-black text-white/60">{(mealsRescued * 4.2).toFixed(1)}</p>
                                        </div>
                                    </div>

                                    <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>

                                    <div className="bg-orange-500/10 backdrop-blur-xl rounded-[32px] p-8 border border-orange-500/20 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Potential Next Cycle</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-orange-500 tracking-tighter">${Math.round(totalRevenue * 0.15).toLocaleString()}</span>
                                                <span className="text-xs font-bold text-orange-500/50 uppercase tracking-widest">/est</span>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-[#1C1207] shadow-2xl shadow-orange-500/20">
                                            <Package className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Impact Certificate */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-[#FFF8F0] border border-[#1C1207]/5 rounded-[48px] p-12 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-orange-900/5"
                            >
                                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100 blur-[100px] rounded-full -mr-40 -mt-40 opacity-40" />

                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#1C1207] text-white rounded-xl flex items-center justify-center">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black text-[#1C1207] uppercase tracking-[0.3em]">Protocol Audit 2026</span>
                                    </div>
                                    <div className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest">Live Node</div>
                                </div>

                                <div className="text-center space-y-2 relative z-10 mb-12">
                                    <p className="text-[11px] font-bold text-[#1C1207]/40 uppercase tracking-[0.2em] mb-4">Certification of Integrity</p>
                                    <h4 className="text-4xl font-display font-black text-[#1C1207] tracking-tighter uppercase leading-none">{restaurantName}</h4>
                                    <div className="h-[2px] w-20 bg-orange-600 mx-auto my-6" />
                                    <p className="text-sm font-medium text-[#1C1207]/60 italic">Metabolic Waste Management Protocol Verified</p>
                                </div>

                                <div className="grid grid-cols-3 gap-6 relative z-10 border-y border-[#1C1207]/5 py-10 mb-10">
                                    <div className="text-center space-y-1">
                                        <p className="text-3xl font-black text-[#1C1207]">{mealsRescued}</p>
                                        <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">Packets_Off</p>
                                    </div>
                                    <div className="text-center space-y-1 border-x border-[#1C1207]/5">
                                        <p className="text-3xl font-black text-[#1C1207]">{carbonSaved}</p>
                                        <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">kg_CO2e</p>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-3xl font-black text-[#1C1207]">{waterSavedLiters > 1000 ? `${(waterSavedLiters / 1000).toFixed(0)}k` : waterSavedLiters}</p>
                                        <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">H2O_Litres</p>
                                    </div>
                                </div>

                                <button className="w-full py-5 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl group/share">
                                    <Share2 className="w-4 h-4 group-hover/share:rotate-12 transition-transform" />
                                    Dispatch Manifesto
                                </button>
                            </motion.div>
                        </div>

                        {/* Node Alerts */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-display font-black text-[#1C1207] px-4">Node Operations</h3>
                            {alerts.length > 0 ? (
                                <AlertsSection alerts={alerts} />
                            ) : (
                                <div className="px-6 py-4 bg-emerald-50 text-emerald-700 rounded-3xl text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-3 mx-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Global Systems Operational: Zero Alerts
                                </div>
                            )}
                        </div>

                        {/* Recent Packets */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-display font-black text-[#1C1207] px-4">Latest Grid Activity</h3>
                            {recentOrders.length > 0 ? (
                                <RecentOrders
                                    orders={recentOrders}
                                    onUpdateStatus={handleUpdateStatus}
                                />
                            ) : (
                                <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-24 text-center space-y-4">
                                    <ShoppingCart className="w-16 h-16 text-[#1C1207]/5 mx-auto" />
                                    <h3 className="text-xl font-display font-black text-[#1C1207]/40 uppercase tracking-tight">No Active Dispatches</h3>
                                    <p className="text-xs font-bold text-[#1C1207]/20 uppercase tracking-widest">Protocol idle. Awaiting marketplace signals.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    )
}
