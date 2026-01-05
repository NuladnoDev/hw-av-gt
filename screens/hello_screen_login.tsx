'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabase, saveLocalAuth } from '@/lib/supabaseClient'

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
          className="group absolute left-[24px] top-[50px] z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full bg-transparent"
        >
          <img
            src="/interface/str.svg"
            alt="back"
            className="h-[22px] w-[22px] transition-transform group-active:-translate-x-1"
          />
        </button>

        <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform px-6 flex flex-col items-center">
          <img
            src="/interface/user-profile-01.svg"
            alt="profile"
            className="mb-10 h-[122px] w-[122px]"
          />
          <div className="mb-2 w-full text-center text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
            Вход
          </div>
          <div className="mb-6 w-full text-center text-[16px] leading-[1.4em] text-[#A1A1A1]">
            Введите ваш тег и пароль
          </div>

          <label className="self-start mb-2 text-[14px] leading-[1.3em] text-[#BDBDBD]">
            Тег
          </label>
          <div className="relative mb-4 w-full">
            <input
              value={tag}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="durov"
              autoComplete="off"
              name="user_tag_login"
              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-4 pr-28 text-[16px] leading-[1.4em] text-white outline-none focus:border-[#444444] transition-colors"
            />
            {tagError && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#D45E5E] slide-in-up">
                {tagError}
              </span>
            )}
            {tagExists && !tagError && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-white/60 slide-in-up">
                тег найден
              </span>
            )}
          </div>

          <label className="self-start mb-2 text-[14px] leading-[1.3em] text-[#BDBDBD]">
            Пароль
          </label>
          <div className="relative mb-4 w-full">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? 'text' : 'password'}
              placeholder="пароль"
              autoComplete="new-password"
              name="user_password_login"
              className={`h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-4 pr-24 text-[16px] leading-[1.4em] text-white outline-none focus:border-[#444444] transition-colors ${show ? 'reveal-text' : ''}`}
            />
            {passwordError && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#D45E5E]">
                {passwordError}
              </span>
            )}
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-white transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                {show ? 'скрыть' : 'показать'}
              </button>
            )}
          </div>

          <button
            type="button"
            className="mt-2 h-[47px] w-full rounded-[10px] bg-[#111111] text-center"
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
            <span className="inline-block text-[18px] font-semibold leading-[1.25em] tracking-[0.015em] text-white font-vk-demi">
              Войти
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
