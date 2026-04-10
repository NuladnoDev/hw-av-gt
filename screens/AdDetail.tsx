'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'motion/react'
import { ChevronDown, ChevronLeft, ChevronRight, X, Sparkles, Star, ThumbsUp, CircleAlert, ShieldCheck, Share2, Flag, Check, MoreVertical, Info, Heart } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import { AdCard, loadAdsFromStorage, type StoredAd } from './ads'
import FormattedText from '@/components/FormattedText'


const CONDITION_COLORS: Record<string, string> = {
  'Новое': 'text-emerald-400',
  'Отличное': 'text-green-400',
  'Хорошее': 'text-yellow-400',
  'Не очень': 'text-orange-400',
}

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  'Новое': 'Есть чек, сохранена оригинальная упаковка',
  'Отличное': 'Целостность товара сохранена, нет дефектов',
  'Хорошее': 'Есть небольшие дефекты, потёртости и т.п',
  'Не очень': 'Есть видимые дефекты, неисправности',
}

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  'Новое': <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L4.2 6.2l4-.6z"/></svg>,
  'Отличное': <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4 4 8-8"/></svg>,
  'Хорошее': <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M7 12s1 2 3 2 3-2 3-2M7.5 8h.01M12.5 8h.01"/></svg>,
  'Не очень': <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M10 7v4M10 14h.01"/></svg>,
}

const CATEGORY_LABELS: Record<string, string> = {
  nicotine: 'Никотиновые устройства',
  job: 'Работа',
  service: 'Услуги',
  things: 'Вещи, электроника',
  other: 'Другое',
}

type Contact = {
  type: 'vk' | 'telegram'
  url: string
}

const normalizeContacts = (items: unknown): Contact[] => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const anyItem = item as { type?: string; url?: unknown }
      const type = anyItem.type === 'vk' || anyItem.type === 'telegram' ? anyItem.type : null
      const url = typeof anyItem.url === 'string' ? anyItem.url.trim() : ''
      if (!type || !url) return null
      return { type, url }
    })
    .filter((x): x is Contact => !!x)
}

const getShortUrl = (url: string): string => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  if (withoutProtocol.length <= 32) return withoutProtocol
  return `${withoutProtocol.slice(0, 20)}…${withoutProtocol.slice(-7)}`
}

const Dot = ({ index, scrollXProgress, total }: { index: number; scrollXProgress: any; total: number }) => {
  const range = [
    (index - 1) / (total - 1),
    index / (total - 1),
    (index + 1) / (total - 1)
  ]
  
  const widthTransform = useTransform(scrollXProgress, range, [6, 16, 6])
  const opacityTransform = useTransform(scrollXProgress, range, [0.3, 1, 0.3])
  
  const width = useSpring(widthTransform, { stiffness: 300, damping: 30 })
  const opacity = useSpring(opacityTransform, { stiffness: 300, damping: 30 })

  return (
    <motion.div
      style={{
        width,
        opacity,
      }}
      className="h-1.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
    />
  )
}

export default function AdDetail({
  ad,
  onClose,
  onOpenSellerProfile,
  onOpenStoreProfile,
  onOpenChat,
}: {
  ad: StoredAd
  onClose: () => void
  onOpenSellerProfile?: (ad: StoredAd) => void
  onOpenStoreProfile?: (storeId: string) => void
  onOpenChat?: (ad: StoredAd, receiver: { id: string; name: string; avatar: string | null }, initialMessage?: string) => void
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuClosing, setMenuClosing] = useState(false)
  const [aboutAdOpen, setAboutAdOpen] = useState(false)
  const [aboutAdLocked, setAboutAdLocked] = useState(false)
  const [reportAdOpen, setReportAdOpen] = useState(false)
  const [reportAdLocked, setReportAdLocked] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [recommendations, setRecommendations] = useState<StoredAd[]>([])
  const [visibleRecommendations, setVisibleRecommendations] = useState(12)
  const [showRecommendations, setShowRecommendations] = useState(true)
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Трекинг просмотра
  useEffect(() => {
    const track = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabaseClient')
        const client = getSupabase()
        if (!client) return
        await client.rpc('increment_ad_views', { ad_id: ad.id })
      } catch {}
    }
    track()
  }, [ad.id])

  useEffect(() => {
    // Load recommendations from same category or random fallback
    const toTokens = (value: string): string[] =>
      value
        .toLowerCase()
        .split(/[^a-zа-яё0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3)

    const baseTokens = new Set(toTokens(ad.title))

    const getRelated = (allAds: StoredAd[]) => {
      const sameCategory = allAds
        .filter(item => item.id !== ad.id && item.category === ad.category)

      const filteredByTopic = sameCategory.filter((item) => {
        if (baseTokens.size === 0) return true
        const itemTokens = toTokens(item.title)
        return itemTokens.some((token) => baseTokens.has(token))
      })

      const source = filteredByTopic.length >= 2 ? filteredByTopic : sameCategory

      return source
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)
    }

    const loadRecommendations = async () => {
      const savedAds = localStorage.getItem('hw-ads')
      if (savedAds) {
        try {
          const allAds = JSON.parse(savedAds) as StoredAd[]
          const shuffled = getRelated(allAds)

          const hasLogoFallback = shuffled.some((item) => item.imageUrl === '/logo.svg')
          if (hasLogoFallback) {
            const freshAds = await loadAdsFromStorage()
            if (freshAds.length > 0) {
              const freshRelated = getRelated(freshAds)
              if (freshRelated.length >= 2) {
                setRecommendations(freshRelated)
                setVisibleRecommendations(12)
                setShowRecommendations(true)
                return
              }
            }
          }

          if (shuffled.length >= 2) {
            setRecommendations(shuffled)
            setVisibleRecommendations(12)
            setShowRecommendations(true)
          } else {
            setRecommendations([])
            setShowRecommendations(false)
          }
        } catch (e) {
          console.error('Failed to parse ads for recommendations', e)
        }
      } else {
        setRecommendations([])
        setShowRecommendations(false)
      }
    }
    void loadRecommendations()
    // Re-load if ads are updated elsewhere
    const handleAdsUpdated = () => {
      void loadRecommendations()
    }
    window.addEventListener('ads-updated', handleAdsUpdated)
    return () => window.removeEventListener('ads-updated', handleAdsUpdated)
  }, [ad.id, ad.category])

  useEffect(() => {
    const saved = localStorage.getItem('hw-favorites')
    if (saved) {
      const favorites = JSON.parse(saved) as string[]
      setIsFavorite(favorites.includes(ad.id))
    }
  }, [ad.id])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    const saved = localStorage.getItem('hw-favorites')
    let favorites = saved ? (JSON.parse(saved) as string[]) : []
    
    if (isFavorite) {
      favorites = favorites.filter(id => id !== ad.id)
    } else {
      favorites.push(ad.id)
      // Trigger notification/toast logic could be added here
    }
    
    localStorage.setItem('hw-favorites', JSON.stringify(favorites))
    setIsFavorite(!isFavorite)
    window.dispatchEvent(new Event('favorites-updated'))

    // If added to favorites, offer to go there
    if (!isFavorite) {
      // We'll use a simple custom event that HomeScreen can listen to
      window.dispatchEvent(new CustomEvent('show-favorite-added-toast', { 
        detail: { adId: ad.id } 
      }))
    }
  }

  const openMenu = () => {
    setMenuClosing(false)
    setMenuOpen(true)
  }

  const closeMenu = () => {
    setMenuClosing(true)
    setTimeout(() => {
      setMenuOpen(false)
      setMenuClosing(false)
    }, 180)
  }

  const [showAllSpecs, setShowAllSpecs] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showConditionInfo, setShowConditionInfo] = useState(false)
  const [expandedSpecIndex, setExpandedSpecIndex] = useState<number | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null)
  const [storeInfo, setStoreInfo] = useState<{ name: string; avatar_url: string | null } | null>(null)
  const [contactsVisible, setContactsVisible] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const imageScrollRef = useRef<HTMLDivElement | null>(null)
  const contactsRef = useRef<HTMLDivElement | null>(null)
  const recommendationsAnchorRef = useRef<HTMLDivElement | null>(null)

  const { scrollXProgress } = useScroll({
    container: imageScrollRef,
  })

  useEffect(() => {
    if (!recommendations.length) return
    const rootEl = scrollRef.current
    const anchorEl = recommendationsAnchorRef.current
    if (!rootEl || !anchorEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleRecommendations((prev) => prev + 12)
          }
        })
      },
      {
        root: rootEl,
        rootMargin: '220px 0px',
        threshold: 0.1,
      },
    )

    observer.observe(anchorEl)
    return () => observer.disconnect()
  }, [recommendations])

  const images =
    ad.imageUrls && ad.imageUrls.length > 0
      ? ad.imageUrls
      : ad.imageUrl
        ? [ad.imageUrl]
        : []

  const scrollImages = (direction: 'left' | 'right') => {
    if (!imageScrollRef.current) return
    const container = imageScrollRef.current
    const scrollAmount = container.clientWidth
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  const conditionColor =
    (ad.condition && CONDITION_COLORS[ad.condition]) || 'text-gray-300'

  const locationText = ad.location ?? 'Кадуй'
  const categoryLabel = ad.category ? CATEGORY_LABELS[ad.category] ?? ad.category : null

  const createdDate =
    ad.createdAt && Number.isFinite(ad.createdAt)
      ? new Date(ad.createdAt)
      : null

  const publishedText = createdDate
    ? createdDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
      })
    : ''

  const sellerTag = (ad.userTag ?? 'продавец').replace(/^@/, '')

  const descriptionText =
    ad.description && ad.description.trim().length > 0 ? ad.description : ad.title

  const sellerName = ad.storeId && storeInfo ? storeInfo.name : (ad.userTag || 'Продавец')
  const sellerTypeLabel = ad.storeId ? 'Магазин' : 'Частное лицо'

  // Умный пересказ без API
  const generateSummary = () => {
    if (aiSummary) { setAiSummaryOpen(true); return }
    setAiLoading(true)
    setAiSummaryOpen(true)
    setTimeout(() => {
      const s = ad.specs ?? []
      const get = (label: string) => s.find(x => x.label.toLowerCase().includes(label.toLowerCase()))?.value

      const parts: string[] = []
      const cat = ad.category

      // Состояние
      if (ad.condition) parts.push(`Состояние: ${ad.condition}.`)

      // Характеристики по категории — главный источник
      if (cat === 'nicotine') {
        const brand = get('Бренд'), type = get('Тип'), puffs = get('затяжек'), strength = get('Крепость'), flavor = get('Вкус'), battery = get('аккумулятор'), volume = get('Объем')
        if (brand) parts.push(`Бренд: ${brand}.`)
        if (type) parts.push(`Тип: ${type}.`)
        if (volume) parts.push(`Объём жидкости: ${volume}.`)
        if (battery) parts.push(`Аккумулятор: ${battery}.`)
        if (strength) parts.push(`Крепость: ${strength}.`)
        if (puffs) parts.push(`Затяжек: ${puffs}.`)
        if (flavor) parts.push(`Вкус: ${flavor}.`)
      } else if (cat === 'things') {
        const brand = get('Бренд'), model = get('Модель'), memory = get('Память'), diag = get('Диагональ'), year = get('Год'), kit = get('Комплект'), warranty = get('Гарантия'), color = get('Цвет')
        if (brand) parts.push(`Бренд: ${brand}.`)
        if (model) parts.push(`Модель: ${model}.`)
        if (memory) parts.push(`Память: ${memory}.`)
        if (diag) parts.push(`Экран: ${diag}.`)
        if (year) parts.push(`Год выпуска: ${year}.`)
        if (warranty) parts.push(`Гарантия: ${warranty}.`)
        if (kit) parts.push(`Комплект: ${kit}.`)
        if (color) parts.push(`Цвет: ${color}.`)
      } else if (cat === 'service') {
        const type = get('Вид'), exp = get('Опыт'), format = get('Формат'), region = get('Регион'), price = get('Стоимость')
        if (type) parts.push(`Услуга: ${type}.`)
        if (exp) parts.push(`Опыт: ${exp}.`)
        if (format) parts.push(`Формат: ${format}.`)
        if (price) parts.push(`Стоимость: ${price}.`)
        if (region) parts.push(`Регион: ${region}.`)
      } else if (cat === 'job') {
        const pos = get('Должность'), salary = get('Зарплата'), schedule = get('График'), format = get('Формат'), exp = get('Требуемый'), employment = get('Занятость')
        if (pos) parts.push(`Вакансия: ${pos}.`)
        if (salary) parts.push(`Зарплата: ${salary}.`)
        if (employment) parts.push(`Занятость: ${employment}.`)
        if (schedule) parts.push(`График: ${schedule}.`)
        if (format) parts.push(`Формат: ${format}.`)
        if (exp) parts.push(`Требуемый опыт: ${exp}.`)
      } else {
        // Все характеристики
        s.forEach(spec => parts.push(`${spec.label}: ${spec.value}.`))
      }

      // Описание (если есть и не совпадает с названием)
      if (ad.description && ad.description.trim().length > 10 && ad.description.trim() !== ad.title) {
        const desc = ad.description.trim()
        parts.push(desc.length > 120 ? desc.slice(0, 120).replace(/\s\S*$/, '') + '...' : desc)
      }

      // Цена
      parts.push(`Цена: ${ad.price} ₽.`)

      // Локация
      if (ad.location) parts.push(`Местоположение: ${ad.location}.`)

      setAiSummary(parts.length > 1 ? parts.join(' ') : `${ad.title}. Цена: ${ad.price} ₽.`)
      setAiLoading(false)
    }, 600)
  }

  const openChatWithMessage = (text?: string) => {
    if (onOpenChat && ad.userId) {
      onOpenChat(
        ad,
        {
          id: ad.userId,
          name: sellerName,
          avatar: ad.storeId && storeInfo ? storeInfo.avatar_url : sellerAvatar,
        },
        text,
      )
      return true
    }
    return false
  }

  const titleTokens = ad.title
    .split(/[\s,./\\|:;"'`~!@#$%^&*()_+=?<>[\]{}-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .slice(0, 2)

  const findMoreQueries = Array.from(
    new Set([
      ad.title,
      ...titleTokens.map((token) => `${token} в ${locationText}`),
      ...titleTokens.map((token) => `${token} ${ad.condition || ''}`.trim()),
      categoryLabel ? `${categoryLabel} ${locationText}` : '',
      `${ad.title} дешевле`,
      `${ad.title} с доставкой`,
    ].filter(Boolean)),
  ).slice(0, 6)

  const handlePurchase = () => {
    if (openChatWithMessage()) {
      return
    }
    setContactsVisible((prev) => {
      if (prev) {
        const container = scrollRef.current
        const section = contactsRef.current
        if (!container || !section) return prev
        const containerRect = container.getBoundingClientRect()
        const sectionRect = section.getBoundingClientRect()
        const offset = sectionRect.top - containerRect.top
        container.scrollTo({
          top: container.scrollTop + offset - 16,
          behavior: 'smooth',
        })
        return prev
      }
      return true
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const detail = {
      showNextInNav: !mediaViewerOpen,
      enabled: !mediaViewerOpen,
      label: 'Написать',
      mode: mediaViewerOpen ? null : 'detail' as const,
    }
    const ev = new CustomEvent('ads-create-nav-state', { detail })
    window.dispatchEvent(ev)

    window.addEventListener('ad-detail-purchase', handlePurchase)

    return () => {
      window.removeEventListener('ad-detail-purchase', handlePurchase)
      const resetEv = new CustomEvent('ads-create-nav-state', {
        detail: { showNextInNav: false, enabled: false, mode: null },
      })
      window.dispatchEvent(resetEv)
    }
  }, [ad, onOpenChat, storeInfo, sellerAvatar, mediaViewerOpen])

  useEffect(() => {
    if (!contactsVisible) return
    if (typeof window === 'undefined') return
    const container = scrollRef.current
    const section = contactsRef.current
    if (!container || !section) return
    const containerRect = container.getBoundingClientRect()
    const sectionRect = section.getBoundingClientRect()
    const offset = sectionRect.top - containerRect.top
    container.scrollTo({
      top: container.scrollTop + offset - 16,
      behavior: 'smooth',
    })
  }, [contactsVisible])

  useEffect(() => {
    const userId = ad.userId
    if (!userId) return
    let cancelled = false
    const load = async () => {
      try {
        if (typeof window === 'undefined') return
        let next: Contact[] = []
        try {
          const raw = window.localStorage.getItem('hw-profiles')
          const map = raw
            ? (JSON.parse(raw) as Record<string, { contacts?: unknown }>)
            : {}
          const localContacts = normalizeContacts(map[userId]?.contacts)
          if (localContacts.length > 0) {
            next = localContacts
          }
        } catch {
        }
        const client = getSupabase()
        if (client) {
          const { data, error } = await client
            .from('profiles')
            .select('contacts, avatar_url')
            .eq('id', userId)
            .maybeSingle()
          if (!error && data) {
            const dbContacts = normalizeContacts(
              (data as { contacts?: unknown }).contacts,
            )
            if (dbContacts.length > 0) {
              next = dbContacts
            }
            if ((data as { avatar_url?: string }).avatar_url) {
              setSellerAvatar((data as { avatar_url: string }).avatar_url)
            }
          }
        }
        if (!cancelled) {
          setContacts(next)
        }
      } catch {
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [ad.userId])

  useEffect(() => {
    if (!ad.storeId) return
    let cancelled = false
    const loadStore = async () => {
      const client = getSupabase()
      if (!client) return
      const { data, error } = await client
        .from('stores')
        .select('name, avatar_url')
        .eq('id', ad.storeId)
        .maybeSingle()
      if (!cancelled && !error && data) {
        setStoreInfo(data as { name: string; avatar_url: string | null })
      }
    }
    loadStore()
    return () => { cancelled = true }
  }, [ad.storeId])

  const specs: { label: string; value: string }[] = []
  if (categoryLabel) {
    specs.push({ label: 'Категория', value: categoryLabel })
  }
  if (locationText) {
    specs.push({ label: 'Город', value: locationText })
  }
  if (Array.isArray(ad.specs)) {
    for (const s of ad.specs) {
      if (!s || typeof s.label !== 'string' || typeof s.value !== 'string') continue
      if (!s.label || !s.value) continue
      specs.push({ label: s.label, value: s.value })
    }
  }

  const mainSpecsCount = 5
  const mainSpecs = specs.slice(0, mainSpecsCount)
  const extraSpecs = specs.slice(mainSpecsCount)
  const hasExtraSpecs = extraSpecs.length > 0

  const applyFindMoreQuery = (query: string) => {
    onClose()
    window.dispatchEvent(new CustomEvent('ads-apply-search', {
      detail: { query, category: ad.category ?? null },
    }))
  }

  return (
    <motion.div
      className="absolute inset-0 z-[120] flex flex-col bg-[#0D0D0D] text-white"
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="flex h-full flex-col relative">
        {/* Fixed Back Button (Liquid Glass Style) */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (mediaViewerOpen) {
              setMediaViewerOpen(false)
            } else {
              onClose()
            }
          }}
          className="absolute left-5 z-[130] w-11 h-11 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:bg-black/50"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset, 10px))' }}
        >
          <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
        </motion.button>

        {/* Favorite Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleFavorite}
          className="absolute right-[68px] z-[130] w-11 h-11 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:bg-black/50"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset, 10px))' }}
        >
          <Heart 
            className={`w-6 h-6 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} 
            strokeWidth={2.5} 
          />
        </motion.button>

        {/* Fixed More Menu Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={openMenu}
          className="absolute right-5 z-[130] w-11 h-11 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:bg-black/50"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset, 10px))' }}
        >
          <MoreVertical className="w-6 h-6 text-white" strokeWidth={2.5} />
        </motion.button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hidden" ref={scrollRef}>
          {/* Images */}
          <div className="relative group pt-2">
            {images.length > 0 ? (
              <div className="relative overflow-hidden rounded-t-[26px] bg-zinc-950 border border-white/[0.06] border-b-0">
                <div 
                  ref={imageScrollRef}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hidden"
                  onScroll={(e) => {
                    const container = e.currentTarget
                    const slide = Math.round(container.scrollLeft / container.clientWidth)
                    if (slide !== currentSlide) setCurrentSlide(slide)
                  }}
                >
                  {images.map((src, index) => (
                    <motion.div 
                      key={index} 
                      className="min-w-full snap-center outline-none cursor-zoom-in"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setCurrentMediaIndex(index)
                        setMediaViewerOpen(true)
                      }}
                    >
                      <div className="aspect-[4/5]">
                        <img
                          src={src}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {images.length > 1 && (
                  <>
                    {/* Navigation Arrows */}
                    <button
                      type="button"
                      onClick={() => scrollImages('left')}
                      className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hidden md:flex hover:bg-black/70"
                    >
                      <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollImages('right')}
                      className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hidden md:flex hover:bg-black/70"
                    >
                      <ChevronRight className="h-5 w-5 text-white" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                      {images.map((_, i) => {
                        // Logic for real-time liquid dots
                        return (
                          <div key={i} className="flex items-center justify-center h-4">
                            <Dot 
                              index={i} 
                              scrollXProgress={scrollXProgress} 
                              total={images.length} 
                            />
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-[4/5] bg-zinc-900 flex items-center justify-center rounded-[28px]">
                <span className="text-sm text-zinc-500 font-sf-ui-medium">
                  Без изображения
                </span>
              </div>
            )}
          </div>

          <div className="px-4 pb-24">
            {/* Title & Seller */}
            <div className="-mx-4 py-5 flex flex-col gap-4 rounded-b-[24px] rounded-t-none bg-white/[0.025] border border-white/[0.05] border-t-0 px-4 mt-0">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-[26px] font-ttc-bold leading-[1.15] text-white/95 tracking-tight">
                  {ad.title}
                </h1>
                {categoryLabel && (
                  <div className="text-[13px] text-white/40 font-sf-ui-medium uppercase tracking-wider">
                    {categoryLabel}
                  </div>
                )}
              </div>
              
              <span className="text-[30px] font-ttc-bold leading-none tracking-tight text-white/95">
                {Number(ad.price).toLocaleString('ru-RU')} ₽
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                {ad.condition && (
                  <button
                    type="button"
                    onClick={() => setShowConditionInfo(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] active:bg-white/[0.07] transition-colors"
                  >
                    <span className="shrink-0">
                      {ad.condition === 'Новое' && (
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4z"/>
                        </svg>
                      )}
                      {ad.condition === 'Отличное' && (
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 8l3.5 3.5 6.5-7"/>
                        </svg>
                      )}
                      {ad.condition === 'Хорошее' && (
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 10s1 2 3 2 3-2 3-2M6 6h.01M10 6h.01"/>
                          <circle cx="8" cy="8" r="6"/>
                        </svg>
                      )}
                      {ad.condition === 'Не очень' && (
                        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="8" r="6"/>
                          <path d="M8 5v3M8 11h.01"/>
                        </svg>
                      )}
                    </span>
                    <span className={`text-[12px] font-sf-ui-medium ${
                      ad.condition === 'Новое' ? 'text-emerald-400' :
                      ad.condition === 'Отличное' ? 'text-green-400' :
                      ad.condition === 'Хорошее' ? 'text-yellow-400' :
                      ad.condition === 'Не очень' ? 'text-orange-400' : 'text-white/60'
                    }`}>{ad.condition}</span>
                  </button>
                )}

                {categoryLabel && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <span className="text-[12px] font-ttc-demibold uppercase tracking-wider translate-y-[1px]">{categoryLabel}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.05] text-white/45">
                  <span className="text-[12px] font-sf-ui-medium uppercase tracking-wider">{locationText}</span>
                  {publishedText && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[12px] font-sf-ui-medium uppercase tracking-wider">{publishedText}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handlePurchase}
                  className="group w-full flex items-center justify-center gap-3 -translate-x-14 text-[13px] font-sf-ui-semibold text-white/88 active:opacity-70 transition-opacity"
                >
                  <span className="h-[44px] w-[44px] rounded-full bg-white text-black shadow-[0_8px_18px_rgba(0,0,0,0.28)] flex items-center justify-center">
                    <ChevronRight size={22} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span>{'\u041f\u0440\u0438\u043e\u0431\u0440\u0435\u0441\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0443'}</span>
                </motion.button>
              </div>
              <div className="mt-4 h-px w-full bg-white/[0.06]" />

              <div className="space-y-4 pt-1">
                <h2 className="text-[17px] font-ttc-bold text-white/90">
                  Характеристики
                </h2>
                <div className="grid gap-y-3.5">
                  {mainSpecs.map((spec) => (
                    <div key={spec.label} className="flex items-baseline justify-between gap-4">
                      <span className="text-[14px] text-white/40 font-sf-ui-light whitespace-nowrap">
                        {spec.label}
                      </span>
                      <div className="h-px flex-1 bg-white/5 mb-1" />
                      <span className="text-[14px] text-white/90 font-sf-ui-medium text-right">
                        {spec.value}
                      </span>
                    </div>
                  ))}

                  <AnimatePresence initial={false}>
                    {showAllSpecs && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden grid gap-y-3.5"
                      >
                        {extraSpecs.map((spec) => (
                          <div key={spec.label} className="flex items-baseline justify-between gap-4">
                            <span className="text-[14px] text-white/40 font-sf-ui-light whitespace-nowrap">
                              {spec.label}
                            </span>
                            <div className="h-px flex-1 bg-white/5 mb-1" />
                            <span className="text-[14px] text-white/90 font-sf-ui-medium text-right">
                              {spec.value}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {hasExtraSpecs && (
                    <button
                      type="button"
                      className="flex items-center gap-2 text-[13px] text-blue-400 font-sf-ui-medium pt-2 active:opacity-60 transition-opacity"
                      onClick={() => setShowAllSpecs(!showAllSpecs)}
                    >
                      {showAllSpecs ? 'Свернуть' : `Показать все (${specs.length})`}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllSpecs ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {descriptionText && (
                <>
                  <div className="h-px w-full bg-white/[0.06]" />
                  <div className="space-y-3">
                    <h2 className="text-[17px] font-ttc-bold text-white/90">Описание</h2>
                    <div className="relative">
                      <p
                        className={`text-[15px] text-white/70 font-sf-ui-light leading-relaxed transition-all duration-300 ${
                          !showFullDescription && descriptionText.length > 200 ? 'line-clamp-4' : ''
                        }`}
                      >
                        <FormattedText text={descriptionText} />
                      </p>
                      {!showFullDescription && descriptionText.length > 200 && (
                        <button
                          type="button"
                          className="mt-2 text-[14px] text-blue-400 font-sf-ui-medium active:opacity-60 transition-opacity"
                          onClick={() => setShowFullDescription(true)}
                        >
                          Читать полностью
                        </button>
                      )}
                      {showFullDescription && descriptionText.length > 200 && (
                        <button
                          type="button"
                          className="mt-2 text-[14px] text-blue-400 font-sf-ui-medium active:opacity-60 transition-opacity"
                          onClick={() => setShowFullDescription(false)}
                        >
                          Свернуть
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Пересказ ИИ — внутри плашки описания */}
                  <div className="mt-3 border-t border-white/[0.05] pt-3">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between active:opacity-70 transition-opacity"
                      onClick={generateSummary}
                    >
                      <div className="flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          {/* Левое полушарие */}
                          <path d="M12 5C9 5 6 7 6 10c0 1.5.5 2.5 1 3.5C6 15 6 17 7 18c1 1 2.5 1 4 1"/>
                          {/* Правое полушарие */}
                          <path d="M12 5c3 0 6 2 6 5 0 1.5-.5 2.5-1 3.5 1 1.5 1 3.5 0 4.5-1 1-2.5 1-4 1"/>
                          {/* Центральная линия */}
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          {/* Извилины левые */}
                          <path d="M9 9c-1 .5-1.5 1.5-1 2.5"/>
                          <path d="M8 13c-.5 1 0 2 1 2.5"/>
                          {/* Извилины правые */}
                          <path d="M15 9c1 .5 1.5 1.5 1 2.5"/>
                          <path d="M16 13c.5 1 0 2-1 2.5"/>
                        </svg>
                        <span className="text-[12px] font-sf-ui-medium text-white/45 leading-none">Быстрый пересказ с AI</span>
                      </div>
                      <motion.svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="text-white/20"
                        animate={{ rotate: aiSummaryOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path d="M6 9l6 6 6-6"/>
                      </motion.svg>
                    </button>

                    <AnimatePresence>
                      {aiSummaryOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3">
                            {aiLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  {[0,1,2].map(i => (
                                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60"
                                      animate={{ opacity: [0.3, 1, 0.3] }}
                                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                  ))}
                                </div>
                                <span className="text-[12px] text-white/25 font-sf-ui-light">Анализирую...</span>
                              </div>
                            ) : (
                              <p className="text-[13px] text-white/55 font-sf-ui-light leading-relaxed">{aiSummary}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => {
                if (ad.storeId && onOpenStoreProfile) {
                  onOpenStoreProfile(ad.storeId)
                } else if (onOpenSellerProfile) {
                  onOpenSellerProfile(ad)
                }
              }}
              className="mt-5 w-full px-1 py-3 text-left active:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {ad.storeId && storeInfo ? (
                    storeInfo.avatar_url ? (
                      <img src={storeInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[18px] font-ttc-bold">
                        <span>{storeInfo.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )
                  ) : sellerAvatar ? (
                    <img src={sellerAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[18px] font-ttc-bold">
                      <span>{sellerTag.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[22px] font-ttc-bold text-white/95 truncate">{sellerName}</div>
                  <div className="text-[13px] text-white/45 font-sf-ui-medium mt-0.5">{sellerTypeLabel}</div>
                  <div className="text-[13px] text-emerald-400 font-sf-ui-medium mt-2">Открыть профиль</div>
                </div>
              </div>
            </motion.button>

            <div className="mt-3 space-y-3 px-1">
              <h2 className="text-[19px] font-ttc-bold text-white/110">Найти больше вариантов</h2>
              <div className="space-y-2.5">
                {findMoreQueries.map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => applyFindMoreQuery(query)}
                    className="w-full px-0 py-2.5 flex items-center justify-between active:opacity-80 transition-opacity"
                  >
                    <span className="text-[14px] text-white/82 font-sf-ui-medium text-left pr-3 truncate">
                      {query}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/35 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Contacts Section */}
            {contactsVisible && (
              <div 
                ref={contactsRef}
                className="mt-6 space-y-4 py-6 rounded-[22px] bg-white/[0.02] border border-white/[0.05] px-3 animate-in fade-in slide-in-from-top-4 duration-500"
              >
                <h2 className="text-[17px] font-ttc-bold text-white/90">
                  Способы связи
                </h2>
                {contacts.length > 0 ? (
                  <div className="grid gap-3">
                    {contacts.map((c, i) => (
                      <a
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.type === 'telegram' ? 'bg-[#24A1DE]/10 text-[#24A1DE]' : 'bg-[#0077FF]/10 text-[#0077FF]'}`}>
                            <img 
                              src={c.type === 'telegram' ? '/interface/telegram.svg' : '/interface/vk.svg'} 
                              alt={c.type}
                              className="w-5 h-5"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-sf-ui-medium capitalize">{c.type}</span>
                            <span className="text-[12px] text-white/40 font-sf-ui-light">{getShortUrl(c.url)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/20" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[14px] text-white/40 font-sf-ui-light">
                      Продавец не указал способы связи в профиле
                    </p>
                  </div>
                )}

                <div className="mt-4 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-6">
                  <div className="p-4 rounded-xl bg-blue-500/15 text-blue-400">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-[18px] font-ttc-bold text-white/95">Безопасность</div>
                    <div className="text-[15px] text-white/50 font-sf-ui-light leading-relaxed">
                      Никогда не переводите предоплату. Проверяйте товар.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {showRecommendations && recommendations.length > 0 && (
              <div className="mt-12 -mx-4 overflow-hidden rounded-[22px] border border-white/[0.05] bg-white/[0.02] pb-6 pt-5">
                <div className="flex items-start justify-between px-4">
                  <h2 className="-translate-y-0.5 text-[20px] font-ttc-bold text-white/95">{'\u0412\u0430\u043c \u043c\u043e\u0436\u0435\u0442 \u043f\u043e\u043d\u0440\u0430\u0432\u0438\u0442\u044c\u0441\u044f'}</h2>
                  <button
                    type="button"
                    onClick={() => setShowRecommendations(false)}
                    className="text-[13px] font-sf-ui-medium text-white/58 active:opacity-70 transition-opacity"
                  >
                    {'\u0421\u043a\u0440\u044b\u0442\u044c'}
                  </button>
                </div>
                
                <div 
                  className="grid grid-cols-2"
                  style={{
                    columnGap: 1,
                    rowGap: 1,
                    width: '100%',
                  }}
                >
                  {Array.from(
                    { length: Math.max(visibleRecommendations, recommendations.length) },
                    (_, index) => recommendations[index % recommendations.length],
                  ).map((rec, index) => (
                    <AdCard
                      key={`${rec.id}-${index}`}
                      id={rec.id}
                      title={rec.title}
                      price={rec.price}
                      imageUrl={rec.imageUrl}
                      username={(rec.userTag || 'user').replace(/^@/, '')}
                      location={rec.location || undefined}
                      condition={rec.condition || undefined}
                      createdAt={rec.createdAt}
                      onClick={() => {
                        // Close current and open new ad
                        onClose()
                        // Small delay to allow close animation
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('open-ad-detail', { detail: rec }))
                        }, 300)
                      }}
                    />
                  ))}
                </div>
                <div ref={recommendationsAnchorRef} className="h-2 w-full" />
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showConditionInfo && ad.condition && (
          <>
            <motion.div
              className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowConditionInfo(false)}
            />
            <div className="fixed inset-0 z-[220] flex items-end justify-center pointer-events-none">
              <motion.div
                initial={{ translateY: '100%' }}
                animate={{ translateY: 0 }}
                exit={{ translateY: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="relative w-full bg-[#121212] border-t border-white/10 rounded-t-[32px] px-6 pt-7 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pointer-events-auto"
              >
                <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/15" />
                <h3 className="text-[20px] font-sf-ui-medium text-white mb-5">Состояние товара</h3>
                <div className="space-y-2.5 mb-6">
                  {[
                    {
                      label: 'Новое',
                      desc: 'Есть чек, сохранена оригинальная упаковка',
                      color: 'text-emerald-400',
                      svg: <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L4.2 6.2l4-.6z"/></svg>,
                    },
                    {
                      label: 'Отличное',
                      desc: 'Целостность товара сохранена, нет дефектов',
                      color: 'text-green-400',
                      svg: <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4 4 8-8"/></svg>,
                    },
                    {
                      label: 'Хорошее',
                      desc: 'Есть небольшие дефекты, потёртости и т.п',
                      color: 'text-yellow-400',
                      svg: <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M7 12s1 2 3 2 3-2 3-2M7.5 8h.01M12.5 8h.01"/></svg>,
                    },
                    {
                      label: 'Не очень',
                      desc: 'Есть видимые дефекты, неисправности',
                      color: 'text-orange-400',
                      svg: <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M10 7v4M10 14h.01"/></svg>,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-start gap-3 rounded-2xl px-4 py-3 border transition-all ${
                        ad.condition === item.label
                          ? 'bg-white/[0.06] border-white/[0.12]'
                          : 'bg-white/[0.02] border-white/[0.04]'
                      }`}
                    >
                      <div className={`shrink-0 mt-0.5 ${item.color}`}>{item.svg}</div>
                      <div>
                        <div className={`text-[14px] font-sf-ui-medium ${ad.condition === item.label ? item.color : 'text-white/50'}`}>{item.label}</div>
                        <div className="text-[12px] text-white/35 font-sf-ui-light mt-0.5">{item.desc}</div>
                      </div>
                      {ad.condition === item.label && (
                        <div className="ml-auto shrink-0">
                          <svg viewBox="0 0 16 16" className={`w-4 h-4 ${item.color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 8l3.5 3.5 6.5-7"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowConditionInfo(false)}
                  className="h-14 w-full rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                >
                  Понятно
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mediaViewerOpen && (
          <MediaViewer
            title={ad.title}
            images={images}
            initialIndex={currentMediaIndex}
            onClose={() => setMediaViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-end p-6 pt-[calc(env(safe-area-inset-top,0px)+var(--home-header-offset,10px)+60px)]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-black/20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
              animate={menuClosing ? { opacity: 0, scale: 0.95, y: -20, x: 20 } : { opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="relative w-[220px] overflow-hidden rounded-[24px] bg-[#1C1C1E] border border-white/10 shadow-2xl"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    const shareUrl = `${window.location.origin}/?adId=${ad.id}`
                    if (navigator.share) {
                      navigator.share({
                        title: ad.title,
                        text: `${ad.title} — ${ad.price} ₽`,
                        url: shareUrl
                      }).catch(() => {})
                    } else {
                      navigator.clipboard.writeText(shareUrl).catch(() => {})
                    }
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 active:bg-white/5 transition-colors"
                >
                  <span className="text-[15px] font-sf-ui-medium text-white/90">Поделиться</span>
                  <Share2 className="w-5 h-5 text-white/40" strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    setReportAdOpen(true)
                    setReportAdLocked(true)
                    setReportSent(false)
                    setTimeout(() => setReportAdLocked(false), 500)
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 active:bg-white/5 transition-colors"
                >
                  <span className="text-[15px] font-sf-ui-medium text-red-400">Пожаловаться</span>
                  <Flag className="w-5 h-5 text-red-400/60" strokeWidth={2} />
                </button>

                <div className="h-[1px] bg-white/5 mx-2" />

                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    setAboutAdOpen(true)
                    setAboutAdLocked(true)
                    setTimeout(() => setAboutAdLocked(false), 500)
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 active:bg-white/5 transition-colors"
                >
                  <span className="text-[15px] font-sf-ui-medium text-white/90">Об объявлении</span>
                  <Info className="w-5 h-5 text-white/40" strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aboutAdOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => {
                if (aboutAdLocked) return
                setAboutAdOpen(false)
              }}
            />
            
             <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
               <motion.div
                 className="relative w-full rounded-t-[32px] bg-[#121212] border-t border-white/10 p-8 flex flex-col items-center space-y-6 pointer-events-auto pb-[calc(env(safe-area-inset-bottom, 0px) + 24px)]"
                 initial={{ translateY: '100%' }}
                 animate={{ translateY: 0 }}
                 exit={{ translateY: '100%' }}
                 transition={{ type: 'spring', damping: 30, stiffness: 350 }}
               >
                 <div className="w-12 h-1 bg-white/10 rounded-full mb-2" />
                 
                 <div className="w-full space-y-6">
                   <div className="flex flex-col items-center text-center space-y-2">
                     <h3 className="text-[22px] font-ttc-bold text-white leading-tight">
                       Об объявлении
                     </h3>
                     <p className="text-[14px] text-white/40 font-sf-ui-light">
                       Техническая информация и статус
                     </p>
                   </div>

                   <div className="grid grid-cols-1 gap-4 w-full">
                     <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <span className="text-[14px] text-white/40 font-sf-ui-medium tracking-wider">Дата публикации</span>
                       <span className="text-[15px] text-white/90 font-sf-ui-medium">
                         {createdDate ? createdDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Неизвестно'}
                       </span>
                     </div>

                     <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <span className="text-[14px] text-white/40 font-sf-ui-medium tracking-wider">Локация</span>
                       <span className="text-[15px] text-white/90 font-sf-ui-medium">{locationText}</span>
                     </div>

                     <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <span className="text-[14px] text-white/40 font-sf-ui-medium tracking-wider">Автор</span>
                       <span className="text-[15px] text-white/90 font-sf-ui-medium">@{sellerTag}</span>
                     </div>

                     <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                       <span className="text-[14px] text-white/40 font-sf-ui-medium tracking-wider">ID Объявления</span>
                       <span className="text-[13px] text-white/60 font-mono break-all select-all">{ad.id}</span>
                     </div>
                   </div>

                   <button
                     type="button"
                     className="h-14 w-full rounded-[22px] bg-white/10 text-white font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                     onClick={() => setAboutAdOpen(false)}
                   >
                     Закрыть
                   </button>
                 </div>
               </motion.div>
             </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportAdOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => {
                if (reportAdLocked) return
                setReportAdOpen(false)
              }}
            />
            
             <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
               <motion.div
                 className="relative w-full rounded-t-[32px] bg-[#121212] border-t border-white/10 p-8 flex flex-col items-center space-y-6 pointer-events-auto pb-[calc(env(safe-area-inset-bottom, 0px) + 24px)]"
                 initial={{ translateY: '100%' }}
                 animate={{ translateY: 0 }}
                 exit={{ translateY: '100%' }}
                 transition={{ type: 'spring', damping: 30, stiffness: 350 }}
               >
                 <div className="w-12 h-1 bg-white/10 rounded-full mb-2" />
                 
                 <div className="w-full space-y-6">
                   <div className="flex flex-col items-center text-center space-y-2">
                     <h3 className="text-[22px] font-ttc-bold text-white leading-tight">
                       {reportSent ? 'Жалоба отправлена' : 'Пожаловаться'}
                     </h3>
                     <p className="text-[14px] text-white/40 font-sf-ui-light">
                       {reportSent 
                         ? 'Мы получили ваше обращение и скоро разберемся в ситуации. Спасибо за бдительность!' 
                         : 'Вы собираетесь отправить жалобу на это объявление. Наши модераторы проверят его на соответствие правилам.'}
                     </p>
                   </div>

                   {!reportSent && (
                     <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                       <span className="text-[14px] text-white/40 font-sf-ui-medium uppercase tracking-wider">ID Объявления</span>
                       <span className="text-[13px] text-white/60 font-mono break-all">{ad.id}</span>
                     </div>
                   )}

                   <div className="flex flex-col gap-3 w-full">
                     {!reportSent ? (
                       <>
                         <button
                           type="button"
                           className="h-14 w-full rounded-[22px] bg-red-500 text-white font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                           onClick={() => {
                             if (reportAdLocked) return
                             setReportSent(true)
                           }}
                         >
                           Отправить жалобу
                         </button>
                         <button
                           type="button"
                           className="h-14 w-full rounded-[22px] bg-white/5 text-white/70 font-sf-ui-medium text-[15px] active:scale-[0.97] transition-all"
                           onClick={() => setReportAdOpen(false)}
                         >
                           Отмена
                         </button>
                       </>
                     ) : (
                       <button
                         type="button"
                         className="h-14 w-full rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                         onClick={() => setReportAdOpen(false)}
                       >
                         Понятно
                       </button>
                     )}
                   </div>
                 </div>
               </motion.div>
             </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MediaViewer({
  title,
  images,
  initialIndex,
  onClose,
}: {
  title: string
  images: string[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const constraintsRef = useRef(null)

  // Swiping and closing logic
  const onDragEnd = (event: any, info: any) => {
    if (scale > 1) return // Don't swipe while zoomed
    
    const swipeThreshold = 50
    const velocityThreshold = 200

    // Horizontal swipe for navigation
    if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      if (info.offset.x < -swipeThreshold && index < images.length - 1) {
        setIndex(index + 1)
      } else if (info.offset.x > swipeThreshold && index > 0) {
        setIndex(index - 1)
      }
    } 
    // Vertical swipe for closing
    else if (Math.abs(info.offset.y) > 150 || Math.abs(info.velocity.y) > velocityThreshold) {
      onClose()
    }
  }

  // Zoom handling
  const handlePinch = (event: any) => {
    // Simple pinch-to-zoom simulation for mobile touch
    if (event.touches && event.touches.length === 2) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY)
      
      // Store initial distance on touchstart and calculate scale relative to it
      // For simplicity here, we'll use a slightly more automated approach via framer-motion props
    }
  }

  const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (scale > 1) {
      setScale(1)
    } else {
      setScale(2.5)
      // Zoom towards click point
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
      setOrigin({ x: clientX, y: clientY })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center touch-none"
    >
      {/* Header with Title & Close Button */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 z-[160]" style={{ height: 'calc(env(safe-area-inset-top, 0px) + 60px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex-1 mr-4 overflow-hidden">
          <span className="text-[16px] font-sf-ui-medium text-white/90 truncate block">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all pointer-events-auto"
            onClick={async (e) => {
              e.stopPropagation()
              const url = images[index]
              try {
                const res = await fetch(url)
                const blob = await res.blob()
                const objectUrl = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = objectUrl
                a.download = `photo_${Date.now()}.jpg`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(objectUrl)
              } catch {
                window.open(url, '_blank')
              }
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button
            onClick={onClose}
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-90 transition-all pointer-events-auto"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Media Container */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden" ref={constraintsRef}>
        <motion.div
          key={index}
          drag={scale > 1 ? true : "y"}
          dragConstraints={scale > 1 ? { left: -500, right: 500, top: -500, bottom: 500 } : { top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDragEnd={onDragEnd}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full flex items-center justify-center"
        >
          <motion.img
            src={images[index]}
            alt=""
            animate={{ scale }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onPointerDown={(e) => {
              if (e.detail === 2) handleDoubleClick(e)
            }}
            className="max-w-full max-h-full object-contain select-none shadow-2xl"
            style={{ 
              touchAction: 'none',
              transformOrigin: scale > 1 ? `${origin.x}px ${origin.y}px` : 'center'
            }}
          />
        </motion.div>
      </div>

      {/* Hints & Pagination */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6 z-[160] pointer-events-none">
        {images.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[12px] font-sf-ui-medium text-white/60 uppercase tracking-widest">
              Свайп для переключения
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </motion.div>
        )}

        {images.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {images.map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  width: i === index ? 16 : 6,
                  opacity: i === index ? 1 : 0.3,
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="h-1.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]"
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}




