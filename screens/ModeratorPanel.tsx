'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Search, Shield, Trash2, Ban, AlertTriangle, Check, X, User } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

type TargetUser = {
  id: string
  tag: string
  avatar_url: string | null
  is_banned?: boolean
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
  {
    id: 'delete_ads',
    label: 'Удалить все объявления',
    description: 'Безвозвратно удалит все объявления пользователя',
    icon: <Trash2 size={18} />,
    color: '#f87171',
    danger: true,
  },
  {
    id: 'ban',
    label: 'Ограничить доступ',
    description: 'Пользователь не сможет публиковать объявления',
    icon: <Ban size={18} />,
    color: '#fb923c',
    danger: true,
  },
  {
    id: 'warn',
    label: 'Предупреждение',
    description: 'Отправить официальное предупреждение',
    icon: <AlertTriangle size={18} />,
    color: '#facc15',
  },
  {
    id: 'verify',
    label: 'Верифицировать',
    description: 'Выдать значок верификации аккаунту',
    icon: <Check size={18} />,
    color: '#34d399',
  },
]

export default function ModeratorPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [target, setTarget] = useState<TargetUser | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [actionResult, setActionResult] = useState<{ action: string; success: boolean } | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<Action | null>(null)

  const searchUser = async () => {
    if (!query.trim()) return
    setSearching(true)
    setNotFound(false)
    setTarget(null)
    setActionResult(null)
    try {
      const client = getSupabase()
      if (!client) return
      const tag = query.trim().replace(/^@/, '').toLowerCase()
      // Пробуем точное совпадение
      let { data } = await client
        .from('profiles')
        .select('id, tag, avatar_url, is_banned')
        .ilike('tag', tag)
        .maybeSingle()
      // Fallback — поиск по всем и фильтр на клиенте
      if (!data) {
        const { data: all } = await client
          .from('profiles')
          .select('id, tag, avatar_url, is_banned')
          .limit(200)
        if (all) {
          const found = (all as TargetUser[]).find(u =>
            (u.tag ?? '').toLowerCase() === tag ||
            (u.tag ?? '').toLowerCase().replace(/^@/, '') === tag
          )
          data = (found ?? null) as typeof data
        }
      }
      if (data) {
        setTarget(data as TargetUser)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setSearching(false)
    }
  }

  const executeAction = async (action: Action) => {
    if (!target) return
    setLoading(action.id)
    setConfirmAction(null)
    try {
      const client = getSupabase()
      if (!client) throw new Error('no client')

      if (action.id === 'delete_ads') {
        await client.from('ads').delete().eq('user_id', target.id)
      } else if (action.id === 'ban') {
        await client.from('profiles').update({ is_banned: true }).eq('id', target.id)
        setTarget(prev => prev ? { ...prev, is_banned: true } : prev)
      } else if (action.id === 'verify') {
        await client.from('profiles').update({ is_verified: true }).eq('id', target.id)
      } else if (action.id === 'warn') {
        await client.from('notifications').insert({
          user_id: target.id,
          type: 'new_follower',
          actor_tag: 'Модератор',
          ad_title: 'Вы получили предупреждение от модератора платформы HelloWorld.',
        })
      }
      setActionResult({ action: action.label, success: true })
    } catch {
      setActionResult({ action: action.label, success: false })
    } finally {
      setLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col"
    >
      {/* Шапка */}
      <div className="flex items-center px-4 flex-shrink-0 border-b border-white/[0.05]"
        style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button type="button" onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-amber-500/20 flex items-center justify-center">
            <Shield size={14} className="text-amber-400" />
          </div>
          <span className="text-[17px] font-sf-ui-medium text-white">Панель модератора</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-5 space-y-4">

        {/* Поиск пользователя */}
        <div className="rounded-[20px] p-5" style={{ background: '#111' }}>
          <div className="text-[11px] text-white/25 uppercase tracking-widest mb-3">Найти пользователя</div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-[14px] px-4 h-[48px]"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-white/30 text-[15px]">@</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUser()}
                placeholder="тег пользователя"
                className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/20"
              />
            </div>
            <button type="button" onClick={searchUser}
              className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center active:opacity-70 transition-opacity"
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {searching
                ? <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                : <Search size={18} className="text-white/50" />
              }
            </button>
          </div>

          {notFound && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-3 text-[13px] text-white/30 font-sf-ui-light"
            >
              Пользователь не найден
            </motion.div>
          )}
        </div>

        {/* Найденный пользователь */}
        <AnimatePresence>
          {target && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="rounded-[20px] p-5" style={{ background: '#111' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                  {target.avatar_url
                    ? <img src={target.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <User size={20} className="text-white/40" />
                  }
                </div>
                <div>
                  <div className="text-[16px] font-sf-ui-medium text-white">@{target.tag}</div>
                  <div className="text-[12px] text-white/30 font-sf-ui-light mt-0.5">
                    {target.is_banned ? '🚫 Ограничен' : '✓ Активен'}
                  </div>
                </div>
              </div>

              {/* Результат действия */}
              <AnimatePresence>
                {actionResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="mb-4 px-4 py-3 rounded-[12px] flex items-center gap-2"
                    style={{ background: actionResult.success ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}
                  >
                    {actionResult.success
                      ? <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      : <X size={14} className="text-red-400 flex-shrink-0" />
                    }
                    <span className="text-[13px] font-sf-ui-light" style={{ color: actionResult.success ? '#34d399' : '#f87171' }}>
                      {actionResult.success ? `«${actionResult.action}» выполнено` : 'Ошибка выполнения'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Действия */}
              <div className="space-y-2">
                {ACTIONS.map(action => (
                  <button key={action.id} type="button"
                    onClick={() => action.danger ? setConfirmAction(action) : executeAction(action)}
                    disabled={loading === action.id}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-left active:opacity-70 transition-opacity"
                    style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                      style={{ background: `${action.color}18`, color: action.color }}
                    >
                      {loading === action.id
                        ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        : action.icon
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-sf-ui-medium text-white/85">{action.label}</div>
                      <div className="text-[11px] text-white/30 font-sf-ui-light mt-0.5">{action.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Подтверждение опасного действия */}
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
                    Действие будет применено к @{target?.tag}. Это нельзя отменить.
                  </p>
                  <button type="button"
                    onClick={() => executeAction(confirmAction)}
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

      </div>
    </motion.div>
  )
}
