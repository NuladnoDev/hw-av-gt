'use client'

import { useState } from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore react-slick не имеет встроенных типов
import Slider from 'react-slick'
import { motion } from 'motion/react'
import { ChevronLeft, X } from 'lucide-react'
import type { StoredAd } from './ads'

const CONDITION_COLORS: Record<string, string> = {
  Новое: 'text-emerald-400',
  Отличное: 'text-green-400',
  Хорошее: 'text-yellow-400',
  'Не очень': 'text-orange-400',
}

export default function AdDetail({
  ad,
  onClose,
}: {
  ad: StoredAd
  onClose: () => void
}) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const images = ad.imageUrl ? [ad.imageUrl] : []

  const sliderSettings = {
    dots: true,
    infinite: images.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: images.length > 1,
    beforeChange: (_: number, next: number) => setCurrentSlide(next),
    customPaging: () => (
      <div className="w-2 h-2 rounded-full bg-gray-600" />
    ),
    dotsClass: 'slick-dots !bottom-4',
  }

  const conditionColor =
    (ad.condition && CONDITION_COLORS[ad.condition]) || 'text-gray-300'

  const locationText = ad.location ?? 'Кадуй'

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

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col bg-[#0a0a0a] text-white"
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

        <div className="flex-1 overflow-y-auto">
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
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
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
                <div className="flex items-center justify-center rounded-full bg-[#1f1f1f] px-3 py-1.5">
                  <span
                    className="text-white"
                    style={{ fontSize: 'var(--ad-detail-tag-size, 12px)' }}
                  >
                    @{sellerTag}
                  </span>
                </div>
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
                {ad.category && (
                  <div className="flex items-center justify-between">
                    <span
                      className="text-gray-400"
                      style={{
                        fontSize: 'var(--ad-detail-label-size, 13px)',
                      }}
                    >
                      Категория
                    </span>
                    <span
                      className="text-white"
                      style={{
                        fontSize: 'var(--ad-detail-value-size, 13px)',
                      }}
                    >
                      {ad.category}
                    </span>
                  </div>
                )}
                {ad.condition && (
                  <div className="flex items-center justify-between">
                    <span
                      className="text-gray-400"
                      style={{
                        fontSize: 'var(--ad-detail-label-size, 13px)',
                      }}
                    >
                      Состояние
                    </span>
                    <span
                      className="text-white"
                      style={{
                        fontSize: 'var(--ad-detail-value-size, 13px)',
                      }}
                    >
                      {ad.condition}
                    </span>
                  </div>
                )}
                {locationText && (
                  <div className="flex items-center justify-between">
                    <span
                      className="text-gray-400"
                      style={{
                        fontSize: 'var(--ad-detail-label-size, 13px)',
                      }}
                    >
                      Город
                    </span>
                    <span
                      className="text-white"
                      style={{
                        fontSize: 'var(--ad-detail-value-size, 13px)',
                      }}
                    >
                      {locationText}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {ad.title && (
              <div className="py-5">
                <h2
                  className="mb-3 font-semibold"
                  style={{
                    fontSize: 'var(--ad-detail-section-title-size, 16px)',
                  }}
                >
                  Описание
                </h2>
                <p
                  className="text-gray-300 leading-relaxed"
                  style={{
                    fontSize: 'var(--ad-detail-body-size, 14px)',
                  }}
                >
                  {ad.title}
                </p>
              </div>
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
