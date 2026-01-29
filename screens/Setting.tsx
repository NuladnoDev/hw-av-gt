'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Bell, BellRing, ShieldCheck, Share2, Flag, Monitor, Moon, Sun } from 'lucide-react'
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [subNotifs, setSubNotifs] = useState(true)
  const [newPostNotifs, setNewPostNotifs] = useState(true)

  const cardStyle = "bg-[#111111] border border-white/[0.05] rounded-[32px] overflow-hidden"
  const itemStyle = "flex w-full items-center justify-between px-4 py-[18px] text-left bg-transparent active:bg-white/[0.05] transition-colors"
  const labelStyle = "leading-[1.4em] text-white font-sf-ui-regular text-[15px]"
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

        if (client) {
          const { data } = await client.auth.getUser()
          const supabaseId = data.user?.id ?? null
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
      } catch {}
    })()
    const handleUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ tag?: string; avatar_url?: string }>
      if (typeof ev.detail?.tag === 'string') setTagText(ev.detail.tag)
      if (ev.detail?.avatar_url === null) setAvatarUrl(null)
      else if (typeof ev.detail?.avatar_url === 'string') setAvatarUrl(ev.detail.avatar_url)
    }
    window.addEventListener('profile-updated', handleUpdated as EventListener)
    return () => window.removeEventListener('profile-updated', handleUpdated as EventListener)
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
      const ev = new Event('open-profile-edit')
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
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden edit-screen-in">
      <div
        className="relative h-[812px] w-[375px]"
        style={{ transform: `scale(${scale})`, '--settings-scale': 2, '--settings-list-top-margin': '18px' } as React.CSSProperties}
      >
        <div className="absolute left-0 top-0 h-[812px] w-[375px]" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={close}
              className="absolute left-6 top-0 flex h-full items-center"
              aria-label="Назад"
            >
              <img
                src="/interface/str.svg"
                alt="back"
                className="h-[22px] w-[22px]"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </button>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center">
              <div className="text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
                Настройки
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 w-full px-6 overflow-y-auto"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
            height: 'calc(812px - 56px - var(--home-header-offset))',
          }}
        >
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
                    <span className="text-white font-ttc-bold text-[26px] leading-none">
                      {initialLetter}
                    </span>
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[19px] font-sf-ui-medium text-white leading-tight truncate">
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
                          className="text-[12px] text-white/40 font-sf-ui-light break-all pr-2"
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
              </button>
              
              <div className="h-[1px] bg-white/[0.03] mx-4" />
              
              <button type="button" className={itemStyle} onClick={onOpenPhone}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <img src="/setting/colors-01.svg" alt="" className="w-5 h-5 filter-none" />
                  </div>
                  <span className={labelStyle}>Устройства</span>
                </div>
              </button>

              <div className="h-[1px] bg-white/[0.03] mx-4" />

              <button type="button" className={itemStyle} onClick={() => setShowNotifications(true)}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <img src="/setting/notification-box.svg" alt="" className="w-5 h-5 filter-none" />
                  </div>
                  <span className={labelStyle}>Уведомления</span>
                </div>
              </button>

              <div className="h-[1px] bg-white/[0.03] mx-4" />

              <button type="button" className={itemStyle} onClick={openContacts}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <img src="/interface/address.svg" alt="" className="w-5 h-5 filter-none" />
                  </div>
                  <span className={labelStyle}>Контакты</span>
                </div>
              </button>
            </div>

            {/* Appearance & Verification Section */}
            <div className={cardStyle}>
              <button type="button" className={itemStyle} onClick={() => setShowAppearance(true)}>
                <div className="flex items-center gap-3">
                  <div className={iconBgStyle}>
                    <Monitor className="w-[18px] h-[18px] text-white/80" strokeWidth={1.5} />
                  </div>
                  <span className={labelStyle}>Вид сайта</span>
                </div>
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
                  <span className={labelStyle}>Подтверждение аккаунта</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[60] bg-[#0A0A0A] flex flex-col"
            >
              {/* Notifications Header */}
              <div 
                className="flex items-center px-6 bg-[#0A0A0A]"
                style={{ height: '56px', marginTop: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))' }}
              >
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="flex h-full items-center"
                >
                  <img
                    src="/interface/str.svg"
                    alt="back"
                    className="h-[22px] w-[22px]"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </button>
                <div className="flex-1 text-center pr-6">
                  <div className="text-[20px] font-bold text-white font-ttc-bold">
                    Уведомления
                  </div>
                </div>
              </div>

              <div className="flex-1 px-6 mt-4 space-y-6">
                {/* Main Toggle */}
                <div className={cardStyle}>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${notificationsEnabled ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-white/20'}`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-sf-ui-medium text-white">Все уведомления</span>
                        <span className="text-[12px] text-white/40 font-sf-ui-light">Глобальный переключатель</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                    >
                      <motion.div
                        animate={{ x: notificationsEnabled ? 26 : 4 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {notificationsEnabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="h-[1px] bg-white/[0.03] mx-4" />
                        <div className="p-4 space-y-4">
                          <div className="text-[11px] text-white/30 font-sf-ui-bold uppercase tracking-widest pl-2">Настройки подписок</div>
                          
                          {/* Subscription Toggle */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[15px] font-sf-ui-medium text-white/90">Новые подписчики</span>
                              <span className="text-[12px] text-white/40 font-sf-ui-light">Когда кто-то подписывается на вас</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSubNotifs(!subNotifs)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${subNotifs ? 'bg-blue-500/60' : 'bg-white/5'}`}
                            >
                              <motion.div
                                animate={{ x: subNotifs ? 22 : 2 }}
                                className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                              />
                            </button>
                          </div>

                          {/* New Posts Toggle */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[15px] font-sf-ui-medium text-white/90">Новые публикации</span>
                              <span className="text-[12px] text-white/40 font-sf-ui-light">От людей, на которых вы подписаны</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewPostNotifs(!newPostNotifs)}
                              className={`w-10 h-5 rounded-full transition-colors relative ${newPostNotifs ? 'bg-blue-500/60' : 'bg-white/5'}`}
                            >
                              <motion.div
                                animate={{ x: newPostNotifs ? 22 : 2 }}
                                className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                              />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!notificationsEnabled && (
                  <div className="p-8 text-center space-y-3">
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
          {showVerification && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[60] bg-[#0A0A0A] flex flex-col"
            >
              {/* Header */}
              <div 
                className="flex items-center px-6 bg-[#0A0A0A]"
                style={{ height: '56px', marginTop: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))' }}
              >
                <button
                  type="button"
                  onClick={() => setShowVerification(false)}
                  className="flex h-full items-center"
                >
                  <img
                    src="/interface/str.svg"
                    alt="back"
                    className="h-[22px] w-[22px]"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </button>
                <div className="flex-1 text-center pr-6">
                  <div className="text-[20px] font-bold text-white font-ttc-bold">
                    Подтверждение
                  </div>
                </div>
              </div>

              <div className="flex-1 px-6 flex flex-col items-center justify-center text-center space-y-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full" />
                  <div className="relative p-6 rounded-[32px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                    <ShieldCheck className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-[24px] font-ttc-bold text-white tracking-tight">
                    Подайте заявку
                  </h2>
                  <p className="text-[16px] text-white/40 font-sf-ui-regular leading-relaxed max-w-[280px]">
                    Для получения значка верификации необходимо заполнить специальную форму в нашем Telegram канале.
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full max-w-[280px] py-4 rounded-[26px] bg-white/5 border border-white/5 text-white/40 font-sf-ui-medium text-[16px] active:scale-[0.98] transition-all cursor-not-allowed"
                >
                  Скоро
                </button>
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
              className="absolute inset-0 z-[60] bg-[#0A0A0A] flex flex-col"
            >
              {/* Appearance Header */}
              <div 
                className="flex items-center px-6 bg-[#0A0A0A]"
                style={{ height: '56px', marginTop: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))' }}
              >
                <button
                  type="button"
                  onClick={() => setShowAppearance(false)}
                  className="flex h-full items-center"
                >
                  <img
                    src="/interface/str.svg"
                    alt="back"
                    className="h-[22px] w-[22px]"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </button>
                <div className="flex-1 text-center pr-6">
                  <div className="text-[20px] font-bold text-white font-ttc-bold">
                    Вид сайта
                  </div>
                </div>
              </div>

              <div className="flex-1 px-6 mt-4 space-y-6">
                {/* Theme Toggle */}
                <div className={cardStyle}>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isDarkTheme ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {isDarkTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-sf-ui-medium text-white">Тёмная тема</span>
                        <span className="text-[12px] text-white/40 font-sf-ui-light">Переключение темы оформления</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDarkTheme(!isDarkTheme)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${isDarkTheme ? 'bg-blue-500' : 'bg-white/10'}`}
                    >
                      <motion.div
                        animate={{ x: isDarkTheme ? 26 : 4 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
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
    </div>
  )
}
