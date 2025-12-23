'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Smartphone,
  Wrench,
  Cigarette,
  Briefcase,
  Ellipsis,
  Plus,
  X,
  Sparkles,
  Star,
  ThumbsUp,
  CircleAlert,
} from 'lucide-react'

type AdsCategory = 'nicotine' | 'job' | 'service' | 'things' | 'other'
type AdsCondition = 'new' | 'excellent' | 'good' | 'bad'
type AdsCreateStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

const CATEGORY_CONFIGS: {
  id: AdsCategory
  label: string
  color: string
  icon: React.ReactNode
}[] = [
  {
    id: 'things',
    label: 'Вещи, электроника',
    color: '#3b82f6',
    icon: <Smartphone size={32} strokeWidth={1.5} />,
  },
  {
    id: 'service',
    label: 'Услуги',
    color: '#8b5cf6',
    icon: <Wrench size={32} strokeWidth={1.5} />,
  },
  {
    id: 'nicotine',
    label: 'Никотиновые устройства',
    color: '#f59e0b',
    icon: <Cigarette size={32} strokeWidth={1.5} />,
  },
  {
    id: 'job',
    label: 'Работа',
    color: '#10b981',
    icon: <Briefcase size={32} strokeWidth={1.5} />,
  },
  {
    id: 'other',
    label: 'Другое',
    color: '#ec4899',
    icon: <Ellipsis size={32} strokeWidth={1.5} />,
  },
]

const CONDITION_OPTIONS: {
  id: AdsCondition
  label: string
  description: string
  icon: React.ReactNode
  color: string
}[] = [
  {
    id: 'new',
    label: 'Новое',
    description: 'Есть чек, сохранена оригинальная упаковка',
    icon: <Sparkles size={24} />,
    color: '#4CAF50',
  },
  {
    id: 'excellent',
    label: 'Отличное',
    description: 'Целостность товара сохранена, нет дефектов',
    icon: <Star size={24} />,
    color: '#2196F3',
  },
  {
    id: 'good',
    label: 'Хорошее',
    description: 'Есть небольшие дефекты, потёртости и т.п',
    icon: <ThumbsUp size={24} />,
    color: '#FF9800',
  },
  {
    id: 'bad',
    label: 'Не очень',
    description: 'Есть видимые дефекты, неисправности',
    icon: <CircleAlert size={24} />,
    color: '#F44336',
  },
]

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
  const [previewImage, setPreviewImage] = useState<string | null>(null)

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
      const maxPhotos = 6
      setImages((prev) => {
        const next = [...prev]
        for (const u of urls) {
          if (!next.includes(u) && next.length < maxPhotos) next.push(u)
        }
        return next
      })
    } catch {
    }
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const removeImageAt = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
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

  const primaryButtonLabel = step === 7 ? 'Опубликовать' : 'Продолжить'

  return (
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden" style={{ height: '100dvh' }}>
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
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
                <svg
                  width="27"
                  height="21"
                  viewBox="0 0 27 21"
                  className="block"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M11.5 4L4 10.5L11.5 17"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 10.5H23"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          className="absolute left-0 w-full px-6 overflow-y-auto pb-6"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
            height: 'calc(812px - 56px - 88px - var(--home-header-offset))',
          }}
        >
          <div
            key={step}
            className={step === 1 ? 'ads-step-slide-up' : 'ads-step-slide-left'}
          >
            {step === 1 && (
              <div className="pt-8">
                <div className="mb-12">
                  <div className="mb-2 text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Тип объявления
                  </div>
                  <div className="text-[14px] leading-[1.4em] text-white/40 font-sf-ui-light">
                    Выберите подходящую категорию
                  </div>
                </div>
                <div className="flex flex-col">
                  {CATEGORY_CONFIGS.map((cfg, index) => {
                    const selected = category === cfg.id
                    return (
                      <button
                        key={cfg.id}
                        type="button"
                        onClick={() => setCategory(cfg.id)}
                        className={`group relative w-full overflow-hidden transition-all duration-500 ease-out ${
                          selected ? 'py-4' : 'py-3 hover:py-3.5'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div
                          className={`absolute inset-0 transition-all duration-500 ${
                            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                          }`}
                          style={{
                            background: `linear-gradient(90deg, ${cfg.color}40 0%, ${cfg.color}10 100%)`,
                          }}
                        />
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 ${
                            selected ? 'opacity-100 w-1.5' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          style={{ background: cfg.color }}
                        />
                        <div className="relative flex items-center gap-6 px-4">
                          <div
                            className={`flex items-center justify-center transition-all duration-500 ${
                              selected ? 'h-16 w-16' : 'h-12 w-12 group-hover:h-14 group-hover:w-14'
                            }`}
                            style={{ color: cfg.color }}
                          >
                            {cfg.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div
                              className={`transition-all duration-300 ${
                                selected ? 'text-white text-[17px]' : 'text-white/70 group-hover:text-white'
                              }`}
                            >
                              {cfg.label}
                            </div>
                          </div>
                          <div
                            className={`transition-all duration-300 ${
                              selected
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0'
                            }`}
                            style={{ color: cfg.color }}
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="pt-8">
                <div className="mb-12">
                  <div className="mb-2 text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Внешний вид
                  </div>
                  <div className="text-[14px] leading-[1.4em] text-white/40 font-sf-ui-light">
                    Первое фото будет обложкой объявления
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {images.map((src, index) => (
                    <div key={src} className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: '1 / 1' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewImage(src)}
                        className="block h-full w-full active:opacity-80 transition-opacity"
                      >
                        <img src={src} alt="preview" className="h-full w-full object-cover" />
                      </button>
                      {index === 0 && (
                        <div className="absolute left-3 top-3 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm pointer-events-none">
                          <span className="text-xs text-white font-sf-ui-light">
                            Обложка
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImageAt(index)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 shadow-lg backdrop-blur-sm active:scale-90 transition-transform"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 6 && (
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="group relative w-full aspect-square rounded-2xl border-2 border-dashed border-white/20 bg-white/5 active:scale-95 active:bg-white/10 transition-all duration-300"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition-all duration-300">
                          <Plus size={24} className="text-white/60" />
                        </div>
                        <span className="text-sm text-white/60 font-sf-ui-light">
                          Добавить фото
                        </span>
                      </div>
                    </button>
                  )}
                </div>
                <div className="mt-6 text-center">
                  <span className="text-[14px] leading-[1.4em] text-white/40 font-sf-ui-light">
                    {images.length} / 6 фото
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePickedFiles(e.target.files)}
                />
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
              <div className="pt-8">
                <div className="mb-12">
                  <div className="text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Состояние
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {CONDITION_OPTIONS.map((opt) => {
                    const selected = condition === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCondition(opt.id)}
                        className="w-full rounded-2xl bg-white/0 py-6 px-6 text-left transition-all duration-300 group hover:bg-white/5 active:bg-white/10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: `${opt.color}26`,
                              color: opt.color,
                            }}
                          >
                            {opt.icon}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 text-[20px] text-white font-sf-ui-light">
                              {opt.label}
                            </div>
                            <div className="text-[16px] leading-[20px] text-white/60 font-sf-ui-light">
                              {opt.description}
                            </div>
                          </div>
                          <div className="mt-1 flex-shrink-0">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                selected
                                  ? 'border-white bg-white'
                                  : 'border-white/30 group-hover:border-white/50'
                              }`}
                            >
                              {selected && (
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#0A0A0A' }} />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
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
        {previewImage && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md px-6"
            onClick={() => setPreviewImage(null)}
          >
            <button
              type="button"
              className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200"
              onClick={() => setPreviewImage(null)}
            >
              <X size={24} className="text-white" />
            </button>
            <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <img
                src={previewImage}
                alt="preview"
                className="h-auto max-h-[80vh] w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
