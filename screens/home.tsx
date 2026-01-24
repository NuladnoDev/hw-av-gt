'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCcw, ShoppingBag, User } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Profile from './profile'
import ProfileEdit from './profile_edit'
import Setting from './Setting'
import InfoMe from './info_me'
import Links from './Links'
import ProjectVersion from './project_version'
import UserSearch from './UserSearch'
import Phone from './Phone'
import { getSupabase } from '@/lib/supabaseClient'
import Ads, { type StoredAd } from './ads'
import AdDetail from './AdDetail'

export default function HomeScreen({ isAuthed }: { isAuthed?: boolean }) {
  const [scale, setScale] = useState(1)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)

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

  const [tab, setTab] = useState<'ads' | 'profile'>('ads')
  const [profileTab, setProfileTab] = useState<'ads' | 'about' | 'friends'>('ads')
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
  const [selectedAd, setSelectedAd] = useState<StoredAd | null>(null)
  const [adsCreateRequested, setAdsCreateRequested] = useState(false)
  const [viewProfileMode, setViewProfileMode] = useState<'own' | 'foreign'>('own')
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null)
  const [profileReturnAd, setProfileReturnAd] = useState<StoredAd | null>(null)
  const [profileStack, setProfileStack] = useState<string[]>([])
  const [linksOpen, setLinksOpen] = useState(false)
  const [projectInfoOpen, setProjectInfoOpen] = useState(false)
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<Array<{id: string, tag: string, avatarUrl: string | null}>>([])
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
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
        setProfileReturnAd(null)
        setTab('profile')
      } else {
        setViewProfileMode('foreign')
        setViewProfileUserId(last)
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
    setProfileReturnAd(null)
    setTab('ads')
  }

  useEffect(() => {
    const sellerId = searchParams.get('sellerId')
    const profileTabParam = searchParams.get('profileTab')
    if (sellerId) {
      closeAllWindows()
      setTab('profile')
      setViewProfileMode('foreign')
      setViewProfileUserId(sellerId)
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
    const client = getSupabase()
    if (!client) return
    ;(async () => {
      const { data } = await client.auth.getUser()
      const id = data.user?.id ?? null
      const email = data.user?.email ?? null
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
      }
      if (event === 'SIGNED_OUT') {
        window.localStorage.removeItem('hw-auth')
        setCurrentTag(null)
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
  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})`, willChange: 'transform' }}>
        <div
          className="absolute left-0 top-0 h-[812px] w-[375px]"
          style={{ backgroundColor: '#0A0A0A' }}
        />

        {tab !== 'profile' ? (
          <div
            className="absolute left-0 w-full px-6 flex items-center justify-between"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
          >
            <div className="text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
              {tab === 'ads' ? 'Объявления' : 'Профиль'}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={openUserSearch}
                className="flex h-full items-center"
                aria-label="Поиск пользователей"
              >
                <img
                  src="/interface/search-02.svg"
                  alt="search"
                  className="h-[24px] w-[24px]"
                />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="absolute left-0 w-full bg-[#0A0A0A]"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
          >
            <div className="relative h-full w-full">
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
                  />
                </button>
              </div>
              <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center">
                <div className="text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
                  Профиль
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <motion.div
            key={`profile-screen-${viewProfileMode}-${viewProfileUserId ?? 'own'}`}
            className="absolute left-0 w-full"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
              height: 'calc(812px - 88px - 56px - var(--home-header-offset))',
            }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
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
                setProfileTab('ads')
              }}
            />
            {profileMenuOpen && (
              <>
                <button
                  type="button"
                  className="absolute inset-0"
                  style={{ zIndex: 70 }}
                  onClick={closeProfileMenu}
                />
                <div
                  className="absolute right-4"
                  style={{
                    top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-menu-offset-y))',
                    zIndex: 80,
                  }}
                  >
                    <div
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
                    <button
                      type="button"
                      onClick={() => {
                        closeProfileMenu()
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
                          Скопировать ссылку
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
                            src="/interface/Hyperlink.svg"
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
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {tab !== 'profile' && (
          <motion.div
            key="ads-screen"
            className="absolute left-0 w-full"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
              height: 'calc(812px - 88px - 56px - var(--home-header-offset))',
            }}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {tab === 'ads' && (
              <Ads
                isAuthed={isAuthed}
                onOpenAd={(ad) => {
                  setSelectedAd(ad)
                }}
                createOnMount={adsCreateRequested}
                onCreateConsumed={() => setAdsCreateRequested(false)}
              />
            )}
          </motion.div>
        )}

        {/* profile content moved to Profile component */}

        <div
          className="absolute left-0 w-full bg-[#0A0A0A] z-[90]"
          style={{
            height: 'var(--bottom-nav-height, 96px)',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--nav-bottom-offset))',
          }}
        >
          <div className="absolute inset-x-0 bottom-3 px-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]" />
              <div className="relative flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (projectInfoOpen) {
                      const ev = new Event('project-check-updates')
                      window.dispatchEvent(ev)
                      return
                    }
                    if (adsNavNextVisible) {
                      if (!adsNavNextEnabled) return
                      if (adsNavNextMode === 'detail') {
                        const ev = new Event('ad-detail-purchase')
                        window.dispatchEvent(ev)
                      } else {
                        const ev = new Event('ads-create-nav-next')
                        window.dispatchEvent(ev)
                      }
                      return
                    }
                    closeAllWindows()
                    setViewProfileMode('own')
                    setViewProfileUserId(null)
                    setProfileReturnAd(null)
                    setProfileStack([])
                    if (tab === 'ads') {
                      setAdsCreateRequested(true)
                      return
                    }
                    setTab('ads')
                  }}
                  className="relative flex-[7] flex flex-col items-center justify-center gap-1 rounded-[20px] transition-all duration-200 z-50"
                  style={{ height: 'var(--bottom-nav-pill-height, 64px)' }}
                >
                  {tab === 'ads' && adsNavNextMode !== 'edit' && (
                    <motion.div
                      layoutId="bottom-nav-active-tab"
                      className="absolute inset-[-2px] rounded-[20px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <AnimatePresence mode="wait" initial={false}>
                    {adsNavNextVisible ? (
                      <motion.div
                        key="ads-next"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="relative z-10 flex items-center justify-center"
                        style={{ opacity: adsNavNextEnabled ? 1 : 0.4 }}
                      >
                        <span
                          className={`font-semibold text-[17.8px] ${
                            adsNavNextMode === 'edit' ? 'text-white' : 'text-black'
                          }`}
                        >
                          {adsNavNextLabel}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ads-default"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="relative z-10 flex flex-col items-center justify-center gap-1"
                      >
                        {tab === 'ads' ? (
                          <>
                            <img
                              src="/interface/plus-02-black.svg"
                              alt=""
                              className="w-[24px] h-[24px] translate-y-[2px]"
                            />
                            <span className="font-semibold text-[13.5px] text-black">
                              Создать обьявление
                            </span>
                          </>
                        ) : projectInfoOpen ? (
                          <>
                            <RefreshCcw
                              className="w-6 h-6 transition-all duration-200 text-white/70"
                              strokeWidth={2.5}
                            />
                            <span className="font-medium text-[12px] text-white/70">
                              Проверить обновления
                            </span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag
                              className="w-6 h-6 transition-all duration-200 text-white/70"
                              strokeWidth={2.5}
                            />
                            <span className="font-medium text-[12px] text-white/70">
                              Объявления
                            </span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeAllWindows()
                    setTab('profile')
                    setViewProfileMode('own')
                    setViewProfileUserId(null)
                    setProfileReturnAd(null)
                    setProfileStack([])
                  }}
                  className="relative flex-[3] flex flex-col items-center justify-center gap-1 rounded-[20px] transition-all duration-200 z-50"
                  style={{ height: 'var(--bottom-nav-pill-height, 64px)' }}
                >
                  {tab === 'profile' && (
                    <motion.div
                      layoutId="bottom-nav-active-tab"
                      className="absolute inset-[-2px] rounded-[20px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <User
                    className={`w-6 h-6 transition-all duration-200 relative z-10 ${
                      tab === 'profile' ? 'text-black scale-110' : 'text-white/70'
                    }`}
                    strokeWidth={2.5}
                  />
                  <span
                    className={`font-medium text-[12px] transition-all duration-200 relative z-10 ${
                      tab === 'profile' ? 'text-black' : 'text-white/70'
                    }`}
                  >
                    Профиль
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
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
              setProfileReturnAd(ad)
              setProfileTab('ads')
              setProfileEdit(false)
              setSelectedAd(null)
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
