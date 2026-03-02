'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Camera, ShieldCheck, AlertTriangle, XCircle, Loader2,
    Upload, CheckCircle2, Eye, Star
} from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface AuditResult {
    orderId: string
    foodVisible: boolean
    quantityMatch: string
    conditionRating: number
    safetyConcerns: string[]
    overallVerdict: 'APPROVED' | 'FLAGGED' | 'REJECTED'
    auditNote: string
}

interface RescueAuditProps {
    orderId: string
    itemNames: string[]
    onComplete?: (result: AuditResult) => void
}

export function RescueAudit({ orderId, itemNames, onComplete }: RescueAuditProps) {
    const [photo, setPhoto] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<AuditResult | null>(null)

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPhoto(file)
        setPreview(URL.createObjectURL(file))
        setResult(null)
    }

    const submitAudit = async () => {
        if (!photo) return
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('photo', photo)

            const res = await api.post(`/rescue-audit/${orderId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (res.data.success) {
                setResult(res.data.data)
                onComplete?.(res.data.data)

                if (res.data.data.overallVerdict === 'APPROVED') {
                    toast.success('Rescue Verified', { description: 'Handover audit passed — rescue complete.' })
                } else if (res.data.data.overallVerdict === 'FLAGGED') {
                    toast.warning('Audit Flagged', { description: res.data.data.auditNote })
                } else {
                    toast.error('Audit Rejected', { description: res.data.data.auditNote })
                }
            }
        } catch (err: any) {
            toast.error('Audit submission failed', { description: err.response?.data?.message || 'Try again' })
        } finally {
            setLoading(false)
        }
    }

    const verdictConfig = {
        APPROVED: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Verified' },
        FLAGGED: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Flagged' },
        REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Rejected' }
    }

    return (
        <div className="bg-white rounded-[40px] p-8 border border-[#1C1207]/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Camera className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-[#1C1207] tracking-tight">Rescue Audit</h3>
                    <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest">AI-Verified Handover Protocol</p>
                </div>
            </div>

            {/* Expected Items */}
            <div className="bg-neutral-50 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest">Expected Payload</p>
                <div className="flex flex-wrap gap-2">
                    {itemNames.map((name, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-xs font-bold text-[#1C1207]">
                            {name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
                {!preview ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#1C1207]/10 rounded-[32px] cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                        <Upload className="w-8 h-8 text-[#1C1207]/15 group-hover:text-blue-400 transition-colors mb-3" />
                        <span className="text-sm font-bold text-[#1C1207]/30 group-hover:text-blue-500">Tap to capture handover photo</span>
                        <span className="text-[9px] font-bold text-[#1C1207]/15 uppercase tracking-widest mt-1">Photo will be AI-verified by Stitch</span>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                    </label>
                ) : (
                    <div className="relative rounded-[28px] overflow-hidden">
                        <img src={preview} alt="Handover" className="w-full h-48 object-cover" />
                        <button
                            onClick={() => { setPreview(null); setPhoto(null); setResult(null) }}
                            className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                        {!result && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full">
                                <Eye className="w-3 h-3 text-white/60" />
                                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Ready for audit</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Submit Button */}
            {preview && !result && (
                <button
                    onClick={submitAudit}
                    disabled={loading}
                    className="w-full py-4 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-600 transition-colors active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Submit for AI Audit'}
                </button>
            )}

            {/* Audit Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {(() => {
                            const config = verdictConfig[result.overallVerdict]
                            const VerdictIcon = config.icon
                            return (
                                <div className={`${config.bg} border ${config.border} rounded-[28px] p-6 space-y-4`}>
                                    <div className="flex items-center gap-3">
                                        <VerdictIcon className={`w-8 h-8 ${config.color}`} />
                                        <div>
                                            <p className={`text-lg font-black ${config.color}`}>{config.label}</p>
                                            <p className="text-xs text-[#1C1207]/40 font-bold">{result.auditNote}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white rounded-2xl p-3 text-center">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < result.conditionRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`} />
                                                ))}
                                            </div>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Condition</p>
                                        </div>
                                        <div className="bg-white rounded-2xl p-3 text-center">
                                            <p className="text-sm font-black text-[#1C1207] capitalize">{result.quantityMatch}</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Qty Match</p>
                                        </div>
                                    </div>

                                    {result.safetyConcerns.length > 0 && (
                                        <div className="bg-white rounded-2xl p-3 space-y-1">
                                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Safety Notes</p>
                                            {result.safetyConcerns.map((c, i) => (
                                                <p key={i} className="text-xs text-red-600 font-medium">• {c}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
