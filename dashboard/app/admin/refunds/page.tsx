'use client'

import React from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { AlertTriangle, CheckCircle, DollarSign, Clock } from 'lucide-react'

export default function RefundsPage() {
    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-4xl font-bold text-neutral-900">Refund Management</h1>
                    <p className="text-neutral-600 mt-2">Review and process customer refund requests</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Pending Review</p>
                                <p className="text-2xl font-bold text-neutral-900">0</p>
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
                                <p className="text-2xl font-bold text-neutral-900">$0.00</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Processed</p>
                                <p className="text-2xl font-bold text-neutral-900">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                <div className="card-base bg-white p-16 text-center">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-neutral-800 mb-2">No Refund Requests</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                        All clear! Refund requests from customers will appear here when they are submitted.
                        The refund system will be activated once the platform processes its first orders.
                    </p>
                </div>
            </div>
        </AppLayout>
    )
}
