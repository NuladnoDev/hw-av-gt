'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCcw, ShoppingBag, User, Settings, Plus, ShoppingCart, Bell, ChevronRight, Heart, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Profile from './profile'
import StoreProfile from './StoreProfile'
import CreateStoreFlow from './CreateStoreFlow'
import ProfileEdit from './profile_edit'
import Setting from './Setting'
import InfoMe from './info_me'
import Links from './Links'
import ProjectVersion from './project_version'
import UserSearch from './UserSearch'
import Phone from './Phone'
import { getSupabase } from '@/lib/supabaseClient'
import StoreCatalog from './StoreCatalog'
import Ads, { type StoredAd } from './ads'
import AdDetail from './AdDetail'
import Support from './Support'
import Chat from './Chat'
import Favorites from './Favorites'

export default function HomeScreen({ isAuthed }: { isAuthed?: boolean }) {
  const [scale, setScale] = useState(1)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [activeChatAd, setActiveChatAd] = useState<StoredAd | null>(null)
  const [chatReceiver, setChatReceiver] = useState<{ id: string; name: string; avatar: string | null } | null>(null)
  
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || ''
    const ios = /iPhone|iPad|iPod/i.test(ua)
    setIsIOS(ios)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ((navigator as any).standalone === true)
    setIsStandalone(standalone)
    // Show tip if on iOS and not standalone, even for guests
    setShowIosTip(ios && !standalone)
  }, [])

  const [tab, setTab] = useState<'ads' | 'profile' | 'store'>('ads')
  const [profileTab, setProfileTab] = useState<'ads' | 'about' | 'friends' | 'favorites'>('favorites')

  const NavIcon = ({ type, active }: { type: 'ads' | 'store' | 'create' | 'profile', active: boolean }) => {
    switch (type) {
      case 'ads':
        return (
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={active ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
          >
            <rect x="3" y="3" width="7" height="7" rx="1" fill="none" />
            <rect x="14" y="3" width="7" height="7" rx="1" fill="none" />
            <rect x="14" y="14" width="7" height="7" rx="1" fill="none" />
            <rect x="3" y="14" width="7" height="7" rx="1" fill="none" />
          </motion.svg>
        )
      case 'store':
        return (
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={active ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
          >
            <path d="M3 21h18" fill="none" />
            <path d="M3 7v1a3 3 0 0 0 6 0V7m6 0v1a3 3 0 0 0 6 0V7M3 7l2-4h14l2 4M5 21V10.85M19 21V10.85M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" fill="none" />
          </motion.svg>
        )
      case 'create':
        return (
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={active ? { rotate: 90, scale: 1.15 } : { rotate: 0, scale: 1 }}
          >
            <circle cx="12" cy="12" r="10" fill="none" />
            <path d="M12 8v8" fill="none" />
            <path d="M8 12h8" fill="none" />
          </motion.svg>
        )
      case 'profile':
        return (
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={active ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" fill="none" />
            <circle cx="12" cy="7" r="4" fill="none" />
          </motion.svg>
        )
    }
  }

  const [profileEdit, setProfileEdit] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsOrigin, setSettingsOrigin] = useState<'profile' | 'edit' | null>(null)
  const [returnToSettingsAfterEdit, setReturnToSettingsAfterEdit] = useState(false)
  const [infoMeOpen, setInfoMeOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileMenuClosing, setProfileMenuClosing] = useState(false)
  const [currentTag, setCurrentTag] = useState<string | null>(() => {
    try {
      const authRaw = typeof window !== 'undefined' ? window.localStorage.getItem('hw-auth') : null
      const auth = authRaw ? (JSON.parse(authRaw) as { tag?: string | null }) : null
      const t = auth?.tag ?? null
      return typeof t === 'string' && t.trim().length > 0 ? t.trim() : null
    } catch {
      return null
    }
  })
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const authRaw = typeof window !== 'undefined' ? window.localStorage.getItem('hw-auth') : null
      const auth = authRaw ? (JSON.parse(authRaw) as { uid?: string | null, uuid?: string | null }) : null
      return auth?.uuid ?? auth?.uid ?? null
    } catch {
      return null
    }
  })
  const [selectedAd, setSelectedAd] = useState<StoredAd | null>(null)
  const [adsCreateRequested, setAdsCreateRequested] = useState(false)
  const [viewProfileMode, setViewProfileMode] = useState<'own' | 'foreign'>('own')
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null)
  const [viewStoreId, setViewStoreId] = useState<string | null>(null)
  const [profileReturnAd, setProfileReturnAd] = useState<StoredAd | null>(null)
  const [profileStack, setProfileStack] = useState<string[]>([])
  const [userStores, setUserStores] = useState<{ id: string; name: string; avatar_url: string | null }[]>([])
  const [storesLoading, setStoresLoading] = useState(false)
  const [showCreateStore, setShowCreateStore] = useState(false)
  const [storeAuthWarningOpen, setStoreAuthWarningOpen] = useState(false)
  const [storeAuthWarningLocked, setStoreAuthWarningLocked] = useState(false)
  const [linksOpen, setLinksOpen] = useState(false)
  const [projectInfoOpen, setProjectInfoOpen] = useState(false)
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<Array<{id: string, tag: string, avatarUrl: string | null}>>([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsClosing, setNotificationsClosing] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [favoritesOpen, setFavoritesOpen] = useState(false)

  const openNotifications = () => {
    setNotificationsClosing(false)
    setNotificationsOpen(true)
    setNavVisible(false)
  }

  const closeNotifications = () => {
    setNotificationsClosing(true)
    setTimeout(() => {
      setNotificationsOpen(false)
      setNotificationsClosing(false)
      setNavVisible(true)
    }, 220)
  }
  const [profileToastActive, setProfileToastActive] = useState(false)
  const [alphaModalOpen, setAlphaModalOpen] = useState(false)
  const [alphaStats, setAlphaStats] = useState<{ users: number; ads: number }>({ users: 0, ads: 0 })
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [favoriteToast, setFavoriteToast] = useState<{ visible: boolean; adId: string | null }>({ visible: false, adId: null })
  const [notifications, setNotifications] = useState<Array<{ id: string, title: string, text: string, date: string, icon: string }>>([
    {
      id: 'welcome',
      title: 'HelloWorld',
      text: 'Добро пожаловать! Спасибо, что приняли участие в тестировании нашего сайта. Мы постоянно работаем над улучшением функционала.',
      date: 'Недавно',
      icon: '/logo.svg'
    }
  ])

  useEffect(() => {
    const handleFavoriteAdded = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setFavoriteToast({ visible: true, adId: detail.adId })
      setTimeout(() => setFavoriteToast(prev => ({ ...prev, visible: false })), 4000)
    }
    const handleOpenAdDetail = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) {
        setSelectedAd(detail as StoredAd)
      }
    }
    window.addEventListener('show-favorite-added-toast', handleFavoriteAdded)
    window.addEventListener('open-ad-detail', handleOpenAdDetail)
    return () => {
      window.removeEventListener('show-favorite-added-toast', handleFavoriteAdded)
      window.removeEventListener('open-ad-detail', handleOpenAdDetail)
    }
  }, [])

  useEffect(() => {
    if (alphaModalOpen) {
      const client = getSupabase()
      if (client) {
        void (async () => {
          const [u, a] = await Promise.all([
            client.from('profiles').select('*', { count: 'exact', head: true }),
            client.from('ads').select('*', { count: 'exact', head: true })
          ])
          setAlphaStats({
            users: u.count || 0,
            ads: a.count || 0
          })
        })()
      }
    }
  }, [alphaModalOpen])

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
    if (typeof document === 'undefined') return
    const meta = document.querySelector('meta[name=\"theme-color\"]')
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#F5F5F7' : '#0A0A0A')
    }
  }, [theme])

  useEffect(() => {
    const handleToastVisible = (e: Event) => {
      setProfileToastActive((e as CustomEvent).detail)
    }
    window.addEventListener('profile-toast-visible', handleToastVisible)
    return () => window.removeEventListener('profile-toast-visible', handleToastVisible)
  }, [])

  useEffect(() => {
    const hideNav = () => setNavVisible(false)
    const showNav = () => setNavVisible(true)

    window.addEventListener('hide-bottom-nav', hideNav)
    window.addEventListener('show-bottom-nav', showNav)

    return () => {
      window.removeEventListener('hide-bottom-nav', hideNav)
      window.removeEventListener('show-bottom-nav', showNav)
    }
  }, [])
  const [adsNavNextVisible, setAdsNavNextVisible] = useState(false)
  const [adsNavNextEnabled, setAdsNavNextEnabled] = useState(false)
  const [adsNavNextLabel, setAdsNavNextLabel] = useState('Далее')
  const [adsNavNextMode, setAdsNavNextMode] = useState<'create' | 'detail' | 'edit' | null>(null)
  const searchParams = useSearchParams()

  const openProfileMenu = () => {
    setProfileMenuClosing(false)
    setProfileMenuOpen(true)
  }
  const closeProfileMenu = () => {
    setProfileMenuClosing(true)
    setTimeout(() => {
      setProfileMenuOpen(false)
      setProfileMenuClosing(false)
    }, 180)
  }

  const openUserSearch = () => {
    setUserSearchOpen(true)
  }

  const StoreAuthIllustration = () => (
    <div className="mb-6 flex justify-center w-full">
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="80" r="60" fill="url(#store_auth_glow)" fillOpacity="0.2"/>
        <motion.g
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Shop Shape */}
          <path d="M40 120H160V140H40V120Z" fill="#1C1C1E" stroke="white" strokeOpacity="0.1" strokeWidth="2"/>
          <path d="M50 70L40 120H160L150 70H50Z" fill="#1C1C1E" stroke="white" strokeOpacity="0.1" strokeWidth="2"/>
          
          {/* Shop Stripes */}
          <rect x="60" y="70" width="10" height="50" fill="#3B82F6" fillOpacity="0.3" />
          <rect x="95" y="70" width="10" height="50" fill="#3B82F6" fillOpacity="0.3" />
          <rect x="130" y="70" width="10" height="50" fill="#3B82F6" fillOpacity="0.3" />

          {/* Large Lock */}
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <circle cx="100" cy="95" r="28" fill="white" />
            <path d="M92 95V88C92 83.5817 95.5817 80 100 80C104.418 80 108 83.5817 108 88V95M88 95H112V108C112 110.209 110.209 112 108 112H92C89.7909 112 88 110.209 88 108V95Z" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </motion.g>
        </motion.g>
        <defs>
          <radialGradient id="store_auth_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 80) rotate(90) scale(80)">
            <stop stopColor="#3B82F6"/>
            <stop offset="1" stopColor="#3B82F6" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
  
  const closeUserSearch = () => {
    setUserSearchOpen(false)
    setUserSearchQuery('')
    setUserSearchResults([])
  }

  const closeAllWindows = () => {
    setSettingsOpen(false)
    setProfileEdit(false)
    setInfoMeOpen(false)
    setProfileMenuOpen(false)
    setUserSearchOpen(false)
    setUserSearchQuery('')
    setUserSearchResults([])
    setPhoneOpen(false)
    setSelectedAd(null)
    setSupportOpen(false)
    setFavoritesOpen(false)
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([])
      return
    }
    
    // Require at least 2 characters for search (to avoid single letter searches)
    if (query.trim().length < 2) {
      setUserSearchResults([])
      return
    }
    
    setUserSearchLoading(true)
    try {
      const client = getSupabase()
      if (!client) {
        setUserSearchResults([])
        return
      }
      
      // Поиск пользователей по тегу с 80% совпадением
      const { data, error } = await client
        .from('profiles')
        .select('id, tag, avatar_url')
        .ilike('tag', `%${query}%`)
        .limit(10)
      
      if (error) {
        console.error('Ошибка поиска пользователей:', error)
        // Handle JWT expired error
        if (error.code === 'PGRST303') {
          console.log('JWT expired, attempting to refresh...')
          // Try to refresh the session
          try {
            const { data: { session } } = await client.auth.getSession()
            if (!session) {
              // Session is invalid, clear results and potentially redirect to login
              setUserSearchResults([])
              return
            }
            // Session refreshed, retry the search
            const retryResult = await client
              .from('profiles')
              .select('id, tag, avatar_url')
              .ilike('tag', `%${query}%`)
              .limit(10)
            
            if (retryResult.error) {
              setUserSearchResults([])
              return
            }
            
            const retryResults = (retryResult.data || []).map(user => ({
              id: user.id,
              tag: user.tag || 'user',
              avatarUrl: user.avatar_url && user.avatar_url.startsWith('http') ? user.avatar_url : null
            }))
            
            setUserSearchResults(retryResults)
            return
          } catch (refreshError) {
            console.error('Failed to refresh session:', refreshError)
            setUserSearchResults([])
            return
          }
        }
        setUserSearchResults([])
        return
      }
      
      const results = (data || []).map(user => ({
        id: user.id,
        tag: user.tag || 'user',
        avatarUrl: user.avatar_url && user.avatar_url.startsWith('http') ? user.avatar_url : null
      }))
      
      setUserSearchResults(results)
    } catch (error) {
      console.error('Ошибка при поиске пользователей:', error)
      setUserSearchResults([])
    } finally {
      setUserSearchLoading(false)
    }
  }

  const handleBackFromForeignProfile = () => {
    closeAllWindows()
    if (profileStack.length > 0) {
      const last = profileStack[profileStack.length - 1]
      const rest = profileStack.slice(0, -1)
      setProfileStack(rest)
      if (last === '__own__') {
        setViewProfileMode('own')
        setViewProfileUserId(null)
        setViewStoreId(null)
        setProfileReturnAd(null)
        setTab('profile')
      } else if (last.startsWith('store:')) {
        setViewProfileMode('foreign')
        setViewProfileUserId(null)
        setViewStoreId(last.replace('store:', ''))
        setProfileReturnAd(null)
        setTab('profile')
      } else {
        setViewProfileMode('foreign')
        setViewProfileUserId(last)
        setViewStoreId(null)
        setProfileReturnAd(null)
        setTab('profile')
      }
      return
    }
    if (profileReturnAd) {
      setSelectedAd(profileReturnAd)
    }
    setViewProfileMode('own')
    setViewProfileUserId(null)
    setViewStoreId(null)
    setProfileReturnAd(null)
    setTab('ads')
  }

  const openStoreProfile = (storeId: string) => {
    closeAllWindows()
    setTab('profile')
    setProfileEdit(false)
    setSelectedAd(null)
    setProfileReturnAd(null)
    setProfileStack((prev) => {
      if (tab === 'profile') {
        const currentId = viewStoreId ? `store:${viewStoreId}` : (viewProfileMode === 'foreign' ? viewProfileUserId ?? null : null)
        const marker = currentId ?? '__own__'
        return [...prev, marker]
      }
      return prev
    })
    setViewProfileMode('foreign')
    setViewProfileUserId(null)
    setViewStoreId(storeId)
    setProfileTab('ads')
  }

  useEffect(() => {
    let cancelled = false
    const loadStores = async () => {
      if (!currentUserId) {
        setUserStores([])
        return
      }
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
          .eq('user_id', currentUserId)
        
        if (!cancelled && !error && data) {
          const stores = data.map((m: any) => ({
            id: m.stores.id,
            name: m.stores.name,
            avatar_url: m.stores.avatar_url
          }))
          setUserStores(stores)
        }
      } catch (e) {
        console.error('Error loading stores in home:', e)
      } finally {
        if (!cancelled) setStoresLoading(false)
      }
    }
    loadStores()
    
    const handleRefresh = () => loadStores()
    window.addEventListener('refresh-user-stores', handleRefresh)
    return () => { 
      cancelled = true
      window.removeEventListener('refresh-user-stores', handleRefresh)
    }
  }, [currentUserId])

  useEffect(() => {
    const sellerId = searchParams.get('seller')
    const profileTabParam = searchParams.get('profileTab')
    if (sellerId) {
      setViewProfileMode('foreign')
      setViewProfileUserId(sellerId)
      setViewStoreId(null)
      if (profileTabParam === 'ads' || profileTabParam === 'about' || profileTabParam === 'friends') {
        setProfileTab(profileTabParam)
      } else {
        setProfileTab('ads')
      }
    }
  }, [searchParams])
  useEffect(() => {
    const handleNavState = (event: Event) => {
      const anyEvent = event as CustomEvent<{
        showNextInNav?: boolean
        enabled?: boolean
        label?: string
        mode?: 'create' | 'detail' | 'edit' | null
      }>
      const detail = anyEvent.detail ?? {}
      setAdsNavNextVisible(!!detail.showNextInNav)
      setAdsNavNextEnabled(!!detail.enabled)
      if (typeof detail.label === 'string' && detail.label.trim().length > 0) {
        setAdsNavNextLabel(detail.label)
      }
      if (detail.mode === 'create' || detail.mode === 'detail' || detail.mode === 'edit') {
        setAdsNavNextMode(detail.mode)
      } else if (detail.showNextInNav === false) {
        setAdsNavNextMode(null)
      }
    }
    window.addEventListener('ads-create-nav-state', handleNavState as EventListener)
    return () => {
      window.removeEventListener('ads-create-nav-state', handleNavState as EventListener)
    }
  }, [])
  useEffect(() => {
    const handleOpenContacts = () => {
      setTab('profile')
      setProfileEdit(false)
      setSettingsOpen(false)
      setInfoMeOpen(false)
      setLinksOpen(true)
    }
    window.addEventListener('open-contacts', handleOpenContacts)
    return () => {
      window.removeEventListener('open-contacts', handleOpenContacts)
    }
  }, [])
  useEffect(() => {
    const handleCloseStoreProfile = () => {
      closeAllWindows()
      setTab('store')
      setViewStoreId(null)
      setViewProfileMode('own')
      setViewProfileUserId(null)
      setProfileReturnAd(null)
      setProfileStack([])
    }
    window.addEventListener('close-store-profile', handleCloseStoreProfile)
    return () => {
      window.removeEventListener('close-store-profile', handleCloseStoreProfile)
    }
  }, [])
  useEffect(() => {
    const handleOpenFavorites = () => {
      setFavoritesOpen(true)
    }
    window.addEventListener('open-favorites', handleOpenFavorites)
    return () => {
      window.removeEventListener('open-favorites', handleOpenFavorites)
    }
  }, [])
  useEffect(() => {
    const client = getSupabase()
    if (!client) return
    ;(async () => {
      const { data } = await client.auth.getUser()
      const id = data.user?.id ?? null
      const email = data.user?.email ?? null
      if (id) setCurrentUserId(id)
      if (!id) {
        const authRaw = window.localStorage.getItem('hw-auth')
        const auth = authRaw ? (JSON.parse(authRaw) as { tag?: string | null }) : null
        const t = auth?.tag ?? null
        setCurrentTag(typeof t === 'string' && t?.trim().length > 0 ? t!.trim() : null)
        return
      }
      const { data: prof } = await client.from('profiles').select('tag').eq('id', id).maybeSingle()
      const existingTag = (prof?.tag as string | undefined) ?? undefined
      if (typeof existingTag === 'string' && existingTag.trim().length > 0) {
        setCurrentTag(existingTag.trim())
      } else {
        const tagFromEmail = typeof email === 'string' ? email.split('@')[0] : null
        if (tagFromEmail && tagFromEmail.trim().length > 0) {
          await client.from('profiles').upsert({ id, tag: tagFromEmail.trim() })
          setCurrentTag(tagFromEmail.trim())
          window.localStorage.setItem('hw-auth', JSON.stringify({ tag: tagFromEmail.trim(), uid: id, uuid: id, email }))
          window.dispatchEvent(new Event('local-auth-changed'))
        } else {
          setCurrentTag(null)
        }
      }
    })()
  }, [])
  useEffect(() => {
    const handleProfileEmptyAdd = () => {
      closeAllWindows()
      setTab('ads')
      setProfileTab('ads')
      setTimeout(() => {
        setAdsCreateRequested(true)
      }, 220)
    }
    window.addEventListener('profile-empty-add-click', handleProfileEmptyAdd)
    return () => {
      window.removeEventListener('profile-empty-add-click', handleProfileEmptyAdd)
    }
  }, [])
  useEffect(() => {
    const client = getSupabase()
    if (!client) return
    const { data: sub } = client.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null
      const email = session?.user?.email ?? null
      const tagFromEmail = typeof email === 'string' ? email.split('@')[0] : null
      if (uid && tagFromEmail && tagFromEmail.trim().length > 0) {
        window.localStorage.setItem('hw-auth', JSON.stringify({ tag: tagFromEmail.trim(), uid, uuid: uid, email }))
        setCurrentTag(tagFromEmail.trim())
        setCurrentUserId(uid)
      }
      if (event === 'SIGNED_OUT') {
        window.localStorage.removeItem('hw-auth')
        setCurrentTag(null)
        setCurrentUserId(null)
      }
    })
    return () => {
      sub?.subscription?.unsubscribe()
    }
  }, [])
  useEffect(() => {
    const handleUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ tag?: string; avatar_url?: string; description?: string }>
      if (typeof ev.detail?.tag === 'string') {
        setCurrentTag(ev.detail.tag)
      }
    }
    window.addEventListener('profile-updated', handleUpdated as EventListener)
    return () => window.removeEventListener('profile-updated', handleUpdated as EventListener)
  }, [])
  useEffect(() => {
    const handleClosed = (e: Event) => {
      setProfileEdit(false)
      setProfileTab('about')
    }
    window.addEventListener('profile-edit-closed', handleClosed as EventListener)
    return () => window.removeEventListener('profile-edit-closed', handleClosed as EventListener)
  }, [])
  useEffect(() => {
    const openSettings = () => {
      setSettingsOrigin('edit')
      setSettingsOpen(true)
    }
    const closeSettings = () => setSettingsOpen(false)
    const openProfileEdit = () => setProfileEdit(true)
    const openInfoMe = () => {
      setSettingsOpen(false)
      setInfoMeOpen(true)
    }
    const closeInfoMe = () => {
      setInfoMeOpen(false)
      setSettingsOpen(true)
    }
    const openPhone = () => {
      setSettingsOpen(false)
      setPhoneOpen(true)
    }
    const closePhone = () => {
      setPhoneOpen(false)
      setSettingsOpen(true)
    }
    window.addEventListener('open-settings', openSettings)
    window.addEventListener('close-settings', closeSettings)
    window.addEventListener('open-profile-edit', openProfileEdit)
    window.addEventListener('open-info-me', openInfoMe)
    window.addEventListener('close-info-me', closeInfoMe)
    window.addEventListener('open-phone', openPhone)
    window.addEventListener('close-phone', closePhone)
    return () => {
      window.removeEventListener('open-settings', openSettings)
      window.removeEventListener('close-settings', closeSettings)
      window.removeEventListener('open-profile-edit', openProfileEdit)
      window.removeEventListener('open-info-me', openInfoMe)
      window.removeEventListener('close-info-me', closeInfoMe)
      window.removeEventListener('open-phone', openPhone)
      window.removeEventListener('close-phone', closePhone)
    }
  }, [])

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
  }, [tab])
  useEffect(() => {
    if (!storeAuthWarningOpen) return
    setStoreAuthWarningLocked(true)
    const t = setTimeout(() => {
      setStoreAuthWarningLocked(false)
    }, 2000)
    return () => clearTimeout(t)
  }, [storeAuthWarningOpen])

  const isStandaloneIOS = isIOS && isStandalone
  const frameWidth = isStandaloneIOS ? '100vw' : '375px'
  const frameHeight = isStandaloneIOS ? '100dvh' : '812px'
  const frameTransform = isStandaloneIOS ? 'none' : `scale(${scale})`
  const safeTop = 'env(safe-area-inset-top, 0px)'
  const homeHeaderOffset = isStandaloneIOS ? '0px' : 'var(--home-header-offset)'
  const headerTop = isStandaloneIOS ? '0px' : `calc(${safeTop} + ${homeHeaderOffset})`
  const headerHeight = isStandaloneIOS ? `calc(${safeTop} + 56px)` : '56px'
  const headerInnerMarginTop = isStandaloneIOS ? safeTop : '0px'
  const iosHeaderBackground =
    theme === 'light'
      ? 'linear-gradient(to bottom, rgba(245,245,247,0.92), rgba(245,245,247,0.55), rgba(245,245,247,0))'
      : 'linear-gradient(to bottom, rgba(10,10,10,0.72), rgba(10,10,10,0.25), rgba(10,10,10,0))'
  const homeContentTop = isStandaloneIOS
    ? '56px'
    : `calc(${safeTop} + ${homeHeaderOffset} + 56px)`
  const homeContentHeight = `calc(${frameHeight} - (${homeContentTop}))`

  return (
    <div className={`fixed inset-0 w-full bg-[var(--bg-primary)] overflow-hidden ${isStandaloneIOS ? '' : 'flex items-center justify-center'}`}>
      <div className="relative" style={{ width: frameWidth, height: frameHeight, transform: frameTransform, transformOrigin: 'center center', fontSmooth: 'antialiased', WebkitFontSmoothing: 'antialiased', touchAction: 'pan-y' } as React.CSSProperties}>
        <div
          className="absolute left-0 top-0 h-full w-full"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        />

        {tab !== 'profile' ? (
          <div
            className="absolute left-0 w-full z-[100]"
            style={{ 
              top: headerTop,
              height: headerHeight,
              background: isStandaloneIOS ? iosHeaderBackground : 'var(--bg-primary)',
              boxShadow: isStandaloneIOS ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.4)',
              backdropFilter: isStandaloneIOS ? 'blur(10px)' : 'none',
              WebkitBackdropFilter: isStandaloneIOS ? 'blur(10px)' : 'none',
            }}
          >
            <div className="relative h-[56px] w-full px-6 flex items-center justify-center" style={{ marginTop: headerInnerMarginTop }}>
            <div className="absolute left-6 flex h-full items-center">
              <button
                type="button"
                onClick={() => setAlphaModalOpen(true)}
                className="px-2 py-0.5 rounded-lg bg-[#FFD700] text-black text-[11px] font-sf-ui-bold lowercase tracking-tight shadow-lg active:scale-95 transition-all border border-black/5"
              >
                test
              </button>
            </div>
            <button 
              type="button"
              className="flex items-center gap-2.5"
            >
              <div className="text-[22px] font-sf-ui-medium leading-[1em] text-[var(--text-primary)]">
                {tab === 'ads' ? 'HelloWorld-store' : tab === 'store' || viewStoreId ? 'Магазин' : 'Профиль'}
              </div>
            </button>
            <div className="absolute right-6 flex h-full items-center">
              <button
                type="button"
                onClick={openNotifications}
                className="flex h-full items-center active:scale-90 transition-transform"
                aria-label="Уведомления"
              >
                <Bell
                  className="h-[24px] w-[24px] text-[var(--text-primary)]"
                  strokeWidth={2.5}
                />
              </button>
            </div>
            </div>
          </div>
        ) : (
          <div
            className="absolute left-0 w-full z-[100]"
            style={{ 
              top: headerTop,
              height: headerHeight,
              background: isStandaloneIOS ? iosHeaderBackground : 'var(--bg-primary)',
              boxShadow: isStandaloneIOS ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.4)',
              backdropFilter: isStandaloneIOS ? 'blur(10px)' : 'none',
              WebkitBackdropFilter: isStandaloneIOS ? 'blur(10px)' : 'none',
            }}
          >
            <div className="relative h-[56px] w-full" style={{ marginTop: headerInnerMarginTop }}>
              {viewProfileMode === 'own' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthed) {
                      window.dispatchEvent(new Event('trigger-auth'))
                      return
                    }
                    setProfileEdit((v) => !v)
                  }}
                  className={`absolute left-6 top-0 flex h-full items-center transition-all duration-200 ${!isAuthed ? 'opacity-30 grayscale' : ''}`}
                  aria-label="Редактировать профиль"
                >
                  <img
                     src="/interface/pencil-02.svg"
                     alt="edit"
                     className="h-[22px] w-[22px]"
                     style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
                   />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBackFromForeignProfile}
                  className="absolute left-6 top-0 flex h-full items-center"
                  aria-label="Назад к объявлению"
                >
                  <img
                    src="/interface/chevron-left.svg"
                    alt="back"
                    className="h-[22px] w-[22px]"
                    style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
                  />
                </button>
              )}
              <div className="absolute right-6 top-0 flex h-full items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthed) {
                      window.dispatchEvent(new Event('trigger-auth'))
                      return
                    }
                    if (profileMenuOpen) closeProfileMenu()
                    else openProfileMenu()
                  }}
                  className={`flex h-full items-center transition-all duration-200 ${!isAuthed ? 'opacity-30 grayscale' : ''}`}
                  aria-label="Открыть меню профиля"
                >
                  <img
                    src="/interface/dot-vertical.svg"
                    alt="menu"
                    className="h-[22px] w-[22px]"
                    style={{ filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
                  />
                </button>
              </div>
              <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center">
                <div 
                  className="text-[28px] font-bold leading-[1em] text-[var(--text-primary)] font-ttc-bold transition-opacity duration-200"
                  style={{ opacity: profileToastActive ? 0 : 1 }}
                >
                  {viewStoreId ? 'Магазин' : 'Профиль'}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <>
            <div 
              className="absolute left-0 w-full z-[85] pointer-events-none bg-gradient-to-b from-[#0A0A0A] to-transparent"
              style={{ 
                top: homeContentTop,
                height: '32px'
              }}
            />
            <motion.div
              key={`profile-screen-${viewProfileMode}-${viewStoreId ? `store-${viewStoreId}` : (viewProfileUserId ?? 'own')}`}
            className="absolute left-0 w-full overflow-hidden"
            style={{
              top: homeContentTop,
              height: homeContentHeight,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {viewStoreId ? (
              <StoreProfile
                storeId={viewStoreId}
                currentUserId={currentUserId}
                onOpenProfileById={(id) => {
                  if (!id) return
                  closeAllWindows()
                  setTab('profile')
                  setProfileEdit(false)
                  setSelectedAd(null)
                  setProfileReturnAd(null)
                  setProfileStack((prev) => {
                    if (tab === 'profile') {
                      const currentId = viewStoreId ? `store:${viewStoreId}` : (viewProfileMode === 'foreign' ? viewProfileUserId ?? null : null)
                      const marker = currentId ?? '__own__'
                      return [...prev, marker]
                    }
                    return prev
                  })
                  setViewProfileMode('foreign')
                  setViewProfileUserId(id)
                  setViewStoreId(null)
                  setProfileTab('ads')
                }}
              />
            ) : (
              <Profile
                isAuthed={isAuthed}
                profileTab={profileTab}
                setProfileTab={setProfileTab}
                userTag={
                  viewProfileMode === 'foreign'
                    ? profileReturnAd?.userTag ?? undefined
                    : currentTag ?? undefined
                }
                isOwnProfile={viewProfileMode === 'own'}
                viewUserId={viewProfileMode === 'foreign' ? viewProfileUserId ?? undefined : undefined}
                onOpenStoreById={openStoreProfile}
                onOpenAd={(ad) => {
                  setSelectedAd(ad)
                }}
                onOpenProfileById={(id) => {
                  if (!id) return
                  closeAllWindows()
                  setTab('profile')
                  setProfileEdit(false)
                  setSelectedAd(null)
                  setProfileReturnAd(null)
                  setProfileStack((prev) => {
                    if (tab === 'profile') {
                      const currentId = viewProfileMode === 'foreign' ? viewProfileUserId ?? null : null
                      const marker = currentId ?? '__own__'
                      return [...prev, marker]
                    }
                    return prev
                  })
                  setViewProfileMode('foreign')
                  setViewProfileUserId(id)
                  setViewStoreId(null)
                  setProfileTab('ads')
                }}
              />
            )}
            {profileMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0"
                  style={{ zIndex: 130 }}
                  onClick={closeProfileMenu}
                />
                <motion.div
                  layoutId="store-create-expansion"
                  className="fixed right-4"
                  style={{
                    top: `calc(${headerTop} + 56px + 12px)`,
                    zIndex: 140,
                  }}
                  >
                    <motion.div
                      className={profileMenuClosing ? 'profile-menu-out' : 'profile-menu-in'}
                      style={{
                      width: 'var(--profile-menu-width)',
                      borderRadius: 'var(--profile-menu-radius)',
                      transformOrigin: 'var(--profile-menu-transform-origin)',
                      background: 'var(--profile-menu-bg)',
                      border: '1px solid var(--profile-menu-border)',
                      boxShadow: 'var(--profile-menu-shadow)',
                      overflow: 'hidden',
                      backdropFilter: 'blur(var(--profile-menu-item-backdrop-blur))',
                      WebkitBackdropFilter: 'blur(var(--profile-menu-item-backdrop-blur))',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      paddingTop: 'var(--profile-menu-padding-top)',
                      paddingBottom: 'var(--profile-menu-padding-bottom)',
                      paddingLeft: 'var(--profile-menu-padding-x)',
                      paddingRight: 'var(--profile-menu-padding-x)',
                      }}
                    >
                      {viewProfileMode === 'own' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              closeProfileMenu()
                              setProfileEdit(true)
                            }}
                            className="flex w-full items-center"
                            style={{
                              height: 'var(--profile-menu-edit-height)',
                              paddingLeft: 'var(--profile-menu-item-padding-x)',
                              paddingRight: 'var(--profile-menu-item-padding-x)',
                              background: 'var(--profile-menu-item-bg)',
                            }}
                          >
                            <div
                              className="flex w-full items-center"
                              style={{ columnGap: 'var(--profile-menu-item-gap)' }}
                            >
                              <span
                                className="font-sf-ui-light"
                                style={{
                                  fontSize: 'var(--profile-menu-item-font-size)',
                                  color: 'var(--profile-menu-item-text-color)',
                                  lineHeight: 'var(--profile-menu-edit-line-height)',
                                  textAlign: 'left',
                                }}
                              >
                                <span>Редактировать</span>
                                <br />
                                <span>профиль</span>
                              </span>
                              <div
                                style={{
                                  marginLeft: 'auto',
                                  width: 'var(--profile-menu-item-icon-size)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                <img
                                  src="/interface/pencil-01.svg"
                                  alt=""
                                  style={{
                                    width: 'var(--profile-menu-item-icon-size)',
                                    height: 'var(--profile-menu-item-icon-size)',
                                    filter: 'var(--profile-menu-item-icon-filter)',
                                  }}
                                />
                              </div>
                            </div>
                          </button>
                          <div
                            style={{
                              height: 'var(--profile-menu-divider-thickness)',
                              background: 'var(--profile-menu-divider-color)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              closeProfileMenu()
                              setSettingsOrigin('profile')
                              setSettingsOpen(true)
                            }}
                            className="flex w-full items-center"
                            style={{
                              height: 'var(--profile-menu-item-height)',
                              paddingLeft: 'var(--profile-menu-item-padding-x)',
                              paddingRight: 'var(--profile-menu-item-padding-x)',
                              background: 'var(--profile-menu-item-bg)',
                            }}
                          >
                            <div
                              className="flex w-full items-center"
                              style={{ columnGap: 'var(--profile-menu-item-gap)' }}
                            >
                              <span
                                className="font-sf-ui-light"
                                style={{
                                  fontSize: 'var(--profile-menu-item-font-size)',
                                  color: 'var(--profile-menu-item-text-color)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Настройки
                              </span>
                              <div
                                style={{
                                  marginLeft: 'auto',
                                  width: 'var(--profile-menu-item-icon-size)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                <img
                                  src="/setting/settings.svg"
                                  alt=""
                                  style={{
                                    width: 'var(--profile-menu-item-icon-size)',
                                    height: 'var(--profile-menu-item-icon-size)',
                                    filter: 'var(--profile-menu-item-icon-filter)',
                                  }}
                                />
                              </div>
                            </div>
                          </button>
                          <div
                            style={{
                              height: 'var(--profile-menu-divider-thickness)',
                              background: 'var(--profile-menu-divider-color)',
                            }}
                          />
                        </>
                      )}
                      <button
                      type="button"
                      onClick={() => {
                        closeProfileMenu()
                        window.open('https://t.me/test', '_blank')
                      }}
                      className="flex w-full items-center"
                      style={{
                        height: 'var(--profile-menu-item-height)',
                        paddingLeft: 'var(--profile-menu-item-padding-x)',
                        paddingRight: 'var(--profile-menu-item-padding-x)',
                        background: 'var(--profile-menu-item-bg)',
                      }}
                    >
                      <div
                        className="flex w-full items-center"
                        style={{ columnGap: 'var(--profile-menu-item-gap)' }}
                      >
                        <span
                          className="font-sf-ui-light"
                          style={{
                            fontSize: 'var(--profile-menu-item-font-size)',
                            color: 'var(--profile-menu-item-text-color)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Помощь
                        </span>
                        <div
                          style={{
                            marginLeft: 'auto',
                            width: 'var(--profile-menu-item-icon-size)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <img
                            src="/interface/Help.svg"
                            alt=""
                            style={{
                              width: 'var(--profile-menu-item-icon-size)',
                              height: 'var(--profile-menu-item-icon-size)',
                              filter: 'var(--profile-menu-item-icon-filter)',
                            }}
                          />
                        </div>
                      </div>
                    </button>
                    <div
                      style={{
                        height: 'var(--profile-menu-divider-thickness)',
                        background: 'var(--profile-menu-divider-color)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        closeProfileMenu()
                        setSupportOpen(true)
                      }}
                      className="flex w-full items-center"
                      style={{
                        height: 'var(--profile-menu-item-height)',
                        paddingLeft: 'var(--profile-menu-item-padding-x)',
                        paddingRight: 'var(--profile-menu-item-padding-x)',
                        background: 'var(--profile-menu-item-bg)',
                      }}
                    >
                      <div
                        className="flex w-full items-center"
                        style={{ columnGap: 'var(--profile-menu-item-gap)' }}
                      >
                        <span
                          className="font-sf-ui-light"
                          style={{
                            fontSize: 'var(--profile-menu-item-font-size)',
                            color: 'var(--profile-menu-item-text-color)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Поддержка
                        </span>
                        <div
                          style={{
                            marginLeft: 'auto',
                            width: 'var(--profile-menu-item-icon-size)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <img
                            src="/interface/address.svg"
                            alt=""
                            style={{
                              width: 'var(--profile-menu-item-icon-size)',
                              height: 'var(--profile-menu-item-icon-size)',
                              filter: 'var(--profile-menu-item-icon-filter)',
                            }}
                          />
                        </div>
                      </div>
                    </button>
                    <div
                      style={{
                        height: 'var(--profile-menu-share-divider-thickness)',
                        background: 'var(--profile-menu-share-divider-color)',
                      }}
                    />
                    {viewProfileMode === 'own' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            closeProfileMenu()
                            if (userStores.length > 0) {
                              openStoreProfile(userStores[0].id)
                            } else {
                              setShowCreateStore(true)
                            }
                          }}
                          className="flex w-full items-center"
                          style={{
                            height: 'var(--profile-menu-item-height)',
                            paddingLeft: 'var(--profile-menu-item-padding-x)',
                            paddingRight: 'var(--profile-menu-item-padding-x)',
                            background: 'var(--profile-menu-item-bg)',
                          }}
                        >
                          <div
                            className="flex w-full items-center"
                            style={{ columnGap: 'var(--profile-menu-item-gap)' }}
                          >
                            <span
                              className="font-sf-ui-light"
                              style={{
                                fontSize: 'var(--profile-menu-item-font-size)',
                                color: 'var(--profile-menu-item-text-color)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {userStores.length > 0 ? 'Мой магазин' : 'Создать магазин'}
                            </span>
                            <div
                              style={{
                                marginLeft: 'auto',
                                width: 'var(--profile-menu-item-icon-size)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                              }}
                            >
                              {userStores.length > 0 ? (
                                <ShoppingCart
                                  size={20}
                                  className="text-white/50"
                                  style={{
                                    filter: 'var(--profile-menu-item-icon-filter)',
                                  }}
                                />
                              ) : (
                                <Plus
                                  size={20}
                                  className="text-white/50"
                                  style={{
                                    filter: 'var(--profile-menu-item-icon-filter)',
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </button>
                        <div
                          style={{
                            height: 'var(--profile-menu-divider-thickness)',
                            background: 'var(--profile-menu-divider-color)',
                          }}
                        />
                      </>
                    )}
                    {viewProfileMode === 'foreign' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            closeProfileMenu()
                            setSupportOpen(true)
                          }}
                          className="flex w-full items-center"
                          style={{
                            height: 'var(--profile-menu-item-height)',
                            paddingLeft: 'var(--profile-menu-item-padding-x)',
                            paddingRight: 'var(--profile-menu-item-padding-x)',
                            background: 'var(--profile-menu-item-bg)',
                          }}
                        >
                          <div
                            className="flex w-full items-center"
                            style={{ columnGap: 'var(--profile-menu-item-gap)' }}
                          >
                            <span
                              className="font-sf-ui-light"
                              style={{
                                fontSize: 'var(--profile-menu-item-font-size)',
                                color: 'var(--profile-menu-item-text-color)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Пожаловаться
                            </span>
                            <div
                              style={{
                                marginLeft: 'auto',
                                width: 'var(--profile-menu-item-icon-size)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                              }}
                            >
                              <img
                                src="/interface/info-square-01-contained.svg"
                                alt=""
                                style={{
                                  width: 'var(--profile-menu-item-icon-size)',
                                  height: 'var(--profile-menu-item-icon-size)',
                                  filter: 'var(--profile-menu-item-icon-filter)',
                                }}
                              />
                            </div>
                          </div>
                        </button>
                        <div
                          style={{
                            height: 'var(--profile-menu-divider-thickness)',
                            background: 'var(--profile-menu-divider-color)',
                          }}
                        />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        closeProfileMenu()
                        const shareUrl = currentUserId 
                          ? `${window.location.origin}/?sellerId=${currentUserId}`
                          : window.location.href
                        
                        if (navigator.share) {
                          navigator.share({
                            title: 'Профиль',
                            text: 'Посмотрите мой профиль в приложении!',
                            url: shareUrl
                          }).catch(() => {})
                        } else {
                          navigator.clipboard.writeText(shareUrl).catch(() => {})
                        }
                      }}
                      className="flex w-full items-center"
                      style={{
                        height: 'var(--profile-menu-item-height)',
                        paddingLeft: 'var(--profile-menu-item-padding-x)',
                        paddingRight: 'var(--profile-menu-item-padding-x)',
                        background: 'var(--profile-menu-item-bg)',
                      }}
                    >
                      <div
                        className="flex w-full items-center"
                        style={{ columnGap: 'var(--profile-menu-item-gap)' }}
                      >
                        <span
                          className="font-sf-ui-light"
                          style={{
                            fontSize: 'var(--profile-menu-share-font-size)',
                            color: 'var(--profile-menu-item-text-color)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Поделиться профилем
                        </span>
                        <div
                          style={{
                            marginLeft: 'auto',
                            width: 'var(--profile-menu-item-icon-size)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <img
                            src="/interface/share2.svg"
                            alt=""
                            style={{
                              width: 'var(--profile-menu-item-icon-size)',
                              height: 'var(--profile-menu-item-icon-size)',
                              filter: 'var(--profile-menu-item-icon-filter)',
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                </motion.div>
              </>
            )}
          </motion.div>
          </>
        )}

        {tab === 'store' && (
          <motion.div
            key="store-catalog-screen"
            className="absolute left-0 w-full overflow-hidden"
            style={{
              top: homeContentTop,
              height: homeContentHeight,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <StoreCatalog
              onCreateStore={() => {
                if (!isAuthed) {
                  setStoreAuthWarningOpen(true)
                  return
                }
                if (userStores.length > 0) {
                  openStoreProfile(userStores[0].id)
                  return
                }
                setShowCreateStore(true)
              }}
              onOpenStore={(id) => openStoreProfile(id)}
              myStores={userStores}
            />
          </motion.div>
        )}

        {tab === 'ads' && (
          <motion.div
            key="ads-screen"
            className="absolute left-0 w-full overflow-hidden"
            style={{
              top: homeContentTop,
              height: homeContentHeight,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Ads
              isAuthed={isAuthed}
              onOpenAd={(ad) => {
                setSelectedAd(ad)
              }}
              onOpenStoreById={openStoreProfile}
              createOnMount={adsCreateRequested}
              onCreateConsumed={() => setAdsCreateRequested(false)}
            />
          </motion.div>
        )}

        {/* profile content moved to Profile component */}

        <AnimatePresence>
          {navVisible && !favoritesOpen && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute left-0 w-full bg-transparent z-[90]"
              style={{
                height: 'var(--bottom-nav-height, 80px)',
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--nav-bottom-offset, 0px))',
              }}
            >
              <div className="absolute inset-x-0 bottom-4 px-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[28px] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]" />
                  
                  <div className="relative flex items-center justify-between p-1.5">
                    {adsNavNextVisible ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!adsNavNextEnabled) return
                          if (adsNavNextMode === 'detail') {
                            const ev = new Event('ad-detail-purchase')
                            window.dispatchEvent(ev)
                          } else {
                            const ev = new Event('ads-create-nav-next')
                            window.dispatchEvent(ev)
                          }
                        }}
                        className="w-full h-[52px] flex items-center justify-center rounded-[22px] transition-all duration-200 z-50 bg-white active:scale-[0.98]"
                        style={{ opacity: adsNavNextEnabled ? 1 : 0.4 }}
                      >
                        <span className="font-sf-ui-bold text-[16px] text-black">
                          {adsNavNextLabel}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center w-full justify-around px-2">
                        {/* Feed */}
                        <button
                          type="button"
                          onClick={() => {
                            closeAllWindows()
                            setTab('ads')
                          }}
                          className="h-[52px] w-[52px] flex items-center justify-center rounded-2xl transition-all duration-200"
                        >
                          <div className={tab === 'ads' ? 'text-white' : 'text-white opacity-40'}>
                            <NavIcon type="ads" active={tab === 'ads'} />
                          </div>
                        </button>

                        {/* Store */}
                        <button
                          type="button"
                          onClick={() => {
                            closeAllWindows()
                            setTab('store')
                          }}
                          className="h-[52px] w-[52px] flex items-center justify-center rounded-2xl transition-all duration-200"
                        >
                          <div className={tab === 'store' || (tab === 'profile' && !!viewStoreId) ? 'text-white' : 'text-white opacity-40'}>
                            <NavIcon type="store" active={tab === 'store' || (tab === 'profile' && !!viewStoreId)} />
                          </div>
                        </button>

                        {/* Create */}
                        <button
                          type="button"
                          onClick={() => {
                            closeAllWindows()
                            setTab('ads')
                            setAdsCreateRequested(true)
                          }}
                          className="h-[52px] w-[52px] flex items-center justify-center rounded-2xl transition-all duration-200"
                        >
                          <div className="text-white opacity-40">
                            <NavIcon type="create" active={false} />
                          </div>
                        </button>

                        {/* Profile */}
                        <button
                          type="button"
                          onClick={() => {
                            closeAllWindows()
                            setTab('profile')
                            setViewProfileMode('own')
                            setViewProfileUserId(null)
                            setViewStoreId(null)
                            setProfileTab('favorites')
                          }}
                          className="h-[52px] w-[52px] flex items-center justify-center rounded-2xl transition-all duration-200"
                        >
                          <div className={tab === 'profile' && !viewStoreId && viewProfileMode === 'own' ? 'text-white' : 'text-white opacity-40'}>
                            <NavIcon type="profile" active={tab === 'profile' && !viewStoreId && viewProfileMode === 'own'} />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className="absolute left-0 w-full bg-transparent"
          style={{ bottom: 0, height: 'env(safe-area-inset-bottom, 0px)' }}
        />
        {profileEdit && tab === 'profile' && viewProfileMode === 'own' && (
          <ProfileEdit
            onClose={() => {
              setProfileEdit(false)
              if (returnToSettingsAfterEdit) {
                setSettingsOrigin('edit')
                setSettingsOpen(true)
                setReturnToSettingsAfterEdit(false)
              }
            }}
            initialTag={currentTag ?? undefined}
          />
        )}
        {settingsOpen && (
          <Setting
            onClose={() => {
              setSettingsOpen(false)
              if (settingsOrigin === 'edit') {
                setProfileEdit(true)
              }
              setSettingsOrigin(null)
            }}
            onOpenAbout={() => {
              setSettingsOpen(false)
              setInfoMeOpen(true)
            }}
            onOpenContacts={() => {
              setSettingsOpen(false)
              setInfoMeOpen(false)
              setLinksOpen(true)
            }}
            onOpenProject={() => {
              setSettingsOpen(false)
              setInfoMeOpen(false)
              setLinksOpen(false)
              setProjectInfoOpen(true)
            }}
            onOpenPhone={() => {
              setSettingsOpen(false)
              setPhoneOpen(true)
            }}
            onOpenProfile={() => {
              setSettingsOpen(false)
              setTab('profile')
              setViewProfileMode('own')
              setViewProfileUserId(null)
            }}
          />
        )}
        {infoMeOpen && (
          <InfoMe
            onClose={() => {
              setInfoMeOpen(false)
              setSettingsOpen(true)
            }}
          />
        )}
        {linksOpen && (
          <Links
            onClose={() => {
              setLinksOpen(false)
              setSettingsOpen(true)
            }}
          />
        )}
        {projectInfoOpen && (
          <ProjectVersion
            onClose={() => {
              setProjectInfoOpen(false)
              setSettingsOpen(true)
            }}
          />
        )}
        {selectedAd && (
          <AdDetail
            ad={selectedAd}
            onClose={() => {
              setSelectedAd(null)
            }}
            onOpenSellerProfile={(ad) => {
              if (!ad.userId) return
              closeAllWindows()
              setTab('profile')
              setViewProfileMode('foreign')
              setViewProfileUserId(ad.userId)
              setViewStoreId(null)
              setProfileReturnAd(ad)
              setProfileTab('ads')
              setProfileEdit(false)
              setSelectedAd(null)
            }}
            onOpenStoreProfile={openStoreProfile}
            onOpenChat={(ad, receiver) => {
              setChatReceiver(receiver)
              setActiveChatAd(ad)
              setChatOpen(true)
            }}
          />
        )}
        {userSearchOpen && (
          <UserSearch
            onClose={closeUserSearch}
            onSelectUser={(userId) => {
              closeAllWindows()
              setTab('profile')
              setViewProfileMode('foreign')
              setViewProfileUserId(userId)
              setViewStoreId(null)
              setProfileReturnAd(null)
              setProfileTab('ads')
              setProfileEdit(false)
            }}
            searchQuery={userSearchQuery}
            setSearchQuery={setUserSearchQuery}
            searchResults={userSearchResults}
            searchLoading={userSearchLoading}
            onSearch={searchUsers}
          />
        )}
        {phoneOpen && (
          <Phone
            onClose={() => {
              setPhoneOpen(false)
              setSettingsOpen(true)
            }}
          />
        )}
        {supportOpen && (
          <Support
            onClose={() => {
              setSupportOpen(false)
            }}
          />
        )}
        {chatOpen && chatReceiver && (
          <Chat
            onClose={() => {
              setChatOpen(false)
              setActiveChatAd(null)
              setChatReceiver(null)
            }}
            receiverId={chatReceiver.id}
            receiverName={chatReceiver.name}
            receiverAvatar={chatReceiver.avatar}
            adContext={activeChatAd}
            contacts={(() => {
              if (!activeChatAd?.userId) return []
              try {
                const raw = localStorage.getItem('hw-profiles')
                const map = raw ? JSON.parse(raw) : {}
                const userProfile = map[activeChatAd.userId]
                const items = userProfile?.contacts
                if (!Array.isArray(items)) return []
                return items
                  .map((item: any) => {
                    if (!item || typeof item !== 'object') return null
                    const type = item.type === 'vk' || item.type === 'telegram' ? item.type : null
                    const url = typeof item.url === 'string' ? item.url.trim() : ''
                    if (!type || !url) return null
                    return { type, url }
                  })
                  .filter((x): x is { type: 'vk' | 'telegram'; url: string } => !!x)
              } catch {}
              return []
            })()}
          />
        )}
        {showCreateStore && (
          <CreateStoreFlow
            onClose={() => setShowCreateStore(false)}
            onSuccess={(storeId) => {
              setShowCreateStore(false)
              window.dispatchEvent(new Event('refresh-user-stores'))
              openStoreProfile(storeId)
            }}
          />
        )}

        <AnimatePresence>
          {storeAuthWarningOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={() => {
                  if (storeAuthWarningLocked) return
                  setStoreAuthWarningOpen(false)
                }}
              />
              
               <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
                 <motion.div
                   className="relative w-full rounded-t-[32px] bg-[#121212] border-t border-white/10 p-8 flex flex-col items-center text-center space-y-6 pointer-events-auto pb-[calc(env(safe-area-inset-bottom, 0px) + 24px)]"
                   initial={{ translateY: '100%' }}
                   animate={{ translateY: 0 }}
                   exit={{ translateY: '100%' }}
                   transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                 >
                   <StoreAuthIllustration />
                   
                   <div className="space-y-2">
                     <h3 className="text-[22px] font-ttc-bold text-white leading-tight">
                       Нужен аккаунт
                     </h3>
                     <p className="text-[14px] text-white/40 font-sf-ui-light max-w-[260px]">
                       Чтобы открыть свой магазин и начать продавать — нужно войти в аккаунт
                     </p>
                   </div>
                   
                   <div className="w-full flex flex-col gap-3 pt-4">
                     <button
                       type="button"
                       className="h-14 w-full rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                       onClick={() => {
                         if (storeAuthWarningLocked) return
                         window.dispatchEvent(new Event('trigger-auth'))
                         setStoreAuthWarningOpen(false)
                       }}
                     >
                       Войти
                     </button>
                     
                     <button
                       type="button"
                       className="h-14 w-full rounded-[22px] bg-white/5 text-white/70 font-sf-ui-medium text-[15px] active:scale-[0.97] transition-all"
                       onClick={() => {
                         if (storeAuthWarningLocked) return
                         setStoreAuthWarningOpen(false)
                       }}
                     >
                       Позже
                     </button>
                   </div>
                 </motion.div>
               </div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={notificationsClosing ? { opacity: 0, x: '100%' } : { opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-[160] flex flex-col bg-[#0A0A0A]"
            >
              {/* Header */}
              <div
                className="relative w-full bg-[#0A0A0A] border-b border-white/[0.05] flex-shrink-0"
                style={{ 
                  paddingTop: 'env(safe-area-inset-top, 0px)',
                  height: 'calc(env(safe-area-inset-top, 0px) + 56px)' 
                }}
              >
                <div className="relative h-full w-full flex items-center justify-center">
                  <button
                    type="button"
                    onClick={closeNotifications}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft size={24} className="text-white" />
                  </button>
                  <div className="font-ttc-bold text-white text-[20px]">
                    Уведомления
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hidden">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full px-6 py-5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex gap-4 items-start text-left">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent flex items-center justify-center overflow-hidden border border-white/[0.08]">
                            <img src={notif.icon} alt="" className="w-7 h-7 rounded-lg" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#0A0A0A]" />
                        </div>
                        
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[16px] font-sf-ui-semibold text-white/90 truncate tracking-tight">
                              {notif.title}
                            </span>
                            <span className="text-[11px] text-white/20 font-sf-ui-medium uppercase tracking-widest whitespace-nowrap">
                              {notif.date}
                            </span>
                          </div>
                          <p className="text-[14px] text-white/40 font-sf-ui-light leading-relaxed">
                            {notif.text}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="w-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center relative">
                      <Bell size={40} className="text-white/10" />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border-2 border-white/5"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[16px] font-sf-ui-medium text-white/60">Пока пусто</p>
                      <p className="text-[13px] text-white/30 font-sf-ui-light">Мы сообщим, когда появится что-то новое</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          <AnimatePresence>
          {favoriteToast.visible && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[200] w-[280px]"
            >
              <button
                onClick={() => {
                  setFavoriteToast({ visible: false, adId: null })
                  setFavoritesOpen(true)
                }}
                className="w-full flex items-center justify-between px-5 py-4 rounded-[22px] bg-[#1C1C1E] border border-white/10 shadow-2xl backdrop-blur-xl active:scale-95 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  </div>
                  <span className="text-[14px] font-sf-ui-medium text-white/90">Добавлено в избранное</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {alphaModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAlphaModalOpen(false)}
                className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md"
              />
              <div className="fixed inset-0 z-[160] flex items-end justify-center pointer-events-none">
                <motion.div
                  initial={{ translateY: '100%' }}
                  animate={{ translateY: 0 }}
                  exit={{ translateY: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                  className="relative w-full bg-[#121212] border-t border-white/10 rounded-t-[32px] p-8 flex flex-col items-center text-center space-y-6 pointer-events-auto pb-[calc(env(safe-area-inset-bottom, 0px) + 24px)]"
                >
                  <div className="space-y-2">
                    <h3 className="text-[22px] font-ttc-bold text-white leading-tight flex items-center justify-center gap-2.5">
                      <img src="/logo.svg" alt="Alpha" className="w-6 h-6 rounded-md" />
                      Alpha Test
                    </h3>
                    <p className="text-[14px] text-white/40 font-sf-ui-light leading-relaxed max-w-[280px]">
                      Сайт находится в стадии активной разработки. Возможны ошибки и нестабильная работа. Спасибо, что приняли участие в тестировании сайта.
                    </p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-[20px] font-ttc-bold text-white">
                        {alphaStats.users}
                      </span>
                      <span className="text-[11px] text-white/30 uppercase tracking-wider font-sf-ui-medium">
                        Зарегистрированных пользователей
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                      <span className="text-[20px] font-ttc-bold text-white">
                        {alphaStats.ads}
                      </span>
                      <span className="text-[11px] text-white/30 uppercase tracking-wider font-sf-ui-medium">
                        Созданных объявлений
                      </span>
                    </div>
                  </div>

                  <div className="w-full pt-4">
                    <button
                      type="button"
                      onClick={() => setAlphaModalOpen(false)}
                      className="h-14 w-full rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                    >
                      Понятно
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {favoritesOpen && (
            <Favorites
              onClose={() => setFavoritesOpen(false)}
              onOpenStoreById={openStoreProfile}
              onOpenAd={(ad) => {
                setFavoritesOpen(false)
                setSelectedAd(ad)
              }}
            />
          )}
        </AnimatePresence>
      </div>
      {showIosTip && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0A0A0A]"
        >
          <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
            <div
              className="absolute left-0 top-0 flex h-full w-full items-center justify-center"
              style={{ zIndex: 20, transform: 'translateY(var(--hello-tip-overlay-offset-y))' }}
            >
              <div className="relative">
                <div
                  className="absolute left-0 top-4 w-full rounded-[16px]"
                  style={{ height: 'calc(var(--hello-tip-modal-width) * 0.6)', background: 'rgba(255,255,255,0.04)', filter: 'blur(6px)' }}
                />
                <div
                  className="rounded-[var(--hello-tip-card-radius)] border text-center"
                  style={{
                    width: 'var(--hello-tip-modal-width)',
                    height: 'var(--hello-tip-modal-height)',
                    padding: 'var(--hello-tip-modal-padding)',
                    background: 'var(--hello-tip-card-bg)',
                    borderColor: 'var(--hello-tip-card-border)',
                    boxShadow: 'var(--hello-tip-card-shadow)',
                  }}
                >
                  <img
                    src="/interface/link-broken.svg"
                    alt="union"
                    style={{
                      width: 'var(--hello-tip-union-size)',
                      height: 'var(--hello-tip-union-size)',
                      marginBottom: 'var(--hello-tip-union-margin-bottom)',
                      display: 'block',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      transform: 'translate(var(--hello-tip-union-offset-x), var(--hello-tip-union-offset-y))',
                    }}
                  />
                  <div
                    className="mx-auto text-white"
                    style={{
                      fontSize: 'var(--hello-tip-title-size)',
                      width: 'var(--hello-tip-text-block-width)',
                      fontFamily: 'var(--font-sf-ui-text-light)',
                      lineHeight: 'calc(1.25em + var(--hello-tip-text-indent))',
                    }}
                  >
                    <span>Ой, похоже у вас </span>
                    <span style={{ color: 'white', fontFamily: 'var(--font-sf-ui-text-medium)' }}>Iphone</span>
                  </div>
                  <div
                    className="mx-auto text-white"
                    style={{
                      fontSize: 'var(--hello-tip-text-size)',
                      marginTop: 'var(--hello-tip-line-gap)',
                      width: 'var(--hello-tip-text-block-width)',
                      fontFamily: 'var(--font-sf-ui-text-light)',
                      lineHeight: 'calc(1.4em + var(--hello-tip-text-indent))',
                    }}
                  >
                    <span>В таком случае </span>
                    <span style={{ color: 'var(--hello-tip-iphone-color)' }}>крайне рекомендуется</span>
                    <span> добавить сайт как </span>
                    <span style={{ color: 'white' }}>приложение</span>
                  </div>
                  <div style={{ height: 'var(--hello-tip-gap)' }} />
                  <div className="mx-auto" style={{ width: 'var(--hello-tip-instruction-width)', marginTop: 'var(--hello-tip-flow-margin-top)' }}>
                    <div className="flex items-center justify-center" style={{ gap: 'var(--hello-tip-flow-gap)' }}>
                      <img src="/interface/dot-horizontal.svg" alt="dot" style={{ width: 'var(--hello-tip-icon-size)', height: 'var(--hello-tip-icon-size)' }} />
                      <span className="text-white" style={{ fontSize: 'var(--hello-tip-text-size)' }}>→</span>
                      <img src="/interface/Share.svg" alt="Share" style={{ width: 'var(--hello-tip-icon-size)', height: 'var(--hello-tip-icon-size)' }} />
                      <span className="text-white" style={{ fontSize: 'var(--hello-tip-text-size)' }}>Поделиться</span>
                      <span className="text-white" style={{ fontSize: 'var(--hello-tip-text-size)' }}>→</span>
                      <img src="/interface/add-square-03.svg" alt="Add" style={{ width: 'var(--hello-tip-icon-size)', height: 'var(--hello-tip-icon-size)' }} />
                      <span className="text-white" style={{ fontSize: 'var(--hello-tip-text-size)' }}>
                        «Домой»
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute left-0 w-full text-center"
                  style={{
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--hello-close-bottom))',
                  }}
                  onClick={() => {
                    setShowIosTip(false)
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center font-vk-demi"
                    style={{
                      width: 'var(--hello-close-width)',
                      height: 'var(--hello-close-height)',
                      borderRadius: 'var(--hello-close-radius)',
                      background: 'var(--hello-close-bg)',
                      fontSize: 'var(--hello-close-text-size)',
                      color: 'var(--hello-close-text-color)',
                    }}
                  >
                    Закрыть
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

