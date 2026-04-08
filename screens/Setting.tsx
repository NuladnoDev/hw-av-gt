'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft,
  ChevronRight,
  Bell,
  BellRing,
  ShieldCheck,
  Share2,
  Flag,
  Info,
  Monitor,
  Moon,
  Sun,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'

export default function Setting({
  onClose,
  onOpenAbout,
  onOpenContacts,
  onOpenProject,
  onOpenPhone,
  onOpenProfile,
}: {
  onClose?: () => void
  onOpenAbout?: () => void
  onOpenContacts?: () => void
  onOpenProject?: () => void
  onOpenPhone?: () => void
  onOpenProfile?: () => void
}) {
  const [scale, setScale] = useState(1)
  const [dirty, setDirty] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [prettyId, setPrettyId] = useState<string | null>(null)
  const [showRealId, setShowRealId] = useState(false)
  const [tagText, setTagText] = useState<string>('user')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAppearance, setShowAppearance] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [subNotifs, setSubNotifs] = useState(true)
  const [newPostNotifs, setNewPostNotifs] = useState(true)
  const [showCustomNotifs, setShowCustomNotifs] = useState(false)
  const [followedUsers, setFollowedUsers] = useState<{ id: string; tag: string; enabled: boolean }[]>([])
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const [soundsEnabled, setSoundsEnabled] = useState(true)
  const [lastSeenVisibility, setLastSeenVisibility] = useState<'everyone' | 'nobody'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-last-seen-visibility')
      return (saved as 'everyone' | 'nobody') || 'everyone'
    }
    return 'everyone'
  })
  const [contactsHidden, setContactsHidden] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('hw-contacts-hidden') === '1'
    return false
  })
  const [searchHidden, setSearchHidden] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('hw-search-hidden') === '1'
    return false
  })
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-theme')
      return (saved as 'dark' | 'light') || 'dark'
    }
    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('hw-theme', theme)
    window.dispatchEvent(new CustomEvent('theme-updated', { detail: theme }))
  }, [theme])

  const [showCategories, setShowCategories] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-show-categories')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  useEffect(() => {
    localStorage.setItem('hw-show-categories', showCategories.toString())
    window.dispatchEvent(new CustomEvent('settings-categories-updated', { detail: { show: showCategories } }))
  }, [showCategories])

  useEffect(() => {
    localStorage.setItem('hw-last-seen-visibility', lastSeenVisibility)
    const client = getSupabase()
    if (client && userId) {
      client.from('profiles').upsert({ id: userId, last_seen_visibility: lastSeenVisibility }).then(() => {})
    }
  }, [lastSeenVisibility, userId])

  useEffect(() => {
    localStorage.setItem('hw-contacts-hidden', contactsHidden ? '1' : '0')
    window.dispatchEvent(new CustomEvent('contacts-hidden-updated', { detail: contactsHidden }))
  }, [contactsHidden])

  useEffect(() => {
    localStorage.setItem('hw-search-hidden', searchHidden ? '1' : '0')
  }, [searchHidden])

  const cardStyle = "bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-[32px] overflow-hidden"
  const itemStyle = "flex w-full items-center justify-between px-4 py-[18px] text-left bg-transparent active:bg-[var(--border-light)] transition-colors"
  const labelStyle = "leading-[1.4em] text-[var(--text-primary)] font-sf-ui-regular text-[15px]"
  const iconBgStyle = "w-8 h-8 flex items-center justify-center"

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.min(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const client = getSupabase()
    ;(async () => {
      try {
        const saved = await loadLocalAuth()
        if (saved?.uuid) setUserId(saved.uuid)
        if (saved?.uid) setPrettyId(saved.uid)
        const localId = saved?.uuid ?? saved?.uid ?? null

        let email: string | null = null
        let tagFromDb: string | undefined
        let avatarFromDb: string | undefined
        let supabaseId: string | null = null

        if (client) {
          const { data } = await client.auth.getUser()
          supabaseId = data.user?.id ?? null
          email = data.user?.email ?? null
          if (supabaseId) {
            const { data: prof } = await client
              .from('profiles')
              .select('tag, avatar_url')
              .eq('id', supabaseId)
              .maybeSingle()
            tagFromDb = (prof?.tag as string | undefined) ?? undefined
            avatarFromDb = (prof?.avatar_url as string | undefined) ?? undefined
          }
        }

        if (typeof tagFromDb === 'string' && tagFromDb.trim().length > 0) {
          setTagText(tagFromDb.trim())
        } else if (typeof email === 'string' && email.trim().length > 0) {
          setTagText(email.split('@')[0])
        } else if (saved?.tag && saved.tag.trim().length > 0) {
          setTagText(saved.tag.trim())
        }

        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { avatar_url?: string; tag?: string }>)
          : {}
        const p = localId ? profMap[localId] : undefined

        if (typeof avatarFromDb === 'string' && avatarFromDb.trim().length > 0) {
          setAvatarUrl(avatarFromDb)
        } else if (p?.avatar_url) {
          setAvatarUrl(p.avatar_url)
        }

        if (!tagFromDb && (!saved?.tag || saved.tag.trim().length === 0) && p?.tag && p.tag.trim().length > 0) {
          setTagText(p.tag.trim())
        }

        // Fetch following users
        if (client && supabaseId) {
          const { data: following, error } = await client
            .from('subscriptions')
            .select(`
              following_id,
              profiles!subscriptions_following_id_fkey (
                tag
              )
            `)
            .eq('follower_id', supabaseId)

          if (!error && following) {
            const formatted = following.map((f: any) => ({
              id: f.following_id,
              tag: f.profiles?.tag || 'user',
              enabled: true
            }))
            setFollowedUsers(formatted)
          }
        }
      } catch {}
    })()
    const handleUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ tag?: string; avatar_url?: string }>
      if (typeof ev.detail?.tag === 'string') setTagText(ev.detail.tag)
      if (ev.detail?.avatar_url === null) setAvatarUrl(null)
      else if (typeof ev.detail?.avatar_url === 'string') setAvatarUrl(ev.detail.avatar_url)
    }
    window.addEventListener('profile-updated', handleUpdated as EventListener)
    const handleDeleteRequest = () => {
      setShowDeleteConfirm(true)
    }
    window.addEventListener('profile-delete-request', handleDeleteRequest)
    return () => {
      window.removeEventListener('profile-updated', handleUpdated as EventListener)
      window.removeEventListener('profile-delete-request', handleDeleteRequest)
    }
  }, [])

  const gradientIndex = (() => {
    const base = (userId ?? tagText ?? 'user').toString()
    let sum = 0
    for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i)
    return sum % avatarGradients.length
  })()
  const gradient = avatarGradients[gradientIndex]
  const initialLetter = tagText && tagText.length > 0 ? tagText.trim().charAt(0).toUpperCase() : 'U'

  const close = () => {
    if (onClose) onClose()
    else {
      const ev = new Event('close-settings')
      window.dispatchEvent(ev)
    }
  }

  const openAbout = () => {
    if (onOpenAbout) onOpenAbout()
    else {
      const ev = new Event('open-info-me')
      window.dispatchEvent(ev)
    }
    close()
  }

  const openContacts = () => {
    if (onOpenContacts) onOpenContacts()
    else {
      const ev = new Event('open-contacts')
      window.dispatchEvent(ev)
    }
    close()
  }

  const openProject = () => {
    if (onOpenProject) onOpenProject()
    else {
      const ev = new Event('open-project-version')
      window.dispatchEvent(ev)
    }
    close()
  }

  const requestDelete = () => {
    const ev = new Event('profile-delete-request')
    window.dispatchEvent(ev)
  }

  return (
    <div className="fixed inset-0 z-[150] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden edit-screen-in">
      <div
        className="relative h-full w-full"
        style={{ '--settings-scale': 2, '--settings-list-top-margin': '18px' } as React.CSSProperties}
      >
        <div className="absolute inset-0" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={close}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Назад"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center">
              <div className="text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
                Настройки
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 w-full px-6 overflow-y-auto scrollbar-hide"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
            height: 'calc(812px - 56px - var(--home-header-offset))',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <style jsx global>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
          `}</style>
          <div className="relative w-full pb-8">
            {/* User Profile Card */}
            <div className="mt-4 mb-6">
              <button
                type="button"
                className="flex w-full items-center gap-4 px-4 py-6 text-left bg-transparent active:bg-white/[0.05] transition-colors rounded-[32px]"
                onClick={onOpenProfile}
              >
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center shadow-xl shadow-black/20"
                  style={{
                    width: '64px',
                    height: '64px',
                    aspectRatio: '1 / 1',
                    flexShrink: 0,
                    background: avatarUrl ? '#0A0A0A' : gradient,
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" style={{ objectPosition: 'center' }} />
                  ) : (
                    <span className="text-white font-ttc-bold text-[26px] leading-none mt-[2px]">
                      {initialLetter}
                    </span>
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[19px] font-sf-ui-medium text-[var(--text-primary)] leading-tight truncate">
                    {tagText && tagText.trim().length > 0 ? tagText.trim() : 'user'}
                  </span>
                  <div 
                    className="cursor-pointer flex items-center mt-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRealId(!showRealId);
                    }}
                  >
                    <div className="relative w-full min-h-[1.2em]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={showRealId ? 'real' : 'pretty'}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="text-[12px] text-[var(--text-secondary)] font-sf-ui-light break-all pr-2"
                        >
                          {showRealId ? (userId ?? 'id пользователя') : (prettyId ?? 'id пользователя')}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* General Settings Section */}
            <div className={`${cardStyle} mb-6`}>
              <button type="button" className={itemStyle} onClick={openAbout}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <img src="/setting/edit-contained.svg" alt="" className="w-5 h-5 filter-none" />
                  </div>
                  <span className={labelStyle}>Обо мне</span>
                </div>
                <ChevronRight size={18} className="text-[var(--text-tertiary)] opacity-30" />
              </button>
              
              <div className="h-[1px] bg-white/[0.03] mx-4" />
              
              <button type="button" className={itemStyle} onClick={() => setShowPrivacy(true)}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)] opacity-80">
                      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"/>
                    </svg>
                  </div>
                  <span className={labelStyle}>Конфиденциальность</span>
                </div>
                <ChevronRight size={18} className="text-[var(--text-tertiary)] opacity-30" />
              </button>

              <div className="h-[1px] bg-white/[0.03] mx-4" />

              <button type="button" className={itemStyle} onClick={() => setShowNotifications(true)}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <img src="/setting/notification-box.svg" alt="" className="w-5 h-5 filter-none" />
                  </div>
                  <span className={labelStyle}>Уведомления</span>
                </div>
                <ChevronRight size={18} className="text-[var(--text-tertiary)] opacity-30" />
              </button>

              <div className="h-[1px] bg-white/[0.03] mx-4" />

              <button type="button" className={itemStyle} onClick={openContacts}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <img src="/interface/address.svg" alt="" className="w-5 h-5 filter-none" />
                  </div>
                  <span className={labelStyle}>Контакты</span>
                </div>
                <ChevronRight size={18} className="text-[var(--text-tertiary)] opacity-30" />
              </button>
            </div>

            {/* Appearance & Verification Section */}
            <div className={cardStyle}>
              <button type="button" className={itemStyle} onClick={() => setShowAppearance(true)}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <Monitor className="w-[18px] h-[18px] text-[var(--text-primary)] opacity-80" strokeWidth={1.5} />
                  </div>
                  <span className={labelStyle}>Дополнительные настройки</span>
                </div>
                <ChevronRight size={18} className="text-[var(--text-tertiary)] opacity-30" />
              </button>

              <div className="h-[1px] bg-white/[0.03] mx-4" />

              <button type="button" className={itemStyle} onClick={() => setShowVerification(true)}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <img
                      src="/interface/verified.svg"
                      alt=""
                      className="w-[18px] h-[18px]"
                      style={{ filter: 'brightness(0) saturate(100%) invert(43%) sepia(98%) saturate(2338%) hue-rotate(185deg) brightness(101%) contrast(101%)' }}
                    />
                  </div>
                  <span className={labelStyle}>Верификация аккаунта</span>
                </div>
                <ChevronRight size={18} className="text-[var(--text-tertiary)] opacity-30" />
              </button>
            </div>

            {/* Auto-save Info Card */}
            <div className="mt-8 mb-16 px-2">
              <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-[24px] bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" />
                    
                    <motion.path 
                      d="M8 12L11 15L16 9" 
                      stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      animate={{ 
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </svg>
                </div>
                <p className="text-[14px] text-white/30 font-sf-ui-light tracking-wide">
                  Все настройки сохраняются автоматически
                </p>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex items-center justify-center px-6"
            >
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setShowDeleteConfirm(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-[320px] bg-[#1A1A1A]/90 backdrop-blur-2xl border border-white/10 rounded-[36px] p-8 shadow-2xl overflow-hidden"
              >
                {/* Liquid glow effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 blur-[50px] rounded-full" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/5 blur-[50px] rounded-full" />

                <div className="relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                    <AlertTriangle className="text-red-500 w-8 h-8" />
                  </div>
                  
                  <h2 className="text-[20px] font-ttc-bold text-white mb-3 leading-tight">Удаление аккаунта</h2>
                  <p className="text-white/50 font-sf-ui-light text-[14px] leading-relaxed mb-8">
                    Это действие необратимо. Все ваши данные будут безвозвратно удалены. Вы уверены?
                  </p>

                  <div className="w-full space-y-3">
                    <button
                      onClick={async () => {
                        const client = getSupabase()
                        if (client && userId) {
                          // 1. Delete profile data
                          await client.from('profiles').delete().eq('id', userId)
                          // 2. Sign out (this handles session cleanup)
                          await client.auth.signOut()
                        }
                        // 3. Clear local storage
                        localStorage.removeItem('hw-auth')
                        localStorage.removeItem('hw-profiles')
                        // 4. Close and redirect
                        setShowDeleteConfirm(false)
                        close()
                        window.location.reload() // Reload to trigger login screen state
                      }}
                      className="w-full h-[56px] bg-red-500 text-white rounded-[24px] font-sf-ui-medium text-[16px] active:scale-95 transition-all shadow-lg shadow-red-500/20"
                    >
                      Да, удалить
                    </button>
                    
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full h-[56px] bg-white/5 text-white/60 rounded-[24px] font-sf-ui-medium text-[16px] hover:bg-white/10 active:scale-95 transition-all"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[60] bg-[var(--bg-primary)] flex flex-col"
            >
              {/* Header */}
              <div 
                className="flex items-center px-6 bg-[var(--bg-primary)]"
                style={{ height: '56px', marginTop: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))' }}
              >
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
              </div>

              <div className="flex-1 px-6 mt-4 space-y-4">
                {/* Main Toggle Card */}
                <div className={cardStyle}>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${notificationsEnabled ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[var(--border-light)] text-[var(--text-tertiary)]'}`}>
                        <Bell className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-sf-ui-medium text-[var(--text-primary)]">Все уведомления</span>
                        <span className="text-[13px] text-[var(--text-secondary)] font-sf-ui-light">Глобальный переключатель</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative overflow-hidden ${
                        notificationsEnabled 
                          ? 'bg-blue-600 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2),0_4px_12px_rgba(37,99,235,0.3)]' 
                          : 'bg-[var(--border-light)]'
                      }`}
                    >
                      {notificationsEnabled && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                      )}
                      <motion.div
                        animate={{ x: notificationsEnabled ? 26 : 4 }}
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-colors ${
                          notificationsEnabled ? 'bg-white' : 'bg-[var(--text-tertiary)]'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Subscriptions Settings Card */}
                <AnimatePresence>
                  {notificationsEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, y: -10 }}
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      exit={{ height: 0, opacity: 0, y: -10 }}
                      className="overflow-hidden"
                    >
                      <div className={cardStyle}>
                        <div className="px-5 py-6 space-y-7">
                          
                          {/* Subscription Toggle */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[16px] font-sf-ui-medium text-white/90">Новые подписчики</span>
                              <span className="text-[13px] text-white/40 font-sf-ui-light">Когда кто-то подписывается на вас</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSubNotifs(!subNotifs)}
                              className={`w-10 h-5 rounded-full transition-all relative overflow-hidden ${
                                subNotifs 
                                  ? 'bg-blue-600/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' 
                                  : 'bg-white/5'
                              }`}
                            >
                              {subNotifs && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                              )}
                              <motion.div
                                animate={{ x: subNotifs ? 22 : 2 }}
                                className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-colors ${
                                  subNotifs ? 'bg-white' : 'bg-white/20'
                                }`}
                              />
                            </button>
                          </div>

                          {/* New Posts Toggle */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[16px] font-sf-ui-medium text-white/90">Новые публикации</span>
                              <span className="text-[13px] text-white/40 font-sf-ui-light">От людей, на которых вы подписаны</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewPostNotifs(!newPostNotifs)}
                              className={`w-10 h-5 rounded-full transition-all relative overflow-hidden ${
                                newPostNotifs 
                                  ? 'bg-blue-600/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' 
                                  : 'bg-white/5'
                              }`}
                            >
                              {newPostNotifs && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                              )}
                              <motion.div
                                animate={{ x: newPostNotifs ? 22 : 2 }}
                                className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-colors ${
                                  newPostNotifs ? 'bg-white' : 'bg-white/20'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Custom Notifications Settings Card */}
                      <div className={`${cardStyle} mt-4`}>
                        <div className="px-5 py-6 space-y-4">
                          <button 
                            type="button"
                            onClick={() => setShowCustomNotifs(!showCustomNotifs)}
                            className="flex w-full items-center justify-between group"
                          >
                            <div className="flex flex-col text-left">
                              <span className="text-[16px] font-sf-ui-medium text-white/90">Настроить уведомления</span>
                              <span className="text-[13px] text-white/40 font-sf-ui-light">Выбрать отдельных пользователей</span>
                            </div>
                            <motion.img 
                              animate={{ rotate: showCustomNotifs ? 180 : 0 }}
                              src="/interface/str.svg" 
                              className="w-4 h-4 opacity-20 group-hover:opacity-40 transition-opacity"
                              style={{ filter: 'brightness(0) invert(1)' }}
                            />
                          </button>

                          <AnimatePresence>
                            {showCustomNotifs && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-2 pt-4 border-t border-white/[0.03]">
                                  {followedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between py-1">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                          <span className="text-[12px] text-white/40 font-bold">
                                            {user.tag.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <span className="text-[15px] text-white/80 font-sf-ui-light">
                                          {user.tag}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFollowedUsers(prev => prev.map(u => 
                                            u.id === user.id ? { ...u, enabled: !u.enabled } : u
                                          ))
                                        }}
                                        className={`w-9 h-4.5 rounded-full transition-all relative overflow-hidden ${
                                          user.enabled 
                                            ? 'bg-blue-600/80' 
                                            : 'bg-white/5'
                                        }`}
                                      >
                                        <motion.div
                                          animate={{ x: user.enabled ? 20 : 2 }}
                                          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full shadow-sm transition-colors ${
                                            user.enabled ? 'bg-white' : 'bg-white/20'
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>

                  )}
                </AnimatePresence>

                {!notificationsEnabled && (
                  <div className="pt-8 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                      <BellRing className="w-8 h-8 text-white/10 stroke-[1.5px]" />
                    </div>
                    <div className="text-[14px] text-white/30 font-sf-ui-light max-w-[200px] mx-auto leading-relaxed">
                      Уведомления полностью отключены. Вы не будете получать никаких оповещений.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAppearance && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[60] bg-[var(--bg-primary)] flex flex-col"
            >
              {/* Header */}
              <div 
                className="flex items-center px-6 bg-[var(--bg-primary)]"
                style={{ height: '56px', marginTop: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))' }}
              >
                <button
                  type="button"
                  onClick={() => setShowAppearance(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
              </div>

              <div className="flex-1 px-6 mt-4 space-y-6">
                {/* Theme Toggle */}
                <div className={cardStyle}>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-sf-ui-medium text-[var(--text-primary)]">Тёмная тема</span>
                        <span className="text-[12px] text-[var(--text-secondary)] font-sf-ui-light">Переключение темы оформления</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-12 h-6 rounded-full bg-[var(--border-light)] relative cursor-not-allowed"
                    >
                      <motion.div
                        animate={{ x: 26 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-[var(--text-tertiary)]/30 shadow-sm"
                      />
                    </button>
                  </div>
                </div>

                {/* Haptics & Sounds Card */}
                <div className={cardStyle}>
                  <div className="px-5 py-6 space-y-7">
                    {/* Sounds Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[16px] font-sf-ui-medium text-[var(--text-primary)]">Звуковые эффекты</span>
                        <span className="text-[13px] text-[var(--text-secondary)] font-sf-ui-light">Звуки при лайках и сообщениях</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSoundsEnabled(!soundsEnabled)}
                        className={`w-10 h-5 rounded-full transition-all relative overflow-hidden ${
                          soundsEnabled 
                            ? 'bg-blue-600/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' 
                            : 'bg-[var(--border-light)]'
                        }`}
                      >
                        {soundsEnabled && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                        )}
                        <motion.div
                          animate={{ x: soundsEnabled ? 22 : 2 }}
                          className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-colors ${
                            soundsEnabled ? 'bg-white' : 'bg-[var(--text-tertiary)]'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Haptics Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[16px] font-sf-ui-medium text-[var(--text-primary)]">Тактильная отдача</span>
                        <span className="text-[13px] text-[var(--text-secondary)] font-sf-ui-light">Вибрация при взаимодействиях</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHapticEnabled(!hapticEnabled)}
                        className={`w-10 h-5 rounded-full transition-all relative overflow-hidden ${
                          hapticEnabled 
                            ? 'bg-blue-600/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' 
                            : 'bg-[var(--border-light)]'
                        }`}
                      >
                        {hapticEnabled && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                        )}
                        <motion.div
                          animate={{ x: hapticEnabled ? 22 : 2 }}
                          className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-colors ${
                            hapticEnabled ? 'bg-white' : 'bg-[var(--text-tertiary)]'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Show Categories Toggle - Separate Card */}
                <div className={cardStyle}>
                  <div className="px-5 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[16px] font-sf-ui-medium text-[var(--text-primary)]">Категории</span>
                        <span className="text-[13px] text-[var(--text-secondary)] font-sf-ui-light">Карусель на главной странице</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCategories(!showCategories)}
                        className={`w-10 h-5 rounded-full transition-all relative overflow-hidden ${
                          showCategories 
                            ? 'bg-blue-600/80 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]' 
                            : 'bg-[var(--border-light)]'
                        }`}
                      >
                        {showCategories && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                        )}
                        <motion.div
                          animate={{ x: showCategories ? 22 : 2 }}
                          className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm transition-colors ${
                            showCategories ? 'bg-white' : 'bg-[var(--text-tertiary)]'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ bottom: 0, height: 'env(safe-area-inset-bottom, 0px)' }}
        />
      </div>

      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[60] bg-[var(--bg-primary)] flex flex-col"
          >
            <div className="flex items-center px-6 bg-[var(--bg-primary)]"
              style={{ height: '56px', marginTop: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))' }}
            >
              <button type="button" onClick={() => setShowPrivacy(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <span className="ml-3 text-[17px] font-sf-ui-medium text-white">Конфиденциальность</span>
            </div>

            <div className="flex-1 px-6 mt-4 space-y-4 overflow-y-auto scrollbar-hidden">
              {/* Контакты */}
              <div className={cardStyle}>
                <div className="px-5 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[16px] font-sf-ui-medium text-[var(--text-primary)]">Скрыть способы связи</span>
                      <span className="text-[13px] text-[var(--text-secondary)] font-sf-ui-light mt-0.5">
                        {contactsHidden ? 'Другие видят «Скрыт»' : 'Контакты видны всем'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContactsHidden(!contactsHidden)}
                      className={`w-12 h-6 rounded-full transition-all relative overflow-hidden ${
                        contactsHidden ? 'bg-blue-600 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)]' : 'bg-[var(--border-light)]'
                      }`}
                    >
                      {contactsHidden && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />}
                      <motion.div
                        animate={{ x: contactsHidden ? 26 : 4 }}
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${contactsHidden ? 'bg-white' : 'bg-[var(--text-tertiary)]'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Онлайн */}
              <div className={cardStyle}>
                <div className="px-5 py-5">
                  <div className="flex flex-col mb-4">
                    <span className="text-[16px] font-sf-ui-medium text-[var(--text-primary)]">Кто видит когда я в сети?</span>
                    <span className="text-[13px] text-[var(--text-secondary)] font-sf-ui-light mt-0.5">
                      {lastSeenVisibility === 'everyone' ? 'Все видят время визита' : 'Все видят «Был(а) недавно»'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['everyone', 'nobody'] as const).map((v) => (
                      <button key={v} type="button" onClick={() => setLastSeenVisibility(v)}
                        className={`flex-1 h-10 rounded-[14px] text-[14px] font-sf-ui-medium transition-all ${
                          lastSeenVisibility === v ? 'bg-white text-black' : 'bg-white/[0.06] text-white/40 border border-white/[0.08]'
                        }`}
                      >
                        {v === 'everyone' ? 'Все' : 'Никто'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Поиск */}
              <div className={cardStyle}>
                <div className="px-5 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[16px] font-sf-ui-medium text-[var(--text-primary)]">Скрыть из поиска</span>
                      <span className="text-[13px] text-[var(--text-secondary)] font-sf-ui-light mt-0.5">
                        {searchHidden ? 'Ваш тег не найти через поиск' : 'Вас можно найти по тегу'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchHidden(!searchHidden)}
                      className={`w-12 h-6 rounded-full transition-all relative overflow-hidden ${
                        searchHidden ? 'bg-blue-600 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)]' : 'bg-[var(--border-light)]'
                      }`}
                    >
                      {searchHidden && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />}
                      <motion.div
                        animate={{ x: searchHidden ? 26 : 4 }}
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${searchHidden ? 'bg-white' : 'bg-[var(--text-tertiary)]'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVerification && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[60] bg-[#0a0a0a] flex flex-col overflow-y-auto scrollbar-hidden"
          >
            {/* Шапка */}
            <div
              className="flex items-center px-6 flex-shrink-0"
              style={{ height: '56px', marginTop: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))' }}
            >
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
            </div>

            <div className="flex-1 px-5 pb-12 space-y-6 mt-2">
              {/* Hero плашка с анимированным фоном */}
              <div className="relative rounded-[28px] overflow-hidden" style={{ minHeight: 200 }}>
                {/* Фон */}
                <div className="absolute inset-0 rounded-[28px]" style={{
                  background: 'radial-gradient(ellipse at 85% 15%, rgba(80,80,80,0.45) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(50,50,50,0.3) 0%, transparent 50%), #111111',
                }} />
                {/* Световой луч */}
                <motion.div
                  animate={{ x: ['-100%', '350%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 6 }}
                  className="absolute top-[38%] left-0 w-[30%] h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />
                {/* Контент плашки */}
                <div className="relative z-10 p-7 flex flex-col justify-between h-full" style={{ minHeight: 200 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/interface/verified.svg" alt="" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
                    <span className="text-[13px] text-white/50 font-sf-ui-medium uppercase tracking-widest">HelloWorld</span>
                  </div>
                  <div>
                    <h1 className="text-[32px] font-ttc-bold text-white leading-tight">
                      Верификация аккаунта
                    </h1>
                    <p className="mt-2 text-[15px] text-white/55 font-sf-ui-light leading-relaxed">
                      Подтверди личность и получи особый статус на платформе
                    </p>
                  </div>
                </div>
              </div>

              {/* Преимущества */}
              <div className="space-y-6 px-1">
                {([
                  {
                    title: 'Доверие покупателей',
                    text: 'Значок верификации показывает, что аккаунт проверен командой HelloWorld. Покупатели охотнее обращаются к верифицированным продавцам.',
                    icon: (
                      <motion.svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <motion.path d="M13 2L15.5 8L22 8.8L17.5 13.2L18.7 19.5L13 16.5L7.3 19.5L8.5 13.2L4 8.8L10.5 8L13 2Z"
                          stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" fill="#60a5fa" fillOpacity="0.1"
                          animate={{ fillOpacity: [0.08, 0.22, 0.08] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.path d="M9.5 13L12 15.5L16.5 10.5"
                          stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                          initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', times: [0, 0.4, 0.7, 1] }}
                        />
                      </motion.svg>
                    ),
                  },
                  {
                    title: 'Продвижение в топах',
                    text: 'Объявления верифицированных пользователей получают приоритет в ленте и поиске.',
                    icon: (
                      <motion.svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <motion.rect x="3" y="15" width="4" height="9" rx="1.5" fill="#60a5fa"
                          animate={{ scaleY: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                          style={{ transformOrigin: '5px 24px' }}
                        />
                        <motion.rect x="11" y="10" width="4" height="14" rx="1.5" fill="#818cf8"
                          animate={{ scaleY: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                          style={{ transformOrigin: '13px 24px' }}
                        />
                        <motion.rect x="19" y="4" width="4" height="20" rx="1.5" fill="#a78bfa"
                          animate={{ scaleY: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                          style={{ transformOrigin: '21px 24px' }}
                        />
                      </motion.svg>
                    ),
                  },
                  {
                    title: 'Особый значок профиля',
                    text: 'Рядом с именем появляется синий значок верификации, который виден всем пользователям платформы.',
                    icon: (
                      <motion.svg width="26" height="26" viewBox="0 0 26 26" fill="none"
                        animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <motion.path d="M13 2L15.5 8.5L22.5 9.2L17.5 14L19 20.5L13 17.2L7 20.5L8.5 14L3.5 9.2L10.5 8.5L13 2Z"
                          fill="#3b82f6" fillOpacity="0.18" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round"
                          animate={{ fillOpacity: [0.12, 0.3, 0.12] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <path d="M10 13L12.5 15.5L17 10.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    ),
                  },
                  {
                    title: 'Шанс стать модератором',
                    text: 'Верифицированные пользователи с хорошей репутацией могут быть приглашены в команду модераторов проекта.',
                    icon: (
                      <motion.svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <motion.path d="M13 2.5L19.5 5.5V12.5C19.5 16.5 16.5 20 13 21.5C9.5 20 6.5 16.5 6.5 12.5V5.5L13 2.5Z"
                          stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" fill="#f59e0b" fillOpacity="0.1"
                          animate={{ fillOpacity: [0.06, 0.2, 0.06] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.path d="M10 13L12.2 15.5L16.5 10"
                          stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                          initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.35, 0.7, 1] }}
                        />
                      </motion.svg>
                    ),
                  },
                  {
                    title: 'Расширенные возможности',
                    text: 'Доступ к закрытым функциям платформы, которые появятся в будущих обновлениях.',
                    icon: (
                      <motion.svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <motion.circle cx="13" cy="13" r="4.5" stroke="#34d399" strokeWidth="1.5"
                          animate={{ r: [4.5, 5.5, 4.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.circle cx="13" cy="13" r="9" stroke="#34d399" strokeWidth="1" strokeDasharray="2.5 2.5"
                          animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                          style={{ transformOrigin: '13px 13px' }}
                        />
                        <motion.circle cx="13" cy="4" r="1.8" fill="#34d399"
                          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </motion.svg>
                    ),
                  },
                ] as { title: string; text: string; icon: React.ReactNode }[]).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.07 * i, duration: 0.3 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center mt-0.5">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-sf-ui-medium text-white/90 mb-1">{item.title}</div>
                      <div className="text-[13px] text-white/40 font-sf-ui-light leading-relaxed">{item.text}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Кнопка подачи заявки */}
              <div className="pt-2 pb-4">
                <button
                  type="button"
                  className="flex items-center gap-4 w-full active:scale-[0.97] transition-transform"
                  onClick={() => window.open('https://t.me/helloworld_support', '_blank')}
                >
                  <div className="h-[64px] w-[64px] rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                    <ChevronRight size={28} className="text-black" />
                  </div>
                  <div className="text-left">
                    <div className="text-[17px] font-sf-ui-medium text-white leading-tight">Подать заявку на верификацию</div>
                    <div className="text-[13px] text-white/35 font-sf-ui-light mt-0.5">Через Telegram поддержку</div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}