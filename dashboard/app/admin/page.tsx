'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { StatCard } from '@/components/dashboard/stat-card'
import {
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Store,
    Users,
    ArrowUpRight,
    Package,
    Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import { adminService } from '@/lib/admin-service'
import Link from 'next/link'

interface Analytics {
    overview: {
        totalUsers: number
        totalRestaurants: number
        verifiedRestaurants: number
        totalOrders: number
        completedOrders: number
        totalRevenue: number
    }
    ordersByStatus: Record<string, number>
    topRestaurants: any[]
    recentOrders: any[]
}

const STATUS_COLORS: Record<string, string> = {
    completed: '#10B981',
    placed: '#F59E0B',
    confirmed: '#3B82F6',
    preparing: '#8B5CF6',
    ready: '#06B6D4',
    cancelled: '#EF4444',
}

export default function AdminDashboardPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await adminService.getAnalytics()
                if (res.success && res.analytics) {
                    setAnalytics(res.analytics)
                } else {
                    setError(res.message || 'Failed to load analytics')
                }
            } catch {
                setError('Failed to load analytics')
            } finally {
                setIsLoading(false)
            }
        }
        fetchAnalytics()
    }, [])

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                </div>
            </AppLayout>
        )
    }

    const overview = analytics?.overview || {
        totalUsers: 0,
        totalRestaurants: 0,
        verifiedRestaurants: 0,
        totalOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
    }

    const ordersByStatus = analytics?.ordersByStatus || {}
    const recentOrders = analytics?.recentOrders || []

    // Build pie chart data from real ordersByStatus
    const pieData = Object.entries(ordersByStatus).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count as number,
        color: STATUS_COLORS[status] || '#6B7280',
    }))

    // Calculate efficiency (completed / total)
    const efficiency = overview.totalOrders > 0
        ? Math.round((overview.completedOrders / overview.totalOrders) * 100)
        : 0

    // Build area chart from recent orders (group by date)
    const ordersByDate: Record<string, { date: string; orders: number; revenue: number }> = {}
    recentOrders.forEach((order: any) => {
        const date = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
        if (!ordersByDate[date]) {
            ordersByDate[date] = { date, orders: 0, revenue: 0 }
        }
        ordersByDate[date].orders += 1
        ordersByDate[date].revenue += order.totalAmount || 0
    })
    const chartData = Object.values(ordersByDate)

    // Commission at 15%
    const platformCommission = overview.totalRevenue * 0.15

    // Pending actions count
    const pendingRestaurants = overview.totalRestaurants - overview.verifiedRestaurants
    const pendingOrders = (ordersByStatus['placed'] || 0) + (ordersByStatus['confirmed'] || 0)

    return (
        <AppLayout>
            <div className="space-y-12 pb-20">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1C1207] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            System Authority: Level 04
                        </div>
                        <h1 className="text-6xl font-display font-black text-[#1C1207] tracking-tighter leading-none">COMMAND CENTER</h1>
                        <p className="text-[#1C1207]/50 font-medium max-w-xl text-lg">
                            Global overview of the NextPlate ecosystem. All data shown is live from the database.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white rounded-3xl border border-[#1C1207]/5 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest leading-none mb-1.5">Registered Users</p>
                                <p className="text-2xl font-black text-[#1C1207] leading-none">{overview.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard
                        title="Total Orders"
                        value={overview.totalOrders.toString()}
                        change={0}
                        changeLabel="all time"
                        icon={<ShoppingCart className="w-6 h-6" />}
                        variant="success"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`$${overview.totalRevenue.toLocaleString()}`}
                        change={0}
                        changeLabel="completed orders"
                        icon={<DollarSign className="w-6 h-6" />}
                        variant="info"
                    />
                    <StatCard
                        title="Platform Commission (15%)"
                        value={`$${Math.round(platformCommission).toLocaleString()}`}
                        change={0}
                        changeLabel="estimated"
                        icon={<TrendingUp className="w-6 h-6" />}
                        variant="warning"
                    />
                    <StatCard
                        title="Restaurant Nodes"
                        value={overview.totalRestaurants.toString()}
                        change={0}
                        changeLabel={`${overview.verifiedRestaurants} verified`}
                        icon={<Store className="w-6 h-6" />}
                        variant="default"
                    />
                </div>

                {/* Main Visuals Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[48px] p-10 shadow-2xl shadow-[#1C1207]/5 overflow-hidden group"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-display font-black text-[#1C1207] tracking-tight">Recent Orders</h3>
                                <p className="text-xs font-bold text-[#1C1207]/40 uppercase tracking-widest mt-1">Last 10 Orders by Day</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1207]/40">Live Data</span>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            {chartData.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-[#1C1207]/30">
                                    <div className="text-center">
                                        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-lg font-bold">No order data yet</p>
                                        <p className="text-sm mt-1">Orders will appear here as they come in</p>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EA580C" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#1C1207', opacity: 0.3, fontSize: 10, fontWeight: 800 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ stroke: '#EA580C', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            contentStyle={{
                                                backgroundColor: '#1C1207',
                                                border: 'none',
                                                borderRadius: '24px',
                                                padding: '16px 24px',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' as const }}
                                            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px', fontWeight: 800 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#EA580C"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            animationDuration={2000}
                                            name="Revenue ($)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </motion.div>

                    {/* Orders Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#1C1207] rounded-[48px] p-10 shadow-2xl shadow-orange-900/10 flex flex-col items-center justify-between"
                    >
                        <div className="w-full text-center">
                            <h3 className="text-2xl font-display font-black text-white tracking-tight">Status Grid</h3>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-2">Order Distribution</p>
                        </div>

                        {pieData.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-white/30">
                                <div className="text-center">
                                    <p className="text-4xl font-black">0</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest mt-2">No Orders Yet</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full aspect-square flex items-center justify-center my-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    style={{ filter: `drop-shadow(0 0 12px ${entry.color}44)` }}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Efficiency</span>
                                    <span className="text-4xl font-black text-white">{efficiency}%</span>
                                </div>
                            </div>
                        )}

                        <div className="w-full grid grid-cols-2 gap-4">
                            {pieData.length > 0 ? pieData.map((status) => (
                                <div key={status.name} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{status.name}</span>
                                    </div>
                                    <span className="text-xl font-black text-white">{status.value}</span>
                                </div>
                            )) : (
                                <>
                                    {['Placed', 'Completed', 'Preparing', 'Cancelled'].map(s => (
                                        <div key={s} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-white/20" />
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{s}</span>
                                            </div>
                                            <span className="text-xl font-black text-white">0</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Intelligence Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Action Required */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-2xl font-display font-black text-[#1C1207]">Priority Dispatch</h3>
                            <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                                {pendingRestaurants + pendingOrders} Pending
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <Link href="/admin/approvals">
                                <motion.div
                                    whileHover={{ x: 12 }}
                                    className="bg-white rounded-[32px] p-8 border border-[#1C1207]/5 flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                                            <Store className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-display font-black text-[#1C1207] text-lg leading-none">Partner Approvals</h4>
                                            <p className="text-xs font-bold text-[#1C1207]/40 uppercase tracking-widest mt-2">
                                                {pendingRestaurants} Pending Verifications
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-[#1C1207]/5 flex items-center justify-center group-hover:bg-[#1C1207] group-hover:text-white transition-all duration-500">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </div>
                                </motion.div>
                            </Link>
                            <Link href="/admin/orders">
                                <motion.div
                                    whileHover={{ x: 12 }}
                                    className="bg-white rounded-[32px] p-8 border border-[#1C1207]/5 flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                            <ShoppingCart className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-display font-black text-[#1C1207] text-lg leading-none">Active Orders</h4>
                                            <p className="text-xs font-bold text-[#1C1207]/40 uppercase tracking-widest mt-2">
                                                {pendingOrders} Awaiting Action
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-[#1C1207]/5 flex items-center justify-center group-hover:bg-[#1C1207] group-hover:text-white transition-all duration-500">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </div>
                                </motion.div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Orders Stream */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-2xl font-display font-black text-[#1C1207]">Recent Activity</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest">Live</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-[40px] border border-[#1C1207]/5 p-8 space-y-8 shadow-sm">
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-8 text-[#1C1207]/30">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                    <p className="font-bold">No activity yet</p>
                                    <p className="text-sm mt-1">Orders will appear here in real-time</p>
                                </div>
                            ) : (
                                recentOrders.slice(0, 5).map((order: any, i: number) => (
                                    <div key={order._id || i} className="flex gap-6 relative">
                                        {i !== Math.min(recentOrders.length, 5) - 1 && (
                                            <div className="absolute left-1.5 top-5 w-[1px] h-12 bg-[#1C1207]/5" />
                                        )}
                                        <div className="w-3 h-3 rounded-full bg-orange-500 mt-2 z-10 shrink-0 shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-[13px] font-bold text-[#1C1207] leading-tight">
                                                Order {order.orderNumber} — ${order.totalAmount?.toFixed(2) || '0.00'} ({order.orderStatus})
                                            </p>
                                            <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
