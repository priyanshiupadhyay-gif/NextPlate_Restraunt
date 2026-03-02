'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Heart, Globe, ArrowRight } from 'lucide-react';

export default function ThankYouPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full" />

            <div className="container mx-auto px-6 relative z-10 text-center">
                {/* Visual Asset */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-12 relative"
                >
                    <div className="w-full max-w-2xl mx-auto rounded-[48px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 relative group">
                        <img
                            src="/thanks-visual.png"
                            alt="NextPlate Social Impact"
                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-[4000ms]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Floating Badges */}
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-10 -right-10 px-8 py-4 bg-emerald-500 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center gap-3"
                    >
                        <Leaf className="w-4 h-4" />
                        Zero Waste Champion
                    </motion.div>
                </motion.div>

                {/* Text Content */}
                <div className="max-w-4xl mx-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h1 className="text-8xl md:text-9xl font-black uppercase tracking-tighter leading-none m-0">
                            THANK <span className="text-orange-600">YOU</span>
                        </h1>
                        <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-sm">
                            Mission Accomplished. Zero Hunger, Zero Waste.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-12 pt-12"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-orange-500 border border-white/10 ring-8 ring-white/5">
                                <Heart className="w-8 h-8 fill-current" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Humanity Served</span>
                        </div>

                        <div className="w-px h-12 bg-white/10 hidden md:block" />

                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-emerald-500 border border-white/10 ring-8 ring-white/5">
                                <Globe className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Planetary Impact</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="pt-16"
                    >
                        <button className="px-12 py-6 bg-white text-black rounded-full font-black uppercase tracking-[0.3em] text-xs hover:bg-orange-600 hover:text-white transition-all flex items-center gap-4 mx-auto group">
                            Join the mission
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Logo Watermark */}
            <div className="absolute top-12 left-12 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black italic">NP</div>
                <span className="font-black uppercase tracking-[0.3em] text-sm">NextPlate</span>
            </div>

            {/* Copyright */}
            <div className="absolute bottom-12 text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em]">
                &copy; 2026 NextPlate Rescue Engine. Built for Impact.
            </div>
        </div>
    );
}
