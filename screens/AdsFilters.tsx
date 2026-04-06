'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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

  const hasFilters =
    tempFilters.categories.length > 0 ||
    tempFilters.conditions.length > 0 ||
    tempFilters.minPrice.length > 0 ||
    tempFilters.maxPrice.length > 0

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed left-0 right-0 bottom-0 z-[160] flex flex-col bg-[#121212] rounded-t-[32px] overflow-hidden"
        style={{ maxHeight: '92vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] active:bg-white/10 transition-colors"
          >
            <X size={18} className="text-white/70" />
          </button>
          <span className="text-[17px] font-sf-ui-medium text-white">Фильтры</span>
          <button
            onClick={() => setTempFilters({ categories: [], conditions: [], minPrice: '', maxPrice: '' })}
            className={`text-[14px] font-sf-ui-light transition-colors ${hasFilters ? 'text-white/60 active:text-white' : 'text-white/20 pointer-events-none'}`}
          >
            Сбросить
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden px-5 pb-6 space-y-6" style={{ scrollbarWidth: 'none' }}>

          {/* Категории */}
          <section>
            <h3 className="text-[12px] text-white/30 font-sf-ui-medium uppercase tracking-wider mb-3">Категории</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_CONFIGS.map((cat) => {
                const active = tempFilters.categories.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-[14px] font-sf-ui-medium transition-all active:scale-95 ${
                      active
                        ? 'bg-white text-black border-white'
                        : 'bg-white/[0.04] border-white/[0.07] text-white/60'
                    }`}
                  >
                    <span className="text-[13px]" style={{ color: active ? 'black' : cat.color }}>
                      {React.isValidElement(cat.icon)
                        ? React.cloneElement(cat.icon as React.ReactElement<any>, { size: 14 })
                        : cat.icon}
                    </span>
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Состояние */}
          <section>
            <h3 className="text-[12px] text-white/30 font-sf-ui-medium uppercase tracking-wider mb-3">Состояние</h3>
            <div className="grid grid-cols-2 gap-2">
              {CONDITION_OPTIONS.map((cond) => {
                const active = tempFilters.conditions.includes(cond.id)
                return (
                  <button
                    key={cond.id}
                    onClick={() => toggleCondition(cond.id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-[16px] border text-left transition-all active:scale-95 ${
                      active
                        ? 'bg-white/[0.08] border-white/25'
                        : 'bg-white/[0.03] border-white/[0.06]'
                    }`}
                  >
                    <span style={{ color: cond.color }}>{cond.icon}</span>
                    <span className={`text-[14px] font-sf-ui-medium ${active ? 'text-white' : 'text-white/50'}`}>
                      {cond.label}
                    </span>
                    {active && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3} className="text-black" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Цена */}
          <section>
            <h3 className="text-[12px] text-white/30 font-sf-ui-medium uppercase tracking-wider mb-3">Цена, ₽</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="От"
                  value={tempFilters.minPrice}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full h-[52px] bg-white/[0.04] border border-white/[0.07] rounded-[16px] px-4 text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-all text-[16px]"
                />
              </div>
              <div className="w-4 h-px bg-white/15 shrink-0" />
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="До"
                  value={tempFilters.maxPrice}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full h-[52px] bg-white/[0.04] border border-white/[0.07] rounded-[16px] px-4 text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-all text-[16px]"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => onApply(tempFilters)}
            className="w-full h-14 bg-white text-black rounded-[22px] font-sf-ui-medium text-[16px] active:scale-[0.97] transition-all"
          >
            Применить
          </button>
        </div>
      </motion.div>
    </>
  )
}
