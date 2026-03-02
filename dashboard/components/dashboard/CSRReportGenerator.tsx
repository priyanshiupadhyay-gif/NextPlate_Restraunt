'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText, Download, Leaf, TreePine, Car, Droplets,
    TrendingUp, Award, ChevronRight, Loader2, Calendar,
    BarChart3, Shield, Sparkles
} from 'lucide-react'
import api from '@/lib/api'

interface CSRReport {
    meta: {
        restaurantName: string
        reportId: string
        reportPeriod: string
        generatedAt: string
    }
    summary: {
        totalOrders: number
        totalMealsRescued: number
        totalCarbonSavedKg: number
        totalRevenue: number
        totalCustomerSavings: number
        totalDonatedMeals: number
        estimatedDonationValue: number
        aiNarrative: string
    }
    environmental: {
        co2SavedKg: number
        treesEquivalent: number
        carKmAvoided: number
        waterSavedLiters: number
        methodology: string
    }
    topItems: Array<{ name: string; quantity: number; co2: number }>
    weeklyTrend: Array<{ week: string; rescues: number; co2: string }>
    compliance: {
        standard: string
        verified: boolean
        disclaimer: string
    }
}

export function CSRReportGenerator() {
    const [report, setReport] = useState<CSRReport | null>(null)
    const [loading, setLoading] = useState(false)
    const [period, setPeriod] = useState('30')
    const [showReport, setShowReport] = useState(false)

    const generateReport = async () => {
        setLoading(true)
        try {
            const res = await api.get(`/reports/csr?period=${period}`)
            if (res.data.success) {
                setReport(res.data.data)
                setShowReport(true)
            }
        } catch (err) {
            console.warn('Report generation failed')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <>
            {/* Generator Card */}
            <div className="bg-gradient-to-br from-[#0A0A12] to-[#1a1a2e] rounded-[48px] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full -mr-40 -mt-40 group-hover:bg-emerald-500/20 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 blur-[100px] rounded-full -ml-30 -mb-30" />

                <div className="relative z-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-3xl font-display font-black tracking-tight uppercase">Impact Portfolio</h2>
                            </div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">CSR & Tax Compliance Report Generator</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={period}
                                onChange={e => setPeriod(e.target.value)}
                                className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-white backdrop-blur-sm outline-none cursor-pointer hover:bg-white/15 transition-colors"
                            >
                                <option value="7" className="bg-[#1a1a2e]">Last 7 Days</option>
                                <option value="30" className="bg-[#1a1a2e]">Last 30 Days</option>
                                <option value="90" className="bg-[#1a1a2e]">Last Quarter</option>
                                <option value="365" className="bg-[#1a1a2e]">Last Year</option>
                            </select>

                            <button
                                onClick={generateReport}
                                disabled={loading}
                                className="px-10 py-4 bg-white text-[#0A0A12] rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-emerald-400 hover:text-white transition-all shadow-2xl shadow-white/10 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Generate
                            </button>
                        </div>
                    </div>

                    {/* Quick stats row */}
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { icon: Leaf, label: 'CO2 Saved', value: report ? `${report.environmental.co2SavedKg}kg` : '—', color: 'text-emerald-400' },
                            { icon: TreePine, label: 'Trees Equivalent', value: report ? `${report.environmental.treesEquivalent}` : '—', color: 'text-green-400' },
                            { icon: Car, label: 'Km Avoided', value: report ? `${report.environmental.carKmAvoided}` : '—', color: 'text-sky-400' },
                            { icon: Droplets, label: 'Water Saved', value: report ? `${report.environmental.waterSavedLiters}L` : '—', color: 'text-blue-400' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 border border-white/5 rounded-[28px] p-6 space-y-3"
                            >
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                <p className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Full Report Modal */}
            <AnimatePresence>
                {showReport && report && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowReport(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:rounded-none"
                            id="csr-report-printable"
                        >
                            {/* Report Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-[40px] p-12 text-white print:rounded-none">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Award className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black tracking-tight">Impact Portfolio</h3>
                                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">CSR Compliance Report</p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-black">{report.meta.restaurantName}</p>
                                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{report.meta.reportId}</p>
                                        <p className="text-white/40 text-[10px] font-bold">{new Date(report.meta.generatedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {/* AI Narrative */}
                                {report.summary.aiNarrative && (
                                    <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                                        <p className="text-sm leading-relaxed font-medium italic">"{report.summary.aiNarrative}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Report Body */}
                            <div className="p-12 space-y-12">
                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Meals Rescued', value: report.summary.totalMealsRescued, color: 'text-orange-600', bg: 'bg-orange-50' },
                                        { label: 'CO2 Offset', value: `${report.environmental.co2SavedKg}kg`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Donated Meals', value: report.summary.totalDonatedMeals, color: 'text-pink-600', bg: 'bg-pink-50' },
                                        { label: 'Donation Value', value: `$${report.summary.estimatedDonationValue}`, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    ].map((m, i) => (
                                        <div key={i} className={`${m.bg} rounded-3xl p-6 text-center`}>
                                            <p className={`text-3xl font-black tracking-tight ${m.color}`}>{m.value}</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-2">{m.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Environmental Equivalents */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-black text-[#1C1207] uppercase tracking-tight flex items-center gap-2">
                                        <Leaf className="w-5 h-5 text-emerald-500" /> Environmental Equivalents
                                    </h4>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="border border-emerald-100 rounded-3xl p-6 text-center bg-emerald-50/50">
                                            <TreePine className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                            <p className="text-2xl font-black text-emerald-600">{report.environmental.treesEquivalent}</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">Trees for 1 Year</p>
                                        </div>
                                        <div className="border border-sky-100 rounded-3xl p-6 text-center bg-sky-50/50">
                                            <Car className="w-8 h-8 text-sky-500 mx-auto mb-3" />
                                            <p className="text-2xl font-black text-sky-600">{report.environmental.carKmAvoided} km</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">Car Travel Avoided</p>
                                        </div>
                                        <div className="border border-blue-100 rounded-3xl p-6 text-center bg-blue-50/50">
                                            <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                                            <p className="text-2xl font-black text-blue-600">{report.environmental.waterSavedLiters.toLocaleString()}L</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">Water Preserved</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Rescued Items */}
                                {report.topItems.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-black text-[#1C1207] uppercase tracking-tight flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-orange-500" /> Top Rescued Items
                                        </h4>
                                        <div className="space-y-3">
                                            {report.topItems.map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                                                        #{i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm text-[#1C1207]">{item.name}</p>
                                                        <p className="text-[10px] text-neutral-400 font-bold">{item.quantity} units rescued</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-emerald-600">-{item.co2.toFixed(1)}kg CO2</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Compliance Footer */}
                                <div className="border-t border-neutral-100 pt-8 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-emerald-500" />
                                        <h4 className="text-sm font-black text-[#1C1207] uppercase tracking-widest">Verification & Compliance</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-4 bg-emerald-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Standard</p>
                                            <p className="text-sm font-bold text-[#1C1207]">{report.compliance.standard}</p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Verification</p>
                                            <p className="text-sm font-bold text-[#1C1207]">{report.compliance.verified ? 'Methodology Verified ✓' : 'Pending'}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">{report.compliance.disclaimer}</p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-4 print:hidden">
                                    <button
                                        onClick={handlePrint}
                                        className="flex-1 py-5 bg-[#1C1207] text-white rounded-full font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-colors active:scale-95"
                                    >
                                        <Download className="w-4 h-4" /> Download PDF
                                    </button>
                                    <button
                                        onClick={() => setShowReport(false)}
                                        className="px-8 py-5 border border-neutral-200 text-neutral-400 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:border-neutral-400 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
