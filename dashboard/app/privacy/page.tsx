'use client'

import React from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Shield, Lock, Eye, Mail, Scale, Database } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PrivacyPolicyPage() {
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                {/* HEADER */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1C1207] rounded-3xl shadow-xl shadow-black/20 mb-4 text-white">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-5xl font-black text-[#1C1207] dark:text-white tracking-tighter uppercase">Privacy Policy</h1>
                    <p className="text-[#1C1207]/40 dark:text-white/40 font-bold uppercase tracking-widest text-xs">Last Updated: March 1, 2026</p>
                </div>

                <div className="card-base bg-white dark:bg-[#121212] p-10 md:p-16 space-y-10 shadow-2xl shadow-[#1C1207]/5 border border-[#1C1207]/5 dark:border-white/5 font-body">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">01</span>
                            Information We Collect
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-3xl">
                                <h3 className="font-black text-[#1C1207] dark:text-white uppercase text-xs mb-3 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-orange-500" />
                                    Node Information
                                </h3>
                                <p className="text-[#1C1207]/60 dark:text-white/60 text-sm font-medium">Names, email, phone, restaurant/NGO registration details, location (GeoJSON coordinates for grid matching).</p>
                            </div>
                            <div className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-3xl">
                                <h3 className="font-black text-[#1C1207] dark:text-white uppercase text-xs mb-3 flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-emerald-500" />
                                    Platform Usage
                                </h3>
                                <p className="text-[#1C1207]/60 dark:text-white/60 text-sm font-medium">Order history, carbon tracking data, search preferences, and AI chat interactions.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">02</span>
                            How We Use Information
                        </h2>
                        <p className="text-[#1C1207]/70 dark:text-white/70 leading-relaxed font-medium">
                            We use collected information to facilitate food redistribution, match rescue requests with surplus listings, verify NGO credibility, calculate CO2 impact, and verify mobile pickups via QR codes. We do not sell your personal data to third parties.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">03</span>
                            Security & Protection
                        </h2>
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r-2xl">
                            <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm leading-relaxed">
                                Your data is protected with 256-bit encryption (AES), secure JWT tokens, and multi-factor authentication for admin and NGO verification protocols. Node data is stored in MongoDB Atlas with VPC isolation.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">04</span>
                            AI & Automations
                        </h2>
                        <p className="text-[#1C1207]/70 dark:text-white/70 leading-relaxed font-medium">
                            NextPlate uses the Google Gemini Engine to analyze food surplus patterns and handout photos for quality verification. This data is utilized on an anonymized basis to improve our "Rescue Algorithm" across the national grid.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">05</span>
                            Cookies & Tracking
                        </h2>
                        <p className="text-[#1C1207]/70 dark:text-white/70 leading-relaxed font-medium">
                            We use session cookies and local storage tokens to keep you authenticated and maintain your preference state (dark mode, language, etc.). No persistent advertising tracking is utilized.
                        </p>
                    </section>
                </div>

                {/* FOOTER CONTACT */}
                <div className="text-center space-y-4 opacity-60">
                    <p className="text-sm font-black text-[#1C1207] dark:text-white uppercase tracking-widest">Questions about your data footprint?</p>
                    <div className="flex justify-center gap-6">
                        <a href="mailto:privacy@nextplate.grid" className="flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest hover:text-orange-600">
                            <Mail className="w-4 h-4" />
                            privacy@nextplate.grid
                        </a>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
