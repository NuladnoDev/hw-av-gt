'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ShieldCheck } from 'lucide-react'

type ModeratorBadgeProps = {
  className?: string
  size?: number
}

export default function ModeratorBadge({ className = '', size = 22 }: ModeratorBadgeProps) {
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
        <motion.div 
          className="flex items-center justify-center"
          style={{ width: size, height: size }}
          animate={{
            y: [0, -3, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ShieldCheck 
            size={size} 
            className="text-violet-400"
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-[-12px] mt-3 z-[100] w-64 p-4 rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl pointer-events-auto"
            style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
          >
            <div className="absolute -top-1.5 left-[16px] w-3 h-3 bg-[#0F0F0F] border-t border-l border-white/10 rotate-45" />
            
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-violet-400 shrink-0" />
                <p className="text-[15px] text-white font-sf-ui-medium leading-none">
                  Модератор
                </p>
              </div>
              <p className="text-[13px] text-white/50 font-sf-ui-light leading-snug text-center">
                Участник команды проекта. Имеет доступ к инструментам модерации и поддержке.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
