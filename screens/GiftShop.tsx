'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { CrystalVisual, RoseVisual, StarVisual, HeartVisual, MoonVisual, DiamondVisual, TrophyVisual, RocketVisual, FireVisual, ThunderVisual, GhostVisual, DragonVisual, UnicornVisual, GalaxyVisual, AngelVisual } from './GiftVisuals'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'

// ── Types ─────────────────────────────────────────────────────────────────────
type Gift = {
  id: string
  name: string
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  emoji: string
  colors: [string, string]
  particles: string
}

type Props = {
  recipientTag: string
  recipientAvatar: string | null
  onClose: () => void
}

// ── Gift catalogue ─────────────────────────────────────────────────────────────
export const GIFTS: Gift[] = [
  { id: 'crystal', name: 'Кристалл',  price: 49,   rarity: 'common',    emoji: '💎', colors: ['#a8edff','#ffffff'], particles: 'sparkles' },
  { id: 'crown',   name: 'Корона',    price: 199,  rarity: 'rare',      emoji: '👑', colors: ['#fdcb6e','#e17055'], particles: 'stars' },
  { id: 'rose',    name: 'Роза',      price: 59,   rarity: 'common',    emoji: '🌹', colors: ['#ff6b9d','#c0392b'], particles: 'hearts' },
  { id: 'star',    name: 'Звезда',    price: 79,   rarity: 'common',    emoji: '⭐', colors: ['#f9ca24','#f0932b'], particles: 'stars' },
  { id: 'heart',   name: 'Сердце',    price: 89,   rarity: 'common',    emoji: '❤️', colors: ['#ff4757','#ff6b81'], particles: 'hearts' },
  { id: 'moon',    name: 'Луна',      price: 129,  rarity: 'common',    emoji: '🌙', colors: ['#dfe6e9','#b2bec3'], particles: 'stars' },
  { id: 'diamond', name: 'Алмаз',     price: 299,  rarity: 'rare',      emoji: '💠', colors: ['#74b9ff','#0984e3'], particles: 'sparkles' },
  { id: 'trophy',  name: 'Кубок',     price: 349,  rarity: 'rare',      emoji: '🏆', colors: ['#fdcb6e','#e17055'], particles: 'stars' },
  { id: 'rocket',  name: 'Ракета',    price: 499,  rarity: 'rare',      emoji: '🚀', colors: ['#a29bfe','#6c5ce7'], particles: 'sparkles' },
  { id: 'fire',    name: 'Огонь',     price: 699,  rarity: 'epic',      emoji: '🔥', colors: ['#fd79a8','#e84393'], particles: 'fire' },
  { id: 'thunder', name: 'Молния',    price: 799,  rarity: 'epic',      emoji: '⚡', colors: ['#fdcb6e','#e17055'], particles: 'stars' },
  { id: 'ghost',   name: 'Призрак',   price: 899,  rarity: 'epic',      emoji: '👻', colors: ['#dfe6e9','#636e72'], particles: 'sparkles' },
  { id: 'dragon',  name: 'Дракон',    price: 1499, rarity: 'epic',      emoji: '🐉', colors: ['#00b894','#00cec9'], particles: 'fire' },
  { id: 'unicorn', name: 'Единорог',  price: 1999, rarity: 'legendary', emoji: '🦄', colors: ['#fd79a8','#a29bfe'], particles: 'rainbow' },
  { id: 'galaxy',  name: 'Галактика', price: 2999, rarity: 'legendary', emoji: '🌌', colors: ['#6c5ce7','#a29bfe'], particles: 'stars' },
  { id: 'angel',   name: 'Ангел',     price: 4999, rarity: 'legendary', emoji: '👼', colors: ['#ffffff','#dfe6e9'], particles: 'sparkles' },
]

export const RARITY_LABEL: Record<string, string> = {
  common: 'Обычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный',
}
export const RARITY_COLOR: Record<string, string> = {
  common: 'rgba(255,255,255,0.35)',
  rare: '#74b9ff',
  epic: '#a29bfe',
  legendary: '#fdcb6e',
}

// ── Animated gift SVG ─────────────────────────────────────────────────────────

function CrownVisual({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="40%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#a0720a" />
        </linearGradient>
        <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe566" />
          <stop offset="100%" stopColor="#c8900a" />
        </linearGradient>
        <filter id="cglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cshadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Ground glow */}
      <ellipse cx="60" cy="93" rx="24" ry="5" fill="rgba(255,200,0,0.15)" filter="url(#cshadow)" />

      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Drop shadow */}
        <motion.ellipse cx="60" cy="91" rx="19" ry="3.5" fill="rgba(0,0,0,0.28)"
          animate={{ scaleX: [1, 0.8, 1], opacity: [0.28, 0.1, 0.28] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />

        {/* ── Crown shape: wide base + 5 points via path ── */}
        {/* Main crown body */}
        <motion.path
          d="M18,82 L18,58 L32,72 L60,30 L88,72 L102,58 L102,82 Z"
          fill="url(#cg1)"
          stroke="rgba(255,230,80,0.4)" strokeWidth="0.8"
          animate={{ scaleY: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '60px 56px' }}
        />

        {/* Inner shadow on body sides */}
        <path d="M18,82 L18,58 L32,72 L60,30 L88,72 L102,58 L102,82 Z"
          fill="none" stroke="rgba(160,100,0,0.3)" strokeWidth="1.2" />

        {/* Left face shading */}
        <path d="M18,82 L18,58 L32,72 L60,30 L42,82 Z" fill="rgba(0,0,0,0.12)" />
        {/* Right face shading */}
        <path d="M102,82 L102,58 L88,72 L60,30 L78,82 Z" fill="rgba(0,0,0,0.08)" />

        {/* Center highlight strip */}
        <path d="M60,30 L52,82 L68,82 Z" fill="rgba(255,255,255,0.12)" />

        {/* Base band */}
        <rect x="18" y="76" width="84" height="12" rx="4" fill="url(#cg2)" />
        <rect x="18" y="76" width="84" height="5" rx="4" fill="rgba(255,255,255,0.22)" />
        <rect x="18" y="82" width="84" height="6" rx="3" fill="rgba(0,0,0,0.18)" />

        {/* ── Gems ── */}
        {/* Left outer tip */}
        <circle cx="18" cy="58" r="5.5" fill="#ff6b9d" filter="url(#cglow)" />
        <circle cx="18" cy="58" r="2.5" fill="rgba(255,255,255,0.7)" />
        {/* Left inner tip */}
        <circle cx="32" cy="72" r="4" fill="#fdcb6e" />
        <circle cx="32" cy="72" r="2" fill="rgba(255,255,255,0.6)" />
        {/* Center top */}
        <circle cx="60" cy="30" r="7.5" fill="#a29bfe" filter="url(#cglow)" />
        <circle cx="60" cy="30" r="3.5" fill="rgba(255,255,255,0.65)" />
        {/* Right inner tip */}
        <circle cx="88" cy="72" r="4" fill="#fdcb6e" />
        <circle cx="88" cy="72" r="2" fill="rgba(255,255,255,0.6)" />
        {/* Right outer tip */}
        <circle cx="102" cy="58" r="5.5" fill="#74b9ff" filter="url(#cglow)" />
        <circle cx="102" cy="58" r="2.5" fill="rgba(255,255,255,0.7)" />

        {/* Base band gems */}
        <circle cx="38" cy="82" r="4" fill="#ff6b9d" />
        <circle cx="60" cy="82" r="4" fill="#a29bfe" />
        <circle cx="82" cy="82" r="4" fill="#74b9ff" />
      </motion.g>

      {/* Sparkles */}
      {[{cx:12,cy:32,r:1.5,d:0},{cx:108,cy:40,r:1.3,d:0.6},{cx:14,cy:70,r:1.1,d:1.1},{cx:106,cy:72,r:1.4,d:0.3},{cx:46,cy:14,r:1.2,d:0.8},{cx:76,cy:12,r:1.0,d:1.5}].map((p,i)=>(
        <motion.circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="rgba(255,220,60,0.95)"
          animate={{opacity:[0,1,0],scale:[0.4,1.5,0.4]}}
          transition={{duration:2.3,repeat:Infinity,delay:p.d,ease:'easeInOut'}} />
      ))}

      {/* Top cross sparkle */}
      <motion.g animate={{opacity:[0.2,1,0.2],rotate:[0,45,0]}} transition={{duration:2.8,repeat:Infinity,ease:'easeInOut',delay:0.5}} style={{transformOrigin:'60px 20px'}}>
        <line x1="60" y1="15" x2="60" y2="25" stroke="#ffd700" strokeWidth="2" strokeLinecap="round"/>
        <line x1="55" y1="20" x2="65" y2="20" stroke="#ffd700" strokeWidth="2" strokeLinecap="round"/>
      </motion.g>
    </svg>
  )
}

function GiftVisual({ gift, size = 72 }: { gift: Gift; size?: number }) {
  if (gift.id === 'crown')   return <CrownVisual size={size} />
  if (gift.id === 'rose')    return <RoseVisual size={size} />
  if (gift.id === 'star')    return <StarVisual size={size} />
  if (gift.id === 'heart')   return <HeartVisual size={size} />
  if (gift.id === 'moon')    return <MoonVisual size={size} />
  if (gift.id === 'diamond') return <DiamondVisual size={size} />
  if (gift.id === 'trophy')  return <TrophyVisual size={size} />
  if (gift.id === 'rocket')  return <RocketVisual size={size} />
  if (gift.id === 'fire')    return <FireVisual size={size} />
  if (gift.id === 'thunder') return <ThunderVisual size={size} />
  if (gift.id === 'ghost')   return <GhostVisual size={size} />
  if (gift.id === 'dragon')  return <DragonVisual size={size} />
  if (gift.id === 'unicorn') return <UnicornVisual size={size} />
  if (gift.id === 'galaxy')  return <GalaxyVisual size={size} />
  if (gift.id === 'angel')   return <AngelVisual size={size} />
  return <CrystalVisual size={size} />
}

// ── Gift card ─────────────────────────────────────────────────────────────────
function GiftCard({ gift, onSelect }: { gift: Gift; onSelect: (g: Gift) => void }) {
  const [pressed, setPressed] = useState(false)

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.93 }}
      onTapStart={() => setPressed(true)}
      onTap={() => { setPressed(false); onSelect(gift) }}
      onTapCancel={() => setPressed(false)}
      className="flex flex-col items-center gap-2 p-5 rounded-[20px] relative overflow-hidden"
      style={{
        width: '100%',
        background: pressed ? '#0e0e12' : '#0a0a0d',
        border: `1px solid rgba(255,255,255,0.04)`,
        transition: 'background 0.15s',
      }}
    >
      {/* Rarity glow */}
      {gift.rarity !== 'common' && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20,
          background: `radial-gradient(ellipse at 50% 0%, ${gift.colors[0]}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Rarity border for legendary/epic */}
      {(gift.rarity === 'legendary' || gift.rarity === 'epic') && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20,
          border: `1px solid ${RARITY_COLOR[gift.rarity]}40`,
          pointerEvents: 'none',
        }} />
      )}

      <GiftVisual gift={gift} size={120} />

      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 1.2 }}>
        {gift.name}
      </span>
      <span style={{ fontSize: 11, color: RARITY_COLOR[gift.rarity], fontWeight: 500 }}>
        {RARITY_LABEL[gift.rarity]}
      </span>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(255,255,255,0.08)', borderRadius: 999,
        padding: '3px 10px',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>₽ {gift.price}</span>
      </div>
    </motion.button>
  )
}

// ── Confirm sheet ─────────────────────────────────────────────────────────────
function ConfirmSheet({
  gift, recipientTag, balance, onConfirm, onClose, giftMessage, setGiftMessage,
}: {
  gift: Gift; recipientTag: string; balance: number; onConfirm: () => void; onClose: () => void; giftMessage: string; setGiftMessage: (msg: string) => void
}) {
  const canAfford = balance >= gift.price

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[410] flex items-end justify-center pointer-events-none">
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 380 }}
          className="w-full pointer-events-auto"
          style={{
            background: 'rgba(18,18,22,0.97)',
            backdropFilter: 'blur(40px)',
            borderRadius: '24px 24px 0 0',
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
            padding: '0 0 calc(24px + env(safe-area-inset-bottom))',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.2)' }} />
          </div>

          <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {/* Big gift preview */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 300, delay: 0.1 }}
            >
              <GiftVisual gift={gift} size={120} />
            </motion.div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{gift.name}</div>
              <div style={{ fontSize: 13, color: RARITY_COLOR[gift.rarity] }}>{RARITY_LABEL[gift.rarity]}</div>
            </div>

            {/* Message input */}
            <div style={{ width: '100%' }}>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Добавьте сообщение (необязательно)"
                maxLength={200}
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 16,
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>
                {giftMessage.length}/200
              </div>
            </div>

            <div style={{
              width: '100%', padding: '14px 16px', borderRadius: 16,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Получатель</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>@{recipientTag}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Стоимость</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>₽ {gift.price}</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Баланс после</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: canAfford ? 'rgba(255,255,255,0.7)' : '#ff6b6b' }}>
                  ₽ {balance - gift.price}
                </span>
              </div>
            </div>

            {!canAfford && (
              <div style={{ fontSize: 13, color: '#ff6b6b', textAlign: 'center' }}>
                Недостаточно средств на балансе
              </div>
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={canAfford ? onConfirm : undefined}
              style={{
                width: '100%', height: 54, borderRadius: 16,
                background: canAfford
                  ? 'linear-gradient(180deg, #3a3a3a 0%, #252525 100%)'
                  : 'rgba(255,255,255,0.06)',
                border: canAfford ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                cursor: canAfford ? 'pointer' : 'default',
                fontSize: 16, fontWeight: 600, color: canAfford ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
              }}
            >
              {canAfford ? 'Приобрести' : 'Пополнить баланс'}
            </motion.button>

            <button
              type="button"
              onClick={onClose}
              style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
            >
              Отмена
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ── Success animation ─────────────────────────────────────────────────────────
function SuccessScreen({ gift, recipientTag, onClose }: { gift: Gift; recipientTag: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
    >
      {/* Confetti particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute',
            width: 8, height: 8,
            borderRadius: i % 3 === 0 ? '50%' : 2,
            background: [gift.colors[0], gift.colors[1], '#fff', '#fdcb6e', '#a29bfe'][i % 5],
            left: `${10 + (i * 4.2) % 80}%`,
            top: '20%',
          }}
          animate={{ y: ['0vh', '80vh'], x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 3)], rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)], opacity: [1, 0] }}
          transition={{ duration: 2.5 + i * 0.1, ease: 'easeIn', delay: i * 0.05 }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 260, delay: 0.1 }}
      >
        <GiftVisual gift={gift} size={140} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: 'center', marginTop: 24 }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          Подарок отправлен! 🎉
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>
          @{recipientTag} получит <span style={{ color: gift.colors[0], fontWeight: 600 }}>{gift.name}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function GiftShop({ recipientTag, recipientAvatar, onClose }: Props) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const [sent, setSent] = useState(false)
  const [sentGift, setSentGift] = useState<Gift | null>(null)
  const [giftMessage, setGiftMessage] = useState('')
  const [balance] = useState(1250) // TODO: load from user profile
  const [filter, setFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')

  // Hide bottom nav while open
  useEffect(() => {
    window.dispatchEvent(new Event('hide-bottom-nav'))
    return () => { window.dispatchEvent(new Event('show-bottom-nav')) }
  }, [])

  const filtered = filter === 'all' ? GIFTS : GIFTS.filter(g => g.rarity === filter)

  const handleConfirm = async () => {
    if (!selectedGift) return
    // Save to DB
    try {
      const supabase = getSupabase()
      const auth = await loadLocalAuth()
      if (supabase && auth?.uuid) {
        // Resolve recipient uuid by tag
        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('tag', recipientTag)
          .maybeSingle()
        if (recipientProfile?.id) {
          await supabase.from('gifts').insert({
            gift_id: selectedGift.id,
            sender_id: auth.uuid,
            recipient_id: recipientProfile.id,
            sender_tag: auth.tag ?? null,
            message: giftMessage.trim() || null,
          })
        }
      }
    } catch { /* silent */ }
    setSentGift(selectedGift)
    setSelectedGift(null)
    setSent(true)
  }

  // Avatar initials fallback
  const initials = recipientTag ? recipientTag[0].toUpperCase() : '?'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: '#0a0a0f', overflowY: 'auto', overscrollBehavior: 'contain' }}
    >
      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: 'calc(env(safe-area-inset-top) + 12px) 16px 0',
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          {/* Left — back */}
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ChevronLeft size={22} color="rgba(255,255,255,0.7)" />
          </button>

          {/* Center — recipient */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {recipientAvatar
                ? <img src={recipientAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{initials}</span>
              }
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>@{recipientTag}</span>
          </div>

          {/* Right — balance */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>₽ {balance.toLocaleString('ru')}</span>
          </div>
        </div>

        {/* Tabs row */}
        <div className="flex overflow-x-auto scrollbar-hidden gap-1">
          {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map(f => {
            const active = filter === f
            const label = f === 'all' ? 'Все' : RARITY_LABEL[f]
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="relative flex items-center gap-1.5 px-3 py-2.5 text-[16px] font-sf-ui-medium transition-all"
                style={{
                  color: active ? '#fff' : 'rgba(255,255,255,0.35)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >

                {label}
                {active && (
                  <motion.div
                    layoutId="gift-tab-indicator"
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 2, borderRadius: 999, background: '#fff',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Gift grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 5,
        padding: '12px 6px calc(32px + env(safe-area-inset-bottom))',
      }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((gift, i) => (
            <motion.div
              key={gift.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ delay: i * 0.04, type: 'spring', damping: 20, stiffness: 300 }}
              style={{ width: '100%' }}
            >
              <GiftCard gift={gift} onSelect={setSelectedGift} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Confirm sheet ── */}
      <AnimatePresence>
        {selectedGift && (
          <ConfirmSheet
            gift={selectedGift}
            recipientTag={recipientTag}
            balance={balance}
            onConfirm={handleConfirm}
            onClose={() => setSelectedGift(null)}
            giftMessage={giftMessage}
            setGiftMessage={setGiftMessage}
          />
        )}
      </AnimatePresence>

      {/* ── Success ── */}
      <AnimatePresence>
        {sent && sentGift && (
          <SuccessScreen
            gift={sentGift}
            recipientTag={recipientTag}
            onClose={() => { setSent(false); onClose() }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
