'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { DollarSign, TrendingUp, Percent, CreditCard, Wallet, Loader2, Package } from 'lucide-react'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import { adminService } from '@/lib/admin-service'

export default function FinancePage() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, ordersRes] = await Promise.all([
                    adminService.getAnalytics(),
                    adminService.getOrders({ status: 'completed' })
                ])

                if (analyticsRes.success) {
                    setAnalytics(analyticsRes.analytics)
                }
                if (ordersRes.success) {
                    setOrders(ordersRes.orders)
                }
            } catch {
                // silently fail
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                </div>
            </AppLayout>
        )
    }

    const overview = analytics?.overview || {
        totalOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        totalRestaurants: 0,
    }

    const gmv = overview.totalRevenue
    const commission = gmv * 0.15
    const fees = gmv * 0.02
    const netRevenue = commission + fees
    const avgOrderValue = overview.completedOrders > 0 ? (gmv / overview.completedOrders) : 0

    const revenueBreakdown = [
        { name: 'Commission (15%)', value: Math.round(commission), color: '#1A4D2E' },
        { name: 'Processing Fees (2%)', value: Math.round(fees), color: '#2F855A' },
        { name: 'Restaurant Payout', value: Math.round(gmv - commission - fees), color: '#4ADE80' },
    ]

    // Group completed orders by day for chart
    const ordersByDay: Record<string, { day: string; revenue: number; orders: number }> = {}
    orders.forEach((order: any) => {
        const day = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
        if (!ordersByDay[day]) {
            ordersByDay[day] = { day, revenue: 0, orders: 0 }
        }
        ordersByDay[day].revenue += order.totalAmount || 0
        ordersByDay[day].orders += 1
    })
    const weeklyStats = Object.values(ordersByDay)

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-4xl font-bold text-neutral-900">Financial Dashboard</h1>
                    <p className="text-neutral-600 mt-2">Platform revenue, GMV, and financial metrics — live data</p>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card-base bg-gradient-to-br from-primary-dark to-primary-medium p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-white/80">Total GMV</p>
                                <p className="text-2xl font-bold">${gmv.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm text-white/80">
                            <TrendingUp className="w-4 h-4" />
                            <span>From {overview.completedOrders} completed orders</span>
                        </div>
                    </div>

                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <Percent className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Commission Earned</p>
                                <p className="text-2xl font-bold text-neutral-900">${Math.round(commission).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
                            <span>15% of GMV</span>
                        </div>
                    </div>

                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Processing Fees</p>
                                <p className="text-2xl font-bold text-neutral-900">${Math.round(fees).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm text-blue-600">
                            <span>2% of GMV</span>
                        </div>
                    </div>

                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Net Platform Revenue</p>
                                <p className="text-2xl font-bold text-neutral-900">${Math.round(netRevenue).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-sm text-yellow-600">
                            <span>{gmv > 0 ? Math.round((netRevenue / gmv) * 100) : 0}% of GMV</span>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Weekly Performance */}
                    <div className="lg:col-span-2 card-base bg-white p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-6">Order Performance</h3>
                        {weeklyStats.length === 0 ? (
                            <div className="flex items-center justify-center h-[300px] text-neutral-400">
                                <div className="text-center">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                    <p className="font-medium">No completed orders yet</p>
                                    <p className="text-sm mt-1">Charts will populate as orders are completed</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={weeklyStats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="day" stroke="#6B7280" />
                                    <YAxis yAxisId="left" stroke="#6B7280" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="revenue" fill="#1A4D2E" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="right" dataKey="orders" fill="#4ADE80" name="Orders" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="card-base bg-white p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-6">Revenue Split</h3>
                        {gmv === 0 ? (
                            <div className="flex items-center justify-center h-[200px] text-neutral-400">
                                <p className="font-medium">No revenue data yet</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={revenueBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {revenueBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="mt-4 space-y-2">
                            {revenueBreakdown.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-neutral-600">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-neutral-900">${item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card-base bg-white p-6">
                        <h4 className="text-sm font-medium text-neutral-500 mb-2">Average Order Value</h4>
                        <p className="text-3xl font-bold text-neutral-900">${avgOrderValue.toFixed(2)}</p>
                        <div className="mt-2 flex items-center gap-1 text-sm text-neutral-500">
                            <span>Based on {overview.completedOrders} completed orders</span>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <h4 className="text-sm font-medium text-neutral-500 mb-2">Total Orders</h4>
                        <p className="text-3xl font-bold text-neutral-900">{overview.totalOrders}</p>
                        <div className="mt-2 flex items-center gap-1 text-sm text-neutral-500">
                            <span>{overview.completedOrders} completed</span>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <h4 className="text-sm font-medium text-neutral-500 mb-2">Restaurant Partners</h4>
                        <p className="text-3xl font-bold text-neutral-900">{overview.totalRestaurants}</p>
                        <div className="mt-2 flex items-center gap-1 text-sm text-neutral-500">
                            <span>{overview.verifiedRestaurants || 0} verified</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
