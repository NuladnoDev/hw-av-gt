'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import LoginScreen from '@/screens/LoginScreen'
import FeedScreen from '@/screens/FeedScreen'

export default function Home() {
  const envReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [isAuthed, setIsAuthed] = useState<boolean | null>(
    envReady ? null : false
  )

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
  return isAuthed ? <FeedScreen /> : <LoginScreen />
}
