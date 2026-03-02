'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Camera,
    Upload,
    ShieldCheck,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    Package,
    Clock,
    Star,
    Eye,
    Loader2,
    ChevronDown,
    Sparkles,
    FileWarning,
    ImageIcon
} from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface AuditResult {
    foodVisible: boolean
    quantityMatch: string
    conditionRating: number
    safetyConcerns: string[]
    overallVerdict: 'APPROVED' | 'FLAGGED' | 'REJECTED'
    auditNote: string
}

interface OrderForAudit {
    _id: string
    orderNumber: string
    items: { name: string; quantity: number }[]
    restaurantId?: { name: string }
    orderStatus: string
    specialInstructions?: string
    createdAt: string
    rescueAudit?: {
        verdict: string
        conditionRating: number
        quantityMatch: string
        auditNote: string
        safetyConcerns: string[]
        submittedAt: string
    }
}

const VERDICT_CONFIG = {
    APPROVED: {
        icon: ShieldCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        gradient: 'from-emerald-500 to-emerald-600',
        label: 'VERIFIED',
        description: 'Food quality confirmed — handover approved'
    },
    FLAGGED: {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        gradient: 'from-amber-500 to-amber-600',
        label: 'FLAGGED',
        description: 'Minor concerns detected — manual review suggested'
    },
    REJECTED: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        gradient: 'from-red-500 to-red-600',
        label: 'REJECTED',
        description: 'Quality issues detected — handover not approved'
    }
}

const QUANTITY_LABELS: Record<string, { label: string; color: string }> = {
    exact: { label: 'Exact Match', color: 'text-emerald-600' },
    approximate: { label: 'Approximately Correct', color: 'text-blue-600' },
    more: { label: 'More Than Expected', color: 'text-emerald-600' },
    less: { label: 'Less Than Expected', color: 'text-amber-600' },
    unclear: { label: 'Unclear', color: 'text-neutral-500' }
}

export default function RescueAuditPage() {
    const [orders, setOrders] = useState<OrderForAudit[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<OrderForAudit | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        setIsLoading(true)
        try {
            // Get NGO's confirmed/ready orders that need audit
            const res = await api.get('/orders', { params: { status: 'confirmed,ready,preparing' } })
            const ordersData = res.data.orders || res.data.data || []
            setOrders(ordersData)
        } catch (error) {
            console.error('Failed to fetch orders:', error)
            toast.error('Failed to load orders for audit')
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image must be under 10MB')
            return
        }

        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
        setAuditResult(null)
    }

    const handleSubmitAudit = async () => {
        if (!selectedOrder || !selectedFile) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('photo', selectedFile)

            const res = await api.post(`/rescue-audit/${selectedOrder._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (res.data.success) {
                setAuditResult(res.data.data)
                toast.success(`Audit ${res.data.data.overallVerdict}`, {
                    description: res.data.data.auditNote
                })
                // Refresh orders
                fetchOrders()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Audit submission failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetAudit = () => {
        setSelectedOrder(null)
        setSelectedFile(null)
        setPreviewUrl(null)
        setAuditResult(null)
    }

    const pendingOrders = orders.filter(o => !o.rescueAudit)
    const auditedOrders = orders.filter(o => o.rescueAudit)

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto space-y-12 pb-32">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                            <Eye className="w-3 h-3" />
                            AI Vision Protocol
                        </div>
                        <h1 className="text-5xl md:text-6xl font-display font-black text-[#1C1207] tracking-tighter leading-none uppercase">
                            Rescue <span className="text-violet-600">Audit</span>
                        </h1>
                        <p className="text-[#1C1207]/50 font-medium max-w-xl text-lg">
                            Upload handover photos for <span className="text-[#1C1207] font-bold">AI-powered verification</span>.
                            Stitch Vision validates food quality, quantity, and safety compliance in seconds.
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-3xl font-display font-black text-emerald-600">{auditedOrders.filter(o => o.rescueAudit?.verdict === 'APPROVED').length}</p>
                            <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">Approved</p>
                        </div>
                        <div className="w-px h-10 bg-[#1C1207]/5" />
                        <div className="text-center">
                            <p className="text-3xl font-display font-black text-amber-600">{pendingOrders.length}</p>
                            <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">Pending</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-10">
                    {/* Left — Order Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em]">
                                Orders Awaiting Audit
                            </h2>
                            <span className="px-3 py-1 bg-violet-50 text-violet-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-violet-100">
                                {pendingOrders.length} pending
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-28 bg-white rounded-[28px] border border-[#1C1207]/5 animate-pulse" />
                                ))}
                            </div>
                        ) : pendingOrders.length > 0 ? (
                            <div className="space-y-4">
                                {pendingOrders.map((order, i) => (
                                    <motion.button
                                        key={order._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => { setSelectedOrder(order); setAuditResult(null); setSelectedFile(null); setPreviewUrl(null) }}
                                        className={`w-full text-left p-6 rounded-[28px] border transition-all duration-300 group ${selectedOrder?._id === order._id
                                                ? 'bg-violet-50 border-violet-200 shadow-xl shadow-violet-500/10'
                                                : 'bg-white border-[#1C1207]/5 hover:border-violet-100 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">
                                                    #{order.orderNumber || order._id.slice(-6)}
                                                </p>
                                                <p className="text-sm font-bold text-[#1C1207] mt-1">
                                                    {order.restaurantId?.name || 'Restaurant'}
                                                </p>
                                            </div>
                                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black rounded-full uppercase tracking-widest border border-orange-100">
                                                {order.orderStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-[#1C1207]/30 uppercase tracking-widest">
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3 h-3" />
                                                {order.items.reduce((s, i) => s + i.quantity, 0)} items
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {order.items.length > 0 && (
                                            <p className="text-[11px] font-medium text-[#1C1207]/40 mt-2 truncate">
                                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                            </p>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-dashed border-[#1C1207]/10 rounded-[32px] py-16 text-center space-y-3">
                                <ShieldCheck className="w-12 h-12 text-[#1C1207]/10 mx-auto" />
                                <h3 className="text-sm font-black text-[#1C1207]/30 uppercase tracking-widest">All Clear</h3>
                                <p className="text-xs font-medium text-[#1C1207]/20 max-w-xs mx-auto">
                                    No pending orders need audit verification right now.
                                </p>
                            </div>
                        )}

                        {/* Previously Audited */}
                        {auditedOrders.length > 0 && (
                            <div className="space-y-4 mt-8">
                                <h2 className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em]">
                                    Completed Audits
                                </h2>
                                {auditedOrders.slice(0, 5).map((order) => {
                                    const verdict = order.rescueAudit?.verdict || 'APPROVED'
                                    const config = VERDICT_CONFIG[verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.APPROVED
                                    const Icon = config.icon
                                    return (
                                        <div key={order._id}
                                            className={`p-5 rounded-[24px] border ${config.border} ${config.bg} flex items-center gap-4`}
                                        >
                                            <div className={`w-10 h-10 rounded-[14px] bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-[#1C1207] truncate">
                                                    #{order.orderNumber || order._id.slice(-6)} — {order.restaurantId?.name}
                                                </p>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>
                                                    {config.label} • {order.rescueAudit?.conditionRating}/5 condition
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right — Audit Zone */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {!selectedOrder ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white border-2 border-dashed border-[#1C1207]/10 rounded-[48px] py-32 text-center space-y-6"
                                >
                                    <div className="w-24 h-24 bg-violet-50 rounded-[32px] flex items-center justify-center mx-auto">
                                        <Camera className="w-12 h-12 text-violet-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-display font-black text-[#1C1207]/20 uppercase tracking-tight">
                                            Select an Order
                                        </h3>
                                        <p className="text-sm font-medium text-[#1C1207]/15 max-w-sm mx-auto">
                                            Choose a pending order from the left panel, then upload a handover photo for AI verification.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : !auditResult ? (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-8"
                                >
                                    {/* Order Details */}
                                    <div className="bg-white rounded-[32px] p-8 border border-[#1C1207]/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">
                                                    Auditing Order #{selectedOrder.orderNumber || selectedOrder._id.slice(-6)}
                                                </p>
                                                <p className="text-lg font-display font-black text-[#1C1207] mt-1">
                                                    {selectedOrder.restaurantId?.name || 'Restaurant Pickup'}
                                                </p>
                                            </div>
                                            <button onClick={resetAudit} className="px-4 py-2 text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest hover:text-red-500 transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedOrder.items.map((item, i) => (
                                                <span key={i} className="px-4 py-2 bg-violet-50 text-violet-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-violet-100">
                                                    {item.quantity}x {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Photo Upload Zone */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative cursor-pointer rounded-[40px] border-2 border-dashed transition-all duration-300 overflow-hidden group ${previewUrl
                                                ? 'border-violet-300 bg-violet-50'
                                                : 'border-[#1C1207]/10 bg-white hover:border-violet-200 hover:bg-violet-50/30'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />

                                        {previewUrl ? (
                                            <div className="relative">
                                                <img
                                                    src={previewUrl}
                                                    alt="Handover photo"
                                                    className="w-full h-80 object-cover rounded-[38px]"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-[38px]" />
                                                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                        <span className="text-white text-xs font-black uppercase tracking-widest">Photo Ready</span>
                                                    </div>
                                                    <span className="text-white/50 text-[9px] font-bold">
                                                        Tap to change
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-24 text-center space-y-4">
                                                <div className="w-20 h-20 bg-violet-100 rounded-[28px] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                                    <Camera className="w-10 h-10 text-violet-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-display font-black text-[#1C1207]/40 uppercase tracking-tight">
                                                        Upload Handover Photo
                                                    </h3>
                                                    <p className="text-[11px] font-medium text-[#1C1207]/20 mt-1 max-w-sm mx-auto">
                                                        Take a photo of the food at pickup or upload from gallery. AI will verify quality, quantity & safety.
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-center gap-6 text-[9px] font-black text-[#1C1207]/15 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> JPG, PNG, WEBP</span>
                                                    <span>•</span>
                                                    <span>Max 10MB</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    {selectedFile && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={handleSubmitAudit}
                                            disabled={isSubmitting}
                                            className="w-full py-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Stitch Vision Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    Run AI Audit Verification
                                                </>
                                            )}
                                        </motion.button>
                                    )}

                                    {/* What AI Checks */}
                                    <div className="bg-violet-50/50 rounded-[32px] p-8 border border-violet-100/50">
                                        <h3 className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em] mb-4">
                                            What Stitch Vision Checks
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { icon: '🍽️', label: 'Food Visible', desc: 'Confirms food items are present in photo' },
                                                { icon: '📦', label: 'Quantity Match', desc: 'Verifies amount matches the order' },
                                                { icon: '✅', label: 'Condition Rating', desc: 'Rates food condition from 1-5' },
                                                { icon: '🛡️', label: 'Safety Check', desc: 'Flags packaging or temperature issues' }
                                            ].map((item) => (
                                                <div key={item.label} className="flex items-start gap-3">
                                                    <span className="text-lg">{item.icon}</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#1C1207] uppercase tracking-widest">{item.label}</p>
                                                        <p className="text-[10px] font-medium text-[#1C1207]/30">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                /* Audit Result */
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8"
                                >
                                    {(() => {
                                        const config = VERDICT_CONFIG[auditResult.overallVerdict] || VERDICT_CONFIG.APPROVED
                                        const Icon = config.icon
                                        return (
                                            <>
                                                {/* Verdict Hero */}
                                                <div className={`rounded-[40px] p-10 border ${config.border} ${config.bg} text-center space-y-4 relative overflow-hidden`}>
                                                    <div className="absolute inset-0 opacity-5" style={{
                                                        backgroundImage: 'radial-gradient(circle at 50% 50%, currentColor, transparent 70%)'
                                                    }} />
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', damping: 10 }}
                                                        className={`w-20 h-20 rounded-[28px] bg-gradient-to-br ${config.gradient} flex items-center justify-center mx-auto shadow-2xl`}
                                                    >
                                                        <Icon className="w-10 h-10 text-white" />
                                                    </motion.div>
                                                    <div>
                                                        <h2 className={`text-3xl font-display font-black ${config.color} uppercase tracking-tight`}>
                                                            {config.label}
                                                        </h2>
                                                        <p className="text-sm font-medium text-[#1C1207]/40 mt-1">
                                                            {config.description}
                                                        </p>
                                                    </div>
                                                    {auditResult.auditNote && (
                                                        <p className="text-sm font-bold text-[#1C1207]/60 italic max-w-md mx-auto">
                                                            "{auditResult.auditNote}"
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Detailed Metrics */}
                                                <div className="grid grid-cols-2 gap-6">
                                                    {/* Food Visible */}
                                                    <div className="bg-white rounded-[28px] p-6 border border-[#1C1207]/5 space-y-3">
                                                        <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">Food Visible</p>
                                                        <div className="flex items-center gap-2">
                                                            {auditResult.foodVisible ? (
                                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                                            ) : (
                                                                <XCircle className="w-6 h-6 text-red-500" />
                                                            )}
                                                            <span className="text-lg font-black text-[#1C1207]">
                                                                {auditResult.foodVisible ? 'Yes' : 'No'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quantity Match */}
                                                    <div className="bg-white rounded-[28px] p-6 border border-[#1C1207]/5 space-y-3">
                                                        <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">Quantity</p>
                                                        <p className={`text-lg font-black ${QUANTITY_LABELS[auditResult.quantityMatch]?.color || 'text-neutral-600'}`}>
                                                            {QUANTITY_LABELS[auditResult.quantityMatch]?.label || auditResult.quantityMatch}
                                                        </p>
                                                    </div>

                                                    {/* Condition Rating */}
                                                    <div className="bg-white rounded-[28px] p-6 border border-[#1C1207]/5 space-y-3">
                                                        <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">Condition</p>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star key={s} className={`w-6 h-6 ${s <= auditResult.conditionRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`} />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Safety */}
                                                    <div className="bg-white rounded-[28px] p-6 border border-[#1C1207]/5 space-y-3">
                                                        <p className="text-[9px] font-black text-[#1C1207]/30 uppercase tracking-widest">Safety</p>
                                                        {auditResult.safetyConcerns.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {auditResult.safetyConcerns.map((c, i) => (
                                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-full mr-1">
                                                                        <FileWarning className="w-3 h-3" />
                                                                        {c}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                                                <span className="text-emerald-600 font-black text-sm">No Concerns</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={resetAudit}
                                                        className="flex-1 py-5 bg-white border border-[#1C1207]/5 rounded-[24px] font-black text-xs text-[#1C1207]/40 uppercase tracking-[0.2em] hover:bg-neutral-50 transition-all"
                                                    >
                                                        Audit Another Order
                                                    </button>
                                                    <button
                                                        onClick={() => window.location.href = '/ngo'}
                                                        className="flex-1 py-5 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-violet-700 transition-all shadow-xl"
                                                    >
                                                        Back to Dashboard
                                                    </button>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
