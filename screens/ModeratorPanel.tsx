'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, Shield, Trash2, Ban, AlertTriangle, Check, X, User, Search, MessageCircle, ShoppingBag, Eye, TrendingUp, Clock } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

const PROTECTED_IDS = ['28d044d8-ae42-4c70-96c5-16e8f3fb8c3c']

type UserItem = {
  id: string
  tag: string | null
  avatar_url: string | null
  is_banned?: boolean
  is_verified?: boolean
  is_moderator?: boolean
}

type Action = {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  color: string
  danger?: boolean
}

const ACTIONS: Action[] = [
  { id: 'delete_ads', label: 'Удалить все объявления', description: 'Безвозвратно удалит все объявления', icon: <Trash2 size={18} />, color: '#f87171', danger: true },
  { id: 'ban', label: 'Ограничить доступ', description: 'Не сможет публиковать объявления', icon: <Ban size={18} />, color: '#fb923c', danger: true },
  { id: 'warn', label: 'Предупреждение', description: 'Отправить официальное предупреждение', icon: <AlertTriangle size={18} />, color: '#facc15' },
  { id: 'verify', label: 'Верифицировать', description: 'Выдать значок верификации', icon: <Check size={18} />, color: '#34d399' },
]

function MiniBar({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-0.5 h-[40px]">
      {data.map((v, i) => (
        <motion.div key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ delay: 0.03 * i, duration: 0.4, ease: 'easeOut' }}
          className="flex-1 rounded-t-[2px]"
          style={{ background: i >= data.length - 3 ? color : `${color}44`, minHeight: 2 }}
        />
      ))}
    </div>
  )
}

function UserStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<{
    adsCount: number
    totalViews: number
    messagesCount: number
    daysActive: number
    adsPerDay: number[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const client = getSupabase()
        if (!client) return

        const [adsRes, msgsRes] = await Promise.all([
          client.from('ads').select('id, view_count, created_at').eq('user_id', userId),
          client.from('chat_messages').select('id, created_at').eq('sender_id', userId).limit(500),
        ])

        const ads = adsRes.data ?? []
        const msgs = msgsRes.data ?? []
        const totalViews = ads.reduce((s: number, a: any) => s + (a.view_count ?? 0), 0)

        // Объявления по дням (последние 7)
        const now = Date.now()
        const adsPerDay = Array.from({ length: 7 }, (_, i) => {
          const dayStart = now - (6 - i) * 86400000
          const dayEnd = dayStart + 86400000
          return ads.filter((a: any) => {
            const t = new Date(a.created_at).getTime()
            return t >= dayStart && t < dayEnd
          }).length
        })

        // Дней активности (с первого объявления)
        const oldest = ads.reduce((min: number, a: any) => {
          const t = new Date(a.created_at).getTime()
          return t < min ? t : min
        }, now)
        const daysActive = Math.max(1, Math.floor((now - oldest) / 86400000))

        setStats({ adsCount: ads.length, totalViews, messagesCount: msgs.length, daysActive, adsPerDay })
      } catch {}
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
    </div>
  )
  if (!stats) return null

  return (
    <div className="space-y-3">
      {/* Главная метрика */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[20px] p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 100% 0%, rgba(99,102,241,0.2) 0%, transparent 65%)',
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={13} className="text-indigo-400" />
            <span className="text-[10px] text-white/35 uppercase tracking-widest">Всего просмотров</span>
          </div>
          <div className="text-[40px] font-ttc-bold text-white leading-none">{stats.totalViews.toLocaleString('ru-RU')}</div>
          <div className="text-[12px] text-white/30 mt-1">по всем объявлениям</div>
        </div>
      </motion.div>

      {/* Мини-метрики */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <ShoppingBag size={14} className="text-blue-400" />, label: 'Объявлений', value: stats.adsCount },
          { icon: <MessageCircle size={14} className="text-emerald-400" />, label: 'Сообщений', value: stats.messagesCount },
          { icon: <Clock size={14} className="text-amber-400" />, label: 'Дней', value: stats.daysActive },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}
            className="rounded-[16px] p-3" style={{ background: '#141414' }}
          >
            <div className="mb-1.5">{m.icon}</div>
            <div className="text-[20px] font-ttc-bold text-white leading-none">{m.value}</div>
            <div className="text-[10px] text-white/25 mt-1">{m.label}</div>
          </motion.div>
        ))}
      </div>

      {/* График объявлений */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-[20px] p-4" style={{ background: '#141414' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-white/30" />
          <span className="text-[10px] text-white/30 uppercase tracking-widest">Объявления за 7 дней</span>
        </div>
        <MiniBar data={stats.adsPerDay} color="#6366f1" />
        <div className="flex justify-between mt-1.5">
          {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d, i) => (
            <span key={i} className="text-[9px] text-white/15 flex-1 text-center">{d}</span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default function ModeratorPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<UserItem | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<{ label: string; success: boolean } | null>(null)
  const [confirmAction, setConfirmAction] = useState<Action | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const client = getSupabase()
        if (!client) return

        // Сначала читаем из localStorage
        const profRaw = typeof window !== 'undefined' ? localStorage.getItem('hw-profiles') : null
        if (profRaw) {
          const map = JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string }>
          const local: UserItem[] = Object.entries(map).map(([id, p]) => ({
            id, tag: p.tag ?? null, avatar_url: p.avatar_url ?? null,
          }))
          if (local.length > 0) setUsers(local)
        }

        // Загружаем из БД — используем тот же метод что в поиске сообщений
        const { data, error } = await client
          .from('profiles')
          .select('id, tag, avatar_url, is_banned, is_verified, is_moderator')
          .ilike('tag', '%')
          .limit(500)
        console.log('[Moderator] DB profiles:', data?.length, 'error:', error?.message)
        if (data && data.length > 0) {
          setUsers(data as UserItem[])
        }
      } catch (e) {
        console.error('[Moderator] load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = users.filter(u => {
    if (!query.trim()) return true
    const q = query.toLowerCase().replace(/^@/, '')
    return (u.tag ?? '').toLowerCase().includes(q)
  })

  const executeAction = async (action: Action) => {
    if (!selected) return
    setActionLoading(action.id)
    setConfirmAction(null)
    try {
      const client = getSupabase()
      if (!client) throw new Error()
      if (action.id === 'delete_ads') {
        await client.from('ads').delete().eq('user_id', selected.id)
      } else if (action.id === 'ban') {
        await client.from('profiles').update({ is_banned: true }).eq('id', selected.id)
        setSelected(prev => prev ? { ...prev, is_banned: true } : prev)
        setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, is_banned: true } : u))
      } else if (action.id === 'verify') {
        await client.from('profiles').update({ is_verified: true }).eq('id', selected.id)
      } else if (action.id === 'warn') {
        await client.from('notifications').insert({
          user_id: selected.id,
          type: 'new_follower',
          actor_tag: 'Модератор',
          ad_title: 'Вы получили предупреждение от модератора платформы HelloWorld.',
        })
      }
      setActionResult({ label: action.label, success: true })
    } catch {
      setActionResult({ label: action.label, success: false })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col"
    >
      {/* Шапка */}
      <div className="flex items-center px-4 flex-shrink-0 border-b border-white/[0.05]"
        style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button type="button" onClick={selected ? () => { setSelected(null); setActionResult(null) } : onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-white/10 flex items-center justify-center">
            <Shield size={14} className="text-white/60" />
          </div>
          <span className="text-[17px] font-sf-ui-medium text-white">
            {selected ? `@${selected.tag ?? 'user'}` : 'Панель модератора'}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Список пользователей */}
        {!selected && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Поиск */}
            <div className="px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2 rounded-[21px] px-4 h-[48px]"
                style={{ background: '#111111ff', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Search size={16} className="text-white/30 flex-shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Поиск по имени пользователя..."
                  className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/20"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-white/30 active:text-white/60">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Список */}
            <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-[14px] text-white/25">Нет пользователей</div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map(u => {
                    const isProtected = PROTECTED_IDS.includes(u.id)
                    return (
                      <button key={u.id} type="button"
                        onClick={() => {
                          if (isProtected) return
                          setSelected(u)
                          setActionResult(null)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-left active:opacity-70 transition-opacity"
                        style={{ background: '#111' }}
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <User size={16} className="text-white/30" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-sf-ui-medium text-white/85 truncate">
                            @{u.tag ?? 'user'}
                          </div>
                          <div className="text-[11px] text-white/25 mt-0.5">
                            {isProtected ? 'Вы не можете взаимодействовать с ним' : u.is_banned ? '🚫 Ограничен' : u.is_verified ? '✓ Верифицирован' : 'Активен'}
                          </div>
                        </div>
                        {!isProtected && <ChevronRight size={14} className="text-white/20 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Действия с пользователем */}
        {selected && (
          <motion.div key="actions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-4 space-y-4"
          >
            {/* Карточка пользователя */}
            <div className="flex items-center gap-3 p-4 rounded-[20px]" style={{ background: '#111' }}>
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                {selected.avatar_url
                  ? <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <User size={22} className="text-white/40" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[18px] font-ttc-bold text-white">@{selected.tag ?? 'user'}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: selected.is_banned ? '#f87171' : '#34d399' }} />
                  <span className="text-[12px] text-white/35 font-sf-ui-light">
                    {selected.is_banned ? 'Ограничен' : selected.is_verified ? 'Верифицирован' : 'Активен'}
                  </span>
                </div>
              </div>
            </div>

            {/* Результат действия */}
            <AnimatePresence>
              {actionResult && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="px-4 py-3 rounded-[14px] flex items-center gap-2"
                  style={{ background: actionResult.success ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}
                >
                  {actionResult.success ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-red-400" />}
                  <span className="text-[13px] font-sf-ui-light" style={{ color: actionResult.success ? '#34d399' : '#f87171' }}>
                    {actionResult.success ? `«${actionResult.label}» выполнено` : 'Ошибка выполнения'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Действия — иконки без плашек */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'delete_ads', danger: true, label: 'Удалить объявления',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  )
                },
                { id: 'ban', danger: true, label: 'Ограничить',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  )
                },
                { id: 'warn', danger: false, label: 'Предупредить',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  )
                },
                { id: 'verify', danger: false, label: 'Верифицировать',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  )
                },
              ].map(action => (
                <button key={action.id} type="button"
                  onClick={() => action.danger ? setConfirmAction(ACTIONS.find(a => a.id === action.id)!) : executeAction(ACTIONS.find(a => a.id === action.id)!)}
                  disabled={actionLoading === action.id}
                  className="flex flex-col items-center gap-2 py-4 rounded-[16px] active:opacity-60 transition-opacity"
                  style={{ background: '#141414' }}
                >
                  {actionLoading === action.id
                    ? <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    : <span className="text-white/70">{action.icon}</span>
                  }
                  <span className="text-[10px] text-white/40 font-sf-ui-light text-center leading-tight px-1">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Статистика пользователя */}
            <UserStats userId={selected.id} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Подтверждение */}
      <AnimatePresence>
        {confirmAction && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-sm"
              onClick={() => setConfirmAction(null)}
            />
            <div className="fixed inset-0 z-[220] flex items-end justify-center pointer-events-none">
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="w-full bg-[#141414] border-t border-white/10 rounded-t-[28px] px-6 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pointer-events-auto"
              >
                <div className="w-12 h-1.5 rounded-full bg-white/15 mx-auto mb-5" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `${confirmAction.color}20`, color: confirmAction.color }}>
                    {confirmAction.icon}
                  </div>
                  <div className="text-[18px] font-sf-ui-medium text-white">{confirmAction.label}</div>
                </div>
                <p className="text-[14px] text-white/40 font-sf-ui-light mb-6 leading-relaxed">
                  Действие будет применено к @{selected?.tag}. Это нельзя отменить.
                </p>
                <button type="button" onClick={() => executeAction(confirmAction)}
                  className="w-full h-[52px] rounded-[16px] font-sf-ui-medium text-[15px] text-white mb-3 active:opacity-80"
                  style={{ background: confirmAction.color }}
                >
                  Подтвердить
                </button>
                <button type="button" onClick={() => setConfirmAction(null)}
                  className="w-full h-[48px] text-white/40 font-sf-ui-light text-[14px] active:opacity-60"
                >
                  Отмена
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
