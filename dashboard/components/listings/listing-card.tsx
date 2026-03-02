'use client';

import React from 'react'
import { MoreVertical, Edit2, Copy, Trash2, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface ListingCardProps {
  id: string
  image?: string
  title: string
  originalPrice: number
  salePrice: number
  quantity: number
  timeRemaining: string
  status: 'available' | 'low-stock' | 'sold-out'
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onView?: () => void
}

const statusConfig = {
  available: { label: 'Available', color: 'bg-green-100 text-green-800', icon: '🟢' },
  'low-stock': { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  'sold-out': { label: 'Sold Out', color: 'bg-red-100 text-red-800', icon: '🔴' },
}

export function ListingCard({
  id,
  image,
  title,
  originalPrice,
  salePrice,
  quantity,
  timeRemaining,
  status,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
}: ListingCardProps) {
  const config = statusConfig[status]
  const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100)

  return (
    <div className="card-base bg-white overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        {image ? (
          <img src={image || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">📸</span>
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-warm-orange text-white px-2 py-1 rounded-lg text-xs font-bold">
            -{discount}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-neutral-900 line-clamp-2 text-sm">{title}</h3>

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary-dark">${salePrice.toFixed(2)}</span>
          {originalPrice > salePrice && (
            <span className="text-sm text-neutral-500 line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
            {config.icon} {quantity} left
          </span>
        </div>

        {/* Time Remaining */}
        <div className="text-xs text-neutral-600 flex items-center gap-1">
          <span>⏰</span>
          <span>{timeRemaining}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 text-xs bg-transparent"
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
