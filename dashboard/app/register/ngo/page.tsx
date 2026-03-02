'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, Mail, Lock, User, BookOpen, MapPin, Soup, Phone, Smartphone } from 'lucide-react'
import { authService } from '@/lib/auth-service'
import { useAuth } from '@/contexts/auth-context'
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google'

export default function NGORegisterPage() {
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
        ngoName: '',
        regNumber: '',
        address: '',
        mission: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        let res;

        try {
            // Register as NGO
            res = await authService.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: 'ngo',
                ngoName: formData.ngoName,
                ngoRegNumber: formData.regNumber,
                ngoAddress: formData.address,
                ngoMission: formData.mission
            })

            if (res.success) {
                setSuccess(false)
                setShowOtp(true)
            } else {
                setError(res.message || 'Registration failed')
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.')
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setIsLoading(false)
            if (res && !res.success && typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        }
    }

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return
        setIsLoading(true)
        setError('')
        try {
            const response = await googleLogin(credentialResponse.credential, {
                role: 'ngo',
                ngoName: formData.ngoName,
                ngoRegNumber: formData.regNumber,
                ngoAddress: formData.address,
                ngoMission: formData.mission
            })
            if (response.success) {
                setSuccess(true)
                setTimeout(() => router.push('/ngo'), 3000)
            } else {
                console.warn('[GoogleRegister] NGO Authentication failed:', response.message)
                setError(response.message || 'Google registration failed')
            }
        } catch (err: any) {
            console.error('[GoogleRegister] NGO Unexpected error:', err)
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
                    setTimeout(() => router.push('/ngo'), 3000)
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
                    className="max-w-md w-full bg-white rounded-[48px] p-12 text-center shadow-2xl border border-emerald-100"
                >
                    <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-display font-black text-[#1C1207] uppercase tracking-tighter mb-4">You're a Hero!</h2>
                    <p className="text-[#1C1207]/60 font-medium leading-relaxed mb-8">
                        Verification successful. We're verifying your NGO details and will notify you shortly. Welcome to the movement!
                    </p>
                    <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3 }}
                            className="h-full bg-emerald-500"
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
                            6-digit hero code sent to your mail
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
                            className="w-full bg-white text-black py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center"
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
                            Back to Registration
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
                        src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop"
                        alt="NGO Impact"
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
                                className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-full"
                            >
                                <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Rescue Mission</span>
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-7xl font-display font-black text-white leading-[0.9] uppercase tracking-tighter"
                            >
                                Become a <br /> <span className="text-emerald-400">Guardian</span>
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-white/60 text-xl font-medium max-w-lg leading-relaxed"
                            >
                                Join our network of verified NGOs rescuing thousands of meals every day. Your mission starts here.
                            </motion.p>
                        </div>

                        {/* Impact Stats Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[40px] p-8 flex items-center justify-between shadow-2xl"
                        >
                            <div className="space-y-1">
                                <p className="text-emerald-400 text-3xl font-display font-black tracking-tighter">50,000+</p>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Meals Rescued Monthly</p>
                            </div>
                            <div className="w-[1px] h-12 bg-white/10" />
                            <div className="space-y-1">
                                <p className="text-white text-3xl font-display font-black tracking-tighter">120</p>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Verified Partners</p>
                            </div>
                            <div className="w-[1px] h-12 bg-white/10" />
                            <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <ShieldCheck className="w-8 h-8 text-white" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT PANEL: FORM */}
                <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-24 overflow-y-auto bg-[#FFF8F0]">
                    <div className="max-w-xl mx-auto w-full">
                        {/* Form Header */}
                        <div className="mb-12 space-y-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${step === 1 ? 'bg-[#1C1207] text-white' : 'bg-emerald-500 text-white'}`}>
                                    {step > 1 ? <CheckCircle className="w-4 h-4" /> : '01'}
                                </div>
                                <div className="h-[2px] w-8 bg-[#1C1207]/10" />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-[#1C1207] text-white' : 'bg-white text-[#1C1207]/20 border border-[#1C1207]/10'}`}>
                                    02
                                </div>
                            </div>
                            <h1 className="text-5xl font-display font-black text-[#1C1207] uppercase tracking-tighter">NGO Account</h1>
                            <p className="text-[#1C1207]/40 font-bold uppercase tracking-[0.2em] text-[10px]">Step {step} of 2 — {step === 1 ? 'Personal Details' : 'Organization info'}</p>
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
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                placeholder="Lead Representative Name"
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
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                placeholder="official@ngo.org"
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
                                                    className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none font-bold text-[#1C1207]"
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
                                                    className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#1C1207] text-white rounded-[28px] py-6 px-12 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl group active:scale-[0.98]"
                                    >
                                        Organization Details
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
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-bold flex items-center gap-3 border border-red-100 mb-6">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">NGO Name</label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                            <input
                                                id="ngoName"
                                                type="text"
                                                value={formData.ngoName}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                placeholder="Legal NGO Title"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Registration Number</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                            <input
                                                id="regNumber"
                                                type="text"
                                                value={formData.regNumber}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                placeholder="80G / 12A / DARPAN ID"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Headquarters Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C1207]/20" />
                                            <input
                                                id="address"
                                                type="text"
                                                value={formData.address}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-white border border-neutral-100 rounded-3xl py-5 px-14 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                                placeholder="Full legal address"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">NGO Mission</label>
                                        <textarea
                                            id="mission"
                                            value={formData.mission}
                                            onChange={handleChange}
                                            rows={4}
                                            className="w-full bg-white border border-neutral-100 rounded-[32px] py-6 px-6 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all outline-none font-bold text-[#1C1207] text-sm resize-none"
                                            placeholder="Tell us about the community you serve..."
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
                                        <motion.button
                                            type="submit"
                                            disabled={isLoading}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="relative flex-1 group overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[32px] py-6 font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-500/30 transition-all disabled:opacity-50"
                                        >
                                            {/* Shimmer Effect */}
                                            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />

                                            {/* Glow effect */}
                                            <div className="absolute inset-0 bg-emerald-400 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500" />

                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="relative z-10 transition-transform group-hover:scale-110">Initialize Hero Integration</span>
                                                    <motion.div
                                                        animate={{
                                                            y: [0, -4, 0],
                                                            rotate: [0, 10, 0]
                                                        }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut"
                                                        }}
                                                        className="relative z-10"
                                                    >
                                                        <Soup className="w-5 h-5 text-emerald-100" />
                                                    </motion.div>
                                                </>
                                            )}
                                        </motion.button>
                                    </div>

                                    <div className="mt-8">
                                        <div className="relative flex items-center gap-4 my-8">
                                            <span className="flex-1 h-px bg-[#1C1207]/10" />
                                            <span className="text-[10px] font-bold text-[#1C1207]/20 uppercase tracking-[0.2em]">Verify as Hero</span>
                                            <span className="flex-1 h-px bg-[#1C1207]/10" />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                            <div className="relative overflow-hidden rounded-3xl border border-[#1C1207]/5 bg-white group-hover:border-emerald-500/50 transition-colors">
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
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        <div className="mt-12 text-center">
                            <p className="text-[#1C1207]/30 font-bold uppercase tracking-widest text-[10px]">
                                By registering, you agree to our <a href="#" className="text-emerald-500">Terms of Rescue</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    )
}
