'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, Share2, ShieldCheck, Star, Zap, Leaf, ShoppingBag, ChevronRight, Lock } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'

interface Certificate {
    id: string
    name: string
    threshold: number
    type: string
    icon: string
    description: string
    earned: boolean
    earnedDate: string | null
    progress: number
}

export function ImpactCertificates() {
    const [certs, setCerts] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)

    useEffect(() => {
        const fetchCerts = async () => {
            try {
                const res = await api.get('/users/certificates')
                if (res.data.success) {
                    setCerts(res.data.certificates || [])
                }
            } catch (error) {
                console.warn('Certificates unavailable')
            } finally {
                setLoading(false)
            }
        }
        fetchCerts()
    }, [])

    if (loading) return <div className="h-64 bg-neutral-50 animate-pulse rounded-[40px]" />

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-black text-[#1C1207] tracking-tight">RESILIENCE RECORDS</h2>
                    <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] mt-1">Verification of metabolic impact milestones</p>
                </div>
                <div className="flex -space-x-2">
                    {certs.filter(c => c.earned).map(c => (
                        <div key={c.id} className="w-10 h-10 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center text-sm shadow-lg">
                            {c.icon}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {certs.map((cert, idx) => (
                    <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => cert.earned && setSelectedCert(cert)}
                        className={`group relative p-8 rounded-[40px] border transition-all duration-500 cursor-pointer ${cert.earned
                                ? 'bg-white border-[#1C1207]/5 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2'
                                : 'bg-neutral-50 border-dashed border-neutral-200 opacity-60'
                            }`}
                    >
                        {/* Visual Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${cert.earned ? 'bg-orange-50 text-orange-600' : 'bg-neutral-100 text-neutral-400'
                                }`}>
                                {cert.earned ? cert.icon : <Lock className="w-6 h-6" />}
                            </div>
                            {cert.earned && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                                    <ShieldCheck className="w-3 h-3 text-green-600" />
                                    <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Verified</span>
                                </div>
                            )}
                        </div>

                        {/* Information */}
                        <div className="space-y-2">
                            <h3 className={`text-xl font-black tracking-tight ${cert.earned ? 'text-[#1C1207]' : 'text-neutral-400'}`}>
                                {cert.name}
                            </h3>
                            <p className="text-[11px] font-medium text-[#1C1207]/40 leading-relaxed">
                                {cert.description}
                            </p>
                        </div>

                        {/* Progress */}
                        <div className="mt-8 space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] font-black text-[#1C1207]/20 uppercase tracking-widest">Calibration</span>
                                <span className="text-[10px] font-black text-orange-600">{cert.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${cert.progress}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className={`h-full ${cert.earned ? 'bg-orange-600' : 'bg-neutral-300'}`}
                                />
                            </div>
                        </div>

                        {cert.earned && (
                            <div className="mt-8 pt-6 border-t border-[#1C1207]/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">View Record</span>
                                <ChevronRight className="w-4 h-4 text-orange-600" />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Certificate Modal */}
            <AnimatePresence>
                {selectedCert && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCert(null)}
                            className="absolute inset-0 bg-[#1C1207]/90 backdrop-blur-2xl"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="relative w-full max-w-2xl bg-white rounded-[48px] overflow-hidden flex flex-col items-center py-20 px-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
                        >
                            {/* Decorative Background */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 blur-[120px] rounded-full -mr-32 -mt-32" />
                                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50 blur-[120px] rounded-full -ml-32 -mb-32" />
                                {/* Guilloche pattern simulation */}
                                <div className="absolute inset-4 border-2 border-orange-100 rounded-[40px] border-dashed opacity-50" />
                                <div className="absolute inset-8 border border-neutral-100 rounded-[36px]" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 text-center space-y-10">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-5xl mb-4 border border-orange-100">
                                        {selectedCert.icon}
                                    </div>
                                    <div className="px-6 py-2 bg-[#1C1207] text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em]">
                                        Resilience Protocol Certified
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em]">Recognition of Impact</h4>
                                    <h2 className="text-6xl font-display font-black text-[#1C1207] tracking-tighter uppercase leading-none">
                                        {selectedCert.name}
                                    </h2>
                                </div>

                                <div className="h-px w-24 bg-orange-600 mx-auto" />

                                <p className="text-xl font-medium text-[#1C1207]/60 leading-relaxed max-w-sm mx-auto">
                                    {selectedCert.description}
                                    <br />
                                    <span className="text-[10px] font-black tracking-widest text-orange-600 mt-4 block">RECORD_SECURED_BY_STITCH_AI</span>
                                </p>

                                <div className="flex flex-col items-center gap-2 pt-10">
                                    <div className="w-20 h-20 bg-neutral-50 rounded-2xl border-2 border-[#1C1207]/5 flex items-center justify-center">
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Resilience_Node_Verified" alt="QR" className="w-14 h-14 grayscale opacity-20" />
                                    </div>
                                    <span className="text-[8px] font-black text-[#1C1207]/20 uppercase tracking-[0.5em]">Node Integrity Check</span>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <Button variant="outline" className="rounded-full px-8 py-6 uppercase font-black text-[10px] tracking-widest gap-2">
                                        <Download className="w-4 h-4" />
                                        Download PNG
                                    </Button>
                                    <Button className="rounded-full px-8 py-6 bg-[#1C1207] hover:bg-orange-600 uppercase font-black text-[10px] tracking-widest gap-2">
                                        <Share2 className="w-4 h-4" />
                                        Signal Status
                                    </Button>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedCert(null)}
                                className="absolute top-8 right-8 w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-[#1C1207] hover:text-white transition-all shadow-xl"
                            >
                                ✕
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
