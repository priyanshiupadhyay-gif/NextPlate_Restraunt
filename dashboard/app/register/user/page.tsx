'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, Mail, Lock, ShoppingBag, Soup, Phone, Smartphone } from 'lucide-react'
import { authService } from '@/lib/auth-service'
import { useAuth } from '@/contexts/auth-context'
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google'

export default function UserRegisterPage() {
    const router = useRouter()
    const { googleLogin } = useAuth()
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showOtp, setShowOtp] = useState(false)
    const [otp, setOtp] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const res = await authService.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password
            })

            if (res.success) {
                setShowOtp(true)
            } else {
                setError(res.message || 'Registration failed')
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return

        setError('')
        setIsLoading(true)
        try {
            const response = await googleLogin(credentialResponse.credential)
            if (response.success && response.user) {
                const role = response.user.role;
                if (role === 'admin') router.push('/admin')
                else if (role === 'restaurant') router.push('/restaurant')
                else if (role === 'ngo') router.push('/ngo')
                else router.push('/feed')
            } else {
                console.warn('[GoogleSignup] Authentication failed:', response.message)
                setError(response.message || 'Google signup failed')
            }
        } catch (err: any) {
            console.error('[GoogleSignup] Unexpected error:', err)
            setError(err?.response?.data?.message || err?.message || 'Google authentication failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6) return

        setIsLoading(true)
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
                    router.push('/feed')
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
                    className="max-w-md w-full bg-white rounded-[48px] p-12 text-center shadow-2xl border border-blue-100"
                >
                    <div className="w-24 h-24 bg-[#1C1207] rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-display font-black text-[#1C1207] uppercase tracking-tighter mb-4">You're in!</h2>
                    <p className="text-[#1C1207]/60 font-medium leading-relaxed mb-8">
                        Verification successful. Welcome to the NextPlate grid.
                    </p>
                    <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 2 }}
                            className="h-full bg-blue-500"
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
                            6-digit code sent to your mail
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
                            Change Email Address
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="min-h-screen bg-white flex overflow-hidden font-body">
                <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* LEFT PANEL: HERO IMAGE */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1C1207]">
                    <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
                        alt="Community Eating"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                    />
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
                                className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 rounded-full"
                            >
                                <ShoppingBag className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Community Hub</span>
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-7xl font-display font-black text-white leading-[0.9] uppercase tracking-tighter"
                            >
                                Eat Great, <br /> <span className="text-blue-400">Save More.</span>
                            </motion.h2>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-white/60 text-xl font-medium max-w-lg leading-relaxed"
                            >
                                Join our community of foodies saving delicious meals from going to waste. Same taste, lower price.
                            </motion.p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-6 space-y-2"
                            >
                                <Soup className="w-6 h-6 text-blue-400" />
                                <p className="text-white font-bold text-sm">Best Deals</p>
                                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Up to 70% Off</p>
                            </motion.div>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-6 space-y-2"
                            >
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                <p className="text-white font-bold text-sm">Zero Waste</p>
                                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest">Earth Approved</p>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: FORM */}
                <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-24 overflow-y-auto bg-[#FFF8F0]">
                    <div className="max-w-xl mx-auto w-full pb-20">
                        <div className="mb-12 space-y-4 text-center lg:text-left">
                            <h1 className="text-6xl font-display font-black text-[#1C1207] uppercase tracking-tighter leading-none">
                                Fresh Account
                            </h1>
                            <p className="text-[#1C1207]/40 font-bold uppercase tracking-[0.3em] text-[10px] items-center flex lg:justify-start justify-center gap-4">
                                <span className="w-8 h-[1px] bg-[#1C1207]/10" />
                                Begin your food journey
                                <span className="w-8 h-[1px] bg-[#1C1207]/10" />
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-bold flex items-center gap-3 border border-red-100 mb-6">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Display Name</label>
                                <div className="relative flex items-center">
                                    <User className="absolute left-6 w-4 h-4 text-[#1C1207]/20" />
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white border border-neutral-100 rounded-[28px] py-5 px-14 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                        placeholder="your name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Email Address</label>
                                <div className="relative flex items-center">
                                    <Mail className="absolute left-6 w-4 h-4 text-[#1C1207]/20" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white border border-neutral-100 rounded-[28px] py-5 px-14 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                        placeholder="hello@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Secret Hash</label>
                                    <div className="relative flex items-center">
                                        <Lock className="absolute left-6 w-4 h-4 text-[#1C1207]/20" />
                                        <input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-white border border-neutral-100 rounded-[28px] py-5 px-14 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.2em] ml-2">Repeat Hash</label>
                                    <div className="relative flex items-center">
                                        <Lock className="absolute left-6 w-4 h-4 text-[#1C1207]/20" />
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-white border border-neutral-100 rounded-[28px] py-5 px-14 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all outline-none font-bold text-[#1C1207]"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#1C1207] text-white rounded-[28px] py-6 px-12 font-black text-xs uppercase tracking-[0.35em] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-2xl active:scale-[0.98] group mt-4"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8">
                            <div className="relative flex items-center gap-4 my-8">
                                <span className="flex-1 h-px bg-neutral-100" />
                                <span className="text-[10px] font-bold text-[#1C1207]/20 uppercase tracking-[0.2em]">Social Connect</span>
                                <span className="flex-1 h-px bg-neutral-100" />
                            </div>

                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative overflow-hidden rounded-3xl border border-neutral-100 bg-white group-hover:border-blue-500/50 transition-colors">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => {
                                            console.error('[GSI] Sign Up Failed');
                                            setError('Google Sign Up Failed. Please check if your origin is authorized in Google Console.');
                                        }}
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

                        <div className="mt-12 text-center">
                            <span className="text-[10px] font-bold text-[#1C1207]/30 uppercase tracking-[0.2em]">Already a member?</span>
                            <Link href="/login" className="ml-2 text-[10px] font-black text-blue-500 hover:text-[#1C1207] uppercase tracking-[0.2em] transition-all">
                                Sign In
                            </Link>
                        </div>

                        <div className="mt-20 pt-10 border-t border-neutral-100 text-center">
                            <p className="text-[9px] font-black text-[#1C1207]/20 uppercase tracking-[0.4em]">Secure • Sustainable • Social</p>
                        </div>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    )
}
