'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export type AdsCategory = 'nicotine' | 'job' | 'service' | 'things' | 'other'
export type AdsCondition = 'new' | 'excellent' | 'good' | 'bad'
type AdsCreateStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export const CATEGORY_CONFIGS: {
  id: AdsCategory
  label: string
  color: string
  icon: React.ReactNode
}[] = [
  {
    id: 'things',
    label: 'Вещи, электроника',
    color: '#FFFFFF',
    icon: <Smartphone size={32} strokeWidth={1.5} />,
  },
  {
    id: 'service',
    label: 'Услуги',
    color: '#FFFFFF',
    icon: <Wrench size={32} strokeWidth={1.5} />,
  },
  {
    id: 'nicotine',
    label: 'Никотиновые устройства',
    color: '#FFFFFF',
    icon: <Cigarette size={32} strokeWidth={1.5} />,
  },
  {
    id: 'job',
    label: 'Работа',
    color: '#FFFFFF',
    icon: <Briefcase size={32} strokeWidth={1.5} />,
  },
  {
    id: 'other',
    label: 'Другое',
    color: '#FFFFFF',
    icon: <Ellipsis size={32} strokeWidth={1.5} />,
  },
]

export const CONDITION_OPTIONS: {
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
    color: '#FFFFFF',
  },
  {
    id: 'excellent',
    label: 'Отличное',
    description: 'Целостность товара сохранена, нет дефектов',
    icon: <Star size={24} />,
    color: '#FFFFFF',
  },
  {
    id: 'good',
    label: 'Хорошее',
    description: 'Есть небольшие дефекты, потёртости и т.п',
    icon: <ThumbsUp size={24} />,
    color: '#FFFFFF',
  },
  {
    id: 'bad',
    label: 'Не очень',
    description: 'Есть видимые дефекты, неисправности',
    icon: <CircleAlert size={24} />,
    color: '#FFFFFF',
  },
]

const StepIllustration = ({ step }: { step: number }) => {
  switch (step) {
    case 1: // Категории
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="10" height="10" rx="2" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
          <circle cx="27" cy="13" r="5" stroke="white" strokeOpacity="0.8" strokeWidth="2"/>
          <path d="M13 22L18 32H8L13 22Z" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
          <rect x="22" y="22" width="10" height="10" rx="2" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
        </svg>
      )
    case 2: // Фото
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="10" width="28" height="22" rx="4" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
          <circle cx="20" cy="21" r="5" stroke="white" strokeOpacity="0.8" strokeWidth="2"/>
          <circle cx="29" cy="15" r="2" fill="white" fillOpacity="0.4"/>
          <path d="M16 10V8C16 7.44772 16.4477 7 17 7H23C23.5523 7 24 7.44772 24 8V10" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
        </svg>
      )
    case 3: // Название
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12H32M8 20H24M8 28H18" stroke="white" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round"/>
          <rect x="22" y="24" width="12" height="8" rx="2" stroke="white" strokeOpacity="0.8" strokeWidth="2"/>
          <path d="M25 28H31" stroke="white" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    case 4: // Состояние
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L23.5 14.5H32.5L25.5 21L28.5 30L20 25L11.5 30L14.5 21L7.5 14.5H16.5L20 6Z" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="20" cy="20" r="16" stroke="white" strokeOpacity="0.2" strokeWidth="1"/>
        </svg>
      )
    case 5: // Характеристики
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="24" height="4" rx="2" fill="white" fillOpacity="0.2"/>
          <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.8" stroke="#111111" strokeWidth="1"/>
          <rect x="8" y="20" width="24" height="4" rx="2" fill="white" fillOpacity="0.2"/>
          <circle cx="28" cy="22" r="3" fill="white" fillOpacity="0.8" stroke="#111111" strokeWidth="1"/>
          <rect x="8" y="30" width="24" height="4" rx="2" fill="white" fillOpacity="0.2"/>
          <circle cx="18" cy="32" r="3" fill="white" fillOpacity="0.8" stroke="#111111" strokeWidth="1"/>
        </svg>
      )
    case 6: // Описание
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="6" width="24" height="28" rx="3" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
          <path d="M13 13H27M13 19H27M13 25H21" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    case 7: // Цена
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 10H28C30.2091 10 32 11.7909 32 14V26C32 28.2091 30.2091 30 28 30H12C9.79086 30 8 28.2091 8 26V14C8 11.7909 9.79086 10 12 10Z" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
          <circle cx="20" cy="20" r="5" stroke="white" strokeOpacity="0.8" strokeWidth="2"/>
          <path d="M8 20H12M28 20H32" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
        </svg>
      )
    case 8: // От кого
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="15" r="6" stroke="white" strokeOpacity="0.8" strokeWidth="2"/>
          <path d="M6 32C6 27.5817 9.58172 24 14 24C18.4183 24 22 27.5817 22 32" stroke="white" strokeOpacity="0.8" strokeWidth="2"/>
          <rect x="24" y="10" width="10" height="10" rx="2" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
          <path d="M22 15H24" stroke="white" strokeOpacity="0.4" strokeWidth="2"/>
        </svg>
      )
    default:
      return null
  }
}

const NicotineFieldIcon = ({ type }: { type: 'brand' | 'format' | 'volume' | 'battery' | 'strength' | 'puffs' | 'flavor' | 'color' }) => {
  switch (type) {
    case 'brand':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      )
    case 'format':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2" width="10" height="20" rx="2"></rect>
          <path d="M12 18h.01"></path>
        </svg>
      )
    case 'volume':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      )
    case 'battery':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
          <line x1="22" y1="11" x2="22" y2="13"></line>
        </svg>
      )
    case 'strength':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      )
    case 'puffs':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19c.7-1.3 1.5-2.6 1.5-4a5 5 0 0 0-10-0c0 1.4.8 2.7 1.5 4"></path>
          <path d="M12 19v3"></path>
          <path d="M9 19H15"></path>
        </svg>
      )
    case 'flavor':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 15c-3.3 0-6 2.7-6 6"></path>
          <path d="M18 21c0-3.3-2.7-6-6-6"></path>
          <path d="M12 9c3.3 0 6-2.7 6-6"></path>
          <path d="M6 3c0 3.3 2.7 6 6 6"></path>
        </svg>
      )
    case 'color':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
      )
    default:
      return null
  }
}

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragData, setDragData] = useState<{startX: number, startY: number, isDragging: boolean} | null>(null)
  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number, index: number | null} | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

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
  const [userStores, setUserStores] = useState<{ id: string; name: string; avatar_url: string | null }[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishPhase, setPublishPhase] = useState<'idle' | 'running' | 'full'>('idle')
  const [showPublishAnimation, setShowPublishAnimation] = useState(false)

  const getConditionLabel = (c: AdsCondition | null) => {
    const found = CONDITION_OPTIONS.find((o) => o.id === c)
    return found?.label ?? null
  }

  type SpecItem = { label: string; value: string }

  const buildSpecs = (): SpecItem[] => {
    const specs: SpecItem[] = []
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

  const publishAd = async (): Promise<boolean> => {
    const titleTrim = title.trim()
    const descriptionTrim = description.trim()
    const priceTrim = price.trim()
    if (titleTrim.length === 0 || descriptionTrim.length === 0 || priceTrim.length === 0)
      return false
    if (images.length === 0) return false

    const imageUrl = JSON.stringify(images)
    if (!imageUrl) return false

    const specsList = buildSpecs()
    const specsJson = specsList.length > 0 ? JSON.stringify(specsList) : null

    let uid: string | null = null
    let userTag: string | null = null
    let location: string | null = null

    try {
      const auth = await loadLocalAuth()
      uid = auth?.uuid ?? auth?.uid ?? null
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

    let finalStoreId: string | null = selectedStoreId
    if (selectedStoreId && uid) {
      try {
        const { data: member } = await client
          .from('store_members')
          .select('id')
          .eq('store_id', selectedStoreId)
          .eq('user_id', uid)
          .maybeSingle()
        if (!member) {
          finalStoreId = null
        }
      } catch {
        finalStoreId = null
      }
    }

    const basePayload = {
      user_id: uid,
      user_tag: userTag,
      title: titleTrim,
      price: priceTrim,
      image_url: imageUrl,
      condition: conditionLabel,
      location,
      category,
      store_id: finalStoreId,
      created_at: new Date().toISOString(),
    }

    try {
      const payload: Record<string, unknown> = { ...basePayload }
      if (descriptionTrim.length > 0) {
        payload.description = descriptionTrim
      }
      if (specsJson) {
        payload.specs = specsJson
      }

      let { data, error } = await client.from('ads').insert(payload).select('*').single()

      if (error && (descriptionTrim.length > 0 || specsJson)) {
        const fallback: Record<string, unknown> = { ...basePayload }
        if (descriptionTrim.length > 0) {
          fallback.description = descriptionTrim
        }
        ;({ data, error } = await client.from('ads').insert(fallback).select('*').single())
      }

      if (error) {
        if (typeof window !== 'undefined') {
          console.error('publish_ad_supabase_error', error)
        }
        return false
      }

      if (typeof window !== 'undefined') {
        const ev = new CustomEvent('ads-updated', { detail: { type: 'created', row: data } })
        window.dispatchEvent(ev)
        try {
          if (data && typeof (data as any).id === 'string') {
            await fetch('/api/push/new-ad', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ adId: (data as any).id as string }),
            })
          }
        } catch {
        }
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
    const loadStores = async () => {
      const auth = await loadLocalAuth()
      const uid = auth?.uuid ?? auth?.uid
      if (!uid) return
      const client = getSupabase()
      if (!client) return
      try {
        const { data } = await client
          .from('store_members')
          .select('store_id, stores(id, name, avatar_url)')
          .eq('user_id', uid)
        if (data) {
          setUserStores(data.map((m: any) => ({
            id: m.stores.id,
            name: m.stores.name,
            avatar_url: m.stores.avatar_url
          })))
        }
      } catch (e) {
        console.error('Error loading stores for ad creation:', e)
      }
    }
    loadStores()
  }, [])

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    // Use both setData methods for better compatibility
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.setData('index', index.toString())
    setDraggedIndex(index)
    console.log('Drag started:', index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    console.log('Drag ended')
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const swapImages = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev]
      const temp = newImages[fromIndex]
      newImages[fromIndex] = newImages[toIndex]
      newImages[toIndex] = temp
      return newImages
    })
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    const touch = e.touches[0]
    setTouchStartPos({
      x: touch.clientX,
      y: touch.clientY,
      index: index
    })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPos || touchStartPos.index === null) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.y)
    
    // If moved more than 10 pixels, consider it a drag
    if (deltaX > 10 || deltaY > 10) {
      setDraggedIndex(touchStartPos.index)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPos || touchStartPos.index === null) return
    
    const touch = e.changedTouches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement
    
    if (element) {
      const dropTarget = element.closest('[data-image-index]') as HTMLElement
      if (dropTarget) {
        const dropIndex = parseInt(dropTarget.dataset.imageIndex!, 10)
        const dragIndex = touchStartPos.index
        
        if (!isNaN(dropIndex) && dragIndex !== dropIndex) {
          setImages((prev) => {
            const newImages = [...prev]
            const draggedImage = newImages[dragIndex]
            newImages.splice(dragIndex, 1)
            newImages.splice(dropIndex, 0, draggedImage)
            return newImages
          })
        }
      }
    }
    
    setTouchStartPos(null)
    setDraggedIndex(null)
  }

  const handleNumericChange = (val: string, setter: (v: string) => void) => {
    const onlyDigits = val.replace(/[^\d]/g, '')
    setter(onlyDigits)
  }

  const handleDecimalChange = (val: string, setter: (v: string) => void) => {
    let sanitized = val.replace(/,/g, '.')
    sanitized = sanitized.replace(/[^\d.]/g, '')
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('')
    }
    setter(sanitized)
  }

  const canGoNext =
    (step === 1 && category !== null) ||
    (step === 2 && images.length > 0) ||
    (step === 3 && title.trim().length > 0) ||
    (step === 4 && condition !== null) ||
    step === 5 ||
    (step === 6 && description.trim().length > 0) ||
    (step === 7 && price.trim().length > 0 && images.length > 0) ||
    step === 8

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isLastStep = userStores.length > 0 ? step === 8 : step === 7
    const label = isLastStep ? 'Опубликовать' : 'Далее'
    const detail = {
      showNextInNav: true,
      enabled: canGoNext && !publishing,
      label,
      mode: 'create' as const,
    }
    const ev = new CustomEvent('ads-create-nav-state', { detail })
    window.dispatchEvent(ev)
  }, [step, canGoNext, publishing, userStores.length])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handler = () => {
      void goNext()
    }
    window.addEventListener('ads-create-nav-next', handler)
    return () => {
      window.removeEventListener('ads-create-nav-next', handler)
    }
  }, [step, canGoNext, publishing])

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return
      const ev = new CustomEvent('ads-create-nav-state', {
        detail: { showNextInNav: false, enabled: false, mode: null },
      })
      window.dispatchEvent(ev)
    }
  }, [])

  const goNext = async () => {
    if (!canGoNext || publishing) return
    
    if (step < 7) {
      setStep((s) => (s + 1) as AdsCreateStep)
      return
    }

    if (step === 7 && userStores.length > 0) {
      setStep(8)
      return
    }

    // Step 8 or Step 7 (without stores)
    const minDuration = 1800
    setPublishing(true)
    setPublishPhase('running')
    setShowPublishAnimation(true)
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
      if (!ok) {
        setShowPublishAnimation(false)
        return
      }
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          setShowPublishAnimation(false)
          onClose()
        }, 250)
      } else {
        setShowPublishAnimation(false)
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

  return (
    <div className="fixed inset-0 z-[150] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden" style={{ height: '100dvh' }}>
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px]" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full bg-[#0A0A0A] z-[160]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 20px)', height: '56px' }}
        >
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={goBack}
              className="absolute left-6 w-11 h-11 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl transition-all active:scale-95 hover:bg-black/50"
              aria-label={step === 1 ? 'Закрыть' : 'Назад'}
            >
              <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div
          className={`absolute left-0 w-full px-6 pb-10 ${step === 4 ? 'overflow-hidden' : 'overflow-y-auto'}`}
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 92px)',
            height: 'calc(812px - 92px - var(--home-header-offset))',
          }}
        >
          <div
            key={step}
            className={step === 1 ? 'ads-step-slide-up' : 'ads-step-slide-left'}
          >
            {step === 1 && (
              <div className="pt-0">
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

                <div className="mt-6 rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <StepIllustration step={1} />
                  </div>
                  <div className="text-[13px] leading-[1.4em] text-white/60 font-sf-ui-light">
                    Выбор типа влияет на то, какие характеристики будут представлены покупателю
                  </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGoNext || publishing}
                    onClick={goNext}
                    className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                      canGoNext && !publishing
                        ? 'bg-white text-black active:scale-[0.9]'
                        : 'bg-white/10 text-white/20'
                    }`}
                  >
                    <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
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
                    Первое фото будет обложкой объявления. Выберите лучшее фото из всех.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4" ref={gridRef}>
                  {images.map((src, index) => (
                    <motion.div 
                      key={`${src}-${index}`}
                      data-image-index={index}
                      className={`draggable-image relative w-full overflow-hidden rounded-2xl group ${
                        draggedIndex === index ? 'opacity-50 scale-95' : ''
                      } ${
                        draggedIndex !== null && draggedIndex !== index ? 'hover:scale-105' : ''
                      }`}
                      style={{ aspectRatio: '1 / 1' }}
                      layout
                       drag
                       dragConstraints={gridRef}
                       dragElastic={0.2}
                       dragMomentum={false}
                       dragSnapToOrigin={true}
                       onDragEnd={(event, info) => {
                         const threshold = 50
                         const dragIndex = index
                         const absX = Math.abs(info.offset.x)
                         const absY = Math.abs(info.offset.y)
                         const axis = absX >= absY ? 'x' : 'y'
                         
                         if (axis === 'x' && absX > threshold) {
                           const direction = info.offset.x > 0 ? 'right' : 'left'
                           let targetIndex = dragIndex
                           if (direction === 'left' && dragIndex % 2 === 1) {
                             targetIndex = dragIndex - 1
                           } else if (direction === 'right' && dragIndex % 2 === 0) {
                             targetIndex = dragIndex + 1
                           }
                           if (targetIndex !== dragIndex && targetIndex >= 0 && targetIndex < images.length) {
                             swapImages(dragIndex, targetIndex)
                           }
                         }
                         
                         if (axis === 'y' && absY > threshold) {
                           const direction = info.offset.y > 0 ? 'down' : 'up'
                           let targetIndex = dragIndex
                           if (direction === 'up' && dragIndex - 2 >= 0) {
                             targetIndex = dragIndex - 2
                           } else if (direction === 'down' && dragIndex + 2 < images.length) {
                             targetIndex = dragIndex + 2
                           }
                           if (targetIndex !== dragIndex && targetIndex >= 0 && targetIndex < images.length) {
                             swapImages(dragIndex, targetIndex)
                           }
                         }
                       }}
                       whileDrag={{ scale: 1.05, zIndex: 1000 }}
                       transition={{ layout: { type: 'spring', stiffness: 500, damping: 40 } }}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <div className="relative h-full w-full">
                        <div
                          onClick={() => setPreviewImage(src)}
                          className="block h-full w-full cursor-pointer active:opacity-80 transition-opacity"
                        >
                          <img src={src} alt="preview" className="h-full w-full object-cover" />
                        </div>
                        {index === 0 && (
                          <div className="absolute left-3 top-3 rounded-lg bg-black/70 px-3 py-1.5 backdrop-blur-sm pointer-events-none">
                            <span className="text-xs text-white font-sf-ui-light">
                              Обложка
                            </span>
                          </div>
                        )}
                        <div className="absolute left-3 bottom-3 rounded-lg bg-black/70 px-2 py-1 backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          </svg>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImageAt(index)
                          }}
                          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-lg active:scale-75 transition-all z-10 group/btn"
                        >
                          <X size={14} className="text-white/80 group-hover/btn:text-white transition-colors" />
                        </button>
                      </div>
                    </motion.div>
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
                {images.length > 1 && (
                  <div className="mt-2 text-center">
                    <span className="text-[12px] leading-[1.4em] text-white/30 font-sf-ui-light">
                      Свайпните фото в сторону, чтобы изменить порядок
                    </span>
                  </div>
                )}
                <div className="mt-4 rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <StepIllustration step={2} />
                  </div>
                  <div className="text-[13px] leading-[1.4em] text-white/60 font-sf-ui-light">
                    Фото — первое, на что смотрит покупатель. Хорошие фото помогают быстрее продать товар
                  </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGoNext || publishing}
                    onClick={goNext}
                    className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                      canGoNext && !publishing
                        ? 'bg-white text-black active:scale-[0.9]'
                        : 'bg-white/10 text-white/20'
                    }`}
                  >
                    <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
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

            {step === 8 && (
              <div className="pt-2">
                <div className="mb-8">
                  <div className="text-[24px] leading-[1.2em] text-white font-ttc-bold">
                    От кого опубликовать?
                  </div>
                  <div className="mt-1 text-[14px] leading-[1.4em] text-white/40 font-sf-ui-light">
                    Вы можете разместить объявление от своего имени или от имени вашего магазина.
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStoreId(null)}
                    className={`flex items-center gap-4 p-4 rounded-3xl border transition-all ${
                      selectedStoreId === null 
                        ? 'bg-white border-white' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-vk-demi text-lg ${
                      selectedStoreId === null ? 'bg-black text-white' : 'bg-white/10 text-white'
                    }`}>
                      {title ? title[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`text-[17px] font-sf-ui-medium ${selectedStoreId === null ? 'text-black' : 'text-white'}`}>
                        Личный профиль
                      </div>
                      <div className={`text-[13px] ${selectedStoreId === null ? 'text-black/60' : 'text-white/40'}`}>
                        Объявление будет видно в вашем профиле
                      </div>
                    </div>
                    {selectedStoreId === null && (
                      <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                        <ThumbsUp size={14} className="text-white" />
                      </div>
                    )}
                  </button>

                  <div className="mt-4 mb-2 text-[12px] font-sf-ui-semibold text-white/30 uppercase tracking-[0.05em] ml-2">
                    Магазины
                  </div>

                  {userStores.map(store => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => setSelectedStoreId(store.id)}
                      className={`flex items-center gap-4 p-4 rounded-3xl border transition-all ${
                        selectedStoreId === store.id 
                          ? 'bg-white border-white' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-vk-demi text-lg ${
                        selectedStoreId === store.id ? 'bg-black text-white' : 'bg-white/10 text-white'
                      }`}>
                        {store.avatar_url ? (
                          <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          store.name[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`text-[17px] font-sf-ui-medium ${selectedStoreId === store.id ? 'text-black' : 'text-white'}`}>
                          {store.name}
                        </div>
                        <div className={`text-[13px] ${selectedStoreId === store.id ? 'text-black/60' : 'text-white/40'}`}>
                          Опубликовать от имени магазина
                        </div>
                      </div>
                      {selectedStoreId === store.id && (
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                          <ThumbsUp size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <StepIllustration step={8} />
                  </div>
                  <div className="text-[13px] leading-[1.4em] text-white/60 font-sf-ui-light">
                    Публикация от имени магазина повышает доверие покупателей и помогает развивать ваш бренд
                  </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGoNext || publishing}
                    onClick={goNext}
                    className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                      canGoNext && !publishing
                        ? 'bg-white text-black active:scale-[0.9]'
                        : 'bg-white/10 text-white/20'
                    }`}
                  >
                    {publishing ? (
                      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>
                </div>
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

                <div className="mt-4 rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <StepIllustration step={3} />
                  </div>
                  <div className="text-[13px] leading-[1.4em] text-white/60 font-sf-ui-light">
                    Короткое и ёмкое название привлекает больше внимания в ленте объявлений
                  </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGoNext || publishing}
                    onClick={goNext}
                    className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                      canGoNext && !publishing
                        ? 'bg-white text-black active:scale-[0.9]'
                        : 'bg-white/10 text-white/20'
                    }`}
                  >
                    <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
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

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex-1 rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 flex items-center gap-3">
                    <div className="flex-shrink-0 scale-75 origin-center">
                      <StepIllustration step={4} />
                    </div>
                    <div className="text-[12px] leading-[1.3em] text-white/60 font-sf-ui-light">
                      Честное описание состояния товара — залог успешной сделки
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canGoNext || publishing}
                    onClick={goNext}
                    className={`h-[56px] w-[56px] flex-shrink-0 rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                      canGoNext && !publishing
                        ? 'bg-white text-black active:scale-[0.9]'
                        : 'bg-white/10 text-white/20'
                    }`}
                  >
                    <ChevronRight size={24} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
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
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            <NicotineFieldIcon type="brand" />
                          </div>
                          <input
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="HQD, Elf Bar и др."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Тип устройства
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            <NicotineFieldIcon type="format" />
                          </div>
                          <input
                            value={nicotineFormat}
                            onChange={(e) => setNicotineFormat(e.target.value)}
                            placeholder="Одноразовое, pod-система, мод"
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Объем жидкости (мл)
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            <NicotineFieldIcon type="volume" />
                          </div>
                          <input
                            value={nicotineTankVolume}
                            onChange={(e) => handleDecimalChange(e.target.value, setNicotineTankVolume)}
                            inputMode="decimal"
                            placeholder="2.5, 5, 10"
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Емкость аккумулятора (mAh)
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            <NicotineFieldIcon type="battery" />
                          </div>
                          <input
                            value={nicotineBatteryCapacity}
                            onChange={(e) => handleNumericChange(e.target.value, setNicotineBatteryCapacity)}
                            inputMode="numeric"
                            placeholder="400, 850, 1500"
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Крепость никотина (мг/мл)
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            <NicotineFieldIcon type="strength" />
                          </div>
                          <input
                            value={nicotineStrength}
                            onChange={(e) => handleDecimalChange(e.target.value, setNicotineStrength)}
                            inputMode="decimal"
                            placeholder="3, 20, 50"
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Количество затяжек
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            <NicotineFieldIcon type="puffs" />
                          </div>
                          <input
                            value={nicotinePuffs}
                            onChange={(e) => handleNumericChange(e.target.value, setNicotinePuffs)}
                            inputMode="numeric"
                            placeholder="800, 1500, 2500"
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Вкус
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            <NicotineFieldIcon type="flavor" />
                          </div>
                          <input
                            value={nicotineFlavor}
                            onChange={(e) => setNicotineFlavor(e.target.value)}
                            placeholder="Манго, ягодный микс, кола"
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Цвет
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                            <NicotineFieldIcon type="color" />
                          </div>
                          <input
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder="Черный, градиент и др."
                            className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                          />
                        </div>
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
                          onChange={(e) => handleNumericChange(e.target.value, setThingsMemory)}
                          inputMode="numeric"
                          placeholder="128, 256, 512"
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Диагональ/размер
                        </div>
                        <input
                          value={thingsDiagonal}
                          onChange={(e) => handleDecimalChange(e.target.value, setThingsDiagonal)}
                          inputMode="decimal"
                          placeholder='6.1, 13.3, 55'
                          className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-4 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-[14px] leading-[1.4em] text-white/80 font-sf-ui-light">
                          Год выпуска
                        </div>
                        <input
                          value={thingsYear}
                          onChange={(e) => handleNumericChange(e.target.value, setThingsYear)}
                          inputMode="numeric"
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

                <div className="mt-4 rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <StepIllustration step={5} />
                  </div>
                  <div className="text-[13px] leading-[1.4em] text-white/60 font-sf-ui-light">
                    Подробные характеристики помогут покупателю найти ваше объявление через фильтры
                  </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGoNext || publishing}
                    onClick={goNext}
                    className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                      canGoNext && !publishing
                        ? 'bg-white text-black active:scale-[0.9]'
                        : 'bg-white/10 text-white/20'
                    }`}
                  >
                    <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
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
                <div className="mt-4 rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <StepIllustration step={6} />
                  </div>
                  <div className="text-[13px] leading-[1.4em] text-white/60 font-sf-ui-light">
                    Подробное описание помогает покупателю принять решение. Укажите важные детали и особенности товара
                  </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGoNext || publishing}
                    onClick={goNext}
                    className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                      canGoNext && !publishing
                        ? 'bg-white text-black active:scale-[0.9]'
                        : 'bg-white/10 text-white/20'
                    }`}
                  >
                    <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
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
                        onChange={(e) => handleNumericChange(e.target.value, setPrice)}
                        inputMode="numeric"
                        placeholder="0"
                        className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-4 pr-10 text-[16px] leading-[1.4em] text-white outline-none font-sf-ui-light"
                      />
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] leading-[1.4em] text-[#A1A1A1] font-sf-ui-light">
                        ₽
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-[10px] border border-[#2B2B2B] bg-[#111111] p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <StepIllustration step={7} />
                  </div>
                  <div className="text-[13px] leading-[1.4em] text-white/60 font-sf-ui-light">
                    Укажите реальную цену. Слишком высокая цена может отпугнуть покупателей, слишком низкая вызовет подозрения
                  </div>
                </div>

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={!canGoNext || publishing}
                    onClick={goNext}
                    className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                      canGoNext && !publishing
                        ? 'bg-white text-black active:scale-[0.9]'
                        : 'bg-white/10 text-white/20'
                    }`}
                  >
                    {publishing ? (
                      <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
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
        {showPublishAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-[-100px] bg-black/95 flex items-center justify-center z-[9999]"
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
                Объявление опубликовано
              </motion.p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
