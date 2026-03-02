'use client'

import React, { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { ArrowLeft, Store, User, MapPin, Clock, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { adminService, OnboardRestaurantData } from '@/lib/admin-service'

const CUISINE_OPTIONS = [
    'Indian', 'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican',
    'Japanese', 'Thai', 'Continental', 'Bakery', 'Desserts', 'Beverages',
    'Cafe', 'Fast Food', 'Street Food', 'Healthy', 'Vegan', 'Organic',
    'Seafood', 'Tandoor', 'Biryani', 'Pizza', 'Burger', 'Grills',
    'Heritage', 'Brunch', 'French', 'Coastal',
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

interface OperatingDay {
    open: string
    close: string
    isClosed: boolean
}

type OperatingHours = Record<typeof DAYS[number], OperatingDay>

export default function RegisterRestaurantPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Owner fields
    const [ownerName, setOwnerName] = useState('')
    const [ownerEmail, setOwnerEmail] = useState('')
    const [ownerPhone, setOwnerPhone] = useState('')
    const [ownerPassword, setOwnerPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Restaurant fields
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
    const [contactPhone, setContactPhone] = useState('')
    const [contactEmail, setContactEmail] = useState('')

    // Address fields
    const [street, setStreet] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [zipCode, setZipCode] = useState('')
    const [latitude, setLatitude] = useState('')
    const [longitude, setLongitude] = useState('')

    // Operating hours
    const [operatingHours, setOperatingHours] = useState<OperatingHours>(
        DAYS.reduce((acc, day) => ({
            ...acc,
            [day]: { open: '09:00', close: '22:00', isClosed: false }
        }), {} as OperatingHours)
    )

    const toggleCuisine = (cuisine: string) => {
        setSelectedCuisines(prev =>
            prev.includes(cuisine)
                ? prev.filter(c => c !== cuisine)
                : [...prev, cuisine]
        )
    }

    const updateHours = (day: typeof DAYS[number], field: keyof OperatingDay, value: string | boolean) => {
        setOperatingHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setIsSubmitting(true)

        // Validation
        if (!ownerName || !ownerEmail || !ownerPhone || !ownerPassword) {
            setError('All owner fields are required')
            setIsSubmitting(false)
            return
        }
        if (!name || !contactPhone) {
            setError('Restaurant name and contact phone are required')
            setIsSubmitting(false)
            return
        }
        if (!street || !city || !state || !zipCode) {
            setError('All address fields are required')
            setIsSubmitting(false)
            return
        }
        if (selectedCuisines.length === 0) {
            setError('Please select at least one cuisine type')
            setIsSubmitting(false)
            return
        }

        const data: OnboardRestaurantData = {
            ownerName,
            ownerEmail,
            ownerPhone,
            ownerPassword,
            name,
            description,
            cuisine: selectedCuisines,
            contactPhone,
            contactEmail,
            address: {
                street,
                city,
                state,
                zipCode,
                location: {
                    type: 'Point',
                    coordinates: [
                        parseFloat(longitude) || 72.8777,
                        parseFloat(latitude) || 19.0760,
                    ],
                },
            },
        }

        try {
            const res = await adminService.onboardRestaurant(data)
            if (res.success) {
                setSuccess('Restaurant registered successfully! Redirecting...')
                setTimeout(() => router.push('/admin/restaurants'), 2000)
            } else {
                setError(res.message || 'Failed to register restaurant')
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/restaurants"
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Register New Restaurant</h1>
                        <p className="text-neutral-600 mt-1">Fill in the details to onboard a new restaurant partner</p>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Owner Details */}
                    <div className="card-base bg-white p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">Owner Details</h2>
                                <p className="text-sm text-neutral-500">This creates the login account for the restaurant owner</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
                                <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="e.g. Rajesh Kumar" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
                                <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="owner@restaurant.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number *</label>
                                <input type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="+91 9876543210" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Password *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={ownerPassword}
                                        onChange={e => setOwnerPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all pr-12"
                                        placeholder="Min 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Restaurant Details */}
                    <div className="card-base bg-white p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                <Store className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">Restaurant Details</h2>
                                <p className="text-sm text-neutral-500">Basic information about the restaurant</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Restaurant Name *</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="e.g. The Green Kitchen" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                                    placeholder="A brief description of the restaurant..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Phone *</label>
                                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required
                                        className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="+91 9876543210" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Email</label>
                                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="info@restaurant.com" />
                                </div>
                            </div>
                            {/* Cuisine Selection */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Cuisine Types *</label>
                                <div className="flex flex-wrap gap-2">
                                    {CUISINE_OPTIONS.map(cuisine => (
                                        <button
                                            key={cuisine}
                                            type="button"
                                            onClick={() => toggleCuisine(cuisine)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${selectedCuisines.includes(cuisine)
                                                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                                                : 'bg-white text-neutral-600 border-neutral-300 hover:border-green-400 hover:text-green-700'
                                                }`}
                                        >
                                            {cuisine}
                                        </button>
                                    ))}
                                </div>
                                {selectedCuisines.length > 0 && (
                                    <p className="mt-2 text-sm text-green-600">{selectedCuisines.length} cuisine(s) selected</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="card-base bg-white p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">Address</h2>
                                <p className="text-sm text-neutral-500">Restaurant location details</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Street Address *</label>
                                <input type="text" value={street} onChange={e => setStreet(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="123 Main Street" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">City *</label>
                                <input type="text" value={city} onChange={e => setCity(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="Mumbai" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">State *</label>
                                <input type="text" value={state} onChange={e => setState(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="Maharashtra" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Zip Code *</label>
                                <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} required
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="400001" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Latitude</label>
                                <input type="text" value={latitude} onChange={e => setLatitude(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="19.0760 (optional)" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Longitude</label>
                                <input type="text" value={longitude} onChange={e => setLongitude(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="72.8777 (optional)" />
                            </div>
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="card-base bg-white p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-neutral-900">Operating Hours</h2>
                                <p className="text-sm text-neutral-500">Set opening and closing times for each day</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {DAYS.map(day => (
                                <div key={day} className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                                    <div className="w-28">
                                        <span className="text-sm font-medium text-neutral-700 capitalize">{day}</span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!operatingHours[day].isClosed}
                                            onChange={e => updateHours(day, 'isClosed', !e.target.checked)}
                                            className="w-4 h-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-neutral-600">Open</span>
                                    </label>
                                    {!operatingHours[day].isClosed && (
                                        <>
                                            <input
                                                type="time"
                                                value={operatingHours[day].open}
                                                onChange={e => updateHours(day, 'open', e.target.value)}
                                                className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                            <span className="text-neutral-400">to</span>
                                            <input
                                                type="time"
                                                value={operatingHours[day].close}
                                                onChange={e => updateHours(day, 'close', e.target.value)}
                                                className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </>
                                    )}
                                    {operatingHours[day].isClosed && (
                                        <span className="text-sm text-red-500 italic">Closed</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href="/admin/restaurants"
                            className="px-6 py-3 text-neutral-600 font-medium rounded-xl border border-neutral-300 hover:bg-neutral-50 transition-all"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            style={{ background: 'linear-gradient(135deg, #5C7A6B 0%, #2D4A3E 100%)' }}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Register Restaurant
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    )
}
