import { AlertCircle, Clock, ShieldAlert, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

interface Alert {
  id: string
  type: 'low-stock' | 'expiring'
  title: string
  description: string
  itemName: string
  severity: 'high' | 'medium'
}

interface AlertsSectionProps {
  alerts: Alert[]
}

export function AlertsSection({ alerts }: AlertsSectionProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-4">
      {alerts.map((alert, i) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`group relative overflow-hidden bg-white/70 backdrop-blur-xl border-l-[6px] rounded-r-[32px] rounded-l-[12px] p-8 shadow-sm hover:shadow-xl transition-all duration-500 ${alert.severity === 'high'
              ? 'border-red-500 border-y border-r border-y-[#1C1207]/5 border-r-[#1C1207]/5'
              : 'border-orange-500 border-y border-r border-y-[#1C1207]/5 border-r-[#1C1207]/5'
            }`}
        >
          <div className="flex items-start gap-8 relative z-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${alert.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
              }`}>
              {alert.type === 'expiring' ? <Clock className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${alert.severity === 'high' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                  {alert.severity === 'high' ? 'Critical Protocol' : 'Optimization Required'}
                </span>
                <span className="text-[10px] font-bold text-[#1C1207]/20 uppercase tracking-widest">
                  Signal_{alert.id.slice(0, 4)}
                </span>
              </div>

              <h4 className="text-xl font-display font-black text-[#1C1207] tracking-tight leading-none">
                {alert.title}
              </h4>

              <p className="text-[#1C1207]/50 font-medium text-sm max-w-2xl">
                {alert.description}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <div className="bg-[#1C1207] text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Node: {alert.itemName}
                </div>
                {alert.severity === 'high' && (
                  <div className="flex items-center gap-2 text-red-600 font-black text-[9px] uppercase tracking-widest animate-pulse">
                    <Zap className="w-3 h-3 fill-current" />
                    Immediate Action Required
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Background Glow */}
          <div className={`absolute -right-8 -top-8 w-32 h-32 blur-[60px] opacity-10 rounded-full transition-opacity group-hover:opacity-20 ${alert.severity === 'high' ? 'bg-red-500' : 'bg-orange-500'
            }`} />
        </motion.div>
      ))}
    </div>
  )
}
