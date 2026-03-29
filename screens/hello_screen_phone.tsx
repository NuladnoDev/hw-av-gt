'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AdCardSkeleton } from './ads'

export default function HelloScreenPhone({
  onBack,
  onNext,
  initialValue = '',
}: {
  onBack?: () => void
  onNext?: (phone: string) => void
  initialValue?: string
}) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.max(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const formatPhone = (input: string) => {
    const digits = input.replace(/\D/g, '')
    if (digits.length === 0) return ''
    if (digits.length <= 1) return '+' + digits
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`
    if (digits.length <= 9) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val.length < value.length && (value.endsWith(' ') || value.endsWith('-') || value.endsWith('(') || value.endsWith(')'))) {
        // Handle backspace properly for formatting
        const digits = val.replace(/\D/g, '')
        setValue(formatPhone(digits))
    } else {
        const digits = val.replace(/\D/g, '')
        if (digits.length <= 11) {
            setValue(formatPhone(digits))
        }
    }
    setError('')
  }

  const isValid = value.replace(/\D/g, '').length === 11

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />
        
        {/* Background Decorative */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-white/[0.01] blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/[0.01] blur-[80px] rounded-full pointer-events-none" />

        <button
          type="button"
          onClick={onBack}
          className="absolute left-6 top-[50px] z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 top-0 bottom-0 px-6 flex flex-col items-start pt-[140px] z-20"
        >
          <div className="mb-2 text-[32px] font-bold leading-[1.2em] text-white font-ttc-bold tracking-tight">
            Номер телефона
          </div>
          <div className="mb-8 text-[16px] leading-[1.4em] text-white/50 font-light max-w-[280px]" style={{ fontFamily: 'var(--font-inter)' }}>
            Введите ваш номер телефона для подтверждения аккаунта
          </div>

          <div className="w-full space-y-8">
            <div className="flex flex-col gap-3">
              <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                Ваш номер
              </label>
              <div className="relative w-full">
                <input
                  value={value}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-6 pr-6 text-[20px] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/10 backdrop-blur-md font-mono"
                  autoFocus
                />
                <AnimatePresence>
                  {error && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-[14px] text-[#FF453A] font-sf-ui-medium"
                    >
                      {error}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              type="button"
              className={`h-[64px] w-[64px] rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isValid
                  ? 'bg-white text-black active:scale-[0.9]'
                  : 'bg-white/10 text-white/20'
              }`}
              onClick={() => {
                if (isValid && onNext) {
                  onNext(value.replace(/\D/g, ''))
                }
              }}
              disabled={!isValid}
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
