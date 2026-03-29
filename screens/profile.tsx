'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bell,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Lock,
  LogOut,
  MapPin,
  MoreVertical,
  Plus,
  Settings,
  Shield,
  Star,
  Trash2,
  User,
  Users,
  Wallet,
  Search,
  Package,
  X,
  RefreshCw,
  Heart
} from 'lucide-react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'
import { AdCard, AdCardSkeleton, loadAdsFromStorage, deleteAdById, StoredAd } from './ads'
import AdsEdit from './Ads_Edit'
import VerifiedBadge from '../components/VerifiedBadge'
import QualityBadge from '../components/QualityBadge'
import ModeratorBadge from '../components/ModeratorBadge'

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

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
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

const defaultRussianCities = [
  'Череповец',
  'Кадуй',
  'Москва',
  'Волгоград',
  'Владивосток',
  'Воронеж',
  'Екатеринбург',
  'Казань',
  'Калининград',
  'Краснодар',
  'Красноярск',
  'Нижний Новгород',
  'Новосибирск',
  'Омск',
  'Пермь',
  'Ростов-на-Дону',
  'Самара',
  'Санкт-Петербург',
  'Саратов',
  'Тюмень',
  'Уфа',
  'Хабаровск',
  'Челябинск',
]

export default function Profile({
  profileTab,
  setProfileTab,
  userTag,
  editMode,
  isOwnProfile = true,
  viewUserId,
  onOpenProfileById,
  onOpenStoreById,
  isAuthed,
  onOpenAd,
}: {
  profileTab: 'ads' | 'about' | 'friends' | 'favorites'
  setProfileTab: (t: 'ads' | 'about' | 'friends' | 'favorites') => void
  userTag?: string
  editMode?: boolean
  isOwnProfile?: boolean
  viewUserId?: string
  onOpenProfileById?: (id: string) => void
  onOpenStoreById?: (id: string) => void
  isAuthed?: boolean
  onOpenAd?: (ad: StoredAd) => void
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
  const [favoriteAds, setFavoriteAds] = useState<StoredAd[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const EmptyAdsIllustration = () => (
    <div className="flex flex-col items-center justify-center w-full">
      <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Floating Abstract Items (Colorful) */}
        <motion.g
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Main Card Item */}
          <rect x="60" y="30" width="60" height="80" rx="16" fill="#3B82F6" fillOpacity="0.8" />
          <rect x="70" y="45" width="40" height="4" rx="2" fill="white" fillOpacity="0.3" />
          <rect x="70" y="55" width="25" height="4" rx="2" fill="white" fillOpacity="0.15" />
          {/* Price Tag on it */}
          <rect x="85" y="80" width="30" height="18" rx="9" fill="#10B981" />
        </motion.g>

        {/* Small Floating Sparkles/Particles */}
        <motion.circle 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          cx="45" cy="50" r="4" fill="#F59E0B" 
        />
        <motion.circle 
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          cx="140" cy="90" r="6" fill="#6366F1" 
        />
        <motion.rect 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          x="130" y="40" width="8" height="8" rx="2" fill="#EC4899" fillOpacity="0.6" 
        />
      </svg>
    </div>
  )

  const EmptyFavoritesIllustration = () => (
    <div className="flex flex-col items-center justify-center w-full">
      <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Кроссовок (Sneaker) */}
        <motion.g
          animate={{ y: [0, -4, 0], rotate: [0, -1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M30 100C30 100 35 85 55 85C75 85 100 95 110 95C120 95 130 88 130 80V110H30V100Z" stroke="white" strokeOpacity="0.15" strokeWidth="2"/>
          <path d="M45 85L55 70H85L95 85" stroke="white" strokeOpacity="0.1" strokeWidth="1.5"/>
        </motion.g>

        {/* Подик (Vape/Pod) */}
        <motion.g
          animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <rect x="110" y="45" width="22" height="55" rx="4" stroke="white" strokeOpacity="0.2" strokeWidth="2" fill="#0D0D0D"/>
          <rect x="116" y="38" width="10" height="7" rx="1.5" stroke="white" strokeOpacity="0.15" strokeWidth="1.5"/>
          <circle cx="121" cy="72" r="3" stroke="white" strokeOpacity="0.25" strokeWidth="1"/>
        </motion.g>

        {/* Декоративная линия земли */}
        <line x1="20" y1="115" x2="160" y2="115" stroke="white" strokeOpacity="0.05" strokeWidth="1"/>
      </svg>
    </div>
  )

  const [editingAd, setEditingAd] = useState<StoredAd | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [subscriptions, setSubscriptions] = useState<{ id: string; tag: string; avatarUrl: string | null }[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
  const [profileInfoLoading, setProfileInfoLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [isQuality, setIsQuality] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const [userStores, setUserStores] = useState<{ id: string; name: string; avatar_url: string | null }[]>([])
  const [storesLoading, setStoresLoading] = useState(false)
  const [showCreateStore, setShowCreateStore] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false })
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-theme')
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    }
    const handleThemeUpdate = (e: Event) => {
      setTheme((e as CustomEvent).detail)
    }
    window.addEventListener('theme-updated', handleThemeUpdate)
    return () => window.removeEventListener('theme-updated', handleThemeUpdate)
  }, [])

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    
    try {
      // Trigger all useEffect hooks by changing the key
      setRefreshKey(prev => prev + 1)
      
      // Also manually trigger some things if needed
      const ev = new CustomEvent('profile-refresh-requested')
      window.dispatchEvent(ev)
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800))
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].pageY
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      const currentY = e.touches[0].pageY
      const distance = currentY - startYRef.current
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.4, 80))
      }
    }
  }

  const onTouchEnd = () => {
    if (pullDistance > 60) {
      handleRefresh()
    } else {
      setPullDistance(0)
    }
  }

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, visible: true })
    window.dispatchEvent(new CustomEvent('profile-toast-visible', { detail: true }))
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }))
      window.dispatchEvent(new CustomEvent('profile-toast-visible', { detail: false }))
    }, 2500)
  }

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
    const loadStores = async () => {
      if (!userId || !isOwnProfile) return
      setStoresLoading(true)
      const client = getSupabase()
      if (!client) {
        setStoresLoading(false)
        return
      }
      try {
        const { data, error } = await client
          .from('store_members')
          .select('store_id, stores(id, name, avatar_url)')
          .eq('user_id', userId)
        
        if (!cancelled && !error && data) {
          const stores = data.map((m: any) => ({
            id: m.stores.id,
            name: m.stores.name,
            avatar_url: m.stores.avatar_url
          }))
          setUserStores(stores)
        }
      } catch (e) {
        console.error('Error loading stores:', e)
      } finally {
        if (!cancelled) setStoresLoading(false)
      }
    }
    loadStores()
    return () => { cancelled = true }
  }, [userId, isOwnProfile, refreshKey])

  useEffect(() => {
    if (!isOwnProfile && profileTab === 'favorites') {
      setProfileTab('ads')
    }
  }, [isOwnProfile, profileTab, setProfileTab])

  useEffect(() => {
    let cancelled = false
    const loadFavorites = async () => {
      if (profileTab !== 'favorites') return
      setFavoritesLoading(true)
      try {
        const saved = localStorage.getItem('hw-favorites')
        if (!saved) {
          setFavoriteAds([])
          return
        }
        const favoriteIds = JSON.parse(saved) as string[]
        if (favoriteIds.length === 0) {
          setFavoriteAds([])
          return
        }
        
        const allAds = await loadAdsFromStorage()
        const filtered = allAds.filter(ad => favoriteIds.includes(ad.id))
        if (!cancelled) {
          setFavoriteAds(filtered.sort((a, b) => b.createdAt - a.createdAt))
        }
      } catch (e) {
        console.error('Error loading favorites:', e)
      } finally {
        if (!cancelled) setFavoritesLoading(false)
      }
    }
    loadFavorites()
    const handler = () => loadFavorites()
    window.addEventListener('favorites-updated', handler)
    return () => {
      cancelled = true
      window.removeEventListener('favorites-updated', handler)
    }
  }, [profileTab, refreshKey])

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
  }, [userId, userAltId, refreshKey])

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
          .select('tag, avatar_url, description, age, gender, city, political, hobbies, contacts, is_verified, is_quality, is_moderator')
          .eq('id', idLocal)
          .maybeSingle()
        if (err || !prof) {
          return
        }
        setIsVerified(!!prof.is_verified)
        setIsQuality(!!prof.is_quality)
        setIsModerator(!!prof.is_moderator)
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
  }, [userTag, viewUserId, refreshKey])
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
  }, [viewUserId, viewerId, refreshKey])

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
  }, [profileTab, viewUserId, userId, viewerId, refreshKey])
  useEffect(() => {
    const handleUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string; contacts?: Contact[]; is_verified?: boolean; is_quality?: boolean; is_moderator?: boolean }>
      if (typeof ev.detail?.tag === 'string') setTagText(ev.detail.tag)
      if (typeof ev.detail?.is_verified === 'boolean') setIsVerified(ev.detail.is_verified)
      if (typeof ev.detail?.is_quality === 'boolean') setIsQuality(ev.detail.is_quality)
      if (typeof ev.detail?.is_moderator === 'boolean') setIsModerator(ev.detail.is_moderator)
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
      <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center bg-[var(--bg-primary)]">
        <div className="mb-10 w-full flex justify-center">
          <svg width="280" height="240" viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background Glow */}
            <circle cx="140" cy="120" r="100" fill="url(#profile_guest_glow)" fillOpacity="0.15"/>
            
            {/* Market Stand / Interaction Concept */}
            <motion.g
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Abstract App Interface Elements */}
              <rect x="60" y="40" width="160" height="160" rx="24" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.1" strokeWidth="2"/>
              
              {/* Colorful Product Cards */}
              <motion.rect 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                x="80" y="60" width="50" height="60" rx="12" fill="#3B82F6" fillOpacity="0.8" 
              />
              <motion.rect 
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                x="150" y="80" width="50" height="60" rx="12" fill="#10B981" fillOpacity="0.8" 
              />
              <motion.rect 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                x="80" y="130" width="50" height="40" rx="12" fill="#F59E0B" fillOpacity="0.8" 
              />
              
              {/* Interaction Indicators (Hand/Click) */}
              <motion.circle 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                cx="140" cy="120" r="15" fill="white" fillOpacity="0.2" 
              />
              <path d="M140 110V130M130 120H150" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </motion.g>

            {/* Decorative Floating Elements */}
            <motion.circle animate={{ x: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }} cx="40" cy="60" r="6" fill="#6366F1" />
            <motion.rect animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} x="230" y="140" width="12" height="12" rx="3" fill="#EC4899" />
            
            <defs>
              <radialGradient id="profile_guest_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(140 120) rotate(90) scale(100)">
                <stop stopColor="#3B82F6"/>
                <stop offset="1" stopColor="#3B82F6" stopOpacity="0"/>
              </radialGradient>
            </defs>
          </svg>
        </div>
        
        <div className="space-y-3 mb-10">
          <h2 className="text-[24px] leading-[1.2] font-ttc-bold text-[var(--text-primary)]">
            Зарегистрируйтесь и пользуйтесь<br/>полным функционалом сайта!
          </h2>
          <p className="text-[15px] text-[var(--text-secondary)] font-sf-ui-light max-w-[280px] mx-auto">
            Создайте профиль, чтобы выставлять товары, общаться с продавцами и следить за обновлениями
          </p>
        </div>

        <div className="w-full space-y-3">
          <button
            type="button"
            className="h-[56px] w-full rounded-[23px] bg-[var(--text-primary)] text-[var(--bg-primary)] font-sf-ui-bold text-[17px] active:scale-[0.97] transition-all shadow-xl shadow-blue-500/10"
            onClick={() => window.dispatchEvent(new Event('trigger-auth'))}
          >
            Создать аккаунт
          </button>
          <button
            type="button"
            className="h-[56px] w-full rounded-[18px] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-sf-ui-medium text-[15px] active:scale-[0.97] transition-all"
            onClick={() => window.dispatchEvent(new CustomEvent('trigger-auth', { detail: { screen: 'login' } }))}
          >
            Уже есть профиль? Войти
          </button>
        </div>
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
          '--profile-border-radius': '32px',
          '--profile-button-radius': '20px',
        } as React.CSSProperties
      }
    >
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ y: -50, opacity: 0, x: '-50%' }}
            animate={{ y: -46, opacity: 1, x: '-50%' }}
            exit={{ y: -50, opacity: 0, x: '-50%' }}
            className="absolute left-1/2 z-[9999] flex items-center justify-center px-5 py-2 backdrop-blur-3xl border border-[var(--border-light)] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 100%)',
              borderRadius: '20px',
              top: '10px',
              minWidth: '180px',
            }}
          >
            <span className="text-[var(--text-primary)] text-[14px] font-sf-ui-semibold tracking-tight whitespace-nowrap">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        ref={scrollRef}
        className="absolute left-0 w-full px-6 overflow-y-auto pb-8 scrollbar-hidden"
        style={{
          top: '0px',
          height: '100%',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull-to-refresh Indicator */}
        <div 
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-50 transition-all duration-200"
          style={{ 
            top: 10,
            opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
          }}
        >
          <div 
            className="bg-[#1A1A1A] p-2 rounded-full border border-white/10 shadow-2xl"
            style={{ 
              transform: `translateY(${pullDistance}px)`
            }}
          >
            <RefreshCw 
              size={18} 
              className={`text-white/60 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${pullDistance * 2}deg)` }}
            />
          </div>
        </div>

        <div
          className="w-full relative"
          style={{ height: 'var(--profile-cover-height)', background: 'transparent', marginLeft: '-24px', marginRight: '-24px', width: 'calc(100% + 48px)' }}
        >
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0A0A0A] to-transparent pointer-events-none" />
        </div>
        
        <div className="flex w-full flex-col items-center relative" style={{ marginTop: 'calc(calc(var(--profile-avatar-size) / -2) + var(--profile-avatar-top-offset, 0px))' }}>
          <div
            className="rounded-full overflow-hidden relative"
            style={{
              width: 'var(--profile-avatar-size)',
              height: 'var(--profile-avatar-size)',
              boxShadow: theme === 'dark' ? `0 0 30px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.8)` : `0 4px 18px rgba(0,0,0,0.1)`,
              background: avatarUrl ? 'var(--bg-primary)' : gradient,
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
                    filter: theme === 'dark' 
                      ? 'brightness(0) saturate(100%) invert(84%) sepia(68%) saturate(569%) hue-rotate(360deg) brightness(101%) contrast(101%)'
                      : 'none',
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

          {!tagEditing ? (
            <div className="w-full flex items-center justify-center" style={{ marginTop: 'var(--profile-name-margin-top)' }}>
              {/* Левый пустой блок для симметрии (ширина кнопок + отступ) */}
              <div className="flex-1 flex justify-end items-center gap-2 mr-4">
                {isModerator && <ModeratorBadge size={22} />}
                {isQuality && <QualityBadge size={22} />}
              </div>
              
              <div className="leading-[2.3em] text-[var(--text-primary)] font-ttc-bold" style={{ fontSize: 'var(--profile-name-size)' }}>
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
                        filter: theme === 'dark'
                          ? 'brightness(0) saturate(100%) invert(84%) sepia(68%) saturate(569%) hue-rotate(360deg) brightness(101%) contrast(101%)'
                          : 'none',
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
                      style={{ filter: theme === 'dark' ? 'invert(1) brightness(0.7)' : 'brightness(0.5)' }}
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
                className="h-[40px] w-[220px] border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-[16px] leading-[1.4em] text-[var(--text-primary)] outline-none"
                style={{ borderRadius: 'var(--profile-border-radius)' }}
              />
            </div>
          )}
          {!isOwnProfile && (
            <div className="w-full mt-4 px-6">
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  layout
                  className="h-11 flex items-center justify-center font-vk-demi"
                  style={{
                    flex: isSubscribed ? 3 : 4,
                    backgroundColor: isSubscribed ? '#007AFF' : '#FFFFFF',
                    color: isSubscribed ? '#FFFFFF' : '#000000',
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
                    showToast(nextSubscribed ? 'Подписка оформлена' : 'Вы отписались')

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
                      showToast(next ? 'Уведомления включены' : 'Уведомления выключены')

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
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setProfileTab('favorites')}
                  className="relative flex-1 h-full px-3 text-[14px] overflow-hidden"
                  style={{ borderRadius: 'calc(var(--profile-border-radius) - 4px)' }}
                >
                  {profileTab === 'favorites' && (
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
                  <span className={`relative z-10 ${profileTab === 'favorites' ? 'text-white' : 'text-white/70'}`}>Избранное</span>
                </button>
              ) : (
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
              )}
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
                      onClick={() => {
                        if (onOpenAd) onOpenAd(ad)
                      }}
                    />
                  ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center pt-2">
                    <div
                      style={{
                        width: '180px',
                        height: '140px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                       }}
                     >
                       <EmptyAdsIllustration />
                     </div>
                    <div
                      className="text-center text-[15px] leading-[1.4em] text-[#A1A1A1] mt-2"
                    >
                      {isOwnProfile ? 'Вы ещё не создали ни одного объявления.' : 'У пользователя ещё нет объявлений'}
                    </div>
                    {isOwnProfile && (
                      <button
                        type="button"
                        className="text-center bg-[#111111] mt-5"
                        style={{
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
                  </div>
                )}
              </div>
            ) : profileTab === 'favorites' ? (
              <div className="w-full">
                {favoritesLoading ? (
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
                ) : favoriteAds.length > 0 ? (
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
                  {favoriteAds.map((ad) => (
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
                      isOwn={false}
                      onClick={() => {
                        if (onOpenAd) onOpenAd(ad)
                      }}
                    />
                  ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-8 pb-12 px-6 text-center">
                    <div className="w-full max-w-[200px] mb-2 opacity-80">
                      <EmptyFavoritesIllustration />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-sf-ui-semibold text-white/80 mb-1">Здесь пока пусто</h3>
                      <p className="text-[14px] text-white/30 font-sf-ui-light max-w-[220px] mx-auto">
                        Добавляйте объявления в избранное, чтобы не потерять их
                      </p>
                    </div>
                  </div>
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
                  <div className="mt-1">
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
                className="mx-auto w-full border border-white/[0.05] bg-[#111111]/60 backdrop-blur-xl p-4"
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
                          className="flex items-center gap-4 w-full px-3 py-2"
                          style={{ borderRadius: '20px' }}
                        >
                          <div
                            className="relative overflow-hidden"
                            style={{
                              borderRadius: '999px',
                              background: '#151515',
                              width: '40px',
                              height: '40px',
                            }}
                          >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        </div>
                        <div className="flex flex-col flex-1 gap-2">
                          <div className="relative h-4 w-32 rounded-full bg-[#222222] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                          </div>
                          <div className="relative h-3 w-24 rounded-full bg-[#222222] overflow-hidden">
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
                  <div className="flex flex-col gap-1">
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
                          className="flex items-center gap-4 w-full px-3 py-2 transition-colors active:bg-white/[0.05]"
                          style={{ borderRadius: '24px' }}
                          whileTap={{ scale: 0.98 }}
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
                            className="flex items-center justify-center text-white shadow-lg shadow-black/20"
                            style={{
                              borderRadius: '999px',
                              background: grad,
                              width: '40px',
                              height: '40px',
                              flexShrink: 0
                            }}
                          >
                            {sub.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sub.avatarUrl}
                                alt={sub.tag}
                                className="object-cover rounded-full w-full h-full"
                              />
                            ) : (
                              <span
                                className="font-ttc-bold text-[18px] leading-none"
                              >
                                {letter}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-start min-w-0">
                            <span
                              className="text-white font-sf-ui-medium text-[17px] leading-tight truncate w-full"
                            >
                              {sub.tag}
                            </span>
                            <span className="text-white/40 font-sf-ui-light text-[13px]">
                              id: {sub.id.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="ml-auto">
                            <ChevronLeft size={16} className="text-white opacity-20 rotate-180" />
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
      <AnimatePresence>
        {showCreateStore && (
          <CreateStoreFlow 
            onClose={() => setShowCreateStore(false)} 
            userId={userId} 
            subscriptions={subscriptions}
            onCreated={(store) => {
              setUserStores(prev => [...prev, store])
              setShowCreateStore(false)
              showToast('Магазин создан!')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateStoreFlow({ 
  onClose, 
  userId, 
  subscriptions,
  onCreated 
}: { 
  onClose: () => void; 
  userId: string | null; 
  subscriptions: { id: string; tag: string; avatarUrl: string | null }[];
  onCreated: (store: { id: string; name: string; avatar_url: string | null }) => void 
}) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [cityResults, setCityResults] = useState<string[]>(defaultRussianCities)
  const [cityLoading, setCityLoading] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [scale, setScale] = useState(1)
  const [showCityStep, setShowCityStep] = useState(false)

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
    const query = citySearch.trim()
    if (query.length < 2) {
      setCityResults(defaultRussianCities)
      setCityLoading(false)
      return
    }
    let cancelled = false
    const controller = new AbortController()
    const run = async () => {
      try {
        setCityLoading(true)
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&countrycodes=ru&limit=20&city=${encodeURIComponent(query)}`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          if (!cancelled) setCityResults(defaultRussianCities)
          return
        }
        const data = (await res.json()) as { display_name?: string }[]
        if (cancelled) return
        const names = data.map((item) => {
          const name = item.display_name ?? ''
          const comma = name.indexOf(',')
          return comma > 0 ? name.slice(0, comma) : name
        })
        const merged = names.length > 0 ? names : defaultRussianCities
        const unique = Array.from(new Set(merged))
        setCityResults(unique)
      } catch {
        if (!cancelled) setCityResults(defaultRussianCities)
      } finally {
        if (!cancelled) setCityLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [citySearch])

  const handleCreate = async () => {
    if (!name.trim() || !userId) return
    setLoading(true)
    const client = getSupabase()
    if (!client) {
      setLoading(false)
      return
    }

    const slug = `${slugify(name)}-${Math.floor(Math.random() * 10000)}`
    
    try {
      const { data: store, error: storeError } = await client
        .from('stores')
        .insert({
          name: name.trim(),
          slug,
          description: description.trim(),
          city: city.trim(),
          owner_id: userId
        })
        .select()
        .single()

      if (storeError) throw storeError

      // Add owner
      const members = [
        { store_id: store.id, user_id: userId, role: 'owner' },
        ...selectedStaff.map(uid => ({ store_id: store.id, user_id: uid, role: 'member' }))
      ]

      const { error: memberError } = await client
        .from('store_members')
        .insert(members)

      if (memberError) throw memberError

      onCreated({
        id: store.id,
        name: store.name,
        avatar_url: store.avatar_url
      })
    } catch (e) {
      console.error('Error creating store:', e)
      alert('Ошибка при создании магазина.')
    } finally {
      setLoading(false)
    }
  }

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0A0A0A] overflow-hidden" style={{ height: '100dvh' }}>
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />

        <div className="absolute left-0 w-full top-0 h-[88px] flex items-center px-6 z-10">
          <button onClick={step === 1 ? onClose : () => setStep(s => s - 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all active:scale-95">
            {step === 1 ? <X size={24} className="text-white" /> : <ChevronLeft size={28} className="text-white" />}
          </button>
        </div>

        <div className="absolute inset-0 pt-[88px] px-8 overflow-y-auto pb-32">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-[32px] font-ttc-bold text-white leading-tight">Как назовем<br/>ваш магазин?</h2>
                  <p className="mt-2 text-white/40 text-[16px] font-sf-ui-light">Это название будут видеть все покупатели</p>
                </div>
                <div className="space-y-6">
                  <div className="relative">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Название магазина"
                      autoFocus
                      className="w-full bg-transparent border-b border-white/10 py-4 text-[24px] text-white outline-none focus:border-white/30 transition-all placeholder:text-white/10 font-sf-ui-medium"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-[14px] text-white/40 ml-1">Город</div>
                    <button
                      onClick={() => setShowCityStep(true)}
                      className="h-[56px] w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-white text-left flex items-center justify-between hover:bg-white/[0.08] transition-all group"
                    >
                      <span className={city ? 'text-white font-sf-ui-medium' : 'text-white/20 font-sf-ui-light'}>
                        {city || 'Выберите город'}
                      </span>
                      <ChevronRight size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {showCityStep && (
              <motion.div
                key="cityStep"
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col"
              >
                <div className="h-[88px] flex items-center px-6">
                  <button onClick={() => setShowCityStep(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                    <ChevronLeft size={28} className="text-white" />
                  </button>
                </div>
                <div className="flex-1 px-8 pb-10 overflow-hidden flex flex-col">
                  <h2 className="text-[32px] font-ttc-bold text-white leading-tight mb-6">Выберите город</h2>
                  
                  <div className="relative mb-6">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                      <Search size={20} />
                    </span>
                    <input
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Поиск города"
                      autoFocus
                      className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 text-[18px] text-white outline-none focus:border-white/20 transition-all backdrop-blur-md"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {cityResults.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCity(c)
                          setShowCityStep(false)
                        }}
                        className={`w-full rounded-2xl px-5 py-4 text-left text-[17px] border transition-all ${
                          city === c 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/5 text-white border-white/10'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                    {cityLoading && <div className="text-center text-white/40 py-4 italic">Загрузка...</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-[32px] font-ttc-bold text-white leading-tight">Расскажите<br/>о себе</h2>
                  <p className="mt-2 text-white/40 text-[16px] font-sf-ui-light">Краткое описание поможет покупателям доверять вам</p>
                </div>
                <div className="space-y-6">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Привлекательное описание вашего магазина..."
                    autoFocus
                    className="w-full h-[200px] bg-white/5 border border-white/10 rounded-3xl p-6 text-[18px] text-white outline-none focus:border-white/20 transition-all placeholder:text-white/10 resize-none font-sf-ui-light"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-[32px] font-ttc-bold text-white leading-tight">Добавьте<br/>команду</h2>
                  <p className="mt-2 text-white/40 text-[16px] font-sf-ui-light">Выберите людей из своих подписок, которые смогут публиковать товары от имени магазина</p>
                </div>
                
                <div className="space-y-2">
                  {subscriptions.length > 0 ? (
                    subscriptions.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => toggleStaff(sub.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-3xl border transition-all ${
                          selectedStaff.includes(sub.id) 
                            ? 'bg-white border-white' 
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                          {sub.avatarUrl ? (
                            <img src={sub.avatarUrl} alt={sub.tag} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-vk-demi bg-gradient-to-br from-blue-500 to-purple-500">
                              {sub.tag[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`text-[17px] font-sf-ui-medium ${selectedStaff.includes(sub.id) ? 'text-black' : 'text-white'}`}>
                            {sub.tag}
                          </div>
                        </div>
                        {selectedStaff.includes(sub.id) && (
                          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                            <Plus size={14} className="text-white rotate-45" />
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center text-white/20 font-sf-ui-light">
                      У вас пока нет подписок,<br/>кого можно было бы добавить
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 pb-12 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent">
          <button
            onClick={step === 3 ? handleCreate : () => setStep(s => s + 1)}
            disabled={loading || (step === 1 && !name.trim())}
            className="h-[64px] w-full rounded-full bg-white text-black font-vk-demi text-[18px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-20"
          >
            {loading ? 'Создание...' : (
              <>
                {step === 3 ? 'Готово' : 'Продолжить'}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
