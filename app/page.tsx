'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import HelloScreen from '@/screens/hello_screen_hello'
import HomeScreen from '@/screens/home'
import HelloScreenTag from '@/screens/hello_screen_tag'
import HelloScreenPasswordCreate from '@/screens/hello_screen_password_create'
import HelloScreenCity from '@/screens/hello_screen_city'
import HelloScreenLogin from '@/screens/hello_screen_login'
import { Smartphone, Send, ExternalLink, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function Home() {
  const envReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [isAuthed, setIsAuthed] = useState<boolean | null>(envReady ? null : false)
  const [screen, setScreen] = useState<'hello' | 'tag' | 'password_create' | 'city' | 'login'>('hello')
  const [regTag, setRegTag] = useState<string>('')
  const [regPassword, setRegPassword] = useState<string>('')
  const [regCity, setRegCity] = useState<string>('')
  const [tagError, setTagError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    const handleTriggerAuth = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.screen === 'login') {
        setScreen('login')
      } else {
        setScreen('hello')
      }
      setShowAuth(true)
    }
    const handleCloseAuth = () => setShowAuth(false)
    window.addEventListener('trigger-auth', handleTriggerAuth)
    window.addEventListener('close-auth', handleCloseAuth)
    return () => {
      window.removeEventListener('trigger-auth', handleTriggerAuth)
      window.removeEventListener('close-auth', handleCloseAuth)
    }
  }, [])

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
      const authed = !!a
      setIsAuthed(authed)
      if (authed) {
        setShowAuth(false)
      }
      if (!authed) {
        setScreen('hello')
        setRegTag('')
        setRegPassword('')
        setRegCity('')
        setTagError('')
        setPasswordError('')
      }
    }
    onLocalAuthChanged()
    window.addEventListener('local-auth-changed', onLocalAuthChanged as EventListener)
    return () => window.removeEventListener('local-auth-changed', onLocalAuthChanged as EventListener)
  }, [])

  async function signUpWithTagAndPassword(tag: string, password: string, city?: string) {
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
      try {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { city?: string }>)
          : {}
        const prev = profMap[uid] ?? {}
        const c = typeof city === 'string' ? city.trim() : ''
        profMap[uid] = c.length > 0 ? { ...prev, city: c } : prev
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      } catch {
      }
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
    await client.from('profiles').insert({
      id: userId,
      tag,
      uid,
      city: typeof city === 'string' && city.trim().length > 0 ? city.trim() : null,
    })
    await client.auth.updateUser({ data: { tag, uid } })
    if (userId) {
      try {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { city?: string }>)
          : {}
        const prev = profMap[userId] ?? {}
        const c = typeof city === 'string' ? city.trim() : ''
        profMap[userId] = c.length > 0 ? { ...prev, city: c } : prev
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      } catch {
      }
      window.localStorage.setItem('hw-auth', JSON.stringify({ tag, uid: userId, uuid: userId, email }))
      window.dispatchEvent(new Event('local-auth-changed'))
    }
  }

  if (isMobile === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6 selection:bg-indigo-500/30">
        <div className="max-w-[900px] w-full flex flex-col md:flex-row items-center gap-12 md:gap-24">
          {/* Left Side: Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full" />
              <div className="relative p-5 rounded-[28px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                <Smartphone className="w-10 h-10 text-indigo-400" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-[40px] md:text-[48px] font-ttc-bold text-white mb-6 tracking-tight leading-[1.1]">
              Пожалуйста, зайдите <br /> с телефона
            </h1>
            <p className="text-[18px] text-white/40 font-sf-ui-regular leading-relaxed mb-10 max-w-[400px]">
              Наш сайт оптимизирован для мобильных устройств. Отсканируйте QR-код или введите адрес в мобильном браузере.
            </p>

            <div className="space-y-4 max-w-[360px]">
              <a 
                href="https://t.me/test" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#24A1DE]/10 flex items-center justify-center text-[#24A1DE]">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-ttc-demibold text-white group-hover:text-indigo-400 transition-colors">Telegram канал</span>
                    <span className="text-[12px] text-white/30 font-sf-ui-light">Узнавайте об обновлениях</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
              </a>

              <div className="pt-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/[0.05] text-[11px] text-white/20 font-sf-ui-medium uppercase tracking-widest">
                  hw-project • 2026
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: QR Code */}
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
            <div className="relative p-8 rounded-[40px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl flex flex-col items-center gap-6">
              <div className="p-4 bg-white rounded-[24px]">
                <QRCodeSVG 
                  value={typeof window !== 'undefined' ? window.location.href : 'https://hw-project.vercel.app'} 
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/interface/verified.svg",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-white/60 font-sf-ui-medium">
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span>Наведите камеру</span>
                </div>
                <span className="text-[12px] text-white/20 font-sf-ui-light">Автоматический переход на сайт</span>
              </div>
            </div>
          </div>
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
  if (isAuthed && !showAuth) {
    return <HomeScreen isAuthed={true} />
  }
  if (!showAuth && isAuthed === false) {
    return <HomeScreen isAuthed={false} />
  }
  if (screen === 'tag') {
    return (
      <HelloScreenTag
        onBack={() => setScreen('hello')}
        onNext={(tag) => {
          setRegTag(tag)
          setRegPassword('')
          setRegCity('')
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
          setRegPassword(password)
          setScreen('city')
        }}
        initialError={passwordError}
      />
    )
  }
  if (screen === 'city') {
    return (
      <HelloScreenCity
        onBack={() => setScreen('password_create')}
        onNext={async (city) => {
          setRegCity(city)
          setPasswordError('')
          await signUpWithTagAndPassword(regTag, regPassword, city)
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
