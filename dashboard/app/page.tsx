'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/auth-context'
import { impactService, ImpactStats } from '@/lib/impact-service'
import { ChevronRight, Leaf, Package, ShieldCheck, Heart, ArrowRight, Zap, Globe, Droplets, Soup } from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────
   NEXTPLATE — AESTHETIC MAXIMIZED LANDING
   Phase 1: Cinematic Onboarding & Rescue Architecture
   ────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const router = useRouter()
  const { mockLogin } = useAuth()

  // Redirect to the cinematic story page
  useEffect(() => {
    window.location.href = '/story.html'
  }, [])

  const [stats, setStats] = useState<ImpactStats | null>(null)

  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Stitch AI Narration State
  const [activeChapter, setActiveChapter] = useState(0)
  const [isStitchOpen, setIsStitchOpen] = useState(true)

  const handleDemoLogin = (role: 'admin' | 'restaurant' | 'ngo', href: string) => {
    mockLogin(role)
    router.push(href)
  }

  useEffect(() => {
    const fetchStats = async () => {
      const res = await impactService.getGlobalImpact()
      if (res.success && res.data) setStats(res.data)
    }
    fetchStats()
  }, [])

  // Chapters for Stitch AI
  const chapters = [
    { title: "THE REALITY", text: "Every night, India's kitchens grow heavy. Millions of portions of perfectly edible food are thrown away." },
    { title: "THE PROTOCOL", text: "NextPlate creates a resilient mesh network between those who have surplus and those who need it." },
    { title: "THE IMPACT", text: "Every rescued plate is a win for the climate. We track carbon using WRAP methodology national standards." },
    { title: "YOUR ROLE", text: "Whether you're a rescuer, a provider, or an NGO — you have a node on the national grid." }
  ]

  // Track scroll for chapters
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest < 0.25) setActiveChapter(0)
      else if (latest < 0.5) setActiveChapter(1)
      else if (latest < 0.75) setActiveChapter(2)
      else setActiveChapter(3)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  return (
    <div ref={containerRef} className="relative bg-[#FFF8F0] min-h-[500vh] overflow-x-hidden selection:bg-orange-200">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&family=DM+Sans:wght@400;500;700&family=Courier+Prime&display=swap');
        
        :root {
          --orange-fire: #FF6B2B;
          --orange-warm: #FF9A3C;
          --green-leaf: #2D9B5A;
          --cream: #FFF8F0;
          --dark-earth: #1C1207;
        }

        body {
          background-color: var(--cream);
          font-family: 'DM Sans', sans-serif;
        }

        h1, h2, h3 {
          font-family: 'Fraunces', serif;
        }

        .stitch-mono {
          font-family: 'Courier Prime', monospace;
        }
      `}</style>

      {/* ═══ GRAIN OVERLAY ═══ */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ═══ NAVIGATION ═══ */}
      <nav className="fixed top-0 w-full z-50 mix-blend-difference py-4 md:py-6 px-6 md:px-10 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
            <Soup className="w-5 h-5" />
          </div>
          <span className="text-lg md:text-xl font-black tracking-tighter uppercase">NextPlate</span>
        </div>
        <div className="flex items-center gap-4 md:gap-8 text-xs md:text-sm font-bold uppercase tracking-widest">
          <Link href="/login" className="hover:text-orange-400 transition-colors">Login</Link>
          <Link href="/register" className="bg-white text-black px-4 md:px-6 py-2 rounded-full hover:bg-orange-500 hover:text-white transition-all">Join Grid</Link>
        </div>
      </nav>

      {/* ═══ STITCH AI COMPONENT ═══ */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence mode="wait">
          {isStitchOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="bg-[#1C1207] text-white p-6 rounded-[32px] rounded-br-[4px] border border-white/10 shadow-2xl max-w-xs pointer-events-auto"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400 mb-2 stitch-mono">Stitch AI // {chapters[activeChapter].title}</p>
              <p className="text-sm font-medium leading-relaxed stitch-mono">{chapters[activeChapter].text}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsStitchOpen(!isStitchOpen)}
          className="w-16 h-16 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/30 cursor-pointer pointer-events-auto group"
        >
          <Soup className="text-white w-8 h-8 group-hover:rotate-12 transition-transform" />
          <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20" />
        </button>
      </div>

      {/* ═══ HERO SECTION ═══ */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-4 md:px-6 relative sticky top-0">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-orange-500 font-bold tracking-[0.5em] uppercase mb-8"
        >
          Sudo Make World // MindCode 2026
        </motion.p>
        <motion.h1
          className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-[#1C1207] tracking-tight leading-[0.85] mb-6 md:mb-8"
        >
          Every Night,<br />
          <span className="text-orange-600 italic">India</span> Grows<br />
          <span className="relative">
            Heavy.
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="absolute bottom-4 left-0 w-full h-8 bg-orange-200/50 -z-10 origin-left"
            />
          </span>
        </motion.h1>
        <motion.p className="text-base md:text-xl text-neutral-500 max-w-2xl leading-relaxed mb-8 md:mb-12 px-4">
          Thousands of restaurants and kitchens across our cities throw away perfectly good meals every night. We built the protocol to stop that.
        </motion.p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 px-4">
          <Link href="/feed" className="px-10 py-5 bg-orange-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-500/20 hover:bg-orange-700 transition-all hover:-translate-y-1">
            Start Rescuing
          </Link>
          <Link href="/live-map" className="px-10 py-5 bg-[#1C1207] text-white rounded-full font-black text-sm uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-3">
            <Globe className="w-5 h-5 text-cyan-400" />
            Live Map
          </Link>
          <Link href="/community" className="px-10 py-5 bg-emerald-600 text-white rounded-full font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-2xl shadow-emerald-500/20">
            <Heart className="w-5 h-5" />
            Feed the Grid
          </Link>
        </div>
      </section>

      {/* ═══ THE MESH REVEAL (Section 2) ═══ */}
      <section className="min-h-screen bg-[#1C1207] relative flex items-center justify-center overflow-hidden z-10 rounded-[32px] md:rounded-[64px] py-16 md:py-0">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
              The <span className="text-orange-500 italic">Coordination</span> Problem.
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Every night, India's kitchens grow heavy. Millions of portions of perfectly edible food are thrown away. NextPlate is the digital bridge between national surplus and community kitchens.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div className="space-y-2">
                <p className="text-orange-500 font-black text-4xl">40%</p>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Global Food Waste</p>
              </div>
              <div className="space-y-2">
                <p className="text-orange-500 font-black text-4xl">828M</p>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">People Hunger-Struck</p>
              </div>
            </div>
          </div>
          <div className="relative aspect-square bg-gradient-to-br from-orange-500/10 to-green-500/10 rounded-full flex items-center justify-center border border-white/5 hidden md:flex">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-10 relative z-10 p-20">
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_20px_rgba(255,107,43,0.5)]"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THREE NODES (Section 3) ═══ */}
      <section className="h-[150vh] flex items-center justify-center py-40">
        <div className="max-w-7xl mx-auto px-10 text-center">
          <h2 className="text-6xl md:text-8xl font-black text-[#1C1207] tracking-tighter mb-24">
            One Grid. <span className="text-green-600 italic">Three Nodes.</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
            {/* Restaurant Node */}
            <div className="bg-white border border-neutral-100 p-10 rounded-[48px] shadow-sm hover:shadow-2xl transition-all hover:-translate-y-4 group">
              <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-3xl mb-10 group-hover:scale-110 transition-transform">🏪</div>
              <h3 className="text-3xl font-black text-[#1C1207] mb-4">Restaurants</h3>
              <p className="text-neutral-500 leading-relaxed mb-8">List surplus in 60 seconds. Every rescue builds your Green Restaurant Badge.</p>
              <button
                onClick={() => handleDemoLogin('restaurant', '/restaurant')}
                className="w-full py-4 bg-[#F8F9FA] rounded-2xl font-black text-xs uppercase tracking-widest border border-neutral-100 hover:bg-orange-500 hover:text-white transition-all"
              >
                Enter Node
              </button>
            </div>

            {/* NGO Node */}
            <div className="bg-[#1C1207] text-white p-10 rounded-[48px] shadow-2xl hover:-translate-y-4 transition-all">
              <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center text-3xl mb-10">🤝</div>
              <h3 className="text-3xl font-black mb-4">NGOs</h3>
              <p className="text-neutral-400 leading-relaxed mb-8">Verified Root Access lets you claim surplus at $0 to power community kitchens.</p>
              <button
                onClick={() => handleDemoLogin('ngo', '/ngo')}
                className="w-full py-4 bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-green-600 hover:border-green-600 transition-all"
              >
                Access Root
              </button>
            </div>

            {/* Rescuer Node */}
            <div className="bg-white border border-neutral-100 p-10 rounded-[48px] shadow-sm hover:shadow-2xl transition-all hover:-translate-y-4 group">
              <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center text-3xl mb-10 group-hover:scale-110 transition-transform">👤</div>
              <h3 className="text-3xl font-black text-[#1C1207] mb-4">Customers</h3>
              <p className="text-neutral-500 leading-relaxed mb-8">Buy perfectly good meals at 40-70% discount. Eat well, save the city.</p>
              <Link href="/feed" className="w-full py-4 flex items-center justify-center bg-[#F8F9FA] rounded-2xl font-black text-xs uppercase tracking-widest border border-neutral-100 hover:bg-orange-500 hover:text-white transition-all">
                Browse Feed
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE CO2 LEDGER (Section 4) ═══ */}
      <section className="h-screen bg-green-600 flex items-center justify-center rounded-[64px] mx-6">
        <div className="text-center text-white space-y-12">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/20 rounded-full font-bold uppercase tracking-widest text-xs">
            <Globe className="w-4 h-4" />
            WRAP CERTIFIED IMPACT
          </div>
          <h2 className="text-6xl md:text-9xl font-black tracking-tighter">
            Proof of <span className="text-green-300 italic">Rescue.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-20">
            <div className="space-y-2">
              <p className="text-7xl md:text-8xl font-black tracking-tighter">{stats?.totalMealsRescued || '12,847'}</p>
              <p className="text-green-200 font-bold uppercase tracking-[0.3em] text-xs">Meals Recovered</p>
            </div>
            <div className="space-y-2">
              <p className="text-7xl md:text-8xl font-black tracking-tighter">{stats?.totalCO2Saved || '4,203'}kg</p>
              <p className="text-green-200 font-bold uppercase tracking-[0.3em] text-xs">CO2 Avoided</p>
            </div>
            <div className="space-y-2">
              <p className="text-7xl md:text-8xl font-black tracking-tighter">12.4M</p>
              <p className="text-green-200 font-bold uppercase tracking-[0.3em] text-xs">Liters of Water</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER CTA ═══ */}
      <section className="h-[80vh] flex items-center justify-center bg-[#FFF8F0]">
        <div className="text-center space-y-12 max-w-4xl mx-auto px-6">
          <Heart className="w-16 h-16 text-orange-500 mx-auto animate-bounce" />
          <h2 className="text-5xl md:text-8xl font-black text-[#1C1207] tracking-tighter leading-tight">
            Ready to join the <span className="text-orange-600 block">National Grid?</span>
          </h2>
          <p className="text-xl text-neutral-500 font-medium">
            Sustainable food systems aren't built in boardrooms. They're built in our neighborhoods and local kitchens, one meal at a time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register" className="px-12 py-6 bg-orange-600 text-white rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all">
              Create Account
            </Link>
            <button
              onClick={() => handleDemoLogin('admin', '/admin')}
              className="px-8 py-6 bg-transparent text-[#1C1207] font-black text-sm uppercase tracking-[0.2em] border-2 border-[#1C1207] rounded-full hover:bg-[#1C1207] hover:text-white transition-all"
            >
              Admin Oversight
            </button>
          </div>
          <div className="pt-20 opacity-30 flex items-center justify-center gap-4">
            <div className="h-px w-20 bg-neutral-900" />
            <p className="text-[10px] font-bold uppercase tracking-[0.5em]">System Node #NP-001</p>
            <div className="h-px w-20 bg-neutral-900" />
          </div>
        </div>
      </section>

    </div>
  )
}
