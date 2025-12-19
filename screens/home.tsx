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
      if (createOpen && tab === 'feed') return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.max(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [createOpen, tab])
  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
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
                src="/interface/info-square-01-contained.svg"
                alt="info"
                className="h-[24px] w-[24px]"
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
                  src="/interface/bar-chart-03.svg"
                  alt="stats"
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
              <button
                type="button"
                onClick={() => setProfileEdit((v) => !v)}
                className="absolute left-6 top-0 flex h-full items-center"
                aria-label="Редактировать профиль"
              >
                <img
                  src="/interface/pencil-02.svg"
                  alt="edit"
                  className="h-[22px] w-[22px]"
                />
              </button>
              <div className="absolute right-6 top-0 flex h-full items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (profileMenuOpen) closeProfileMenu()
                    else openProfileMenu()
                  }}
                  className="flex h-full items-center"
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
              <div className="absolute left-0 bottom-[-0.5px] w-full" style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <>
            <Profile
              profileTab={profileTab}
              setProfileTab={setProfileTab}
              userTag={currentTag ?? undefined}
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
                  className="absolute right-6"
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
                      paddingTop: 'var(--profile-menu-padding-top)',
                      paddingBottom: 'var(--profile-menu-padding-bottom)',
                      paddingLeft: 'var(--profile-menu-padding-x)',
                      paddingRight: 'var(--profile-menu-padding-x)',
                    }}
                  >
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
                        backdropFilter: 'blur(var(--profile-menu-item-backdrop-blur))',
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
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab !== 'profile' && (
          <div
            className="absolute left-0 w-full px-6"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)', height: 'calc(812px - 88px - 56px - var(--home-header-offset))' }}
          >
            {tab === 'feed' && (
              <div className="relative h-full w-full">
                <div
                  className="absolute left-0 right-0 flex items-center justify-center"
                  style={{
                    top: 'var(--feed-controls-top)',
                    height: 'var(--feed-search-height)',
                  }}
                >
                  <div
                    className="flex w-full items-center"
                    style={{
                      height: 'var(--feed-search-height)',
                    }}
                  >
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-start"
                      style={{
                        height: '100%',
                        borderRadius: 'var(--feed-search-radius)',
                        background: 'var(--feed-search-bg)',
                        paddingLeft: 14,
                        paddingRight: 14,
                      }}
                    >
                      <img
                        src="/interface/search-02.svg"
                        alt=""
                        style={{
                          width: 'var(--feed-search-icon-size)',
                          height: 'var(--feed-search-icon-size)',
                          marginRight: 'var(--feed-search-gap)',
                        }}
                      />
                      <span
                        className="font-sf-ui-light"
                        style={{
                          fontSize: 'var(--feed-search-text-size)',
                          lineHeight: '18px',
                          color: 'var(--feed-search-text-color)',
                        }}
                      >
                        Поиск постов
                      </span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center justify-center"
                      style={{
                        width: 'var(--feed-create-width)',
                        height: '100%',
                        borderRadius: 'var(--feed-create-radius)',
                        background: 'var(--feed-create-bg)',
                        paddingLeft: 12,
                        paddingRight: 12,
                        marginLeft: 'calc(-1 * var(--feed-create-overlap))',
                      }}
                      onClick={() => setCreateOpen(true)}
                    >
                      <img
                        src="/interface/chevron-left.svg"
                        alt=""
                        style={{
                          width: 'var(--feed-create-chevron-size)',
                          height: 'var(--feed-create-chevron-size)',
                          marginRight: 4,
                        }}
                      />
                      <span
                        className="font-vk-demi"
                        style={{
                          fontSize: 'var(--feed-create-text-size)',
                          lineHeight: '19px',
                          color: '#FFFFFF',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Создать пост
                      </span>
                    </button>
                  </div>
                </div>
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
        {createOpen && tab === 'feed' && (
          <PostCreate
            onClose={() => {
              setCreateOpen(false)
            }}
          />
        )}
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
