'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { ListingCard } from '@/components/listings/listing-card'
import { restaurantService } from '@/lib/restaurant-service'
import { Plus, Search, Loader2, Heart, HeartOff } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

export default function ManageListingsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [donatingId, setDonatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const res = await restaurantService.getMenuItems()
      if (res.success) {
        setItems(res.items)
      } else {
        setError(res.message || 'Failed to sync internal grid items')
      }
    } catch (err) {
      setError('Grid synchronization failure: Physical packets offline.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleToggleDonation = async (item: any) => {
    setDonatingId(item._id)
    try {
      if (item.isDonationEligible) {
        const res = await restaurantService.unmarkDonation(item._id)
        if (res.success) {
          toast({ title: 'Donation Revoked', description: `${item.name} removed from NGO pool.` })
          setItems(prev => prev.map(i => i._id === item._id ? { ...i, isDonationEligible: false } : i))
        } else {
          toast({ title: 'Error', description: res.message, variant: 'destructive' })
        }
      } else {
        const res = await restaurantService.markForDonation(item._id)
        if (res.success) {
          toast({ title: '🍽️ Donated to NGO Grid', description: res.message })
          setItems(prev => prev.map(i => i._id === item._id ? { ...i, isDonationEligible: true } : i))
        } else {
          toast({ title: 'Error', description: res.message, variant: 'destructive' })
        }
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Network failure', variant: 'destructive' })
    } finally {
      setDonatingId(null)
    }
  }

  const filteredListings = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())

    let currentStatus = 'available'
    if (item.availableQuantity === 0) currentStatus = 'sold-out'
    else if (item.availableQuantity <= 5) currentStatus = 'low-stock'

    const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  // Sort logic
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price-low') return a.discountedPrice - b.discountedPrice
    if (sortBy === 'price-high') return b.discountedPrice - a.discountedPrice
    if (sortBy === 'discount') {
      const d1 = ((a.originalPrice - a.discountedPrice) / a.originalPrice)
      const d2 = ((b.originalPrice - b.discountedPrice) / b.originalPrice)
      return d2 - d1
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const donationCount = items.filter(i => i.isDonationEligible).length

  return (
    <AppLayout>
      <div className="space-y-12 pb-32">
        {/* Protocol Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
              <Plus className="w-3" />
              Active Signal Stream
            </div>
            <h1 className="text-6xl font-display font-black text-[#1C1207] tracking-tighter leading-none uppercase">Surplus Units</h1>
            <p className="text-[#1C1207]/50 font-medium max-w-xl text-lg">
              Monitoring <span className="text-[#1C1207]">{items.length} total nodes</span>. Manage your real-time liquidation status and surplus distribution.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {donationCount > 0 && (
              <div className="px-6 py-3 bg-pink-50 border border-pink-200 rounded-2xl flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-600 fill-pink-600" />
                <span className="text-[10px] font-black text-pink-700 uppercase tracking-widest">{donationCount} For NGO</span>
              </div>
            )}
            <Link href="/add-item">
              <button className="px-10 py-5 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-600 hover:scale-105 transition-all shadow-2xl flex items-center gap-3 active:scale-95">
                <Plus className="w-4 h-4" />
                Emit New Signal
              </button>
            </Link>
          </div>
        </div>

        {/* End-of-Day CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200/50 rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-pink-600 rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-pink-600/20">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-display font-black text-[#1C1207] tracking-tight">END-OF-DAY RESCUE</h3>
              <p className="text-sm font-medium text-[#1C1207]/50 max-w-lg">
                Got leftover food? Mark unsold items for <strong>Free NGO Pickup</strong> below. NGOs will be auto-notified via email. Zero waste, maximum impact.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black text-pink-700 bg-pink-100 px-6 py-3 rounded-2xl uppercase tracking-widest border border-pink-200">
            {donationCount} items donated today
          </div>
        </motion.div>

        {/* Grid Analytics & Filtering */}
        <div className="bg-white/70 backdrop-blur-2xl border border-[#1C1207]/5 rounded-[40px] p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Search Node */}
            <div className="lg:col-span-2 space-y-3">
              <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em] ml-2">Grid Search</label>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1C1207]/20 group-focus-within:text-orange-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Locate packet by identifier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white border border-[#1C1207]/5 rounded-[22px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600/20 transition-all outline-none"
                />
              </div>
            </div>

            {/* Status Sensor */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em] ml-2">Status Sensor</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-[62px] rounded-[22px] border-[#1C1207]/5 bg-white px-6 font-black text-[#1C1207] text-[11px] uppercase tracking-widest focus:ring-orange-600/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[22px] border-[#1C1207]/5 bg-white/90 backdrop-blur-3xl p-2">
                  <SelectItem value="all" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">Global Stream</SelectItem>
                  <SelectItem value="available" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 text-emerald-600">Active_Live</SelectItem>
                  <SelectItem value="low-stock" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 text-orange-600">Critical_Low</SelectItem>
                  <SelectItem value="sold-out" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 text-red-600">Liquidated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Logic */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em] ml-2">Sort Logic</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-[62px] rounded-[22px] border-[#1C1207]/5 bg-white px-6 font-black text-[#1C1207] text-[11px] uppercase tracking-widest focus:ring-orange-600/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[22px] border-[#1C1207]/5 bg-white/90 backdrop-blur-3xl p-2">
                  <SelectItem value="recent" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">Temporal</SelectItem>
                  <SelectItem value="price-low" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">Cost_Min</SelectItem>
                  <SelectItem value="price-high" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">Cost_Max</SelectItem>
                  <SelectItem value="discount" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">Impact_Ratio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Node Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[3/4] bg-white rounded-[56px] flex items-center justify-center border border-[#1C1207]/5">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-40 bg-red-50/50 border border-red-100/50 rounded-[48px] text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto grayscale opacity-50 text-3xl">📡</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-black text-red-500 uppercase tracking-tight">Signal Loss</h3>
              <p className="text-red-600/60 font-medium">{error}</p>
            </div>
            <button onClick={fetchItems} className="px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Reconnect Stream</button>
          </div>
        ) : sortedListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {sortedListings.map((item, idx) => {
              let listingStatus: 'available' | 'low-stock' | 'sold-out' = 'available'
              if (item.availableQuantity === 0) listingStatus = 'sold-out'
              else if (item.availableQuantity <= 5) listingStatus = 'low-stock'

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.8 }}
                  key={item._id}
                  className="relative"
                >
                  {/* Donation Badge */}
                  {item.isDonationEligible && (
                    <div className="absolute top-6 right-6 z-20 px-4 py-2 bg-pink-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                      <Heart className="w-3 h-3 fill-white" />
                      NGO Donated
                    </div>
                  )}

                  <ListingCard
                    id={item._id}
                    title={item.name}
                    image={item.imageUrl || item.images?.[0]}
                    originalPrice={item.originalPrice}
                    salePrice={item.discountedPrice}
                    quantity={item.availableQuantity}
                    timeRemaining={item.expiryTime ? new Date(item.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Infinitum'}
                    status={listingStatus}
                    onEdit={() => console.log('Edit', item._id)}
                    onDuplicate={() => console.log('Duplicate', item._id)}
                    onDelete={() => console.log('Delete', item._id)}
                    onView={() => console.log('View', item._id)}
                  />

                  {/* Donate / Undonate Button */}
                  {item.availableQuantity > 0 && (
                    <button
                      onClick={() => handleToggleDonation(item)}
                      disabled={donatingId === item._id}
                      className={`w-full mt-3 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 ${item.isDonationEligible
                        ? 'bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                    >
                      {donatingId === item._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : item.isDonationEligible ? (
                        <>
                          <HeartOff className="w-4 h-4" />
                          Revoke NGO Donation
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4" />
                          Mark for NGO ($0 Pickup)
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="py-40 bg-white border border-[#1C1207]/5 rounded-[56px] text-center space-y-8">
            <div className="w-24 h-24 bg-[#1C1207]/5 rounded-[40px] flex items-center justify-center mx-auto grayscale opacity-20 text-4xl">🥗</div>
            <div className="space-y-2">
              <h3 className="text-3xl font-display font-black text-[#1C1207]/20 uppercase tracking-tight leading-none">Zero Surplus Detected</h3>
              <p className="text-[#1C1207]/10 font-black text-xs uppercase tracking-[0.4em]">Nodes functioning at 100% capacity.</p>
            </div>
            <Link href="/add-item">
              <button className="px-12 py-5 bg-[#1C1207] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl">Emit New Signal</button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
