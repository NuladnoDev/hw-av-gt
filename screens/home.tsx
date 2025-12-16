'use client'

import { useEffect, useRef, useState } from 'react'
import Profile from './profile'
import ProfileEdit from './profile_edit'
import Setting from './Setting'
import InfoMe from './info_me'
import { getSupabase } from '@/lib/supabaseClient'
import Ads from './ads'

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
  const [createClosing, setCreateClosing] = useState(false)
  const [createText, setCreateText] = useState('')
  const [createImages, setCreateImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const [allGalleryImages, setAllGalleryImages] = useState<string[]>([])
  const [galleryVisibleCount, setGalleryVisibleCount] = useState(15)
  const galleryAskedRef = useRef(false)
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

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const urls = Array.from(files).map((f) => URL.createObjectURL(f))
    setCreateImages((prev) => [...prev, ...urls])
  }
  const handleFilesToGallery = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('read_failed'))
        reader.readAsDataURL(file)
      })
    const urls = await Promise.all(Array.from(files).map((f) => toDataUrl(f)))
    setAllGalleryImages((prev) => {
      const next = [...prev, ...urls]
      try {
        window.localStorage.setItem('hw-gallery', JSON.stringify(next))
      } catch {}
      return next
    })
  }
  const toggleImageSelect = (src: string) => {
    setCreateImages((prev) => {
      if (prev.includes(src)) return prev.filter((p) => p !== src)
      return [...prev, src]
    })
  }
  const removeCreateImage = (src: string) => {
    setCreateImages((prev) => prev.filter((p) => p !== src))
  }
  const openGalleryPicker = async () => {
    const apiWin = window as unknown as {
      showOpenFilePicker?: (options: {
        multiple?: boolean
        types?: { description?: string; accept: Record<string, string[]> }[]
      }) => Promise<FileSystemFileHandle[]>
    }
    if (apiWin && typeof apiWin.showOpenFilePicker === 'function') {
      try {
        const handles = await apiWin.showOpenFilePicker({
          multiple: true,
          types: [{ description: 'Images', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] } }],
        })
        const files: File[] = await Promise.all(handles.map((h) => h.getFile()))
        const toDataUrl = (file: File) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(new Error('read_failed'))
            reader.readAsDataURL(file)
          })
        const urls = await Promise.all(files.map((f) => toDataUrl(f)))
        setAllGalleryImages((prev) => {
          const next = [...prev, ...urls]
          try {
            window.localStorage.setItem('hw-gallery', JSON.stringify(next))
          } catch {}
          return next
        })
        setGalleryVisibleCount((c) => {
          const nextLen = (Array.isArray(allGalleryImages) ? allGalleryImages.length : 0) + urls.length
          return Math.min(nextLen, Math.max(c, 15))
        })
      } catch {}
    } else {
      galleryInputRef.current?.click()
    }
  }
  const onGalleryScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      setGalleryVisibleCount((c) => Math.min(c + 15, allGalleryImages.length))
    }
  }

  useEffect(() => {
    if (!createOpen) {
      setTimeout(() => {
        createImages.forEach((u) => URL.revokeObjectURL(u))
        setCreateImages([])
        setGalleryVisibleCount(15)
        setCreateText('')
      }, 0)
    }
  }, [createOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (createOpen && tab === 'feed') {
      try {
        const raw = window.localStorage.getItem('hw-gallery')
        const arr = raw ? (JSON.parse(raw) as string[]) : []
        if (Array.isArray(arr) && arr.length > 0) {
          setAllGalleryImages(arr)
          setGalleryVisibleCount(Math.min(15, arr.length))
        }
      } catch {}
    }
  }, [createOpen, tab])

  useEffect(() => {
    const el = textAreaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [createText])
  useEffect(() => {
    if (createOpen && tab === 'feed') {
      setTimeout(() => {
        try {
          textAreaRef.current?.focus({ preventScroll: true } as any)
        } catch {
          textAreaRef.current?.focus()
        }
      }, 50)
    }
  }, [createOpen, tab])

  useEffect(() => {
    if (!createOpen) {
      galleryAskedRef.current = false
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      } catch {}
    }
  }, [createOpen])

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
                    setTimeout(() => {
                      try {
                        textAreaRef.current?.focus({ preventScroll: true } as any)
                      } catch {
                        textAreaRef.current?.focus()
                      }
                    }, 0)
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
        {createOpen && tab === 'feed' && (
          <>
            <div
              className={`absolute left-0 top-0 h-[812px] w-[375px] ${createClosing ? 'overlay-out' : 'overlay-in'}`}
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => {
                setCreateClosing(true)
                setTimeout(() => {
                  setCreateOpen(false)
                  setCreateClosing(false)
                }, 200)
              }}
            />
            <div
              className={`absolute left-0 w-full bottom-0 ${createClosing ? 'bottom-sheet-out' : 'bottom-sheet-in'}`}
              style={{
                height: '100%',
                background: 'var(--create-sheet-bg)',
                borderTop: 'none',
                borderTopLeftRadius: '0px',
                borderTopRightRadius: '0px',
                padding: '0px',
              }}
            >
              <div className="flex h-full w-full flex-col">
                <div className="relative flex items-center justify-between h-[56px] px-6">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateClosing(true)
                      setTimeout(() => {
                        setCreateOpen(false)
                        setCreateClosing(false)
                      }, 200)
                    }}
                    className="flex h-full items-center"
                    style={{ marginTop: 'var(--create-header-left-icon-margin-top, var(--create-header-icons-margin-top))' }}
                    aria-label="Закрыть"
                  >
                    <img
                      src="/interface/x-01.svg"
                      alt="close"
                      className="h-[var(--create-header-left-icon-size)] w-[var(--create-header-left-icon-size)]"
                      style={{ filter: 'invert(1) brightness(1.6)' }}
                    />
                  </button>
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center gap-2" style={{ marginTop: 'var(--create-header-title-margin-top)', marginLeft: 'var(--create-header-title-margin-left)' }}>
                    <span className="leading-[1em] text-white font-ttc-demibold" style={{ fontFamily: 'var(--create-header-title-font)', fontSize: 'var(--create-header-title-size)' }}>
                      Новый пост
                    </span>
                  </div>
                  <button
                    type="button"
                    className="flex h-full items-center"
                    style={{ marginTop: 'var(--create-header-right-icon-margin-top, var(--create-header-icons-margin-top))' }}
                    aria-label="Загрузка"
                  >
                    <img
                      src="/interface/upload.svg"
                      alt="upload"
                      className="h-[var(--create-header-right-icon-size)] w-[var(--create-header-right-icon-size)]"
                    />
                  </button>
                </div>
                <div className="w-full" style={{ height: '0.3px', background: 'rgba(255,255,255,0.06)', marginTop: 'var(--create-header-divider-gap)' }} />
                <div className="w-full" style={{ paddingLeft: 'var(--create-editor-padding-left)', paddingRight: 'var(--create-editor-padding-right)', marginTop: 'var(--create-editor-top-gap)' }}>
                  <textarea
                    ref={textAreaRef}
                    autoFocus
                    inputMode="text"
                    rows={1}
                    placeholder="Напиши что-нибудь..."
                    className="create-textarea w-full bg-transparent leading-[1.4em] text-white outline-none resize-none font-sf-ui-light"
                    value={createText}
                    onChange={(e) => setCreateText(e.target.value)}
                    style={{
                      minHeight:
                        createImages.length > 0
                          ? 'var(--create-editor-min-height-with-media)'
                          : 'var(--create-editor-min-height)',
                      paddingBottom: '8px',
                      fontSize: 'var(--create-editor-text-size)',
                    }}
                  />
                </div>
                <div className="px-6 pt-3">
                  {createImages.length > 0 && (
                    <>
                      <div className="w-full grid gap-2" style={{ gridTemplateColumns: createImages.length === 1 ? '1fr' : '1fr 1fr' }}>
                        {createImages.slice(0, Math.min(2, createImages.length)).map((src, idx) => (
                          <div
                            key={`${src}-big-${idx}`}
                            className="relative overflow-hidden rounded-[12px] border border-[#2B2B2B]"
                            style={createImages.length === 1 ? { height: 'var(--create-attachments-single-height)' } : { aspectRatio: 'var(--create-attachments-pair-aspect)' }}
                          >
                            <img src={src} alt="preview" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeCreateImage(src)}
                              className="absolute right-2 top-2 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#111111]/80"
                              aria-label="Удалить"
                            >
                              <img src="/interface/x-01.svg" alt="remove" className="h-[18px] w-[18px]" style={{ filter: 'invert(1) brightness(1.6)' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {createImages.length > 2 && (
                        <div className="mt-2 flex w-full items-center gap-2 overflow-x-auto">
                          {createImages.slice(2).map((src, idx) => (
                            <div key={`${src}-thumb-${idx}`} className="relative overflow-hidden rounded-[10px] border border-[#2B2B2B]" style={{ height: 'var(--create-thumb-height)', aspectRatio: 'var(--create-thumb-aspect)', flex: '0 0 auto' }}>
                              <img src={src} alt="thumb" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeCreateImage(src)}
                                className="absolute right-1.5 top-1.5 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#111111]/80"
                                aria-label="Удалить"
                              >
                                <img src="/interface/x-01.svg" alt="remove" className="h-[14px] w-[14px]" style={{ filter: 'invert(1) brightness(1.6)' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <div className="mt-3 flex w-full items-center justify-between" style={{ gap: 'var(--create-actions-row-gap)' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFilesToGallery(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={openGalleryPicker}
                      className="flex items-center gap-2 rounded-[var(--create-actions-button-radius)] border border-[#2B2B2B] bg-[#111111] px-3"
                      style={{ marginLeft: 'var(--create-actions-left-offset)', height: 'var(--create-actions-button-height)', minWidth: 'var(--create-time-button-min-width)' }}
                    >
                      <img
                        src="/interface/add image.svg"
                        alt="restricted"
                        className="h-[var(--create-action-icon-size)] w-[var(--create-action-icon-size)]"
                      />
                      <span className="text-[14px] leading-[1.3em] text-[#A1A1A1]">Фото/Видео</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex-1 overflow-hidden pt-3" style={{ borderTop: '0.3px solid rgba(255, 255, 255, 0.06)' }}>
                  <div
                    className="grid w-full overflow-y-auto px-[var(--create-gallery-padding)]"
                    style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 'var(--create-gallery-item-size)', gap: 'var(--create-gallery-gap)' }}
                    onScroll={onGalleryScroll}
                  >
                    <button
                      type="button"
                      className="flex items-center justify-center rounded-[12px] border border-[#2B2B2B] bg-[#111111]"
                      onClick={openGalleryPicker}
                    >
                      <img
                        src="/interface/paperclip.svg"
                        alt="camera"
                        className="h-[22px] w-[22px]"
                        style={{ filter: 'invert(1) brightness(2)' }}
                      />
                    </button>
                    {allGalleryImages.slice(0, galleryVisibleCount).map((src, idx) => {
                      const selected = createImages.includes(src)
                      return (
                        <button
                          key={`${src}-grid-${idx}`}
                          type="button"
                          onClick={() => toggleImageSelect(src)}
                          className="relative overflow-hidden rounded-[12px]"
                          style={{ border: selected ? `2px solid rgba(var(--create-selection-color-rgb), var(--create-selection-opacity))` : '1px solid #2B2B2B' }}
                        >
                          <img src={src} alt="gallery" className="h-full w-full object-cover" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
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
