'use client'

import React from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Shield, FileText, Lock, Globe, Mail, Scale } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TermsOfServicePage() {
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                {/* HEADER */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1C1207] rounded-3xl shadow-xl shadow-black/20 mb-4 text-white">
                        <Scale className="w-8 h-8" />
                    </div>
                    <h1 className="text-5xl font-black text-[#1C1207] dark:text-white tracking-tighter uppercase">Terms of Service</h1>
                    <p className="text-[#1C1207]/40 dark:text-white/40 font-bold uppercase tracking-widest text-xs">Last Updated: March 1, 2026</p>
                </div>

                <div className="card-base bg-white dark:bg-[#121212] p-10 md:p-16 space-y-10 shadow-2xl shadow-[#1C1207]/5 border border-[#1C1207]/5 dark:border-white/5 font-body">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">01</span>
                            Acceptance of Terms
                        </h2>
                        <p className="text-[#1C1207]/70 dark:text-white/70 leading-relaxed font-medium">
                            By accessing or using the NextPlate platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not access or use the platform. NextPlate provides a food redistribution network connecting restaurants, NGOs, and individual users.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">02</span>
                            User Responsibilities
                        </h2>
                        <ul className="space-y-3 list-disc list-inside text-[#1C1207]/70 dark:text-white/70 font-medium">
                            <li>Users must provide accurate, current, and complete information during registration.</li>
                            <li>Restaurants are solely responsible for the food safety and quality of items listed.</li>
                            <li>NGOs must utilize rescued food solely for community feeding purposes.</li>
                            <li>Attempting to resell free NGO-claimed food is strictly prohibited and will lead to permanent "Grid Exclusion".</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">03</span>
                            Food Safety Disclaimer
                        </h2>
                        <div className="p-6 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-2xl">
                            <p className="text-red-700 dark:text-red-400 font-bold text-sm leading-relaxed">
                                NextPlate is a logistics and tracking platform. We do not handle, store, or prepare food ourselves. While we implement trust tiers and AI verification, the ultimate responsibility for food safety lies with the donor restaurant and the claiming entity.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">04</span>
                            Payments & Refunds
                        </h2>
                        <p className="text-[#1C1207]/70 dark:text-white/70 leading-relaxed font-medium">
                            Marketplace purchases are final upon pickup verification. Refunds for "failed pickups" or "quality issues" must be reported within 60 minutes of the scheduled pickup window through the platform's anomaly dashboard.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-[#1C1207] dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm">05</span>
                            Termination
                        </h2>
                        <p className="text-[#1C1207]/70 dark:text-white/70 leading-relaxed font-medium">
                            We reserve the right to suspend or terminate accounts that violate our "Zero Waste Protocol" or engage in fraudulent activities.
                        </p>
                    </section>
                </div>

                {/* FOOTER CONTACT */}
                <div className="text-center space-y-4 opacity-60">
                    <p className="text-sm font-black text-[#1C1207] dark:text-white uppercase tracking-widest">Questions about our legal framework?</p>
                    <div className="flex justify-center gap-6">
                        <a href="mailto:legal@nextplate.grid" className="flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest hover:text-orange-600">
                            <Mail className="w-4 h-4" />
                            legal@nextplate.grid
                        </a>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
