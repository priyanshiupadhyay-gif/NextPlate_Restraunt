'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Store, Heart, User, Soup, ArrowRight, ArrowLeft, Leaf } from 'lucide-react'

export default function RegisterSelectionPage() {
    const roles = [
        {
            id: 'restaurant',
            subtitle: 'FOR FOOD BUSINESSES',
            title: 'I Am a Partner',
            description: 'List your surplus food in 60 seconds. Earn revenue from waste and feed your city.',
            tags: ['60-sec listing', 'Carbon score', 'Real earnings', 'QR pickup'],
            color: 'bg-[#FF6B2B]',
            theme: 'from-[#1C1207] to-[#120B05]',
            accent: 'text-orange-500',
            link: '/register/restaurant',
            hotspot: '60s Listing Protocol Active',
            illustration: (
                <div className="relative w-full h-full flex flex-col items-center justify-center pt-8">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 mb-6"
                    >
                        <Soup className="w-8 h-8 text-orange-500" />
                    </motion.div>

                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[8px] font-black text-white/40 tracking-[0.2em] uppercase">Restaurant Node</span>
                    </div>
                </div>
            )
        },
        {
            id: 'ngo',
            subtitle: 'FOR COMMUNITY ORGS',
            title: 'I Am a Hero',
            description: 'Claim rescued food for kids and communities. Get Root Access status for free.',
            tags: ['$0 donations', 'Root Access', 'Impact tracking', 'Daily rescues'],
            color: 'bg-[#10B981]',
            theme: 'from-[#061A14] to-[#020D0A]',
            accent: 'text-emerald-500',
            link: '/register/ngo',
            hotspot: 'Impact Ledger Synchronized',
            illustration: (
                <div className="relative w-full h-full flex flex-col items-center justify-center pt-8">
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6"
                    >
                        <Heart className="w-8 h-8 text-emerald-500 fill-emerald-500/20" />
                    </motion.div>

                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-white/40 tracking-[0.2em] uppercase">Impact Mesh</span>
                    </div>
                </div>
            )
        },
        {
            id: 'user',
            subtitle: 'FOR INDIVIDUALS',
            title: 'I Am a Foodie',
            description: 'Order restaurant quality food at 40-70% off. No guilt, just great flavour.',
            tags: ['70% discount', 'QR pickup', 'Zero waste', 'Real food'],
            color: 'bg-[#3B82F6]',
            theme: 'from-[#0A162B] to-[#050D1A]',
            accent: 'text-blue-500',
            link: '/register/user',
            hotspot: 'Live Grid Update: 124 Items',
            illustration: (
                <div className="relative w-full h-full flex flex-col items-center justify-center pt-8">
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-6"
                    >
                        <User className="w-8 h-8 text-blue-500" />
                    </motion.div>

                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[8px] font-black text-white/40 tracking-[0.2em] uppercase">User Protocol</span>
                    </div>
                </div>
            )
        }
    ]

    return (
        <div className="min-h-screen flex flex-col items-center justify-start py-20 px-6 bg-[#FFF8F0] relative overflow-hidden font-body selection:bg-orange-100">
            {/* ═══ GRAIN OVERLAY ═══ */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="w-full max-w-[1100px] relative z-10 flex flex-col items-center">

                {/* ═══ HEADER (Simplified) ═══ */}
                <div className="text-center mb-16 space-y-4 max-w-xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-display font-black text-[#1C1207] tracking-tight uppercase leading-none"
                    >
                        Who Are You?
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[#1C1207]/30 font-bold text-sm tracking-[0.2em] uppercase"
                    >
                        Pick a node to join the grid
                    </motion.p>
                </div>

                {/* ═══ ROLE GRID ═══ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {roles.map((role, i) => (
                        <motion.div
                            key={role.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + (i * 0.1), ease: "circOut" }}
                            className="group relative"
                        >
                            {/* Hover Point / Tip */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20">
                                <div className="px-3 py-1 bg-white shadow-xl rounded-full border border-neutral-100 text-[8px] font-black text-[#1C1207] uppercase tracking-widest whitespace-nowrap">
                                    {role.hotspot}
                                </div>
                                <div className="w-px h-4 bg-orange-500 mx-auto" />
                            </div>

                            <div className="bg-[#1C1207] rounded-[40px] overflow-hidden flex flex-col h-full transition-all duration-500 border border-white/5 group-hover:border-white/20 group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]">
                                {/* Illustration Area */}
                                <div className={`h-[180px] w-full bg-gradient-to-br ${role.theme} relative overflow-hidden`}>
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                                    {role.illustration}
                                </div>

                                {/* Content Area */}
                                <div className="p-8 flex flex-col flex-1">
                                    <p className={`text-[9px] font-black tracking-[0.2em] mb-4 uppercase ${role.accent}`}>
                                        • {role.subtitle}
                                    </p>
                                    <h3 className="text-3xl font-display font-black text-white mb-4 leading-none group-hover:tracking-wider transition-all duration-500">
                                        {role.title}
                                    </h3>
                                    <p className="text-white/30 text-[13px] font-medium leading-relaxed mb-8">
                                        {role.description}
                                    </p>

                                    {/* Features Staggered */}
                                    <div className="grid grid-cols-2 gap-2 mb-10">
                                        {role.tags.map((tag, j) => (
                                            <motion.div
                                                key={tag}
                                                whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
                                                className="px-3 py-2.5 bg-white/[0.03] border border-white/5 rounded-2xl text-[8px] font-black text-white/20 uppercase tracking-widest text-center transition-colors group-hover:text-white/40"
                                            >
                                                {tag}
                                            </motion.div>
                                        ))}
                                    </div>

                                    <Link href={role.link} className="mt-auto">
                                        <motion.div
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`w-full py-5 rounded-3xl ${role.color} text-[#1C1207] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-lg group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all`}
                                        >
                                            Start Journey
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.div>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Simplified Footer */}
                <div className="mt-16 flex flex-col items-center gap-6">
                    <Link href="/login" className="px-10 py-5 bg-[#1C1207] text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:bg-orange-600 transition-colors">
                        Log In Here
                    </Link>
                    <Link href="/" className="text-[#1C1207]/20 hover:text-[#1C1207] font-bold text-[9px] uppercase tracking-[0.4em] flex items-center gap-3 transition-all">
                        <ArrowLeft className="w-3 h-3" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
