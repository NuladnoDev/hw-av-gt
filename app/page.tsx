'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import HelloScreen from '@/screens/hello_screen_hello'
import FeedScreen from '@/screens/FeedScreen'
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
      setIsAuthed(!!data.session)
    })
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })
    return () => data.subscription.unsubscribe()
  }, [])

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
    return <FeedScreen />
  }
  if (screen === 'tag') {
    return (
      <HelloScreenTag
        onBack={() => setScreen('hello')}
        onNext={() => setScreen('password_create')}
      />
    )
  }
  if (screen === 'password_create') {
    return (
      <HelloScreenPasswordCreate
        onBack={() => setScreen('tag')}
        onNext={() => {
          window.location.href = '/home'
        }}
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
