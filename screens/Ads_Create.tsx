'use client'

import { useEffect, useRef, useState } from 'react'

type AdsCategory = 'nicotine' | 'job' | 'service' | 'things' | 'other'
type AdsCondition = 'new' | 'excellent' | 'good' | 'bad'
type AdsCreateStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export default function AdsCreate({
  onClose,
}: {
  onClose: () => void
}) {
  const [scale, setScale] = useState(1)
  const [step, setStep] = useState<AdsCreateStep>(1)
  const [category, setCategory] = useState<AdsCategory | null>(null)
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [title, setTitle] = useState('')
  const [condition, setCondition] = useState<AdsCondition | null>(null)
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')

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

  const handlePickedFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      const urls = await readFilesAsDataUrls(Array.from(files))
      setImages((prev) => {
        const next = [...prev]
        for (const u of urls) {
          if (!next.includes(u)) next.push(u)
        }
        return next
      })
    } catch {
    }
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const canGoNext =
    (step === 1 && category !== null) ||
    step === 2 ||
    (step === 3 && title.trim().length > 0) ||
    (step === 4 && condition !== null) ||
    step === 5 ||
    (step === 6 && description.trim().length > 0) ||
    (step === 7 && price.trim().length > 0)

  const goNext = () => {
    if (!canGoNext) return
    if (step < 7) {
      setStep((s) => (s < 7 ? ((s + 1) as AdsCreateStep) : s))
      return
    }
    onClose()
  }

  const goBack = () => {
    if (step === 1) {
      onClose()
      return
    }
    setStep((s) => (s > 1 ? ((s - 1) as AdsCreateStep) : s))
  }

  const stepTitle = (() => {
    if (step === 1) return 'Тип обьявления'
    if (step === 2) return 'Внешний вид'
    if (step === 3) return 'Укажите название'
    if (step === 4) return 'Состояние'
    if (step === 5) return 'Характеристики'
    if (step === 6) return 'Заполните описание'
    return 'Цена'
  })()

  const primaryButtonLabel = step === 7 ? 'Опубликовать' : 'Продолжить'

  return (
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden" style={{ height: '100dvh' }}>
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px]" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={goBack}
              className="absolute left-6 top-0 flex h-full items-center"
              aria-label={step === 1 ? 'Закрыть' : 'Назад'}
            >
              {step === 1 ? (
                <img
                  src="/interface/x-01.svg"
                  alt="close"
                  className="h-[22px] w-[22px]"
                  style={{ filter: 'invert(1) brightness(1.6)' }}
                />
              ) : (
                <img
                  src="/interface/str.svg"
                  alt="back"
                  className="h-[22px] w-[22px]"
                  style={{ filter: 'invert(1) brightness(1.4)' }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-0 flex h-full items-center"
              aria-label="Закрыть"
            >
              <img
                src="/interface/x-01.svg"
                alt="close"
                className="h-[22px] w-[22px]"
                style={{ filter: 'invert(1) brightness(1.6)' }}
              />
            </button>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center">
              <div className="text-[24px] font-bold leading-[1em] text-white font-ttc-bold">
                {stepTitle}
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 w-full px-6 overflow-y-auto pb-6"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
            height: 'calc(812px - 56px - 88px - var(--home-header-offset))',
          }}
        >
          {step === 1 && (
            <div className="pt-6">
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory('nicotine')}
                  className="flex w-full items-center rounded-[10px] border px-4 py-3"
                  style={{
                    borderColor: category === 'nicotine' ? '#6EBC3D' : '#2B2B2B',
                    background:
                      category === 'nicotine'
                        ? 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)'
                        : '#111111',
                  }}
                >
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1C]" />
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-light">
                    Никотиновые устройства
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('job')}
                  className="flex w-full items-center rounded-[10px] border px-4 py-3"
                  style={{
                    borderColor: category === 'job' ? '#6EBC3D' : '#2B2B2B',
                    background:
                      category === 'job'
                        ? 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)'
                        : '#111111',
                  }}
                >
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1C]" />
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-light">
                    Работа
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('service')}
                  className="flex w-full items-center rounded-[10px] border px-4 py-3"
                  style={{
                    borderColor: category === 'service' ? '#6EBC3D' : '#2B2B2B',
                    background:
                      category === 'service'
                        ? 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)'
                        : '#111111',
                  }}
                >
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1C]" />
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-light">
                    Услуги
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('things')}
                  className="flex w-full items-center rounded-[10px] border px-4 py-3"
                  style={{
                    borderColor: category === 'things' ? '#6EBC3D' : '#2B2B2B',
                    background:
                      category === 'things'
                        ? 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)'
                        : '#111111',
                  }}
                >
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1C]" />
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-light">
                    Вещи, электроника
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('other')}
                  className="flex w-full items-center rounded-[10px] border px-4 py-3"
                  style={{
                    borderColor: category === 'other' ? '#6EBC3D' : '#2B2B2B',
                    background:
                      category === 'other'
                        ? 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)'
                        : '#111111',
                  }}
                >
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1C]" />
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-light">
                    Другое
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="pt-6">
              <div className="mb-4 text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                Добавьте несколько фото товара. Первое фото будет обложкой.
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const src = images[idx]
                  return (
                    <div
                      key={idx}
                      className="relative overflow-hidden rounded-[15px] bg-[#111111] border border-[#2B2B2B]"
                      style={{ aspectRatio: '1 / 1' }}
                    >
                      {src ? (
                        <img src={src} alt="preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-[#1C1C1C]" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePickedFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="flex w-full items-center justify-center rounded-[10px] bg-[#111111]"
                  style={{ height: 48 }}
                >
                  <span className="text-[16px] leading-[1.25em] text-white font-vk-demi">
                    Добавить фото
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="pt-6">
              <div className="mb-3 text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                Укажите короткое и понятное название объявления.
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название объявления"
                className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
              />
            </div>
          )}

          {step === 4 && (
            <div className="pt-6 space-y-3">
              <button
                type="button"
                onClick={() => setCondition('new')}
                className="flex w-full items-start justify-between rounded-[12px] border px-4 py-3 bg-[#111111]"
                style={{ borderColor: condition === 'new' ? '#6EBC3D' : '#2B2B2B' }}
              >
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-medium">
                    Новое
                  </span>
                  <span className="text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                    Есть чек, сохранена оригинальная упаковка
                  </span>
                </div>
                <div className="flex h-[24px] w-[24px] items-center justify-center">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '2px solid #6EBC3D',
                    }}
                  >
                    {condition === 'new' && (
                      <div
                        className="rounded-full"
                        style={{ width: 12, height: 12, backgroundColor: '#FFFFFF' }}
                      />
                    )}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCondition('excellent')}
                className="flex w-full items-start justify-between rounded-[12px] border px-4 py-3 bg-[#111111]"
                style={{ borderColor: condition === 'excellent' ? '#6EBC3D' : '#2B2B2B' }}
              >
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-medium">
                    Отличное
                  </span>
                  <span className="text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                    Целостность товара сохранена, нет дефектов
                  </span>
                </div>
                <div className="flex h-[24px] w-[24px] items-center justify-center">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '2px solid #6EBC3D',
                    }}
                  >
                    {condition === 'excellent' && (
                      <div
                        className="rounded-full"
                        style={{ width: 12, height: 12, backgroundColor: '#FFFFFF' }}
                      />
                    )}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCondition('good')}
                className="flex w-full items-start justify-between rounded-[12px] border px-4 py-3 bg-[#111111]"
                style={{ borderColor: condition === 'good' ? '#6EBC3D' : '#2B2B2B' }}
              >
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-medium">
                    Хорошее
                  </span>
                  <span className="text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                    Есть небольшие дефекты, потёртости и т.п
                  </span>
                </div>
                <div className="flex h-[24px] w-[24px] items-center justify-center">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '2px solid #6EBC3D',
                    }}
                  >
                    {condition === 'good' && (
                      <div
                        className="rounded-full"
                        style={{ width: 12, height: 12, backgroundColor: '#FFFFFF' }}
                      />
                    )}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCondition('bad')}
                className="flex w-full items-start justify-between rounded-[12px] border px-4 py-3 bg-[#111111]"
                style={{ borderColor: condition === 'bad' ? '#6EBC3D' : '#2B2B2B' }}
              >
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-[16px] leading-[1.4em] text-white font-sf-ui-medium">
                    Не очень
                  </span>
                  <span className="text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                    Есть видимые дефекты, неисправности
                  </span>
                </div>
                <div className="flex h-[24px] w-[24px] items-center justify-center">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '2px solid #6EBC3D',
                    }}
                  >
                    {condition === 'bad' && (
                      <div
                        className="rounded-full"
                        style={{ width: 12, height: 12, backgroundColor: '#FFFFFF' }}
                      />
                    )}
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="pt-6 space-y-4">
              <div>
                <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                  Бренд/Производитель
                </div>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Например, Apple, Sony"
                  className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                />
              </div>
              <div>
                <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                  Цвет
                </div>
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Черный, белый, синий"
                  className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="pt-6">
              <div className="mb-3 text-[14px] leading-[1.4em] text-white font-sf-ui-light">
                Описание отражает сам товар. Старайтесь описать возможности, пожелания по использованию и т.п
              </div>
              <div className="mb-3 text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                Убедите пользователя приобрести ваш товар
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Расскажите подробнее о товаре"
                className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
              />
            </div>
          )}

          {step === 7 && (
            <div className="pt-6 space-y-4">
              <div>
                <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                  Цена
                </div>
                <div className="relative w-full">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-4 pr-10 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                    ₽
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="absolute left-0 w-full bg-[#0A0A0A] px-6"
          style={{ height: '88px', bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--nav-bottom-offset))' }}
        >
          <div className="absolute -top-[0.5px] left-0 w-full" style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex h-full w-full items-center">
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="flex w-full items-center justify-center rounded-[10px] bg-[#111111]"
              style={{ height: 52, opacity: canGoNext ? 1 : 0.5 }}
            >
              <span className="text-[18px] font-semibold leading-[1.25em] tracking-[0.015em] text-white font-vk-demi">
                {primaryButtonLabel}
              </span>
            </button>
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

