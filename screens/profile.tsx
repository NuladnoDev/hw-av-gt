'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'
import { AdCard, AdCardSkeleton, loadAdsFromStorage, deleteAdById, StoredAd } from './ads'
import AdsEdit from './Ads_Edit'
import VerifiedBadge from '../components/VerifiedBadge'
import QualityBadge from '../components/QualityBadge'

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

const isUuid = (value: string | null | undefined): boolean => {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

type Contact = {
  type: 'vk' | 'telegram'
  url: string
}

const normalizeContacts = (items: unknown): Contact[] => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const anyItem = item as { type?: string; url?: unknown }
      const type = anyItem.type === 'vk' || anyItem.type === 'telegram' ? anyItem.type : null
      const url = typeof anyItem.url === 'string' ? anyItem.url.trim() : ''
      if (!type || !url) return null
      return { type, url }
    })
    .filter((x): x is Contact => !!x)
}

const contactMethods: { id: string; label: string; type: Contact['type'] }[] = [
  { id: 'vk', label: 'ВКонтакте', type: 'vk' },
  { id: 'telegram', label: 'Telegram', type: 'telegram' },
]

export default function Profile({
  profileTab,
  setProfileTab,
  userTag,
  editMode,
  isOwnProfile = true,
  viewUserId,
  onOpenProfileById,
  isAuthed,
}: {
  profileTab: 'ads' | 'about' | 'friends'
  setProfileTab: (t: 'ads' | 'about' | 'friends') => void
  userTag?: string
  editMode?: boolean
  isOwnProfile?: boolean
  viewUserId?: string
  onOpenProfileById?: (id: string) => void
  isAuthed?: boolean
}) {
  const [tagText, setTagText] = useState<string>(typeof userTag === 'string' ? userTag.replace(/^@/, '') : '')
  const [tagEditing, setTagEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userAltId, setUserAltId] = useState<string | null>(null)
  const [description, setDescription] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [political, setPolitical] = useState<string>('')
  const [hobbies, setHobbies] = useState<string>('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [userAds, setUserAds] = useState<StoredAd[]>([])
  const [userAdsLoading, setUserAdsLoading] = useState(true)
  const [editingAd, setEditingAd] = useState<StoredAd | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [subscriptions, setSubscriptions] = useState<{ id: string; tag: string; avatarUrl: string | null }[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
  const [profileInfoLoading, setProfileInfoLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [isQuality, setIsQuality] = useState(false)

  const renderTextWithLinks = (text: string) => {
    if (!text) return text
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#007AFF] hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  const readLocalFollows = (): Record<string, { notificationsEnabled?: boolean | null }> => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem('hw-follows')
      if (!raw) return {}
      const parsed = JSON.parse(raw) as unknown
      if (!parsed || typeof parsed !== 'object') return {}
      return parsed as Record<string, { notificationsEnabled?: boolean | null }>
    } catch {
      return {}
    }
  }

  const writeLocalFollow = (follower: string, target: string, enabled: boolean, notif: boolean): void => {
    if (typeof window === 'undefined') return
    try {
      const key = `${follower}::${target}`
      const map = readLocalFollows()
      const next = { ...map }
      if (enabled) {
        next[key] = { notificationsEnabled: notif }
      } else {
        delete next[key]
      }
      window.localStorage.setItem('hw-follows', JSON.stringify(next))
      console.log('writeLocalFollow:', { key, enabled, notif })
    } catch (e) {
      console.error('writeLocalFollow error:', e)
    }
  }

  useEffect(() => {
    let cancelled = false
    const loadViewer = async () => {
      if (typeof window === 'undefined') return
      
      // 1. Try to get real UUID from Supabase Auth
      const client = getSupabase()
      if (client) {
        try {
          const { data } = await client.auth.getUser()
          if (cancelled) return
          const uid = data.user?.id ?? null
          if (typeof uid === 'string' && isUuid(uid)) {
            setViewerId(uid)
            console.log('Profile: viewerId set from Supabase Auth:', uid)
            return
          }
        } catch (e) {
          console.error('Profile: Supabase auth error:', e)
        }
      }
      
      // 2. Try to get UUID from hw-auth (which should store the real UUID in the 'uid' field)
      try {
        const auth = await loadLocalAuth()
        if (cancelled) return

        const uuid = auth?.uuid ?? null
        if (typeof uuid === 'string' && isUuid(uuid)) {
          setViewerId(uuid)
          console.log('Profile: viewerId set from local hw-auth UUID field:', uuid)
          return
        }

        const id = auth?.uid ?? null
        if (typeof id === 'string' && isUuid(id)) {
          setViewerId(id)
          console.log('Profile: viewerId set from local hw-auth UUID:', id)
          return
        }
        
        // 3. Fallback to whatever is in uid even if not UUID (e.g. hw-0001) for local UI
        if (id) {
          setViewerId(id)
          console.warn('Profile: viewerId set from local hw-auth, but NOT a UUID:', id)
        }
      } catch (e) {
        console.error('Profile: Local auth error:', e)
      }
    }
    loadViewer()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!userId && !userAltId) {
        setUserAds([])
        setUserAdsLoading(false)
        return
      }
      setUserAdsLoading(true)
      const all = await loadAdsFromStorage()
      if (cancelled) return
      const filtered = all.filter((a) => {
        if (userId && a.userId === userId) return true
        if (userAltId && a.userId === userAltId) return true
        return false
      })
      setUserAds(filtered.sort((a, b) => b.createdAt - a.createdAt))
      setUserAdsLoading(false)
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
  }, [userId, userAltId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setProfileInfoLoading(true)
    let idLocal: string | null = null
    let altLocal: string | null = null
    if (viewUserId) {
      idLocal = viewUserId
      altLocal = null
    } else {
      const authRaw = window.localStorage.getItem('hw-auth')
      const auth = authRaw ? (JSON.parse(authRaw) as { tag?: string; uid?: string; uuid?: string; email?: string }) : null
      const uuid = auth?.uuid ?? null
      const uid = auth?.uid ?? null
      idLocal = uuid ?? uid ?? null
      altLocal = uuid && uid && uuid !== uid ? uid : null
    }
    setUserId(idLocal)
    setUserAltId(altLocal)
    const profRaw = window.localStorage.getItem('hw-profiles')
    const profMap = profRaw
      ? (JSON.parse(profRaw) as Record<
          string,
          {
            tag?: string
            avatar_url?: string
            description?: string
            age?: string
            gender?: string
            city?: string
            political?: string
            hobbies?: string
            contacts?: Contact[]
          }
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
    const contactsRaw = p?.contacts
    const normalizedContacts = normalizeContacts(contactsRaw)
    setContacts(normalizedContacts)
    const client = getSupabase()
    if (!client || !idLocal) {
      setProfileInfoLoading(false)
      return
    }
    ;(async () => {
      try {
        const { data: prof, error: err } = await client
          .from('profiles')
          .select('tag, avatar_url, description, age, gender, city, political, hobbies, contacts, is_verified, is_quality')
          .eq('id', idLocal)
          .maybeSingle()
        if (err || !prof) {
          return
        }
        setIsVerified(!!prof.is_verified)
        setIsQuality(!!prof.is_quality)
        const tagFromDb = (prof.tag as string | undefined) ?? undefined
        const avatarFromDb = (prof.avatar_url as string | undefined) ?? undefined
        const descFromDb = (prof.description as string | undefined) ?? ''
        const ageFromDb = (prof.age as string | number | undefined) ?? undefined
        const genderFromDb = (prof.gender as string | undefined) ?? undefined
        const politicalFromDb = (prof.political as string | undefined) ?? undefined
        const hobbiesFromDb = (prof.hobbies as string | undefined) ?? undefined
        const contactsFromDb = (prof.contacts as unknown) ?? null
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
        const normalizedFromDb = normalizeContacts(contactsFromDb)
        if (normalizedFromDb.length > 0) {
          setContacts(normalizedFromDb)
        }
        setProfileInfoLoading(false)
      } catch {
        setProfileInfoLoading(false)
      }
    })()
  }, [userTag, viewUserId])
  useEffect(() => {
    let cancelled = false
    const loadFollow = async () => {
      if (!viewUserId || !viewerId) return
      const follower = isUuid(viewerId) ? viewerId : null
      const target = isUuid(viewUserId) ? viewUserId : null
      const map = readLocalFollows()
      const key = `${viewerId}::${viewUserId}`
      const entry = map[key]
      if (!follower || !target) {
        if (!entry || cancelled) return
        setIsSubscribed(true)
        setNotificationsEnabled(entry.notificationsEnabled ?? true)
        return
      }
      const client = getSupabase()
      if (!client) {
        if (!entry || cancelled) return
        setIsSubscribed(true)
        setNotificationsEnabled(entry.notificationsEnabled ?? true)
        return
      }
      try {
        const { data, error } = await client
          .from('follows')
          .select('notifications_enabled')
          .eq('follower_id', follower)
          .eq('target_id', target)
          .maybeSingle()
        if (cancelled || error) {
          if (!entry || cancelled) return
          setIsSubscribed(true)
          setNotificationsEnabled(entry.notificationsEnabled ?? true)
          return
        }
        if (!data) {
          if (!entry || cancelled) return
          setIsSubscribed(true)
          setNotificationsEnabled(entry.notificationsEnabled ?? true)
          return
        }
        if (cancelled) return
        setIsSubscribed(true)
        setNotificationsEnabled((data as { notifications_enabled?: boolean | null }).notifications_enabled ?? true)
      } catch {
        if (!entry || cancelled) return
        setIsSubscribed(true)
        setNotificationsEnabled(entry.notificationsEnabled ?? true)
      }
    }
    loadFollow()
    return () => {
      cancelled = true
    }
  }, [viewUserId, viewerId])

  useEffect(() => {
    let cancelled = false
    const loadSubscriptions = async () => {
      if (profileTab !== 'friends') return
      if (typeof window === 'undefined') return
      const ownerId = viewUserId ?? userId
      if (!ownerId) {
        setSubscriptions([])
        return
      }
      const client = getSupabase()
      if (!client || !isUuid(ownerId)) {
        if (!client && ownerId === viewerId) {
          try {
            const map = readLocalFollows()
            const prefix = `${ownerId}::`
            const keys = Object.keys(map).filter((k) => k.startsWith(prefix))
            if (keys.length === 0) {
              setSubscriptions([])
              return
            }
            const targets = Array.from(
              new Set(
                keys
                  .map((k) => k.slice(prefix.length))
                  .filter((v) => typeof v === 'string' && v.length > 0),
              ),
            )
            const profRaw = window.localStorage.getItem('hw-profiles')
            const profMap = profRaw
              ? (JSON.parse(profRaw) as Record<
                  string,
                  { tag?: string; avatar_url?: string | null }
                >)
              : {}
            const items = targets
              .map((tid) => {
                const p = profMap[tid]
                if (!p) return null
                const tagRaw = p.tag ?? null
                const tag =
                  typeof tagRaw === 'string' && tagRaw.trim().length > 0
                    ? tagRaw.replace(/^@/, '').trim()
                    : 'user'
                const avatar = typeof p.avatar_url === 'string' ? p.avatar_url : null
                return { id: tid, tag, avatarUrl: avatar }
              })
              .filter((x): x is { id: string; tag: string; avatarUrl: string | null } => !!x)
            setSubscriptions(items)
          } catch {
            setSubscriptions([])
          }
        }
        return
      }
      setSubscriptionsLoading(true)
      try {
        const { data: follows, error: followsError } = await client
          .from('follows')
          .select('target_id')
          .eq('follower_id', ownerId)
        if (cancelled || followsError || !follows || follows.length === 0) {
          if (!cancelled) {
            setSubscriptions([])
          }
          return
        }
        const targetIds = Array.from(
          new Set(
            (follows as { target_id: string | null }[])
              .map((f) => f.target_id)
              .filter((v): v is string => typeof v === 'string' && v.length > 0),
          ),
        )
        if (targetIds.length === 0) {
          setSubscriptions([])
          return
        }
        const { data: profiles, error: profilesError } = await client
          .from('profiles')
          .select('id, tag, avatar_url')
          .in('id', targetIds)
        if (cancelled || profilesError || !profiles) {
          if (!cancelled) {
            setSubscriptions([])
          }
          return
        }
        const items = targetIds
          .map((tid) => {
            const p = (profiles as { id: string; tag: string | null; avatar_url: string | null }[]).find(
              (pr) => pr.id === tid,
            )
            if (!p) return null
            const rawTag = p.tag ?? null
            const tag =
              typeof rawTag === 'string' && rawTag.trim().length > 0
                ? rawTag.replace(/^@/, '').trim()
                : 'user'
            const avatar = typeof p.avatar_url === 'string' ? p.avatar_url : null
            return { id: p.id, tag, avatarUrl: avatar }
          })
          .filter((x): x is { id: string; tag: string; avatarUrl: string | null } => !!x)
        if (!cancelled) {
          setSubscriptions(items)
        }
      } finally {
        if (!cancelled) {
          setSubscriptionsLoading(false)
        }
      }
    }
    loadSubscriptions()
    return () => {
      cancelled = true
    }
  }, [profileTab, userId, viewUserId, viewerId])
  useEffect(() => {
    const handleUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string; contacts?: Contact[]; is_verified?: boolean; is_quality?: boolean }>
      if (typeof ev.detail?.tag === 'string') setTagText(ev.detail.tag)
      if (typeof ev.detail?.is_verified === 'boolean') setIsVerified(ev.detail.is_verified)
      if (typeof ev.detail?.is_quality === 'boolean') setIsQuality(ev.detail.is_quality)
      if (typeof ev.detail?.avatar_url === 'string') setAvatarUrl(ev.detail.avatar_url)
      if (typeof ev.detail?.description === 'string') setDescription(ev.detail.description)
      if (typeof ev.detail?.age === 'string') setAge(ev.detail.age)
      if (typeof ev.detail?.gender === 'string') setGender(ev.detail.gender)
      if (typeof ev.detail?.city === 'string') setCity(ev.detail.city)
      if (typeof ev.detail?.political === 'string') setPolitical(ev.detail.political)
      if (typeof ev.detail?.hobbies === 'string') setHobbies(ev.detail.hobbies)
      if (ev.detail && 'contacts' in ev.detail) {
        const normalized = normalizeContacts(ev.detail.contacts)
        setContacts(normalized)
      }
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
      if (!viewerId) {
        console.warn('ensurePushSubscription: No viewerId')
        return false
      }
      if (!('serviceWorker' in navigator)) {
        console.warn('ensurePushSubscription: Service workers not supported')
        return false
      }

      // Check for permission first
      let perm = Notification.permission
      if (perm === 'default') {
        perm = await Notification.requestPermission()
      }
      if (perm !== 'granted') {
        console.warn('ensurePushSubscription: Permission not granted:', perm)
        return false
      }

      // Ensure service worker is registered and ready
      let reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      }
      
      // Wait for service worker to be ready
      const readyReg = await navigator.serviceWorker.ready
      
      let sub = await readyReg.pushManager.getSubscription()
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      
      if (!sub) {
        if (!publicKey || typeof publicKey !== 'string' || publicKey.length === 0) {
          console.error('ensurePushSubscription: Missing VAPID public key')
          return false
        }
        const appServerKey = urlBase64ToArrayBuffer(publicKey)
        try {
          sub = await readyReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey,
          })
        } catch (subErr) {
          console.error('ensurePushSubscription: Failed to subscribe:', subErr)
          return false
        }
      }

      if (!sub) return false

      if (isUuid(viewerId)) {
        try {
          const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: sub.toJSON(),
              userId: viewerId,
            }),
          })
          if (!res.ok) {
            console.error('ensurePushSubscription: API failed:', await res.text())
          }
        } catch (fetchErr) {
          console.error('ensurePushSubscription: Fetch error:', fetchErr)
        }
      } else {
        // Fallback: try to get real UUID from storage if current viewerId is "pretty" (hw-****)
        try {
          const auth = await loadLocalAuth()
          const realUuid = auth?.uuid
          if (realUuid && isUuid(realUuid)) {
            console.log('ensurePushSubscription: using fallback UUID from storage:', realUuid)
            const res = await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: sub.toJSON(),
                userId: realUuid,
              }),
            })
            if (!res.ok) {
              console.error('ensurePushSubscription: API failed (fallback):', await res.text())
            }
          } else {
            console.warn('ensurePushSubscription: viewerId is not a UUID and no fallback UUID found:', viewerId)
          }
        } catch (e) {
          console.warn('ensurePushSubscription: fallback failed:', e)
        }
      }
      return true
    } catch (err) {
      console.error('ensurePushSubscription: Unexpected error:', err)
      return false
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && viewerId && isUuid(viewerId)) {
      ensurePushSubscription().catch((err) => console.error('Auto ensurePushSubscription failed', err))
    }
  }, [viewerId])

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

  if (isOwnProfile && !isAuthed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center bg-[#0A0A0A]">
        <div className="mb-6 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white/5">
          <img
            src="/interface/adv.svg"
            alt="sales"
            className="h-16 w-16 opacity-80"
            style={{ filter: 'invert(1)' }}
          />
        </div>
        <h2 className="text-[20px] leading-[1.3] font-sf-ui-medium text-white mb-8">
          Зарегистрируйтесь и пользуйтесь полным функционалом сайта!
        </h2>
        <button
          type="button"
          className="h-[48px] w-full rounded-[12px] bg-white text-black font-vk-demi text-[16px] mb-4"
          onClick={() => window.dispatchEvent(new Event('trigger-auth'))}
        >
          Создать аккаунт
        </button>
        <button
          type="button"
          className="text-[14px] text-white/80 font-sf-ui-light"
          onClick={() => window.dispatchEvent(new CustomEvent('trigger-auth', { detail: { screen: 'login' } }))}
        >
          У меня уже есть аккаунт. Войти
        </button>
      </div>
    )
  }

  return (
    <div
      className="h-full w-full relative"
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
        style={{ top: '0px', height: 'var(--profile-cover-height)' }}
      >
        <div className="h-full w-full" style={{ background: '#0A0A0A' }} />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
        style={{
          width: 'var(--profile-avatar-size)',
          height: 'var(--profile-avatar-size)',
          top: 'calc(var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) + var(--profile-avatar-top-offset, 0px))',
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
          top: 'calc(var(--profile-cover-height) + calc(var(--profile-avatar-size) / 2) + 12px + var(--profile-avatar-top-offset, 0px))',
          height: 'calc(100% - var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) - 12px - var(--profile-avatar-top-offset, 0px))',
        }}
      >
        <div className="flex w-full flex-col items-center">
          {!tagEditing ? (
            <div className="w-full flex items-center justify-center" style={{ marginTop: 'var(--profile-name-margin-top)' }}>
              {/* Левый пустой блок для симметрии (ширина кнопок + отступ) */}
              <div className="flex-1 flex justify-end items-center gap-2 mr-4">
                {isQuality && <QualityBadge size={22} />}
              </div>
              
              <div className="leading-[2.3em] text-white font-ttc-bold" style={{ fontSize: 'var(--profile-name-size)' }}>
                {tagText && tagText.trim().length > 0 ? tagText : 'user'}
              </div>

              <div className="flex-1 flex items-center gap-2 ml-4">
                {isVerified && <VerifiedBadge size={22} />}
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
                    if (!isAuthed) {
                      window.dispatchEvent(new Event('trigger-auth'))
                      return
                    }
                    if (!viewerId || !userId) {
                      console.warn('Follow button clicked but missing viewerId or userId:', { viewerId, userId })
                      return
                    }
                    const follower = isUuid(viewerId) ? viewerId : null
                    const target = isUuid(userId) ? userId : null
                    const nextSubscribed = !isSubscribed
                    const nextNotifications = nextSubscribed ? true : false
                    
                    // Update UI immediately
                    setIsSubscribed(nextSubscribed)
                    setNotificationsEnabled(nextNotifications)
                    writeLocalFollow(viewerId, userId, nextSubscribed, nextNotifications)

                    const client = getSupabase()
                    console.log('Follow action:', { 
                      hasClient: !!client, 
                      follower, 
                      target, 
                      nextSubscribed,
                      viewerId,
                      userId
                    })

                    if (client && follower && target) {
                      if (nextSubscribed) {
                        try {
                          // Try to ensure session is fresh before action
                          const { data: { session } } = await client.auth.getSession()
                          console.log('Session status before upsert:', !!session)

                          const { error } = await client.from('follows').upsert({
                            follower_id: follower,
                            target_id: target,
                            notifications_enabled: nextNotifications,
                          })
                          if (error) {
                            console.error('Failed to upsert follow in DB:', error)
                          } else {
                            console.log('Successfully upserted follow to DB')
                            // Only try push subscription if DB sync was successful
                            try {
                              await ensurePushSubscription()
                              await fetch('/api/push/new-follow', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ followerId: follower, targetId: target }),
                              })
                            } catch (err) {
                              console.error('Failed to handle push/notification logic:', err)
                            }
                          }
                        } catch (err) {
                          console.error('Unexpected error during follow:', err)
                        }
                      } else {
                        try {
                          const { error } = await client
                            .from('follows')
                            .delete()
                            .eq('follower_id', follower)
                            .eq('target_id', target)
                          if (error) {
                            console.error('Failed to delete follow from DB:', error)
                          } else {
                            console.log('Successfully deleted follow from DB')
                          }
                        } catch (err) {
                          console.error('Unexpected error during unfollow:', err)
                        }
                      }
                    } else {
                      console.warn('Follow button: Skipping DB sync. Reasons:', { 
                        noClient: !client, 
                        followerNotUuid: !follower, 
                        targetNotUuid: !target 
                      })
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
                      if (!isAuthed) {
                        window.dispatchEvent(new Event('trigger-auth'))
                        return
                      }
                      if (!viewerId || !userId) {
                        return
                      }
                      const follower = isUuid(viewerId) ? viewerId : null
                      const target = isUuid(userId) ? userId : null
                      const next = !notificationsEnabled
                      
                      // Update UI immediately
                      setNotificationsEnabled(next)
                      writeLocalFollow(viewerId, userId, true, next)

                      if (next) {
                        // Attempt to ensure subscription but don't block if it fails
                        try {
                          await ensurePushSubscription()
                        } catch (err) {
                          console.error('Failed to ensure push subscription:', err)
                        }
                      }
                      
                      const client = getSupabase()
                      if (client && follower && target) {
                        try {
                          await client
                            .from('follows')
                            .upsert({
                              follower_id: follower,
                              target_id: target,
                              notifications_enabled: next,
                            })
                        } catch (err) {
                          console.error('Failed to sync notification preference to DB:', err)
                        }
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
                onClick={() => setProfileTab('friends')}
                className="relative flex-1 h-full px-3 text-[14px] overflow-hidden"
                style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
              >
                {profileTab === 'friends' && (
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
                <span className={`relative z-10 ${profileTab === 'friends' ? 'text-white' : 'text-white/70'}`}>Подписки</span>
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
                {userAdsLoading ? (
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
                    {Array.from({ length: 4 }).map((_, index) => (
                      <AdCardSkeleton key={index} />
                    ))}
                  </div>
                ) : userAds.length > 0 ? (
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
                      createdAt={ad.createdAt}
                      onDelete={isOwnProfile ? () => deleteAdById(ad.id) : undefined}
                      isOwn={isOwnProfile}
                      onEdit={isOwnProfile ? () => setEditingAd(ad) : undefined}
                      showEditLabel={isOwnProfile}
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
                      profileInfoLoading ? (
                        <div
                          className="bg-[#0D0D0D] px-3 py-3"
                          style={{ fontSize: 'var(--profile-public-text-size)', borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                        >
                          <div className="space-y-2">
                            <div className="relative h-3 w-4/5 rounded bg-[#222222] overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            </div>
                            <div className="relative h-3 w-full rounded bg-[#222222] overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            </div>
                            <div className="relative h-3 w-2/3 rounded bg-[#222222] overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="bg-[#0D0D0D] px-3 py-2 leading-[1.6em] text-[#A1A1A1] whitespace-pre-wrap"
                          style={{ fontSize: 'var(--profile-public-text-size)', borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                        >
                          {description && description.trim().length > 0 ? renderTextWithLinks(description) : 'Описание не заполнено'}
                        </div>
                      )
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
                  <div className="flex justify-center my-2">
                    <div
                      style={{
                        width: '50%',
                        height: 1,
                        background: 'rgba(255,255,255,0.12)',
                      }}
                    />
                  </div>
                  <motion.div
                    className="bg-[#101010] px-3 py-3"
                    style={{ borderRadius: 'calc(var(--profile-border-radius) - 2px)' }}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <div
                      className="mb-2 font-vk-demi text-white"
                      style={{ fontSize: 'var(--profile-public-title-size)' }}
                    >
                      Способы связи
                    </div>
                    <div className="flex flex-col gap-1">
                      {contactMethods.map((method) => {
                        const contact = contacts.find((c) => c.type === method.type)
                        return (
                          <div
                            key={method.id}
                            className="flex items-center"
                            style={{
                              paddingTop: 'var(--profile-contact-row-padding-y, 6px)',
                              paddingBottom: 'var(--profile-contact-row-padding-y, 6px)',
                              columnGap: 'var(--profile-contact-row-gap, 10px)',
                            }}
                          >
                            <div
                              className="flex items-center justify-center overflow-hidden"
                              style={{
                                width: 'var(--profile-contact-avatar-size, 32px)',
                                height: 'var(--profile-contact-avatar-size, 32px)',
                              }}
                            >
                              <img
                                src={method.type === 'telegram' ? '/interface/telegram.svg' : '/interface/vk.svg'}
                                alt={method.label}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span
                                className="text-white font-sf-ui-light"
                                style={{ fontSize: 'var(--profile-contact-label-size, 15px)' }}
                              >
                                {method.label}
                              </span>
                              {contact && (
                                <span
                                  className="text-white/50 text-xs"
                                  style={{ marginTop: 2 }}
                                >
                                  {contact.url}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : profileTab === 'friends' ? (
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
                {subscriptionsLoading ? (
                  <div className="flex flex-col gap-2 py-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 w-full px-2.5 py-2"
                        style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                      >
                        <div
                          className="relative overflow-hidden"
                          style={{
                            borderRadius: '999px',
                            background: '#151515',
                            width: 'var(--profile-subscription-avatar-size, 48px)',
                            height: 'var(--profile-subscription-avatar-size, 48px)',
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        </div>
                        <div className="flex flex-col flex-1 gap-2">
                          <div className="relative h-4 w-32 rounded bg-[#222222] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                          </div>
                          <div className="relative h-3 w-24 rounded bg-[#222222] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="py-8 text-center text-[#A1A1A1]" style={{ fontSize: 'var(--profile-public-text-size)' }}>
                    Пока ни на кого не подписан
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {subscriptions.map((sub) => {
                      const base = sub.id || sub.tag || 'user'
                      let sum = 0
                      for (let i = 0; i < base.length; i += 1) sum += base.charCodeAt(i)
                      const idx = sum % avatarGradients.length
                      const grad = avatarGradients[idx]
                      const letter = sub.tag && sub.tag.length > 0 ? sub.tag.charAt(0).toUpperCase() : 'U'
                      return (
                        <motion.button
                          key={sub.id}
                          type="button"
                          className="flex items-center gap-3 w-full px-2.5 py-2"
                          style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            if (onOpenProfileById) {
                              onOpenProfileById(sub.id)
                            } else if (typeof window !== 'undefined') {
                              const url = new URL(window.location.href)
                              url.searchParams.set('sellerId', sub.id)
                              url.searchParams.set('profileTab', 'ads')
                              window.location.href = url.toString()
                            }
                          }}
                        >
                          <div
                            className="flex items-center justify-center text-white"
                            style={{
                              borderRadius: '999px',
                              background: grad,
                              width: 'var(--profile-subscription-avatar-size, 48px)',
                              height: 'var(--profile-subscription-avatar-size, 48px)',
                            }}
                          >
                            {sub.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sub.avatarUrl}
                                alt={sub.tag}
                                className="object-cover"
                                style={{
                                  borderRadius: '999px',
                                  width: 'var(--profile-subscription-avatar-size, 48px)',
                                  height: 'var(--profile-subscription-avatar-size, 48px)',
                                }}
                              />
                            ) : (
                              <span
                                className="font-ttc-bold"
                                style={{ fontSize: 'var(--profile-subscription-avatar-letter-size, 18px)' }}
                              >
                                {letter}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-start">
                            <span
                              className="text-white font-vk-demi"
                              style={{ fontSize: 'var(--profile-subscription-tag-size, 18px)' }}
                            >
                              @{sub.tag}
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
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
