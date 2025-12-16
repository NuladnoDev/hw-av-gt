'use client'

import { useEffect, useState } from 'react'
import Profile from './profile'
import ProfileEdit from './profile_edit'
import Setting from './Setting'
import InfoMe from './info_me'
import { getSupabase } from '@/lib/supabaseClient'
import Ads from './ads'
import PostCreate from './Post_Create'

export default function HomeScreen() {
  const [scale, setScale] = useState(1)
  const [tab, setTab] = useState<'ads' | 'feed' | 'profile'>('feed')
  const [profileTab, setProfileTab] = useState<'ads' | 'posts' | 'about' | 'friends'>('posts')
  const [profileEdit, setProfileEdit] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsOrigin, setSettingsOrigin] = useState<'profile' | 'edit' | null>(null)
  const [returnToSettingsAfterEdit, setReturnToSettingsAfterEdit] = useState(false)
  const [infoMeOpen, setInfoMeOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
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
          window.localStorage.setItem('hw-auth', JSON.stringify({ tag: tagFromEmail.trim(), uid: id, email }))
          window.dispatchEvent(new Event('local-auth-changed'))
        } else {
          setCurrentTag(null)
        }
      }
    })()
  }, [])
  useEffect(() => {
    const client = getSupabase()
    if (!client) return
    const { data: sub } = client.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null
      const email = session?.user?.email ?? null
      const tagFromEmail = typeof email === 'string' ? email.split('@')[0] : null
      if (uid && tagFromEmail && tagFromEmail.trim().length > 0) {
        window.localStorage.setItem('hw-auth', JSON.stringify({ tag: tagFromEmail.trim(), uid, email }))
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
    window.addEventListener('open-settings', openSettings)
    window.addEventListener('close-settings', closeSettings)
    window.addEventListener('open-profile-edit', openProfileEdit)
    window.addEventListener('open-info-me', openInfoMe)
    window.addEventListener('close-info-me', closeInfoMe)
    return () => {
      window.removeEventListener('open-settings', openSettings)
      window.removeEventListener('close-settings', closeSettings)
      window.removeEventListener('open-profile-edit', openProfileEdit)
      window.removeEventListener('open-info-me', openInfoMe)
      window.removeEventListener('close-info-me', closeInfoMe)
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
  }, [createOpen, tab])
  useEffect(() => {
    const vv = (window as any).visualViewport
    if (!vv) return
    const handler = () => {
      const off = (vv.offsetTop && vv.offsetTop > 0) ? vv.offsetTop : Math.max(0, window.innerHeight - vv.height)
      document.documentElement.style.setProperty('--vv-offset-top', `${off}px`)
    }
    vv.addEventListener('resize', handler)
    vv.addEventListener('scroll', handler)
    handler()
    return () => {
      vv.removeEventListener('resize', handler)
      vv.removeEventListener('scroll', handler)
      document.documentElement.style.removeProperty('--vv-offset-top')
    }
  }, [])

  if (createOpen && tab === 'feed') {
    return <PostCreate onClose={() => setCreateOpen(false)} />
  }

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `translateY(var(--vv-offset-top, 0px)) scale(${scale})` }}>
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
              {tab === 'ads' ? 'Объявления' : tab === 'feed' ? 'Лента' : 'Профиль'}
            </div>
            <div className="flex items-center gap-4">
              <img
                  src="/navigation/filers.svg"
                  alt="filters"
                  className="h-[22px] w-[22px]"
                />
              <button
                type="button"
                onClick={() => {
                  if (tab === 'feed') {
                    setCreateOpen(true)
                  }
                }}
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-transparent"
              >
                <img
                  src="/navigation/plus.svg"
                  alt="add"
                  className="h-[20px] w-[20px]"
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
              <button
                type="button"
                onClick={() => setProfileEdit((v) => !v)}
                className="absolute left-6 top-0 flex h-full items-center"
                aria-label="Редактировать профиль"
              >
                <img
                  src="/interface/pencil-03.svg"
                  alt="edit"
                  className="h-[22px] w-[22px]"
                  style={{
                    filter:
                      'invert(56%) sepia(30%) saturate(1409%) hue-rotate(85deg) brightness(97%) contrast(89%)',
                  }}
                />
              </button>
              <div className="absolute right-6 top-0 flex h-full items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOrigin('profile')
                    setSettingsOpen(true)
                  }}
                  className="flex h-full items-center"
                  aria-label="Открыть настройки"
                >
                  <img
                    src="/setting/settings.svg"
                    alt="settings"
                    className="h-[22px] w-[22px]"
                    />
                </button>
              </div>
              <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center">
                <div className="text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
                  Профиль
                </div>
              </div>
              <div className="absolute left-0 bottom-[-0.5px] w-full" style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <Profile
            profileTab={profileTab}
            setProfileTab={setProfileTab}
            userTag={currentTag ?? undefined}
          />
        )}

        {tab !== 'profile' && (
          <div
            className="absolute left-0 w-full px-6"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)', height: 'calc(812px - 88px - 56px - var(--home-header-offset))' }}
          >
            {tab === 'feed' && (
              <div className="flex h-full w-full items-center justify-center">
              </div>
            )}
            {tab === 'ads' && <Ads />}
          </div>
        )}

        {/* profile content moved to Profile component */}

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ height: '88px', bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--nav-bottom-offset))' }}
        >
          <div className="absolute -top-[0.5px] left-0 w-full" style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
          <div className="grid h-full w-full grid-cols-3">
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1"
              onClick={() => setTab('ads')}
            >
              <img
                src="/navigation/bag-04%201.svg"
                alt="Объявления"
                className="h-[24px] w-[24px]"
                style={{ opacity: tab === 'ads' ? 1 : 0.6 }}
              />
              <span className={`text-[12px] ${tab === 'ads' ? 'text-white' : 'text-white/60'}`}>
                Объявления
              </span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1"
              onClick={() => setTab('feed')}
            >
              <img
                src="/navigation/House%201.svg"
                alt="Лента"
                className="h-[24px] w-[24px]"
                style={{ opacity: tab === 'feed' ? 1 : 0.6 }}
              />
              <span className={`text-[12px] ${tab === 'feed' ? 'text-white' : 'text-white/60'}`}>
                Лента
              </span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1"
              onClick={() => setTab('profile')}
            >
              <img
                src="/navigation/Vector.svg"
                alt="Профиль"
                className="h-[24px] w-[24px]"
                style={{ opacity: tab === 'profile' ? 1 : 0.6 }}
              />
              <span className={`text-[12px] ${tab === 'profile' ? 'text-white' : 'text-white/60'}`}>
                Профиль
              </span>
            </button>
          </div>
        </div>
        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ bottom: 0, height: 'env(safe-area-inset-bottom, 0px)' }}
        />
        {profileEdit && tab === 'profile' && (
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
      </div>
    </div>
  )
}
