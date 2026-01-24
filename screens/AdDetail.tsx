'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'motion/react'
import { ChevronDown, ChevronLeft, ChevronRight, X, Sparkles, Star, ThumbsUp, CircleAlert, ShieldCheck, Share2, Flag } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import type { StoredAd } from './ads'

const CONDITION_COLORS: Record<string, string> = {
  Новое: 'text-emerald-400',
  Отличное: 'text-green-400',
  Хорошее: 'text-yellow-400',
  'Не очень': 'text-orange-400',
}

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  'Новое': 'Есть чек, сохранена оригинальная упаковка',
  'Отличное': 'Целостность товара сохранена, нет дефектов',
  'Хорошее': 'Есть небольшие дефекты, потёртости и т.п',
  'Не очень': 'Есть видимые дефекты, неисправности',
}

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  'Новое': <Sparkles className="w-5 h-5" />,
  'Отличное': <Star className="w-5 h-5" />,
  'Хорошее': <ThumbsUp className="w-5 h-5" />,
  'Не очень': <CircleAlert className="w-5 h-5" />,
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
}: {
  ad: StoredAd
  onClose: () => void
  onOpenSellerProfile?: (ad: StoredAd) => void
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showAllSpecs, setShowAllSpecs] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showConditionInfo, setShowConditionInfo] = useState(false)
  const [expandedSpecIndex, setExpandedSpecIndex] = useState<number | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null)
  const [contactsVisible, setContactsVisible] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const imageScrollRef = useRef<HTMLDivElement | null>(null)
  const contactsRef = useRef<HTMLDivElement | null>(null)

  const { scrollXProgress } = useScroll({
    container: imageScrollRef,
  })

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const detail = {
      showNextInNav: true,
      enabled: true,
      label: 'Контакты',
      mode: 'detail' as const,
    }
    const ev = new CustomEvent('ads-create-nav-state', { detail })
    window.dispatchEvent(ev)

    const handlePurchase = () => {
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

    window.addEventListener('ad-detail-purchase', handlePurchase)

    return () => {
      window.removeEventListener('ad-detail-purchase', handlePurchase)
      const resetEv = new CustomEvent('ads-create-nav-state', {
        detail: { showNextInNav: false, enabled: false, mode: null },
      })
      window.dispatchEvent(resetEv)
    }
  }, [])

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

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col bg-[#0A0A0A] text-white"
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 bg-[#0A0A0A]/80 backdrop-blur-xl z-50 sticky top-0"
          style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <button
            type="button"
            className="flex items-center justify-center h-10 w-10 -ml-2 rounded-full active:bg-white/10 transition-colors"
            onClick={onClose}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center justify-center h-10 w-10 -mr-2 rounded-full active:bg-white/10 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5 opacity-60" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden" ref={scrollRef}>
          {/* Images */}
          <div className="relative group overflow-hidden">
            {images.length > 0 ? (
              <>
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
                    <div key={index} className="min-w-full snap-center outline-none">
                      <div className="aspect-[4/5] bg-zinc-950">
                        <img
                          src={src}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
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
              </>
            ) : (
              <div className="aspect-[4/5] bg-zinc-900 flex items-center justify-center">
                <span className="text-sm text-zinc-500 font-sf-ui-medium">
                  Без изображения
                </span>
              </div>
            )}
          </div>

          <div className="px-6 pb-32">
            {/* Price & Seller */}
            <div className="py-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-[32px] font-ttc-bold leading-none tracking-tight">
                    {Number(ad.price).toLocaleString('ru-RU')} ₽ 
                  </div>
                  {categoryLabel && (
                    <div className="text-[13px] text-white/40 font-sf-ui-medium">
                      {categoryLabel}
                    </div>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/5 p-2 pr-4 hover:bg-white/10 transition-colors"
                  onClick={() => {
                    if (onOpenSellerProfile) onOpenSellerProfile(ad)
                  }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[12px] font-ttc-bold">
                    {sellerAvatar ? (
                      <img src={sellerAvatar} alt={sellerTag} className="w-full h-full object-cover" />
                    ) : (
                      sellerTag.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[13px] font-sf-ui-medium text-white/90">
                      @{sellerTag}
                    </span>
                    <span className="text-[10px] text-white/40 font-sf-ui-light uppercase tracking-wider">
                      Продавец
                    </span>
                  </div>
                </motion.button>
              </div>
              
              <h1 className="text-[22px] font-ttc-bold leading-[1.2] text-white/95 translate-y-[1px]">
                {ad.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5">
                {categoryLabel && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <span className="text-[12px] font-ttc-demibold uppercase tracking-wider translate-y-[1px]">{categoryLabel}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-white/40">
                  <span className="text-[12px] font-sf-ui-medium uppercase tracking-wider">{locationText}</span>
                  {publishedText && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-[12px] font-sf-ui-medium uppercase tracking-wider">{publishedText}</span>
                    </>
                  )}
                </div>
              </div>

              {ad.condition && (
                <div className="mt-2 flex flex-col overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                  <button 
                    type="button"
                    onClick={() => setShowConditionInfo(!showConditionInfo)}
                    className="p-4 flex items-center justify-between active:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${
                        ad.condition === 'Новое' ? 'bg-emerald-500/10 text-emerald-400' : 
                        ad.condition === 'Отличное' ? 'bg-green-500/10 text-green-400' :
                        ad.condition === 'Хорошее' ? 'bg-yellow-500/10 text-yellow-400' :
                        ad.condition === 'Не очень' ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-white/60'
                      }`}>
                        {CONDITION_ICONS[ad.condition] || <Sparkles className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col gap-0.5 items-start">
                        <div className="text-[15px] font-ttc-bold text-white/90 translate-y-[1px]">{ad.condition}</div>
                        <div className="text-[11px] text-indigo-400 font-sf-ui-medium uppercase tracking-wider">Нажми, чтобы узнать больше</div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showConditionInfo ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-5 h-5 text-white/20" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {showConditionInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="h-px w-full bg-white/[0.05] mb-4" />
                          {CONDITION_DESCRIPTIONS[ad.condition] && (
                            <div className="text-[13px] text-white/60 font-sf-ui-light leading-relaxed">
                              {CONDITION_DESCRIPTIONS[ad.condition]}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Characteristics */}
            <div className="space-y-4 py-6 border-t border-white/5">
              <h2 className="text-[17px] font-ttc-bold text-white/90">
                Характеристики
              </h2>
              <div className="grid gap-y-3.5">
                {mainSpecs.map((spec, idx) => (
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
                      {extraSpecs.map((spec, idx) => (
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

            {/* Description */}
            {descriptionText && (
              <div className="space-y-4 py-6 border-t border-white/5">
                <h2 className="text-[17px] font-ttc-bold text-white/90">
                  Описание
                </h2>
                <div className="relative">
                  <p
                    className={`text-[15px] text-white/70 font-sf-ui-light leading-relaxed transition-all duration-300 ${
                      !showFullDescription && descriptionText.length > 200 ? 'line-clamp-4' : ''
                    }`}
                  >
                    {descriptionText}
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
            )}

            <div className="mt-4 flex flex-col items-center gap-4">
              <div className="flex items-center bg-white/5 border border-white/5 rounded-2xl overflow-hidden w-full max-w-[320px]">
                <button 
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: ad.title,
                        text: 'тест',
                        url: window.location.href
                      }).catch(() => {})
                    } else {
                      navigator.clipboard.writeText(window.location.href).catch(() => {})
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white/60 text-[14px] font-sf-ui-medium active:bg-white/5 transition-all border-r border-white/5"
                >
                  <Share2 className="w-4 h-4" />
                  Поделиться
                </button>
                <button 
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-red-400/60 text-[14px] font-sf-ui-medium active:bg-white/5 transition-all"
                >
                  <Flag className="w-4 h-4" />
                  Пожаловаться
                </button>
              </div>
            </div>

            {/* Contacts Section */}
            {contactsVisible && (
              <div 
                ref={contactsRef}
                className="mt-6 space-y-4 py-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500"
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
          </div>
        </div>
      </div>
    </motion.div>
  )
}
