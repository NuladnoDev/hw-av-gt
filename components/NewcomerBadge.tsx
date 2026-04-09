'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function NewcomerBadge({ size = 20 }: { size?: number }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showTooltip) return
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTooltip])

  return (
    <div className="relative inline-flex items-center justify-center">
      <motion.div
        className="cursor-pointer"
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileTap={{ scale: 1.2 }}
        onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip) }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.svg
          width={size} height={size} viewBox="0 0 24 24" fill="none"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx="12" cy="12" r="10" fill="rgba(200,200,200,0.1)" stroke="rgba(200,200,200,0.35)" strokeWidth="1.2"/>
          <path d="M12 17V11" stroke="rgba(220,220,220,0.8)" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M12 13C12 13 9 12 8 9C10 9 12 11 12 13Z" fill="rgba(220,220,220,0.75)"/>
          <path d="M12 11C12 11 15 10 16 7C14 7 12 9 12 11Z" fill="rgba(220,220,220,0.9)"/>
          <path d="M9 17h6" stroke="rgba(200,200,200,0.5)" strokeWidth="1.4" strokeLinecap="round"/>
        </motion.svg>
      </motion.div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-[100] w-56 p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl pointer-events-auto"
            style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F0F0F] border-t border-l border-white/10 rotate-45" />
            <div className="relative text-center">
              <p className="text-[15px] text-white font-sf-ui-medium leading-tight mb-2">
                Новичок
              </p>
              <p className="text-[13px] text-white/50 font-sf-ui-light leading-snug">
                Новичок на платформе. Это, кстати, о вас!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
