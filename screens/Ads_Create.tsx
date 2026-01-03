'use client'

import { useEffect, useRef, useState } from 'react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
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

  const [nicotineFormat, setNicotineFormat] = useState('')
  const [nicotineTankVolume, setNicotineTankVolume] = useState('')
  const [nicotineBatteryCapacity, setNicotineBatteryCapacity] = useState('')
  const [nicotineStrength, setNicotineStrength] = useState('')
  const [nicotinePuffs, setNicotinePuffs] = useState('')
  const [nicotineFlavor, setNicotineFlavor] = useState('')

  const [thingsModel, setThingsModel] = useState('')
  const [thingsMemory, setThingsMemory] = useState('')
  const [thingsDiagonal, setThingsDiagonal] = useState('')
  const [thingsYear, setThingsYear] = useState('')
  const [thingsWarranty, setThingsWarranty] = useState('')
  const [thingsKit, setThingsKit] = useState('')

  const [serviceType, setServiceType] = useState('')
  const [serviceExperience, setServiceExperience] = useState('')
  const [serviceFormat, setServiceFormat] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceRegion, setServiceRegion] = useState('')

  const [jobPosition, setJobPosition] = useState('')
  const [jobEmploymentType, setJobEmploymentType] = useState('')
  const [jobSchedule, setJobSchedule] = useState('')
  const [jobFormat, setJobFormat] = useState('')
  const [jobSalary, setJobSalary] = useState('')
  const [jobExperience, setJobExperience] = useState('')

  const [otherType, setOtherType] = useState('')
  const [otherDetails, setOtherDetails] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishPhase, setPublishPhase] = useState<'idle' | 'running' | 'full'>('idle')

  const getConditionLabel = (c: AdsCondition | null) => {
    const found = CONDITION_OPTIONS.find((o) => o.id === c)
    return found?.label ?? null
  }

  const publishAd = async (): Promise<boolean> => {
    const titleTrim = title.trim()
    const priceTrim = price.trim()
    if (titleTrim.length === 0 || priceTrim.length === 0) return false
    if (images.length === 0) return false

    const imageUrl = JSON.stringify(images)
    if (!imageUrl) return false

    let uid: string | null = null
    let userTag: string | null = null
    let location: string | null = null

    try {
      const auth = await loadLocalAuth()
      uid = auth?.uid ?? null
      userTag = auth?.tag ?? null
    } catch {
      uid = null
      userTag = null
    }

    try {
      if (typeof window !== 'undefined' && uid) {
        const profRaw = window.localStorage.getItem('hw-profiles')
        if (profRaw) {
          const profMap = JSON.parse(profRaw) as Record<string, { city?: string }>
          const p = profMap[uid]
          if (p && typeof p.city === 'string' && p.city.trim().length > 0) {
            location = p.city.trim()
          }
        }
      }
    } catch {
      location = null
    }

    const conditionLabel = getConditionLabel(condition)
    const client = getSupabase()
    if (!client) return false

    try {
      const { data, error } = await client
        .from('ads')
        .insert({
          user_id: uid,
          user_tag: userTag,
          title: titleTrim,
          price: priceTrim,
          image_url: imageUrl,
          condition: conditionLabel,
          location,
          category,
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (error) {
        if (typeof window !== 'undefined') {
          console.error('publish_ad_supabase_error', error)
        }
        return false
      }

      if (typeof window !== 'undefined') {
        const ev = new CustomEvent('ads-updated', { detail: { type: 'created', row: data } })
        window.dispatchEvent(ev)
      }
      return true
    } catch (e) {
      if (typeof window !== 'undefined') {
        console.error('failed_to_publish_ad', e)
      }
      return false
    }
  }

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
    (step === 2 && images.length > 0) ||
    (step === 3 && title.trim().length > 0) ||
    (step === 4 && condition !== null) ||
    step === 5 ||
    (step === 6 && description.trim().length > 0) ||
    (step === 7 && price.trim().length > 0 && images.length > 0)

  const goNext = async () => {
    if (!canGoNext || publishing) return
    if (step < 7) {
      setStep((s) => (s < 7 ? ((s + 1) as AdsCreateStep) : s))
      return
    }
    const minDuration = 3500
    setPublishing(true)
    setPublishPhase('running')
    const startedAt = Date.now()
    let phaseTimer: number | undefined
    if (typeof window !== 'undefined') {
      phaseTimer = window.setTimeout(() => {
        setPublishPhase('full')
      }, minDuration)
    }
    const ok = await publishAd()
    const finish = () => {
      if (typeof window !== 'undefined' && phaseTimer !== undefined) {
        window.clearTimeout(phaseTimer)
      }
      setPublishing(false)
      setPublishPhase('idle')
      if (ok) {
        onClose()
      }
    }
    const elapsed = Date.now() - startedAt
    if (elapsed >= minDuration) {
      finish()
    } else if (typeof window !== 'undefined') {
      window.setTimeout(finish, minDuration - elapsed)
    } else {
      finish()
    }
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
              <div className="pt-2">
                <div className="mb-4">
                  <div className="text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Внешний вид
                  </div>
                  <div className="mt-1 text-[14px] leading-[1.4em] text-white/40 font-sf-ui-light">
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
              <div className="pt-2">
                <div className="mb-4">
                  <div className="text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Название товара
                  </div>
                </div>
                <div className="mb-4 text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                  Укажите короткое и понятное название вашего товара.
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название товара"
                  className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                />
              </div>
            )}

            {step === 4 && (
              <div className="pt-2">
                <div className="mb-4">
                  <div className="text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Состояние
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {CONDITION_OPTIONS.map((opt) => {
                    const selected = condition === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCondition(opt.id)}
                        className="w-full rounded-2xl bg-white/0 py-4 px-5 text-left transition-all duration-300 group hover:bg-white/5 active:bg-white/10"
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
              <div className="pt-2">
                <div className="mb-4">
                  <div className="text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Характеристики
                  </div>
                </div>
                <div className="space-y-4">
                  {category === 'nicotine' && (
                    <>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Бренд/Производитель
                        </div>
                        <input
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="HQD, Elf Bar и др."
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Тип устройства
                        </div>
                        <input
                          value={nicotineFormat}
                          onChange={(e) => setNicotineFormat(e.target.value)}
                          placeholder="Одноразовое, pod-система, мод"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Объем жидкости (мл)
                        </div>
                        <input
                          value={nicotineTankVolume}
                          onChange={(e) => setNicotineTankVolume(e.target.value)}
                          placeholder="2, 5, 10"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Емкость аккумулятора (mAh)
                        </div>
                        <input
                          value={nicotineBatteryCapacity}
                          onChange={(e) => setNicotineBatteryCapacity(e.target.value)}
                          placeholder="400, 850, 1500"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Крепость никотина (мг/мл)
                        </div>
                        <input
                          value={nicotineStrength}
                          onChange={(e) => setNicotineStrength(e.target.value)}
                          placeholder="20, 35, 50"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Количество затяжек
                        </div>
                        <input
                          value={nicotinePuffs}
                          onChange={(e) => setNicotinePuffs(e.target.value)}
                          placeholder="800, 1500, 2500"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Вкус
                        </div>
                        <input
                          value={nicotineFlavor}
                          onChange={(e) => setNicotineFlavor(e.target.value)}
                          placeholder="Манго, ягодный микс, кола"
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
                          placeholder="Черный, градиент и др."
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                    </>
                  )}

                  {category === 'things' && (
                    <>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Бренд/Производитель
                        </div>
                        <input
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="Apple, Samsung, Sony"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Модель
                        </div>
                        <input
                          value={thingsModel}
                          onChange={(e) => setThingsModel(e.target.value)}
                          placeholder="iPhone 13, PlayStation 5"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Память/объем хранилища
                        </div>
                        <input
                          value={thingsMemory}
                          onChange={(e) => setThingsMemory(e.target.value)}
                          placeholder="128 ГБ, 512 ГБ"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Диагональ/размер
                        </div>
                        <input
                          value={thingsDiagonal}
                          onChange={(e) => setThingsDiagonal(e.target.value)}
                          placeholder='6.1", 55"'
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Год выпуска
                        </div>
                        <input
                          value={thingsYear}
                          onChange={(e) => setThingsYear(e.target.value)}
                          placeholder="2020, 2021"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Комплектация
                        </div>
                        <input
                          value={thingsKit}
                          onChange={(e) => setThingsKit(e.target.value)}
                          placeholder="Коробка, зарядка, документы"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Гарантия
                        </div>
                        <input
                          value={thingsWarranty}
                          onChange={(e) => setThingsWarranty(e.target.value)}
                          placeholder="Осталось 6 месяцев, без гарантии"
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
                          placeholder="Черный, белый, серебристый"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                    </>
                  )}

                  {category === 'service' && (
                    <>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Вид услуги
                        </div>
                        <input
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          placeholder="Маникюр, репетитор, доставка и др."
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Опыт работы
                        </div>
                        <input
                          value={serviceExperience}
                          onChange={(e) => setServiceExperience(e.target.value)}
                          placeholder="Без опыта, 3 года и т.п."
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Формат работы
                        </div>
                        <input
                          value={serviceFormat}
                          onChange={(e) => setServiceFormat(e.target.value)}
                          placeholder="Выезд, у себя, онлайн"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Стоимость
                        </div>
                        <input
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          placeholder="1500 ₽/час, по договоренности"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Регион/район
                        </div>
                        <input
                          value={serviceRegion}
                          onChange={(e) => setServiceRegion(e.target.value)}
                          placeholder="Город, район, метро"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                    </>
                  )}

                  {category === 'job' && (
                    <>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Должность
                        </div>
                        <input
                          value={jobPosition}
                          onChange={(e) => setJobPosition(e.target.value)}
                          placeholder="Официант, бариста, SMM-специалист"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Уровень занятости
                        </div>
                        <input
                          value={jobEmploymentType}
                          onChange={(e) => setJobEmploymentType(e.target.value)}
                          placeholder="Полная, частичная, подработка"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          График
                        </div>
                        <input
                          value={jobSchedule}
                          onChange={(e) => setJobSchedule(e.target.value)}
                          placeholder="5/2, 2/2, смены"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Формат работы
                        </div>
                        <input
                          value={jobFormat}
                          onChange={(e) => setJobFormat(e.target.value)}
                          placeholder="Офис, удалёнка, гибрид"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Зарплата
                        </div>
                        <input
                          value={jobSalary}
                          onChange={(e) => setJobSalary(e.target.value)}
                          placeholder="от 40 000 ₽"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Требуемый опыт
                        </div>
                        <input
                          value={jobExperience}
                          onChange={(e) => setJobExperience(e.target.value)}
                          placeholder="Без опыта, 1 год и т.п."
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                    </>
                  )}

                  {category === 'other' && (
                    <>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Тип товара
                        </div>
                        <input
                          value={otherType}
                          onChange={(e) => setOtherType(e.target.value)}
                          placeholder="Что за товар или объект"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Бренд/Производитель
                        </div>
                        <input
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="При наличии бренда"
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
                          placeholder="Основной цвет товара"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Дополнительные характеристики
                        </div>
                        <input
                          value={otherDetails}
                          onChange={(e) => setOtherDetails(e.target.value)}
                          placeholder="Размер, материал, особенности"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="pt-2">
                <div className="mb-4">
                  <div className="text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Описание
                  </div>
                </div>
                <div className="mb-3 text-[14px] leading-[1.4em] text-white font-sf-ui-light">
                  Описание товара
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите о товаре: его особенности, история покупки, причина продажи..."
                  className="h-[160px] w-full resize-none rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                />
              </div>
            )}

            {step === 7 && (
              <div className="pt-2">
                <div className="mb-4">
                  <div className="text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    Цена
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                      Стоимость
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
              disabled={!canGoNext || publishing}
              className="flex w-full items-center justify-center rounded-[10px] bg-[#111111]"
              style={{ height: 52, opacity: canGoNext && !publishing ? 1 : 0.5 }}
            >
              {step === 7 && publishing ? (
                <div className="relative w-full max-w-[240px] h-[6px] rounded-full bg-white/10 overflow-hidden">
                  {publishPhase === 'running' && <div className="ads-publish-progress-fill" />}
                  {publishPhase === 'full' && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6e9b7d 0%, #34975f 100%)' }}
                    />
                  )}
                </div>
              ) : (
                <span className="text-[18px] font-semibold leading-[1.25em] tracking-[0.015em] text-white font-vk-demi">
                  {primaryButtonLabel}
                </span>
              )}
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
