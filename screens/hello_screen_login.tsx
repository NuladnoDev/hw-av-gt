'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabase, saveLocalAuth } from '@/lib/supabaseClient'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AdCardSkeleton } from './ads'

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
  const tagCheckTimer = useRef<number | null>(null)

  const handleTagChange = (value: string) => {
    setTag(value)
    setTagError('')
    const trimmed = value.trim()
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
      if (!client) {
        try {
          const usersRaw = window.localStorage.getItem('hw-users')
          const users: Array<{ tag: string }> = usersRaw ? JSON.parse(usersRaw) : []
          const existsLocal = users.some((u) => u.tag === trimmed)
          setTagExists(existsLocal)
        } catch {
          setTagExists(null)
        }
        return
      }
      try {
        const { count, error } = await client
          .from('profiles')
          .select('tag', { count: 'exact', head: true })
          .eq('tag', trimmed)
        if (error) {
          setTagExists(null)
          return
        }
        const exists = typeof count === 'number' ? count > 0 : false
        setTagExists(exists)
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
    if (!tag.trim()) {
      setTagError('введите тег')
      return
    }
    if (!password) {
      setPasswordError('введите пароль')
      return
    }
    
    setLoading(true)
    const client = getSupabase()
    
    if (!client) {
      const usersRaw = window.localStorage.getItem('hw-users')
      const users: Array<{ tag: string; pass: string; uid: string; email: string }> = usersRaw ? JSON.parse(usersRaw) : []
      const enc = new TextEncoder()
      const data = enc.encode(password)
      const buf = await window.crypto.subtle.digest('SHA-256', data)
      const arr = Array.from(new Uint8Array(buf))
      const hash = arr.map((b) => b.toString(16).padStart(2, '0')).join('')
      const user = users.find((u) => u.tag === tag && u.pass === hash)
      
      if (!user) {
        setPasswordError('неверный тег или пароль')
        setLoading(false)
        return
      }
      
      await saveLocalAuth({
        tag: user.tag,
        uid: user.uid,
        uuid: user.uid,
        email: user.email,
      })
      window.dispatchEvent(new CustomEvent('local-auth-changed'))
      setLoading(false)
      return
    }

    const { data: profile, error: profErr } = await client
      .from('profiles')
      .select('id, password_hash, email')
      .eq('tag', tag.trim())
      .single()

    if (profErr || !profile) {
      setTagError('пользователь не найден')
      setLoading(false)
      return
    }

    const enc = new TextEncoder()
    const passData = enc.encode(password)
    const buf = await window.crypto.subtle.digest('SHA-256', passData)
    const hash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (profile.password_hash !== hash) {
      setPasswordError('неверный пароль')
      setLoading(false)
      return
    }

    await saveLocalAuth({
      tag: tag.trim(),
      uid: profile.id,
      uuid: profile.id,
      email: profile.email || '',
    })
    window.dispatchEvent(new CustomEvent('local-auth-changed'))
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />
        
        {/* Background Decorative Element */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-white/[0.01] blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/[0.01] blur-[80px] rounded-full pointer-events-none" />

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
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-x-0 top-0 bottom-0 px-6 flex flex-col items-start pt-[140px] z-20 pointer-events-none"
        >
          <div className="pointer-events-auto w-full">
            <div className="mb-2 w-full text-left text-[32px] font-bold leading-[1.2em] text-white font-ttc-bold tracking-tight text-shadow-sm">
              С возвращением
            </div>
            <div className="mb-8 w-full text-left text-[16px] leading-[1.4em] text-white/50 font-light max-w-[280px]" style={{ fontFamily: 'var(--font-inter)' }}>
              Создай своё первое обьявление
            </div>

            <div className="w-full space-y-6">
            <div className="flex flex-col gap-3">
              <label className="ml-1 text-[13px] font-medium text-white/30 tracking-[0.05em]" style={{ fontFamily: 'var(--font-inter)' }}>
                Ваш тег
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
            </div>

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
        </motion.div>
      </div>
      <style jsx>{`
      `}</style>
    </div>
  )
}
