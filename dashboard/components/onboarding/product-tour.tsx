'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, MapPin, Leaf, ShoppingCart } from 'lucide-react'

const TOUR_STEPS = [
    {
        title: "Welcome to the Grid",
        description: "The NextPlate protocol matches surplus food with people in need. Here's how you can save the planet and some money.",
        icon: Sparkles,
        color: "bg-orange-500"
    },
    {
        title: "Eco-Scanning",
        description: "Look for the Carbon and H2O metrics on each item. Rescuing food prevents CO2 emissions from landfill decomposition.",
        icon: Leaf,
        color: "bg-emerald-500"
    },
    {
        title: "Local Sync",
        description: "Use the G-Sync feature to map yourself to the nearest food hub. Freshly liquidation packets are added every hour.",
        icon: MapPin,
        color: "bg-blue-500"
    },
    {
        title: "Rapid Rescue",
        description: "Found something good? Execute the rescue protocol quickly. These items have a limited liquid life before they expire.",
        icon: ShoppingCart,
        color: "bg-[#1C1207]"
    }
]

export function ProductTour() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const isDismissed = localStorage.getItem('onboarding_dismissed')
        if (!isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            dismiss()
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const dismiss = () => {
        setIsVisible(false)
        localStorage.setItem('onboarding_dismissed', 'true')
    }

    const StepIcon = TOUR_STEPS[currentStep].icon

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-6 bg-[#1C1207]/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.9 }}
                        className="w-full max-w-lg bg-[#FFF8F0] dark:bg-[#121212] rounded-[48px] shadow-2xl overflow-hidden border border-[#1C1207]/5 dark:border-white/5"
                    >
                        {/* Progress Bar */}
                        <div className="flex h-2">
                            {TOUR_STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`flex-1 transition-all duration-500 ${idx <= currentStep ? TOUR_STEPS[idx].color : 'bg-neutral-200 dark:bg-neutral-800'}`}
                                />
                            ))}
                        </div>

                        <div className="p-10 md:p-14 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className={`w-16 h-16 ${TOUR_STEPS[currentStep].color} rounded-3xl flex items-center justify-center text-white shadow-xl rotate-3`}>
                                    <StepIcon className="w-8 h-8" />
                                </div>
                                <button
                                    onClick={dismiss}
                                    className="p-3 text-[#1C1207]/20 hover:text-[#1C1207] dark:hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-[#1C1207] dark:text-white uppercase tracking-tighter leading-none">
                                    {TOUR_STEPS[currentStep].title}
                                </h2>
                                <p className="text-[#1C1207]/60 dark:text-white/60 font-medium text-lg leading-relaxed">
                                    {TOUR_STEPS[currentStep].description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-6">
                                <div className="flex gap-2">
                                    {currentStep > 0 && (
                                        <button
                                            onClick={handlePrev}
                                            className="p-4 bg-white dark:bg-white/5 border border-[#1C1207]/5 dark:border-white/5 rounded-2xl text-[#1C1207] dark:text-white hover:scale-105 transition-all"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={handleNext}
                                    className={`flex items-center gap-3 px-8 py-5 ${TOUR_STEPS[currentStep].color} text-white rounded-[24px] font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10`}
                                >
                                    {currentStep === TOUR_STEPS.length - 1 ? "Start Rescuing" : "Learn More"}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
