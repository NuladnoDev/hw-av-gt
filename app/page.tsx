'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import HelloScreen from '@/screens/hello_screen_hello'
import HomeScreen from '@/screens/home'
import HelloScreenTag from '@/screens/hello_screen_tag'
import HelloScreenPasswordCreate from '@/screens/hello_screen_password_create'
import HelloScreenLogin from '@/screens/hello_screen_login'

export default function Home() {
  const envReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [isAuthed, setIsAuthed] = useState<boolean | null>(
    envReady ? null : false
  )
  const [screen, setScreen] = useState<'hello' | 'tag' | 'password_create' | 'login'>('hello')
  const [regTag, setRegTag] = useState<string>('')
  const [tagError, setTagError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const check = () => setIsMobile(media.matches)
    check()
    media.addEventListener('change', check)
    return () => media.removeEventListener('change', check)
  }, [])

  useEffect(() => {
    if (!envReady || isMobile === false) return
    const client = getSupabase()
    if (!client) return
    client.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsAuthed(true)
      } else {
        const a = window.localStorage.getItem('hw-auth')
        setIsAuthed(!!a)
      }
    })
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthed(true)
      } else {
        const a = window.localStorage.getItem('hw-auth')
        setIsAuthed(!!a)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [envReady, isMobile])

  useEffect(() => {
    const onLocalAuthChanged = () => {
      const a = window.localStorage.getItem('hw-auth')
      setIsAuthed(!!a)
    }
    onLocalAuthChanged()
    window.addEventListener('local-auth-changed', onLocalAuthChanged as EventListener)
    return () => window.removeEventListener('local-auth-changed', onLocalAuthChanged as EventListener)
  }, [])

  async function signUpWithTagAndPassword(tag: string, password: string) {
    const client = getSupabase()
    if (!client) {
      const usersRaw = window.localStorage.getItem('hw-users')
      const users: Array<{ tag: string; uid: string; email: string; pass: string }> = usersRaw ? JSON.parse(usersRaw) : []
      const exists = users.some((u) => u.tag === tag)
      if (exists) {
        setTagError('тег занят')
        setScreen('tag')
        return
      }
      const enc = new TextEncoder()
      const data = enc.encode(password)
      const buf = await window.crypto.subtle.digest('SHA-256', data)
      const arr = Array.from(new Uint8Array(buf))
      const hash = arr.map((b) => b.toString(16).padStart(2, '0')).join('')
      const cnt = users.length + 1
      const uid = `hw-${String(cnt).padStart(4, '0')}`
      const email = `${tag}@hw.local`
      const nextUsers = [...users, { tag, uid, email, pass: hash }]
      window.localStorage.setItem('hw-users', JSON.stringify(nextUsers))
      window.localStorage.setItem('hw-auth', JSON.stringify({ tag, uid, email }))
      window.dispatchEvent(new Event('local-auth-changed'))
      return
    }
    const email = `${tag}@hw.local`
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { tag } },
    })
    if (error) {
      if (/registered|exists/i.test(error.message)) {
        setTagError('тег занят')
        setScreen('tag')
        return
      }
      if (/invalid|jwt|token/i.test(error.message)) {
        setPasswordError('настройки Supabase неверны')
      } else {
        setPasswordError('не удалось зарегистрироваться')
      }
      return
    }
    if (!data.session) {
      await client.auth.signInWithPassword({ email, password })
    }
    const userRes = await client.auth.getUser()
    const userId = userRes.data.user?.id
    let uid = ''
    const countRes = await client
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    const cnt = (countRes.count ?? 0) + 1
    uid = `hw-${String(cnt).padStart(4, '0')}`
    await client
      .from('profiles')
      .insert({ id: userId, tag, uid })
    await client.auth.updateUser({ data: { tag, uid } })
    if (userId) {
      window.localStorage.setItem('hw-auth', JSON.stringify({ tag, uid: userId, email }))
      window.dispatchEvent(new Event('local-auth-changed'))
    }
  }

  if (isMobile === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center text-zinc-700 dark:text-zinc-300">
          <p className="text-lg">Откройте сайт на мобильном устройстве</p>
        </div>
      </div>
    )
  }
  if (isAuthed === null || isMobile === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-pulse text-zinc-600 dark:text-zinc-400">Загрузка…</div>
      </div>
    )
  }
  if (isAuthed) {
    return <HomeScreen />
  }
  if (screen === 'tag') {
    return (
      <HelloScreenTag
        onBack={() => setScreen('hello')}
        onNext={(tag) => {
          setRegTag(tag)
          setTagError('')
          setScreen('password_create')
        }}
        initialValue={regTag}
        initialError={tagError}
      />
    )
  }
  if (screen === 'password_create') {
    return (
      <HelloScreenPasswordCreate
        onBack={() => setScreen('tag')}
        onNext={async (password) => {
          setPasswordError('')
          await signUpWithTagAndPassword(regTag, password)
        }}
        initialError={passwordError}
      />
    )
  }
  if (screen === 'login') {
    return <HelloScreenLogin onBack={() => setScreen('hello')} />
  }
  return (
    <HelloScreen
      onNext={() => setScreen('tag')}
      onLogin={() => setScreen('login')}
    />
  )
}
