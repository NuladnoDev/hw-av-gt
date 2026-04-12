'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft } from 'lucide-react'

type ShopDecoration = {
  id: string
  name: string
  desc: string
  color: string
  pro: boolean
  icon: React.ReactNode
  preview: React.ReactNode
  animation: React.ReactNode
}

function StarsPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(16)].map((_, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
          borderRadius: '50%', background: '#fff',
          left: `${(i % 8) * 12 + 2}%`,
          top: Math.floor(i / 8) * 40 + (i % 4) * 12,
          boxShadow: '0 0 4px 2px rgba(255,255,255,0.6)',
        }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 0.3] }}
          transition={{ duration: 1.4 + i * 0.18, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  )
}

function SnowPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(16)].map((_, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: 4 + (i % 3), height: 4 + (i % 3),
          borderRadius: '50%', background: '#e0f4ff',
          left: `${(i % 8) * 12 + 2}%`, top: -8,
          boxShadow: '0 0 3px 1px rgba(200,240,255,0.7)',
        }}
          animate={{ y: [0, 95], opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, delay: i * 0.2, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

function SakuraPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(14)].map((_, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: 8, height: 8,
          borderRadius: '50% 0 50% 0', background: '#ffb7c5',
          left: `${(i % 7) * 14 + 1}%`, top: -8,
        }}
          animate={{ y: [0, 95], x: [0, i % 2 === 0 ? 10 : -10], rotate: [0, 180], opacity: [0, 0.9, 0] }}
          transition={{ duration: 3 + i * 0.2, repeat: Infinity, delay: i * 0.25, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function GalaxyPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3), height: 2 + (i % 3),
            left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%`,
            background: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#818cf8' : '#fff',
            filter: 'drop-shadow(0 0 3px rgba(167,139,250,0.8))',
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 2 + i * 0.15, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
      {[...Array(3)].map((_, i) => (
        <motion.div key={`ring-${i}`}
          className="absolute rounded-full border"
          style={{
            width: 40 + i * 25, height: 40 + i * 25,
            left: '50%', top: '50%',
            marginLeft: -(20 + i * 12.5), marginTop: -(20 + i * 12.5),
            borderColor: `rgba(167,139,250,${0.15 - i * 0.04})`,
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8 + i * 4, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

function PlasmaPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <motion.div key={i}
          className="absolute"
          style={{
            left: `${10 + i * 11}%`, top: 0,
            width: 2, height: 30 + (i % 3) * 15,
            background: i % 2 === 0
              ? 'linear-gradient(180deg, #60a5fa, transparent)'
              : 'linear-gradient(180deg, #a78bfa, transparent)',
            filter: `drop-shadow(0 0 4px ${i % 2 === 0 ? '#60a5fa' : '#a78bfa'})`,
            borderRadius: 2,
          }}
          animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0], y: [0, 20, 0] }}
          transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, delay: i * 0.2, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function CrystalsPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute',
            left: `${8 + i * 9}%`, top: -10,
            width: 0, height: 0,
            borderLeft: `${4 + (i % 3) * 2}px solid transparent`,
            borderRight: `${4 + (i % 3) * 2}px solid transparent`,
            borderBottom: `${10 + (i % 3) * 4}px solid ${i % 3 === 0 ? 'rgba(147,197,253,0.7)' : i % 3 === 1 ? 'rgba(196,181,253,0.7)' : 'rgba(167,243,208,0.7)'}`,
            filter: 'drop-shadow(0 0 4px rgba(147,197,253,0.5))',
          }}
          animate={{ y: [0, 100], rotate: [0, 180], opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, delay: i * 0.25, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function RosesPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: 8 + (i % 3) * 3, height: 6 + (i % 3) * 2,
            left: `${(i * 8) % 90}%`, top: -8,
            background: i % 2 === 0 ? '#be123c' : '#9f1239',
            borderRadius: '50% 0 50% 50%',
          }}
          animate={{ y: [0, 95], x: [0, i % 2 === 0 ? 6 : -6], rotate: [0, 120], opacity: [0, 0.9, 0] }}
          transition={{ duration: 3 + i * 0.2, repeat: Infinity, delay: i * 0.2, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function FireworksPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(3)].map((_, burst) => (
        [...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
          return (
            <motion.div key={`${burst}-${i}`}
              className="absolute rounded-full"
              style={{
                width: 3, height: 3,
                left: `${25 + burst * 25}%`, top: '50%',
                background: colors[(burst + i) % colors.length],
                filter: `drop-shadow(0 0 3px ${colors[(burst + i) % colors.length]})`,
              }}
              animate={{
                x: [0, Math.cos(angle) * 35],
                y: [0, Math.sin(angle) * 35],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: burst * 0.8 + i * 0.05, ease: 'easeOut' }}
            />
          )
        })
      ))}
    </div>
  )
}

function MoonStarsPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      <motion.div
        className="absolute"
        style={{ left: '50%', top: 10, marginLeft: -12 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(253,224,71,0.9)" />
        </svg>
      </motion.div>
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 2), height: 2 + (i % 2),
            left: `${(i * 19 + 5) % 95}%`,
            top: `${20 + (i * 13) % 60}%`,
            background: '#fde047',
            filter: 'drop-shadow(0 0 2px rgba(253,224,71,0.8))',
          }}
          animate={{ opacity: [0.1, 1, 0.1], scale: [0.5, 1.3, 0.5] }}
          transition={{ duration: 1.5 + i * 0.2, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function DragonPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(14)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: 5 + (i % 4) * 3, height: 5 + (i % 4) * 3,
            left: `${(i % 7) * 14}%`, bottom: 4,
            background: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#dc2626' : '#fbbf24',
            filter: 'blur(1px)',
          }}
          animate={{ y: [0, -(80 + i * 5)], opacity: [0, 0.85, 0], scale: [0.8, 1.3, 0.4] }}
          transition={{ duration: 1.2 + i * 0.1, repeat: Infinity, delay: i * 0.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function DiamondsPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute',
            left: `${8 + i * 9}%`, top: -8,
            width: 8 + (i % 3) * 3, height: 8 + (i % 3) * 3,
            background: i % 3 === 0
              ? 'linear-gradient(135deg, #bae6fd, #7dd3fc)'
              : i % 3 === 1
              ? 'linear-gradient(135deg, #e0e7ff, #c7d2fe)'
              : 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
            transform: 'rotate(45deg)',
            filter: 'drop-shadow(0 0 4px rgba(147,197,253,0.6))',
          }}
          animate={{ y: [0, 95], opacity: [0, 0.9, 0], rotate: [45, 225] }}
          transition={{ duration: 2 + i * 0.2, repeat: Infinity, delay: i * 0.2, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

function VortexPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const r = 20 + (i % 4) * 8
        return (
          <motion.div key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + (i % 3), height: 3 + (i % 3),
              left: '50%', top: '50%',
              background: i % 2 === 0 ? '#818cf8' : '#c084fc',
              filter: 'drop-shadow(0 0 3px rgba(129,140,248,0.7))',
            }}
            animate={{
              x: [Math.cos(angle) * r, Math.cos(angle + Math.PI * 2) * r],
              y: [Math.sin(angle) * r, Math.sin(angle + Math.PI * 2) * r],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.1, ease: 'linear' }}
          />
        )
      })}
    </div>
  )
}

function NaturePreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute',
            left: `${(i * 10) % 90}%`, top: -8,
            width: 10, height: 10,
            borderRadius: i % 2 === 0 ? '50% 0 50% 0' : '0 50% 0 50%',
            background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#86efac' : '#bbf7d0',
          }}
          animate={{ y: [0, 95], x: [0, i % 2 === 0 ? 8 : -8], rotate: [0, 90], opacity: [0, 0.9, 0] }}
          transition={{ duration: 3.5 + i * 0.2, repeat: Infinity, delay: i * 0.3, ease: 'easeIn' }}
        />
      ))}
      {[...Array(5)].map((_, i) => (
        <motion.div key={`flower-${i}`}
          className="absolute rounded-full"
          style={{
            width: 6, height: 6,
            left: `${15 + i * 18}%`, top: -6,
            background: i % 2 === 0 ? '#f9a8d4' : '#fde68a',
          }}
          animate={{ y: [0, 95], opacity: [0, 0.8, 0] }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: i * 0.4 + 0.5 }}
        />
      ))}
    </div>
  )
}

function FrostPreview() {
  return (
    <div className="relative w-full h-[90px] overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          className="absolute"
          style={{ left: `${5 + i * 16}%`, bottom: 0 }}
          animate={{ scaleY: [0, 1], opacity: [0, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', delay: i * 0.3 }}
        >
          <svg width="16" height="40" viewBox="0 0 16 40" fill="none">
            <line x1="8" y1="40" x2="8" y2="0" stroke="#bae6fd" strokeWidth="1.5"/>
            <line x1="2" y1="30" x2="14" y2="20" stroke="#bae6fd" strokeWidth="1"/>
            <line x1="14" y1="30" x2="2" y2="20" stroke="#bae6fd" strokeWidth="1"/>
            <line x1="2" y1="15" x2="14" y2="8" stroke="#bae6fd" strokeWidth="0.8"/>
            <line x1="14" y1="15" x2="2" y2="8" stroke="#bae6fd" strokeWidth="0.8"/>
          </svg>
        </motion.div>
      ))}
    </div>
  )
}

const SHOP_DECORATIONS: ShopDecoration[] = [
  { id: 'stars', name: 'Звёзды', desc: 'Мерцающие звёзды', color: '#ffffff', pro: true, preview: <StarsPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#fff" strokeWidth="1.5" fill="rgba(255,255,255,0.15)"/><circle cx="19" cy="4" r="1.2" fill="#fff"/><circle cx="5" cy="7" r="0.9" fill="#fff"/><circle cx="20" cy="14" r="0.8" fill="#fff"/></svg> },
  { id: 'snow', name: 'Снег', desc: 'Падающие снежинки', color: '#e0f4ff', pro: true, preview: <SnowPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0f4ff" strokeWidth="1.6" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/><circle cx="12" cy="12" r="2" fill="#e0f4ff" stroke="none"/></svg> },
  { id: 'sakura', name: 'Сакура', desc: 'Лепестки сакуры', color: '#ffb7c5', pro: true, preview: <SakuraPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="2.5" fill="#ffb7c5"/><ellipse cx="12" cy="6" rx="2.5" ry="4.5" fill="#ffb7c5" opacity="0.75"/><ellipse cx="12" cy="18" rx="2.5" ry="4.5" fill="#ffb7c5" opacity="0.75"/><ellipse cx="6" cy="12" rx="4.5" ry="2.5" fill="#ffb7c5" opacity="0.75"/><ellipse cx="18" cy="12" rx="4.5" ry="2.5" fill="#ffb7c5" opacity="0.75"/></svg> },
  { id: 'galaxy', name: 'Галактика', desc: 'Вращающиеся звёзды и туманность', color: '#a78bfa', pro: true, preview: <GalaxyPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#a78bfa" strokeWidth="1.2" opacity="0.4"/><circle cx="12" cy="12" r="5" stroke="#818cf8" strokeWidth="1.2" opacity="0.5"/><circle cx="12" cy="12" r="2" fill="#a78bfa"/><circle cx="18" cy="7" r="1" fill="#c4b5fd"/><circle cx="5" cy="16" r="0.8" fill="#818cf8"/></svg> },
  { id: 'plasma', name: 'Плазма', desc: 'Неоновые молнии бьют вниз', color: '#60a5fa', pro: true, preview: <PlasmaPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(96,165,250,0.15)"/></svg> },
  { id: 'crystals', name: 'Кристаллы', desc: 'Падающие геометрические кристаллы', color: '#93c5fd', pro: true, preview: <CrystalsPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polygon points="12,2 20,8 17,18 7,18 4,8" stroke="#93c5fd" strokeWidth="1.4" fill="rgba(147,197,253,0.12)"/><line x1="12" y1="2" x2="12" y2="18" stroke="#93c5fd" strokeWidth="0.8" opacity="0.5"/><line x1="4" y1="8" x2="20" y2="8" stroke="#93c5fd" strokeWidth="0.8" opacity="0.5"/></svg> },
  { id: 'roses', name: 'Розы', desc: 'Тёмно-красные лепестки роз', color: '#be123c', pro: true, preview: <RosesPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" fill="#be123c" opacity="0.9"/><ellipse cx="12" cy="5" rx="2" ry="3.5" fill="#be123c" opacity="0.7"/><ellipse cx="12" cy="15" rx="2" ry="3.5" fill="#9f1239" opacity="0.7"/><ellipse cx="7" cy="10" rx="3.5" ry="2" fill="#be123c" opacity="0.7"/><ellipse cx="17" cy="10" rx="3.5" ry="2" fill="#9f1239" opacity="0.7"/><line x1="12" y1="18" x2="12" y2="22" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: 'fireworks', name: 'Фейерверк', desc: 'Периодические взрывы частиц', color: '#f59e0b', pro: true, preview: <FireworksPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="1.5" fill="#f59e0b"/><line x1="12" y1="8" x2="12" y2="3" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/><line x1="12" y1="8" x2="17" y2="5" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round"/><line x1="12" y1="8" x2="17" y2="11" stroke="#8b5cf6" strokeWidth="1.4" strokeLinecap="round"/><line x1="12" y1="8" x2="7" y2="11" stroke="#06b6d4" strokeWidth="1.4" strokeLinecap="round"/><line x1="12" y1="8" x2="7" y2="5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/><circle cx="5" cy="18" r="1" fill="#ef4444"/><circle cx="19" cy="16" r="1" fill="#8b5cf6"/></svg> },
  { id: 'moonstars', name: 'Луна и звёзды', desc: 'Луна и мерцающие звёзды', color: '#fde047', pro: true, preview: <MoonStarsPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="rgba(253,224,71,0.85)"/><circle cx="19" cy="5" r="1" fill="#fde047"/><circle cx="4" cy="8" r="0.8" fill="#fde047"/><circle cx="20" cy="17" r="0.7" fill="#fde047"/></svg> },
  { id: 'dragon', name: 'Дракон', desc: 'Огненный дым дракона', color: '#f97316', pro: true, preview: <DragonPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2c-1 2-3 3-3 6 0 2 1.5 3.5 3 3.5S15 10 15 8c0-3-2-4-3-6z" fill="#f97316" opacity="0.9"/><path d="M8 14c-2 1-3 3-2 5s3 3 5 2" stroke="#f97316" strokeWidth="1.4" strokeLinecap="round"/><path d="M14 13c1 0 3 1 4 3" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round"/><circle cx="10" cy="8" r="0.8" fill="#fbbf24"/></svg> },
  { id: 'diamonds', name: 'Бриллианты', desc: 'Падающие сверкающие ромбы', color: '#7dd3fc', pro: true, preview: <DiamondsPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polygon points="12,3 20,10 12,21 4,10" stroke="#7dd3fc" strokeWidth="1.4" fill="rgba(125,211,252,0.15)"/><line x1="4" y1="10" x2="20" y2="10" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.6"/><line x1="12" y1="3" x2="4" y2="10" stroke="#bae6fd" strokeWidth="0.6" opacity="0.5"/><line x1="12" y1="3" x2="20" y2="10" stroke="#bae6fd" strokeWidth="0.6" opacity="0.5"/></svg> },
  { id: 'vortex', name: 'Вихрь', desc: 'Частицы закручиваются по спирали', color: '#818cf8', pro: true, preview: <VortexPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 12c0 0 4-2 5-5s-1-5-4-4-5 4-4 7 4 5 7 4" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round"/><path d="M12 12c0 0-4 2-5 5s1 5 4 4 5-4 4-7" stroke="#c084fc" strokeWidth="1.2" strokeLinecap="round"/><circle cx="12" cy="12" r="1.5" fill="#818cf8"/></svg> },
  { id: 'nature', name: 'Природа', desc: 'Листья, цветы и лепестки', color: '#4ade80', pro: true, preview: <NaturePreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 22V12M12 12C12 12 7 10 6 5c3 0 6 3 6 7zM12 12C12 12 17 10 18 5c-3 0-6 3-6 7z" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="18" r="1.5" fill="#f9a8d4" opacity="0.8"/><circle cx="16" cy="17" r="1.2" fill="#fde68a" opacity="0.8"/></svg> },
  { id: 'frost', name: 'Иней', desc: 'Кристаллы льда растут снизу', color: '#bae6fd', pro: true, preview: <FrostPreview />, animation: null,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round"><line x1="12" y1="22" x2="12" y2="8"/><line x1="7" y1="17" x2="17" y2="13"/><line x1="17" y1="17" x2="7" y2="13"/><line x1="7" y1="12" x2="17" y2="9"/><line x1="17" y1="12" x2="7" y2="9"/></svg> },
]

function DecorationDetailSheet({ item, onClose }: { item: ShopDecoration; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[310] flex items-end justify-center pointer-events-none">
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 380 }}
          className="w-full pointer-events-auto relative"
          style={{ borderRadius: '28px 28px 0 0', background: '#0e0e0e', borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-20 pointer-events-none">
            <div className="w-10 h-1 rounded-full bg-white/25" />
          </div>

          {/* Hero preview */}
          <div className="relative overflow-hidden flex flex-col items-center justify-center pt-10 pb-6"
            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', borderRadius: '28px 28px 0 0', minHeight: 150 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ width: 60 + i * 30, height: 60 + i * 30, left: `${15 + i * 20}%`, top: `${-10 + i * 15}%`, background: 'rgba(99,102,241,0.07)' }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                />
              ))}
            </div>
            <div className="relative z-10 w-full flex flex-col items-center gap-2">
              <div className="w-full">{item.preview}</div>
              <div className="text-[18px] font-ttc-bold text-white">{item.name}</div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 border border-white/15">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
                  <path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z" />
                </svg>
                <span className="font-ttc-bold text-white tracking-wide inline-flex items-center" style={{ fontSize: 12, lineHeight: 1, paddingTop: 1 }}>PRO</span>
              </div>
            </div>
          </div>

          <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
            <div className="bg-white/[0.07] rounded-[16px] border border-white/[0.06] mb-5 overflow-hidden">
              {[
                { icon: <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/>, label: 'AI генерация описаний' },
                { icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>, label: 'До 50 активных объявлений' },
                { icon: <><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></>, label: 'Значок hw-pro в профиле' },
                { icon: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>, label: 'Приоритетная поддержка' },
              ].map((f, i, arr) => (
                <div key={i}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">{f.icon}</svg>
                    <span className="text-[13px] font-sf-ui-medium text-white/80">{f.label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-white/[0.05] mx-4" />}
                </div>
              ))}
            </div>
            <button type="button"
              className="w-full h-[52px] rounded-full font-sf-ui-medium text-[15px] text-black active:scale-[0.97] transition-all mb-2"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)' }}
              onClick={onClose}
            >
              Оформить hw-pro — 199 ₽/мес
            </button>
            <button type="button"
              className="w-full h-[44px] rounded-full text-[14px] text-white/35 font-sf-ui-light active:opacity-60 transition-all"
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default function DecorationShop({ onClose, avatarUrl, gradient, initialLetter, tagText, description }: {
  onClose: () => void
  avatarUrl: string | null
  gradient: string
  initialLetter: string
  tagText?: string
  description?: string
}) {
  const [selectedItem, setSelectedItem] = useState<ShopDecoration | null>(null)

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-0 z-[250] bg-[#0a0a0a] flex flex-col overflow-x-hidden"
    >
      {/* Header */}
      <div className="flex items-center px-4 flex-shrink-0 border-b border-white/[0.05]"
        style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10">
          <ChevronLeft size={22} className="text-white" />
        </button>
        <span className="ml-3 text-[17px] font-sf-ui-medium text-white flex-1">Магазин украшений</span>
        <div className="flex items-center gap-1 rounded-full px-2.5 py-1 border border-white/15"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
            <path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z" />
          </svg>
          <span className="font-ttc-bold text-white tracking-wide inline-flex items-center" style={{ fontSize: 10, lineHeight: 1, paddingTop: 1 }}>PRO</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>

        {/* Превью профиля */}
        <div className="rounded-[20px] p-4 overflow-hidden relative" style={{ background: '#141414' }}>
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0" style={{ width: 84, height: 84 }}>
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white font-vk-demi text-[32px]"
                style={{ background: avatarUrl ? '#0a0a0a' : gradient, position: 'relative', zIndex: 2 }}
              >
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initialLetter}
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-2">
              <div className="text-[17px] font-sf-ui-medium text-white">{tagText || 'user'}</div>
              <div className="text-[12px] text-white/35 font-sf-ui-light mt-0.5">Был(а) недавно</div>
              {description && <div className="text-[12px] text-white/45 font-sf-ui-light mt-1.5 line-clamp-2">{description}</div>}
            </div>
          </div>
        </div>

        {/* PRO info */}
        <div className="rounded-[20px] p-5" style={{ background: '#141414' }}>
          <div className="text-[15px] font-sf-ui-medium text-white/85 mb-1">Украшения PRO</div>
          <div className="text-[13px] text-white/40 font-sf-ui-light leading-relaxed">
            Эксклюзивные эффекты для подписчиков hw-pro. Нажми на любое чтобы узнать подробнее.
          </div>
        </div>

        {/* Список */}
        <div className="rounded-[20px] overflow-hidden" style={{ background: '#141414' }}>
          {SHOP_DECORATIONS.map((item, idx, arr) => (
            <div key={item.id}>
              <motion.button type="button" whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedItem(item)}
                className="w-full text-left px-5 py-4 flex items-center gap-4 transition-colors active:bg-white/[0.03]"
              >
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}18` }}
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-sf-ui-medium text-white/90">{item.name}</div>
                  <div className="text-[12px] text-white/35 font-sf-ui-light">{item.desc}</div>
                </div>
                <div className="flex items-center gap-1 rounded-full px-2.5 py-1 border border-white/15 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
                    <path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z" />
                  </svg>
                  <span className="font-ttc-bold text-white tracking-wide inline-flex items-center" style={{ fontSize: 11, lineHeight: 1, paddingTop: 1 }}>PRO</span>
                </div>
              </motion.button>
              {idx < arr.length - 1 && <div className="h-px bg-white/[0.04] mx-5" />}
            </div>
          ))}
        </div>

        <div className="h-4" />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <DecorationDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
