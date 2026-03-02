'use client'

import React, { useState, useMemo } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { ImageUpload } from '@/components/forms/image-upload'
import { restaurantService } from '@/lib/restaurant-service'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ChevronLeft, Loader2, Leaf, Timer, AlertCircle, Zap, Clock, Camera, Package, Droplets, Info, Sparkles, HeartHandshake, Globe, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Categories synced with backend MenuItem schema
const CATEGORIES = [
  { label: 'Appetizers', value: 'appetizers' },
  { label: 'Mains', value: 'mains' },
  { label: 'Desserts', value: 'desserts' },
  { label: 'Beverages', value: 'beverages' },
  { label: 'Breads', value: 'breads' },
  { label: 'Rice', value: 'rice' },
  { label: 'Combos', value: 'combos' },
  { label: 'Snacks', value: 'snacks' },
  { label: 'Bakery', value: 'bakery' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Produce', value: 'produce' },
  { label: 'Meat & Seafood', value: 'meat_seafood' },
  { label: 'Prepared Meals', value: 'prepared_meals' },
  { label: 'Sides', value: 'sides' },
  { label: 'Other', value: 'other' },
]

const DIETARY_TAGS = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Low-Calorie',
  'Organic',
  'Spicy',
  'Fresh',
  'Ready-to-eat',
]

const ALLERGENS = [
  { label: 'Peanuts', value: 'peanuts' },
  { label: 'Tree Nuts', value: 'tree_nuts' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Eggs', value: 'eggs' },
  { label: 'Wheat/Gluten', value: 'wheat_gluten' },
  { label: 'Soy', value: 'soy' },
  { label: 'Shellfish', value: 'shellfish' },
  { label: 'Fish', value: 'fish' },
]

const UNITS = ['Items', 'kg', 'lbs', 'Liters', 'Portions']

// ─── WRAP Methodology Carbon Factors (kg CO2e per kg of food) ───
// Source: WRAP (Waste & Resources Action Programme) — UK Government standard
const WRAP_CARBON_FACTORS: Record<string, { co2PerKg: number; waterPerKg: number; label: string }> = {
  meat_seafood: { co2PerKg: 27.0, waterPerKg: 15400, label: 'Meat & Seafood' },
  dairy: { co2PerKg: 3.2, waterPerKg: 1020, label: 'Dairy' },
  bakery: { co2PerKg: 0.9, waterPerKg: 1608, label: 'Bakery' },
  breads: { co2PerKg: 0.9, waterPerKg: 1608, label: 'Breads' },
  rice: { co2PerKg: 2.7, waterPerKg: 2500, label: 'Rice' },
  produce: { co2PerKg: 0.5, waterPerKg: 322, label: 'Produce' },
  appetizers: { co2PerKg: 1.5, waterPerKg: 1000, label: 'Appetizers' },
  mains: { co2PerKg: 3.5, waterPerKg: 1500, label: 'Mains' },
  desserts: { co2PerKg: 1.8, waterPerKg: 1200, label: 'Desserts' },
  beverages: { co2PerKg: 0.3, waterPerKg: 200, label: 'Beverages' },
  combos: { co2PerKg: 3.0, waterPerKg: 1400, label: 'Combos' },
  snacks: { co2PerKg: 1.2, waterPerKg: 900, label: 'Snacks' },
  prepared_meals: { co2PerKg: 3.0, waterPerKg: 1400, label: 'Prepared Meals' },
  sides: { co2PerKg: 1.0, waterPerKg: 800, label: 'Sides' },
  other: { co2PerKg: 1.5, waterPerKg: 1000, label: 'Other' },
}

// Generate default "expected ready time" = +2 hours from now
const getDefaultReadyTime = () => {
  const now = new Date()
  now.setHours(now.getHours() + 2)
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

const getDefaultPickupFrom = () => {
  const now = new Date()
  now.setHours(now.getHours() + 2)
  const h = String(now.getHours()).padStart(2, '0')
  return `${h}:00`
}

const getDefaultPickupTo = () => {
  const now = new Date()
  now.setHours(now.getHours() + 4)
  const h = String(now.getHours()).padStart(2, '0')
  return `${h}:00`
}

export default function AddItemPage() {
  const [isQuickMode, setIsQuickMode] = useState(false)
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    description: '',
    originalPrice: '',
    salePrice: '',
    quantity: '',
    unit: 'Items',
    expectedReadyTime: getDefaultReadyTime(),
    pickupFromTime: getDefaultPickupFrom(),
    pickupToTime: getDefaultPickupTo(),
    autoExpire: true,
    notes: '',
  })

  const [images, setImages] = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Listing type - who is this item for
  const [listingType, setListingType] = useState<'ngo_only' | 'user_only' | 'both'>('both')
  const [ngoPrice, setNgoPrice] = useState('')

  const originalPrice = parseFloat(formData.originalPrice) || 0
  const salePrice = parseFloat(formData.salePrice) || 0
  const discount = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0

  const wrapFactor = WRAP_CARBON_FACTORS[formData.category] || WRAP_CARBON_FACTORS.other
  const quantityNum = parseInt(formData.quantity) || 0
  const estimatedWeightKg = quantityNum * 0.4
  const carbonSaved = (estimatedWeightKg * wrapFactor.co2PerKg).toFixed(1)
  const waterSaved = Math.round(estimatedWeightKg * wrapFactor.waterPerKg)
  const waterSavedFormatted = waterSaved >= 1000 ? `${(waterSaved / 1000).toFixed(1)}k` : String(waterSaved)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleAllergenToggle = (allergenValue: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergenValue) ? prev.filter((a) => a !== allergenValue) : [...prev, allergenValue]
    )
  }

  const handleAnalyzeImage = async () => {
    if (images.length === 0) {
      toast.error('Visual Input Required', { description: 'Please upload at least one image first.' })
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      const formDataObj = new FormData()
      formDataObj.append('image', images[0])

      const res = await api.post('/ai/analyze-image', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success) {
        const { name, description, category, isVegetarian, allergens, suggestedPrice, carbonScore } = res.data.data

        setFormData(prev => ({
          ...prev,
          itemName: name || prev.itemName,
          description: description || prev.description,
          category: category || prev.category,
          salePrice: suggestedPrice ? String(suggestedPrice) : prev.salePrice,
          originalPrice: suggestedPrice ? String(Math.round(suggestedPrice * 1.5)) : prev.originalPrice
        }))

        if (isVegetarian) {
          setSelectedTags(prev => Array.from(new Set([...prev, 'Vegetarian'])))
        }

        if (allergens && Array.isArray(allergens)) {
          setSelectedAllergens(Array.from(new Set([...allergens])))
        }

        toast.success('Stitch Vision Synced', {
          description: `Identified: ${name}. Parameters modulated.`
        })
      }
    } catch (err: any) {
      setError('Stitch Vision node failure: ' + (err.response?.data?.message || 'Signal interrupted'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = []
    for (const file of files) {
      const formDataObj = new FormData()
      formDataObj.append('image', file)
      try {
        const response = await api.post('/upload/image', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (response.data.success && response.data.data?.url) {
          urls.push(response.data.data.url)
        }
      } catch (err) {
        console.error('Image upload failed:', err)
      }
    }
    return urls
  }

  const buildExpiryDate = (timeStr: string): string | undefined => {
    if (!timeStr) return undefined
    const [hours, minutes] = timeStr.split(':').map(Number)
    const now = new Date()
    now.setHours(hours, minutes, 0, 0)
    if (now < new Date()) {
      now.setDate(now.getDate() + 1)
    }
    return now.toISOString()
  }

  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'publish') => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      let imageUrls: string[] = []
      if (images.length > 0) {
        setUploadingImages(true)
        imageUrls = await uploadImages(images)
        setUploadingImages(false)
      }

      const payload: any = {
        name: formData.itemName,
        description: formData.description || `Fresh surplus from today's kitchen. ${formData.quantity} portions available for pickup.`,
        category: formData.category || 'prepared_meals',
        originalPrice: parseFloat(formData.originalPrice) || 0,
        discountedPrice: parseFloat(formData.salePrice) || 0,
        availableQuantity: parseInt(formData.quantity) || 0,
        images: imageUrls,
        allergens: selectedAllergens,
        tags: selectedTags,
        isAvailable: action === 'publish',
        listingType: listingType,
        ngoPrice: listingType !== 'user_only' ? Math.max(0, parseFloat(ngoPrice) || 0) : 0,
        isDonationEligible: listingType !== 'user_only',
        isVegetarian: selectedTags.includes('Vegetarian'),
        isVegan: selectedTags.includes('Vegan'),
        isGlutenFree: selectedTags.includes('Gluten-Free'),
        carbonScore: parseFloat(carbonSaved),
        expectedReadyTime: buildExpiryDate(formData.expectedReadyTime),
        pickupTimeSlots: [{
          startTime: formData.pickupFromTime,
          endTime: formData.pickupToTime,
          maxOrders: 10
        }],
      }

      if (formData.pickupToTime) {
        payload.expiryTime = buildExpiryDate(formData.pickupToTime)
      }

      const res = await restaurantService.addMenuItem(payload)
      if (res.success) {
        setSuccess(res.message || 'Item added successfully!')
        setFormData({
          itemName: '',
          category: '',
          description: '',
          originalPrice: '',
          salePrice: '',
          quantity: '',
          unit: 'Items',
          expectedReadyTime: getDefaultReadyTime(),
          pickupFromTime: getDefaultPickupFrom(),
          pickupToTime: getDefaultPickupTo(),
          autoExpire: true,
          notes: '',
        })
        setImages([])
        setListingType('both')
        setNgoPrice('')
      } else {
        setError(res.message || 'Signal failure: Parameter mismatch.')
      }
    } catch (err) {
      setError('System error: Packet injection interrupted.')
    } finally {
      setIsLoading(false)
      setUploadingImages(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-12 pb-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
          <div className="space-y-4">
            <Link href="/restaurant" className="inline-flex items-center gap-2 text-[10px] font-black text-[#1C1207]/30 hover:text-[#1C1207] uppercase tracking-[0.3em] transition-colors">
              <ChevronLeft className="w-3" />
              Back to Dashboard
            </Link>
            <h1 className="text-6xl font-display font-black text-[#1C1207] tracking-tighter leading-none uppercase">Add New Item</h1>
            <p className="text-[#1C1207]/50 font-medium max-w-xl text-lg">
              Add a new food item to your restaurant's menu.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsQuickMode(!isQuickMode)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${isQuickMode
                ? 'bg-orange-600 text-white border-orange-600 shadow-2xl shadow-orange-600/20'
                : 'bg-white text-[#1C1207]/40 border-[#1C1207]/5 hover:border-orange-200 hover:text-orange-600'
                }`}
            >
              <Zap className={`w-4 h-4 ${isQuickMode ? 'animate-pulse' : ''}`} />
              {isQuickMode ? 'QUICK MODE ON' : 'QUICK MODE'}
            </button>
          </div>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 bg-emerald-50 border border-emerald-100 rounded-[32px] flex items-center gap-6 text-emerald-800 font-bold shadow-sm">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">✓</div>
              <p className="text-lg">{success}</p>
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 bg-red-50 border border-red-100 rounded-[32px] flex items-center gap-6 text-red-800 font-bold shadow-sm">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">!</div>
              <p className="text-lg">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={(e) => handleSubmit(e, 'publish')} className="space-y-10">
          {/* Pickup Time */}
          <div className="bg-[#1C1207] rounded-[48px] p-8 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center text-orange-500 shadow-2xl border border-white/5">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Pickup Time</h3>
                  <p className="text-white/40 text-sm font-medium leading-relaxed max-w-md">
                    When will the food be ready for pickup?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[32px] border border-white/10">
                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4">Ready Time</Label>
                <Input
                  name="expectedReadyTime"
                  type="time"
                  value={formData.expectedReadyTime}
                  onChange={handleInputChange}
                  className="bg-transparent border-none text-2xl font-display font-black text-orange-500 w-32 focus:ring-0 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* Image */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-orange-600" />
                  <h2 className="text-2xl font-display font-black text-[#1C1207] tracking-tight uppercase">Food Image</h2>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeImage}
                  disabled={isAnalyzing || images.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all disabled:opacity-30 shadow-xl shadow-violet-600/20"
                >
                  {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                </button>
              </div>
              <ImageUpload onImagesChange={setImages} maxImages={isQuickMode ? 1 : 5} />


              {/* Metadata */}
              <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-10 space-y-10">
                <div className="space-y-8">
                  <div>
                    <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Item Name</Label>
                    <Input id="itemName" name="itemName" value={formData.itemName} onChange={handleInputChange} placeholder="e.g., White Sauce Pasta" className="mt-4 h-[72px] rounded-[28px] border-[#1C1207]/5 bg-[#FFF8F0]/50 px-8 text-lg font-bold placeholder:text-[#1C1207]/20" required />
                  </div>

                  {isQuickMode ? (
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Quantity</Label>
                        <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} className="mt-4 h-[72px] rounded-[28px] border-[#1C1207]/5 bg-[#FFF8F0]/50 px-8 text-xl font-black" placeholder="00" required />
                      </div>
                      <div>
                        <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                          <SelectTrigger className="mt-4 h-[72px] rounded-[28px] border-[#1C1207]/5 bg-[#FFF8F0]/50 px-8 font-black uppercase text-[11px] tracking-widest text-orange-600">
                            <SelectValue placeholder="SELECT" />
                          </SelectTrigger>
                          <SelectContent className="rounded-[28px] border-[#1C1207]/5">
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value} className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Category</Label>
                          <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                            <SelectTrigger className="mt-4 h-[72px] rounded-[28px] border-[#1C1207]/5 bg-[#FFF8F0]/50 px-8 font-black uppercase text-[11px] tracking-widest">
                              <SelectValue placeholder="SELECT" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[28px] border-[#1C1207]/5">
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value} className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3">{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Dietary Tags</Label>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {DIETARY_TAGS.slice(0, 4).map((tag) => (
                              <button key={tag} type="button" onClick={() => handleTagToggle(tag)}
                                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTags.includes(tag) ? 'bg-[#1C1207] text-white shadow-xl' : 'bg-[#FFF8F0] text-[#1C1207]/40 border border-[#1C1207]/5 hover:bg-white'}`}>
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em] ml-2">Description</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the food item..." className="mt-4 min-h-32 rounded-[32px] border-[#1C1207]/5 bg-[#FFF8F0]/50 p-8 text-sm font-medium resize-none focus:ring-orange-600/10" />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="space-y-10">
              <div className="bg-[#1C1207] p-10 rounded-[48px] text-white shadow-2xl shadow-orange-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Environmental Impact</h3>
                    <Leaf className="w-5 h-5 text-emerald-500" />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-6xl font-display font-black tracking-tighter text-white">{carbonSaved}</span>
                        <span className="text-xs font-black text-white/30 uppercase tracking-widest">kg CO2</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: Math.min(parseFloat(carbonSaved) * 4, 100) + '%' }} className="h-full bg-emerald-500" />
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-[28px] p-6 border border-white/10 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-white">{waterSavedFormatted} L</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Water Saved</p>
                      </div>
                      <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-500/20">
                        <Droplets className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] leading-relaxed">
                    Estimated impact based on {estimatedWeightKg.toFixed(1)}kg of food.
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-10 space-y-8 shadow-sm">
                <h3 className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.4em]">Pricing</h3>
                {!isQuickMode ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest ml-2">Original Price</Label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1C1207]/20 font-black">$</span>
                          <Input id="originalPrice" name="originalPrice" type="number" value={formData.originalPrice} onChange={handleInputChange} className="h-14 pl-12 rounded-2xl border-[#1C1207]/5 bg-[#FFF8F0]/50 font-black text-lg" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest ml-2">Discounted Price</Label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-600 font-black">$</span>
                          <Input id="salePrice" name="salePrice" type="number" value={formData.salePrice} onChange={handleInputChange} className="h-14 pl-12 rounded-2xl border-orange-600/20 bg-orange-50 font-black text-lg text-orange-600" />
                        </div>
                      </div>
                    </div>

                    {discount > 0 && (
                      <div className="py-5 bg-orange-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] text-center shadow-xl shadow-orange-600/20">
                        Discount: {discount}%
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#1C1207]/5">
                      <div>
                        <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest ml-2">Quantity</Label>
                        <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} className="mt-3 h-14 rounded-2xl border-[#1C1207]/5 bg-[#FFF8F0]/50 font-black" required />
                      </div>
                      <div>
                        <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest ml-2">Unit</Label>
                        <Select value={formData.unit} onValueChange={(value) => handleSelectChange('unit', value)}>
                          <SelectTrigger className="mt-3 h-14 rounded-2xl border-[#1C1207]/5 bg-[#FFF8F0]/50 px-6 font-black uppercase text-[10px] tracking-widest">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-[#1C1207]/5">
                            {UNITS.map(u => <SelectItem key={u} value={u} className="rounded-xl font-bold uppercase text-[9px] tracking-widest py-3">{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-600 animate-pulse">
                      <Zap className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-[0.3em]">Quick Mode - Edit for details</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Listing Type - NGO vs Users */}
          <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-10 space-y-8">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-orange-600" />
              <h3 className="text-2xl font-display font-black text-[#1C1207] tracking-tight uppercase">Listing Type</h3>
            </div>
            <p className="text-[#1C1207]/40 text-sm font-medium -mt-4">Select who this item is for and set appropriate pricing</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* NGO Only */}
              <button
                type="button"
                onClick={() => setListingType('ngo_only')}
                className={`p-6 rounded-[24px] border-2 transition-all text-left ${
                  listingType === 'ngo_only' 
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20' 
                    : 'border-[#1C1207]/10 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    listingType === 'ngo_only' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-wider">For NGO</span>
                </div>
                <p className="text-xs text-[#1C1207]/50 font-medium">Low/negligible price for charitable distribution</p>
              </button>

              {/* Users Only */}
              <button
                type="button"
                onClick={() => setListingType('user_only')}
                className={`p-6 rounded-[24px] border-2 transition-all text-left ${
                  listingType === 'user_only' 
                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20' 
                    : 'border-[#1C1207]/10 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    listingType === 'user_only' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-wider">For Users</span>
                </div>
                <p className="text-xs text-[#1C1207]/50 font-medium">Regular discounted price for customers</p>
              </button>

              {/* Both */}
              <button
                type="button"
                onClick={() => setListingType('both')}
                className={`p-6 rounded-[24px] border-2 transition-all text-left ${
                  listingType === 'both' 
                    ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/20' 
                    : 'border-[#1C1207]/10 hover:border-orange-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    listingType === 'both' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                  }`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-wider">For Both</span>
                </div>
                <p className="text-xs text-[#1C1207]/50 font-medium">Available for NGO and users with different prices</p>
              </button>
            </div>

            {/* NGO Price Input - Show when not user_only */}
            {listingType !== 'user_only' && (
              <div className="space-y-4 pt-4 border-t border-[#1C1207]/5">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2">
                  {listingType === 'both' ? 'NGO Price (Low/Negligible)' : 'NGO Price'}
                </Label>
                <div className="relative max-w-xs">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 font-black">$</span>
                  <Input 
                    id="ngoPrice" 
                    name="ngoPrice"
                    type="number" 
                    value={ngoPrice} 
                    onChange={(e) => setNgoPrice(e.target.value)} 
                    placeholder="0"
                    className="h-14 pl-12 rounded-2xl border-emerald-200 bg-emerald-50 font-black text-lg text-emerald-600" 
                  />
                </div>
                <p className="text-xs text-[#1C1207]/40">
                  {listingType === 'both' 
                    ? 'Price at which NGOs can claim this item' 
                    : 'Minimal price for NGO distribution'}
                </p>
              </div>
            )}

            {/* Status badges */}
            <div className="flex items-center gap-3 flex-wrap pt-4">
              {listingType === 'ngo_only' && (
                <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  💚 NGO Only
                </span>
              )}
              {listingType === 'user_only' && (
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                  👤 Users Only
                </span>
              )}
              {listingType === 'both' && (
                <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  💚 NGOs: ${ngoPrice || '0'}
                </span>
              )}
              {listingType === 'both' && (
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                  👤 Users: ${formData.salePrice || '0'}
                </span>
              )}
            </div>
          </div>

          {/* Pickup Time */}
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white border border-[#1C1207]/5 rounded-[48px] p-10 space-y-8">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-orange-600" />
                <h3 className="text-2xl font-display font-black text-[#1C1207] tracking-tight uppercase">Pickup Window</h3>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest ml-2">Pickup Start</Label>
                  <Input name="pickupFromTime" type="time" value={formData.pickupFromTime} onChange={handleInputChange} className="h-14 rounded-2xl border-[#1C1207]/5 bg-[#FFF8F0]/50 font-black focus:ring-orange-600/10 [color-scheme:light]" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-[#1C1207]/30 uppercase tracking-widest ml-2">Pickup End</Label>
                  <Input name="pickupToTime" type="time" value={formData.pickupToTime} onChange={handleInputChange} className="h-14 rounded-2xl border-[#1C1207]/10 bg-orange-50/50 font-black text-orange-600 focus:ring-orange-600/10 [color-scheme:light]" />
                </div>
              </div>
              <div className="flex items-center gap-4 py-4 px-6 bg-[#FFF8F0] rounded-[24px] border border-[#1C1207]/5">
                <Switch checked={formData.autoExpire} onCheckedChange={(c) => handleSelectChange('autoExpire', String(c))} />
                <span className="text-[10px] font-black text-[#1C1207]/50 uppercase tracking-widest">Auto-expire after pickup window ends</span>
              </div>
            </div>

            <div className="bg-[#1C1207] p-10 rounded-[48px] text-white flex flex-col justify-center gap-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-orange-600/10 transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500 border border-white/10">
                  <Info className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Information</p>
              </div>
              <div className="space-y-4 relative z-10">
                {[
                  { step: '01', desc: 'Item will be listed after submission' },
                  { step: '02', desc: 'Customers will see the item in feed' },
                  { step: '03', desc: 'Orders can be placed by users/NGOs' },
                  { step: '04', desc: 'Pickup within the specified time window' }
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs font-bold text-white/40 group/item">
                    <span className="text-orange-600 font-black group-hover/item:text-white transition-colors">{step.step}</span>
                    <span className="group-hover/item:text-white/60 transition-colors">{step.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-10 pt-10">
            <Link href="/restaurant" className="text-[10px] font-black text-[#1C1207]/30 hover:text-[#1C1207] uppercase tracking-[0.4em] transition-colors">
              Cancel
            </Link>
            <button type="submit"
              disabled={isLoading}
              className="px-16 py-6 bg-[#1C1207] text-white rounded-[28px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {uploadingImages ? 'UPLOADING...' : isQuickMode ? 'QUICK ADD' : 'ADD ITEM'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
