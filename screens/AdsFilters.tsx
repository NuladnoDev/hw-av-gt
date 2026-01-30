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
        className="fixed left-0 right-0 bottom-0 z-[160] flex flex-col bg-[#0A0A0A] rounded-t-[32px] overflow-hidden shadow-2xl mx-auto w-full max-w-[375px]"
        style={{ maxHeight: '90vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X size={20} className="text-white" />
          </button>
          <button 
            onClick={handleReset}
            className="px-5 h-10 rounded-full bg-white/5 border border-white/10 text-white/30 text-[14px] font-sf-ui-medium active:scale-95 transition-all backdrop-blur-md hover:bg-white/10 hover:text-white"
          >
            Сбросить
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-6 py-6 space-y-8">
          {/* Categories */}
          <section>
            <h3 className="text-[13px] text-white/40 font-sf-ui-medium tracking-wider mb-4 px-1">
              Категории
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORY_CONFIGS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center justify-between p-4 rounded-[24px] border transition-all duration-300 ${
                    tempFilters.categories.includes(cat.id)
                      ? 'bg-white/10 border-white/20'
                      : 'bg-[#0F0F0F] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      {React.isValidElement(cat.icon) 
                        ? React.cloneElement(cat.icon as React.ReactElement<any>, { size: 18 })
                        : cat.icon}
                    </div>
                    <span className="text-[16px] text-white font-sf-ui-medium">{cat.label}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    tempFilters.categories.includes(cat.id)
                      ? 'bg-blue-500 border-blue-500'
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
            <h3 className="text-[13px] text-white/40 font-sf-ui-medium tracking-wider mb-4 px-1">
              Цена, ₽
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="От"
                  value={tempFilters.minPrice}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full h-14 bg-[#0F0F0F] border border-white/5 rounded-[24px] px-6 text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-all"
                />
              </div>
              <div className="w-4 h-[1px] bg-white/10" />
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="До"
                  value={tempFilters.maxPrice}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full h-14 bg-[#0F0F0F] border border-white/5 rounded-[24px] px-6 text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Condition */}
          <section>
            <h3 className="text-[13px] text-white/40 font-sf-ui-medium tracking-wider mb-4 px-1">
              Состояние
            </h3>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map((cond) => (
                <button
                  key={cond.id}
                  onClick={() => toggleCondition(cond.id)}
                  className={`px-6 py-3 rounded-full text-[14px] font-sf-ui-medium transition-all duration-300 border ${
                    tempFilters.conditions.includes(cond.id)
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-[#0F0F0F] border-white/5 text-white/60 hover:border-white/10'
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/5">
          <button
            onClick={() => onApply(tempFilters)}
            className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-[28px] font-sf-ui-medium text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white/10 backdrop-blur-md"
          >
            Показать результаты
          </button>
        </div>
      </motion.div>
    </>
  )
}
