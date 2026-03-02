'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChefHat, Sparkles, Plus, Minus, Loader2, Clock,
    Flame, Users, BookOpen, Lightbulb, Leaf, X
} from 'lucide-react'
import api from '@/lib/api'

interface RecipeItem {
    name: string
    quantity: number
}

interface SynthesizedRecipe {
    recipeName: string
    description: string
    prepTime: string
    cookTime: string
    servings: number
    difficulty: string
    ingredients: Array<{ item: string; quantity: string; fromDonation: boolean }>
    steps: string[]
    nutritionPerServing: { calories: number; protein: string; carbs: string; fat: string }
    chefTips: string[]
    wasteReduction: string
}

export function RecipeAlchemist() {
    const [items, setItems] = useState<RecipeItem[]>([{ name: '', quantity: 1 }])
    const [servings, setServings] = useState(50)
    const [recipe, setRecipe] = useState<SynthesizedRecipe | null>(null)
    const [loading, setLoading] = useState(false)
    const [showRecipe, setShowRecipe] = useState(false)

    const addItem = () => setItems([...items, { name: '', quantity: 1 }])
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
    const updateItem = (i: number, field: string, value: any) => {
        const updated = [...items]
            ; (updated[i] as any)[field] = value
        setItems(updated)
    }

    const synthesize = async () => {
        const validItems = items.filter(i => i.name.trim())
        if (validItems.length === 0) return

        setLoading(true)
        try {
            const res = await api.post('/recipe-alchemist/synthesize', {
                items: validItems,
                servings
            })
            if (res.data.success) {
                setRecipe(res.data.data)
                setShowRecipe(true)
            }
        } catch (err) {
            console.warn('Recipe synthesis failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="bg-[#1C1207] rounded-[48px] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full -mr-40 -mt-40 group-hover:scale-110 transition-transform" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-orange-500/10 blur-[100px] rounded-full -ml-30 -mb-30" />

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
                            <ChefHat className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-black tracking-tight uppercase">Recipe Alchemist</h2>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">AI Meal Synthesis from Donated Items</p>
                        </div>
                    </div>

                    {/* Input items */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Donated Ingredients</p>
                        {items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={e => updateItem(i, 'name', e.target.value)}
                                    placeholder="e.g. Rice, Paneer, Bread..."
                                    className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-white placeholder:text-white/20 outline-none focus:border-amber-500/50 transition-colors"
                                />
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-20 bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-white text-center outline-none focus:border-amber-500/50"
                                    min={1}
                                />
                                <span className="text-[10px] font-bold text-white/20 uppercase">kg</span>
                                {items.length > 1 && (
                                    <button onClick={() => removeItem(i)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                        <Minus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={addItem}
                            className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest hover:text-amber-300 transition-colors py-2"
                        >
                            <Plus className="w-4 h-4" /> Add Ingredient
                        </button>
                    </div>

                    {/* Servings */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-white/40" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Servings Target</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setServings(Math.max(10, servings - 10))} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/20">
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-2xl font-black text-amber-400 w-16 text-center">{servings}</span>
                            <button onClick={() => setServings(servings + 10)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/20">
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={synthesize}
                        disabled={loading || items.every(i => !i.name.trim())}
                        className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:from-amber-400 hover:to-orange-400 transition-all active:scale-[0.98] disabled:opacity-30 shadow-2xl shadow-amber-500/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {loading ? 'Synthesizing...' : 'Synthesize Recipe'}
                    </button>
                </div>
            </div>

            {/* Recipe Result Modal */}
            <AnimatePresence>
                {showRecipe && recipe && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setShowRecipe(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[40px] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            {/* Recipe Header */}
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-[40px] p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
                                <button onClick={() => setShowRecipe(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ChefHat className="w-6 h-6" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Recipe Alchemist</span>
                                    </div>
                                    <h3 className="text-4xl font-black tracking-tight mb-3">{recipe.recipeName}</h3>
                                    <p className="text-white/80 font-medium text-sm max-w-xl">{recipe.description}</p>
                                    <div className="flex items-center gap-6 mt-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                                            <Clock className="w-4 h-4" /> Prep: {recipe.prepTime}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                                            <Flame className="w-4 h-4" /> Cook: {recipe.cookTime}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                                            <Users className="w-4 h-4" /> Serves: {recipe.servings}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recipe Body */}
                            <div className="p-10 space-y-10">
                                {/* Nutrition */}
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'Calories', value: recipe.nutritionPerServing.calories },
                                        { label: 'Protein', value: recipe.nutritionPerServing.protein },
                                        { label: 'Carbs', value: recipe.nutritionPerServing.carbs },
                                        { label: 'Fat', value: recipe.nutritionPerServing.fat },
                                    ].map((n, i) => (
                                        <div key={i} className="bg-amber-50 rounded-2xl p-4 text-center">
                                            <p className="text-xl font-black text-amber-600">{n.value}</p>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">{n.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Ingredients */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-black text-[#1C1207] uppercase tracking-tight flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-amber-500" /> Ingredients
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {recipe.ingredients.map((ing, i) => (
                                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${ing.fromDonation ? 'bg-amber-50 border border-amber-100' : 'bg-neutral-50'}`}>
                                                {ing.fromDonation && <Leaf className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                                <span className="text-sm font-medium text-[#1C1207]">
                                                    <span className="font-bold">{ing.quantity}</span> {ing.item}
                                                </span>
                                                {ing.fromDonation && <span className="text-[8px] font-black text-amber-500 uppercase ml-auto">Donated</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-black text-[#1C1207] uppercase tracking-tight">Steps</h4>
                                    <div className="space-y-4">
                                        {recipe.steps.map((step, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-[#1C1207] text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-medium text-[#1C1207]/80 leading-relaxed pt-1">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Chef Tips */}
                                {recipe.chefTips?.length > 0 && (
                                    <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 space-y-3">
                                        <h4 className="text-sm font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" /> Chef Tips
                                        </h4>
                                        {recipe.chefTips.map((tip, i) => (
                                            <p key={i} className="text-sm text-amber-800/80 font-medium">• {tip}</p>
                                        ))}
                                    </div>
                                )}

                                {/* Waste Reduction */}
                                {recipe.wasteReduction && (
                                    <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Leaf className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Zero Waste Impact</span>
                                        </div>
                                        <p className="text-sm text-emerald-800/80 font-medium">{recipe.wasteReduction}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
