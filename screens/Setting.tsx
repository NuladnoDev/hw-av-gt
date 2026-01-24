'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Bell, BellRing, ShieldCheck, Share2, Flag } from 'lucide-react'
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
  const [showVerification, setShowVerification] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [subNotifs, setSubNotifs] = useState(true)
  const [newPostNotifs, setNewPostNotifs] = useState(true)

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
          <div className="relative w-full">
            <button
              type="button"
              className="flex w-full items-center justify-between px-0 text-left bg-transparent"
              style={{ height: 'calc(var(--settings-user-block-height) * var(--settings-scale))', marginTop: 'var(--settings-list-top-margin)' }}
              onClick={onOpenProfile}
            >
              <div className="flex items-center flex-1 min-w-0" style={{ gap: 'var(--settings-icon-gap)' }}>
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    width: 'calc(var(--settings-user-avatar-size) * var(--settings-scale))',
                    height: 'calc(var(--settings-user-avatar-size) * var(--settings-scale))',
                    aspectRatio: '1 / 1',
                    flexShrink: 0,
                    background: avatarUrl ? '#0A0A0A' : gradient,
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" style={{ objectPosition: 'center' }} />
                  ) : (
                    <span className="text-white font-ttc-bold" style={{ fontSize: 'calc(18px * var(--settings-scale))', lineHeight: '1em' }}>
                      {initialLetter}
                    </span>
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="leading-[1.5em] text-white font-sf-ui-medium truncate" style={{ fontSize: 'calc(var(--settings-user-title-size) * var(--settings-scale))' }}>
                    {tagText && tagText.trim().length > 0 ? tagText.trim() : 'user'}
                  </span>
                  <div 
                    className="cursor-pointer flex items-center" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRealId(!showRealId);
                    }}
                  >
                    <div className="relative w-full min-h-[1.3em]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={showRealId ? 'real' : 'pretty'}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="leading-[1.3em] text-[#A1A1A1] font-sf-ui-light break-all pr-2"
                          style={{ fontSize: 'calc(var(--settings-user-subtitle-size) * var(--settings-scale))' }}
                        >
                          {showRealId ? (userId ?? 'id пользователя') : (prettyId ?? 'id пользователя')}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
              <img
                src="/interface/chevron-right 1.svg"
                alt=""
                className="h-[20px] w-[20px]"
                style={{ filter: 'var(--settings-chevron-filter)' }}
              />
            </button>
            <div className="w-full" style={{ height: '0.3px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ marginTop: 'var(--settings-categories-top-margin)' }}>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left bg-transparent"
                style={{ height: 'var(--settings-item-height)' }}
                onClick={openAbout}
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/edit-contained.svg"
                    alt="Обо мне"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                  />
                  <span className="leading-[1.7em] text-white font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Обо мне
                  </span>
                </div>
                <img
                  src="/interface/chevron-right 1.svg"
                  alt=""
                  className="h-[20px] w-[20px]"
                  style={{ filter: 'var(--settings-chevron-filter)' }}
                />
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left bg-transparent"
                style={{ height: 'var(--settings-item-height)' }}
                onClick={onOpenPhone}
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/colors-01.svg"
                    alt="Устройства"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                  />
                  <span className="leading-[1.7em] text-white font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Устройства
                  </span>
                </div>
                <img
                  src="/interface/chevron-right 1.svg"
                  alt=""
                  className="h-[20px] w-[20px]"
                  style={{ filter: 'var(--settings-chevron-filter)' }}
                />
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left bg-transparent"
                style={{ height: 'var(--settings-item-height)' }}
                onClick={() => setShowNotifications(true)}
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/notification-box.svg"
                    alt="Уведомления"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                  />
                  <span className="leading-[1.7em] text-white font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Уведомления
                  </span>
                </div>
                <img
                  src="/interface/chevron-right 1.svg"
                  alt=""
                  className="h-[20px] w-[20px]"
                  style={{ filter: 'var(--settings-chevron-filter)' }}
                />
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left bg-transparent"
                style={{ height: 'var(--settings-item-height)' }}
                onClick={openContacts}
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/interface/address.svg"
                    alt="Контакты"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                  />
                  <span className="leading-[1.7em] text-white font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Контакты
                  </span>
                </div>
                <img
                  src="/interface/chevron-right 1.svg"
                  alt=""
                  className="h-[20px] w-[20px]"
                  style={{ filter: 'var(--settings-chevron-filter)' }}
                />
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left bg-transparent active:opacity-60 transition-opacity"
                style={{ height: 'var(--settings-item-height)' }}
                onClick={() => setShowVerification(true)}
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
              src="/interface/verified.svg"
              alt="Подтверждение аккаунта"
              style={{ width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)', filter: 'brightness(0) saturate(100%) invert(43%) sepia(98%) saturate(2338%) hue-rotate(185deg) brightness(101%) contrast(101%)' }}
            />
                  <span className="leading-[1.7em] text-white font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Подтверждение аккаунта
                  </span>
                </div>
                <img
                  src="/interface/chevron-right 1.svg"
                  alt=""
                  className="h-[20px] w-[20px]"
                  style={{ filter: 'var(--settings-chevron-filter)' }}
                />
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left bg-transparent opacity-40 cursor-not-allowed"
                style={{ height: 'var(--settings-item-height)' }}
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/brackets.svg"
                    alt="О проекте..."
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                  />
                  <span className="leading-[1.7em] text-white font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    О проекте...
                  </span>
                </div>
                <div className="text-[11px] text-white/30 font-sf-ui-medium uppercase tracking-wider pr-1">Скоро</div>
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
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="space-y-4"
                    >
                      <div className="text-[11px] text-white/30 font-sf-ui-bold uppercase tracking-widest pl-2">Настройки подписок</div>
                      
                      {/* Subscription Toggle */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
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
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {!notificationsEnabled && (
                  <div className="p-6 text-center space-y-2">
                    <div className="text-white/20 flex justify-center">
                      <BellRing className="w-12 h-12 stroke-[1px]" />
                    </div>
                    <div className="text-[14px] text-white/30 font-sf-ui-light">
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
                  className="w-full max-w-[280px] py-4 rounded-2xl bg-white/5 border border-white/5 text-white/40 font-sf-ui-medium text-[16px] active:scale-[0.98] transition-all cursor-not-allowed"
                >
                  Скоро
                </button>
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
