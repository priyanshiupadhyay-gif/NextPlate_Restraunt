'use client'

import React, { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { QrCode, Camera, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { restaurantService } from '@/lib/restaurant-service'
import { useToast } from '@/hooks/use-toast'

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error'

interface ScannedOrder {
    orderId: string
    customerName: string
    items: any[]
    total: number
}

export default function QRScannerPage() {
    const [status, setStatus] = useState<ScanStatus>('idle')
    const [scannedOrder, setScannedOrder] = useState<ScannedOrder | null>(null)
    const [qrInput, setQrInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const { toast } = useToast()

    const handleVerify = async (data: string) => {
        setLoading(true)
        setErrorMessage('')
        try {
            const res = await restaurantService.verifyQR(data)
            if (res.success) {
                setScannedOrder({
                    orderId: res.order.orderNumber,
                    customerName: res.order.customerName,
                    items: res.order.items,
                    total: res.order.totalAmount
                })
                setStatus('success')
                toast({
                    title: 'Verification Success',
                    description: `Order ${res.order.orderNumber} successfully picked up.`,
                })
            } else {
                setErrorMessage(res.message || 'Verification failed')
                setStatus('error')
            }
        } catch (err) {
            setErrorMessage('Network error during verification')
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    const handleStartScan = () => {
        setStatus('scanning')
    }

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (qrInput) {
            handleVerify(qrInput)
        }
    }

    const handleReset = () => {
        setStatus('idle')
        setScannedOrder(null)
        setQrInput('')
        setErrorMessage('')
    }

    return (
        <AppLayout>
            <div className="space-y-12 max-w-4xl mx-auto pb-32">
                {/* Page Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1C1207] text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                        <QrCode className="w-3" />
                        Verification Gate
                    </div>
                    <h1 className="text-5xl font-display font-black text-[#1C1207] tracking-tighter uppercase">Packet Verify</h1>
                    <p className="text-[#1C1207]/50 font-medium text-lg">
                        Decrypt and authenticate customer pickup tokens to finalize the rescue cycle.
                    </p>
                </div>

                {/* Scanner Area */}
                <div className="max-w-xl mx-auto">
                    {status === 'idle' && (
                        <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-12 text-center shadow-sm space-y-10">
                            <div className="w-32 h-32 rounded-[40px] bg-orange-50 flex items-center justify-center mx-auto relative group">
                                <div className="absolute inset-0 bg-orange-200 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-40 transition-opacity" />
                                <QrCode className="w-16 h-16 text-orange-600 relative z-10" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-display font-black text-[#1C1207] tracking-tight">WAITING FOR SIGNAL</h2>
                                <p className="text-sm font-medium text-[#1C1207]/40 leading-relaxed px-10">
                                    Authenticate the digital handshake. Use the camera node or manual override.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <button
                                    onClick={handleStartScan}
                                    className="w-full py-6 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-2xl active:scale-95"
                                >
                                    <Camera className="w-5 h-5" />
                                    Initialize Camera
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1C1207]/5"></div></div>
                                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-[#1C1207]/20 bg-white px-4">OR Manual Entry</div>
                                </div>

                                <form onSubmit={handleManualSubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter token payload..."
                                        value={qrInput}
                                        onChange={(e) => setQrInput(e.target.value)}
                                        className="flex-1 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-600/5 transition-all"
                                    />
                                    <button type="submit" className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {status === 'scanning' && (
                        <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-12 text-center shadow-sm space-y-10">
                            <div className="relative w-80 h-80 mx-auto rounded-[48px] bg-[#1C1207] overflow-hidden group">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-orange-600/50 rounded-3xl animate-pulse" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-8 inset-x-0 text-center space-y-2">
                                    <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Calibrating Lens...</p>
                                    <div className="flex justify-center gap-1">
                                        {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                                    </div>
                                </div>
                                <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] animate-scan-line" />
                            </div>

                            <div className="space-y-6">
                                <p className="text-xs font-bold text-[#1C1207]/40 uppercase tracking-widest px-10">
                                    Note: Production environments require physical hardware access. Simulated signal override enabled.
                                </p>

                                <form onSubmit={handleManualSubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Paste payload here..."
                                        value={qrInput}
                                        onChange={(e) => setQrInput(e.target.value)}
                                        className="flex-1 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl px-6 py-4 text-sm font-bold"
                                    />
                                    <button disabled={loading} type="submit" className="bg-orange-600 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'VERIFY'}
                                    </button>
                                </form>

                                <button
                                    onClick={handleReset}
                                    className="text-[10px] font-black text-[#1C1207]/30 hover:text-red-500 uppercase tracking-widest transition-colors"
                                >
                                    ABORT SEQUENCE
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'success' && scannedOrder && (
                        <div className="bg-white border border-[#1C1207]/10 rounded-[64px] overflow-hidden shadow-2xl space-y-0">
                            <div className="bg-emerald-500 p-12 text-center text-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-20"><CheckCircle className="w-32 h-32" /></div>
                                <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-4xl font-display font-black tracking-tight uppercase leading-none mb-2">Authenticated</h2>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em]">Protocol Finalized</p>
                            </div>

                            <div className="p-12 space-y-10">
                                <div className="grid grid-cols-2 gap-10">
                                    <div>
                                        <p className="text-[10px] font-black text-[#1C1207]/20 uppercase tracking-widest mb-1">Order Identifier</p>
                                        <p className="text-xl font-black text-[#1C1207]">{scannedOrder.orderId}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-[#1C1207]/20 uppercase tracking-widest mb-1">Authorized Cititzen</p>
                                        <p className="text-xl font-black text-[#1C1207]">{scannedOrder.customerName}</p>
                                    </div>
                                </div>

                                <div className="border-y border-[#1C1207]/5 py-8">
                                    <p className="text-[10px] font-black text-[#1C1207]/20 uppercase tracking-widest mb-4">Payload Content</p>
                                    <ul className="space-y-4">
                                        {scannedOrder.items.map((item, idx) => (
                                            <li key={idx} className="flex justify-between items-center bg-orange-50/50 p-4 rounded-2xl border border-orange-600/5">
                                                <span className="font-bold text-[#1C1207]">{item.name}</span>
                                                <span className="text-[10px] font-black text-orange-600 bg-orange-100/50 px-3 py-1 rounded-full">{item.quantity} UNIT</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-[#1C1207]/20 uppercase tracking-widest mb-1">Value Dispatched</p>
                                        <p className="text-4xl font-display font-black text-orange-600 tracking-tighter">${scannedOrder.total.toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="h-16 px-10 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all"
                                    >
                                        Close Portal
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-white border border-red-100 rounded-[48px] p-12 text-center shadow-sm space-y-10">
                            <div className="w-24 h-24 rounded-[40px] bg-red-50 flex items-center justify-center mx-auto text-red-600 border border-red-100">
                                <XCircle className="w-12 h-12" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-display font-black text-red-600 tracking-tight uppercase">Access Denied</h2>
                                <p className="text-sm font-medium text-red-800/60 leading-relaxed px-10">
                                    {errorMessage || 'This token sequence is unrecognized or has been previously expired by the grid controller.'}
                                </p>
                            </div>
                            <button onClick={handleReset} className="w-full py-6 bg-red-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl">
                                Restart Handshake
                            </button>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="max-w-xl mx-auto bg-[#FFF8F0] border border-[#1C1207]/5 rounded-[40px] p-10">
                    <h3 className="text-xs font-black text-[#1C1207] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        Verification SOP
                    </h3>
                    <div className="space-y-6">
                        {[
                            'Scan the dynamic QR displayed on the user\'s rescue hub.',
                            'Verify the packet signature and physical identity.',
                            'Confirm the dispatch in the node terminal to initiate settlement.'
                        ].map((text, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <span className="text-[10px] font-black text-orange-600">0{i + 1}</span>
                                <p className="text-sm font-medium text-[#1C1207]/60 leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scan-line {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan-line {
                    animation: scan-line 3s linear infinite;
                }
            `}</style>
        </AppLayout>
    )
}
