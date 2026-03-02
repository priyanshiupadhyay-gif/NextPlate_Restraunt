'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Eye,
    EyeOff,
    Soup,
    ShieldCheck,
    Store,
    Heart,
    ArrowLeft,
    ArrowRight,
    MessageSquare,
    Mail,
    Lock,
    Sparkles,
    Utensils,
    Smartphone
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { motion, AnimatePresence } from 'framer-motion'
import { authService } from '@/lib/auth-service'
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google'

export default function LoginPage() {
    const router = useRouter()
    const { login, googleLogin, mockLogin, isAuthenticated, user } = useAuth()
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

    useEffect(() => {
        if (isAuthenticated && user) {
            const role = user.role;
            if (role === 'admin') router.push('/admin')
            else if (role === 'restaurant') router.push('/restaurant')
            else if (role === 'ngo') router.push('/ngo')
            else router.push('/feed')
        }
    }, [isAuthenticated, user, router])
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await login(email, password)
            if (response.success && response.user) {
                // Redirect logic is handled by the useEffect watching isAuthenticated
                // but we also keep this for immediate feedback
                const role = response.user.role;
                if (role === 'admin') router.push('/admin')
                else if (role === 'restaurant') router.push('/restaurant')
                else if (role === 'ngo') router.push('/ngo')
                else router.push('/feed')
            } else {
                console.warn('[Login] Authentication failed:', response.message)
                setError(response.message || 'Login failed. Please verify your credentials.')
            }
        } catch (err: any) {
            console.error('[Login] Unexpected error:', err)
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
                console.warn('[GoogleLogin] Authentication failed:', response.message)
                setError(response.message || 'Google login failed')
            }
        } catch (err: any) {
            console.error('[GoogleLogin] Unexpected error:', err)
            setError(err?.response?.data?.message || err?.message || 'Google authentication failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDemoLogin = (role: 'admin' | 'restaurant' | 'user' | 'ngo') => {
        mockLogin(role)
        if (role === 'admin') router.push('/admin')
        else if (role === 'restaurant') router.push('/restaurant')
        else if (role === 'ngo') router.push('/ngo')
        else router.push('/')
    }



    // ─── CAROUSEL LOGIC ───
    const [activeSlide, setActiveSlide] = useState(0)
    const HERO_SLIDES = [
        {
            image: '/login-hero-1.png',
            title: 'Rescue Meals, Feed Communities.',
            subtitle: 'Feed Communities.',
            description: "Join NextPlate's mission to reduce food waste and connect surplus meals with people who need them most."
        },
        {
            image: '/login-hero-2.png',
            title: 'Zero Waste, Maximum Impact.',
            subtitle: 'Maximum Impact.',
            description: 'Every meal saved is a step towards a sustainable future. Empower your neighborhood with fresh food.'
        },
        {
            image: '/login-hero-3.png',
            title: 'Building Stronger Bonds.',
            subtitle: 'Growing Together.',
            description: 'Food is better when shared. Connect with local partners and make a real difference in your community.'
        }
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    // ─── MAIN LOGIN (SPLIT SCREEN) ───
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="min-h-screen flex font-body bg-white">

                {/* ═══════════════════════════════════════════ */}
                {/*           LEFT PANEL — FORM                */}
                {/* ═══════════════════════════════════════════ */}
                <div className="w-full lg:w-[48%] flex flex-col justify-center px-8 sm:px-16 lg:px-20 xl:px-28 py-12 relative overflow-hidden">

                    {/* Subtle background detail */}
                    <div className="absolute top-0 right-0 w-60 h-60 bg-orange-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-50 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="max-w-[420px] mx-auto w-full relative z-10">

                        {/* Brand Logo */}
                        <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="mb-14"
                        >
                            <div className="w-12 h-12 bg-[#1C1207] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1C1207]/20">
                                <Soup className="w-6 h-6 text-white" />
                            </div>
                        </motion.div>

                        {/* Header */}
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.05 }}
                            className="mb-10 space-y-3"
                        >
                            <h1 className="text-[40px] font-display font-black text-[#1C1207] tracking-tight leading-[1.1]">
                                Welcome Back!
                            </h1>
                            <p className="text-[#1C1207]/40 text-[15px] font-medium">
                                Please enter log in details below
                            </p>
                        </motion.div>

                        {/* Form */}
                        <motion.form
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-[#1C1207]/50 uppercase tracking-wider ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1C1207]/20 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="hello@example.com"
                                        className="w-full bg-[#F7F5F2] border border-[#E8E4DF] rounded-xl py-4 pl-12 pr-5 text-[#1C1207] font-semibold text-[15px] focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all placeholder:text-[#1C1207]/25"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-[#1C1207]/50 uppercase tracking-wider ml-1">Password</label>
                                    <Link href="/forgot-password" className="text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1C1207]/20 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-[#F7F5F2] border border-[#E8E4DF] rounded-xl py-4 pl-12 pr-14 text-[#1C1207] font-semibold text-[15px] focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all placeholder:text-[#1C1207]/25 tracking-wider"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1C1207]/20 hover:text-[#1C1207]/60 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                        <span className="text-red-600 text-[12px] font-bold">{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#1C1207] text-white py-4 rounded-xl font-black text-[13px] uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-[#2a1c0f] active:scale-[0.98] transition-all shadow-xl shadow-[#1C1207]/15 mt-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </motion.form>

                        {/* Google Login */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mt-4"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-emerald-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative overflow-hidden rounded-xl border border-[#E8E4DF] bg-white group-hover:border-orange-500/50 transition-colors">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => {
                                            console.error('[GSI] Login Failed');
                                            setError('Google Login Failed. Please check if your origin is authorized in Google Console.');
                                        }}
                                        useOneTap={false} // Disable auto-prompt if FedCM is failing
                                        width={380}
                                        theme="outline"
                                        size="large"
                                        text="continue_with"
                                        shape="square"
                                        logo_alignment="left"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Divider */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-4 my-8"
                        >
                            <span className="flex-1 h-px bg-[#E8E4DF]" />
                            <span className="text-[10px] font-bold text-[#1C1207]/25 uppercase tracking-widest">or continue as</span>
                            <span className="flex-1 h-px bg-[#E8E4DF]" />
                        </motion.div>

                        {/* Demo Quick-Access Buttons */}
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="grid grid-cols-3 gap-3"
                        >
                            {[
                                { id: 'admin', icon: ShieldCheck, label: 'Admin', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', hoverBg: 'hover:bg-blue-100' },
                                { id: 'restaurant', icon: Store, label: 'Restaurant', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', hoverBg: 'hover:bg-orange-100' },
                                { id: 'ngo', icon: Heart, label: 'NGO', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', hoverBg: 'hover:bg-emerald-100' }
                            ].map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => handleDemoLogin(role.id as any)}
                                    className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl ${role.bg} border ${role.border} ${role.hoverBg} transition-all group active:scale-[0.97]`}
                                >
                                    <div className={`w-10 h-10 rounded-xl ${role.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <role.icon className={`w-5 h-5 ${role.color}`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${role.color}`}>{role.label}</span>
                                </button>
                            ))}
                        </motion.div>

                        {/* Register Link */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="mt-10 text-center"
                        >
                            <span className="text-[13px] text-[#1C1207]/40 font-medium">
                                Don't have an account?{' '}
                            </span>
                            <Link href="/register" className="text-[13px] font-bold text-orange-500 hover:text-orange-600 transition-colors">
                                Sign Up
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════ */}
                {/*          RIGHT PANEL — HERO                */}
                {/* ═══════════════════════════════════════════ */}
                <div className="hidden lg:flex lg:w-[52%] p-4">
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.7, ease: 'circOut' }}
                        className="w-full h-full relative rounded-[32px] overflow-hidden bg-[#0D0906]"
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0">
                            {/* Diamond Grid Pattern */}
                            <div
                                className="absolute inset-0 opacity-[0.04]"
                                style={{
                                    backgroundImage: `
                                    linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
                                    linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
                                    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%),
                                    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)
                                `,
                                    backgroundSize: '60px 60px',
                                    backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
                                }}
                            />
                            {/* Radial glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-br from-orange-600/15 via-transparent to-emerald-600/10 rounded-full blur-[80px]" />
                        </div>

                        {/* Floating decorative elements */}
                        <motion.div
                            animate={{ y: [-8, 8, -8] }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-16 right-16 w-4 h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/30"
                        />
                        <motion.div
                            animate={{ y: [6, -6, 6] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                            className="absolute top-28 left-20 w-3 h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-400/30"
                        />
                        <motion.div
                            animate={{ y: [-5, 10, -5], rotate: [0, 180, 360] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute bottom-40 right-24 w-6 h-6 border-2 border-orange-400/30 rounded-lg"
                        />

                        {/* Center Content */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12">

                            {/* Glowing border frame for the hero image */}
                            <div className="relative mb-10">
                                {/* Outer glow ring */}
                                <div className="absolute -inset-3 bg-gradient-to-br from-orange-500/20 via-transparent to-emerald-500/20 rounded-[36px] blur-xl" />

                                {/* Image container with AnimatePresence */}
                                <div className="relative w-[320px] h-[320px] xl:w-[360px] xl:h-[360px] rounded-[28px] overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50 bg-[#161210]">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={activeSlide}
                                            src={HERO_SLIDES[activeSlide].image}
                                            initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                            transition={{ duration: 0.8, ease: "anticipate" }}
                                            alt="NextPlate — Save Food, Share Joy"
                                            className="w-full h-full object-cover"
                                        />
                                    </AnimatePresence>
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0906]/60 via-transparent to-transparent" />
                                </div>

                                {/* Floating badge */}
                                <motion.div
                                    animate={{ y: [-4, 4, -4] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute -top-4 -left-4 bg-[#1a1510]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-xl"
                                >
                                    <Sparkles className="w-4 h-4 text-orange-400" />
                                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">AI Powered</span>
                                </motion.div>
                            </div>

                            {/* Title & Description with AnimatePresence */}
                            <div className="text-center max-w-md space-y-4 min-h-[140px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeSlide}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <h2 className="text-3xl xl:text-4xl font-display font-black text-white tracking-tight leading-tight uppercase">
                                            {HERO_SLIDES[activeSlide].title.split(',')[0]},<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">
                                                {HERO_SLIDES[activeSlide].subtitle || HERO_SLIDES[activeSlide].title.split(',')[1]}
                                            </span>
                                        </h2>
                                        <p className="text-white/35 text-[14px] font-medium leading-relaxed max-w-sm mx-auto mt-4">
                                            {HERO_SLIDES[activeSlide].description}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Carousel Dots */}
                            <div className="flex items-center gap-2.5 mt-10">
                                {HERO_SLIDES.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveSlide(idx)}
                                        className={`relative h-2 transition-all duration-500 rounded-full cursor-pointer ${activeSlide === idx ? 'w-8 bg-orange-500' : 'w-2 bg-white/10 hover:bg-white/20'}`}
                                    >
                                        {activeSlide === idx && (
                                            <motion.div
                                                layoutId="activeDot"
                                                className="absolute inset-0 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>


                        {/* Bottom info bar */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                            <div className="flex items-center gap-6 text-white/20">
                                <div className="flex items-center gap-2">
                                    <Utensils className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">50K+ Meals Saved</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <Heart className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">120+ Partners</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </GoogleOAuthProvider>
    )
}
