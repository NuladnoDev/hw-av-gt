'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'
import { AdCard, loadAdsFromStorage, deleteAdById, StoredAd } from './ads'
import AdsEdit from './Ads_Edit'

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export default function Profile({
  profileTab,
  setProfileTab,
  userTag,
  editMode,
  isOwnProfile = true,
  viewUserId,
}: {
  profileTab: 'ads' | 'about' | 'friends'
  setProfileTab: (t: 'ads' | 'about' | 'friends') => void
  userTag?: string
  editMode?: boolean
  isOwnProfile?: boolean
  viewUserId?: string
}) {
  const [tagText, setTagText] = useState<string>(typeof userTag === 'string' ? userTag.replace(/^@/, '') : '')
  const [tagEditing, setTagEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [description, setDescription] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [political, setPolitical] = useState<string>('')
  const [hobbies, setHobbies] = useState<string>('')
  const [userAds, setUserAds] = useState<StoredAd[]>([])
  const [editingAd, setEditingAd] = useState<StoredAd | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [viewerId, setViewerId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadViewer = async () => {
      const auth = await loadLocalAuth()
      if (cancelled) return
      const id = auth?.uid ?? null
      setViewerId(typeof id === 'string' && id.length > 0 ? id : null)
    }
    if (typeof window !== 'undefined') {
      loadViewer()
    }
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!userId) {
        setUserAds([])
        return
      }
      const all = await loadAdsFromStorage()
      if (cancelled) return
      setUserAds(all.filter((a) => a.userId === userId).sort((a, b) => b.createdAt - a.createdAt))
    }
    load()
    const handler = () => {
      load()
    }
    window.addEventListener('ads-updated', handler as EventListener)
    return () => {
      cancelled = true
      window.removeEventListener('ads-updated', handler as EventListener)
    }
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let idLocal: string | null = null
    if (viewUserId) {
      idLocal = viewUserId
    } else {
      const authRaw = window.localStorage.getItem('hw-auth')
      const auth = authRaw ? (JSON.parse(authRaw) as { tag?: string; uid?: string; email?: string }) : null
      idLocal = auth?.uid ?? null
    }
    setUserId(idLocal)
    const profRaw = window.localStorage.getItem('hw-profiles')
    const profMap = profRaw
      ? (JSON.parse(profRaw) as Record<
          string,
          { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }
        >)
      : {}
    const p = idLocal ? profMap[idLocal] : undefined
    const tagLocal =
      p?.tag ?? (typeof userTag === 'string' ? userTag.replace(/^@/, '') : '')
    if (tagLocal) setTagText(tagLocal)
    if (p?.avatar_url) setAvatarUrl(p.avatar_url)
    if (p?.description) setDescription(p.description)
    if (p?.age) setAge(p.age)
    if (p?.gender) setGender(p.gender)
    if (p?.city) setCity(p.city ?? '')
    if (p?.political) setPolitical(p.political)
    if (p?.hobbies) setHobbies(p.hobbies)
    const client = getSupabase()
    if (!client || !idLocal) return
    ;(async () => {
      try {
        const { data: prof, error: err } = await client
          .from('profiles')
          .select('tag, avatar_url, description, age, gender, city, political, hobbies')
          .eq('id', idLocal)
          .maybeSingle()
        if (err || !prof) {
          return
        }
        const tagFromDb = (prof.tag as string | undefined) ?? undefined
        const avatarFromDb = (prof.avatar_url as string | undefined) ?? undefined
        const descFromDb = (prof.description as string | undefined) ?? ''
        const ageFromDb = (prof.age as string | number | undefined) ?? undefined
        const genderFromDb = (prof.gender as string | undefined) ?? undefined
        const politicalFromDb = (prof.political as string | undefined) ?? undefined
        const hobbiesFromDb = (prof.hobbies as string | undefined) ?? undefined
        if (typeof tagFromDb === 'string' && tagFromDb.trim().length > 0) {
          setTagText(tagFromDb.trim())
        } else if (typeof userTag === 'string' && userTag.trim().length > 0) {
          setTagText(userTag.replace(/^@/, '').trim())
        }
        if (typeof avatarFromDb === 'string' && avatarFromDb.trim().length > 0) {
          setAvatarUrl(avatarFromDb)
        }
        setDescription(descFromDb ?? '')
        if (typeof ageFromDb === 'number') setAge(String(ageFromDb))
        else if (typeof ageFromDb === 'string') setAge(ageFromDb)
        setGender(typeof genderFromDb === 'string' ? genderFromDb : '')
        setCity(typeof (prof.city as string | undefined) === 'string' ? (prof.city as string) : '')
        setPolitical(typeof politicalFromDb === 'string' ? politicalFromDb : '')
        setHobbies(typeof hobbiesFromDb === 'string' ? hobbiesFromDb : '')
      } catch {
      }
    })()
  }, [userTag, viewUserId])
  useEffect(() => {
    let cancelled = false
    const loadFollow = async () => {
      if (!viewUserId || !viewerId) return
      const client = getSupabase()
      if (!client) return
      try {
        const { data, error } = await client
          .from('follows')
          .select('notifications_enabled')
          .eq('follower_id', viewerId)
          .eq('target_id', viewUserId)
          .maybeSingle()
        if (cancelled || error || !data) return
        setIsSubscribed(true)
        setNotificationsEnabled((data as { notifications_enabled?: boolean | null }).notifications_enabled ?? true)
      } catch {
      }
    }
    loadFollow()
    return () => {
      cancelled = true
    }
  }, [viewUserId, viewerId])
  useEffect(() => {
    const handleUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>
      if (typeof ev.detail?.tag === 'string') setTagText(ev.detail.tag)
      if (typeof ev.detail?.avatar_url === 'string') setAvatarUrl(ev.detail.avatar_url)
      if (typeof ev.detail?.description === 'string') setDescription(ev.detail.description)
      if (typeof ev.detail?.age === 'string') setAge(ev.detail.age)
      if (typeof ev.detail?.gender === 'string') setGender(ev.detail.gender)
      if (typeof ev.detail?.city === 'string') setCity(ev.detail.city)
      if (typeof ev.detail?.political === 'string') setPolitical(ev.detail.political)
      if (typeof ev.detail?.hobbies === 'string') setHobbies(ev.detail.hobbies)
    }
    window.addEventListener('profile-updated', handleUpdated as EventListener)
    return () => window.removeEventListener('profile-updated', handleUpdated as EventListener)
  }, [])

  const gradientIndex = (() => {
    const base = viewUserId ?? userId ?? 'user'
    let sum = 0
    for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i)
    return sum % avatarGradients.length
  })()
  const gradient = avatarGradients[gradientIndex]
  const initialLetter = tagText && tagText.length > 0 ? tagText.trim().charAt(0).toUpperCase() : 'U'

  const ensurePushSubscription = async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') return false
      if (!viewerId) return false
      if (!('serviceWorker' in navigator)) return false
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return false
      const reg = await navigator.serviceWorker.register('/sw.js')
      let sub = await reg.pushManager.getSubscription()
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!sub) {
        if (!publicKey || typeof publicKey !== 'string' || publicKey.length === 0) return false
        const appServerKey = urlBase64ToArrayBuffer(publicKey)
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        })
      }
      if (!sub) return false
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userId: viewerId,
        }),
      })
      return true
    } catch {
      return false
    }
  }

  const handleAvatarFile = async (files: FileList | null) => {
    const f = files && files[0]
    if (!f || !userId) return
    setAvatarLoading(true)
    try {
      const client = getSupabase()
      let finalUrl: string | null = null
      if (client) {
        const path = `${userId}/${Date.now()}_${f.name}`
        const up = await client.storage.from('avatars').upload(path, f, { upsert: true })
        if (!up.error) {
          const pub = client.storage.from('avatars').getPublicUrl(path)
          finalUrl = pub.data.publicUrl
          const { error } = await client.from('profiles').upsert({ id: userId, tag: tagText, avatar_url: finalUrl })
          if (error) {
            const profRaw = window.localStorage.getItem('hw-profiles')
            const profMap = profRaw
              ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
              : {}
            const prev = profMap[userId] ?? {}
            profMap[userId] = { ...prev, avatar_url: finalUrl ?? undefined }
            window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
          }
        }
      }
      if (!finalUrl) {
        const reader = new FileReader()
        const dataUrl = await new Promise<string | null>((res) => {
          reader.onload = () => res(typeof reader.result === 'string' ? reader.result : null)
          reader.readAsDataURL(f)
        })
        finalUrl = dataUrl
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
          : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = { ...prev, avatar_url: finalUrl ?? undefined }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
      if (finalUrl) {
        setAvatarUrl(finalUrl)
        const event = new CustomEvent('profile-updated', { detail: { avatar_url: finalUrl } })
        window.dispatchEvent(event)
      }
    } finally {
      setAvatarLoading(false)
    }
  }

  const saveTag = async (next: string) => {
    setTagText(next)
    const client = getSupabase()
    if (!userId) return
    if (client) {
      const { error } = await client.from('profiles').upsert({ id: userId, tag: next })
      if (error) {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
          : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = { ...prev, tag: next }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
        : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = { ...prev, tag: next }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
  }

  const upsertProfile = async (patch: Partial<{ description: string; age: string; gender: string; city: string; political: string; hobbies: string }>) => {
    const client = getSupabase()
    if (!userId) return
    const payload: Record<string, unknown> = { id: userId, ...patch }
    if (client) {
      const { error } = await client.from('profiles').upsert(payload)
      if (error) {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
          : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = {
          ...prev,
          description: (payload.description as string | undefined) ?? prev.description,
          age: (payload.age as string | undefined) ?? prev.age,
          gender: (payload.gender as string | undefined) ?? prev.gender,
          city: (payload.city as string | undefined) ?? prev.city,
          political: (payload.political as string | undefined) ?? prev.political,
          hobbies: (payload.hobbies as string | undefined) ?? prev.hobbies,
        }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
        : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = {
        ...prev,
        description: (payload.description as string | undefined) ?? prev.description,
        age: (payload.age as string | undefined) ?? prev.age,
        gender: (payload.gender as string | undefined) ?? prev.gender,
        city: (payload.city as string | undefined) ?? prev.city,
        political: (payload.political as string | undefined) ?? prev.political,
        hobbies: (payload.hobbies as string | undefined) ?? prev.hobbies,
      }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
  }
  const saveDescription = async (next: string) => {
    setDescription(next)
    await upsertProfile({ description: next })
    const event = new CustomEvent('profile-updated', { detail: { description: next } })
    window.dispatchEvent(event)
  }
  const saveAge = async (next: string) => {
    setAge(next)
    await upsertProfile({ age: next })
  }
  const saveGender = async (next: string) => {
    setGender(next)
    await upsertProfile({ gender: next })
  }
  const saveCity = async (next: string) => {
    setCity(next)
    await upsertProfile({ city: next })
  }
  const savePolitical = async (next: string) => {
    setPolitical(next)
    await upsertProfile({ political: next })
  }
  const saveHobbies = async (next: string) => {
    setHobbies(next)
    await upsertProfile({ hobbies: next })
  }

  return (
    <div
      style={
        {
          '--profile-max-width': '380px',
          '--profile-switch-negative-margin': '12px',
          '--profile-about-negative-margin': '12px',
          '--profile-switch-height': '52px',
          '--profile-switch-padding': '4px',
          '--profile-switch-offset': '10px',
          '--profile-section-margin-top': '24px',
          '--profile-name-size': '28px',
          '--profile-name-margin-top': '6px',
          '--profile-avatar-size': '110px',
          '--profile-cover-height': '90px',
          '--profile-avatar-top-offset': '0px',
          '--profile-border-radius': '12px',
          '--profile-button-radius': '10px',
        } as React.CSSProperties
      }
    >
      <div
        className="absolute left-0 w-full"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)', height: 'var(--profile-cover-height)' }}
      >
        <div className="h-full w-full" style={{ background: '#0A0A0A' }} />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
        style={{
          width: 'var(--profile-avatar-size)',
          height: 'var(--profile-avatar-size)',
          top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) + var(--profile-avatar-top-offset, 0px))',
          boxShadow: `0 0 var(--profile-avatar-glow-size) var(--profile-avatar-glow-color), 0 4px 18px rgba(0,0,0,0.35)`,
          background: avatarUrl ? '#0A0A0A' : gradient,
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white font-vk-demi text-[36px]">
            {initialLetter}
          </div>
        )}
        {editMode && (
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute left-0 top-0 h-full w-full flex items-center justify-center bg-black/20"
            aria-label="Сменить аватар"
          >
            <img
              src="/interface/image-add.svg"
              alt="add"
              className="h-[40px] w-[40px]"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(84%) sepia(68%) saturate(569%) hue-rotate(360deg) brightness(101%) contrast(101%)',
                opacity: 0.9,
              }}
            />
          </button>
        )}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatarFile(e.target.files)}
        />
      </div>
      <div
        className="absolute left-0 w-full px-6 overflow-y-auto pb-8"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) + calc(var(--profile-avatar-size) / 2) + 12px + var(--profile-avatar-top-offset, 0px))',
          height: 'calc(812px - 88px - 56px - var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) - var(--home-header-offset) - 12px - var(--profile-avatar-top-offset, 0px))',
        }}
      >
        <div className="flex w-full flex-col items-center">
          {!tagEditing ? (
            <div className="leading-[2.3em] text-white font-ttc-bold flex items-center gap-2" style={{ fontSize: 'var(--profile-name-size)', marginTop: 'var(--profile-name-margin-top)' }}>
              <span>{tagText && tagText.trim().length > 0 ? tagText : 'user'}</span>
              {editMode && (
                <button
                  type="button"
                  className="opacity-80"
                  onClick={() => setTagEditing(true)}
                  aria-label="Редактировать тег"
                >
                  <img
                    src="/interface/krr.svg"
                    alt="edit-tag"
                    className="h-[18px] w-[18px]"
                    style={{
                      filter:
                        'brightness(0) saturate(100%) invert(84%) sepia(68%) saturate(569%) hue-rotate(360deg) brightness(101%) contrast(101%)',
                    }}
                  />
                </button>
              )}
              {editMode && (
                <button
                  type="button"
                  className="opacity-80"
                  onClick={async () => {
                    if (!userId) {
                      setAvatarUrl(null)
                      const ev = new CustomEvent('profile-updated', { detail: { avatar_url: null } })
                      window.dispatchEvent(ev)
                      return
                    }
                    const client = getSupabase()
                    if (client) {
                      await client.from('profiles').upsert({ id: userId, avatar_url: null })
                    }
                    const profRaw = window.localStorage.getItem('hw-profiles')
                    const profMap = profRaw ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string }>) : {}
                    const prev = profMap[userId] ?? {}
                    const next = { ...prev }
                    delete next.avatar_url
                    profMap[userId] = next
                    window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
                    setAvatarUrl(null)
                    const ev = new CustomEvent('profile-updated', { detail: { avatar_url: null } })
                    window.dispatchEvent(ev)
                  }}
                  aria-label="Удалить фото"
                >
                  <img
                    src="/interface/trash-03.svg"
                    alt="trash"
                    className="h-[18px] w-[18px]"
                    style={{ filter: 'invert(1) brightness(0.7)' }}
                  />
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center" style={{ marginTop: 'var(--profile-name-margin-top)' }}>
              <input
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                onBlur={() => {
                  setTagEditing(false)
                  const next = tagText.trim()
                  if (next.length > 0) saveTag(next)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTagEditing(false)
                    const next = tagText.trim()
                    if (next.length > 0) saveTag(next)
                  }
                }}
                className="h-[40px] w-[220px] border border-[#2B2B2B] bg-[#111111] px-3 text-[16px] leading-[1.4em] text-white outline-none"
                style={{ borderRadius: 'var(--profile-border-radius)' }}
              />
            </div>
          )}
          {!isOwnProfile && (
            <div className="w-full mt-4">
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  layout
                  className="h-11 flex items-center justify-center font-vk-demi"
                  style={{
                    flex: isSubscribed ? 3 : 4,
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    fontSize: 14,
                    borderRadius: 'var(--profile-button-radius)',
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={async () => {
                    if (!viewerId || !userId) {
                      return
                    }
                    const client = getSupabase()
                    if (!client) {
                      setIsSubscribed((v) => !v)
                      if (!isSubscribed) {
                        setNotificationsEnabled(true)
                      }
                      return
                    }
                    if (isSubscribed) {
                      setIsSubscribed(false)
                      setNotificationsEnabled(false)
                      try {
                        await client
                          .from('follows')
                          .delete()
                          .eq('follower_id', viewerId)
                          .eq('target_id', userId)
                      } catch {
                      }
                    } else {
                      setIsSubscribed(true)
                      setNotificationsEnabled(true)
                      try {
                        await client.from('follows').upsert({
                          follower_id: viewerId,
                          target_id: userId,
                          notifications_enabled: true,
                        })
                        await ensurePushSubscription()
                      } catch {
                      }
                    }
                  }}
                >
                  {isSubscribed ? 'Вы подписаны' : 'Подписаться'}
                </motion.button>
                {isSubscribed && (
                  <motion.button
                    type="button"
                    layout
                    className="h-11 flex items-center justify-center"
                    style={{
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--profile-button-radius)',
                    }}
                    whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      if (!viewerId || !userId) {
                        return
                      }
                      const next = !notificationsEnabled
                      if (next) {
                        const ok = await ensurePushSubscription()
                        if (!ok) {
                          return
                        }
                      }
                      setNotificationsEnabled(next)
                      const client = getSupabase()
                      if (!client) return
                      try {
                        await client
                          .from('follows')
                          .upsert({
                            follower_id: viewerId,
                            target_id: userId,
                            notifications_enabled: next,
                          })
                      } catch {
                      }
                    }}
                  >
                    <motion.div
                      key={notificationsEnabled ? 'bell-ring' : 'bell'}
                      initial={{ y: 0, rotate: 0 }}
                      animate={{
                        y: [0, -4, 0],
                        rotate: [0, -10, 10, -10, 10, 0],
                      }}
                      transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                      }}
                    >
                      {notificationsEnabled ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9M15 17H18.5905C18.973 17 19.1652 17 19.3201 16.9478C19.616 16.848 19.8475 16.6156 19.9473 16.3198C19.9997 16.1643 19.9997 15.9715 19.9997 15.5859C19.9997 15.4172 19.9995 15.3329 19.9863 15.2524C19.9614 15.1004 19.9024 14.9563 19.8126 14.8312C19.7651 14.7651 19.7048 14.7048 19.5858 14.5858L19.1963 14.1963C19.0706 14.0706 19 13.9001 19 13.7224V10C19 6.134 15.866 2.99999 12 3C8.13401 3.00001 5 6.13401 5 10V13.7224C5 13.9002 4.92924 14.0706 4.80357 14.1963L4.41406 14.5858C4.29476 14.7051 4.23504 14.765 4.1875 14.8312C4.09766 14.9564 4.03815 15.1004 4.0132 15.2524C4 15.3329 4 15.4172 4 15.586C4 15.9715 4 16.1642 4.05245 16.3197C4.15225 16.6156 4.3848 16.848 4.68066 16.9478C4.83556 17 5.02701 17 5.40956 17H9M18.0186 2.01367C19.3978 3.05299 20.4843 4.43177 21.1724 6.01574M5.98197 2.01367C4.60275 3.05299 3.5162 4.43177 2.82812 6.01574" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9M15 17H18.5905C18.973 17 19.1652 17 19.3201 16.9478C19.616 16.848 19.8475 16.6156 19.9473 16.3198C19.9997 16.1643 19.9997 15.9715 19.9997 15.5859C19.9997 15.4172 19.9995 15.3329 19.9863 15.2524C19.9614 15.1004 19.9024 14.9563 19.8126 14.8312C19.7651 14.7651 19.7048 14.7048 19.5858 14.5858L19.1963 14.1963C19.0706 14.0706 19 13.9001 19 13.7224V10C19 6.134 15.866 2.99999 12 3C8.13401 3.00001 5 6.13401 5 10V13.7224C5 13.9002 4.92924 14.0706 4.80357 14.1963L4.41406 14.5858C4.29476 14.7051 4.23504 14.765 4.1875 14.8312C4.09766 14.9564 4.03815 15.1004 4.0132 15.2524C4 15.3329 4 15.4172 4 15.586C4 15.9715 4 16.1642 4.05245 16.3197C4.15225 16.6156 4.3848 16.848 4.68066 16.9478C4.83556 17 5.02701 17 5.40956 17H9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </motion.div>
                  </motion.button>
                )}
              </div>
            </div>
          )}
          <div 
            className="flex w-full items-center justify-center" 
            style={{ 
              marginTop: 'var(--profile-switch-offset)',
              marginLeft: 'calc(-1 * var(--profile-switch-negative-margin, 12px))',
              marginRight: 'calc(-1 * var(--profile-switch-negative-margin, 12px))',
              width: 'calc(100% + (2 * var(--profile-switch-negative-margin, 12px)))'
            }}
          >
            <div
              className="relative flex w-full items-center gap-1 border border-[#2B2B2B] bg-[#111111]"
              style={{
                height: 'var(--profile-switch-height, 52px)',
                padding: 'var(--profile-switch-padding, 4px)',
                maxWidth: 'var(--profile-max-width, 380px)',
                borderRadius: 'var(--profile-border-radius)',
              }}
            >
              <button
                type="button"
                onClick={() => setProfileTab('ads')}
                className="relative flex-1 h-full px-3 text-[14px] overflow-hidden"
                style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
              >
                {profileTab === 'ads' && (
                  <motion.div
                    layoutId="profile-tabs-active"
                    className="absolute inset-0 bg-[#222222]"
                    style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8,
                    }}
                  />
                )}
                <span className={`relative z-10 ${profileTab === 'ads' ? 'text-white' : 'text-white/70'}`}>Объявления</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('about')}
                className="relative flex-1 h-full px-3 text-[14px] overflow-hidden"
                style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
              >
                {profileTab === 'about' && (
                  <motion.div
                    layoutId="profile-tabs-active"
                    className="absolute inset-0 bg-[#222222]"
                    style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8,
                    }}
                  />
                )}
                <span className={`relative z-10 ${profileTab === 'about' ? 'text-white' : 'text-white/70'}`}>О себе</span>
              </button>
              <button
                type="button"
                aria-disabled="true"
                className="flex-1 h-full px-3 text-[14px] text-white/40 cursor-not-allowed"
                style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
              >
                Скоро
              </button>
            </div>
          </div>
          <motion.div
            key={profileTab}
            className="relative w-full h-full profile-switch-transition"
            style={{ marginTop: 'var(--profile-section-margin-top, 24px)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {profileTab === 'ads' ? (
              <div className="w-full">
                {userAds.length > 0 ? (
                  <div
                    className="grid grid-cols-2 pb-4"
                    style={{
                      columnGap: 6,
                      rowGap: 6,
                      paddingLeft: 4,
                      paddingRight: 4,
                      marginLeft: -24,
                      marginRight: -24,
                      width: 'calc(100% + 48px)',
                    }}
                  >
                  {userAds.map((ad) => (
                    <AdCard
                      key={ad.id}
                      id={ad.id}
                      title={ad.title}
                      price={ad.price}
                      imageUrl={ad.imageUrl}
                      username={(ad.userTag ?? 'user').replace(/^@/, '')}
                      condition={ad.condition ?? undefined}
                      location={ad.location ?? undefined}
                      onDelete={isOwnProfile ? () => deleteAdById(ad.id) : undefined}
                      isOwn={isOwnProfile}
                      onEdit={isOwnProfile ? () => setEditingAd(ad) : undefined}
                    />
                  ))}
                  </div>
                ) : (
                  <>
                    <img
                      src="/interface/glass.png"
                      alt="empty"
                      style={{
                        position: 'absolute',
                        top: 'var(--profile-empty-icon-top)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'var(--profile-empty-icon-size)',
                        height: 'var(--profile-empty-icon-size)',
                      }}
                    />
                    <div
                      className="text-center text-[16px] leading-[1.4em] text-[#A1A1A1]"
                      style={{ position: 'absolute', left: 0, right: 0, bottom: 'var(--profile-empty-text-bottom)' }}
                    >
                      {isOwnProfile ? 'У вас ещё нет объявлений' : 'У пользователя ещё нет объявлений'}
                    </div>
                    {isOwnProfile && (
                      <button
                        type="button"
                        className="text-center bg-[#111111]"
                        style={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bottom: 'var(--profile-empty-button-bottom)',
                          width: 'var(--profile-empty-button-width)',
                          height: 'var(--profile-empty-button-height)',
                          borderRadius: 'var(--profile-button-radius)',
                          background: 'var(--profile-empty-button-bg)',
                        }}
                        onClick={() => {
                          const ev = new Event('profile-empty-add-click')
                          window.dispatchEvent(ev)
                        }}
                      >
                        <span
                          className="inline-block font-vk-demi"
                          style={{
                            fontSize: 'var(--profile-empty-button-text-size)',
                            color: 'var(--profile-empty-button-text-color)',
                            lineHeight: '1.25em',
                            letterSpacing: '0.015em',
                          }}
                        >
                          Добавить
                        </span>
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : profileTab === 'about' ? (
              <div
                className="mx-auto w-full border border-[#2B2B2B] bg-[#111111]/80 p-4"
                style={{ 
                  maxWidth: 'var(--profile-max-width, 380px)',
                  marginLeft: 'calc(-1 * var(--profile-about-negative-margin, 12px))',
                  marginRight: 'calc(-1 * var(--profile-about-negative-margin, 12px))',
                  width: 'calc(100% + (2 * var(--profile-about-negative-margin, 12px)))',
                  borderRadius: 'var(--profile-border-radius)',
                }}
              >
                <div className="space-y-4">
                  <div>
                    <div
                      className="mb-2 font-ttc-bold text-white"
                      style={{ fontSize: 'var(--profile-public-title-size)' }}
                    >
                      Описание профиля
                    </div>
                    {editMode ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => saveDescription(description.trim())}
                        className="w-full min-h-[80px] border border-[#2B2B2B] bg-[#111111] px-3 py-2 leading-[1.6em] text-white outline-none"
                        style={{ fontSize: 'var(--profile-public-text-size)', borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                      />
                    ) : (
                      <div
                        className="bg-[#0D0D0D] px-3 py-2 leading-[1.6em] text-[#A1A1A1]"
                        style={{ fontSize: 'var(--profile-public-text-size)', borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                      >
                        {description && description.trim().length > 0 ? description : 'Описание не заполнено'}
                      </div>
                    )}
                  </div>
                  <motion.div
                    className="bg-[#101010] px-3 py-3"
                    style={{ borderRadius: 'calc(var(--profile-border-radius) - 2px)' }}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <div
                      className="mb-2 font-ttc-bold text-white"
                      style={{ fontSize: 'var(--profile-public-title-size)' }}
                    >
                      О себе
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Возраст
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              onBlur={() => saveAge(age.trim())}
                              className="w-full border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ 
                                height: 'var(--profile-public-input-height)', 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            />
                          ) : (
                            <div
                              className="bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            >
                              {age && age.trim().length > 0 ? age : 'Не указан'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Город
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              onBlur={() => saveCity(city.trim())}
                              className="w-full border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ 
                                height: 'var(--profile-public-input-height)', 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            />
                          ) : (
                            <div
                              className="bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            >
                              {city && city.trim().length > 0 ? city : 'Не указано'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Пол
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={gender}
                              onChange={(e) => setGender(e.target.value)}
                              onBlur={() => saveGender(gender.trim())}
                              className="w-full border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ 
                                height: 'var(--profile-public-input-height)', 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            />
                          ) : (
                            <div
                              className="bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            >
                              {gender && gender.trim().length > 0 ? gender : 'Не указан'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Взгляды
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={political}
                              onChange={(e) => setPolitical(e.target.value)}
                              onBlur={() => savePolitical(political.trim())}
                              className="w-full border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ 
                                height: 'var(--profile-public-input-height)', 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            />
                          ) : (
                            <div
                              className="bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            >
                              {political && political.trim().length > 0 ? political : 'Не указано'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Увлечения
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={hobbies}
                              onChange={(e) => setHobbies(e.target.value)}
                              onBlur={() => saveHobbies(hobbies.trim())}
                              className="w-full border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ 
                                height: 'var(--profile-public-input-height)', 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            />
                          ) : (
                            <div
                              className="bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ 
                                fontSize: 'var(--profile-public-text-size)',
                                borderRadius: 'var(--profile-button-radius)',
                              }}
                            >
                              {hobbies && hobbies.trim().length > 0 ? hobbies : 'Не указано'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
        {editingAd && (
          <AdsEdit
            ad={editingAd}
            onClose={() => setEditingAd(null)}
          />
        )}
      </div>
    </div>
  )
}
