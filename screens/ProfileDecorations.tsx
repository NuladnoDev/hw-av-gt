'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import DecorationShop from './DecorationShop'

export type DecorationId = 'fire' | 'stars' | 'neon' | 'snow' | 'sakura' | 'bubbles' | null

const PRO_DECORATIONS: DecorationId[] = ['stars', 'snow', 'sakura']

// SVG previews for pro decorations shown in the sheet
const PRO_DECORATION_SVG: Record<string, React.ReactNode> = {
  stars: (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
      {[...Array(12)].map((_, i) => (
        <motion.circle key={i}
          cx={10 + (i % 6) * 20} cy={10 + Math.floor(i / 6) * 40 + (i % 3) * 10}
          r={2 + (i % 3)}
          fill="#fff"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.5, 1.4, 0.5] }}
          transition={{ duration: 1.4 + i * 0.18, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </svg>
  ),
  snow: (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
      {[...Array(10)].map((_, i) => (
        <motion.circle key={i}
          cx={10 + (i % 5) * 22} cy={5}
          r={2 + (i % 2)}
          fill="#e0f4ff"
          style={{ filter: 'drop-shadow(0 0 3px rgba(200,240,255,0.8))' }}
          animate={{ y: [0, 75], opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, delay: i * 0.25, ease: 'linear' }}
        />
      ))}
    </svg>
  ),
  sakura: (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
      {[...Array(10)].map((_, i) => (
        <motion.rect key={i}
          x={8 + (i % 5) * 22} y={2}
          width={8} height={8}
          rx={4} ry={2}
          fill="#ffb7c5"
          animate={{ y: [0, 75], x: [0, i % 2 === 0 ? 8 : -8], rotate: [0, 180], opacity: [0, 0.9, 0] }}
          transition={{ duration: 3 + i * 0.2, repeat: Infinity, delay: i * 0.25, ease: 'easeIn' }}
        />
      ))}
    </svg>
  ),
}

const PRO_DECORATION_NAMES: Record<string, string> = {
  stars: 'Звёзды',
  snow: 'Снег',
  sakura: 'Сакура',
}

function ProDecorationSheet({ decorationId, onClose }: { decorationId: DecorationId; onClose: () => void }) {
  if (!decorationId) return null
  const name = PRO_DECORATION_NAMES[decorationId] ?? decorationId

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
          {/* Drag handle — поверх hero */}
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-20 pointer-events-none">
            <div className="w-10 h-1 rounded-full bg-white/25" />
          </div>

          {/* SVG preview — на всю ширину, вплотную к верху */}
          <div className="relative overflow-hidden flex flex-col items-center justify-center py-8 pt-10"
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
            <div className="relative z-10 flex flex-col items-center gap-3">
              {PRO_DECORATION_SVG[decorationId]}
              <div className="text-[18px] font-ttc-bold text-white">{name}</div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 border border-white/15">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)" style={{ flexShrink: 0 }}>
                  <path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z" />
                </svg>
                <span className="font-ttc-bold text-white tracking-wide inline-flex items-center" style={{ fontSize: 12, lineHeight: 1, paddingTop: 1 }}>PRO</span>
              </div>
            </div>
          </div>

          <div className="px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">

            {/* Features compact */}
            <div className="bg-white/[0.07] rounded-[16px] border border-white/[0.06] mb-5 overflow-hidden">
              {[
                { icon: <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"/>, label: 'AI генерация описаний' },
                { icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>, label: 'До 50 активных объявлений' },
                { icon: <><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></>, label: 'Значок hw-pro в профиле' },
                { icon: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>, label: 'Это и другие украшения в подписке' },
              ].map((f, i, arr) => (
                <div key={i}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      {f.icon}
                    </svg>
                    <span className="text-[13px] font-sf-ui-medium text-white/80">{f.label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-white/[0.05] mx-4" />}
                </div>
              ))}
            </div>

            {/* CTA */}
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
              Отмена
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export function AvatarDecoration({ id, size = 84 }: { id: DecorationId; size?: number }) {
  if (!id) return null

  const w = 200
  const h = size + 40
  const top = -(h - size) / 2

  const base: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1,
    left: size - 4,
    top,
    width: w,
    height: h,
    overflow: 'hidden',
    pointerEvents: 'none',
  }

  if (id === 'bubbles') return (
    <div style={base}>
      {[...Array(12)].map((_, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: 8 + (i % 4) * 5, height: 8 + (i % 4) * 5,
          borderRadius: '50%',
          left: (i % 6) * 32 + 4,
          bottom: -10,
          border: `1.5px solid rgba(${i % 2 === 0 ? '147,197,253' : '196,181,253'},0.6)`,
          background: `rgba(${i % 2 === 0 ? '147,197,253' : '196,181,253'},0.08)`,
        }}
          animate={{ y: [0, -(h + 20)], opacity: [0, 0.8, 0], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2.8 + i * 0.25, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
        />
      ))}
    </div>
  )

  if (id === 'fire') return (
    <div style={base}>
      {[...Array(14)].map((_, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#ff6b00' : i % 3 === 1 ? '#ffcc00' : '#ff3300',
          left: (i % 7) * 26, bottom: 4, filter: 'blur(1px)',
        }}
          animate={{ y: [0, -(h + 10)], opacity: [0, 0.9, 0], scale: [0.8, 1.2, 0.5] }}
          transition={{ duration: 1.4 + i * 0.1, repeat: Infinity, delay: i * 0.12, ease: 'easeOut' }}
        />
      ))}
    </div>
  )

  if (id === 'stars') return (
    <div style={base}>
      {[...Array(16)].map((_, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2,
          borderRadius: '50%', background: '#fff',
          left: (i % 8) * 24,
          top: Math.floor(i / 8) * (h / 2) + (i % 4) * (h / 8),
          boxShadow: '0 0 4px 2px rgba(255,255,255,0.6)',
        }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 0.3] }}
          transition={{ duration: 1.4 + i * 0.18, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  )

  if (id === 'neon') return (
    <div style={base}>
      {[...Array(10)].map((_, i) => {
        const c = ['#00ffff','#ff00ff','#00ff88','#ff6600','#ffffff'][i % 5]
        return (
          <motion.div key={i} style={{
            position: 'absolute',
            left: (i % 5) * 38, top: (i % 4) * (h / 4),
            width: 28 + (i % 3) * 18, height: 2,
            background: c, borderRadius: 1,
            boxShadow: `0 0 6px 2px ${c}`,
          }}
            animate={{ opacity: [0.3, 1, 0.3], scaleX: [0.5, 1.3, 0.5] }}
            transition={{ duration: 1.2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          />
        )
      })}
    </div>
  )

  if (id === 'snow') return (
    <div style={base}>
      {[...Array(16)].map((_, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: 4 + (i % 3), height: 4 + (i % 3),
          borderRadius: '50%', background: '#e0f4ff',
          left: (i % 8) * 24, top: -8,
          boxShadow: '0 0 3px 1px rgba(200,240,255,0.7)',
        }}
          animate={{ y: [0, h + 20], opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, delay: i * 0.2, ease: 'linear' }}
        />
      ))}
    </div>
  )

  if (id === 'sakura') return (
    <div style={base}>
      {[...Array(14)].map((_, i) => (
        <motion.div key={i} style={{
          position: 'absolute',
          width: 8, height: 8,
          borderRadius: '50% 0 50% 0', background: '#ffb7c5',
          left: (i % 7) * 28, top: -8,
        }}
          animate={{ y: [0, h + 20], x: [0, i % 2 === 0 ? 10 : -10], rotate: [0, 180], opacity: [0, 0.9, 0] }}
          transition={{ duration: 3 + i * 0.2, repeat: Infinity, delay: i * 0.25, ease: 'easeIn' }}
        />
      ))}
    </div>
  )

  return null
}

const DECORATION_ICONS: Record<string, React.ReactNode> = {
  bubbles: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="16" r="4" stroke="#93c5fd" strokeWidth="1.5" opacity="0.7"/><circle cx="16" cy="10" r="3" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.7"/><circle cx="12" cy="19" r="2" stroke="#93c5fd" strokeWidth="1.2" opacity="0.5"/><circle cx="18" cy="17" r="2.5" stroke="#c4b5fd" strokeWidth="1.2" opacity="0.6"/></svg>,
  fire: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2c0 0-4 4-4 8a4 4 0 0 0 8 0c0-1.5-.5-3-1.5-4C14 8 13 10 12 10s-2-2-2-4c0-1.5.5-3 2-4z" stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 18c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-.8-2.8-2-3.5.3 1-.2 2-1 2.5-.3-1.5-1-2.5-2-3-.5 1.5-1 2.5-1 4z" fill="#ff6b00"/></svg>,
  stars: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#fff" strokeWidth="1.5" fill="rgba(255,255,255,0.15)"/><circle cx="19" cy="4" r="1.5" fill="#fff"/><circle cx="5" cy="7" r="1" fill="#fff"/></svg>,
  neon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#00ffff" strokeWidth="1.8" style={{filter:'drop-shadow(0 0 3px #00ffff)'}}/><circle cx="12" cy="12" r="5" stroke="#ff00ff" strokeWidth="1.5" style={{filter:'drop-shadow(0 0 3px #ff00ff)'}}/><circle cx="12" cy="12" r="2" fill="#00ffff"/></svg>,
  snow: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e0f4ff" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/><circle cx="12" cy="12" r="2" fill="#e0f4ff" stroke="none"/></svg>,
  sakura: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="#ffb7c5"/><ellipse cx="12" cy="6" rx="3" ry="5" fill="#ffb7c5" opacity="0.8"/><ellipse cx="12" cy="18" rx="3" ry="5" fill="#ffb7c5" opacity="0.8"/><ellipse cx="6" cy="12" rx="5" ry="3" fill="#ffb7c5" opacity="0.8"/><ellipse cx="18" cy="12" rx="5" ry="3" fill="#ffb7c5" opacity="0.8"/></svg>,
}

const NAMES: Record<string, string> = { fire:'Огонь', stars:'Звёзды', neon:'Неон', snow:'Снег', sakura:'Сакура' }

export default function ProfileDecorations({
  userId, currentDecoration, avatarUrl, gradient, initialLetter,
  tagText, description, onClose, onSave,
}: {
  userId: string | null
  currentDecoration: DecorationId
  avatarUrl: string | null
  gradient: string
  initialLetter: string
  tagText?: string
  description?: string
  onClose: () => void
  onSave: (id: DecorationId) => void
}) {
  const [selected, setSelected] = useState<DecorationId>(currentDecoration)
  const [saving, setSaving] = useState(false)
  const [showShop, setShowShop] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const client = getSupabase()
      if (client && userId) await client.from('profiles').update({ decoration: selected }).eq('id', userId)
      onSave(selected)
      onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col overflow-x-hidden"
    >
      <div className="flex items-center px-4 flex-shrink-0 border-b border-white/[0.05]"
        style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10">
          <ChevronLeft size={22} className="text-white" />
        </button>
        <span className="ml-3 text-[17px] font-sf-ui-medium text-white flex-1">Украшения профиля</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hidden px-4 py-5 space-y-5">

        {/* Превью */}
        <div className="rounded-[20px] p-4 overflow-hidden relative" style={{ background: '#141414' }}>
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0" style={{ width: 84, height: 84 }}>
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white font-vk-demi text-[32px]"
                style={{ background: avatarUrl ? '#0a0a0a' : gradient, position: 'relative', zIndex: 2 }}
              >
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initialLetter}
              </div>
              <AvatarDecoration id={selected} size={84} />
            </div>
            <div className="flex-1 min-w-0 pt-2">
              <div className="text-[17px] font-sf-ui-medium text-white">{tagText || 'user'}</div>
              <div className="text-[12px] text-white/35 font-sf-ui-light mt-0.5">Был(а) недавно</div>
              {description && <div className="text-[12px] text-white/45 font-sf-ui-light mt-1.5 line-clamp-2">{description}</div>}
            </div>
          </div>
        </div>

        {/* Описание */}
        <div className="rounded-[20px] p-5" style={{ background: '#141414' }}>
          <div className="text-[15px] font-sf-ui-medium text-white/85 mb-1">Украшения профиля</div>
          <div className="text-[13px] text-white/40 font-sf-ui-light leading-relaxed">
            Выбери эффект который будет виден всем рядом с твоей аватаркой. Все украшения бесплатны.
          </div>
        </div>

        {/* Список в одной плашке */}
        <div className="rounded-[20px] overflow-hidden" style={{ background: '#141414' }}>
          {([
            { id: null, name: 'Без украшения', desc: 'Стандартный вид', color: null },
            { id: 'fire' as DecorationId, name: 'Огонь', desc: 'Языки пламени', color: '#ff6b00' },
            { id: 'neon' as DecorationId, name: 'Неон', desc: 'Неоновое свечение', color: '#00ffff' },
            { id: 'bubbles' as DecorationId, name: 'Пузыри', desc: 'Плавающие пузырьки', color: '#93c5fd' },
          ]).map((item, idx, arr) => {
            const isActive = selected === item.id
            return (
              <div key={String(item.id)}>
                <motion.button type="button" whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(item.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 transition-colors active:bg-white/[0.03]"
                  style={{ background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                >
                  <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{ background: item.color ? `${item.color}18` : 'rgba(255,255,255,0.06)' }}
                  >
                    {item.id === null
                      ? <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center"><div className="w-3 h-[1.5px] bg-white/30 rotate-45" /></div>
                      : DECORATION_ICONS[item.id]
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-sf-ui-medium text-white/90">{item.name}</div>
                    <div className="text-[12px] text-white/35 font-sf-ui-light">{item.desc}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[12px] font-sf-ui-light text-white/30">Бесплатно</span>
                    {isActive && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                      >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.button>
                {idx < arr.length - 1 && <div className="h-px bg-white/[0.04] mx-5" />}
              </div>
            )
          })}
        </div>

        {/* Магазин украшений */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowShop(true)}
          className="w-full rounded-[20px] overflow-hidden text-left"
          style={{ background: '#141414' }}
        >
          <div className="relative px-5 py-4 flex items-center gap-4 overflow-hidden">
            {/* Glow */}
            <div className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.08))' }}
            />
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(167,139,250,0.12)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-sf-ui-medium text-white/90">Магазин украшений</div>
              <div className="text-[12px] text-white/35 font-sf-ui-light mt-0.5">11 эксклюзивных эффектов для PRO</div>
            </div>
            <ChevronLeft size={18} className="text-white/20 rotate-180 flex-shrink-0" />
          </div>
        </motion.button>

        {/* Кнопка */}
        <div className="pb-4">
          <motion.button type="button" whileTap={{ scale: 0.97 }}
            onClick={handleSave} disabled={saving}
            className="w-full h-[52px] rounded-full font-sf-ui-medium text-[15px] active:opacity-80 disabled:opacity-40"
            style={{ background: '#2a2a2a', color: '#fff' }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </motion.button>
        </div>
      </div>
      <AnimatePresence>
        {showShop && <DecorationShop
          onClose={() => setShowShop(false)}
          avatarUrl={avatarUrl}
          gradient={gradient}
          initialLetter={initialLetter}
          tagText={tagText}
          description={description}
        />}
      </AnimatePresence>
    </motion.div>
  )
}
