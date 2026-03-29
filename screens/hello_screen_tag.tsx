'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AdCardSkeleton } from './ads'

export default function HelloScreenTag({
  onBack,
  onNext,
  initialValue,
  initialError,
}: {
  onBack?: () => void
  onNext?: (tag: string) => void
  initialValue?: string
  initialError?: string
}) {
  const [value, setValue] = useState(initialValue ?? '')
  const [error, setError] = useState(initialError ?? '')
  const [isAdult, setIsAdult] = useState(false)
  const [scale, setScale] = useState(1)
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState(false)
  const timerRef = useRef<number | null>(null)

  const tagRegex = /^[\p{L}\p{N}.\-_]+$/u
  const trimmed = value.trim()
  const validLength = trimmed.length >= 3 && trimmed.length <= 12
  const validFormat = validLength && tagRegex.test(trimmed)
  const formatError =
    trimmed.length > 0 && trimmed.length < 3
      ? 'минимум 3 символа'
      : trimmed.length > 12
      ? 'максимум 12 символов'
      : trimmed.length > 0 && !tagRegex.test(trimmed)
      ? 'неверный формат тега'
      : ''
  const fieldError = error || formatError
  const showNotice = false
  const handleValueChange = (next: string) => {
    setValue(next)
    if (error) setError('')
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setAvailable(false)
    setChecking(false)
  }

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

  

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden"
      style={{ 
        '--ads-bottom-offset': '-140px',
      } as React.CSSProperties}
    >
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />
        
        {/* Плывущие скелетоны объявлений на фоне снизу */}
        <div 
          className="absolute left-0 right-0 h-[600px] pointer-events-none opacity-[0.15] z-0 flex flex-col gap-4 overflow-hidden"
          style={{ bottom: 'var(--ads-bottom-offset)' }}
        >
          {/* Мягкая тень-затемнение сверху вниз */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent h-[150px]" />

          {/* Первый ряд */}
          <div className="flex w-full overflow-hidden">
            <motion.div 
              className="flex gap-4 flex-nowrap"
              animate={{ x: [0, -1500] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={`row1-${i}`} className="w-[180px] flex-shrink-0 scale-90">
                  <AdCardSkeleton />
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Второй ряд (в обратную сторону + смещение) */}
          <div className="flex w-full overflow-hidden ml-[-100px]">
            <motion.div 
              className="flex gap-4 flex-nowrap"
              animate={{ x: [-1500, 0] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={`row2-${i}`} className="w-[180px] flex-shrink-0 scale-90">
                  <AdCardSkeleton />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Затемнение снизу вверх до кнопки */}
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent z-10 pointer-events-none" />

        {/* Background Decorative Element */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-white/[0.01] blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/[0.01] blur-[80px] rounded-full pointer-events-none" />

        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack()
              return
            }
            const event = new CustomEvent('tag-back')
            window.dispatchEvent(event)
          }}
          className="absolute left-6 top-[50px] z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
          aria-label="Назад"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-x-0 top-0 bottom-0 px-6 flex flex-col items-start pt-[140px] z-20 pointer-events-none"
        >
          <div className="pointer-events-auto w-full">
            <div className="mb-2 w-full text-left text-[32px] font-bold leading-[1.2em] text-white font-ttc-bold tracking-tight text-shadow-sm">
              Имя пользователя
            </div>
            <div className="mb-8 w-full text-left text-[16px] leading-[1.4em] text-white/50 font-light max-w-[280px]" style={{ fontFamily: 'var(--font-inter)' }}>
              Укажите уникальное имя для вашего профиля
            </div>

            <div className="w-full space-y-8">
              <div className="flex flex-col gap-3">
                <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                  Ваше имя пользователя
                </label>
                <div className="relative w-full group">
                  <input
                    value={value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    placeholder="например, durov"
                    className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-6 pr-6 text-[18px] leading-[1.4em] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 backdrop-blur-md"
                    autoFocus
                  />
                  <AnimatePresence>
                    {fieldError && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#FF453A] font-sf-ui-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg"
                      >
                        {fieldError}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 18+ Checkbox */}
              <div 
                className="flex items-center gap-3 cursor-pointer group select-none"
                onClick={() => setIsAdult(!isAdult)}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isAdult ? 'bg-white border-white' : 'bg-transparent border-white/20 group-hover:border-white/40'}`}>
                  {isAdult && <Check size={16} className="text-black" strokeWidth={3} />}
                </div>
                <span className={`text-[15px] transition-colors duration-300 ${isAdult ? 'text-white/80' : 'text-white/40'}`}>
                  Мне есть 18 лет
                </span>
              </div>

              <button
                type="button"
                className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                  validFormat && !checking && isAdult
                    ? 'bg-white text-black active:scale-[0.9]'
                    : 'bg-white/10 text-white/20'
                }`}
                onClick={() => {
                  if (!isAdult) return
                  if (!validLength) {
                    setError(trimmed.length < 3 ? 'минимум 3 символа' : 'максимум 12 символов')
                    return
                  }
                  if (!tagRegex.test(trimmed)) {
                    setError('неверный формат тега')
                    return
                  }
                  ;(async () => {
                    setChecking(true)
                    const client = getSupabase()
                    if (!client) {
                      const usersRaw = window.localStorage.getItem('hw-users')
                      const users: Array<{ tag: string }> = usersRaw ? JSON.parse(usersRaw) : []
                      const takenLocal = users.some((u) => u.tag === trimmed)
                      if (takenLocal) {
                        setError('тег занят')
                        setChecking(false)
                        return
                      }
                      setChecking(false)
                      if (onNext) {
                        onNext(trimmed)
                        return
                      }
                      const event = new CustomEvent('tag-next', { detail: { value } })
                      window.dispatchEvent(event)
                      return
                    }
                    const { count, error: qErr } = await client
                      .from('profiles')
                      .select('tag', { count: 'exact', head: true })
                      .eq('tag', trimmed)
                    if (qErr) {
                      setChecking(false)
                      if (onNext) {
                        onNext(trimmed)
                        return
                      }
                      const event = new CustomEvent('tag-next', { detail: { value } })
                      window.dispatchEvent(event)
                      return
                    }
                    const taken = typeof count === 'number' ? count > 0 : false
                    if (taken) {
                      setError('тег занят')
                      setChecking(false)
                      return
                    }
                    setChecking(false)
                    if (onNext) {
                      onNext(trimmed)
                      return
                    }
                    const event = new CustomEvent('tag-next', { detail: { value } })
                    window.dispatchEvent(event)
                  })()
                }}
                disabled={!validFormat || checking || !isAdult}
              >
                {checking ? (
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <ChevronRight size={28} className={`transition-transform ${isAdult ? 'group-hover:translate-x-0.5' : ''}`} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      <style jsx>{`
      `}</style>
    </div>
  )
}
