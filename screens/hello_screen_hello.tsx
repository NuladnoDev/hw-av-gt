'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { AdCardSkeleton } from './ads'

export default function HelloScreen({
  onNext,
  onLogin,
}: {
  onNext?: () => void
  onLogin?: () => void
}) {
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)
  const loginButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || ''
    const ios = /iPhone|iPad|iPod/i.test(ua)
    setIsIOS(ios)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ((navigator as any).standalone === true)
    setIsStandalone(standalone)
    setShowIosTip(ios && !standalone)
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-between bg-black px-6 pb-12 pt-20 overflow-hidden font-ttc-bold relative"
      style={{ 
        '--ads-bottom-offset': '-110px', // Меняй это значение, чтобы опустить ниже (напр. -150px)
      } as React.CSSProperties}
    >
      {/* Background gradients for Liquid Glass effect - MOVED TO TOP to be behind ads */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 45, 0],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            opacity: [0.03, 0.08, 0.03]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white blur-[120px] rounded-full" 
        />
      </div>

      {/* Плывущие скелетоны объявлений на фоне снизу */}
      <div 
        className="absolute left-0 right-0 h-[600px] pointer-events-none opacity-20 z-10 flex flex-col gap-4 overflow-hidden"
        style={{ bottom: 'var(--ads-bottom-offset)' }}
      >
        {/* Мягкая тень-затемнение сверху вниз */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-black via-black/20 to-transparent h-[150px]" />
        
        {/* Затемнение снизу вверх для плавного ухода в пол */}
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-black to-transparent z-20" />

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

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <AnimatePresence>
        {!showIosTip ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-start justify-start w-full max-w-sm flex-1 pt-10"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-left space-y-6"
            >
              <h1 className="text-5xl font-bold tracking-tighter text-white">
                hw-project
              </h1>
              <div className="relative pl-4 border-l border-white/10 max-w-[320px]">
                <p className="text-[14px] font-light leading-relaxed text-white/40 italic" style={{ fontFamily: 'var(--font-inter)' }}>
                  &ldquo;Главная цель в создании площадки, это её удобство и работоспобность. -  hw-project. <span className="not-italic">Безопасно</span>, <span className="not-italic">Удобно</span>, <span className="not-italic">Анонимно</span>.&rdquo;
                </p>
                <p className="mt-2 text-[12px] font-medium text-white/20 uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>
                  &mdash; Разработчик
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-16 w-full flex flex-col items-start gap-8"
            >
              <button
                type="button"
                className="h-[64px] w-[64px] rounded-full bg-white text-black flex items-center justify-center transition-all active:scale-[0.9] hover:bg-white/90 shadow-lg shadow-white/5 group"
                onClick={() => {
                  if (onNext) {
                    onNext()
                    return
                  }
                  const event = new CustomEvent('hello-next')
                  window.dispatchEvent(event)
                }}
              >
                <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-all text-sm"
                style={{ fontFamily: 'var(--font-inter)' }}
                onClick={() => {
                  if (onLogin) {
                    onLogin()
                    return
                  }
                  const event = new CustomEvent('hello-login')
                  window.dispatchEvent(event)
                }}
              >
                <span className="font-light">У меня</span>
                <span className="font-normal">уже есть аккаунт</span>
                <ChevronRight size={14} className="opacity-50" />
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="relative z-20 flex flex-col items-center justify-center w-full max-w-sm flex-1 px-4"
          >
            <div className="glass-card w-full rounded-[40px] p-8 text-center space-y-8">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <img
                  src="/interface/link-broken.svg"
                  alt="union"
                  className="w-10 h-10 brightness-150"
                />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white leading-tight">
                  Почти готово!
                </h2>
                <p className="text-white/40 leading-relaxed text-lg">
                  Для лучшего опыта на <span className="text-white font-medium">iOS</span>, добавьте проект на главный экран
                </p>
              </div>
              
              <div className="flex items-center justify-between gap-2 py-6 border-y border-white/5 px-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <img src="/interface/Share.svg" alt="Share" className="w-5 h-5 opacity-60" />
                  </div>
                  <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Share</span>
                </div>
                <div className="text-white/20">→</div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <img src="/interface/add-square-03.svg" alt="Add" className="w-5 h-5 opacity-60" />
                  </div>
                  <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Домой</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all active:scale-[0.95]"
                onClick={() => setShowIosTip(false)}
              >
                Понятно
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
