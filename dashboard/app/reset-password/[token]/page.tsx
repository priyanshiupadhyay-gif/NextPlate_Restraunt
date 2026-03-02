'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Loader2, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

export default function ResetPasswordPage() {
    const params = useParams()
    const token = params.token as string
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirm) { setError('Passwords do not match'); return }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return }
        setError('')
        setIsLoading(true)
        try {
            await api.post('/auth/reset-password', { token, password })
            setDone(true)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Reset failed. Link may be expired.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-orange-500/5 border border-[#1C1207]/5">
                    {!done ? (
                        <>
                            <div className="text-center mb-10">
                                <div className="w-16 h-16 bg-violet-50 rounded-[20px] flex items-center justify-center mx-auto mb-6">
                                    <KeyRound className="w-8 h-8 text-violet-500" />
                                </div>
                                <h1 className="text-3xl font-display font-black text-[#1C1207] tracking-tight uppercase">New Password</h1>
                                <p className="text-[#1C1207]/40 text-sm font-medium mt-2">Choose a strong password for your account</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">New Password</label>
                                    <div className="relative">
                                        <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8}
                                            className="w-full h-14 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl px-6 pr-14 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-violet-600/10 transition-all" />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#1C1207]/20">
                                            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Confirm Password</label>
                                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required
                                        className="w-full h-14 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-violet-600/10 transition-all" />
                                </div>
                                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                                <button type="submit" disabled={isLoading}
                                    className="w-full py-5 bg-[#1C1207] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl hover:bg-violet-600 transition-all disabled:opacity-50">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}
                                className="w-20 h-20 bg-emerald-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                            <h2 className="text-2xl font-display font-black text-[#1C1207] uppercase tracking-tight">Password Reset!</h2>
                            <p className="text-[#1C1207]/40 text-sm font-medium mt-3">Your password has been updated. You can now log in.</p>
                            <Link href="/login" className="mt-6 inline-block px-10 py-4 bg-[#1C1207] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all">
                                Go to Login
                            </Link>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#1C1207]/30 hover:text-orange-600 transition-colors uppercase tracking-widest">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
