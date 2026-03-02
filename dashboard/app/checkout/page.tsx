'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CreditCard,
    Wallet,
    QrCode,
    ArrowLeft,
    ShieldCheck,
    Zap,
    Leaf,
    CheckCircle2,
    ShoppingCart,
    Lock,
    Globe,
    Droplets
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import api from '@/lib/api'

const PAYMENT_METHODS = [
    { id: 'card', name: 'Digital Fiat', desc: 'Secure Card Processing', icon: CreditCard, color: 'text-blue-500' },
    { id: 'upi', name: 'Instant UPI', desc: 'Unified Payments Interface', icon: Zap, color: 'text-purple-500' },
    { id: 'crypto', name: 'Web3 / On-Chain', desc: 'S2P Resilience Credits', icon: Globe, color: 'text-emerald-500' },
    { id: 'cod', name: 'Grid Pick-up', desc: 'Verify at Physical Node', icon: Wallet, color: 'text-orange-500' }
]

export default function CheckoutPage() {
    const router = useRouter()
    const [cart, setCart] = useState<any[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStep, setProcessingStep] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState('card')

    useEffect(() => {
        const savedCart = localStorage.getItem('s2p_cart')
        if (savedCart) {
            setCart(JSON.parse(savedCart))
        } else {
            router.push('/feed')
        }
    }, [router])

    const subtotal = cart.reduce((acc, item) => acc + item.discountedPrice, 0)
    const savings = cart.reduce((acc, item) => acc + (item.originalPrice - item.discountedPrice), 0)
    const carbonSaved = cart.reduce((acc, item) => acc + (item.carbonScore || 0), 0).toFixed(1)
    const waterSaved = cart.reduce((acc, item) => acc + (item.waterSaved || 0), 0)

    const handleFinalizeRescue = async () => {
        setIsProcessing(true)

        // --- REAL-TIME PAYMENT SIMULATION SEQUENCE ---
        const steps = [
            { msg: 'Establishing Secure Grid Connection...', time: 800 },
            { msg: selectedMethod === 'upi' ? 'Verifying VPA via UPI Mesh...' : 'Authorizing Card Credentials...', time: 1200 },
            { msg: 'Contacting Node Bank Authority...', time: 1000 },
            { msg: 'Reserving Surplus Data-Packets...', time: 800 },
            { msg: 'Finalizing Rescue Protocol...', time: 600 }
        ]

        for (const step of steps) {
            setProcessingStep(step.msg)
            await new Promise(r => setTimeout(r, step.time))
        }

        try {
        // Group items by restaurant for multi-node rescue
            const grouped = cart.reduce((acc, item) => {
                const rId = item.restaurantId?._id || item.restaurant?.restaurantId?._id || item.restaurant?._id || item.restaurantId || 'demo-node'
                if (!acc[rId]) acc[rId] = []
                acc[rId].push(item)
                return acc
            }, {} as Record<string, any[]>)

            let totalItems = 0

            for (const rId of Object.keys(grouped)) {
                // Execute real rescue protocol for ALL items (including simulated ones that now exist in DB)
                const payload = {
                    restaurantId: rId === 'demo-node' ? '699e597fc02b23a16c79ad5e' : rId, // Map demo to real Seed Node
                    items: grouped[rId].map((i: any) => {
                        const itemId = i._id?._id || i._id
                        return {
                            itemId: (typeof itemId === 'string' && itemId.startsWith('feed')) ? '699e597fc02b23a16c79ad61' : itemId,
                            quantity: 1
                        }
                    }),
                    paymentMethod: selectedMethod
                }

                const res = await api.post('/orders', payload)
                if (res.data.success) {
                    totalItems += grouped[rId].length
                }
            }

            setIsSuccess(true)
            localStorage.removeItem('s2p_cart')
            toast.success('Rescue Protocol Authorized', {
                description: `Successfully diverted ${totalItems} items from waste.`
            })
        } catch (error: any) {
            toast.error('Authorization Failed', {
                description: error.response?.data?.message || 'The grid connection was interrupted. Please retry.'
            })
        } finally {
            setIsProcessing(false)
            setProcessingStep('')
        }
    }

    if (isSuccess) {
        return (
            <AppLayout>
                <div className="min-h-[80vh] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-xl w-full bg-white rounded-[64px] p-20 text-center space-y-10 shadow-2xl border border-[#1C1207]/5"
                    >
                        <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                            <CheckCircle2 className="w-16 h-16 text-white" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-5xl font-display font-black text-[#1C1207] uppercase tracking-tighter leading-none">Protocol Active</h1>
                            <p className="text-[#1C1207]/40 font-bold uppercase tracking-[0.3em] text-[10px]">Digital Receipt & QR Dispatched</p>
                        </div>
                        <div className="p-10 bg-emerald-50 rounded-[40px] grid grid-cols-2 gap-8">
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest">Carbon Offset</p>
                                <p className="text-3xl font-black text-emerald-600">-{carbonSaved}kg</p>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest">H2O Saved</p>
                                <p className="text-3xl font-black text-emerald-600">{waterSaved}L</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/orders')}
                            className="w-full py-6 bg-[#1C1207] text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl"
                        >
                            View Dispatch Logs
                        </button>
                    </motion.div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto space-y-12 pb-32">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-14 h-14 bg-white border border-[#1C1207]/5 rounded-[20px] flex items-center justify-center hover:bg-[#1C1207] hover:text-white transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-[0.3em]">
                            <Lock className="w-3 h-3" />
                            Secure Node Processing
                        </div>
                        <h1 className="text-5xl font-display font-black text-[#1C1207] leading-none uppercase tracking-tighter">Checkout Protocol</h1>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Left Side: Order Verification */}
                    <div className="lg:col-span-7 space-y-10">
                        <div className="bg-white rounded-[48px] p-10 border border-[#1C1207]/5 shadow-sm space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-display font-black text-[#1C1207] uppercase">Rescue Manifest</h3>
                                <span className="bg-[#1C1207] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{cart.length} Units</span>
                            </div>
                            <div className="space-y-6 max-h-[400px] overflow-y-auto no-scrollbar pr-4">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-6 p-6 rounded-[32px] bg-[#FFF8F0]/50 border border-transparent hover:border-orange-200 transition-all">
                                        <div className="w-16 h-16 rounded-[22px] overflow-hidden bg-white shadow-sm flex-shrink-0">
                                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-extrabold text-[#1C1207] truncate leading-tight">{item.name}</p>
                                            <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest mt-1">{item.restaurantName} // {item.zone}</p>
                                        </div>
                                        <p className="font-black text-[#1C1207]">${item.discountedPrice}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Gateway Options */}
                        <div className="space-y-8">
                            <h3 className="text-xl font-display font-black text-[#1C1207] uppercase ml-4">Payment Mesh Selection</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {PAYMENT_METHODS.map((method) => {
                                    const Icon = method.icon
                                    const isActive = selectedMethod === method.id
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method.id)}
                                            className={`p-8 rounded-[40px] border transition-all text-left flex items-start gap-6 relative group ${isActive
                                                ? 'bg-[#1C1207] border-[#1C1207] text-white shadow-2xl'
                                                : 'bg-white border-[#1C1207]/5 text-[#1C1207] hover:border-orange-200'
                                                }`}
                                        >
                                            <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all ${isActive ? 'bg-white/10' : 'bg-[#FFF8F0]'
                                                }`}>
                                                <Icon className={`w-7 h-7 ${method.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black uppercase tracking-widest text-[13px] mb-1">{method.name}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white/40' : 'text-[#1C1207]/30'}`}>{method.desc}</p>
                                            </div>
                                            {isActive && (
                                                <CheckCircle2 className="w-5 h-5 text-orange-500" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Mock Payment Details Input */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedMethod}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="p-10 bg-white border border-[#1C1207]/5 rounded-[48px] shadow-sm space-y-6"
                                >
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                                            <span className="text-orange-600 font-black text-xs">02</span>
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-[#1C1207]">Provide Settlement Details</h4>
                                    </div>

                                    {selectedMethod === 'upi' && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-widest">Digital Payment Address (VPA)</p>
                                            <div className="relative">
                                                <Zap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                                                <input
                                                    type="text"
                                                    placeholder="username@okaxis or 9876543210@upi"
                                                    className="w-full pl-16 pr-8 py-6 bg-[#FFF8F0] border-none rounded-[28px] text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedMethod === 'card' && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-widest">Card Credentials</p>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="relative">
                                                    <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="XXXX XXXX XXXX XXXX"
                                                        className="w-full pl-16 pr-8 py-6 bg-[#FFF8F0] border-none rounded-[28px] text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        className="w-full px-8 py-6 bg-[#FFF8F0] border-none rounded-[28px] text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                    <input
                                                        type="password"
                                                        placeholder="CVV"
                                                        className="w-full px-8 py-6 bg-[#FFF8F0] border-none rounded-[28px] text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedMethod === 'crypto' && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-widest">Wallet Signature / ENS</p>
                                            <div className="relative font-mono">
                                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                                                <input
                                                    type="text"
                                                    placeholder="0x... or vitalik.eth"
                                                    className="w-full pl-16 pr-8 py-6 bg-[#FFF8F0] border-none rounded-[28px] text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedMethod === 'cod' && (
                                        <div className="p-8 bg-orange-50 rounded-[32px] border border-orange-100 flex items-center gap-6">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                                <Wallet className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <p className="text-xs font-bold text-orange-900 leading-relaxed uppercase tracking-wider">
                                                Payment will be collected physically at the restaurant node during item pickup.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-[22px] border border-emerald-100">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Encrypted via S2P Security Mesh</p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Side: Total Card */}
                    <div className="lg:col-span-5 h-fit sticky top-12">
                        <div className="bg-[#1C1207] rounded-[56px] p-12 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 blur-[80px] rounded-full -mr-32 -mt-32" />

                            <div className="relative z-10 space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between text-white/40 font-bold uppercase tracking-[0.2em] text-[11px]">
                                        <span>Initial Liquidation</span>
                                        <span>${cart.reduce((s, d) => s + d.originalPrice, 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-emerald-400 font-bold uppercase tracking-[0.2em] text-[11px]">
                                        <span>Resilience Credit</span>
                                        <span>-${savings}</span>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Total Settlement</p>
                                            <p className="text-6xl font-display font-black tracking-tighter">${subtotal}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">
                                                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">-{carbonSaved}kg</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">
                                                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{waterSaved}L</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleFinalizeRescue}
                                    disabled={isProcessing}
                                    className="w-full py-8 bg-orange-600 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.3em] hover:bg-orange-500 hover:scale-[1.02] transition-all shadow-2xl relative overflow-hidden group"
                                >
                                    <span className="relative z-10">{isProcessing ? processingStep : 'Authorize Rescue'}</span>
                                    {isProcessing && (
                                        <motion.div
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '100%' }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 bg-white/20"
                                        />
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Verified by S2P Grid Nodes</span>
                                </div>
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
