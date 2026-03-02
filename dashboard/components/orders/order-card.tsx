'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Clock, Eye } from 'lucide-react'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderCardProps {
  id: string
  customerName: string
  items: OrderItem[]
  total: number
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  pickupTime: string
  timeRemaining?: string
  onAccept?: () => void
  onReject?: () => void
  onMarkReady?: () => void
  onViewDetails?: () => void
}

const statusConfig = {
  placed: { label: 'Order Placed', icon: '🆕', color: 'bg-red-50 border-red-200' },
  confirmed: { label: 'Confirmed', icon: '👍', color: 'bg-blue-50 border-blue-200' },
  preparing: { label: 'Preparing', icon: '🔵', color: 'bg-yellow-50 border-yellow-200' },
  ready: { label: 'Ready', icon: '✅', color: 'bg-green-50 border-green-200' },
  completed: { label: 'Completed', icon: '✔️', color: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', icon: '❌', color: 'bg-neutral-50 border-neutral-200' },
}

export function OrderCard({
  id,
  customerName,
  items,
  total,
  status,
  pickupTime,
  timeRemaining,
  onAccept,
  onReject,
  onPrepare,
  onMarkReady,
  onViewDetails,
}: OrderCardProps & { onPrepare?: () => void }) {
  const config = statusConfig[status]

  return (
    <div className={`border-l-4 border-primary-dark ${config.color} p-4 rounded-lg space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{config.icon}</span>
            <span className="font-mono text-sm font-semibold text-neutral-900">{id}</span>
            <span className="text-xs text-neutral-600">Just now</span>
          </div>
          <p className="text-sm text-neutral-700">
            <span className="font-semibold">Customer:</span> {customerName}
          </p>
        </div>
        <span className="text-xs font-semibold text-neutral-600 bg-white px-2 py-1 rounded">
          {config.label}
        </span>
      </div>

      {/* Items */}
      <div className="bg-white bg-opacity-50 p-3 rounded text-sm space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-neutral-700">
            <span>
              {item.quantity}× {item.name}
            </span>
            <span>${item.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-neutral-200 pt-1 mt-1 font-semibold text-neutral-900 flex justify-between">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Pickup Time */}
      <div className="flex items-center gap-2 text-sm text-neutral-700">
        <Clock className="w-4 h-4" />
        <span>
          Pickup: <span className="font-semibold">{pickupTime}</span>
          {timeRemaining && <span className="text-neutral-600 ml-2">({timeRemaining})</span>}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {status === 'placed' && (
          <>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={onAccept}
            >
              <Check className="w-3 h-3 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-100 hover:bg-red-50"
              onClick={onReject}
            >
              <X className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </>
        )}
        {status === 'confirmed' && (
          <>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onPrepare}
            >
              <Clock className="w-3 h-3 mr-1" />
              Start Preparing
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-neutral-500 border-neutral-200 hover:bg-neutral-50"
              onClick={onReject}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel Order
            </Button>
          </>
        )}
        {status === 'preparing' && (
          <>
            <Button
              size="sm"
              className="bg-primary-dark hover:bg-primary-medium text-white"
              onClick={onMarkReady}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark as Ready
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-neutral-500 border-neutral-200 hover:bg-neutral-50"
              onClick={onReject}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel Order
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onViewDetails}
        >
          <Eye className="w-3 h-3 mr-1" />
          View Details
        </Button>
      </div>
    </div>
  )
}
