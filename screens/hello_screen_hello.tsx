'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
    <div className="flex min-h-screen w-full flex-col items-center justify-between bg-black px-6 pb-12 pt-20 overflow-hidden">
      {/* Background gradients for Liquid Glass effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence>
        {!showIosTip ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col items-center justify-center w-full max-w-sm flex-1"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-12"
            >
              <img
                src="/interface/src.svg"
                alt="src"
                className="h-[120px] w-[120px] opacity-90 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center space-y-3"
            >
              <h1 className="text-4xl font-bold tracking-tight text-white font-ttc-bold">
                hw-project
              </h1>
              <p className="text-xl font-light text-white/60">
                Удобно. Быстро. Безопасно.
              </p>
              <button 
                type="button"
                className="text-sm font-medium text-emerald-400/80 hover:text-emerald-400 transition-colors"
              >
                Пользовательское соглашение
              </button>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-16 w-full"
            >
              <button
                type="button"
                className="h-[58px] w-full rounded-2xl bg-white text-black font-bold text-lg shadow-[0_20px_40px_-15px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all hover:bg-zinc-100"
                onClick={() => {
                  if (onNext) {
                    onNext()
                    return
                  }
                  const event = new CustomEvent('hello-next')
                  window.dispatchEvent(event)
                }}
              >
                Далее
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-20 flex flex-col items-center justify-center w-full max-w-sm flex-1"
          >
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl text-center space-y-6">
              <img
                src="/interface/link-broken.svg"
                alt="union"
                className="mx-auto w-16 h-16 opacity-80"
              />
              <div className="space-y-2">
                <h2 className="text-2xl font-light text-white">
                  Ой, похоже у вас <span className="font-medium">iPhone</span>
                </h2>
                <p className="text-white/60 leading-relaxed">
                  В таком случае <span className="text-emerald-400">крайне рекомендуется</span> добавить сайт как <span className="text-white">приложение</span>
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 py-4 border-y border-white/5">
                <img src="/interface/dot-horizontal.svg" alt="dot" className="w-6 h-6 opacity-60" />
                <span className="text-white/40">→</span>
                <img src="/interface/Share.svg" alt="Share" className="w-6 h-6 opacity-60" />
                <span className="text-sm text-white/60">Поделиться</span>
                <span className="text-white/40">→</span>
                <img src="/interface/add-square-03.svg" alt="Add" className="w-6 h-6 opacity-60" />
                <span className="text-sm text-white/60 font-medium">«Домой»</span>
              </div>

              <button
                type="button"
                className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
                onClick={() => setShowIosTip(false)}
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showIosTip && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          type="button"
          ref={loginButtonRef}
          className="relative z-10 text-white/50 hover:text-white/80 transition-colors text-base py-4"
          onClick={() => {
            if (onLogin) {
              onLogin()
              return
            }
            const event = new CustomEvent('hello-login')
            window.dispatchEvent(event)
          }}
        >
          У меня уже есть аккаунт
        </motion.button>
      )}
    </div>
  )
}
