'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2, KeyRound } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await api.post('/auth/forgot-password', { email })
            setSent(true)
        } catch (error: any) {
            setSent(true) // Show success regardless for security
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-orange-500/5 border border-[#1C1207]/5">
                    {!sent ? (
                        <>
                            <div className="text-center mb-10">
                                <div className="w-16 h-16 bg-orange-50 rounded-[20px] flex items-center justify-center mx-auto mb-6">
                                    <KeyRound className="w-8 h-8 text-orange-500" />
                                </div>
                                <h1 className="text-3xl font-display font-black text-[#1C1207] tracking-tight uppercase">Reset Password</h1>
                                <p className="text-[#1C1207]/40 text-sm font-medium mt-2">Enter your email and we'll send a reset link</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1C1207]/20" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full h-14 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-600/10 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full py-5 bg-[#1C1207] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:bg-orange-600 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 10 }}
                                className="w-20 h-20 bg-emerald-50 rounded-[28px] flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                            <h2 className="text-2xl font-display font-black text-[#1C1207] uppercase tracking-tight">Check Your Email</h2>
                            <p className="text-[#1C1207]/40 text-sm font-medium mt-3 max-w-sm mx-auto">
                                If an account exists for <strong className="text-[#1C1207]">{email}</strong>, we've sent a password reset link. It expires in 30 minutes.
                            </p>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#1C1207]/30 hover:text-orange-600 transition-colors uppercase tracking-widest">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
