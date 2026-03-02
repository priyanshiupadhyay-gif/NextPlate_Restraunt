'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, Package, Loader2, Download } from 'lucide-react'
import { adminService } from '@/lib/admin-service'
import { exportOrdersCSV } from '@/lib/csv-export'

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    placed: { label: 'Placed', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    preparing: { label: 'Preparing', className: 'bg-purple-100 text-purple-800', icon: Package },
    ready: { label: 'Ready', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function OrdersMonitorPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const params: any = {}
                if (statusFilter !== 'all') params.status = statusFilter
                const res = await adminService.getOrders(params)
                if (res.success) {
                    setOrders(res.orders)
                } else {
                    setError(res.message || 'Failed to load orders')
                }
            } catch {
                setError('Failed to load orders')
            } finally {
                setIsLoading(false)
            }
        }
        fetchOrders()
    }, [statusFilter])

    const filteredOrders = orders.filter(order => {
        const orderNumber = order.orderNumber || ''
        const restaurantName = typeof order.restaurantId === 'object' ? order.restaurantId?.name || '' : ''
        const customerName = typeof order.customerId === 'object' ? order.customerId?.fullName || '' : ''

        return orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const orderCounts = {
        total: orders.length,
        pending: orders.filter(o => o.orderStatus === 'placed').length,
        inProgress: orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.orderStatus)).length,
        completed: orders.filter(o => o.orderStatus === 'completed').length,
    }

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-4xl font-bold text-neutral-900">Orders Monitor</h1>
                    <p className="text-neutral-600 mt-2">Track all platform orders in real-time</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card-base bg-white p-4 text-center">
                        <p className="text-3xl font-bold text-neutral-900">{orderCounts.total}</p>
                        <p className="text-sm text-neutral-600">Total Orders</p>
                    </div>
                    <div className="card-base bg-yellow-50 border-yellow-200 p-4 text-center">
                        <p className="text-3xl font-bold text-yellow-700">{orderCounts.pending}</p>
                        <p className="text-sm text-yellow-600">Placed</p>
                    </div>
                    <div className="card-base bg-blue-50 border-blue-200 p-4 text-center">
                        <p className="text-3xl font-bold text-blue-700">{orderCounts.inProgress}</p>
                        <p className="text-sm text-blue-600">In Progress</p>
                    </div>
                    <div className="card-base bg-green-50 border-green-200 p-4 text-center">
                        <p className="text-3xl font-bold text-green-700">{orderCounts.completed}</p>
                        <p className="text-sm text-green-600">Completed</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID, restaurant, or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary-dark focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-neutral-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="placed">Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <button
                        onClick={() => exportOrdersCSV(filteredOrders)}
                        disabled={filteredOrders.length === 0}
                        className="px-6 py-3 bg-[#1C1207] text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                {/* Orders Table */}
                <div className="card-base bg-white overflow-hidden">
                    {filteredOrders.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                                {orders.length === 0 ? 'No Orders Yet' : 'No matching orders'}
                            </h3>
                            <p className="text-neutral-500">
                                {orders.length === 0
                                    ? 'Orders will appear here as customers place them.'
                                    : 'Try adjusting your search or filter criteria.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Restaurant</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredOrders.map((order) => {
                                        const config = statusConfig[order.orderStatus] || statusConfig.placed
                                        const StatusIcon = config.icon
                                        const restaurantName = typeof order.restaurantId === 'object' ? order.restaurantId?.name : 'N/A'
                                        const customerName = typeof order.customerId === 'object' ? order.customerId?.fullName : 'N/A'
                                        const itemCount = order.items?.length || 0

                                        return (
                                            <tr key={order._id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-medium text-neutral-900">{order.orderNumber}</span>
                                                </td>
                                                <td className="px-6 py-4 text-neutral-900">{restaurantName}</td>
                                                <td className="px-6 py-4 text-neutral-600">{customerName}</td>
                                                <td className="px-6 py-4 text-neutral-900">{itemCount}</td>
                                                <td className="px-6 py-4 font-medium text-neutral-900">${order.totalAmount?.toFixed(2) || '0.00'}</td>
                                                <td className="px-6 py-4 text-neutral-600 text-sm">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {config.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
