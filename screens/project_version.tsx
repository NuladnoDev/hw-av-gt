'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, RefreshCcw } from 'lucide-react'
import { motion } from 'motion/react'

type ProjectVersionProps = {
  onClose?: () => void
}

export default function ProjectVersion({ onClose }: ProjectVersionProps) {
  const [scale, setScale] = useState(1)
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.min(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let timer: number | null = null
    const handleCheck = () => {
      setChecking(true)
      setChecked(false)
      if (timer) {
        window.clearTimeout(timer)
      }
      timer = window.setTimeout(() => {
        setChecking(false)
        setChecked(true)
        timer = null
      }, 1200)
    }
    window.addEventListener('project-check-updates', handleCheck)
    return () => {
      window.removeEventListener('project-check-updates', handleCheck)
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else if (typeof window !== 'undefined') {
      const ev = new Event('close-project-version')
      window.dispatchEvent(ev)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden edit-screen-in"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px]" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <button
              type="button"
              onClick={handleClose}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Назад"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div className="text-[24px] font-bold leading-[1em] text-white font-ttc-bold">
              Настройки
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 w-full flex items-center justify-center"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
            height: 'calc(812px - 56px - var(--home-header-offset))',
          }}
        >
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
              <motion.span
                animate={checking ? { rotate: 360 } : { rotate: 0 }}
                transition={{
                  repeat: checking ? Infinity : 0,
                  repeatType: 'loop',
                  duration: 0.8,
                  ease: 'linear',
                }}
                style={{ display: 'inline-flex' }}
              >
                <RefreshCcw className="w-4 h-4 text-white/70" strokeWidth={2.3} />
              </motion.span>
              <span className="text-sm text-white/80 font-sf-ui-medium">
                Alpha 0.0.1
              </span>
            </div>
            <div className="font-ttc-bold text-white" style={{ fontSize: 28, letterSpacing: 0.4 }}>
              hw-project
            </div>
            {checked && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="text-white/70 font-sf-ui-light"
                style={{ fontSize: 14 }}
              >
                У вас последняя версия сайта
              </motion.div>
            )}
          </div>
        </div>

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ bottom: 0, height: 'env(safe-area-inset-bottom, 0px)' }}
        />
      </div>
    </motion.div>
  )
}
