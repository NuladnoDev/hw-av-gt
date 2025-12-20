'use client'

import { useEffect, useRef, useState } from 'react'

export default function PostCreate({
  onClose,
}: {
  onClose: () => void
}) {
  const [createText, setCreateText] = useState('')
  const [createImages, setCreateImages] = useState<string[]>([])
  const [allGalleryImages, setAllGalleryImages] = useState<string[]>([])
  const [galleryVisibleCount, setGalleryVisibleCount] = useState(15)
  const [slideIn, setSlideIn] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  const readFilesAsDataUrls = (files: File[]) =>
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(new Error('read_failed'))
            reader.readAsDataURL(file)
          }),
      ),
    )

  const addPickedImages = (urls: string[]) => {
    if (urls.length === 0) return
    setCreateImages((prev) => {
      const next = [...prev]
      for (const u of urls) {
        if (!next.includes(u)) next.push(u)
      }
      return next
    })
    setAllGalleryImages((prev) => {
      const next = [...prev]
      for (const u of urls) {
        if (!next.includes(u)) next.push(u)
      }
      try {
        window.localStorage.setItem('hw-gallery', JSON.stringify(next))
      } catch {}
      setGalleryVisibleCount((c) => Math.min(next.length, Math.max(c, 15)))
      return next
    })
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
        const urls = await readFilesAsDataUrls(files)
        addPickedImages(urls)
      } catch {}
    } else {
      fileInputRef.current?.click()
    }
  }

  const handlePickedFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      const urls = await readFilesAsDataUrls(Array.from(files))
      addPickedImages(urls)
    } catch {}
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

  const onGalleryScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      setGalleryVisibleCount((c) => Math.min(c + 15, allGalleryImages.length))
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('hw-gallery')
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      if (Array.isArray(arr) && arr.length > 0) {
        setAllGalleryImages(arr)
        setGalleryVisibleCount(Math.min(15, arr.length))
      }
    } catch {}
  }, [])

  useEffect(() => {
    const body = document.body
    const scrollY = window.scrollY
    const prevOverflow = body.style.overflow
    const prevPosition = body.style.position
    const prevTop = body.style.top
    const prevWidth = body.style.width
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    return () => {
      body.style.overflow = prevOverflow
      body.style.position = prevPosition
      body.style.top = prevTop
      body.style.width = prevWidth
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    setSlideIn(true)
  }, [])

  useEffect(() => {
    const el = textAreaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [createText, createImages.length])

  const hasContent = createText.trim().length > 0 || createImages.length > 0

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ height: '100dvh' }}>
      <div
        className="flex h-full w-full flex-col"
        style={{
          backgroundColor: '#0A0A0A',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: slideIn ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 260ms ease-out',
        }}
      >
        <div className="relative flex h-[56px] items-center justify-between px-6">
          <button type="button" onClick={onClose} className="flex h-full items-center" style={{ marginTop: 'var(--create-header-left-icon-margin-top, var(--create-header-icons-margin-top))' }} aria-label="Закрыть">
            <img
              src="/interface/x-01.svg"
              alt="close"
              className="h-[var(--create-header-left-icon-size)] w-[var(--create-header-left-icon-size)]"
              style={{ filter: 'invert(1) brightness(1.6)' }}
            />
          </button>
          <div className="absolute left-1/2 top-0 flex h-full -translate-x-1/2 items-center gap-2" style={{ marginTop: 'var(--create-header-title-margin-top)', marginLeft: 'var(--create-header-title-margin-left)' }}>
            <span className="leading-[1em] text-white font-ttc-demibold" style={{ fontFamily: 'var(--create-header-title-font)', fontSize: 'var(--create-header-title-size)' }}>
              Новый пост
            </span>
          </div>
          <button
            type="button"
            className="flex h-full items-center"
            style={{
              marginTop: 'var(--create-header-right-icon-margin-top, var(--create-header-icons-margin-top))',
            }}
            aria-label="Далее"
          >
            <span
              className="font-sf-ui-light"
              style={{
                fontSize: 16,
                lineHeight: '18px',
                color: '#FFFFFF',
                opacity: hasContent ? 1 : 0.4,
              }}
            >
              Далее
            </span>
          </button>
        </div>

        <div className="w-full" style={{ height: '0.3px', background: 'rgba(255,255,255,0.06)', marginTop: 'var(--create-header-divider-gap)' }} />

        <div className="flex-1 overflow-hidden">
          <div
            className="w-full"
            style={{
              paddingLeft: 'var(--create-editor-padding-left)',
              paddingRight: 'var(--create-editor-padding-right)',
              marginTop: 'var(--create-editor-top-gap)',
            }}
          >
            <textarea
              ref={textAreaRef}
              inputMode="text"
              rows={1}
              placeholder="Напиши что-нибудь..."
              className="create-textarea w-full resize-none bg-transparent leading-[1.4em] text-white outline-none font-sf-ui-light"
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
            {createImages.length > 0 && (
              <div className="mt-3 w-full">
                <div
                  className="w-full grid gap-2"
                  style={{ gridTemplateColumns: createImages.length === 1 ? '1fr' : '1fr 1fr' }}
                >
                  {createImages.slice(0, Math.min(2, createImages.length)).map((src, idx) => (
                    <div
                      key={`${src}-big-${idx}`}
                      className="relative overflow-hidden rounded-[12px] border border-[#2B2B2B]"
                      style={
                        createImages.length === 1
                          ? { height: 'var(--create-attachments-single-height)' }
                          : { aspectRatio: 'var(--create-attachments-pair-aspect)' }
                      }
                    >
                      <img src={src} alt="preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeCreateImage(src)}
                        className="absolute right-2 top-2 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#111111]/80"
                        aria-label="Удалить"
                      >
                        <img
                          src="/interface/x-01.svg"
                          alt="remove"
                          className="h-[18px] w-[18px]"
                          style={{ filter: 'invert(1) brightness(1.6)' }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                {createImages.length > 2 && (
                  <div className="mt-2 flex w-full items-center gap-2 overflow-x-auto">
                    {createImages.slice(2).map((src, idx) => (
                      <div
                        key={`${src}-thumb-${idx}`}
                        className="relative overflow-hidden rounded-[10px] border border-[#2B2B2B]"
                        style={{
                          height: 'var(--create-thumb-height)',
                          aspectRatio: 'var(--create-thumb-aspect)',
                          flex: '0 0 auto',
                        }}
                      >
                        <img src={src} alt="preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeCreateImage(src)}
                          className="absolute right-1.5 top-1.5 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#111111]/80"
                          aria-label="Удалить"
                        >
                          <img
                            src="/interface/x-01.svg"
                            alt="remove"
                            className="h-[14px] w-[14px]"
                            style={{ filter: 'invert(1) brightness(1.6)' }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 pt-3">
            <div className="mt-3 flex w-full items-center justify-between" style={{ gap: 'var(--create-actions-row-gap)' }}>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePickedFiles(e.target.files)} />
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePickedFiles(e.target.files)} />

              <button
                type="button"
                onClick={openGalleryPicker}
                className="flex items-center gap-2 rounded-[var(--create-actions-button-radius)] border border-[#2B2B2B] bg-[#111111] px-3"
                style={{ marginLeft: 'var(--create-actions-left-offset)', height: 'var(--create-actions-button-height)', minWidth: 'var(--create-time-button-min-width)' }}
              >
                <img src="/interface/add image.svg" alt="restricted" className="h-[var(--create-action-icon-size)] w-[var(--create-action-icon-size)]" />
                <span className="text-[14px] leading-[1.3em] text-[#A1A1A1]">Фото/Видео</span>
              </button>
            </div>
          </div>

          <div
            className="mt-3 w-full pt-3"
            style={{
              borderTop: '0.3px solid rgba(255, 255, 255, 0.06)',
              height: 'var(--create-gallery-zone-height)',
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
            }}
            onScroll={onGalleryScroll}
          >
            <div
              className="grid w-full px-[var(--create-gallery-padding)]"
              style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 'var(--create-gallery-item-size)', gap: 'var(--create-gallery-gap)' }}
            >
              <button type="button" className="flex items-center justify-center rounded-[12px] border border-[#2B2B2B] bg-[#111111]" onClick={openGalleryPicker}>
                <img src="/interface/paperclip.svg" alt="camera" className="h-[22px] w-[22px]" style={{ filter: 'invert(1) brightness(2)' }} />
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
    </div>
  )
}
