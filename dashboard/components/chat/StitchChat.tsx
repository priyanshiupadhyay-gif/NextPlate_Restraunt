'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, ChevronDown, Sparkles, Loader2, Trash2, Search, ShoppingCart, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface Message {
    role: 'user' | 'model'
    text: string
    ts: number
}

const STARTER_PROMPTS = [
    'What surplus is available near me?',
    'How is my carbon impact calculated?',
    'How do NGOs claim food for free?',
    'What is the Resilience Grid?',
]

export function StitchChat() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [sessionId] = useState(() => `sess_${Date.now()}`)
    const [unread, setUnread] = useState(0)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleAction = useCallback((action: any) => {
        if (!action) return

        switch (action.action) {
            case 'search':
                if (action.params?.query) {
                    toast.success('Grid Search Initialized', { description: `Locating: ${action.params.query}` })
                    router.push(`/feed?search=${encodeURIComponent(action.params.query)}`)
                }
                break
            case 'navigate':
                if (action.params?.page) {
                    toast.info('Modulating Hub', { description: `Navigating to: ${action.params.page}` })
                    router.push(`/${action.params.page}`)
                }
                break
            case 'add_to_cart':
                toast.success('Resource Allocated', { description: 'Item added to your rescue sequence.' })
                // Logic to add to cart would go here
                break
            default:
                break
        }
    }, [router])

    // Scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setUnread(0)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return

        const userMsg: Message = { role: 'user', text: text.trim(), ts: Date.now() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await api.post('/chat', { message: text.trim(), sessionId })
            const reply: Message = { role: 'model', text: res.data.reply, ts: Date.now() }
            setMessages(prev => [...prev, reply])
            if (!open) setUnread(u => u + 1)

            // Handle AI Action
            if (res.data.action) {
                handleAction(res.data.action)
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'model',
                text: 'Signal lost — I\'m having trouble connecting. Please check you\'re logged in and try again.',
                ts: Date.now()
            }])
        } finally {
            setLoading(false)
        }
    }, [loading, open, sessionId, handleAction])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    const clearHistory = async () => {
        try {
            await api.delete(`/chat/history?sessionId=${sessionId}`)
            setMessages([])
        } catch { }
    }

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                <AnimatePresence>
                    {!open && messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="bg-[#1C1207] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl whitespace-nowrap"
                        >
                            Ask Stitch anything ✨
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    onClick={() => setOpen(o => !o)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-[22px] flex items-center justify-center shadow-2xl shadow-orange-500/30 text-white"
                >
                    <AnimatePresence mode="wait">
                        {open ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                <X className="w-7 h-7" />
                            </motion.div>
                        ) : (
                            <motion.div key="icon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                                <Sparkles className="w-7 h-7" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {unread > 0 && !open && (
                        <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black flex items-center justify-center"
                        >
                            {unread}
                        </motion.span>
                    )}
                </motion.button>
            </div>

            {/* Chat Window */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 400 }}
                        className="fixed bottom-28 right-6 z-50 w-[380px] max-h-[580px] flex flex-col bg-white rounded-[32px] shadow-2xl shadow-black/10 border border-[#1C1207]/5 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-6 py-5 bg-[#1C1207] text-white flex-shrink-0">
                            <div className="w-10 h-10 rounded-[14px] bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-sm tracking-tight">Stitch AI</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Grid Intelligence — Online</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {messages.length > 0 && (
                                    <button onClick={clearHistory} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-all">
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={{ maxHeight: '380px' }}>
                            {/* Welcome Message */}
                            {messages.length === 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="bg-orange-50 border border-orange-100 rounded-[20px] p-4 space-y-3">
                                        <p className="text-sm font-bold text-[#1C1207] leading-relaxed">
                                            Hey — I'm <span className="text-orange-600">Stitch</span>, the intelligence layer of the Resilience Grid. Ask me anything about surplus rescue, your impact, or how the network works.
                                        </p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {STARTER_PROMPTS.map((prompt) => (
                                                <button
                                                    key={prompt}
                                                    onClick={() => sendMessage(prompt)}
                                                    className="text-left text-[11px] font-bold text-orange-700 bg-white border border-orange-100 hover:border-orange-300 hover:bg-orange-50 rounded-[14px] px-3 py-2.5 transition-all truncate"
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Messages */}
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'model' && (
                                        <div className="w-7 h-7 rounded-[10px] bg-orange-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                                            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] px-4 py-3 rounded-[18px] text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-[#1C1207] text-white rounded-br-[6px] font-medium'
                                        : 'bg-neutral-100 text-[#1C1207] rounded-bl-[6px] font-medium'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-[10px] bg-orange-100 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                    </div>
                                    <div className="bg-neutral-100 rounded-[18px] rounded-bl-[6px] px-4 py-3 flex gap-1.5">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* Input Bar */}
                        <div className="px-4 pb-4 flex-shrink-0">
                            <div className="flex items-center gap-2 bg-neutral-50 border border-[#1C1207]/8 rounded-[18px] px-4 py-2.5">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask Stitch..."
                                    disabled={loading}
                                    className="flex-1 bg-transparent text-sm font-medium text-[#1C1207] placeholder:text-[#1C1207]/30 outline-none disabled:opacity-50"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={loading || !input.trim()}
                                    className="w-8 h-8 bg-orange-600 rounded-[12px] flex items-center justify-center text-white disabled:opacity-30 hover:bg-orange-700 transition-colors flex-shrink-0"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[9px] text-center text-[#1C1207]/20 font-bold uppercase tracking-widest mt-2">Powered by Gemini // NextPlate Grid</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
