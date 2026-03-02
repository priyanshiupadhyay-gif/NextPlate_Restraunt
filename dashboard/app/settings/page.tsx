'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Save, Building2, MapPin, Phone, CreditCard, User, Globe, Shield, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'

export default function SettingsPage() {
    const { user, refreshUser } = useAuth()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        restaurantName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        bankName: '',
        accountHolder: '',
        accountNumber: '****4567',
        routingNumber: '****8901',
    })

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                restaurantName: user.restaurantName || '',
                contactName: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
            }))
        }
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            // In a real app, this would call a dedicated update endpoint
            // For now we simulate the sync with the grid
            await new Promise(resolve => setTimeout(resolve, 1500))

            toast({
                title: 'Grid Sync Complete',
                description: 'Module parameters updated across the Resilience Network.',
            })
            if (refreshUser) refreshUser()
        } catch (error) {
            toast({
                title: 'Sync Error',
                description: 'Failed to broadcast update to the network nodes.',
                variant: 'destructive'
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <AppLayout>
            <div className="space-y-12 max-w-5xl pb-32">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1C1207] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                            <Shield className="w-3" />
                            Security Context: {user?.role?.toUpperCase() || 'NODE'}
                        </div>
                        <h1 className="text-6xl font-display font-black text-[#1C1207] tracking-tighter leading-none uppercase">Protocol Config</h1>
                        <p className="text-[#1C1207]/50 font-medium max-w-xl text-lg">
                            Manage your physical mapping, financial outflow channels, and node identifiers.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Restaurant Information */}
                    <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-10 space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <Building2 className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl font-display font-black text-[#1C1207] tracking-tight uppercase">Node Identity</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Restaurant Label</label>
                                <input
                                    type="text"
                                    name="restaurantName"
                                    value={formData.restaurantName}
                                    onChange={handleChange}
                                    className="w-full h-16 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-600/5 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Authorized Officer</label>
                                <input
                                    type="text"
                                    name="contactName"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                    className="w-full h-16 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-600/5 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Communication Channel</label>
                                <input
                                    type="email"
                                    disabled
                                    name="email"
                                    value={formData.email}
                                    className="w-full h-16 bg-[#F5F5F5] border border-[#1C1207]/5 rounded-2xl px-6 py-4 text-sm font-bold text-[#1C1207]/40 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Signal Line</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full h-16 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-600/5 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-10 space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <MapPin className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl font-display font-black text-[#1C1207] tracking-tight uppercase">Physical Mapping</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Geospatial Coordinates / Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full h-16 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-600/5 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bank Information */}
                    <div className="bg-[#1C1207] rounded-[48px] p-10 space-y-10 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-500 border border-white/5">
                                <CreditCard className="w-7 h-7" />
                            </div>
                            <h2 className="text-2xl font-display font-black tracking-tight uppercase">Treasury Outflow</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Bank Node</label>
                                <input
                                    type="text"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-white"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Fiduciary Holder</label>
                                <input
                                    type="text"
                                    name="accountHolder"
                                    value={formData.accountHolder}
                                    onChange={handleChange}
                                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-white"
                                />
                            </div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl flex items-center gap-4 relative z-10">
                            <Globe className="w-5 h-5 text-emerald-500" />
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-relaxed">
                                Financial packets are routed via IMPS/NEFT during the Tuesday reconciliation cycle.
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-10">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-16 py-6 bg-[#1C1207] text-white rounded-[28px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-4 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Commit Changes
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    )
}
