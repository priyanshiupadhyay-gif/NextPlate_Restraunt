'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { CheckCircle, XCircle, Clock, MapPin, Phone, Mail, ShieldCheck, Heart } from 'lucide-react'
import { adminService } from '@/lib/admin-service'
import { toast } from 'sonner'

export default function ApprovalsPage() {
    const [applications, setApplications] = useState<any[]>([])
    const [ngos, setNgos] = useState<any[]>([])
    const [selectedApp, setSelectedApp] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [stats, setStats] = useState({
        pending: 0,
        approvedThisWeek: 0,
        rejectedThisWeek: 0
    })
    const [changeRequests, setChangeRequests] = useState<any[]>([])

    const fetchApplications = async () => {
        try {
            const [restRes, analyticsRes, requestsRes, ngoRes] = await Promise.all([
                adminService.listRestaurants({ isVerified: false }),
                adminService.getAnalytics(),
                adminService.getChangeRequests({ status: 'pending' }),
                adminService.getUsers({ role: 'ngo' })
            ])

            if (restRes.success) {
                setApplications(restRes.restaurants)
            }

            if (requestsRes.success) {
                setChangeRequests(requestsRes.requests)
            }

            if (ngoRes.success) {
                setNgos(ngoRes.users.filter((u: any) => !u.isVerifiedNGO))
            }

            if (analyticsRes.success) {
                setStats({
                    pending: (restRes.total || 0) + (requestsRes.total || 0) + (ngoRes.users?.filter((u: any) => !u.isVerifiedNGO).length || 0),
                    approvedThisWeek: 0,
                    rejectedThisWeek: 0
                })
            }
        } catch (err) {
            setError('Failed to fetch data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [])

    const handleApproveRestaurant = async (id: string) => {
        try {
            const res = await adminService.verifyRestaurant(id, true)
            if (res.success) {
                toast.success('Restaurant approved!')
                fetchApplications()
                setSelectedApp(null)
            }
        } catch (err) {
            toast.error('An error occurred')
        }
    }

    const handleApproveNGO = async (id: string) => {
        try {
            const res = await adminService.verifyNGO(id, true)
            if (res.success) {
                toast.success('NGO Verified - Root Access Granted!')
                fetchApplications()
            }
        } catch (err) {
            toast.error('Failed to verify NGO')
        }
    }

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
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black text-neutral-900 tracking-tight">APPROVALS & VERIFICATIONS</h1>
                        <p className="text-neutral-500 mt-2 font-medium">Manage neighborhood nodes and community resilience partners.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neutral-900 text-white p-6 rounded-[32px] shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Pending Sync</p>
                                <p className="text-3xl font-black">{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                    {/* ... other stats as simple cards ... */}
                </div>

                {/* NGO Table */}
                <div className="bg-white border border-neutral-100 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border bg-neutral-50 flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-green-600" />
                        <h2 className="text-xl font-black text-neutral-900">NGO VERIFICATIONS (ROOT ACCESS)</h2>
                    </div>

                    {ngos.length === 0 ? (
                        <div className="p-12 text-center text-neutral-400 font-medium">
                            No pending NGO applications.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">NGO / Contact</th>
                                        <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Registration ID</th>
                                        <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {ngos.map((ngo) => (
                                        <tr key={ngo._id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-neutral-900">{ngo.fullName}</div>
                                                <div className="text-xs text-neutral-500">{ngo.email}</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-neutral-600">
                                                {ngo.ngoRegNumber || 'REF-NRP-404'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-tight">
                                                    Pending Review
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleApproveNGO(ngo._id)}
                                                    className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-black uppercase hover:bg-neutral-800 transition-all"
                                                >
                                                    Grant Root Access
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Restaurant Table */}
                <div className="bg-white border border-neutral-100 rounded-[32px] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-primary-dark" />
                        <h2 className="text-xl font-black text-neutral-900">RESTAURANT NODES</h2>
                    </div>

                    {applications.length === 0 ? (
                        <div className="p-12 text-center text-neutral-400 font-medium">
                            No pending restaurant nodes.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Node Name</th>
                                        <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Location</th>
                                        <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {applications.map((app) => (
                                        <tr key={app._id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-black text-neutral-900">{app.name}</div>
                                                <div className="text-xs text-neutral-500">{app.contactEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-neutral-600">
                                                {app.address.city}, {app.address.state}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleApproveRestaurant(app._id)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black uppercase hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                                                >
                                                    Enable Node
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Change Requests */}
                {/* ... similar aesthetic for change requests ... */}
            </div>
        </AppLayout>
    )
}
