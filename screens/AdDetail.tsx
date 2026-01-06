'use client'

import { useEffect, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore react-slick не имеет встроенных типов
import Slider from 'react-slick'
import { motion } from 'motion/react'
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import type { StoredAd } from './ads'

const CONDITION_COLORS: Record<string, string> = {
  Новое: 'text-emerald-400',
  Отличное: 'text-green-400',
  Хорошее: 'text-yellow-400',
  'Не очень': 'text-orange-400',
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
  const [expandedSpecIndex, setExpandedSpecIndex] = useState<number | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsVisible, setContactsVisible] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const contactsRef = useRef<HTMLDivElement | null>(null)

  const images =
    ad.imageUrls && ad.imageUrls.length > 0
      ? ad.imageUrls
      : ad.imageUrl
        ? [ad.imageUrl]
        : []

  const NextArrow = (props: any) => {
    const { onClick } = props
    if (images.length <= 1) return null
    return (
      <button
        type="button"
        onClick={onClick}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </button>
    )
  }

  const PrevArrow = (props: any) => {
    const { onClick } = props
    if (images.length <= 1) return null
    return (
      <button
        type="button"
        onClick={onClick}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>
    )
  }

  const sliderSettings = {
    dots: true,
    infinite: images.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: images.length > 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    beforeChange: (_: number, next: number) => setCurrentSlide(next),
    customPaging: () => (
      <div className="w-2 h-2 rounded-full bg-gray-600" />
    ),
    dotsClass: 'slick-dots !bottom-4',
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
      label: 'Приобрести',
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
            .select('contacts')
            .eq('id', userId)
            .maybeSingle()
          if (!error && data) {
            const dbContacts = normalizeContacts(
              (data as { contacts?: unknown }).contacts,
            )
            if (dbContacts.length > 0) {
              next = dbContacts
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
  if (ad.condition) {
    specs.push({ label: 'Состояние', value: ad.condition })
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
      className="absolute inset-0 z-40 flex flex-col bg-[#0a0a0a] text-white"
      initial={{ opacity: 0, scale: 0.9, borderRadius: 24 }}
      animate={{ opacity: 1, scale: 1, borderRadius: 0 }}
      exit={{ opacity: 0, scale: 0.9, borderRadius: 24 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-[#0a0a0a]/95 backdrop-blur-sm">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={onClose}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden" ref={scrollRef}>
          <div className="pt-2">
            <div className="relative">
              {images.length > 0 ? (
                <Slider {...sliderSettings}>
                  {images.map((src, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-black">
                        <img
                          src={src}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </Slider>
              ) : (
                <div className="aspect-square bg-zinc-900 flex items-center justify-center">
                  <span className="text-sm text-zinc-500">
                    Без изображения
                  </span>
                </div>
              )}

              {images.length > 0 && (
                <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm backdrop-blur-sm">
                  {currentSlide + 1} / {images.length}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 pb-24 font-vk-demi">
            <div className="py-5">
              <div className="flex items-center justify-between gap-3">
                <div
                  className="font-bold bg-gradient-to-r from-[#FFFFFF] to-[#FFFFFF] bg-clip-text text-transparent"
                  style={{ fontSize: 'var(--ad-detail-price-size, 30px)' }}
                >
                  {ad.price} ₽
                </div>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full bg-[#1f1f1f] px-3 py-1.5"
                  onClick={() => {
                    if (onOpenSellerProfile) onOpenSellerProfile(ad)
                  }}
                >
                  <span
                    className="text-white"
                    style={{ fontSize: 'var(--ad-detail-tag-size, 12px)' }}
                  >
                    @{sellerTag}
                  </span>
                </button>
              </div>
            </div>

            <div
              className="space-y-3 pb-5 border-b"
              style={{ borderColor: 'var(--ad-detail-divider-color, #2f2f2f)' }}
            >
              <h1
                className="font-semibold"
                style={{ fontSize: 'var(--ad-detail-title-size, 18px)' }}
              >
                {ad.title}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className="text-gray-400"
                  style={{ fontSize: 'var(--ad-detail-meta-size, 13px)' }}
                >
                  Состояние:
                </span>
                {ad.condition && (
                  <span
                    className={`${conditionColor} font-medium`}
                    style={{ fontSize: 'var(--ad-detail-meta-size, 13px)' }}
                  >
                    {ad.condition}
                  </span>
                )}
              </div>
              <div
                className="text-gray-400"
                style={{ fontSize: 'var(--ad-detail-meta-size, 12px)' }}
              >
                {locationText}
                {publishedText && ` • ${publishedText}`}
              </div>
            </div>

            <div
              className="py-5 border-b"
              style={{ borderColor: 'var(--ad-detail-divider-color, #2f2f2f)' }}
            >
              <h2
                className="mb-4 font-semibold"
                style={{
                  fontSize: 'var(--ad-detail-section-title-size, 16px)',
                }}
              >
                Характеристики
              </h2>
              <div className="space-y-3">
                {mainSpecs.map((spec, idx) => (
                  <div key={spec.label} className="flex flex-col">
                    <div
                      className="flex items-start justify-between cursor-pointer py-1"
                      onClick={() =>
                        setExpandedSpecIndex(expandedSpecIndex === idx ? null : idx)
                      }
                    >
                      <span
                        className="text-gray-400 shrink-0 mr-4 mt-0.5"
                        style={{
                          fontSize: 'var(--ad-detail-label-size, 13px)',
                        }}
                      >
                        {spec.label}
                      </span>
                      <div className="flex-1 min-w-0 text-right overflow-hidden">
                        <motion.div
                          initial={false}
                          animate={{ height: 'auto' }}
                          className="flex flex-col items-end"
                        >
                          <span
                            className={`text-white transition-colors duration-300 ${
                              expandedSpecIndex === idx
                                ? 'whitespace-normal break-words'
                                : 'truncate block w-full'
                            }`}
                            style={{
                              fontSize: 'var(--ad-detail-value-size, 13px)',
                              color:
                                expandedSpecIndex !== idx && spec.value.length > 25
                                  ? 'rgba(255, 255, 255, 0.9)'
                                  : 'white',
                            }}
                          >
                            {spec.value}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                ))}
                {hasExtraSpecs && (
                  <motion.div
                    initial={false}
                    animate={{
                      height: showAllSpecs ? 'auto' : 0,
                      opacity: showAllSpecs ? 1 : 0,
                    }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-2">
                      {extraSpecs.map((spec, idx) => {
                        const globalIdx = mainSpecs.length + idx
                        return (
                          <div key={spec.label} className="flex flex-col">
                            <div
                              className="flex items-start justify-between cursor-pointer py-1"
                              onClick={() =>
                                setExpandedSpecIndex(
                                  expandedSpecIndex === globalIdx ? null : globalIdx
                                )
                              }
                            >
                              <span
                                className="text-gray-400 shrink-0 mr-4 mt-0.5"
                                style={{
                                  fontSize: 'var(--ad-detail-label-size, 13px)',
                                }}
                              >
                                {spec.label}
                              </span>
                              <div className="flex-1 min-w-0 text-right overflow-hidden">
                                <motion.div
                                  initial={false}
                                  animate={{ height: 'auto' }}
                                  className="flex flex-col items-end"
                                >
                                  <span
                                    className={`text-white transition-colors duration-300 ${
                                      expandedSpecIndex === globalIdx
                                        ? 'whitespace-normal break-words'
                                        : 'truncate block w-full'
                                    }`}
                                    style={{
                                      fontSize: 'var(--ad-detail-value-size, 13px)',
                                      color:
                                        expandedSpecIndex !== globalIdx && spec.value.length > 25
                                          ? 'rgba(255, 255, 255, 0.9)'
                                          : 'white',
                                    }}
                                  >
                                    {spec.value}
                                  </span>
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
                {hasExtraSpecs && (
                  <div className="pt-1">
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 text-gray-400"
                      style={{ fontSize: 'var(--ad-detail-meta-size, 12px)' }}
                      onClick={() => setShowAllSpecs((v) => !v)}
                    >
                      <span className="flex-1 h-px bg-[#2f2f2f]" />
                      <span>{showAllSpecs ? 'Свернуть' : 'Показать ещё'}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showAllSpecs ? 'rotate-180' : ''
                        }`}
                      />
                      <span className="flex-1 h-px bg-[#2f2f2f]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {descriptionText && (
              <div className="py-5">
                <h2
                  className="mb-3 font-semibold"
                  style={{
                    fontSize: 'var(--ad-detail-section-title-size, 16px)',
                  }}
                >
                  Описание
                </h2>
                <div className="relative">
                  <p
                    className={`text-gray-300 leading-relaxed transition-all duration-300 ${
                      !showFullDescription ? 'line-clamp-3' : ''
                    }`}
                    style={{
                      fontSize: 'var(--ad-detail-body-size, 14px)',
                    }}
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {descriptionText}
                  </p>
                  {!showFullDescription && descriptionText.length > 150 && (
                    <button
                      type="button"
                      className="mt-1 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
                      onClick={() => setShowFullDescription(true)}
                    >
                      Показать полностью
                    </button>
                  )}
                  {showFullDescription && descriptionText.length > 150 && (
                    <button
                      type="button"
                      className="mt-1 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
                      onClick={() => setShowFullDescription(false)}
                    >
                      Скрыть
                    </button>
                  )}
                </div>
              </div>
            )}
            {contactsVisible && (
              <motion.div
                ref={contactsRef}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="py-5 border-t"
                style={{
                  borderColor: 'var(--ad-detail-divider-color, #2f2f2f)',
                }}
              >
                <h2
                  className="mb-4 font-semibold"
                  style={{
                    fontSize: 'var(--ad-detail-section-title-size, 16px)',
                  }}
                >
                  Способы связи
                </h2>
                {contacts.length > 0 ? (
                  <div className="space-y-3">
                    {contacts.map((contact) => {
                      const key = `${contact.type}-${contact.url}`
                      const label =
                        contact.type === 'vk' ? 'ВКонтакте' : 'Telegram'
                      const iconSrc =
                        contact.type === 'vk'
                          ? '/interface/vk.svg'
                          : '/interface/telegram.svg'
                      const short = getShortUrl(contact.url)
                      return (
                        <a
                          key={key}
                          href={contact.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl bg-[#111111] px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center overflow-hidden"
                              style={{
                                width:
                                  'var(--ad-detail-contact-avatar-size, 32px)',
                                height:
                                  'var(--ad-detail-contact-avatar-size, 32px)',
                              }}
                            >
                              <img
                                src={iconSrc}
                                alt={label}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <span
                              className="text-white font-sf-ui-light"
                              style={{
                                fontSize:
                                  'var(--ad-detail-contact-label-size, 15px)',
                              }}
                            >
                              {label}
                            </span>
                          </div>
                          <span className="max-w-[160px] truncate text-right text-xs text-white/60">
                            {short}
                          </span>
                        </a>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-400">
                    У продавца пока нет указанных способов связи.
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <div className="bg-[#0a0a0a] px-4 py-3">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-xl text-white font-semibold font-vk-demi transition-transform active:scale-95"
            style={{
              fontSize: 'var(--ad-detail-button-size, 15px)',
              width: 'var(--ad-detail-button-width, 100%)',
              height: 'var(--ad-detail-button-height, 56px)',
              background: 'var(--ad-detail-button-bg, var(--feed-create-bg))',
            }}
            onClick={onClose}
          >
            Написать продавцу
          </button>
        </div>
      </div>
    </motion.div>
  )
}
