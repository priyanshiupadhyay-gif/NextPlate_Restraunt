'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Search, Filter, MoreVertical, Store, TrendingUp, ShoppingCart, Plus, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { adminService, RestaurantData } from '@/lib/admin-service'

const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-100 text-green-800' },
    suspended: { label: 'Suspended', className: 'bg-red-100 text-red-800' },
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    verified: { label: 'Verified', className: 'bg-blue-100 text-blue-800' },
    unverified: { label: 'Unverified', className: 'bg-orange-100 text-orange-800' },
}

export default function RestaurantsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [restaurants, setRestaurants] = useState<RestaurantData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchRestaurants = async () => {
        try {
            const res = await adminService.listRestaurants()
            if (res.success) {
                setRestaurants(res.restaurants)
            } else {
                setError(res.message || 'Failed to load restaurants')
            }
        } catch {
            setError('Failed to load restaurants')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRestaurants()
    }, [])

    const handleVerify = async (id: string, isVerified: boolean) => {
        const res = await adminService.verifyRestaurant(id, isVerified)
        if (res.success) {
            fetchRestaurants()
        }
    }

    const filteredRestaurants = restaurants.filter(rest => {
        const matchesSearch = rest.name.toLowerCase().includes(searchTerm.toLowerCase())
        if (statusFilter === 'all') return matchesSearch
        if (statusFilter === 'active') return matchesSearch && rest.isActive
        if (statusFilter === 'verified') return matchesSearch && rest.isVerified
        if (statusFilter === 'unverified') return matchesSearch && !rest.isVerified
        return matchesSearch
    })

    const activeCount = restaurants.filter(r => r.isActive).length
    const verifiedCount = restaurants.filter(r => r.isVerified).length

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-neutral-900">Restaurants</h1>
                        <p className="text-neutral-600 mt-2">Manage all registered restaurant partners</p>
                    </div>
                    <Link
                        href="/admin/restaurants/register"
                        className="inline-flex items-center gap-2 px-5 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg, #5C7A6B 0%, #2D4A3E 100%)' }}
                    >
                        <Plus className="w-5 h-5" />
                        Register Restaurant
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-subtle flex items-center justify-center">
                                <Store className="w-6 h-6 text-primary-dark" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Restaurants</p>
                                <p className="text-2xl font-bold text-neutral-900">{restaurants.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <Store className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Active</p>
                                <p className="text-2xl font-bold text-neutral-900">{activeCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Verified</p>
                                <p className="text-2xl font-bold text-neutral-900">{verifiedCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-base bg-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Orders</p>
                                <p className="text-2xl font-bold text-neutral-900">
                                    {restaurants.reduce((sum, r) => sum + (r.totalOrders || 0), 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search restaurants..."
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
                            <option value="active">Active</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                    </div>
                </div>

                {/* Restaurants Table */}
                <div className="card-base bg-white overflow-hidden">
                    {filteredRestaurants.length === 0 ? (
                        <div className="p-12 text-center">
                            <Store className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                                {restaurants.length === 0 ? 'No Restaurants Yet' : 'No matching restaurants'}
                            </h3>
                            <p className="text-neutral-500 mb-6">
                                {restaurants.length === 0
                                    ? 'Register your first restaurant to get started.'
                                    : 'Try adjusting your search or filter criteria.'}
                            </p>
                            {restaurants.length === 0 && (
                                <Link
                                    href="/admin/restaurants/register"
                                    className="inline-flex items-center gap-2 px-5 py-3 text-white font-semibold rounded-xl"
                                    style={{ background: 'linear-gradient(135deg, #5C7A6B 0%, #2D4A3E 100%)' }}
                                >
                                    <Plus className="w-5 h-5" />
                                    Register First Restaurant
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-neutral-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Restaurant</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Orders</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Verified</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredRestaurants.map((restaurant) => {
                                        const ownerName = (typeof restaurant.ownerId === 'object' && restaurant.ownerId !== null)
                                            ? restaurant.ownerId.fullName
                                            : '';
                                        const location = `${restaurant.address?.city || ''}, ${restaurant.address?.state || ''}`;

                                        return (
                                            <tr key={restaurant._id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-neutral-900">{restaurant.name}</div>
                                                    {ownerName && <div className="text-sm text-neutral-500">{ownerName}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-neutral-600">{location}</td>
                                                <td className="px-6 py-4 font-medium text-neutral-900">{(restaurant.totalOrders || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${restaurant.isVerified ? statusConfig.verified.className : statusConfig.unverified.className}`}>
                                                        {restaurant.isVerified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${restaurant.isActive ? statusConfig.active.className : statusConfig.suspended.className}`}>
                                                        {restaurant.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {!restaurant.isVerified ? (
                                                            <button
                                                                onClick={() => handleVerify(restaurant._id, true)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
                                                            >
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Verify
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleVerify(restaurant._id, false)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                Unverify
                                                            </button>
                                                        )}
                                                    </div>
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
