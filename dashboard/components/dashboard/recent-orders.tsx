import React from 'react'
import { Badge } from '@/components/ui/badge'

interface Order {
  id: string
  realId: string
  customer: string
  items: number
  total: number
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'confirmed' | 'cancelled'
  time: string
}

interface RecentOrdersProps {
  orders: Order[]
  onUpdateStatus?: (orderId: string, status: string) => void
}

const statusConfig = {
  new: { label: 'New', className: 'bg-orange-100 text-orange-900 border-orange-200' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  preparing: { label: 'Preparing', className: 'bg-blue-100 text-blue-900 border-blue-200' },
  ready: { label: 'Ready', className: 'bg-purple-100 text-purple-900 border-purple-200' },
  completed: { label: 'Completed', className: 'bg-neutral-100 text-neutral-900 border-neutral-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-900 border-red-200' },
}

export function RecentOrders({ orders, onUpdateStatus }: RecentOrdersProps) {
  return (
    <div className="bg-white border border-[#1C1207]/5 rounded-[48px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1C1207]/5 bg-[#1C1207]/[0.02]">
              <th className="text-left py-6 px-8 text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">Packet_ID</th>
              <th className="text-left py-6 px-8 text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">Customer_Node</th>
              <th className="text-center py-6 px-8 text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">Units</th>
              <th className="text-right py-6 px-8 text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">Value_USD</th>
              <th className="text-left py-6 px-8 text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">Status_Code</th>
              <th className="text-right py-6 px-8 text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">Timestamp</th>
              <th className="text-right py-6 px-8 text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C1207]/5">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || statusConfig.new
              return (
                <tr key={order.realId} className="hover:bg-[#1C1207]/[0.01] transition-colors group">
                  <td className="py-6 px-8 text-xs font-black text-[#1C1207] tracking-tight">{order.id}</td>
                  <td className="py-6 px-8">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1C1207]">{order.customer}</span>
                      <span className="text-[10px] font-medium text-[#1C1207]/40 uppercase tracking-widest">Authenticated Node</span>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-center text-xs font-bold text-[#1C1207]/60">{order.items}</td>
                  <td className="py-6 px-8 text-right">
                    <span className="text-sm font-black text-[#1C1207]">${order.total.toLocaleString()}</span>
                  </td>
                  <td className="py-6 px-8">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusInfo.className}`}>
                      <div className={`w-1 h-1 rounded-full mr-1.5 animate-pulse ${order.status === 'new' ? 'bg-orange-600' : 'bg-current'}`} />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-right text-[10px] font-bold text-[#1C1207]/40 uppercase tracking-widest">{order.time}</td>
                  <td className="py-6 px-8 text-right">
                    {order.status === 'new' && onUpdateStatus && (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onUpdateStatus(order.realId, 'confirmed')}
                          className="px-4 py-1.5 bg-[#1C1207] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-900/10"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onUpdateStatus(order.realId, 'cancelled')}
                          className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {(order.status === 'confirmed' || order.status === 'preparing') && onUpdateStatus && (
                      <button
                        onClick={() => onUpdateStatus(order.realId, order.status === 'confirmed' ? 'preparing' : 'ready')}
                        className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {order.status === 'confirmed' ? 'Start Prep' : 'Mark Ready'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
