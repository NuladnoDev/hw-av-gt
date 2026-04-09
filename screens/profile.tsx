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
  Heart,
  ShoppingBag
} from 'lucide-react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'
import { AdCard, AdCardSkeleton, loadAdsFromStorage, deleteAdById, StoredAd } from './ads'
import AdsEdit from './Ads_Edit'
import UserAdsScreen from './UserAdsScreen'
import ProfileDecorations, { AvatarDecoration, type DecorationId } from './ProfileDecorations'
import VerifiedBadge from '../components/VerifiedBadge'
import QualityBadge from '../components/QualityBadge'
import FormattedText from '../components/FormattedText'
import ModeratorBadge from '../components/ModeratorBadge'
import dynamic from 'next/dynamic'
const GridBackground3D = dynamic(() => import('../components/GridBackground3D'), { ssr: false })

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
  onOpenChat,
}: {
  profileTab: 'ads' | 'about' | 'friends' | 'favorites' | 'reviews'
  setProfileTab: (t: 'ads' | 'about' | 'friends' | 'favorites' | 'reviews') => void
  userTag?: string
  editMode?: boolean
  isOwnProfile?: boolean
  viewUserId?: string
  onOpenProfileById?: (id: string) => void
  onOpenStoreById?: (id: string) => void
  isAuthed?: boolean
  onOpenAd?: (ad: StoredAd) => void
  onOpenChat?: (userId: string, userTag: string, avatarUrl: string | null) => void
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
  const [contactsHidden, setContactsHidden] = useState(false)
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
  const [descExpanded, setDescExpanded] = useState(false)
  const [showAllAds, setShowAllAds] = useState(false)
  const [decoration, setDecoration] = useState<DecorationId>(null)
  const [showDecorations, setShowDecorations] = useState(false)
  const [showProfileUpdate, setShowProfileUpdate] = useState(false)
  const PROFILE_UPDATE_VERSION = '2026-04-profile-v2'
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
  const [profileLastSeen, setProfileLastSeen] = useState<string | null>(null)
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

  useEffect(() => {
    if (!isOwnProfile) return
    if (typeof window !== 'undefined') {
      setContactsHidden(localStorage.getItem('hw-contacts-hidden') === '1')
    }
    const handler = (e: Event) => setContactsHidden((e as CustomEvent).detail)
    window.addEventListener('contacts-hidden-updated', handler)
    return () => window.removeEventListener('contacts-hidden-updated', handler)
  }, [isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile) return
    const handler = () => setShowDecorations(true)
    window.addEventListener('open-profile-decorations', handler)
    return () => window.removeEventListener('open-profile-decorations', handler)
  }, [isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile) return
    const seen = localStorage.getItem(`hw-profile-update:${PROFILE_UPDATE_VERSION}`)
    if (!seen) setShowProfileUpdate(true)
  }, [isOwnProfile])

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
          .select('tag, avatar_url, description, age, gender, city, political, hobbies, contacts, is_verified, is_quality, is_moderator, decoration')
          .eq('id', idLocal)
          .maybeSingle()
        if (err || !prof) {
          return
        }
        setIsVerified(!!prof.is_verified)
        setIsQuality(!!prof.is_quality)
        setIsModerator(!!prof.is_moderator)
        if (prof.decoration) setDecoration(prof.decoration as DecorationId)
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

  // Загружаем presence для чужого профиля
  useEffect(() => {
    if (isOwnProfile || !viewUserId) return
    const client = getSupabase()
    if (!client) return
    let cancelled = false
    ;(async () => {
      // Проверяем настройку видимости профиля
      const { data: profileData } = await client
        .from('profiles')
        .select('last_seen_visibility')
        .eq('id', viewUserId)
        .maybeSingle()

      if (profileData?.last_seen_visibility === 'nobody') {
        // Показываем "Был(а) недавно" — ставим время 3 дня назад как заглушку
        if (!cancelled) setProfileLastSeen('nobody')
        return
      }

      const { data } = await client
        .from('user_presence')
        .select('last_seen')
        .eq('user_id', viewUserId)
        .maybeSingle()
      if (!cancelled && data?.last_seen) setProfileLastSeen(data.last_seen)
    })()
    // Realtime
    const channel = client
      .channel(`profile-presence:${viewUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence', filter: `user_id=eq.${viewUserId}` }, (payload: any) => {
        if (payload.new?.last_seen) setProfileLastSeen(payload.new.last_seen)
      })
      .subscribe()
    return () => {
      cancelled = true
      client.removeChannel(channel)
    }
  }, [isOwnProfile, viewUserId])
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
          '--profile-avatar-size': '84px',
          '--profile-cover-height': '70px',
          '--profile-avatar-top-offset': '0px',
          '--profile-border-radius': '32px',
          '--profile-button-radius': '20px',
        } as React.CSSProperties
      }
    >
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ y: -40, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -30, opacity: 0, x: '-50%' }}
            className="fixed left-1/2 z-[1200] flex items-center justify-center px-5 py-2 backdrop-blur-3xl border border-[var(--border-light)] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            style={{
              background: theme === 'dark' 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 100%)',
              borderRadius: '20px',
              top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
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
        className="absolute left-0 w-full px-6 overflow-y-auto overflow-x-hidden pb-8 scrollbar-hidden"
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
        />

        {/* YouTube-style header */}
        <div className="w-full" style={{ marginTop: 'calc(calc(var(--profile-avatar-size) / -2) + var(--profile-avatar-top-offset, 0px))' }}>
          <div className="flex items-start gap-4">
            {/* Аватарка слева */}
            <div className="relative flex-shrink-0" style={{ isolation: 'isolate' }}>
              <div
                className="rounded-full overflow-hidden relative"
                style={{
                  width: 'var(--profile-avatar-size)',
                  height: 'var(--profile-avatar-size)',
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
                  <button type="button" onClick={() => avatarInputRef.current?.click()}
                    className="absolute left-0 top-0 h-full w-full flex items-center justify-center bg-black/20"
                  >
                    <img src="/interface/image-add.svg" alt="add" className="h-[40px] w-[40px]"
                      style={{ filter: theme === 'dark' ? 'brightness(0) saturate(100%) invert(84%) sepia(68%) saturate(569%) hue-rotate(360deg) brightness(101%) contrast(101%)' : 'none', opacity: 0.9 }}
                    />
                  </button>
                )}
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarFile(e.target.files)} />
              </div>
              {/* Онлайн-кружок */}
              {!isOwnProfile && profileLastSeen && profileLastSeen !== 'nobody' && (new Date().getTime() - new Date(profileLastSeen).getTime()) < 120000 && (
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#64CF86] border-2 border-[var(--bg-primary)]" />
              )}
              {/* Украшение */}
              <AvatarDecoration id={decoration} size={84} />
            </div>

            {/* Инфо справа */}
            <div className="flex-1 min-w-0 pt-2">
              {/* Ник + кнопка подписки в одну строку */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {!tagEditing ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-primary)] font-sf-ui-medium leading-tight truncate" style={{ fontSize: '17px' }}>
                        {tagText && tagText.trim().length > 0 ? tagText : 'user'}
                      </span>
                      {editMode && (
                        <button type="button" className="opacity-60" onClick={() => setTagEditing(true)}>
                          <img src="/interface/krr.svg" alt="edit" className="h-[16px] w-[16px]"
                            style={{ filter: theme === 'dark' ? 'brightness(0) saturate(100%) invert(84%) sepia(68%) saturate(569%) hue-rotate(360deg) brightness(101%) contrast(101%)' : 'none' }}
                          />
                        </button>
                      )}
                      {editMode && avatarUrl && (
                        <button type="button" className="opacity-60" onClick={async () => {
                          if (!userId) { setAvatarUrl(null); return }
                          const client = getSupabase()
                          if (client) await client.from('profiles').upsert({ id: userId, avatar_url: null })
                          setAvatarUrl(null)
                          window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar_url: null } }))
                        }}>
                          <img src="/interface/trash-03.svg" alt="trash" className="h-[16px] w-[16px]"
                            style={{ filter: theme === 'dark' ? 'invert(1) brightness(0.7)' : 'brightness(0.5)' }}
                          />
                        </button>
                      )}
                    </div>
                  ) : (
                    <input
                      value={tagText}
                      onChange={(e) => setTagText(e.target.value)}
                      onBlur={() => { setTagEditing(false); const n = tagText.trim(); if (n.length > 0) saveTag(n) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setTagEditing(false); const n = tagText.trim(); if (n.length > 0) saveTag(n) } }}
                      className="h-[36px] w-full border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-[15px] text-[var(--text-primary)] outline-none rounded-xl"
                    />
                  )}

                  {/* Онлайн — тестовый */}
                  <div className="mt-0.5 text-[12px] text-[var(--text-secondary)] font-sf-ui-light">
                    Был(а) недавно
                  </div>

                  {/* Бейджи + кнопка подписки в одну строку */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      {isVerified && <VerifiedBadge size={16} />}
                      {isModerator && <ModeratorBadge size={16} />}
                      {isQuality && <QualityBadge size={16} />}
                    </div>

                    {/* Кнопка подписки напротив бейджей */}
                    {!isOwnProfile && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <motion.button
                          type="button" whileTap={{ scale: 0.95 }}
                          className="h-9 px-5 flex items-center justify-center font-sf-ui-medium text-[13px] rounded-full"
                          style={{
                            background: isSubscribed ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
                            color: isSubscribed ? 'var(--text-primary)' : '#000000',
                          }}
                          onClick={async () => {
                            if (!isAuthed) { window.dispatchEvent(new Event('trigger-auth')); return }
                            if (!viewerId || !userId) return
                            const follower = isUuid(viewerId) ? viewerId : null
                            const target = isUuid(userId) ? userId : null
                            const nextSubscribed = !isSubscribed
                            setIsSubscribed(nextSubscribed)
                            setNotificationsEnabled(nextSubscribed)
                            writeLocalFollow(viewerId, userId, nextSubscribed, nextSubscribed)
                            showToast(nextSubscribed ? 'Подписка оформлена' : 'Вы отписались')
                            const client = getSupabase()
                            if (client && follower && target) {
                              if (nextSubscribed) {
                                try {
                                  await client.auth.getSession()
                                  const { error } = await client.from('follows').upsert({ follower_id: follower, target_id: target, notifications_enabled: true })
                                  if (!error) {
                                    try { await client.from('notifications').insert({ user_id: target, type: 'new_follower', actor_id: follower, actor_tag: tagText || null, actor_avatar: avatarUrl || null }) } catch {}
                                    try { await ensurePushSubscription(); await fetch('/api/push/new-follow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ followerId: follower, targetId: target }) }) } catch {}
                                  }
                                } catch {}
                              } else {
                                try { await client.from('follows').delete().eq('follower_id', follower).eq('target_id', target) } catch {}
                              }
                            }
                          }}
                        >
                          {isSubscribed ? 'Подписан' : 'Подписаться'}
                        </motion.button>
                        {isSubscribed && (
                          <motion.button type="button" whileTap={{ scale: 0.95 }}
                            className="h-8 w-8 flex items-center justify-center rounded-full"
                            style={{ background: 'rgba(255,255,255,0.08)' }}
                            onClick={() => {
                              const next = !notificationsEnabled
                              setNotificationsEnabled(next)
                              if (viewerId && userId) writeLocalFollow(viewerId, userId, true, next)
                              showToast(next ? 'Уведомления включены' : 'Уведомления выключены')
                              const client = getSupabase()
                              if (client && isUuid(viewerId ?? '') && isUuid(userId ?? '')) {
                                client.from('follows').upsert({ follower_id: viewerId, target_id: userId, notifications_enabled: next }).then(() => {})
                              }
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className={notificationsEnabled ? 'text-white' : 'text-white/40'}
                            >
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                              {!notificationsEnabled && <path d="M1 1L23 23" strokeLinecap="round"/>}
                            </svg>
                          </motion.button>
                        )}
                        {/* Кнопка чата */}
                        <motion.button type="button" whileTap={{ scale: 0.95 }}
                          className="h-8 w-8 flex items-center justify-center rounded-full"
                          style={{ background: 'rgba(255,255,255,0.08)' }}
                          onClick={() => {
                            if (!isAuthed) { window.dispatchEvent(new Event('trigger-auth')); return }
                            if (onOpenChat && userId) {
                              onOpenChat(userId, tagText || 'user', avatarUrl)
                            }
                          }}
                        >
                          {/* SVG из навигации */}
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                            <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H7l-4 2V12A8.5 8.5 0 0 1 11.5 3.5h1A8.5 8.5 0 0 1 21 12Z"/>
                            <path d="M8.5 10.5h7M8.5 14h5"/>
                          </svg>
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Описание под шапкой */}
        {description && description.trim().length > 0 && (
          <div className="mt-3">
            {editMode ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => saveDescription(description.trim())}
                className="w-full min-h-[60px] bg-transparent text-[13px] text-white/50 font-sf-ui-light leading-relaxed outline-none resize-none"
              />
            ) : (
              <div className="flex items-start gap-2">
                <p className={`text-[13px] text-white/50 font-sf-ui-light leading-relaxed flex-1 ${!descExpanded && description.length > 80 ? 'line-clamp-2' : ''}`}>
                  <FormattedText text={description} />
                </p>
                {description.length > 80 && (
                  <button
                    type="button"
                    className="text-[12px] text-white/35 font-sf-ui-light flex-shrink-0 active:opacity-60 mt-0.5"
                    onClick={() => setDescExpanded(e => !e)}
                  >
                    {descExpanded ? 'Свернуть' : 'Ещё'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Табы — стиль как в магазине */}
        <div className="flex overflow-x-auto scrollbar-hidden gap-1 mt-6 border-b border-white/[0.06]"
          style={{ marginLeft: 'calc(-1 * var(--profile-switch-negative-margin, 12px))', marginRight: 'calc(-1 * var(--profile-switch-negative-margin, 12px))' }}
        >
          {(isOwnProfile
            ? [
                { id: 'favorites', label: 'Избранное', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                )},
                { id: 'about', label: 'Описание', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                )},
                { id: 'friends', label: 'Подписки', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                )},
                { id: 'reviews', label: 'Отзывы', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                )},
              ]
            : [
                { id: 'ads', label: 'Товары', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {/* Коробка с товаром */}
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                )},
                { id: 'about', label: 'Описание', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                )},
                { id: 'friends', label: 'Подписки', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                )},
                { id: 'reviews', label: 'Отзывы', icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                )},
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setProfileTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-sf-ui-medium transition-all relative ${
                profileTab === tab.id ? 'text-white' : 'text-white/35'
              }`}
            >
              {tab.icon}
              {tab.label}
              {profileTab === tab.id && (
                <motion.div layoutId="profile-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
              )}
            </button>
          ))}
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
                  <>
                    <div
                      className="grid grid-cols-2 pb-2"
                      style={{ columnGap: 6, rowGap: 6, paddingLeft: 4, paddingRight: 4, marginLeft: -24, marginRight: -24, width: 'calc(100% + 48px)' }}
                    >
                      {(isOwnProfile ? userAds : userAds.slice(0, 2)).map((ad) => (
                        <AdCard
                          key={ad.id}
                          id={ad.id}
                          title={ad.title}
                          price={ad.price}
                          imageUrl={ad.imageUrl}
                          username={isOwnProfile ? (ad.userTag ?? 'user').replace(/^@/, '') : ''}
                          condition={ad.condition ?? undefined}
                          location={ad.location ?? undefined}
                          createdAt={ad.createdAt}
                          onDelete={isOwnProfile ? () => deleteAdById(ad.id) : undefined}
                          isOwn={isOwnProfile}
                          onEdit={isOwnProfile ? () => setEditingAd(ad) : undefined}
                          showEditLabel={isOwnProfile}
                          onClick={() => { if (onOpenAd) onOpenAd(ad) }}
                        />
                      ))}
                    </div>
                    {!isOwnProfile && userAds.length > 2 && (
                      <button
                        type="button"
                        className="mt-1 px-1 py-2 text-[12px] font-sf-ui-light text-white/45 active:opacity-60 transition-opacity text-left"
                        onClick={() => setShowAllAds(true)}
                      >
                        Показать больше объявлений
                      </button>
                    )}
                  </>
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
                    className="grid grid-cols-2 pb-6"
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
                      width: 'calc(100% + 56px)',
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
                  <div className="flex flex-col items-center justify-center pt-24 pb-12 px-6 text-center">
                    <div className="w-full max-w-[200px] mb-4 opacity-80">
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
                    {/* Плашка скрытия убрана — только надпись ниже */}
                    <div className="flex flex-col gap-1">
                      {contactsHidden && isOwnProfile ? (
                        <div className="flex items-center gap-2 py-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                          <span className="text-[13px] text-white/30 font-sf-ui-light">
                            Скрыто в{' '}
                            <button
                              type="button"
                              className="underline underline-offset-2 text-white/45 active:opacity-60"
                              onClick={() => window.dispatchEvent(new Event('open-settings'))}
                            >
                              настройках конфиденциальности
                            </button>
                          </span>
                        </div>
                      ) : (
                      contactMethods.map((method) => {
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
                              {contact ? (
                                <span className="text-white/50 text-xs" style={{ marginTop: 2 }}>
                                  {contact.url}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )
                      }))}
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : profileTab === 'friends' ? (
              <div
                className="mx-auto w-full rounded-[20px] overflow-hidden"
                style={{
                  background: '#111111',
                  maxWidth: 'var(--profile-max-width, 380px)',
                  marginLeft: 'calc(-1 * var(--profile-about-negative-margin, 12px))',
                  marginRight: 'calc(-1 * var(--profile-about-negative-margin, 12px))',
                  width: 'calc(100% + (2 * var(--profile-about-negative-margin, 12px)))',
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
                  <div className="flex flex-col">
                    {subscriptions.map((sub, idx) => {
                      const base = sub.id || sub.tag || 'user'
                      let sum = 0
                      for (let i = 0; i < base.length; i += 1) sum += base.charCodeAt(i)
                      const grad = avatarGradients[sum % avatarGradients.length]
                      const letter = sub.tag?.[0]?.toUpperCase() ?? 'U'
                      return (
                        <div key={sub.id}>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 w-full px-4 py-3 active:bg-white/[0.03] transition-colors text-left"
                            onClick={() => {
                              if (onOpenProfileById) onOpenProfileById(sub.id)
                            }}
                          >
                            {/* Аватарка */}
                            <div className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-ttc-bold text-[16px]"
                              style={{ background: sub.avatarUrl ? '#0a0a0a' : grad }}
                            >
                              {sub.avatarUrl
                                ? <img src={sub.avatarUrl} alt={sub.tag} className="w-full h-full object-cover" />
                                : letter
                              }
                            </div>
                            {/* Инфо */}
                            <div className="flex-1 min-w-0">
                              <div className="text-[15px] font-sf-ui-medium text-white/90 truncate">@{sub.tag}</div>
                              <div className="text-[12px] text-white/30 font-sf-ui-light mt-0.5 truncate">{sub.id.slice(0, 12)}...</div>
                            </div>
                            <ChevronRight size={14} className="text-white/20 flex-shrink-0" />
                          </motion.button>
                          {idx < subscriptions.length - 1 && (
                            <div className="h-px bg-white/[0.04] mx-4" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : profileTab === 'reviews' ? (
              <div className="py-10 flex flex-col items-center text-center px-4">
                <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Большая шестерёнка */}
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '70px 75px' }}
                  >
                    <circle cx="70" cy="75" r="22" stroke="#555" strokeWidth="3" fill="none"/>
                    <circle cx="70" cy="75" r="10" stroke="#666" strokeWidth="2.5" fill="none"/>
                    {[0,45,90,135,180,225,270,315].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180
                      const x1 = 70 + 22 * Math.cos(rad)
                      const y1 = 75 + 22 * Math.sin(rad)
                      const x2 = 70 + 30 * Math.cos(rad)
                      const y2 = 75 + 30 * Math.sin(rad)
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#555" strokeWidth="5" strokeLinecap="round"/>
                    })}
                  </motion.g>

                  {/* Маленькая шестерёнка */}
                  <motion.g
                    animate={{ rotate: -360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '118px 52px' }}
                  >
                    <circle cx="118" cy="52" r="14" stroke="#4a4a4a" strokeWidth="2.5" fill="none"/>
                    <circle cx="118" cy="52" r="6" stroke="#555" strokeWidth="2" fill="none"/>
                    {[0,60,120,180,240,300].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180
                      const x1 = 118 + 14 * Math.cos(rad)
                      const y1 = 52 + 14 * Math.sin(rad)
                      const x2 = 118 + 20 * Math.cos(rad)
                      const y2 = 52 + 20 * Math.sin(rad)
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a4a4a" strokeWidth="4" strokeLinecap="round"/>
                    })}
                  </motion.g>

                  {/* Гаечный ключ */}
                  <motion.g
                    animate={{ rotate: [-15, 15, -15] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ transformOrigin: '38px 118px' }}
                  >
                    <path d="M28 108 Q22 102 24 94 Q26 86 34 84 Q38 83 40 85 L36 89 Q38 91 40 89 L44 85 Q50 90 48 98 Q46 106 38 110 Z" stroke="#666" strokeWidth="1.5" fill="#2a2a2a" strokeLinejoin="round"/>
                    <rect x="35" y="108" width="6" height="22" rx="3" fill="#333" stroke="#555" strokeWidth="1.5"/>
                  </motion.g>

                  {/* Звёздочки-искры */}
                  <motion.g animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>
                    <path d="M140 90 L142 95 L147 97 L142 99 L140 104 L138 99 L133 97 L138 95 Z" fill="#888"/>
                  </motion.g>
                  <motion.g animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}>
                    <path d="M25 55 L26.5 59 L30.5 60.5 L26.5 62 L25 66 L23.5 62 L19.5 60.5 L23.5 59 Z" fill="#666"/>
                  </motion.g>
                  <motion.g animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}>
                    <path d="M155 120 L156 123 L159 124 L156 125 L155 128 L154 125 L151 124 L154 123 Z" fill="#666"/>
                  </motion.g>

                  {/* Прогресс-бар внизу */}
                  <rect x="30" y="145" width="120" height="6" rx="3" fill="#222"/>
                  <motion.rect
                    x="30" y="145" height="6" rx="3" fill="#666"
                    animate={{ width: [20, 90, 20] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </svg>

                <div className="mt-4 text-[17px] font-sf-ui-medium text-white/70">Раздел скоро появится</div>
                <div className="mt-1.5 text-[13px] text-white/30 font-sf-ui-light leading-relaxed max-w-[220px]">
                  Раздел отзывов скоро появится. Мы работаем над этим. Новости о разработке в нашем Telegram канале. А точно, его нет.
                </div>
              </div>
            ) : null}
          </motion.div>
        {editingAd && (
          <AdsEdit
            ad={editingAd}
            onClose={() => setEditingAd(null)}
          />
        )}
      </div>
      <AnimatePresence>
        {showAllAds && (
          <UserAdsScreen
            ads={userAds}
            userTag={tagText || 'user'}
            onClose={() => setShowAllAds(false)}
            onOpenAd={(ad) => { setShowAllAds(false); if (onOpenAd) onOpenAd(ad) }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDecorations && (
          <ProfileDecorations
            userId={userId}
            currentDecoration={decoration}
            avatarUrl={avatarUrl}
            gradient={gradient}
            initialLetter={initialLetter}
            tagText={tagText || undefined}
            description={description || undefined}
            onClose={() => setShowDecorations(false)}
            onSave={(id) => setDecoration(id)}
          />
        )}
      </AnimatePresence>

      {/* Плашка обновления профиля */}
      <AnimatePresence>
        {showProfileUpdate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { localStorage.setItem(`hw-profile-update:${PROFILE_UPDATE_VERSION}`, '1'); setShowProfileUpdate(false) }}
              className="fixed inset-0 z-[165] bg-black/75 backdrop-blur-md"
            />
            <div className="fixed inset-0 z-[170] flex items-end justify-center pointer-events-none">
              <motion.div
                initial={{ translateY: '100%' }} animate={{ translateY: 0 }} exit={{ translateY: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="relative w-full bg-[#121212] border-t border-white/10 rounded-t-[32px] px-6 pt-7 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pointer-events-auto"
              >
                <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/15" />

                {/* Шапка */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      <path d="M18 3l1.5 1.5M20 6h2M18 9l1.5-1.5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[22px] font-ttc-bold text-white leading-tight">Обновление профиля</h3>
                    <p className="mt-1.5 text-[13px] text-white/40 font-sf-ui-light leading-relaxed">
                      Мы переработали страницу профиля и добавили новые возможности
                    </p>
                  </div>
                </div>

                {/* Фичи */}
                <div className="space-y-2.5">
                  {[
                    {
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                        </svg>
                      ),
                      text: 'Новый дизайн шапки профиля — аватарка слева, ник и статус справа',
                    },
                    {
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ),
                      text: 'Украшения профиля — выбери эффект рядом с аватаркой',
                    },
                    {
                      icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                      ),
                      text: 'Новые вкладки: Товары, О себе, Подписки, Отзывы',
                    },
                  ].map((item, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      className="flex items-start gap-3 rounded-[16px] px-4 py-3"
                      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                      <span className="text-[13px] text-white/70 font-sf-ui-light leading-relaxed">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => { localStorage.setItem(`hw-profile-update:${PROFILE_UPDATE_VERSION}`, '1'); setShowProfileUpdate(false) }}
                  className="mt-5 h-14 w-full rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                >
                  Понятно
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
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
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(userId)

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
    if (userId) {
      setResolvedUserId(userId)
      return
    }
    try {
      const raw = window.localStorage.getItem('hw-auth')
      const auth = raw ? (JSON.parse(raw) as { uid?: string; uuid?: string }) : null
      setResolvedUserId(auth?.uuid || auth?.uid || null)
    } catch {
      setResolvedUserId(null)
    }
  }, [userId])

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
    if (!name.trim() || !resolvedUserId) return
    setLoading(true)
    const client = getSupabase()
    if (!client) {
      setLoading(false)
      return
    }

    const slug = `${slugify(name)}-${Math.floor(Math.random() * 10000)}`
    
    try {
      const { data: existingStore, error: existingStoreError } = await client
        .from('stores')
        .select('id')
        .eq('owner_id', resolvedUserId)
        .limit(1)
        .maybeSingle()

      if (existingStoreError) throw existingStoreError
      if (existingStore?.id) {
        alert('У вас уже есть магазин. Можно создать только один.')
        return
      }

      const { data: store, error: storeError } = await client
        .from('stores')
        .insert({
          name: name.trim(),
          slug,
          description: description.trim(),
          city: city.trim(),
          owner_id: resolvedUserId
        })
        .select()
        .single()

      if (storeError) throw storeError

      // Add owner
      const members = [
        { store_id: store.id, user_id: resolvedUserId, role: 'owner' },
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
            disabled={loading || (step === 1 && !name.trim()) || (step === 3 && !resolvedUserId)}
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