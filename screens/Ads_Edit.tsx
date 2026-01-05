'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Plus, X } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import type { StoredAd, AdSpecItem } from './ads'
import { AdsCategory, AdsCondition, CONDITION_OPTIONS } from './Ads_Create'

type AdsEditStep = 2 | 3 | 4 | 5 | 6 | 7

const EDIT_STEPS: AdsEditStep[] = [2, 3, 4, 5, 6, 7]

export default function AdsEdit({
  ad,
  onClose,
}: {
  ad: StoredAd
  onClose: () => void
}) {
  const [scale, setScale] = useState(1)
  const [step, setStep] = useState<AdsEditStep>(2)

  const initialImages = ad.imageUrls && ad.imageUrls.length > 0 ? ad.imageUrls : ad.imageUrl ? [ad.imageUrl] : []

  const normalizeCategory = (raw: string | null): AdsCategory | null => {
    if (raw === 'nicotine' || raw === 'job' || raw === 'service' || raw === 'things' || raw === 'other') return raw
    return null
  }

  const mapConditionLabelToId = (label: string | null): AdsCondition | null => {
    if (!label) return null
    const found = CONDITION_OPTIONS.find((c) => c.label === label)
    return found ? found.id : null
  }

  const [category] = useState<AdsCategory | null>(() => normalizeCategory(ad.category))
  const [images, setImages] = useState<string[]>(initialImages)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [title, setTitle] = useState(ad.title ?? '')
  const [condition, setCondition] = useState<AdsCondition | null>(() => mapConditionLabelToId(ad.condition))
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [description, setDescription] = useState(ad.description ?? '')
  const [price, setPrice] = useState(ad.price ?? '')
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

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savePhase, setSavePhase] = useState<'idle' | 'running' | 'full'>('idle')
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const [resultMode, setResultMode] = useState<'save' | 'delete'>('save')

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

  useEffect(() => {
    const specs = ad.specs
    if (!category || !specs) return
    const get = (label: string) => {
      const item = specs.find((s) => s.label === label)
      return item ? item.value : ''
    }
    if (category === 'nicotine') {
      setBrand(get('Бренд'))
      setNicotineFormat(get('Тип устройства'))
      setNicotineTankVolume(get('Объем жидкости'))
      setNicotineBatteryCapacity(get('Емкость аккумулятора'))
      setNicotineStrength(get('Крепость никотина'))
      setNicotinePuffs(get('Количество затяжек'))
      setNicotineFlavor(get('Вкус'))
      setColor(get('Цвет'))
    } else if (category === 'things') {
      setBrand(get('Бренд'))
      setThingsModel(get('Модель'))
      setThingsMemory(get('Память'))
      setThingsDiagonal(get('Диагональ'))
      setThingsYear(get('Год выпуска'))
      setThingsWarranty(get('Гарантия'))
      setThingsKit(get('Комплектация'))
      setColor(get('Цвет'))
    } else if (category === 'service') {
      setServiceType(get('Вид услуги'))
      setServiceExperience(get('Опыт работы'))
      setServiceFormat(get('Формат работы'))
      setServicePrice(get('Стоимость'))
      setServiceRegion(get('Регион'))
    } else if (category === 'job') {
      setJobPosition(get('Должность'))
      setJobSalary(get('Зарплата'))
      setJobEmploymentType(get('Уровень занятости'))
      setJobSchedule(get('График'))
      setJobFormat(get('Формат работы'))
      setJobExperience(get('Требуемый опыт'))
    } else if (category === 'other') {
      setOtherType(get('Тип товара'))
      setBrand(get('Бренд'))
      setColor(get('Цвет'))
      setOtherDetails(get('Дополнительно'))
    }
  }, [ad.specs, category])

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
        const unique = [...prev]
        for (const u of urls) {
          if (!unique.includes(u)) unique.push(u)
        }
        return unique.slice(0, maxPhotos)
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

  const canSave =
    images.length > 0 && title.trim().length > 0 && price.trim().length > 0

  const getConditionLabel = (c: AdsCondition | null) => {
    const found = CONDITION_OPTIONS.find((o) => o.id === c)
    return found?.label ?? null
  }

  const buildSpecs = (): AdSpecItem[] => {
    const specs: AdSpecItem[] = []
    const push = (label: string, raw: string) => {
      const v = raw.trim()
      if (v.length === 0) return
      specs.push({ label, value: v })
    }
    if (category === 'nicotine') {
      push('Бренд', brand)
      push('Тип устройства', nicotineFormat)
      push('Объем жидкости', nicotineTankVolume)
      push('Емкость аккумулятора', nicotineBatteryCapacity)
      push('Крепость никотина', nicotineStrength)
      push('Количество затяжек', nicotinePuffs)
      push('Вкус', nicotineFlavor)
      push('Цвет', color)
    } else if (category === 'things') {
      push('Бренд', brand)
      push('Модель', thingsModel)
      push('Память', thingsMemory)
      push('Диагональ', thingsDiagonal)
      push('Год выпуска', thingsYear)
      push('Гарантия', thingsWarranty)
      push('Комплектация', thingsKit)
      push('Цвет', color)
    } else if (category === 'service') {
      push('Вид услуги', serviceType)
      push('Опыт работы', serviceExperience)
      push('Формат работы', serviceFormat)
      push('Стоимость', servicePrice)
      push('Регион', serviceRegion)
    } else if (category === 'job') {
      push('Должность', jobPosition)
      push('Зарплата', jobSalary)
      push('Уровень занятости', jobEmploymentType)
      push('График', jobSchedule)
      push('Формат работы', jobFormat)
      push('Требуемый опыт', jobExperience)
    } else if (category === 'other') {
      push('Тип товара', otherType)
      push('Бренд', brand)
      push('Цвет', color)
      push('Дополнительно', otherDetails)
    }
    return specs
  }

  const saveChanges = async (): Promise<boolean> => {
    const titleTrim = title.trim()
    const descriptionTrim = description.trim()
    const priceTrim = price.trim()
    if (titleTrim.length === 0 || priceTrim.length === 0) return false
    if (images.length === 0) return false

    const imageUrl = JSON.stringify(images)
    if (!imageUrl) return false

    const specsList = buildSpecs()
    const specsJson = specsList.length > 0 ? JSON.stringify(specsList) : null

    const conditionLabel = getConditionLabel(condition)
    const client = getSupabase()
    if (!client) return false

    const payload: Record<string, unknown> = {
      title: titleTrim,
      price: priceTrim,
      image_url: imageUrl,
      condition: conditionLabel,
    }

    if (descriptionTrim.length > 0) {
      payload.description = descriptionTrim
    } else {
      payload.description = null
    }

    if (specsJson) {
      payload.specs = specsJson
    } else {
      payload.specs = null
    }

    try {
      const { error } = await client.from('ads').update(payload).eq('id', ad.id)
      if (error) {
        if (typeof window !== 'undefined') {
          console.error('update_ad_supabase_error', error)
        }
        return false
      }
      if (typeof window !== 'undefined') {
        const ev = new CustomEvent('ads-updated', { detail: { type: 'updated', id: ad.id } })
        window.dispatchEvent(ev)
      }
      return true
    } catch (e) {
      if (typeof window !== 'undefined') {
        console.error('failed_to_update_ad', e)
      }
      return false
    }
  }

  const deleteAd = async (): Promise<boolean> => {
    const client = getSupabase()
    if (!client) return false
    try {
      const { error } = await client.from('ads').delete().eq('id', ad.id)
      if (error) {
        if (typeof window !== 'undefined') {
          console.error('delete_ad_supabase_error', error)
        }
        return false
      }
      if (typeof window !== 'undefined') {
        const ev = new CustomEvent('ads-updated', { detail: { type: 'deleted', id: ad.id } })
        window.dispatchEvent(ev)
      }
      return true
    } catch (e) {
      if (typeof window !== 'undefined') {
        console.error('failed_to_delete_ad', e)
      }
      return false
    }
  }

  const handleSaveClick = async () => {
    if (!canSave || saving || deleting) return
    const minDuration = 1800
    setResultMode('save')
    setSaving(true)
    setSavePhase('running')
    setShowSaveAnimation(true)
    const startedAt = Date.now()
    let phaseTimer: number | undefined
    if (typeof window !== 'undefined') {
      phaseTimer = window.setTimeout(() => {
        setSavePhase('full')
      }, minDuration)
    }
    const ok = await saveChanges()
    const finish = () => {
      if (typeof window !== 'undefined' && phaseTimer !== undefined) {
        window.clearTimeout(phaseTimer)
      }
      setSaving(false)
      setSavePhase('idle')
      if (!ok) {
        setShowSaveAnimation(false)
        return
      }
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          setShowSaveAnimation(false)
          onClose()
        }, 250)
      } else {
        setShowSaveAnimation(false)
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

  const handleDeleteClick = async () => {
    if (saving || deleting) return
    const minDuration = 1800
    setDeleting(true)
    setResultMode('delete')
    setSavePhase('running')
    setShowSaveAnimation(true)
    const startedAt = Date.now()
    let phaseTimer: number | undefined
    if (typeof window !== 'undefined') {
      phaseTimer = window.setTimeout(() => {
        setSavePhase('full')
      }, minDuration)
    }
    const ok = await deleteAd()
    const finish = () => {
      if (typeof window !== 'undefined' && phaseTimer !== undefined) {
        window.clearTimeout(phaseTimer)
      }
      setDeleting(false)
      setSavePhase('idle')
      if (!ok) {
        setShowSaveAnimation(false)
        return
      }
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          setShowSaveAnimation(false)
          onClose()
        }, 250)
      } else {
        setShowSaveAnimation(false)
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const detail = {
      showNextInNav: true,
      enabled: canSave && !saving && !deleting,
      label: 'Сохранить',
      mode: 'edit' as const,
    }
    const ev = new CustomEvent('ads-create-nav-state', { detail })
    window.dispatchEvent(ev)
  }, [canSave, saving, deleting])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handler = () => {
      void handleSaveClick()
    }
    window.addEventListener('ads-create-nav-next', handler)
    return () => {
      window.removeEventListener('ads-create-nav-next', handler)
    }
  }, [handleSaveClick, canSave, saving])

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return
      const ev = new CustomEvent('ads-create-nav-state', {
        detail: { showNextInNav: false, enabled: false, mode: null },
      })
      window.dispatchEvent(ev)
    }
  }, [])

  const navItems: { id: AdsEditStep; label: string }[] = [
    { id: 2, label: 'Фото' },
    { id: 3, label: 'Название' },
    { id: 4, label: 'Состояние' },
    { id: 5, label: 'Характеристики' },
    { id: 6, label: 'Описание' },
    { id: 7, label: 'Цена' },
  ]

  return (
    <div className="fixed inset-0 z-[120] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden" style={{ height: '100dvh' }}>
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px]" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-6 top-0 flex h-full items-center"
              aria-label="Закрыть"
            >
              <img
                src="/interface/x-01.svg"
                alt="close"
                className="h-[22px] w-[22px]"
                style={{ filter: 'invert(1) brightness(1.6)' }}
              />
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
          <div className="pt-2">
            <div className="mb-4">
              <div className="text-[20px] leading-[1.2em] text-white font-ttc-bold mb-3">
                Редактирование объявления
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hidden py-1.5">
                {navItems.map((item) => {
                  const active = step === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStep(item.id)}
                      className="relative flex items-center justify-center rounded-full px-5 py-2"
                      style={{
                        backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <span
                        className="text-[14px] font-sf-ui-medium"
                        style={{
                          color: active ? '#000000' : '#FFFFFFB3',
                        }}
                      >
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
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
                            placeholder="Одноразовая, POD-система и др."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Объем жидкости
                            </div>
                            <input
                              value={nicotineTankVolume}
                              onChange={(e) => setNicotineTankVolume(e.target.value)}
                              placeholder="2 мл"
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Емкость аккумулятора
                            </div>
                            <input
                              value={nicotineBatteryCapacity}
                              onChange={(e) => setNicotineBatteryCapacity(e.target.value)}
                              placeholder="500 мАч"
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Крепость никотина
                            </div>
                            <input
                              value={nicotineStrength}
                              onChange={(e) => setNicotineStrength(e.target.value)}
                              placeholder="20 мг/мл"
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
                              placeholder="1500"
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                            Вкус
                          </div>
                          <input
                            value={nicotineFlavor}
                            onChange={(e) => setNicotineFlavor(e.target.value)}
                            placeholder="Арбуз, манго и др."
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
                            placeholder="Черный, голубой и др."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                      </>
                    )}

                    {category === 'things' && (
                      <>
                        <div>
                          <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                            Бренд
                          </div>
                          <input
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="Apple, Samsung и др."
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
                            placeholder="iPhone 13, Galaxy S21 и т.п."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Память
                            </div>
                            <input
                              value={thingsMemory}
                              onChange={(e) => setThingsMemory(e.target.value)}
                              placeholder="128 ГБ"
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Диагональ
                            </div>
                            <input
                              value={thingsDiagonal}
                              onChange={(e) => setThingsDiagonal(e.target.value)}
                              placeholder='6.1"'
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Год выпуска
                            </div>
                            <input
                              value={thingsYear}
                              onChange={(e) => setThingsYear(e.target.value)}
                              placeholder="2022"
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
                              placeholder="Осталось 6 месяцев"
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                            Комплектация
                          </div>
                          <input
                            value={thingsKit}
                            onChange={(e) => setThingsKit(e.target.value)}
                            placeholder="Коробка, зарядка, чехол и др."
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
                            placeholder="Черный, синий и др."
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
                            placeholder="Ремонт техники, грузоперевозки и др."
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
                            placeholder="3 года"
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
                            placeholder="На выезд, в мастерской и др."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Стоимость
                            </div>
                            <input
                              value={servicePrice}
                              onChange={(e) => setServicePrice(e.target.value)}
                              placeholder="1000 ₽"
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Регион
                            </div>
                            <input
                              value={serviceRegion}
                              onChange={(e) => setServiceRegion(e.target.value)}
                              placeholder="Кадуй, Вологодская область"
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
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
                            placeholder="Продавец, курьер и др."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              Зарплата
                            </div>
                            <input
                              value={jobSalary}
                              onChange={(e) => setJobSalary(e.target.value)}
                              placeholder="40000 ₽"
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
                              placeholder="Полная, частичная и др."
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                              График
                            </div>
                            <input
                              value={jobSchedule}
                              onChange={(e) => setJobSchedule(e.target.value)}
                              placeholder="5/2, сменный и др."
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
                              placeholder="Офис, удаленно, гибрид"
                              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                            Требуемый опыт
                          </div>
                          <input
                            value={jobExperience}
                            onChange={(e) => setJobExperience(e.target.value)}
                            placeholder="Без опыта, от 1 года и др."
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
                            placeholder="Игрушки, аксессуары и др."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                        <div>
                          <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                            Бренд
                          </div>
                          <input
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="Название бренда"
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
                            placeholder="Черный, красный и др."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                        <div>
                          <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                            Дополнительно
                          </div>
                          <textarea
                            value={otherDetails}
                            onChange={(e) => setOtherDetails(e.target.value)}
                            placeholder="Любая дополнительная информация о товаре"
                            className="min-h-[96px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light resize-none"
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
                  <div className="mb-3 text-[14px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                    Расскажите подробнее о товаре, услуге или вакансии.
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Напишите, что важно знать перед покупкой"
                    className="min-h-[140px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light resize-none"
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
            </motion.div>
          </div>
        </div>

        <div
          className="absolute left-0 w-full bg-[#0A0A0A] px-6"
          style={{ height: '88px', bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--nav-bottom-offset))' }}
        >
          <div className="absolute -top-[0.5px] left-0 w-full" style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex h-full w-full items-center gap-3">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={!canSave || saving || deleting}
              className="flex w-1/2 items-center justify-center rounded-[10px] bg-white"
              style={{ height: 52, opacity: canSave && !saving && !deleting ? 1 : 0.5 }}
            >
              {saving ? (
                <div className="relative w-full max-w-[180px] h-[6px] rounded-full bg-white/40 overflow-hidden">
                  {savePhase === 'running' && <div className="ads-publish-progress-fill" />}
                  {savePhase === 'full' && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6e9b7d 0%, #34975f 100%)' }}
                    />
                  )}
                </div>
              ) : (
                <span className="text-[16px] font-semibold leading-[1.25em] tracking-[0.015em] text-black font-vk-demi">
                  Сохранить
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={saving || deleting}
              className="flex w-1/2 items-center justify-center rounded-[10px] border border-red-500/70 bg-[#181818]"
              style={{ height: 52, opacity: !saving && !deleting ? 1 : 0.5 }}
            >
              <span className="text-[16px] font-semibold leading-[1.25em] tracking-[0.015em] text-red-400 font-vk-demi">
                Удалить
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
        {showSaveAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-[70]"
          >
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="relative w-40 h-40 mb-4"
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M 20 50 L 40 70 L 80 25"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: 'easeInOut' }}
                  />
                </svg>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="text-white text-[20px] font-ttc-bold"
              >
                {resultMode === 'delete' ? 'Объявление удалено' : 'Изменения сохранены'}
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
