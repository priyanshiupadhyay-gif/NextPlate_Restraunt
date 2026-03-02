'use client'

import React, { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, Plus, Trash2, Loader2, ChefHat, Clock, Users, Flame, Sparkles, Leaf } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface Recipe {
    recipeName: string
    description: string
    prepTime: string
    cookTime: string
    servings: number
    difficulty: string
    ingredients: { item: string; quantity: string; fromDonation?: boolean }[]
    steps: string[]
    nutritionPerServing: { calories: number; protein: string; carbs: string; fat: string }
    chefTips: string[]
    wasteReduction: string
    aiFallback?: boolean
}

export default function RecipeAlchemistPage() {
    const [items, setItems] = useState([{ name: '', quantity: 1 }])
    const [servings, setServings] = useState(50)
    const [isLoading, setIsLoading] = useState(false)
    const [recipe, setRecipe] = useState<Recipe | null>(null)

    const addItem = () => setItems([...items, { name: '', quantity: 1 }])
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
    const updateItem = (i: number, field: string, value: any) => {
        const updated = [...items]
        updated[i] = { ...updated[i], [field]: value }
        setItems(updated)
    }

    const handleSynthesize = async () => {
        const validItems = items.filter(i => i.name.trim())
        if (validItems.length === 0) { toast.error('Add at least one ingredient'); return }
        setIsLoading(true)
        try {
            const res = await api.post('/recipe-alchemist/synthesize', { items: validItems, servings })
            if (res.data.success) {
                setRecipe(res.data.data)
                toast.success('Recipe synthesized!')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Synthesis failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto space-y-12 pb-32">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1C1207]/5 pb-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                            <FlaskConical className="w-3 h-3" />
                            AI Synthesis Engine
                        </div>
                        <h1 className="text-5xl md:text-6xl font-display font-black text-[#1C1207] tracking-tighter leading-none uppercase">
                            Recipe <span className="text-purple-600">Alchemist</span>
                        </h1>
                        <p className="text-[#1C1207]/50 font-medium max-w-xl text-lg">
                            Transform donated ingredients into <span className="text-[#1C1207] font-bold">community kitchen recipes</span>.
                            AI creates optimized, nutritious meals that use every item.
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Left — Inputs */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[32px] p-8 border border-[#1C1207]/5 space-y-6">
                            <h2 className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em]">Available Ingredients</h2>
                            <div className="space-y-4">
                                {items.map((item, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                                        <input type="text" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder={`Ingredient ${i + 1}`}
                                            className="flex-1 h-12 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                                        <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} min={1}
                                            className="w-20 h-12 bg-[#FFF8F0] border border-[#1C1207]/5 rounded-xl px-3 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                                        <span className="text-[9px] font-black text-[#1C1207]/20 uppercase">kg</span>
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(i)} className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                            <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-[#1C1207]/10 rounded-xl text-xs font-black text-[#1C1207]/30 uppercase tracking-widest hover:border-purple-300 hover:text-purple-500 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Add Ingredient
                            </button>
                        </div>

                        <div className="bg-white rounded-[32px] p-8 border border-[#1C1207]/5 space-y-4">
                            <h2 className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em]">Target Servings</h2>
                            <div className="flex items-center gap-4">
                                {[25, 50, 100, 200].map(s => (
                                    <button key={s} onClick={() => setServings(s)}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${servings === s ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-[#FFF8F0] text-[#1C1207]/30 hover:bg-purple-50'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSynthesize} disabled={isLoading}
                            className="w-full py-6 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50">
                            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Synthesizing...</> : <><Sparkles className="w-5 h-5" /> Synthesize Recipe</>}
                        </button>
                    </div>

                    {/* Right — Result */}
                    <div>
                        <AnimatePresence mode="wait">
                            {!recipe ? (
                                <motion.div key="empty" className="bg-white border-2 border-dashed border-[#1C1207]/10 rounded-[48px] py-32 text-center space-y-4">
                                    <ChefHat className="w-16 h-16 text-[#1C1207]/10 mx-auto" />
                                    <h3 className="text-lg font-display font-black text-[#1C1207]/15 uppercase">Awaiting Ingredients</h3>
                                    <p className="text-sm text-[#1C1207]/10 max-w-xs mx-auto">Add your donated items and click Synthesize to generate a recipe</p>
                                </motion.div>
                            ) : (
                                <motion.div key="recipe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    {recipe.aiFallback && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-bold text-amber-700 text-center">
                                            ⚡ AI quota exceeded — showing fallback recipe. Full AI synthesis resumes after quota reset.
                                        </div>
                                    )}
                                    <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-[36px] p-8 text-white">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Generated Recipe</p>
                                        <h2 className="text-3xl font-display font-black tracking-tight">{recipe.recipeName}</h2>
                                        <p className="text-white/60 text-sm mt-2">{recipe.description}</p>
                                        <div className="flex items-center gap-6 mt-6 text-white/50 text-[9px] font-black uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Prep: {recipe.prepTime}</span>
                                            <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Cook: {recipe.cookTime}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {recipe.servings} servings</span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[28px] p-6 border border-[#1C1207]/5 space-y-4">
                                        <h3 className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em]">Ingredients</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {recipe.ingredients.map((ing, i) => (
                                                <div key={i} className={`px-4 py-3 rounded-xl text-xs font-bold ${ing.fromDonation ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-neutral-50 text-neutral-600'}`}>
                                                    {ing.fromDonation && '🌱 '}{ing.quantity} {ing.item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[28px] p-6 border border-[#1C1207]/5 space-y-4">
                                        <h3 className="text-[10px] font-black text-[#1C1207]/40 uppercase tracking-[0.3em]">Steps</h3>
                                        <ol className="space-y-3">
                                            {recipe.steps.map((step, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0">{i + 1}</span>
                                                    <p className="text-sm font-medium text-[#1C1207]/60 pt-1">{step}</p>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { label: 'Calories', value: recipe.nutritionPerServing.calories },
                                            { label: 'Protein', value: recipe.nutritionPerServing.protein },
                                            { label: 'Carbs', value: recipe.nutritionPerServing.carbs },
                                            { label: 'Fat', value: recipe.nutritionPerServing.fat }
                                        ].map(n => (
                                            <div key={n.label} className="bg-white rounded-2xl p-4 border border-[#1C1207]/5 text-center">
                                                <p className="text-lg font-black text-[#1C1207]">{n.value}</p>
                                                <p className="text-[8px] font-black text-[#1C1207]/20 uppercase tracking-widest">{n.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {recipe.wasteReduction && (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-3">
                                            <Leaf className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold text-emerald-700">{recipe.wasteReduction}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
