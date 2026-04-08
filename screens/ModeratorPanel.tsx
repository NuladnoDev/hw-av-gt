'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, Shield, Trash2, Ban, AlertTriangle, Check, X, User, Search } from 'lucide-react'
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
        // Читаем из localStorage как fallback
        const profRaw = typeof window !== 'undefined' ? localStorage.getItem('hw-profiles') : null
        if (profRaw) {
          const map = JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string }>
          const local: UserItem[] = Object.entries(map).map(([id, p]) => ({
            id,
            tag: p.tag ?? null,
            avatar_url: p.avatar_url ?? null,
          }))
          if (local.length > 0) setUsers(local)
        }
        // Пробуем из БД
        const { data, error } = await client
          .from('profiles')
          .select('id, tag, avatar_url, is_banned, is_verified, is_moderator')
          .order('tag', { ascending: true })
          .limit(500)
        console.log('[Moderator] DB profiles:', data?.length, 'error:', error?.message)
        if (data && data.length > 0) {
          setUsers(data as UserItem[])
        }
      } catch {}
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
              <div className="flex items-center gap-2 rounded-[14px] px-4 h-[44px]"
                style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Search size={16} className="text-white/30 flex-shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Поиск по тегу..."
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
            className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-4 space-y-3"
          >
            {/* Карточка пользователя */}
            <div className="flex items-center gap-3 p-4 rounded-[16px]" style={{ background: '#111' }}>
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                {selected.avatar_url
                  ? <img src={selected.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <User size={20} className="text-white/40" />
                }
              </div>
              <div>
                <div className="text-[16px] font-sf-ui-medium text-white">@{selected.tag ?? 'user'}</div>
                <div className="text-[12px] text-white/30 mt-0.5">{selected.is_banned ? '🚫 Ограничен' : '✓ Активен'}</div>
              </div>
            </div>

            {/* Результат */}
            <AnimatePresence>
              {actionResult && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="px-4 py-3 rounded-[12px] flex items-center gap-2"
                  style={{ background: actionResult.success ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}
                >
                  {actionResult.success ? <Check size={14} className="text-emerald-400" /> : <X size={14} className="text-red-400" />}
                  <span className="text-[13px] font-sf-ui-light" style={{ color: actionResult.success ? '#34d399' : '#f87171' }}>
                    {actionResult.success ? `«${actionResult.label}» выполнено` : 'Ошибка выполнения'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Действия */}
            {ACTIONS.map(action => (
              <button key={action.id} type="button"
                onClick={() => action.danger ? setConfirmAction(action) : executeAction(action)}
                disabled={actionLoading === action.id}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-left active:opacity-70 transition-opacity"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${action.color}18`, color: action.color }}
                >
                  {actionLoading === action.id
                    ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    : action.icon
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-sf-ui-medium text-white/85">{action.label}</div>
                  <div className="text-[11px] text-white/30 mt-0.5">{action.description}</div>
                </div>
              </button>
            ))}
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
