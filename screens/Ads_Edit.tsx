'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Trash2, Camera, ChevronRight, AlertCircle, Check, BarChart2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import type { StoredAd, AdSpecItem } from './ads'
import { AdsCategory, AdsCondition, CONDITION_OPTIONS } from './Ads_Create'

export default function AdsEdit({
  ad,
  onClose,
  onAnalytics,
}: {
  ad: StoredAd
  onClose: () => void
  onAnalytics?: () => void
}) {
  const [scale, setScale] = useState(1)
  const [activeTab, setActiveTab] = useState<'info' | 'condition' | 'specs'>('info')

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
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
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

  const swapImages = (from: number, to: number) => {
    setImages((prev) => {
      const next = [...prev]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
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
        <div className="flex-shrink-0 flex items-center justify-between px-4 border-b border-white/[0.05]"
          style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
          <span className="text-[17px] font-sf-ui-medium text-white">Редактирование</span>
          <div className="flex items-center gap-2">
            {onAnalytics && (
              <button onClick={onAnalytics} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
              </button>
            )}
            <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 active:bg-red-500/20 transition-colors">
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-32 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          <div className="px-4 py-5 space-y-4">
            
            {/* Photos Section — в плашке */}
            <div className="rounded-[20px] overflow-hidden" style={{ background: '#111111' }}>
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <h3 className="text-[11px] font-sf-ui-medium text-white/25 tracking-widest">Загруженные фото</h3>
                <span className="text-[11px] text-white/20">{images.length} / 6</span>
              </div>
              <div className="px-3 pb-4">
              {(() => {
                const hasAdd = images.length < 6
                const total = images.length + (hasAdd ? 1 : 0)
                const cols = total <= 2 ? 2 : total <= 4 ? 2 : 3
                const gridClass = cols === 2 ? 'grid-cols-2' : 'grid-cols-3'
                const cells = [
                  ...images.map((src, index) => ({ type: 'image' as const, src, index })),
                  ...(hasAdd ? [{ type: 'add' as const }] : []),
                ]
                return (
                  <div className={`grid ${gridClass} gap-1.5`} ref={gridRef}>
                    {cells.map((cell) => {
                      if (cell.type === 'add') {
                        return (
                          <button key="add" type="button" onClick={openFilePicker}
                            className="aspect-square rounded-[14px] border-2 border-dashed border-white/10 bg-white/[0.02] active:bg-white/[0.05] transition-all flex flex-col items-center justify-center gap-2"
                          >
                            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
                              <Plus size={16} className="text-white/40" />
                            </div>
                            {images.length === 0 && <span className="text-[11px] text-white/30 font-sf-ui-light">Добавить</span>}
                          </button>
                        )
                      }
                      const { src, index } = cell
                      return (
                        <motion.div
                          key={`${src}-${index}`}
                          className="relative aspect-square rounded-[14px] overflow-hidden"
                          layout
                          drag
                          dragConstraints={gridRef}
                          dragElastic={0.2}
                          dragMomentum={false}
                          dragSnapToOrigin={true}
                          onDragEnd={(_e, info) => {
                            const absX = Math.abs(info.offset.x)
                            const absY = Math.abs(info.offset.y)
                            if (absX >= absY && absX > 50) {
                              const t = index + (info.offset.x > 0 ? 1 : -1)
                              if (t >= 0 && t < images.length) swapImages(index, t)
                            } else if (absY > absX && absY > 50) {
                              const t = index + (info.offset.y > 0 ? cols : -cols)
                              if (t >= 0 && t < images.length) swapImages(index, t)
                            }
                          }}
                          whileDrag={{ scale: 1.05, zIndex: 50 }}
                          transition={{ layout: { type: 'spring', stiffness: 500, damping: 40 } }}
                        >
                          <div onClick={() => setPreviewImage(src)} className="w-full h-full cursor-pointer">
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          </div>
                          {index === 0 && (
                            <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 pointer-events-none">
                              <span className="text-[10px] text-white font-sf-ui-medium">Обложка</span>
                            </div>
                          )}
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeImageAt(index) }}
                            className="absolute right-2 top-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center active:scale-75 transition-all z-10"
                          >
                            <X size={12} className="text-white" />
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                )
              })()}
              {images.length > 1 && (
                <p className="mt-2 text-[11px] text-white/15 font-sf-ui-light text-center">Перетащите чтобы изменить порядок</p>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple
                onChange={(e) => handlePickedFiles(e.target.files)} />
              </div>
            </div>

            {/* Плашка аналитики — стиль как у рекламного баннера */}
            {onAnalytics && (
              <button
                type="button"
                onClick={onAnalytics}
                className="w-full flex items-center gap-3 p-4 rounded-[20px] active:opacity-75 transition-opacity text-left relative overflow-hidden"
                style={{ background: '#111111' }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse at 15% 50%, rgba(55,55,55,0.35) 0%, transparent 60%), linear-gradient(to right, #161616 0%, #0a0a0a 100%)',
                }} />
                <motion.div
                  animate={{ x: ['-100%', '350%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 7 }}
                  className="absolute top-[45%] left-0 z-10 w-[25%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
                <div className="w-10 h-10 rounded-[12px] bg-white/[0.06] flex items-center justify-center flex-shrink-0 relative z-10">
                  <BarChart2 size={18} className="text-white/60" />
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="text-[14px] font-sf-ui-medium text-white/85">Аналитика объявления</div>
                  <div className="text-[12px] text-white/35 font-sf-ui-light mt-0.5">Просмотры · Статистика</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20 flex-shrink-0 relative z-10">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            )}

            {/* Tabs навигация */}
            <div className="flex gap-1 rounded-[20px] p-1" style={{ background: '#111111' }}>
              {[
                { id: 'info', label: 'Основное' },
                { id: 'condition', label: 'Состояние' },
                ...(category ? [{ id: 'specs', label: 'Остальное' }] : []),
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className="relative flex-1 py-2.5 text-[13px] font-sf-ui-medium transition-colors rounded-[14px] z-10"
                  style={{ color: activeTab === t.id ? '#000' : 'rgba(255,255,255,0.35)' }}
                >
                  {activeTab === t.id && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-[14px] bg-white"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Основное */}
            {activeTab === 'info' && (
              <section className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/25 ml-1 font-sf-ui-medium  tracking-widest">Название</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Что продаете?"
                    className="w-full h-[52px] rounded-[20px] px-5 text-[15px] text-white placeholder:text-white/20 outline-none transition-all"
                    style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/25 ml-1 font-sf-ui-medium tracking-widest">Цена</label>
                  <div className="relative">
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      type="number"
                      className="w-full h-[52px] rounded-[20px] px-5 pr-10 text-[15px] text-white placeholder:text-white/20 outline-none transition-all"
                      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/25 font-sf-ui-medium">₽</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/25 ml-1 font-sf-ui-medium tracking-widest">Описание товара</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опишите товар подробнее..."
                    className="w-full min-h-[110px] rounded-[20px] p-5 text-[15px] text-white placeholder:text-white/20 outline-none resize-none leading-relaxed transition-all"
                    style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
              </section>
            )}

            {/* Состояние */}
            {activeTab === 'condition' && (
              <section className="space-y-2">
                {CONDITION_OPTIONS.map((opt) => {
                  const isSelected = condition === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setCondition(opt.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] transition-all"
                      style={{
                        background: isSelected ? '#0f172a' : '#141414',
                        border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                          style={{ backgroundColor: `${opt.color}18`, color: opt.color }}>
                          {opt.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-[14px] font-sf-ui-medium text-white/90">{opt.label}</p>
                          <p className="text-[11px] text-white/30 font-sf-ui-light">{opt.description}</p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                        style={{ borderColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.15)', background: isSelected ? '#6366f1' : 'transparent' }}>
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                    </button>
                  )
                })}
              </section>
            )}

            {/* Характеристики */}
            {activeTab === 'specs' && (
              <section className="space-y-4">
                {category === 'nicotine' && (
                  <>
                    <SpecInput label="Бренд" value={brand} onChange={setBrand} placeholder="HQD, Elf Bar..." />
                    <SpecInput label="Тип устройства" value={nicotineFormat} onChange={setNicotineFormat} placeholder="POD-система..." />
                    <div className="grid grid-cols-2 gap-3">
                      <SpecInput label="Объем" value={nicotineTankVolume} onChange={setNicotineTankVolume} placeholder="2 мл" />
                      <SpecInput label="Аккумулятор" value={nicotineBatteryCapacity} onChange={setNicotineBatteryCapacity} placeholder="500 мАч" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-2 gap-3">
                      <SpecInput label="Память" value={thingsMemory} onChange={setThingsMemory} placeholder="128 ГБ" />
                      <SpecInput label="Экран" value={thingsDiagonal} onChange={setThingsDiagonal} placeholder='6.1"' />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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
              </section>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent">
          <button
            onClick={handleSaveClick}
            disabled={!canSave || saving}
            className="w-full h-[52px] rounded-[14px] font-sf-ui-medium text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: canSave && !saving ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#141414',
              color: canSave && !saving ? 'white' : 'rgba(255,255,255,0.2)',
            }}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                onClick={() => setShowDeleteConfirm(false)}
              />
              <div className="fixed inset-0 z-[210] flex items-end justify-center pointer-events-none">
                <motion.div
                  initial={{ translateY: '100%' }}
                  animate={{ translateY: 0 }}
                  exit={{ translateY: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                  className="w-full bg-[#121212] border-t border-white/10 rounded-t-[32px] px-6 pt-7 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pointer-events-auto"
                >
                  <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/15" />
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                      <Trash2 className="w-7 h-7 text-red-400" />
                    </div>
                    <h4 className="text-[20px] font-sf-ui-medium text-white mb-2">Удалить объявление?</h4>
                    <p className="text-[14px] text-white/40 font-sf-ui-light leading-relaxed max-w-[280px]">
                      Это действие нельзя отменить. Объявление исчезнет из ленты и вашего профиля/магазина.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteClick}
                    className="w-full h-14 bg-red-500 text-white rounded-[22px] font-sf-ui-medium text-[16px] active:scale-[0.97] transition-all mb-3"
                  >
                    Удалить
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full h-12 text-white/40 font-sf-ui-light text-[15px] active:opacity-60 transition-all"
                  >
                    Отмена
                  </button>
                </motion.div>
              </div>
            </>
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
      <label className="text-[11px] text-white/25 ml-1 font-sf-ui-medium uppercase tracking-widest">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[48px] rounded-[20px] px-5 text-[14px] text-white placeholder:text-white/20 outline-none transition-all"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
      />
    </div>
  )
}