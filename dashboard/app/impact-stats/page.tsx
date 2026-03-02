'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { impactService, ImpactStats } from '@/lib/impact-service'
import {
    Leaf,
    Users,
    Store,
    Activity,
    Globe,
    Database,
    BarChart3,
    Flame,
    ShieldAlert
} from 'lucide-react'
import { StitchMesh } from '@/components/dashboard/stitch-mesh'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'

export default function ImpactStatsPage() {
    const [stats, setStats] = useState<ImpactStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            const res = await impactService.getGlobalImpact()
            if (res.success && res.data) {
                setStats(res.data)
            }
            setIsLoading(false)
        }
        fetchStats()
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    const mockHistory = [
        { name: 'Mon', carbon: 45, meals: 120 },
        { name: 'Tue', carbon: 52, meals: 145 },
        { name: 'Wed', carbon: 48, meals: 132 },
        { name: 'Thu', carbon: 61, meals: 168 },
        { name: 'Fri', carbon: 55, meals: 154 },
        { name: 'Sat', carbon: 75, meals: 210 },
        { name: 'Sun', carbon: 82, meals: 235 },
    ]

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
            <div className="space-y-12 pb-20">
                {/* Header */}
                <div className="relative overflow-hidden bg-[#1C1207] rounded-[40px] p-10 md:p-16 text-white shadow-2xl">
                    <div className="relative z-10 space-y-6 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/20 text-orange-400 rounded-full text-xs font-black uppercase tracking-widest border border-orange-600/30">
                            <Globe className="w-4 h-4 animate-spin-slow" />
                            Live Protocol Mesh Network
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none" style={{ fontFamily: 'Fraunces, serif' }}>
                            NEIGHBORHOOD <br />
                            <span className="text-orange-500 italic">RESILIENCE</span> LEDGER
                        </h1>
                        <p className="text-xl text-neutral-400 font-medium leading-relaxed">
                            Quantifying the immediate impact of the NextPlate Neighborhood Resilience Protocol (NRP) across the local food grid.
                        </p>
                    </div>

                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                        <Database className="w-full h-full scale-150 rotate-12" />
                    </div>
                </div>

                {/* Stitch AI Live Mesh Visualizer */}
                <StitchMesh />

                {/* Real-time Ticker Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-neutral-100 p-8 rounded-[32px] shadow-sm hover:border-green-500 transition-colors group">
                        <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-green-100 group-hover:bg-green-600 group-hover:text-white transition-all">
                            <Leaf className="w-6 h-6" />
                        </div>
                        <div className="text-4xl font-black text-neutral-900 mb-1">{stats?.totalCO2Saved}</div>
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Carbon Offset</div>
                    </div>

                    <div className="bg-white border border-neutral-100 p-8 rounded-[32px] shadow-sm hover:border-blue-500 transition-colors group">
                        <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Store className="w-6 h-6" />
                        </div>
                        <div className="text-4xl font-black text-neutral-900 mb-1">{stats?.networkResilience.participatingRestaurants}</div>
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Protocol Active Nodes</div>
                    </div>

                    <div className="bg-white border border-neutral-100 p-8 rounded-[32px] shadow-sm hover:border-orange-500 transition-colors group">
                        <div className="bg-orange-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all">
                            <Flame className="w-6 h-6" />
                        </div>
                        <div className="text-4xl font-black text-neutral-900 mb-1">{stats?.totalMealsRescued}</div>
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Meals Successfully Diverted</div>
                    </div>

                    <div className="bg-white border border-neutral-100 p-8 rounded-[32px] shadow-sm hover:border-purple-500 transition-colors group">
                        <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-all">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="text-4xl font-black text-neutral-900 mb-1">{stats?.networkResilience.activeNGOs}</div>
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Verified Community Units</div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-white border border-neutral-100 p-8 rounded-[40px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-neutral-900">CARBON SEQUESTRATION TRENDS</h3>
                                <p className="text-sm text-neutral-500 font-medium">Weekly CO2e reduction (kg)</p>
                            </div>
                            <Activity className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockHistory}>
                                    <defs>
                                        <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="carbon" stroke="#22c55e" strokeWidth={4} fillOpacity={1} fill="url(#colorCarbon)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-neutral-100 p-8 rounded-[40px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-neutral-900">MEAL RESCUE VELOCITY</h3>
                                <p className="text-sm text-neutral-500 font-medium">Daily diverted portions</p>
                            </div>
                            <BarChart3 className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockHistory}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="meals" radius={[10, 10, 10, 10]}>
                                        {mockHistory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 6 ? '#2563eb' : '#d1d5db'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="bg-green-600 rounded-[32px] p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-green-100">
                    <div className="bg-white/20 p-6 rounded-3xl shrink-0">
                        <ShieldAlert className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black tracking-tight mb-2">NETWORK SUSTAINABILITY REPORT</h4>
                        <p className="text-green-50 text-lg font-medium leading-relaxed">
                            Through the collaborative efforts of local food nodes and community-driven NGOs, we have successfully sequestered the carbon equivalent of **{((parseFloat(stats?.totalCO2Saved || '0') * 100) / 4.6).toFixed(0)} fully grown trees** this month.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
