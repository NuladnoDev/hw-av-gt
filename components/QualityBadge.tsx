'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

type QualityBadgeProps = {
  className?: string
  size?: number
}

export default function QualityBadge({ className = '', size = 18 }: QualityBadgeProps) {
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
        className={`cursor-pointer ${className}`}
        initial={{ scale: 0, x: -10 }}
        animate={{ scale: 1, x: 0 }}
        whileTap={{ scale: 1.2 }}
        onClick={(e) => {
          e.stopPropagation()
          setShowTooltip(!showTooltip)
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <motion.img
          src="/interface/adv.svg"
          alt="Quality Mark"
          style={{ 
            width: size, 
            height: size,
            filter: 'brightness(0) saturate(100%) invert(88%) sepia(21%) saturate(1478%) hue-rotate(182deg) brightness(101%) contrast(102%)'
          }}
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
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
                Знак качества
              </p>
              <p className="text-[13px] text-white/50 font-sf-ui-light leading-snug">
                Надёжный продавец с отличной репутацией и большим количеством успешных сделок.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
