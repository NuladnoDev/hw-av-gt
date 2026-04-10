'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'

type Review = {
  id: string
  author_id: string
  author_tag: string | null
  author_avatar: string | null
  rating: number
  text: string | null
  created_at: string
}

function StarIcon({ filled, size = 32 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L14.4 8.8L21.6 9.3L16.4 13.9L18.1 21L12 17.3L5.9 21L7.6 13.9L2.4 9.3L9.6 8.8L12 2Z"
        fill={filled ? '#4a9edd' : 'none'}
        stroke={filled ? '#4a9edd' : 'rgba(255,255,255,0.2)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин назад`
  if (h < 24) return `${h} ч назад`
  if (d < 7) return `${d} д назад`
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function Reviews({
  targetId,
  isAuthed,
  targetTag,
  targetAvatar,
  onForwardReview,
}: {
  targetId: string
  isAuthed?: boolean
  targetTag?: string
  targetAvatar?: string | null
  onForwardReview?: (review: {
    review_id: string
    target_id: string
    target_tag: string
    target_avatar: string | null
    author_tag: string
    rating: number
    text: string | null
  }) => void
}) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [myAvatar, setMyAvatar] = useState<string | null>(null)
  const [myTag, setMyTag] = useState('user')
  const [myId, setMyId] = useState<string | null>(null)
  const [myGradient, setMyGradient] = useState(avatarGradients[0])
  const [menuReviewId, setMenuReviewId] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Загружаем свой профиль
    try {
      const raw = localStorage.getItem('hw-auth')
      const auth = raw ? JSON.parse(raw) : null
      const uid = auth?.uuid ?? auth?.uid ?? null
      setMyId(uid)
      if (uid) {
        const profRaw = localStorage.getItem('hw-profiles')
        const map = profRaw ? JSON.parse(profRaw) : {}
        const p = map[uid]
        if (p?.avatar_url) setMyAvatar(p.avatar_url)
        if (p?.tag) setMyTag(p.tag.replace(/^@/, ''))
        let sum = 0
        for (let i = 0; i < uid.length; i++) sum += uid.charCodeAt(i)
        setMyGradient(avatarGradients[sum % avatarGradients.length])
      }
    } catch {}
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const client = getSupabase()
        if (!client) return
        const { data } = await client
          .from('reviews')
          .select('id, author_id, author_tag, author_avatar, rating, text, created_at')
          .eq('target_id', targetId)
          .order('created_at', { ascending: false })
          .limit(50)
        if (data) setReviews(data as Review[])
      } catch {}
      setLoading(false)
    }
    load()
  }, [targetId])

  const handleTextSubmit = () => {
    if (!text.trim()) return
    setShowRating(true)
  }

  const handlePublish = async () => {
    if (!rating || !myId || submitting) return
    setSubmitting(true)
    try {
      const client = getSupabase()
      if (!client) return
      const { data } = await client.from('reviews').upsert({
        target_id: targetId,
        author_id: myId,
        author_tag: myTag,
        author_avatar: myAvatar,
        rating,
        text: text.trim() || null,
      }, { onConflict: 'target_id,author_id' }).select().single()
      if (data) {
        setReviews(prev => [data as Review, ...prev.filter(r => r.author_id !== myId)])
      }
      setText('')
      setRating(0)
      setShowRating(false)
    } catch {}
    setSubmitting(false)
  }

  const handleDelete = async (reviewId: string) => {
    setMenuReviewId(null)
    try {
      const client = getSupabase()
      if (!client) return
      await client.from('reviews').delete().eq('id', reviewId)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch {}
  }

  const handleEditOpen = (r: Review) => {
    setMenuReviewId(null)
    setEditingReview(r)
    setEditText(r.text ?? '')
    setEditRating(r.rating)
  }

  const handleEditSave = async () => {
    if (!editingReview || submitting) return
    setSubmitting(true)
    try {
      const client = getSupabase()
      if (!client) return
      const { data } = await client.from('reviews')
        .update({ text: editText.trim() || null, rating: editRating })
        .eq('id', editingReview.id)
        .select().single()
      if (data) setReviews(prev => prev.map(r => r.id === editingReview.id ? data as Review : r))
      setEditingReview(null)
    } catch {}
    setSubmitting(false)
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="space-y-5">
      {/* Средний рейтинг */}
      {avgRating && (
        <div className="flex items-center gap-3">
          <span className="text-[36px] font-ttc-bold text-white leading-none">{avgRating}</span>
          <div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <StarIcon key={i} filled={i <= Math.round(Number(avgRating))} size={16} />
              ))}
            </div>
            <div className="text-[12px] text-white/35 font-sf-ui-light mt-0.5">{reviews.length} отзыв{reviews.length === 1 ? '' : reviews.length < 5 ? 'а' : 'ов'}</div>
          </div>
        </div>
      )}

      {/* Форма ввода */}
      {isAuthed && (
        <div className="flex gap-3 items-start">
          {/* Аватарка */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-ttc-bold text-[15px]"
            style={{ background: myAvatar ? '#0a0a0a' : myGradient }}
          >
            {myAvatar
              ? <img src={myAvatar} alt="" className="w-full h-full object-cover" />
              : myTag[0]?.toUpperCase() ?? 'U'
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-sf-ui-medium text-white/70 mb-1.5">@{myTag}</div>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => {
                  setText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                placeholder="Написать отзыв..."
                rows={1}
                className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/25 font-sf-ui-light resize-none leading-relaxed border-b border-white/10 pb-2 focus:border-white/30 transition-colors overflow-hidden"
                style={{ minHeight: 36 }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit() } }}
              />
              {text.trim().length > 0 && (
                <motion.button
                  type="button" whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={handleTextSubmit}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 mb-1 active:opacity-80"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Список отзывов */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-[14px] text-white/25 font-sf-ui-light py-4">Отзывов пока нет</div>
      ) : (
        <div className="space-y-5">
          {reviews.map(r => {
            let sum = 0
            for (let i = 0; i < r.author_id.length; i++) sum += r.author_id.charCodeAt(i)
            const grad = avatarGradients[sum % avatarGradients.length]
            return (
              <div key={r.id} id={`review-${r.id}`} className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-ttc-bold text-[15px]"
                  style={{ background: r.author_avatar ? '#0a0a0a' : grad }}
                >
                  {r.author_avatar
                    ? <img src={r.author_avatar} alt="" className="w-full h-full object-cover" />
                    : (r.author_tag?.[0]?.toUpperCase() ?? 'U')
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-sf-ui-medium text-white/85">@{r.author_tag ?? 'user'}</span>
                    <span className="text-[11px] text-white/25 font-sf-ui-light flex-1">{timeAgo(r.created_at)}</span>
                    <div className="relative ml-auto">
                      <button
                        type="button"
                        onClick={() => setMenuReviewId(menuReviewId === r.id ? null : r.id)}
                        className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                        </svg>
                      </button>
                      <AnimatePresence>
                        {menuReviewId === r.id && (
                          <>
                            <motion.div className="fixed inset-0 z-[50]" onClick={() => setMenuReviewId(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-7 z-[60] bg-[#111111] border border-white/8 rounded-2xl overflow-hidden shadow-xl min-w-[150px]"
                            >
                              {onForwardReview && (
                                <>
                                  <button type="button" onClick={() => {
                                    setMenuReviewId(null)
                                    onForwardReview({
                                      review_id: r.id,
                                      target_id: targetId,
                                      target_tag: targetTag ?? '',
                                      target_avatar: targetAvatar ?? null,
                                      author_tag: r.author_tag ?? 'user',
                                      rating: r.rating,
                                      text: r.text,
                                    })
                                  }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-white/80 font-sf-ui-light hover:bg-white/5 transition-colors"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
                                    </svg>
                                    Переслать
                                  </button>
                                  {r.author_id === myId && <div className="h-px bg-white/5 mx-3" />}
                                </>
                              )}
                              {r.author_id === myId && (
                                <>
                                  <button type="button" onClick={() => handleEditOpen(r)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-white/80 font-sf-ui-light hover:bg-white/5 transition-colors"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    Изменить
                                  </button>
                                  <div className="h-px bg-white/5 mx-3" />
                                  <button type="button" onClick={() => handleDelete(r.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-red-400 font-sf-ui-light hover:bg-white/5 transition-colors"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                    </svg>
                                    Удалить
                                  </button>
                                </>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-1.5">
                    {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= r.rating} size={14} />)}
                  </div>
                  {r.text && (
                    <p className="text-[15px] text-white/75 font-sf-ui-light leading-relaxed">{r.text}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Плашка редактирования */}
      <AnimatePresence>
        {editingReview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-sm"
              onClick={() => setEditingReview(null)}
            />
            <div className="fixed inset-0 z-[220] flex items-end justify-center pointer-events-none">
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="w-full bg-[#141414] border-t border-white/10 rounded-t-[28px] px-6 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pointer-events-auto"
              >
                <div className="w-12 h-1.5 rounded-full bg-white/15 mx-auto mb-6" />
                <div className="text-[20px] font-sf-ui-medium text-white mb-4">Изменить отзыв</div>
                <div className="flex justify-center gap-3 mb-6">
                  {[1,2,3,4,5].map(i => (
                    <motion.div key={i} role="button" tabIndex={0}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setEditRating(i)}
                      className="cursor-pointer"
                    >
                      <motion.div animate={{ scale: editRating >= i ? 1.15 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                        <StarIcon filled={editRating >= i} size={40} />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
                <textarea
                  value={editText}
                  onChange={e => {
                    setEditText(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  placeholder="Текст отзыва..."
                  rows={3}
                  className="w-full bg-white/5 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-white/25 font-sf-ui-light resize-none outline-none border border-white/10 focus:border-white/25 transition-colors mb-4"
                />
                <motion.button type="button" whileTap={{ scale: 0.97 }}
                  disabled={!editRating || submitting}
                  onClick={handleEditSave}
                  className="w-full h-[54px] rounded-full font-sf-ui-medium text-[16px] transition-all active:opacity-80 disabled:opacity-30"
                  style={{ background: editRating ? '#FFFFFF' : 'rgba(255,255,255,0.1)', color: editRating ? '#000' : '#fff' }}
                >
                  {submitting ? 'Сохраняю...' : 'Сохранить'}
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Плашка выбора рейтинга */}
      <AnimatePresence>
        {showRating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-sm"
              onClick={() => setShowRating(false)}
            />
            <div className="fixed inset-0 z-[220] flex items-end justify-center pointer-events-none">
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="w-full bg-[#141414] border-t border-white/10 rounded-t-[28px] px-6 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pointer-events-auto"
              >
                <div className="w-12 h-1.5 rounded-full bg-white/15 mx-auto mb-6" />
                <div className="text-[20px] font-sf-ui-medium text-white mb-1">Оцените продавца</div>
                <div className="text-[14px] text-white/40 font-sf-ui-light mb-6">Ваш отзыв поможет другим покупателям</div>

                {/* Звёзды */}
                <div className="flex justify-center gap-3 mb-8">
                  {[1,2,3,4,5].map(i => (
                    <motion.div key={i} role="button" tabIndex={0}
                      whileTap={{ scale: 0.85 }}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(i)}
                      className="cursor-pointer"
                    >
                      <motion.div
                        animate={{ scale: (hoverRating || rating) >= i ? 1.15 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <StarIcon filled={(hoverRating || rating) >= i} size={44} />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                {/* Подпись рейтинга */}
                {(hoverRating || rating) > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center text-[14px] text-white/50 font-sf-ui-light mb-5 -mt-4"
                  >
                    {['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично!'][(hoverRating || rating)]}
                  </motion.div>
                )}

                <motion.button type="button"
                  whileTap={{ scale: 0.97 }}
                  disabled={!rating || submitting}
                  onClick={handlePublish}
                  className="w-full h-[54px] rounded-full font-sf-ui-medium text-[16px] transition-all active:opacity-80 disabled:opacity-30"
                  style={{ background: rating ? '#FFFFFF' : 'rgba(255,255,255,0.1)', color: rating ? '#000' : '#fff' }}
                >
                  {submitting ? 'Публикую...' : 'Опубликовать'}
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
