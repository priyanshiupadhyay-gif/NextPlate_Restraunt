import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'info'
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
}: StatCardProps) {
  const variantGlows = {
    default: '#EA580C',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  }

  const iconBase = {
    default: 'bg-orange-50 text-orange-600 border-orange-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    info: 'bg-sky-50 text-sky-600 border-sky-100',
  }

  const isPositiveChange = change !== undefined && change >= 0

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
      className="relative group overflow-hidden bg-white/70 backdrop-blur-3x border border-[#1C1207]/5 rounded-[40px] p-10 shadow-sm hover:shadow-2xl hover:shadow-[#1C1207]/5 transition-all duration-700"
    >
      {/* Background Micro-Decoration */}
      <div
        className="absolute top-0 right-0 w-40 h-40 -mr-20 -mt-20 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity blur-[80px]"
        style={{ background: variantGlows[variant] }}
      />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.4em] leading-none mb-1">{title}</p>
          {icon && (
            <div className={`${iconBase[variant]} w-14 h-14 rounded-[22px] border flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-700`}>
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <p className="text-5xl font-display font-black text-[#1C1207] tracking-tighter leading-none">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black ${isPositiveChange ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {isPositiveChange ? <TrendingUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(change)}%
              </div>
            )}
          </div>

          {changeLabel && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: variantGlows[variant] }} />
              <p className="text-[10px] font-black text-[#1C1207]/20 uppercase tracking-widest leading-none">
                {changeLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Accent Loader Decor */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-[#1C1207]/5 overflow-hidden">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="w-1/3 h-full bg-gradient-to-r from-transparent via-[#1C1207]/10 to-transparent"
        />
      </div>
    </motion.div>
  )
}
