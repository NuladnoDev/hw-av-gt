'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AdCardSkeleton } from './ads'

export default function HelloScreenPasswordCreate({
  onBack,
  onNext,
  initialError,
}: {
  onBack?: () => void
  onNext?: (password: string) => void
  initialError?: string
}) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [scale, setScale] = useState(1)
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [submitError, setSubmitError] = useState(initialError ?? '')

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

  const errorToShow = submitError || initialError || ''

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
            const event = new CustomEvent('password-back')
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
              Создайте пароль
            </div>
            <div className="mb-8 w-full text-left text-[16px] leading-[1.4em] text-white/50 font-light max-w-[280px]" style={{ fontFamily: 'var(--font-inter)' }}>
              Придумайте надёжный пароль для вашего профиля
            </div>

            <div className="w-full space-y-6">
              <div className="flex flex-col gap-3">
                <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                  Пароль
                </label>
                <div className="relative w-full group">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={show ? 'text' : 'password'}
                    placeholder="пароль"
                    className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-6 pr-24 text-[18px] leading-[1.4em] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 backdrop-blur-md"
                  />
                  <AnimatePresence>
                    {passwordError && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#FF453A] font-sf-ui-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg"
                      >
                        {passwordError}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {password.length > 0 && !passwordError && (
                    <span
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer select-none text-[13px] text-white/20 hover:text-white/50 transition-colors uppercase font-bold tracking-wider"
                    >
                      {show ? 'скрыть' : 'показать'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                  Введите пароль ещё раз
                </label>
                <div className="relative w-full group">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="пароль"
                    className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-6 pr-24 text-[18px] leading-[1.4em] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 backdrop-blur-md"
                  />
                  <AnimatePresence>
                    {confirmError && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#FF453A] font-sf-ui-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg"
                      >
                        {confirmError}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {confirm.length > 0 && !confirmError && (
                    <span
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer select-none text-[13px] text-white/20 hover:text-white/50 transition-colors uppercase font-bold tracking-wider"
                    >
                      {showConfirm ? 'скрыть' : 'показать'}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                  password.length >= 6 && confirm === password
                    ? 'bg-white text-black active:scale-[0.9]'
                    : 'bg-white/10 text-white/20'
                }`}
                onClick={() => {
                  setSubmitError('')
                  setPasswordError('')
                  setConfirmError('')
                  if (password.length < 6) {
                    setPasswordError('минимум 6 символов')
                    return
                  }
                  if (confirm !== password) {
                    setConfirmError('пароли не совпадают')
                    return
                  }
                  if (onNext) {
                    onNext(password)
                    return
                  }
                  const event = new CustomEvent('password-next', { detail: { password } })
                  window.dispatchEvent(event)
                }}
              >
                <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              {errorToShow && (
                <div className="mt-2 w-full text-left text-[14px] leading-[1.3em] text-[#FF453A] font-sf-ui-medium">
                  {errorToShow}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <style jsx>{`
      `}</style>
    </div>
  )
}
