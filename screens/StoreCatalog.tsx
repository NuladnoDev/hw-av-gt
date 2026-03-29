'use client'

import { motion } from 'motion/react'
import { Star, ShieldCheck, Plus, ChevronRight, Users, ShoppingBag } from 'lucide-react'

interface FakeStore {
  id: string
  name: string
  tag: string
  rating: number
  reviewsCount: number
  adsCount: number
  avatarUrl: string | null
  isVerified: boolean
  isOnline: boolean
  category: string
}

const FAKE_STORES: FakeStore[] = [
  {
    id: 's-1',
    name: 'Магазин',
    tag: 'Shop_Test',
    rating: 4.9,
    reviewsCount: 1240,
    adsCount: 42,
    avatarUrl: null,
    isVerified: true,
    isOnline: true,
    category: 'Вейпы'
  },
  {
    id: 's-2',
    name: 'Магазин',
    tag: 'Shop_Test',
    rating: 4.7,
    reviewsCount: 850,
    adsCount: 156,
    avatarUrl: null,
    isVerified: true,
    isOnline: false,
    category: 'Жидкости'
  },
  {
    id: 's-3',
    name: 'Магазин',
    tag: 'Shop_Test',
    rating: 5.0,
    reviewsCount: 320,
    adsCount: 18,
    avatarUrl: null,
    isVerified: false,
    isOnline: true,
    category: 'Аксессуары'
  },
  {
    id: 's-4',
    name: 'Магазин',
    tag: 'Shop_Test',
    rating: 4.8,
    reviewsCount: 2100,
    adsCount: 89,
    avatarUrl: null,
    isVerified: true,
    isOnline: true,
    category: 'Вейпы'
  },
  {
    id: 's-5',
    name: 'Магазин',
    tag: 'Shop_Test',
    rating: 4.6,
    reviewsCount: 450,
    adsCount: 34,
    avatarUrl: null,
    isVerified: true,
    isOnline: false,
    category: 'Жидкости'
  }
]

const StoreHeroIllustration = () => (
  <div className="w-full flex justify-center py-8">
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background Glow */}
      <circle cx="140" cy="90" r="70" fill="url(#hero_glow)" fillOpacity="0.15"/>
      
      {/* Shop Window */}
      <rect x="80" y="40" width="120" height="100" rx="12" fill="#1A1A1A" stroke="white" strokeOpacity="0.1" strokeWidth="2"/>
      <rect x="90" y="50" width="100" height="60" rx="4" fill="#0A0A0A"/>
      
      {/* Items in Window */}
      <motion.rect 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        x="100" y="60" width="20" height="20" rx="4" fill="#3B82F6" fillOpacity="0.4"
      />
      <motion.rect 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        x="130" y="60" width="20" height="20" rx="4" fill="#8B5CF6" fillOpacity="0.4"
      />
      <motion.rect 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        x="160" y="60" width="20" height="20" rx="4" fill="#EC4899" fillOpacity="0.4"
      />

      {/* Buyer Figure */}
      <motion.g
        animate={{ x: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="60" cy="110" r="8" fill="white" fillOpacity="0.8"/>
        <path d="M60 120V150M60 125L50 140M60 125L70 140M60 150L50 170M60 150L70 170" stroke="white" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round"/>
        
        {/* Thought Bubble */}
        <motion.g
          animate={{ scale: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.9, 1] }}
        >
          <path d="M75 80C75 74.4772 79.4772 70 85 70H105C110.523 70 115 74.4772 115 80V90C115 95.5228 110.523 100 105 100H85C79.4772 100 75 95.5228 75 90V80Z" fill="white"/>
          <path d="M85 85H105" stroke="black" strokeWidth="2" strokeLinecap="round"/>
          <path d="M75 95L68 102" stroke="white" strokeWidth="2"/>
        </motion.g>
      </motion.g>

      <defs>
        <radialGradient id="hero_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(140 90) rotate(90) scale(90)">
          <stop stopColor="#3B82F6"/>
          <stop offset="1" stopColor="#3B82F6" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  </div>
)

export default function StoreCatalog({ 
  onCreateStore,
  onOpenStore
}: { 
  onCreateStore: () => void
  onOpenStore: (id: string) => void
}) {
  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-y-auto scrollbar-hidden">
      {/* Hero Section */}
      <div className="flex flex-col items-center">
        <StoreHeroIllustration />
        
        {/* Action Button */}
        <div className="px-6 w-full mb-12">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCreateStore}
            className="w-full h-14 rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] flex items-center justify-center gap-2.5 shadow-xl shadow-white/5 active:bg-zinc-200 transition-colors"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Открыть свой магазин
          </motion.button>
        </div>
      </div>

      {/* List Header */}
      <div className="px-6 mb-4 mt-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-[20px] font-ttc-bold text-white/90">
            Популярные магазины
          </h3>
        </div>
      </div>

      {/* Minecraft Style List */}
      <div className="flex flex-col border-t border-white/5">
        {FAKE_STORES.map((store) => (
          <motion.button
            key={store.id}
            whileTap={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            onClick={() => onOpenStore(store.id)}
            className="w-full px-6 py-4 flex items-center gap-4 border-b border-white/5 active:bg-white/[0.03] transition-colors group"
          >
            {/* Store Icon */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-white/20 transition-colors">
                {store.avatarUrl ? (
                  <img src={store.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white">
                    <span className="text-black text-[24px] font-ttc-bold">?</span>
                  </div>
                )}
              </div>
              {store.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0A0A0A]" />
              )}
            </div>

            {/* Middle Content */}
            <div className="flex-1 flex flex-col items-start gap-0.5 overflow-hidden">
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-[16px] font-ttc-bold text-white group-hover:text-blue-400 transition-colors truncate">
                  {store.name}
                </span>
                {store.isVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 text-[12px] font-sf-ui-medium tracking-wider text-white/30">
                <span>{store.category}</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span className={store.isOnline ? 'text-emerald-500/60' : 'text-white/20'}>
                  {store.isOnline ? 'В сети' : 'Оффлайн'}
                </span>
              </div>
            </div>

            {/* Right Stats */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-[14px] font-ttc-bold text-white/90">{store.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-white/20 font-sf-ui-medium uppercase tracking-tighter">
                <Users className="w-3 h-3" />
                {store.reviewsCount > 1000 ? `${(store.reviewsCount / 1000).toFixed(1)}k` : store.reviewsCount}
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-all group-hover:translate-x-1" />
          </motion.button>
        ))}
      </div>

      {/* Bottom Padding for Nav */}
      <div className="h-32 shrink-0" />
    </div>
  )
}
