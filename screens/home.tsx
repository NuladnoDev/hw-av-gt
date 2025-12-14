'use client'

import { useEffect, useRef, useState } from 'react'
import Profile from './profile'
import Ads from './ads'

export default function HomeScreen() {
  const [scale, setScale] = useState(1)
  const [tab, setTab] = useState<'ads' | 'feed' | 'profile'>('feed')
  const [profileTab, setProfileTab] = useState<'ads' | 'posts' | 'music' | 'friends'>('posts')
  const [createOpen, setCreateOpen] = useState(false)
  const [createText, setCreateText] = useState('')
  const [createImages, setCreateImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const [allGalleryImages, setAllGalleryImages] = useState<string[]>([])
  const [galleryVisibleCount, setGalleryVisibleCount] = useState(15)
  const galleryAskedRef = useRef(false)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const urls = Array.from(files).map((f) => URL.createObjectURL(f))
    setCreateImages((prev) => [...prev, ...urls])
  }
  const handleFilesToGallery = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const urls = Array.from(files).map((f) => URL.createObjectURL(f))
    setAllGalleryImages((prev) => [...prev, ...urls])
  }
  const toggleImageSelect = (src: string) => {
    setCreateImages((prev) => {
      if (prev.includes(src)) return prev.filter((p) => p !== src)
      return [...prev, src]
    })
  }
  const openGalleryPicker = async () => {
    const anyWin = window as any
    if (anyWin && typeof anyWin.showOpenFilePicker === 'function') {
      try {
        const handles = await anyWin.showOpenFilePicker({
          multiple: true,
          types: [{ description: 'Images', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] } }],
        })
        const files: File[] = await Promise.all(handles.map((h: any) => h.getFile()))
        const urls = files.map((f) => URL.createObjectURL(f))
        setAllGalleryImages(urls)
        setGalleryVisibleCount(Math.min(15, urls.length))
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
      createImages.forEach((u) => URL.revokeObjectURL(u))
      allGalleryImages.forEach((u) => URL.revokeObjectURL(u))
      setCreateImages([])
      setAllGalleryImages([])
      setGalleryVisibleCount(15)
      setCreateText('')
    }
  }, [createOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = textAreaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [createText])

  useEffect(() => {
    if (createOpen && tab === 'feed' && !galleryAskedRef.current) {
      galleryAskedRef.current = true
      openGalleryPicker()
    }
    if (!createOpen) {
      galleryAskedRef.current = false
    }
  }, [createOpen, tab])

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
                src="/navigation/filers.svg"
                alt="filters"
                className="h-[22px] w-[22px]"
              />
              <button
                type="button"
                onClick={() => {
                  if (tab === 'feed') setCreateOpen(true)
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
              <div className="absolute left-6 top-0 flex h-full items-center">
                <img
                  src="/navigation/settings%204.svg"
                  alt="settings"
                  className="h-[22px] w-[22px]"
                />
              </div>
              <div className="absolute right-6 top-0 flex h-full items-center">
                <img
                  src="/navigation/plus.svg"
                  alt="add"
                  className="h-[20px] w-[20px]"
                />
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

        {tab === 'profile' && <Profile profileTab={profileTab} setProfileTab={setProfileTab} />}

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
              className="absolute left-0 top-0 h-[812px] w-[375px] overlay-in"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setCreateOpen(false)}
            />
            <div
              className="absolute left-0 w-full bottom-0 bottom-sheet-in"
              style={{
                height: '100%',
                background: 'var(--create-sheet-bg)',
                borderTop: '1px solid var(--create-sheet-border-color)',
                borderTopLeftRadius: 'var(--create-sheet-radius)',
                borderTopRightRadius: 'var(--create-sheet-radius)',
                padding: 'var(--create-sheet-padding)',
              }}
            >
              <div className="flex h-full w-full flex-col">
                <div className="mx-auto mb-3 h-[4px] w-[44px] rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
                <div className="mb-3 text-center text-[20px] leading-[1.2em] text-white font-ttc-bold" style={{ marginTop: 'var(--create-title-top-margin)' }}>
                  Новый пост
                </div>
                <div className="mb-3">
                  <textarea
                    ref={textAreaRef}
                    rows={1}
                    placeholder="Напишите текст..."
                    className="w-full rounded-[12px] border border-[#2B2B2B] bg-[#111111] p-4 text-[16px] leading-[1.4em] text-white outline-none resize-none"
                    value={createText}
                    onChange={(e) => setCreateText(e.target.value)}
                    style={{ minHeight: 'var(--create-editor-min-height)' }}
                  />
                  {createImages.length > 0 && (
                    <div className="mt-2 flex w-full items-center gap-[var(--create-gallery-gap)] overflow-x-auto" style={{ height: 'var(--create-preview-row-height)' }}>
                      {createImages.map((src, idx) => (
                        <img
                          key={`${src}-preview-${idx}`}
                          src={src}
                          alt="preview"
                          className="rounded-[12px] object-cover"
                          style={{ height: 'var(--create-preview-row-height)', width: 'calc(var(--create-preview-row-height) * 1.2)' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex w-full items-center justify-between" style={{ marginTop: 'var(--create-actions-margin-top)' }}>
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
                    className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#2B2B2B] bg-[#111111]"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Добавить фото"
                  >
                    <img
                      src="/interface/paperclip.svg"
                      alt="attach"
                      className="h-[20px] w-[20px]"
                      style={{ filter: 'invert(1) brightness(2)' }}
                    />
                  </button>
                  <button
                    type="button"
                    className="h-[44px] grow rounded-[12px] bg-[#222222] text-center ml-3"
                  >
                    <span className="inline-block text-[16px] leading-[1.25em] text-white font-vk-demi">
                      Опубликовать
                    </span>
                  </button>
                </div>
                <div className="mt-3 flex-1 overflow-hidden border-t border-[#2B2B2B] pt-3">
                  <div className="flex w-full items-center justify-between px-[var(--create-gallery-padding)] pb-2">
                    <button
                      type="button"
                      className="flex h-[34px] items-center gap-2 rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-3"
                      onClick={openGalleryPicker}
                    >
                      <img
                        src="/interface/paperclip.svg"
                        alt="pick"
                        className="h-[18px] w-[18px]"
                        style={{ filter: 'invert(1) brightness(2)' }}
                      />
                      <span className="text-[14px] leading-[1.3em] text-white">Настроить</span>
                    </button>
                  </div>
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
                          style={{ border: selected ? '2px solid #FFD900' : '1px solid #2B2B2B' }}
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
      </div>
    </div>
  )
}
