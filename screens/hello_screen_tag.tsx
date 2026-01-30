'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

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
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />
        
        {/* Background Decorative Element */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/5 blur-[80px] rounded-full pointer-events-none" />

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
          className="absolute left-6 top-[50px] z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
          aria-label="Назад"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 px-6 flex flex-col items-center pt-[140px]"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="mb-10 relative"
          >
            <div className="absolute inset-0 bg-white/10 blur-[60px] rounded-full" />
            <div className="relative flex h-[100px] w-[100px] items-center justify-center rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl">
              <img
                src="/interface/tag.svg"
                alt="tag"
                className="h-14 w-14 opacity-90"
              />
            </div>
          </motion.div>
          
          <div className="mb-3 w-full text-center text-[32px] font-bold leading-[1.2em] text-white font-ttc-bold tracking-tight">
            Выберите тег
          </div>
          <div className="mb-12 w-full text-center text-[16px] leading-[1.4em] text-white/50 font-sf-ui-regular max-w-[280px]">
            Укажите уникальный тег для вашего профиля
          </div>

          <div className="w-full space-y-8">
            <div className="flex flex-col gap-3">
              <label className="ml-1 text-[13px] font-sf-ui-medium text-white/30 uppercase tracking-[0.1em]">
                Ваш уникальный тег
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

            <button
              type="button"
              className={`h-[60px] w-full rounded-2xl text-center transition-all duration-300 relative overflow-hidden ${
                validFormat && !checking
                  ? 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/10 text-white/20'
              }`}
              onClick={() => {
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
              disabled={!validFormat || checking}
            >
              <span className="inline-block text-[18px] font-bold leading-[1.25em] tracking-tight font-vk-demi">
                {checking ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span>Проверка...</span>
                  </div>
                ) : 'Продолжить'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
