'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabase, normalizeTag, saveLocalAuth } from '@/lib/supabaseClient'
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import PasswordRecovery from './PasswordRecovery'

export default function HelloScreenLogin({
  onBack,
}: {
  onBack?: () => void
}) {
  const [scale, setScale] = useState(1)
  const [tag, setTag] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [tagError, setTagError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tagExists, setTagExists] = useState<boolean | null>(null)
  const [showRecovery, setShowRecovery] = useState(false)
  const tagCheckTimer = useRef<number | null>(null)

  const handleTagChange = (value: string) => {
    setTag(value)
    setTagError('')
    const trimmed = normalizeTag(value)
    if (tagCheckTimer.current) {
      window.clearTimeout(tagCheckTimer.current)
      tagCheckTimer.current = null
    }
    if (!trimmed) {
      setTagExists(null)
      return
    }
    tagCheckTimer.current = window.setTimeout(async () => {
      const client = getSupabase()

      try {
        const usersRaw = window.localStorage.getItem('hw-users')
        const users: Array<{ tag: string }> = usersRaw ? JSON.parse(usersRaw) : []
        const lowered = trimmed.toLowerCase()
        const existsLocal = users.some((u) => normalizeTag(u.tag).toLowerCase() === lowered)
        if (existsLocal) {
          setTagExists(true)
          return
        }
      } catch {
      }

      if (!client) {
        setTagExists(false)
        return
      }

      try {
        const { count, error } = await client
          .from('profiles')
          .select('tag', { count: 'exact', head: true })
          .ilike('tag', trimmed)
        if (error) {
          setTagExists(null)
          return
        }
        setTagExists(typeof count === 'number' ? count > 0 : false)
      } catch {
        setTagExists(null)
      }
    }, 350) as unknown as number
  }

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.max(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    return () => {
      if (tagCheckTimer.current) {
        window.clearTimeout(tagCheckTimer.current)
      }
    }
  }, [])

  const handleLogin = async () => {
    setTagError('')
    setPasswordError('')

    const normalizedTag = normalizeTag(tag)
    const canonicalTag = normalizedTag.toLowerCase()

    if (!normalizedTag) {
      setTagError('введите тег')
      return
    }
    if (!password) {
      setPasswordError('введите пароль')
      return
    }

    setLoading(true)
    const client = getSupabase()

    try {
      const usersRaw = window.localStorage.getItem('hw-users')
      const users: Array<{ tag: string; pass: string; uid: string; email: string }> = usersRaw ? JSON.parse(usersRaw) : []

      const enc = new TextEncoder()
      const data = enc.encode(password)
      const buf = await window.crypto.subtle.digest('SHA-256', data)
      const arr = Array.from(new Uint8Array(buf))
      const hash = arr.map((b) => b.toString(16).padStart(2, '0')).join('')

      const user = users.find((u) => normalizeTag(u.tag).toLowerCase() === canonicalTag)
      if (user) {
        if (user.pass !== hash) {
          setPasswordError('неверный пароль')
          setLoading(false)
          return
        }

        await saveLocalAuth({
          tag: normalizeTag(user.tag).toLowerCase(),
          uid: user.uid,
          uuid: user.uid,
          email: user.email,
        })
        window.dispatchEvent(new CustomEvent('local-auth-changed'))
        setLoading(false)
        return
      }
    } catch {
    }

    if (client) {
      const { data: profileRows, error: profErr } = await client
        .from('profiles')
        .select('id, email, tag')
        .ilike('tag', normalizedTag)
        .limit(1)

      const profile = !profErr && Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : null
      const userEmail = profile?.email || `${canonicalTag}@hw-app.com`

      const { data: authData, error: authErr } = await client.auth.signInWithPassword({
        email: userEmail,
        password,
      })

      if (authErr) {
        if (authErr.message.includes('Invalid login credentials')) {
          setPasswordError('неверный пароль')
        } else {
          setPasswordError(authErr.message)
        }
        setLoading(false)
        return
      }

      const resolvedUserId = profile?.id || authData.user?.id || authData.session?.user?.id || ''
      if (!resolvedUserId) {
        setTagError('пользователь не найден')
        setLoading(false)
        return
      }

      if (!profile) {
        await client.from('profiles').upsert(
          {
            id: resolvedUserId,
            tag: canonicalTag,
            email: userEmail,
          },
          { onConflict: 'id' }
        )
      }

      await saveLocalAuth({
        tag: canonicalTag,
        uid: resolvedUserId,
        uuid: resolvedUserId,
        email: userEmail,
      })
      window.dispatchEvent(new CustomEvent('local-auth-changed'))
    } else {
      setTagError('пользователь не найден')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />

        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack()
              return
            }
            const event = new CustomEvent('login-back')
            window.dispatchEvent(event)
          }}
          className="absolute left-6 top-[50px] z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
          aria-label="Назад"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-x-0 top-0 bottom-0 px-6 flex flex-col items-start pt-[140px] z-20 pointer-events-none"
        >
          <div className="pointer-events-auto w-full">
            <div className="mb-2 w-full text-left text-[32px] font-bold leading-[1.2em] text-white font-ttc-bold tracking-tight text-shadow-sm">
              С возвращением
            </div>
            <div className="mb-8 w-full text-left text-[16px] leading-[1.4em] text-white/50 font-light max-w-[280px]" style={{ fontFamily: 'var(--font-inter)' }}>
              Войдите, чтобы продолжить
            </div>

            <div className="w-full space-y-6">
              <div className="flex flex-col gap-3">
                <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                  Ваше имя пользователя
                </label>
                <div className="relative w-full group">
                  <input
                    value={tag}
                    onChange={(e) => handleTagChange(e.target.value)}
                    placeholder="@username"
                    className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-6 pr-24 text-[18px] leading-[1.4em] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 backdrop-blur-md"
                  />
                  <AnimatePresence>
                    {(tagError || (tagExists && !tagError)) && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`absolute right-6 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] font-sf-ui-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg ${
                          tagError ? 'text-[#FF453A]' : 'text-white/40'
                        }`}
                      >
                        {tagError || 'найден'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                  Пароль
                </label>
                <div className="relative w-full group">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-6 pr-24 text-[18px] leading-[1.4em] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {show ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="ml-1 text-[13px] text-[#FF453A] font-sf-ui-medium"
                    >
                      {passwordError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="w-fit ml-1 flex items-center gap-2 py-1 text-[14px] text-white/20 hover:text-white/40 transition-all active:scale-95 group"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  <HelpCircle size={14} className="opacity-50 transition-transform group-hover:rotate-[15deg]" />
                  <span>Забыли пароль?</span>
                </button>

                <button
                  type="button"
                  className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden mt-4 group shadow-xl ${
                    tag && password && !loading
                      ? 'bg-white text-black active:scale-[0.9]'
                      : 'bg-white/10 text-white/20'
                  }`}
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showRecovery && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100]"
            >
              <PasswordRecovery onBack={() => setShowRecovery(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
