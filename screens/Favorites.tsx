'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { AdCard, type StoredAd, loadAdsFromStorage } from './ads'

type FavoritesProps = {
  onClose: () => void
  onOpenAd: (ad: StoredAd) => void
  onOpenStoreById?: (id: string) => void
}

const readFavoriteIds = (): string[] => {
  try {
    const raw = window.localStorage.getItem('hw-favorites')
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  } catch {
    return []
  }
}

export default function Favorites({ onClose, onOpenAd, onOpenStoreById }: FavoritesProps) {
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<StoredAd[]>([])

  const loadFavorites = useCallback(async () => {
    setLoading(true)
    const favoriteIds = readFavoriteIds()
    if (favoriteIds.length === 0) {
      setAds([])
      setLoading(false)
      return
    }

    const allAds = await loadAdsFromStorage()
    const map = new Map(allAds.map((ad) => [ad.id, ad]))
    const ordered = favoriteIds
      .map((id) => map.get(id))
      .filter((ad): ad is StoredAd => !!ad)
    setAds(ordered)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadFavorites()
  }, [loadFavorites])

  useEffect(() => {
    const handler = () => void loadFavorites()
    window.addEventListener('favorites-updated', handler)
    window.addEventListener('ads-updated', handler)
    return () => {
      window.removeEventListener('favorites-updated', handler)
      window.removeEventListener('ads-updated', handler)
    }
  }, [loadFavorites])

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-0 z-[170] flex flex-col bg-[#0A0A0A]"
    >
      <div
        className="relative w-full border-b border-white/[0.05] flex-shrink-0"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(env(safe-area-inset-top, 0px) + 56px)',
        }}
      >
        <div className="relative h-full w-full flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Назад"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="font-ttc-bold text-white text-[22px]">Избранное</div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto scrollbar-hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-white/40 text-[14px]">
            Загрузка...
          </div>
        ) : ads.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center px-8 text-center">
            <div className="mb-4">
              <svg width="190" height="145" viewBox="0 0 190 145" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.g
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.path
                    d="M95 108C95 108 52 80 52 54C52 41.402 62.402 31 75 31C83.248 31 90.474 35.318 95 41.787C99.526 35.318 106.752 31 115 31C127.598 31 138 41.402 138 54C138 80 95 108 95 108Z"
                    stroke="white"
                    strokeOpacity="0.34"
                    strokeWidth="3"
                    initial={{ pathLength: 0.15, opacity: 0.5 }}
                    animate={{ pathLength: [0.5, 1, 0.5], opacity: [0.5, 0.95, 0.5] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.g>
                <motion.circle
                  cx="52"
                  cy="40"
                  r="3.5"
                  fill="white"
                  fillOpacity="0.3"
                  animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />
                <motion.circle
                  cx="143"
                  cy="46"
                  r="2.8"
                  fill="white"
                  fillOpacity="0.28"
                  animate={{ y: [0, -9, 0], opacity: [0.15, 0.55, 0.15] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
                />
                <motion.path
                  d="M70 118H120"
                  stroke="white"
                  strokeOpacity="0.13"
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={{ opacity: [0.08, 0.22, 0.08] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </svg>
            </div>
            <div className="text-white/80 font-sf-ui-medium text-[17px] mb-2">Тут пока пусто</div>
            <div className="text-white/35 text-[14px] leading-relaxed">
              Добавляй объявления в избранное, чтобы быстро находить их позже.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[1px]">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                id={ad.id}
                title={ad.title}
                price={ad.price}
                imageUrl={ad.imageUrl}
                username={(ad.userTag || 'user').replace(/^@/, '')}
                condition={ad.condition || undefined}
                location={ad.location || undefined}
                createdAt={ad.createdAt}
                specs={ad.specs}
                storeId={ad.storeId || undefined}
                storeName={ad.storeName || undefined}
                storeAvatarUrl={ad.storeAvatarUrl || undefined}
                onOpenStore={onOpenStoreById}
                onClick={() => onOpenAd(ad)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
