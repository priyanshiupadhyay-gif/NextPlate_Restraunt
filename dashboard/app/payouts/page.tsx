'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { DollarSign, Download, Calendar, CheckCircle, Clock, Loader2, Package } from 'lucide-react'
import { restaurantService } from '@/lib/restaurant-service'

interface Payout {
    id: string
    weekEnding: string
    grossEarnings: number
    commission: number
    processingFee: number
    netPayout: number
    status: 'pending' | 'processing' | 'paid'
    paidDate?: string
}

const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800', icon: Clock },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800', icon: CheckCircle },
}

export default function PayoutsPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await restaurantService.getOrders({ status: 'completed' })
                if (res.success) {
                    setOrders(res.orders)
                } else {
                    setError(res.message || 'Failed to sync with grid')
                }
            } catch {
                setError('Signal loss: Failed to fetch transaction metadata')
            } finally {
                setIsLoading(false)
            }
        }
        fetchOrders()
    }, [])

    // Calculate payouts logically from aggregated orders (weekly)
    // For now, since no Payout model exists, we'll group orders by week and show them as "Generated Payouts"
    const groupedPayouts: Record<string, Payout> = {}

    orders.forEach(order => {
        const d = new Date(order.createdAt)
        const week = `Week ${Math.ceil(d.getDate() / 7)}, ${d.toLocaleString('default', { month: 'short' })}`
        const id = `PAY-${d.getMonth()}${Math.ceil(d.getDate() / 7)}`

        if (!groupedPayouts[id]) {
            groupedPayouts[id] = {
                id,
                weekEnding: week,
                grossEarnings: 0,
                commission: 0,
                processingFee: 0,
                netPayout: 0,
                status: 'pending'
            }
        }

        const gross = order.totalAmount || 0
        const comm = gross * 0.15
        const fee = gross * 0.02

        groupedPayouts[id].grossEarnings += gross
        groupedPayouts[id].commission += comm
        groupedPayouts[id].processingFee += fee
        groupedPayouts[id].netPayout += (gross - comm - fee)
    })

    const payoutsList = Object.values(groupedPayouts).sort((a, b) => b.id.localeCompare(a.id))

    const totalPaid = 0 // Cannot determine "paid" status without backend Payout model
    const totalPending = payoutsList.reduce((sum, p) => sum + p.netPayout, 0)

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-40">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
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
                        <h1 className="text-4xl font-bold text-neutral-900">Payout History</h1>
                        <p className="text-neutral-600 mt-2">Track your weekly payouts and payment status — Live Aggregate</p>
                    </div>
                    <button className="btn-secondary flex items-center gap-2 self-start py-4 px-8 border-[#1C1207]/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl">
                        <Download className="w-4 h-4" />
                        Export Ledger
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card-base bg-white p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                <DollarSign className="w-7 h-7 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Lifetime Remitted</p>
                                <p className="text-3xl font-black text-neutral-900">${totalPaid.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-base bg-[#1C1207] p-8 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Clock className="w-7 h-7 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Unsettled Balance</p>
                                <p className="text-3xl font-black text-white">${totalPending.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-base bg-orange-50 p-8 border-orange-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                                <Calendar className="w-7 h-7 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-orange-600/50 uppercase tracking-widest mb-1">Next Cycle</p>
                                <p className="text-3xl font-black text-orange-600">Tuesday</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payouts Table */}
                <div className="card-base bg-white overflow-hidden border-[#1C1207]/5 shadow-2xl shadow-[#1C1207]/5 rounded-[40px]">
                    <div className="p-8 border-b border-[#1C1207]/5 flex items-center justify-between">
                        <h2 className="text-xl font-display font-black text-neutral-900">Settlement Ledger</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Live Sync</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {payoutsList.length > 0 ? (
                            <table className="w-full">
                                <thead className="bg-neutral-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] font-display">Period</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] font-display">Gross Sales</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] font-display">Service Fee</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] font-display">Settlement</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] font-display">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1C1207]/5">
                                    {payoutsList.map((payout) => {
                                        const config = statusConfig[payout.status]
                                        const StatusIcon = config.icon
                                        return (
                                            <tr key={payout.id} className="hover:bg-neutral-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-neutral-900">{payout.weekEnding}</div>
                                                    <div className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest mt-1">{payout.id}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right font-bold text-neutral-900">${payout.grossEarnings.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right text-orange-600 font-bold">-${payout.commission.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right font-black text-neutral-900 text-lg">${payout.netPayout.toLocaleString()}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${config.className}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-24 text-center">
                                <Package className="w-16 h-16 text-neutral-100 mx-auto mb-4" />
                                <p className="text-neutral-300 font-black text-xs uppercase tracking-widest">No payout cycles recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="card-base bg-[#FFF8F0] border-orange-100 p-10 rounded-[40px]">
                    <h3 className="font-display font-black text-[#1C1207] text-lg uppercase tracking-tight mb-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1C1207] text-white flex items-center justify-center"><CheckCircle className="w-4 h-4" /></div>
                        Protocol Settlement
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <ul className="text-xs font-bold text-[#1C1207]/60 space-y-3 uppercase tracking-widest leading-relaxed">
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0" />
                                Payouts are reconciled every Tuesday for the previous cycle
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0" />
                                Platform service fee is a fixed 15% flat rate
                            </li>
                        </ul>
                        <ul className="text-xs font-bold text-[#1C1207]/60 space-y-3 uppercase tracking-widest leading-relaxed">
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0" />
                                Includes 2% external payment processing overhead
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0" />
                                Distributed via IMPS/NEFT to verification node
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
