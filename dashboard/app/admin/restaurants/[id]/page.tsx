'use client'

import React from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft, Store, MapPin, Phone, Mail, Calendar, TrendingUp, ShoppingCart, DollarSign, Ban, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

const mockRestaurant = {
    id: 'REST-001',
    name: 'Green Garden Café',
    ownerName: 'John Smith',
    email: 'contact@greengarden.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, San Francisco, CA 94102',
    status: 'active' as const,
    joinedAt: 'Jan 15, 2026',
    totalOrders: 1245,
    totalRevenue: 28450,
    avgOrderValue: 22.85,
    commission: 4267.50,
}

const mockWeeklyData = [
    { day: 'Mon', orders: 15, revenue: 342 },
    { day: 'Tue', orders: 22, revenue: 502 },
    { day: 'Wed', orders: 18, revenue: 411 },
    { day: 'Thu', orders: 25, revenue: 571 },
    { day: 'Fri', orders: 32, revenue: 731 },
    { day: 'Sat', orders: 28, revenue: 639 },
    { day: 'Sun', orders: 20, revenue: 457 },
]

const mockRecentOrders = [
    { id: '#A1B2C3', items: 3, total: 34.50, status: 'completed', time: '2 hours ago' },
    { id: '#D4E5F6', items: 2, total: 22.00, status: 'picked_up', time: '4 hours ago' },
    { id: '#G7H8I9', items: 4, total: 48.75, status: 'completed', time: '6 hours ago' },
    { id: '#J1K2L3', items: 1, total: 12.99, status: 'cancelled', time: '8 hours ago' },
]

const mockListings = [
    { id: 1, name: 'Pasta Primavera', price: 8.99, originalPrice: 14.99, quantity: 5, status: 'active' },
    { id: 2, name: 'Margherita Pizza', price: 6.99, originalPrice: 12.99, quantity: 3, status: 'active' },
    { id: 3, name: 'Tiramisu', price: 4.99, originalPrice: 8.99, quantity: 8, status: 'active' },
    { id: 4, name: 'Caesar Salad', price: 5.99, originalPrice: 9.99, quantity: 0, status: 'sold_out' },
]

export default function RestaurantDetailPage() {
    const params = useParams()

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Back Button */}
                <Link
                    href="/admin/restaurants"
                    className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Restaurants
                </Link>

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary-subtle flex items-center justify-center">
                            <Store className="w-8 h-8 text-primary-dark" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-neutral-900">{mockRestaurant.name}</h1>
                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                                    Active
                                </span>
                            </div>
                            <p className="text-neutral-600 mt-1">Owned by {mockRestaurant.ownerName}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn-secondary flex items-center gap-2">
                            <Ban className="w-4 h-4" />
                            Suspend
                        </button>
                        <button className="btn-primary flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Contact
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Orders</p>
                                <p className="text-2xl font-bold text-neutral-900">{mockRestaurant.totalOrders.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-neutral-900">${mockRestaurant.totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Avg Order Value</p>
                                <p className="text-2xl font-bold text-neutral-900">${mockRestaurant.avgOrderValue}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-subtle flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-primary-dark" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Commission Earned</p>
                                <p className="text-2xl font-bold text-neutral-900">${mockRestaurant.commission.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Weekly Chart */}
                    <div className="lg:col-span-2 card-base bg-white p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-6">Weekly Performance</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={mockWeeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="day" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar dataKey="orders" fill="#1A4D2E" name="Orders" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Contact Info */}
                    <div className="card-base bg-white p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-neutral-400" />
                                <span className="text-neutral-700">{mockRestaurant.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-neutral-400" />
                                <span className="text-neutral-700">{mockRestaurant.phone}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                                <span className="text-neutral-700">{mockRestaurant.address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-neutral-400" />
                                <span className="text-neutral-700">Joined {mockRestaurant.joinedAt}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Listings & Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Listings */}
                    <div className="card-base bg-white p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Current Listings</h3>
                        <div className="space-y-3">
                            {mockListings.map((listing) => (
                                <div key={listing.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                                    <div>
                                        <p className="font-medium text-neutral-900">{listing.name}</p>
                                        <p className="text-sm text-neutral-500">
                                            <span className="line-through">${listing.originalPrice}</span>
                                            {' → '}
                                            <span className="text-primary-dark font-medium">${listing.price}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${listing.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {listing.quantity > 0 ? `${listing.quantity} left` : 'Sold Out'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="card-base bg-white p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Orders</h3>
                        <div className="space-y-3">
                            {mockRecentOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                                    <div>
                                        <p className="font-medium text-neutral-900">{order.id}</p>
                                        <p className="text-sm text-neutral-500">{order.items} items • {order.time}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-neutral-900">${order.total.toFixed(2)}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                order.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
