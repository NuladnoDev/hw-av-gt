'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabase, saveLocalAuth } from '@/lib/supabaseClient'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'motion/react'

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

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <style jsx>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #111111 inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
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
          className="absolute left-6 top-[50px] z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Назад"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center pt-[110px] px-6"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-10 relative"
          >
            <div className="absolute inset-0 bg-white/10 blur-[60px] rounded-full" />
            <div className="relative flex h-[100px] w-[100px] items-center justify-center rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl">
              <img
                src="/interface/user-profile-01.svg"
                alt="profile"
                className="h-12 w-12 opacity-90"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full text-center space-y-2 mb-10"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white font-ttc-bold">
              Вход
            </h1>
            <p className="text-lg font-light text-white/40">
              Введите ваши данные для входа
            </p>
          </motion.div>

          <div className="w-full space-y-5">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-2"
            >
              <div className="relative group">
                <input
                  value={tag}
                  onChange={(e) => handleTagChange(e.target.value)}
                  placeholder="Ваш тег"
                  autoComplete="off"
                  name="user_tag_login"
                  className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 px-6 text-lg text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {tagError && (
                    <span className="text-[13px] text-red-400 font-medium">
                      {tagError}
                    </span>
                  )}
                  {tagExists && !tagError && (
                    <span className="text-[13px] text-emerald-400/60 font-medium">
                      найден
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-2"
            >
              <div className="relative group">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={show ? 'text' : 'password'}
                  placeholder="Пароль"
                  autoComplete="new-password"
                  name="user_password_login"
                  className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 px-6 text-lg text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  {passwordError && (
                    <span className="text-[13px] text-red-400 font-medium">
                      {passwordError}
                    </span>
                  )}
                  {password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="text-[13px] font-medium text-white/40 hover:text-white transition-colors uppercase tracking-wider"
                    >
                      {show ? 'скрыть' : 'показать'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="pt-4"
            >
              <button
                type="button"
                className="h-[64px] w-full rounded-2xl bg-white text-black font-bold text-lg shadow-[0_20px_40px_-15px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all hover:bg-zinc-100 disabled:opacity-50"
                onClick={async () => {
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
                    return
                  }
                  await saveLocalAuth({ tag: user.tag, uid: user.uid, email: user.email })
                  window.dispatchEvent(new Event('local-auth-changed'))
                  return
                }
                const email = `${tag}@hw.local`
                const { error } = await client.auth.signInWithPassword({ email, password })
                if (error) {
                  setPasswordError('неверный тег или пароль')
                } else {
                  const { data: userData } = await client.auth.getUser()
                  const userId = userData.user?.id ?? ''
                  let uid = userId
                  if (userId) {
                    const { data: prof } = await client
                      .from('profiles')
                      .select('uid')
                      .eq('id', userId)
                      .maybeSingle()
                    if (typeof (prof?.uid as string | undefined) === 'string' && (prof?.uid as string).trim().length > 0) {
                      uid = (prof?.uid as string).trim()
                    }
                  }
                  await saveLocalAuth({ tag, uid, email, uuid: userId })
                  window.dispatchEvent(new Event('local-auth-changed'))
                }
              }}
            >
              <span className="inline-block text-[18px] font-bold leading-[1.25em] tracking-tight font-vk-demi">
                Войти
              </span>
            </button>
          </motion.div>
        </div>
      </motion.div>
      </div>
    </div>
  )
}
