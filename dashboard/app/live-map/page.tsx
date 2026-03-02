'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Globe,
    MapPin,
    Leaf,
    Heart,
    Package,
    Users,
    Zap,
} from 'lucide-react'
import api from '@/lib/api'
import { io, Socket } from 'socket.io-client'

// ─── LIVE MESH PAGE ───

export default function LiveMapPage() {
    const [nodes, setNodes] = useState<any[]>([])
    const [rescues, setRescues] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [selectedNode, setSelectedNode] = useState<any | null>(null)
    const [filter, setFilter] = useState<'all' | 'restaurant' | 'ngo'>('all')
    const [pulseIndex, setPulseIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [liveEvent, setLiveEvent] = useState<string | null>(null)
    const socketRef = useRef<Socket | null>(null)

    // ─── Initial Data Fetch ───
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [nodesRes, rescuesRes, statsRes] = await Promise.all([
                    api.get('/impact/nodes'),
                    api.get('/impact/recent-rescues'),
                    api.get('/impact/stats')
                ])

                if (nodesRes.data.success) setNodes(nodesRes.data.data)
                if (rescuesRes.data.success) setRescues(rescuesRes.data.data)
                if (statsRes.data.success) setStats(statsRes.data.data)
            } catch (error) {
                console.error('Failed to fetch mesh data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // ─── Socket.IO Real-Time Connection ───
    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
        const SOCKET_URL = API_URL.replace('/api/v1', '')

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
        socketRef.current = socket

        socket.on('connect', () => {
            socket.emit('join-city', 'all') // Global room for all events
        })

        // Listen for new rescue events in real-time
        socket.on('rescue:new', (data: any) => {
            setRescues(prev => [data, ...prev].slice(0, 20)) // Keep last 20
            setStats((prev: any) => prev ? {
                ...prev,
                totalMealsRescued: (prev.totalMealsRescued || 0) + 1
            } : prev)
            setLiveEvent(`🌱 ${data.item} rescued from ${data.from}!`)
            setTimeout(() => setLiveEvent(null), 4000)
        })

        // Listen for node updates (new restaurant/NGO joins)
        socket.on('node:update', (data: any) => {
            setNodes(prev => {
                const existing = prev.findIndex(n => n.id === data.id)
                if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = data
                    return updated
                }
                return [data, ...prev]
            })
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    // Pulse animation cycling
    useEffect(() => {
        if (nodes.length === 0) return
        const interval = setInterval(() => {
            setPulseIndex(prev => (prev + 1) % nodes.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [nodes.length])

    const filteredNodes = nodes.filter(n => filter === 'all' || n.type === filter)

    // Aggregates
    const activeSurplus = nodes.filter(n => n.type === 'restaurant').reduce((s, n) => s + (n.items || 0), 0)
    const totalCO2Str = stats?.totalCO2Saved || '0.00kg'
    const totalMeals = stats?.totalMealsRescued || 0


    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-12 pb-32">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-[18px] flex items-center justify-center shadow-xl shadow-blue-500/20">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live Network</span>
                            </div>
                        </div>
                        <h1 className="text-6xl font-display font-black text-[#1C1207] uppercase tracking-tighter leading-none">Resilience Mesh</h1>
                        <p className="text-[#1C1207]/40 font-medium text-lg max-w-lg">
                            Real-time visualization of the global food rescue network. Every pulse is a meal saved.
                        </p>
                    </div>
                </div>

                {/* Live Event Flash Banner */}
                <AnimatePresence>
                    {liveEvent && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-3 px-6 py-4 bg-emerald-500 rounded-[24px] text-white font-bold shadow-xl shadow-emerald-500/20"
                        >
                            <Zap className="w-5 h-5 animate-pulse flex-shrink-0" />
                            <span className="text-sm">{liveEvent}</span>
                            <div className="ml-auto flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Live Signal</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="bg-[#1C1207] text-white rounded-[36px] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                        <div className="relative z-10 space-y-3">
                            <Package className="w-6 h-6 text-orange-500" />
                            <p className="text-4xl font-display font-black tracking-tighter">{activeSurplus}</p>
                            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Active Surplus Now</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                        className="bg-white border border-[#1C1207]/5 rounded-[36px] p-8">
                        <div className="space-y-3">
                            <Leaf className="w-6 h-6 text-emerald-500" />
                            <p className="text-4xl font-display font-black text-emerald-600 tracking-tighter">{totalCO2Str}</p>
                            <p className="text-[#1C1207]/30 text-[10px] font-black uppercase tracking-widest">CO2 Being Saved</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                        className="bg-white border border-[#1C1207]/5 rounded-[36px] p-8">
                        <div className="space-y-3">
                            <Heart className="w-6 h-6 text-pink-500" />
                            <p className="text-4xl font-display font-black text-pink-600 tracking-tighter">{totalMeals.toLocaleString()}</p>
                            <p className="text-[#1C1207]/30 text-[10px] font-black uppercase tracking-widest">NGO Meals Served</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                        className="bg-blue-50 border border-blue-100 rounded-[36px] p-8">
                        <div className="space-y-3">
                            <Users className="w-6 h-6 text-blue-600" />
                            <p className="text-4xl font-display font-black text-blue-600 tracking-tighter">{nodes.length}</p>
                            <p className="text-blue-600/50 text-[10px] font-black uppercase tracking-widest">Active Grid Nodes</p>
                        </div>
                    </motion.div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3">
                    {(['all', 'restaurant', 'ngo'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-[#1C1207] text-white shadow-lg' : 'bg-white text-[#1C1207]/40 border border-[#1C1207]/5 hover:border-orange-200'}`}
                        >
                            {f === 'all' ? '🌍 All Nodes' : f === 'restaurant' ? '🏪 Restaurants' : '🤝 NGO Hubs'}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Map-like Grid Visualization */}
                    <div className="lg:col-span-8">
                        <div className="bg-[#0A0A12] rounded-[48px] p-10 relative overflow-hidden min-h-[500px]">
                            {/* Subtle grid background */}
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }} />

                            {/* Heatmap overlay — brighter where more surplus exists */}
                            {filteredNodes.filter(n => n.type === 'restaurant' && n.items > 0).map((node, i) => (
                                <div
                                    key={`heat-${i}`}
                                    className="absolute rounded-full pointer-events-none animate-pulse"
                                    style={{
                                        width: `${Math.min(node.items * 20, 200)}px`,
                                        height: `${Math.min(node.items * 20, 200)}px`,
                                        background: `radial-gradient(circle, rgba(249,115,22,${Math.min(node.items * 0.03, 0.15)}) 0%, transparent 70%)`,
                                        top: `${30 + ((i * 37 + 13) % 60)}%`,
                                        left: `${10 + ((i * 53 + 7) % 70)}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                />
                            ))}

                            <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
                                {loading ? (
                                    <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Global Grid // Live</span>
                                    </>
                                )}
                            </div>

                            {/* Animated trajectory lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
                                {filteredNodes.slice(0, 8).map((node, i) => {
                                    if (i === 0) return null
                                    const prev = filteredNodes[i - 1]
                                    const x1 = 10 + ((i * 53 + 7) % 70)
                                    const y1 = 30 + (((i) * 37 + 13) % 60)
                                    const x2 = 10 + (((i - 1) * 53 + 7) % 70)
                                    const y2 = 30 + (((i - 1) * 37 + 13) % 60)
                                    return (
                                        <line
                                            key={`line-${i}`}
                                            x1={`${x1}%`} y1={`${y1}%`}
                                            x2={`${x2}%`} y2={`${y2}%`}
                                            stroke={node.type === 'restaurant' ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)'}
                                            strokeWidth="1"
                                            strokeDasharray="4 8"
                                        >
                                            <animate
                                                attributeName="stroke-dashoffset"
                                                from="0" to="-24"
                                                dur="3s"
                                                repeatCount="indefinite"
                                            />
                                        </line>
                                    )
                                })}
                            </svg>

                            {/* Node scattered display */}
                            <div className="relative z-10 grid grid-cols-3 md:grid-cols-4 gap-6 pt-16">
                                {filteredNodes.map((node, i) => {
                                    const isRestaurant = node.type === 'restaurant'
                                    const isPulsing = i === pulseIndex % filteredNodes.length
                                    return (
                                        <motion.button
                                            key={node.id}
                                            onClick={() => setSelectedNode(node)}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: i * 0.05, type: 'spring' }}
                                            className={`relative p-6 rounded-[28px] border text-left transition-all hover:scale-105 ${selectedNode?.id === node.id
                                                ? 'bg-white/10 border-orange-500/50 shadow-2xl shadow-orange-500/10'
                                                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                                                }`}
                                        >
                                            {isPulsing && (
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0.8 }}
                                                    animate={{ scale: 2, opacity: 0 }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={`absolute inset-0 rounded-[28px] ${isRestaurant ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}
                                                />
                                            )}
                                            <div className="relative z-10">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${isRestaurant ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                    {isRestaurant ? <MapPin className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                                </div>
                                                <p className="text-white text-xs font-black truncate mb-1">{node.name.slice(0, 18)}</p>
                                                <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">{node.city}</p>
                                                {isRestaurant ? (
                                                    <div className="mt-3 flex items-center gap-3">
                                                        <span className="text-orange-400 text-[10px] font-black">{node.items || 0} items</span>
                                                        <span className="text-emerald-400 text-[10px] font-black">-{node.co2 || 0}kg</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-emerald-400 text-[10px] font-black mt-3">{node.meals?.toLocaleString() || 0} meals</p>
                                                )}
                                            </div>
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Live Ticker + Selected Node */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Selected Node Detail */}
                        <AnimatePresence mode="wait">
                            {selectedNode ? (
                                <motion.div
                                    key={selectedNode.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`rounded-[40px] p-8 border ${selectedNode.type === 'restaurant'
                                        ? 'bg-orange-50 border-orange-100'
                                        : 'bg-emerald-50 border-emerald-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedNode.type === 'restaurant' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                            {selectedNode.type === 'restaurant' ? <MapPin className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest">{selectedNode.type === 'restaurant' ? 'Restaurant Node' : 'NGO Hub'}</p>
                                            <p className="text-lg font-black text-[#1C1207]">{selectedNode.name}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-2xl p-4 text-center">
                                            <p className="text-2xl font-black text-[#1C1207]">{selectedNode.type === 'restaurant' ? selectedNode.items : selectedNode.meals?.toLocaleString()}</p>
                                            <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">{selectedNode.type === 'restaurant' ? 'Items Live' : 'Meals Served'}</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 text-center">
                                            <p className="text-2xl font-black text-emerald-600">{selectedNode.type === 'restaurant' ? `-${selectedNode.co2}kg` : '✓'}</p>
                                            <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">{selectedNode.type === 'restaurant' ? 'CO2 Saved' : 'Verified'}</p>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-black text-[#1C1207]/20 uppercase tracking-widest mt-4 text-center">📍 {selectedNode.city} • Lat {selectedNode.lat?.toFixed(2) || '0'}, Lng {selectedNode.lng?.toFixed(2) || '0'}</p>
                                </motion.div>
                            ) : (
                                <div className="rounded-[40px] p-8 border border-neutral-100 bg-neutral-50 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-neutral-300 mx-auto" />
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Select a Node to Inspect</p>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Live Rescue Ticker */}
                        <div className="bg-white rounded-[40px] p-8 border border-[#1C1207]/5 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <h3 className="text-xs font-black text-[#1C1207] uppercase tracking-widest">Live Rescue Stream</h3>
                            </div>
                            <div className="space-y-4 max-h-[360px] overflow-y-auto no-scrollbar">
                                {rescues.length > 0 ? rescues.map((rescue, i) => (
                                    <motion.div key={i}
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-start gap-4 py-3 border-b border-[#1C1207]/5 last:border-0"
                                    >
                                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Leaf className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#1C1207] truncate">{rescue.item}</p>
                                            <p className="text-[10px] font-medium text-[#1C1207]/40">{rescue.from} • {rescue.city}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-emerald-600 text-[10px] font-black">-{rescue.co2}kg</p>
                                            <p className="text-[9px] text-[#1C1207]/20 font-bold">{rescue.time}</p>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <p className="text-[10px] font-bold text-neutral-300 text-center py-10 uppercase tracking-widest">Silent Grid (Check later)</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </AppLayout>
    )
}
