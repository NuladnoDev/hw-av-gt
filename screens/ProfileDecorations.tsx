'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

export type DecorationId = 'fire' | 'stars' | 'rainbow' | 'neon' | 'snow' | 'sakura' | null

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
          left: (i % 8) * 24, top: (i % 4) * (h / 4),
          boxShadow: '0 0 4px 2px rgba(255,255,255,0.6)',
        }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 0.3] }}
          transition={{ duration: 1.4 + i * 0.18, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  )

  if (id === 'rainbow') return (
    <div style={base}>
      {['#ff0080','#ff8c00','#ffe000','#40ff00','#00cfff','#8000ff'].map((color, i) => (
        <motion.div key={i} style={{
          position: 'absolute', left: 0,
          top: 4 + i * (h / 7), width: w, height: 3,
          background: color, borderRadius: 2, opacity: 0.6,
        }}
          animate={{ scaleX: [0.5, 1, 0.5], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
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
  fire: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2c0 0-4 4-4 8a4 4 0 0 0 8 0c0-1.5-.5-3-1.5-4C14 8 13 10 12 10s-2-2-2-4c0-1.5.5-3 2-4z" stroke="#ff6b00" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 18c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-.8-2.8-2-3.5.3 1-.2 2-1 2.5-.3-1.5-1-2.5-2-3-.5 1.5-1 2.5-1 4z" fill="#ff6b00"/></svg>,
  stars: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#fff" strokeWidth="1.5" fill="rgba(255,255,255,0.15)"/><circle cx="19" cy="4" r="1.5" fill="#fff"/><circle cx="5" cy="7" r="1" fill="#fff"/></svg>,
  rainbow: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 17a9 9 0 0 1 18 0" stroke="#ff0080" strokeWidth="2" strokeLinecap="round"/><path d="M5 17a7 7 0 0 1 14 0" stroke="#ff8c00" strokeWidth="2" strokeLinecap="round"/><path d="M7 17a5 5 0 0 1 10 0" stroke="#ffe000" strokeWidth="2" strokeLinecap="round"/><path d="M9 17a3 3 0 0 1 6 0" stroke="#40ff00" strokeWidth="2" strokeLinecap="round"/></svg>,
  neon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#00ffff" strokeWidth="1.8" style={{filter:'drop-shadow(0 0 3px #00ffff)'}}/><circle cx="12" cy="12" r="5" stroke="#ff00ff" strokeWidth="1.5" style={{filter:'drop-shadow(0 0 3px #ff00ff)'}}/><circle cx="12" cy="12" r="2" fill="#00ffff"/></svg>,
  snow: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e0f4ff" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/><circle cx="12" cy="12" r="2" fill="#e0f4ff" stroke="none"/></svg>,
  sakura: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="#ffb7c5"/><ellipse cx="12" cy="6" rx="3" ry="5" fill="#ffb7c5" opacity="0.8"/><ellipse cx="12" cy="18" rx="3" ry="5" fill="#ffb7c5" opacity="0.8"/><ellipse cx="6" cy="12" rx="5" ry="3" fill="#ffb7c5" opacity="0.8"/><ellipse cx="18" cy="12" rx="5" ry="3" fill="#ffb7c5" opacity="0.8"/></svg>,
}

const NAMES: Record<string, string> = { fire:'Огонь', stars:'Звёзды', rainbow:'Радуга', neon:'Неон', snow:'Снег', sakura:'Сакура' }

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
            { id: 'stars' as DecorationId, name: 'Звёзды', desc: 'Мерцающие звёзды', color: '#ffffff' },
            { id: 'rainbow' as DecorationId, name: 'Радуга', desc: 'Радужные полосы', color: '#ff0080' },
            { id: 'neon' as DecorationId, name: 'Неон', desc: 'Неоновое свечение', color: '#00ffff' },
            { id: 'snow' as DecorationId, name: 'Снег', desc: 'Падающие снежинки', color: '#e0f4ff' },
            { id: 'sakura' as DecorationId, name: 'Сакура', desc: 'Лепестки сакуры', color: '#ffb7c5' },
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

        {/* Кнопка */}
        <div className="pb-4">
          <motion.button type="button" whileTap={{ scale: 0.97 }}
            onClick={handleSave} disabled={saving}
            className="w-full h-[52px] rounded-full font-sf-ui-medium text-[15px] active:opacity-80 disabled:opacity-40"
            style={{ background: '#FFFFFF', color: '#000' }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
