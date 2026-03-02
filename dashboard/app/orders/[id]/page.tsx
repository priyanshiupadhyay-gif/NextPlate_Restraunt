'use client'

import React, { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft, QrCode, Clock, User, MapPin, Phone, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface OrderItem {
    name: string
    quantity: number
    price: number
}

interface OrderDetail {
    id: string
    customer: {
        name: string
        phone: string
        email: string
    }
    items: OrderItem[]
    subtotal: number
    platformFee: number
    total: number
    status: 'new' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'cancelled'
    pickupWindow: {
        start: string
        end: string
    }
    placedAt: string
    specialInstructions?: string
}

const statusTimeline = [
    { key: 'new', label: 'Order Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'picked_up', label: 'Picked Up' },
]

const mockOrder: OrderDetail = {
    id: 'A1B2C3',
    customer: {
        name: 'John Doe',
        phone: '+1 (555) 123-4567',
        email: 'john.d@email.com',
    },
    items: [
        { name: 'Pasta Primavera', quantity: 2, price: 12.99 },
        { name: 'Tiramisu', quantity: 1, price: 6.99 },
    ],
    subtotal: 32.97,
    platformFee: 3.30,
    total: 28.00,
    status: 'new',
    pickupWindow: {
        start: '2:30 PM',
        end: '3:00 PM',
    },
    placedAt: '2:15 PM',
    specialInstructions: 'Please pack items separately',
}

export default function OrderDetailPage() {
    const params = useParams()
    const [order, setOrder] = useState<OrderDetail>(mockOrder)

    const currentStatusIndex = statusTimeline.findIndex(s => s.key === order.status)

    const handleAccept = () => {
        setOrder({ ...order, status: 'accepted' })
    }

    const handleReject = () => {
        setOrder({ ...order, status: 'cancelled' })
    }

    const handleMarkReady = () => {
        setOrder({ ...order, status: 'ready' })
    }

    return (
        <AppLayout>
            <div className="space-y-6 max-w-4xl">
                {/* Back Button */}
                <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Orders
                </Link>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Order #{order.id}</h1>
                        <p className="text-neutral-600 mt-1">Placed at {order.placedAt}</p>
                    </div>
                    <Link
                        href="/qr-scanner"
                        className="btn-primary flex items-center gap-2 self-start"
                    >
                        <QrCode className="w-5 h-5" />
                        Scan Pickup QR
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Timeline */}
                        <div className="card-base bg-white p-6">
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Order Status</h2>
                            <div className="relative">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" />
                                <div className="space-y-6">
                                    {statusTimeline.map((step, idx) => {
                                        const isCompleted = idx <= currentStatusIndex
                                        const isCurrent = idx === currentStatusIndex
                                        return (
                                            <div key={step.key} className="relative flex items-center gap-4">
                                                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${isCompleted
                                                        ? 'bg-primary-dark text-white'
                                                        : 'bg-neutral-100 text-neutral-400 border-2 border-neutral-200'
                                                    }`}>
                                                    {isCompleted ? (
                                                        <CheckCircle className="w-4 h-4" />
                                                    ) : (
                                                        <span className="text-xs font-medium">{idx + 1}</span>
                                                    )}
                                                </div>
                                                <span className={`font-medium ${isCurrent ? 'text-primary-dark' : isCompleted ? 'text-neutral-900' : 'text-neutral-400'
                                                    }`}>
                                                    {step.label}
                                                </span>
                                                {isCurrent && order.status !== 'picked_up' && order.status !== 'cancelled' && (
                                                    <span className="ml-auto text-xs bg-primary-subtle text-primary-dark px-2 py-1 rounded-full">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="card-base bg-white p-6">
                            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Items</h2>
                            <div className="space-y-4">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                                        <div>
                                            <p className="font-medium text-neutral-900">{item.name}</p>
                                            <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium text-neutral-900">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-border space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal</span>
                                    <span className="text-neutral-900">${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Customer Savings</span>
                                    <span className="text-green-600">-${(order.subtotal - order.total + order.platformFee).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-lg pt-2">
                                    <span className="text-neutral-900">Your Earnings</span>
                                    <span className="text-primary-dark">${order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Special Instructions */}
                        {order.specialInstructions && (
                            <div className="card-base bg-yellow-50 border-yellow-200 p-4">
                                <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                                <p className="text-yellow-700">{order.specialInstructions}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="card-base bg-white p-6">
                            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Customer</h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-neutral-400" />
                                    <span className="text-neutral-900">{order.customer.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-neutral-400" />
                                    <span className="text-neutral-900">{order.customer.phone}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pickup Window */}
                        <div className="card-base bg-primary-subtle p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Clock className="w-5 h-5 text-primary-dark" />
                                <h2 className="font-semibold text-primary-dark">Pickup Window</h2>
                            </div>
                            <p className="text-2xl font-bold text-neutral-900">
                                {order.pickupWindow.start} - {order.pickupWindow.end}
                            </p>
                        </div>

                        {/* Actions */}
                        {order.status === 'new' && (
                            <div className="space-y-3">
                                <button onClick={handleAccept} className="btn-primary w-full flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Accept Order
                                </button>
                                <button onClick={handleReject} className="btn-danger w-full flex items-center justify-center gap-2">
                                    <XCircle className="w-5 h-5" />
                                    Reject Order
                                </button>
                            </div>
                        )}

                        {(order.status === 'accepted' || order.status === 'preparing') && (
                            <button onClick={handleMarkReady} className="btn-primary w-full">
                                Mark as Ready for Pickup
                            </button>
                        )}

                        {order.status === 'cancelled' && (
                            <div className="card-base bg-red-50 border-red-200 p-4 text-center">
                                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                <p className="font-medium text-red-800">Order Cancelled</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
