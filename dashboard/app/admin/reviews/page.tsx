'use client'

import React from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Star, Flag, MessageSquare } from 'lucide-react'

export default function ReviewsPage() {
    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-4xl font-bold text-neutral-900">Reviews Moderation</h1>
                    <p className="text-neutral-600 mt-2">Review and moderate flagged customer reviews</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <Flag className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Flagged Reviews</p>
                                <p className="text-2xl font-bold text-neutral-900">0</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Star className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Avg Platform Rating</p>
                                <p className="text-2xl font-bold text-neutral-900">—</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-neutral-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Reviews</p>
                                <p className="text-2xl font-bold text-neutral-900">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                <div className="card-base bg-white p-16 text-center">
                    <Flag className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-neutral-800 mb-2">No Reviews Yet</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                        Customer reviews will appear here as users start leaving feedback on their rescue orders.
                        The review system will be activated once orders start flowing.
                    </p>
                </div>
            </div>
        </AppLayout>
    )
}
