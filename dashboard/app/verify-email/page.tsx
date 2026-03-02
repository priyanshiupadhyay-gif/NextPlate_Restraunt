"use client"

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Mail, Lock, ShieldCheck, Sparkles, Utensils } from 'lucide-react'
import api, { tokenUtils } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

const SLIDES = [
    {
        image: '/brain/5aab2088-02ad-4734-bf82-cb72d5d3e7f2/login_hero_character_1772102147227.png',
        title: "Rescue Meals,",
        subtitle: "Feed Communities.",
        description: "Join NextPlate's mission to reduce food waste and connect surplus meals with people who need them most."
    },
    {
        image: '/brain/5aab2088-02ad-4734-bf82-cb72d5d3e7f2/verify_hero_2_1772109144386.png',
        title: "Fresh Impact,",
        subtitle: "Zero Waste.",
        description: "We bring surplus food from premium restaurants straight to those who value it."
    },
    {
        image: '/brain/5aab2088-02ad-4734-bf82-cb72d5d3e7f2/verify_hero_3_retry_1772109185373.png',
        title: "Community First,",
        subtitle: "Always.",
        description: "Your verification ensures a secure and trustworthy environment for everyone."
    }
]

function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const { refreshUser } = useAuth()

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'otp-input'>('loading')
    const [message, setMessage] = useState('Verifying your email...')
    const [otp, setOtp] = useState('')
    const [email, setEmail] = useState('')
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)

    // Slideshow effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    const verify = useCallback(async () => {
        if (!token) {
            setStatus('otp-input')
            setMessage('Enter the 6-digit code sent to your email.')
            return
        }

        try {
            const response = await api.get(`/auth/verify-email?token=${token}`)

            if (response.data.success) {
                setStatus('success')
                setMessage(response.data.message || 'Email verified successfully!')

                if (response.data.accessToken) {
                    tokenUtils.setTokens(response.data.accessToken, response.data.refreshToken)
                    await refreshUser()

                    const role = response.data.user?.role
                    setTimeout(() => {
                        if (role === 'admin') router.push('/admin')
                        else if (role === 'restaurant') router.push('/restaurant')
                        else if (role === 'ngo') router.push('/ngo')
                        else router.push('/feed')
                    }, 3000)
                }
            } else {
                setStatus('error')
                setMessage(response.data.message || 'Verification failed.')
            }
        } catch (err: any) {
            setStatus('error')
            setMessage(err.response?.data?.message || 'This link has expired or is invalid.')
        }
    }, [token, refreshUser, router])

    useEffect(() => {
        verify()
    }, [verify])

    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6) return

        setIsVerifyingOtp(true)
        try {
            const response = await api.post('/auth/verify-registration-otp', {
                email,
                otp
            })

            if (response.data.success) {
                setStatus('success')
                setMessage(response.data.message || 'Email verified successfully!')

                if (response.data.accessToken) {
                    tokenUtils.setTokens(response.data.accessToken, response.data.refreshToken)
                    await refreshUser()

                    const role = response.data.user?.role
                    setTimeout(() => {
                        if (role === 'admin') router.push('/admin')
                        else if (role === 'restaurant') router.push('/restaurant')
                        else if (role === 'ngo') router.push('/ngo')
                        else router.push('/feed')
                    }, 3000)
                }
            }
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Invalid or expired OTP code.')
        } finally {
            setIsVerifyingOtp(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0501] flex items-center justify-center p-6 font-layout">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-xl w-full bg-white/[0.02] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] backdrop-blur-3xl rounded-[48px] border border-white/5 overflow-hidden relative z-10"
            >
                {/* Hero Slider Section */}
                <div className="relative h-[420px] w-full p-8 flex flex-col items-center justify-center text-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-12"
                        >
                            <div className="relative mb-8 group">
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/40 blur-2xl rounded-full" />
                                <div className="absolute inset-0 bg-orange-500/20 rounded-[48px] blur-2xl group-hover:bg-orange-500/30 transition-all duration-700" />
                                <div className="w-56 h-56 rounded-[48px] overflow-hidden border border-white/10 relative shadow-2xl shadow-black/80 ring-1 ring-white/20">
                                    <img
                                        src={SLIDES[currentSlide].image}
                                        alt="Slide"
                                        className="w-full h-full object-cover scale-110 hover:scale-125 transition-transform duration-1000"
                                    />
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-orange-400" />
                                        <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">AI Core</span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-4xl font-display font-black text-white leading-[0.9] uppercase tracking-tighter mb-3">
                                {SLIDES[currentSlide].title}<br />
                                <span className="text-orange-500">{SLIDES[currentSlide].subtitle}</span>
                            </h2>
                            <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.1em] max-w-xs leading-relaxed">
                                {SLIDES[currentSlide].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-8 flex gap-3">
                        {SLIDES.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${currentSlide === i ? 'w-10 bg-orange-500' : 'w-4 bg-white/10 hover:bg-white/20'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-12 pt-4">
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

                    <AnimatePresence mode="wait">
                        {status === 'loading' && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8 text-center"
                            >
                                <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto border border-white/10 shadow-inner">
                                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight leading-none">Scanning Link</h3>
                                    <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">Establishing Secure End-to-End Tunnel</p>
                                </div>
                            </motion.div>
                        )}

                        {status === 'otp-input' && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-5 justify-center mb-4">
                                    <div className="w-14 h-14 bg-orange-600 rounded-3xl flex items-center justify-center border border-white/10 shadow-[0_0_32px_rgba(234,88,12,0.3)]">
                                        <Lock className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter leading-none mb-1">Verify Identity</h3>
                                        <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{message}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleOtpVerify} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-orange-500 transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] py-5 px-14 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-white transition-all placeholder:text-white/10 text-sm shadow-inner"
                                                placeholder="Verification Email Id"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            required
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] py-6 px-6 focus:ring-4 focus:ring-orange-500/5 outline-none font-black text-center text-4xl tracking-[0.4em] text-white transition-all placeholder:text-white/5 shadow-inner"
                                            placeholder="XXXXXX"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isVerifyingOtp || otp.length !== 6 || !email}
                                        className="w-full bg-white text-black py-6 rounded-[28px] font-black text-[12px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-orange-500 hover:text-white transition-all duration-500 active:scale-[0.98] disabled:opacity-10 shadow-2xl overflow-hidden group relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <span className="relative z-10 flex items-center gap-4">
                                            {isVerifyingOtp ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    Verify & Launch
                                                    <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {status === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-10 text-center py-6"
                            >
                                <div className="relative mx-auto w-24 h-24">
                                    <div className="absolute inset-0 bg-emerald-500/40 rounded-[36px] blur-[32px] animate-pulse" />
                                    <div className="relative w-full h-full bg-emerald-500 rounded-[36px] flex items-center justify-center border border-white/20 shadow-2xl">
                                        <CheckCircle className="w-12 h-12 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-4xl font-display font-black text-white uppercase tracking-tighter">Identity Cleared</h3>
                                    <p className="text-white/60 font-medium leading-relaxed max-w-xs mx-auto text-sm">
                                        Welcome aboard! Your profile has been activated on the NextPlate grid.
                                    </p>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 3, ease: "easeInOut" }}
                                            className="h-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                                        />
                                    </div>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                        <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em]">
                                            Synchronizing Dashboard Assets
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-10 text-center"
                            >
                                <div className="w-20 h-20 bg-red-600 rounded-[32px] flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_32px_rgba(220,38,38,0.3)]">
                                    <XCircle className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Link Corrupted</h3>
                                    <p className="text-red-400 font-black text-[9px] uppercase tracking-[0.3em] px-5 py-2.5 bg-red-500/10 rounded-full inline-block border border-red-500/20">
                                        {message}
                                    </p>
                                </div>
                                <div className="pt-4 space-y-4">
                                    <button
                                        onClick={() => setStatus('otp-input')}
                                        className="w-full bg-white/5 text-white/80 border border-white/10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300"
                                    >
                                        Use OTP Code Instead
                                    </button>
                                    <button
                                        onClick={() => router.push('/register')}
                                        className="text-white/20 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 mx-auto mt-4 px-6 py-3"
                                    >
                                        <Mail className="w-3.5 h-3.5" />
                                        Retry Registration Protocol
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Global Footer Signal */}
                <div className="bg-white/[0.01] p-5 border-t border-white/[0.03] flex items-center justify-around">
                    <div className="flex items-center gap-3 group">
                        <Utensils className="w-4 h-4 text-white/20 group-hover:text-orange-500 transition-colors" />
                        <span className="text-[9px] font-black text-white/20 group-hover:text-white transition-colors uppercase tracking-[0.2em]">50k+ Salvaged</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/[0.05]" />
                    <div className="flex items-center gap-3 group">
                        <ShieldCheck className="w-4 h-4 text-white/20 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[9px] font-black text-white/20 group-hover:text-white transition-colors uppercase tracking-[0.2em]">Encrypted Node</span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0A0501] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
