'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Trash2, Camera, ChevronRight, AlertCircle, Check } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import type { StoredAd, AdSpecItem } from './ads'
import { AdsCategory, AdsCondition, CONDITION_OPTIONS } from './Ads_Create'

export default function AdsEdit({
  ad,
  onClose,
}: {
  ad: StoredAd
  onClose: () => void
}) {
  const [scale, setScale] = useState(1)
  const [activeTab, setActiveTab] = useState<'info' | 'specs'>('info')

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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

  return (
    <div className="fixed inset-0 z-[120] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden" style={{ height: '100dvh' }}>
      <div className="relative h-full w-full max-w-[375px] bg-[#0A0A0A] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="sticky top-0 z-[130] w-full bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 safe-area-top">
          <div className="flex h-[56px] items-center justify-between px-6">
            <button
              onClick={onClose}
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-white/5 active:scale-90 transition-all"
            >
              <X className="w-6 h-6 text-white/40" />
            </button>
            <span className="text-[17px] font-sf-ui-medium text-white/90">Редактирование</span>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full hover:bg-red-500/10 active:scale-90 transition-all group"
            >
              <Trash2 className="w-5 h-5 text-white/20 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
          <div className="px-6 py-6 space-y-8">
            
            {/* Photos Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-sf-ui-medium text-white/30 uppercase tracking-wider">Фотографии</h3>
                <span className="text-[12px] text-white/20">{images.length}/6</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {images.map((src, index) => (
                  <div key={src} className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImageAt(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-blue-600 rounded-lg backdrop-blur-sm">
                        <span className="text-[9px] text-white font-sf-ui-bold uppercase">Главное</span>
                      </div>
                    )}
                  </div>
                ))}
                {images.length < 6 && (
                  <button
                    onClick={openFilePicker}
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-2 hover:bg-white/[0.04] active:scale-95 transition-all"
                  >
                    <Camera className="w-6 h-6 text-white/20" />
                    <span className="text-[11px] text-white/20 font-sf-ui-medium">Добавить</span>
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => handlePickedFiles(e.target.files)}
              />
            </section>

            {/* Main Info */}
            <section className="space-y-5">
              <h3 className="text-[14px] font-sf-ui-medium text-white/30 uppercase tracking-wider">Основное</h3>
              
              <div className="space-y-1.5">
                <label className="text-[13px] text-white/40 ml-1 font-sf-ui-medium">Название</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Что продаете?"
                  className="w-full h-[52px] bg-white/5 border border-white/5 rounded-2xl px-5 text-[16px] text-white placeholder:text-white/20 focus:border-blue-500/30 focus:bg-white/[0.07] transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] text-white/40 ml-1 font-sf-ui-medium">Цена</label>
                <div className="relative">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    type="number"
                    className="w-full h-[52px] bg-white/5 border border-white/5 rounded-2xl px-5 pr-12 text-[16px] text-white placeholder:text-white/20 focus:border-blue-500/30 focus:bg-white/[0.07] transition-all outline-none font-sf-ui-bold"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 font-sf-ui-medium">₽</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] text-white/40 ml-1 font-sf-ui-medium">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите товар подробнее..."
                  className="w-full min-h-[120px] bg-white/5 border border-white/5 rounded-2xl p-5 text-[15px] text-white placeholder:text-white/20 focus:border-blue-500/30 focus:bg-white/[0.07] transition-all outline-none resize-none leading-relaxed"
                />
              </div>
            </section>

            {/* Condition Selection */}
            <section className="space-y-4">
              <h3 className="text-[14px] font-sf-ui-medium text-white/30 uppercase tracking-wider">Состояние</h3>
              <div className="grid grid-cols-1 gap-2">
                {CONDITION_OPTIONS.map((opt) => {
                  const isSelected = condition === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setCondition(opt.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-white/10 border-white/20 scale-[1.02]' 
                          : 'bg-white/5 border-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[18px]"
                          style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
                        >
                          {opt.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-[15px] font-sf-ui-medium text-white">{opt.label}</p>
                          <p className="text-[12px] text-white/40 leading-tight">{opt.description}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-white/10'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[4]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Dynamic Specs */}
            <section className="space-y-5">
              <h3 className="text-[14px] font-sf-ui-medium text-white/30 uppercase tracking-wider">Характеристики</h3>
              
              <div className="grid grid-cols-1 gap-5">
                {category === 'nicotine' && (
                  <>
                    <SpecInput label="Бренд" value={brand} onChange={setBrand} placeholder="HQD, Elf Bar..." />
                    <SpecInput label="Тип устройства" value={nicotineFormat} onChange={setNicotineFormat} placeholder="POD-система..." />
                    <div className="grid grid-cols-2 gap-4">
                      <SpecInput label="Объем" value={nicotineTankVolume} onChange={setNicotineTankVolume} placeholder="2 мл" />
                      <SpecInput label="Аккумулятор" value={nicotineBatteryCapacity} onChange={setNicotineBatteryCapacity} placeholder="500 мАч" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <SpecInput label="Крепость" value={nicotineStrength} onChange={setNicotineStrength} placeholder="20 мг" />
                      <SpecInput label="Затяжки" value={nicotinePuffs} onChange={setNicotinePuffs} placeholder="1500" />
                    </div>
                    <SpecInput label="Вкус" value={nicotineFlavor} onChange={setNicotineFlavor} placeholder="Манго..." />
                    <SpecInput label="Цвет" value={color} onChange={setColor} placeholder="Черный..." />
                  </>
                )}

                {category === 'things' && (
                  <>
                    <SpecInput label="Бренд" value={brand} onChange={setBrand} placeholder="Apple, Samsung..." />
                    <SpecInput label="Модель" value={thingsModel} onChange={setThingsModel} placeholder="iPhone 13..." />
                    <div className="grid grid-cols-2 gap-4">
                      <SpecInput label="Память" value={thingsMemory} onChange={setThingsMemory} placeholder="128 ГБ" />
                      <SpecInput label="Экран" value={thingsDiagonal} onChange={setThingsDiagonal} placeholder='6.1"' />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <SpecInput label="Год" value={thingsYear} onChange={setThingsYear} placeholder="2022" />
                      <SpecInput label="Гарантия" value={thingsWarranty} onChange={setThingsWarranty} placeholder="6 мес." />
                    </div>
                    <SpecInput label="Комплект" value={thingsKit} onChange={setThingsKit} placeholder="Полный..." />
                    <SpecInput label="Цвет" value={color} onChange={setColor} placeholder="Space Gray..." />
                  </>
                )}

                {category === 'service' && (
                  <>
                    <SpecInput label="Вид услуги" value={serviceType} onChange={setServiceType} placeholder="Ремонт..." />
                    <SpecInput label="Опыт" value={serviceExperience} onChange={setServiceExperience} placeholder="3 года" />
                    <SpecInput label="Формат" value={serviceFormat} onChange={setServiceFormat} placeholder="Выезд..." />
                    <SpecInput label="Регион" value={serviceRegion} onChange={setServiceRegion} placeholder="Кадуй..." />
                  </>
                )}

                {category === 'job' && (
                  <>
                    <SpecInput label="Должность" value={jobPosition} onChange={setJobPosition} placeholder="Продавец..." />
                    <SpecInput label="Зарплата" value={jobSalary} onChange={setJobSalary} placeholder="50 000 ₽" />
                    <SpecInput label="Занятость" value={jobEmploymentType} onChange={setJobEmploymentType} placeholder="Полная..." />
                    <SpecInput label="График" value={jobSchedule} onChange={setJobSchedule} placeholder="2/2..." />
                    <SpecInput label="Формат" value={jobFormat} onChange={setJobFormat} placeholder="Офис..." />
                  </>
                )}

                {category === 'other' && (
                  <>
                    <SpecInput label="Тип" value={otherType} onChange={setOtherType} placeholder="Настольная игра..." />
                    <SpecInput label="Бренд" value={brand} onChange={setBrand} placeholder="Hasbro..." />
                    <SpecInput label="Цвет" value={color} onChange={setColor} placeholder="Разноцветный..." />
                  </>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent safe-area-bottom">
          <button
            onClick={handleSaveClick}
            disabled={!canSave || saving}
            className={`w-full h-[56px] rounded-2xl font-sf-ui-bold text-[16px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              canSave && !saving
                ? 'bg-white text-black shadow-white/10'
                : 'bg-white/5 text-white/20 grayscale'
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative w-full max-w-[340px] bg-[#141414] rounded-[32px] p-8 border border-white/5 shadow-2xl"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-[20px] font-sf-ui-bold text-white text-center mb-2">Удалить объявление?</h4>
                <p className="text-[14px] text-white/40 text-center mb-8 leading-relaxed">
                  Это действие нельзя будет отменить. Объявление исчезнет из ленты и вашего профиля.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleDeleteClick}
                    className="w-full h-[52px] bg-red-500 text-white rounded-2xl font-sf-ui-bold active:scale-95 transition-all"
                  >
                    Да, удалить
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full h-[52px] bg-white/5 text-white/60 rounded-2xl font-sf-ui-medium active:scale-95 transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Save/Delete Success Animation Overlay */}
        <AnimatePresence>
          {showSaveAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] bg-[#0A0A0A] flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Check className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-[24px] font-sf-ui-bold text-white mb-2">
                  {resultMode === 'delete' ? 'Удалено' : 'Готово!'}
                </h2>
                <p className="text-white/40 font-sf-ui-medium">
                  {resultMode === 'delete' ? 'Объявление успешно удалено' : 'Изменения вступили в силу'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}

function SpecInput({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] text-white/40 ml-1 font-sf-ui-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[52px] bg-white/5 border border-white/5 rounded-2xl px-5 text-[15px] text-white placeholder:text-white/20 focus:border-blue-500/30 focus:bg-white/[0.07] transition-all outline-none"
      />
    </div>
  )
}
