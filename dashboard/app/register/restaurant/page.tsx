'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, Mail, Lock, User, ChefHat, MapPin, Utensils, Soup, Smartphone } from 'lucide-react'
import { authService } from '@/lib/auth-service'
import { useAuth } from '@/contexts/auth-context'
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google'

export default function RestaurantRegisterPage() {
    const router = useRouter()
    const { googleLogin } = useAuth()
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showOtp, setShowOtp] = useState(false)
    const [otp, setOtp] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        restaurantName: '',
        address: '',
        city: '',
        cuisineType: '',
        description: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        setStep(2)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // 1. Register Account
            const registerRes = await authService.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: 'restaurant'
            })

            if (!registerRes.success) {
                setError(registerRes.message || 'Registration failed')
                setIsLoading(false)
                return
            }

            // 2. Submit Application
            const { default: api } = await import('@/lib/api')
            await api.post('/auth/restaurant-application', {
                ownerName: formData.fullName,
                ownerEmail: formData.email,
                restaurantName: formData.restaurantName,
                address: formData.address,
                city: formData.city,
                description: formData.description,
                cuisineType: formData.cuisineType,
            })

            setSuccess(false)
            setShowOtp(true)
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return
        setIsLoading(true)
        setError('')
        try {
            const response = await googleLogin(credentialResponse.credential, {
                role: 'restaurant',
                restaurantName: formData.restaurantName,
                address: formData.address,
                city: formData.city,
                description: formData.description,
                cuisineType: formData.cuisineType
            })
            if (response.success) {
                setSuccess(true)
                setTimeout(() => router.push('/restaurant'), 3000)
            } else {
                console.warn('[GoogleRegister] Authentication failed:', response.message)
                setError(response.message || 'Google registration failed')
            }
        } catch (err: any) {
            console.error('[GoogleRegister] Unexpected error:', err)
            setError(err?.response?.data?.message || err?.message || 'Google authentication failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6) return

        setIsLoading(true)
        setError('')
        try {
            const { default: api } = await import('@/lib/api')
            const { tokenUtils } = await import('@/lib/api')
            const res = await api.post('/auth/verify-registration-otp', {
                email: formData.email,
                otp
            })

            if (res.data.success) {
                setSuccess(true)
                if (res.data.accessToken) {
                    tokenUtils.setTokens(res.data.accessToken, res.data.refreshToken)
                    setTimeout(() => router.push('/restaurant'), 3000)
                }
            } else {
                setError(res.data.message || 'Invalid OTP')
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'OTP verification failed.')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white rounded-[48px] p-12 text-center shadow-2xl border border-orange-100"
                >
                    <div className="w-24 h-24 bg-orange-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-orange-200">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-display font-black text-[#1C1207] uppercase tracking-tighter mb-4">Application Sent</h2>
                    <p className="text-[#1C1207]/60 font-medium leading-relaxed mb-8">
                        Your verification is successful. We'll reach out to verify your further details and get you onboarded. Welcome!
                    </p>
                    <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3 }}
                            className="h-full bg-orange-500"
                        />
                    </div>
                </motion.div>
            </div>
        )
    }

    if (showOtp) {
        return (
            <div className="min-h-screen bg-[#0A0501] flex items-center justify-center p-6 font-layout overflow-hidden">
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px]" />
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-md w-full bg-white/[0.02] backdrop-blur-3xl rounded-[48px] border border-white/5 p-12 relative z-10 shadow-2xl"
                >
                    <div className="text-center mb-10 space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                            <Lock className="w-8 h-8 text-orange-500" />
                        </div>
                        <h2 className="text-3xl font-display font-black text-white uppercase tracking-tight">Enter OTP</h2>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">
                            6-digit code sent to your business mail
                        </p>
                    </div>

                    <form onSubmit={handleOtpVerify} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-[10px] font-bold border border-red-500/20 mb-6 uppercase tracking-widest text-center">
                                {error}
                            </div>
                        )}

                        <input
                            type="text"
                            maxLength={6}
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-black text-center text-4xl tracking-[0.5em] text-white transition-all placeholder:text-white/5"
                            placeholder="000000"
                        />

                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full bg-white text-black py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-orange-500 hover:text-white transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                "Confirm Identity"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setShowOtp(false)}
                            className="text-white/20 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                            Back to Application
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }


    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="min-h-screen bg-white flex overflow-hidden font-body">
                {/* ═══ GRAIN OVERLAY ═══ */}
                <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* LEFT PANEL: HERO IMAGE */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1C1207]">
                    <img
                        src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop"
                        alt="Restaurant Kitchen"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                    />

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C1207] via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1C1207]/40 to-transparent" />

                    <div className="relative z-10 w-full p-20 flex flex-col justify-between">
                        <Link href="/register" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[#1C1207] transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">Back</span>
                        </Link>

                        <div className="space-y-8">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="inline-flex items-center gap-3 px-6 py-3 bg-orange-500/20 backdrop-blur-xl border border-orange-500/30 rounded-full"
                            >
                                <Utensils className="w-4 h-4 text-orange-400" />
                                <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Premium Partner</span>
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-7xl font-display font-black text-white leading-[0.9] uppercase tracking-tighter"
                            >
                                Share your <br /> <span className="text-orange-400">Craft</span>
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-white/60 text-xl font-medium max-w-lg leading-relaxed"
                            >
                                Join hundreds of premium restaurants reducing waste and giving back to the community.
                            </motion.p>
                        </div>

                        {/* Quality Badges */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] p-8 flex items-center gap-8 shadow-2xl"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-orange-400" />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">Verified</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Soup className="w-6 h-6 text-orange-400" />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">Premium</span>
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="text-white font-display font-black text-2xl tracking-tighter">Zero Waste</p>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">The Gold Standard</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT PANEL: FORM */}
                <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-24 overflow-y-auto bg-[#FFF8F0]">
                    <div className="max-w-xl mx-auto w-full">
                        {/* Header */}
                        <div className="mb-12 space-y-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${step === 1 ? 'bg-[#1C1207] text-white' : 'bg-orange-500 text-white'}`}>
                                    {step > 1 ? <CheckCircle className="w-4 h-4" /> : '01'}
                                </div>
                                <div className="h-[2px] w-8 bg-[#1C1207]/10" />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-[#1C1207] text-white' : 'bg-white text-[#1C1207]/20 border border-[#1C1207]/10'}`}>
                                    02
                                </div>
                            </div>
                            <h1 className="text-5xl font-display font-black text-[#1C1207] uppercase tracking-tighter">Partner Program</h1>
                            <p className="text-[#1C1207]/40 font-bold uppercase tracking-[0.2em] text-[10px]">Step {step} of 2 — {step === 1 ? 'Account Setup' : 'Business Details'}</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.form
                                    key="step1"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    onSubmit={handleNext}
                                    className="space-y-6"
                                >
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-bold flex items-center gap-3 border border-red-100 mb-6">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                            <input
                                                id="fullName"
                                                type="text"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                placeholder="Owner or Manager Name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                            <input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                placeholder="business@email.com"
                                            />
                                        </div>
                                    </div>



                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                                <input
                                                    id="password"
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Confirm Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                                <input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#1C1207] text-white rounded-[28px] py-6 px-12 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-orange-600 transition-all shadow-2xl group"
                                    >
                                        Business Details
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="step2"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Business Name</label>
                                        <div className="relative">
                                            <ChefHat className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                            <input
                                                id="restaurantName"
                                                type="text"
                                                value={formData.restaurantName}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                placeholder="Legal Business Name"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">City</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                                <input
                                                    id="city"
                                                    type="text"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                    placeholder="Location"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Industry</label>
                                            <select
                                                id="cuisineType"
                                                value={formData.cuisineType}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-8 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207] appearance-none"
                                            >
                                                <option value="">Select Category</option>
                                                <option value="bakery">Bakery / Cafe</option>
                                                <option value="luxury">Fine Dining</option>
                                                <option value="casual">Casual Dining</option>
                                                <option value="fastfood">QSR / Fast Food</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Headquarters Address</label>
                                        <input
                                            id="address"
                                            type="text"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-8 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                            placeholder="Full business address"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Mission Statement</label>
                                        <textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full bg-white border border-neutral-100 rounded-[32px] py-6 px-6 focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all outline-none font-bold text-[#1C1207] text-sm resize-none"
                                            placeholder="Briefly describe your food surplus patterns..."
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="w-1/3 bg-white border border-neutral-100 rounded-3xl py-6 px-4 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 bg-[#1C1207] text-white rounded-[28px] py-6 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-orange-600 transition-all shadow-2xl active:scale-[0.98]"
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    Initialize Partnership
                                                    <Soup className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-8">
                                        <div className="relative flex items-center gap-4 my-8">
                                            <span className="flex-1 h-px bg-[#1C1207]/10" />
                                            <span className="text-[10px] font-bold text-[#1C1207]/20 uppercase tracking-[0.2em]">Verify with Google</span>
                                            <span className="flex-1 h-px bg-[#1C1207]/10" />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                            <div className="relative overflow-hidden rounded-3xl border border-[#1C1207]/5 bg-white group-hover:border-orange-500/50 transition-colors">
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={() => setError('Google Registration Failed')}
                                                    useOneTap={false}
                                                    width={380}
                                                    theme="outline"
                                                    size="large"
                                                    text="signup_with"
                                                    shape="circle"
                                                    logo_alignment="left"
                                                />
                                            </div>
                                        </div>
                                        <p className="mt-4 text-[9px] text-[#1C1207]/30 text-center font-bold uppercase tracking-widest">
                                            Google will provide your verified identity to complete the partnership.
                                        </p>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    )
}
