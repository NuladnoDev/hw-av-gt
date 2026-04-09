'use client'

import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { AdCard, type StoredAd } from './ads'

export default function UserAdsScreen({
  ads,
  userTag,
  onClose,
  onOpenAd,
}: {
  ads: StoredAd[]
  userTag: string
  onClose: () => void
  onOpenAd?: (ad: StoredAd) => void
}) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col"
    >
      {/* Шапка */}
      <div
        className="flex items-center px-4 flex-shrink-0 border-b border-white/[0.05]"
        style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
        <span className="ml-3 text-[17px] font-sf-ui-medium text-white">
          @{userTag}
        </span>
      </div>

      {/* Объявления */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-4">
        {ads.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-[14px] text-white/30">
            Нет объявлений
          </div>
        ) : (
          <div
            className="grid grid-cols-2"
            style={{ columnGap: 6, rowGap: 6 }}
          >
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                id={ad.id}
                title={ad.title}
                price={ad.price}
                imageUrl={ad.imageUrl}
                username={(ad.userTag ?? 'user').replace(/^@/, '')}
                condition={ad.condition ?? undefined}
                location={ad.location ?? undefined}
                createdAt={ad.createdAt}
                isOwn={false}
                onClick={() => onOpenAd?.(ad)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
