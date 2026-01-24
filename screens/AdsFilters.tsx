'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { X, Check } from 'lucide-react'
import { CATEGORY_CONFIGS, CONDITION_OPTIONS, AdsCategory, AdsCondition } from './Ads_Create'

export interface FilterState {
  categories: AdsCategory[]
  conditions: AdsCondition[]
  minPrice: string
  maxPrice: string
}

interface AdsFiltersProps {
  onClose: () => void
  onApply: (filters: FilterState) => void
  initialFilters: FilterState
}

export default function AdsFilters({ onClose, onApply, initialFilters }: AdsFiltersProps) {
  const [tempFilters, setTempFilters] = useState<FilterState>(initialFilters)

  const toggleCategory = (id: AdsCategory) => {
    setTempFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter(c => c !== id)
        : [...prev.categories, id]
    }))
  }

  const toggleCondition = (id: AdsCondition) => {
    setTempFilters(prev => ({
      ...prev,
      conditions: prev.conditions.includes(id)
        ? prev.conditions.filter(c => c !== id)
        : [...prev.conditions, id]
    }))
  }

  const handleReset = () => {
    setTempFilters({
      categories: [],
      conditions: [],
      minPrice: '',
      maxPrice: ''
    })
  }

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed left-1/2 -translate-x-1/2 top-20 z-[160] flex flex-col bg-[#0A0A0A] rounded-[32px] overflow-hidden shadow-2xl w-[calc(100%-32px)] max-w-[400px]"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
        initial={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
        animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
        exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <h2 className="text-[18px] font-sf-ui-medium text-white">Фильтры</h2>
          <button 
            onClick={handleReset}
            className="text-[14px] text-[#007AFF] font-sf-ui-medium"
          >
            Сбросить
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-6 py-6 space-y-8">
          {/* Categories */}
          <section>
            <h3 className="text-[15px] text-white/40 font-sf-ui-medium uppercase tracking-wider mb-4 px-1">
              Категории
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORY_CONFIGS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                    tempFilters.categories.includes(cat.id)
                      ? 'bg-white/10 ring-1 ring-white/20'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-xl"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {React.isValidElement(cat.icon) 
                        ? React.cloneElement(cat.icon as React.ReactElement<any>, { size: 20 })
                        : cat.icon}
                    </div>
                    <span className="text-[16px] text-white font-sf-ui-medium">{cat.label}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    tempFilters.categories.includes(cat.id)
                      ? 'bg-[#007AFF] border-[#007AFF]'
                      : 'border-white/10'
                  }`}>
                    {tempFilters.categories.includes(cat.id) && <Check size={14} strokeWidth={3} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Price Range */}
          <section>
            <h3 className="text-[15px] text-white/40 font-sf-ui-medium uppercase tracking-wider mb-4 px-1">
              Цена, ₽
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="От"
                  value={tempFilters.minPrice}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all"
                />
              </div>
              <div className="w-4 h-[1px] bg-white/10" />
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="До"
                  value={tempFilters.maxPrice}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Condition */}
          <section>
            <h3 className="text-[15px] text-white/40 font-sf-ui-medium uppercase tracking-wider mb-4 px-1">
              Состояние
            </h3>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map((cond) => (
                <button
                  key={cond.id}
                  onClick={() => toggleCondition(cond.id)}
                  className={`px-5 py-3 rounded-full text-[14px] font-sf-ui-medium transition-all duration-200 ${
                    tempFilters.conditions.includes(cond.id)
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#0A0A0A] border-t border-white/5">
          <button
            onClick={() => onApply(tempFilters)}
            className="w-full h-14 bg-white text-black rounded-2xl font-vk-demi text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            Показать результаты
          </button>
        </div>
      </motion.div>
    </>
  )
}
