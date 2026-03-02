'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Download, CheckCircle, Clock, DollarSign, Calendar, FileText } from 'lucide-react'
import { adminService } from '@/lib/admin-service'

interface PayoutRecord {
    id: string
    restaurant: string
    amount: number
    orders: number
    status: 'pending' | 'processing' | 'paid'
    weekEnding: string
    paidDate?: string
}

const mockPayouts: PayoutRecord[] = [
    { id: 'PAY-001', restaurant: 'Green Garden Café', amount: 1245.50, orders: 45, status: 'pending', weekEnding: 'Feb 9, 2026' },
    { id: 'PAY-002', restaurant: 'Urban Eats', amount: 892.30, orders: 32, status: 'pending', weekEnding: 'Feb 9, 2026' },
    { id: 'PAY-003', restaurant: 'Sunrise Bakery', amount: 567.80, orders: 21, status: 'pending', weekEnding: 'Feb 9, 2026' },
    { id: 'PAY-004', restaurant: 'Taco Fiesta', amount: 723.45, orders: 28, status: 'pending', weekEnding: 'Feb 9, 2026' },
    { id: 'PAY-005', restaurant: 'Pasta Palace', amount: 1089.20, orders: 41, status: 'paid', weekEnding: 'Feb 2, 2026', paidDate: 'Feb 4, 2026' },
    { id: 'PAY-006', restaurant: 'Green Garden Café', amount: 1156.75, orders: 43, status: 'paid', weekEnding: 'Feb 2, 2026', paidDate: 'Feb 4, 2026' },
]

const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
}

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<PayoutRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedPayouts, setSelectedPayouts] = useState<string[]>([])

    const fetchPayouts = async () => {
        setIsLoading(true)
        try {
            const res = await adminService.getOrders({ status: 'completed' })
            if (res.success) {
                // Group orders by restaurant to calculate payouts
                const restaurantPayouts: Record<string, PayoutRecord> = {}

                res.orders.forEach((order: any) => {
                    const restId = typeof order.restaurantId === 'object' ? order.restaurantId._id : order.restaurantId
                    const restName = typeof order.restaurantId === 'object' ? order.restaurantId.name : 'Unknown Restaurant'

                    if (!restaurantPayouts[restId]) {
                        restaurantPayouts[restId] = {
                            id: `PAY-${restId.substring(restId.length - 4)}`,
                            restaurant: restName,
                            amount: 0,
                            orders: 0,
                            status: 'pending',
                            weekEnding: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        }
                    }

                    restaurantPayouts[restId].amount += order.totalAmount
                    restaurantPayouts[restId].orders += 1
                })

                setPayouts(Object.values(restaurantPayouts))
            } else {
                setError(res.message || 'Failed to fetch payouts')
            }
        } catch (err) {
            setError('An error occurred while processing payouts')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPayouts()
    }, [])

    const pendingPayouts = payouts.filter(p => p.status === 'pending')
    const totalPendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0)

    const handleSelectAll = () => {
        if (selectedPayouts.length === pendingPayouts.length) {
            setSelectedPayouts([])
        } else {
            setSelectedPayouts(pendingPayouts.map(p => p.id))
        }
    }

    const handleSelect = (id: string) => {
        if (selectedPayouts.includes(id)) {
            setSelectedPayouts(selectedPayouts.filter(p => p !== id))
        } else {
            setSelectedPayouts([...selectedPayouts, id])
        }
    }

    const handleMarkAsPaid = () => {
        setPayouts(payouts.map(p =>
            selectedPayouts.includes(p.id)
                ? { ...p, status: 'paid' as const, paidDate: new Date().toLocaleDateString() }
                : p
        ))
        setSelectedPayouts([])
    }

    const handleGenerateReport = () => {
        // In real app, this would generate/download a CSV
        alert('Generating payout report...')
    }

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark"></div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-neutral-900">Payout Processing</h1>
                        <p className="text-neutral-600 mt-2">Process weekly restaurant payouts</p>
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        className="btn-secondary flex items-center gap-2 self-start"
                    >
                        <FileText className="w-4 h-4" />
                        Generate Report
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card-base bg-yellow-50 border-yellow-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-yellow-700">Pending Payouts</p>
                                <p className="text-2xl font-bold text-yellow-800">{pendingPayouts.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Pending Amount</p>
                                <p className="text-2xl font-bold text-neutral-900">${totalPendingAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Paid This Week</p>
                                <p className="text-2xl font-bold text-neutral-900">$0.00</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-subtle flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-primary-dark" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Next Payout Date</p>
                                <p className="text-2xl font-bold text-neutral-900">Next Friday</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Payouts Table */}
                <div className="card-base bg-white overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-900">Pending Payouts</h2>
                            <p className="text-sm text-neutral-500">Weekly accumulation from completed orders</p>
                        </div>
                        {selectedPayouts.length > 0 && (
                            <button onClick={handleMarkAsPaid} className="btn-primary flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Mark {selectedPayouts.length} as Paid
                            </button>
                        )}
                    </div>
                    {pendingPayouts.length === 0 ? (
                        <div className="p-12 text-center text-neutral-500 italic">
                            No pending payouts today.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedPayouts.length === pendingPayouts.length && pendingPayouts.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded border-neutral-300 text-primary-dark focus:ring-primary-dark"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Restaurant</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Orders</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {pendingPayouts.map((payout) => (
                                        <tr key={payout.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPayouts.includes(payout.id)}
                                                    onChange={() => handleSelect(payout.id)}
                                                    className="w-4 h-4 rounded border-neutral-300 text-primary-dark focus:ring-primary-dark"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-neutral-900">{payout.restaurant}</div>
                                                <div className="text-sm text-neutral-500">{payout.id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-900">{payout.orders}</td>
                                            <td className="px-6 py-4 font-semibold text-neutral-900">${payout.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusConfig[payout.status].className}`}>
                                                    {statusConfig[payout.status].label}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Payouts */}
                <div className="card-base bg-white overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-neutral-900">Recent Payouts</h2>
                        <button className="text-sm text-primary-dark hover:underline flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Restaurant</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Week Ending</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Paid Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payouts.filter(p => p.status === 'paid').map((payout) => (
                                    <tr key={payout.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-neutral-900">{payout.restaurant}</td>
                                        <td className="px-6 py-4 text-neutral-600">{payout.weekEnding}</td>
                                        <td className="px-6 py-4 font-medium text-neutral-900">${payout.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-neutral-600">{payout.paidDate}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Paid
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
