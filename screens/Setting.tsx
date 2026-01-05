'use client'

import { useEffect, useState } from 'react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'

export default function Setting({
  onClose,
  onOpenAbout,
  onOpenContacts,
}: {
  onClose?: () => void
  onOpenAbout?: () => void
  onOpenContacts?: () => void
}) {
  const [scale, setScale] = useState(1)
  const [dirty, setDirty] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [tagText, setTagText] = useState<string>('user')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

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
        const localId = saved?.uuid ?? saved?.uid ?? null
        if (localId) setUserId(localId)

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
            <div
              className="flex w-full items-center justify-between px-0"
              style={{ height: 'calc(var(--settings-user-block-height) * var(--settings-scale))', marginTop: 'var(--settings-list-top-margin)' }}
            >
              <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
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
                <div className="flex flex-col">
                  <span className="leading-[1.5em] text-white font-sf-ui-medium" style={{ fontSize: 'calc(var(--settings-user-title-size) * var(--settings-scale))' }}>
                    {tagText && tagText.trim().length > 0 ? tagText.trim() : 'user'}
                  </span>
                  <span className="leading-[1.3em] text-[#A1A1A1] font-sf-ui-light" style={{ fontSize: 'calc(var(--settings-user-subtitle-size) * var(--settings-scale))' }}>
                    {userId ?? 'id пользователя'}
                  </span>
                </div>
              </div>
              <img
                src="/interface/chevron-right 1.svg"
                alt=""
                className="h-[20px] w-[20px]"
                style={{ filter: 'var(--settings-chevron-filter)' }}
              />
            </div>
            <div className="w-full" style={{ height: '0.3px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ marginTop: 'var(--settings-categories-top-margin)' }}>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left bg-transparent"
                style={{ height: 'var(--settings-item-height)' }}
                disabled
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/user-profile-03.svg"
                    alt="Аккаунт"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                    className="opacity-60"
                  />
                  <span className="leading-[1.7em] text-white/60 font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Аккаунт
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
                disabled
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/settings.svg"
                    alt="Основные"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                    className="opacity-60"
                  />
                  <span className="leading-[1.7em] text-white/60 font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Основные
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
                disabled
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/colors-01.svg"
                    alt="Улучшение аватара"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                    className="opacity-60"
                  />
                  <span className="leading-[1.7em] text-white/60 font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Улучшение аватара
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
                disabled
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/notification-box.svg"
                    alt="Уведомления"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                    className="opacity-60"
                  />
                  <span className="leading-[1.7em] text-white/60 font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
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
                    src="/setting/notification-box.svg"
                    alt="Контакты"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                    className="opacity-60"
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
            </div>
            <div className="absolute left-0 w-full" style={{ bottom: 'var(--settings-app-bottom-offset)' }}>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left bg-transparent"
                style={{ height: 'var(--settings-item-height)' }}
              >
                <div className="flex items-center" style={{ gap: 'var(--settings-icon-gap)' }}>
                  <img
                    src="/setting/brackets.svg"
                    alt="Для"
                    style={{ filter: 'var(--settings-icon-filter)', width: 'var(--settings-item-icon-size)', height: 'var(--settings-item-icon-size)' }}
                  />
                  <span className="leading-[1.7em] text-white font-sf-ui-regular" style={{ fontSize: 'var(--profile-extra-title-size)' }}>
                    Для разработчиков 
                  </span>
                </div>
                <img
                  src="/interface/chevron-right 1.svg"
                  alt=""
                  className="h-[20px] w-[20px]"
                  style={{ filter: 'var(--settings-chevron-filter)' }}
                />
              </button>
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ bottom: 0, height: 'env(safe-area-inset-bottom, 0px)' }}
        />
      </div>
    </div>
  )
}
