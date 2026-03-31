'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, ArrowUpDown, Clock, Tag, UserCheck, Heart, Check } from 'lucide-react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import AdsCreate, { CONDITION_OPTIONS } from './Ads_Create'
import AdsEdit from './Ads_Edit'
import AdsFilters, { FilterState } from './AdsFilters'

interface AdCardProps {
  id: string
  title: string
  price: string
  imageUrl: string
  username: string
  condition?: string
  location?: string
  onDelete?: () => void
  isOwn?: boolean
  onClick?: () => void
  onEdit?: () => void
  showEditLabel?: boolean
  createdAt?: number
  specs?: AdSpecItem[]
  storeId?: string | null
  storeName?: string | null
  storeAvatarUrl?: string | null
  onOpenStore?: (id: string) => void
}

const ADS_SIDE_PADDING = 0
const ADS_GRID_GAP = 1
const ADS_TITLE_MAX_LENGTH = 45

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

export type AdSpecItem = {
  label: string
  value: string
}

export type StoredAd = {
  id: string
  userId: string | null
  userTag: string | null
  title: string
  description: string | null
  price: string
  imageUrl: string
  imageUrls?: string[]
  condition: string | null
  location: string | null
  category: string | null
  storeId?: string | null
  storeName?: string | null
  storeAvatarUrl?: string | null
  specs?: AdSpecItem[]
  createdAt: number
}

const toPrepositionalCity = (name: string): string => {
  const raw = typeof name === 'string' ? name.trim() : ''
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (lower === 'кадуй') return 'Кадуе'
  if (lower === 'воронеж') return 'Воронеже'
  const last = raw.slice(-1)
  if (last === 'а' || last === 'А') {
    return `${raw.slice(0, -1)}е`
  }
  if (last === 'я' || last === 'Я') {
    return `${raw.slice(0, -1)}и`
  }
  if (last === 'ь' || last === 'Ь') {
    return `${raw.slice(0, -1)}и`
  }
  return `${raw}е`
}

type AdsTableRow = {
  id: string
  user_id: string | null
  user_tag: string | null
  title: string | null
  description: string | null
  price: string | null
  image_url: string | null
  condition: string | null
  location: string | null
  category: string | null
  store_id: string | null
  stores?: {
    name: string | null
    avatar_url: string | null
  } | null
  specs: string | null
  created_at: string | null
}

const toCacheAd = (ad: StoredAd): Partial<StoredAd> => {
  const imageUrl = typeof ad.imageUrl === 'string' && ad.imageUrl.startsWith('data:') ? '/logo.svg' : ad.imageUrl
  return {
    id: ad.id,
    userId: ad.userId,
    userTag: ad.userTag,
    title: ad.title,
    price: ad.price,
    imageUrl,
    condition: ad.condition,
    location: ad.location,
    category: ad.category,
    createdAt: ad.createdAt,
    storeId: ad.storeId,
    storeName: ad.storeName,
    storeAvatarUrl: ad.storeAvatarUrl,
  }
}

const persistAdsCache = (ads: StoredAd[]) => {
  if (typeof window === 'undefined') return
  const cached = ads.slice(0, 200).map(toCacheAd)
  try {
    localStorage.setItem('hw-ads', JSON.stringify(cached))
  } catch {
    try {
      localStorage.setItem('hw-ads', JSON.stringify(cached.slice(0, 80)))
    } catch {
      try {
        localStorage.removeItem('hw-ads')
      } catch {
      }
    }
  }
}

const mapRowToStoredAd = (row: AdsTableRow): StoredAd => {
  const created = row.created_at ? new Date(row.created_at).getTime() : Date.now()
  let imageUrl = ''
  let imageUrls: string[] | undefined
  let specs: AdSpecItem[] | undefined
  const raw = row.image_url ?? ''
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const arr = parsed.filter((x): x is string => typeof x === 'string' && x.length > 0)
        if (arr.length > 0) {
          imageUrls = arr
          imageUrl = arr[0]
        }
      } else if (typeof parsed === 'string' && parsed.length > 0) {
        imageUrl = parsed
      } else {
        imageUrl = raw
      }
    } catch {
      imageUrl = raw
    }
  }
  const rawSpecs = row.specs
  if (rawSpecs) {
    try {
      const parsed = JSON.parse(rawSpecs) as unknown
      if (Array.isArray(parsed)) {
        const items: AdSpecItem[] = []
        for (const it of parsed) {
          if (!it || typeof it !== 'object') continue
          const label = (it as any).label
          const value = (it as any).value
          if (typeof label === 'string' && label.length > 0 && typeof value === 'string' && value.length > 0) {
            items.push({ label, value })
          }
        }
        if (items.length > 0) {
          specs = items
        }
      }
    } catch {
    }
  }
  return {
    id: row.id,
    userId: row.user_id ?? null,
    userTag: row.user_tag ?? null,
    title: row.title ?? '',
    description: row.description ?? null,
    price: row.price ?? '',
    imageUrl,
    imageUrls,
    condition: row.condition,
    location: row.location,
    category: row.category,
    storeId: row.store_id,
    storeName: row.stores?.name ?? null,
    storeAvatarUrl: row.stores?.avatar_url ?? null,
    specs,
    createdAt: created,
  }
}

export const loadAdsFromStorage = async (): Promise<StoredAd[]> => {
  const client = getSupabase()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('ads')
      .select('*, stores(name, avatar_url)')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as AdsTableRow[]).map(mapRowToStoredAd)
  } catch {
    return []
  }
}

export const deleteAdById = async (id: string): Promise<void> => {
  const client = getSupabase()
  if (!client) return
  try {
    await client.from('ads').delete().eq('id', id)
  } finally {
    if (typeof window !== 'undefined') {
      const ev = new CustomEvent('ads-updated', { detail: { type: 'deleted', id } })
      window.dispatchEvent(ev)
    }
  }
}

const CategoryIcon = ({ name, isSelected }: { name: string; isSelected?: boolean }) => {
  const color = isSelected ? 'black' : 'white'
  const opacity = isSelected ? '0.4' : '0.2'
  const strokeOpacity = isSelected ? '1' : '1'

  switch (name) {
    case 'Новые':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L14.85 8.65L22 9.25L16.5 13.95L18.25 21L12 17.25L5.75 21L7.5 13.95L2 9.25L9.15 8.65L12 2Z" fill={color} fillOpacity={opacity} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="1" fill={color}>
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      )
    case 'Популярные':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C12 22 20 18 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 18 12 22 12 22Z" fill={color} fillOpacity={opacity} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 18C12 18 15 15.5 15 13C15 11.3431 13.6569 10 12 10C10.3431 10 9 11.3431 9 13C9 15.5 12 18 12 18Z" fill={color} stroke={color} strokeWidth="1.5"/>
        </svg>
      )
    case 'Подтверждённые':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="6" fill={color} fillOpacity={opacity} stroke={color} strokeWidth="2"/>
          <path d="M8 12L11 15L16 9" stroke={isSelected ? 'black' : 'white'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'Бесплатно':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 12V22H4V12M22 7H2V12H22V7ZM12 7V22M7 7C7 7 7 2 12 2C17 2 17 7 17 7" fill={color} fillOpacity={opacity} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="4.5" r="1.5" fill={color} />
        </svg>
      )
    case 'Обмен':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" fill={color} fillOpacity={opacity} stroke={color} strokeWidth="2"/>
          <path d="M16 10L12 6L8 10M8 14L12 18L16 14" stroke={isSelected ? 'black' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'Аукцион':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 13L11 18M11 18L16 13M11 18V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={isSelected ? '0.8' : '0.6'}/>
          <path d="M19 13L11 21L3 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={isSelected ? '0.8' : '0.6'}/>
        </svg>
      )
    default:
      return null
  }
}

export function AdCard({
  id,
  title,
  price,
  imageUrl,
  username,
  condition,
  location,
  onDelete,
  isOwn,
  onClick,
  onEdit,
  showEditLabel,
  createdAt,
  specs,
  storeId,
  storeName,
  storeAvatarUrl,
  onOpenStore,
}: AdCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('hw-favorites')
    if (saved) {
      const favorites = JSON.parse(saved) as string[]
      setIsFavorite(favorites.includes(id))
    }
    const handleFavoritesUpdate = () => {
      const updated = localStorage.getItem('hw-favorites')
      if (updated) {
        const favorites = JSON.parse(updated) as string[]
        setIsFavorite(favorites.includes(id))
      }
    }
    window.addEventListener('favorites-updated', handleFavoritesUpdate)
    return () => window.removeEventListener('favorites-updated', handleFavoritesUpdate)
  }, [id])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    const saved = localStorage.getItem('hw-favorites')
    let favorites = saved ? (JSON.parse(saved) as string[]) : []
    
    if (isFavorite) {
      favorites = favorites.filter(favId => favId !== id)
    } else {
      favorites.push(id)
    }
    
    localStorage.setItem('hw-favorites', JSON.stringify(favorites))
    setIsFavorite(!isFavorite)
    window.dispatchEvent(new Event('favorites-updated'))
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-theme')
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    }
    const handleThemeUpdate = (e: Event) => {
      setTheme((e as CustomEvent).detail)
    }
    window.addEventListener('theme-updated', handleThemeUpdate)
    return () => window.removeEventListener('theme-updated', handleThemeUpdate)
  }, [])

  const displayTitle =
    title.length > ADS_TITLE_MAX_LENGTH
      ? `${title.slice(0, ADS_TITLE_MAX_LENGTH - 1).trimEnd()}…`
      : title

  const conditionConfig = condition
    ? CONDITION_OPTIONS.find((opt) => opt.label === condition) ?? null
    : null

  const createdDate = createdAt && Number.isFinite(createdAt) ? new Date(createdAt) : null
  const publishedText = createdDate
    ? createdDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
      })
    : ''

  return (
    <motion.div 
      layout
      className="relative w-full"
    >
      <div
        className="relative cursor-pointer overflow-hidden bg-[#121212] group active:scale-[0.98] transition-all duration-200 border-r border-b border-white/[0.05]"
        style={{
          minHeight: `calc(200px + var(--ad-card-info-height, 110px))`,
          borderRadius: 21,
        }}
        onClick={onClick}
      >
        {/* Image Container */}
        <div className="relative h-[200px] overflow-hidden bg-white/5 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={title} 
            className="relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          
          {/* Top Overlays */}
          {!showEditLabel && (
            <div className="absolute left-2 top-2 z-20 rounded-md bg-black/40 px-2 py-1 backdrop-blur-md border border-white/5">
              <div className="flex items-center gap-1.5 truncate">
                <div className={`w-3.5 h-3.5 ${storeId ? 'rounded-[3px]' : 'rounded-full'} overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center text-[7px] font-ttc-bold text-white`}>
                  {storeId && storeAvatarUrl ? (
                    <img src={storeAvatarUrl} alt={storeName ?? 'store'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="translate-y-[0.5px]">
                      {storeId ? (storeName?.[0]?.toUpperCase() ?? 'M') : username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="truncate text-[10px] font-sf-ui-medium text-white/60">
                  {storeId ? (storeName ?? 'Магазин') : `@${username}`}
                </div>
              </div>
            </div>
          )}
          {isOwn && (
            <button
              type="button"
              className="absolute right-2 top-2 z-20 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-colors"
              style={{ width: 28, height: 28 }}
              onClick={(e) => {
                e.stopPropagation()
                if (onEdit) onEdit()
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {!isOwn && (
            <button
              type="button"
              className="absolute right-2 bottom-2 z-20 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/5 transition-all active:scale-90"
              style={{ width: 32, height: 32 }}
              onClick={toggleFavorite}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-red-500 fill-current' : 'text-white/60'}`} />
            </button>
          )}

          {/* Condition Badge (WB style) */}
          {conditionConfig && (
            <div 
              className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded text-[9px] font-sf-ui-bold uppercase tracking-wider backdrop-blur-md border border-white/5"
              style={{
                backgroundColor: `${conditionConfig.color}20`,
                color: conditionConfig.color,
                borderColor: `${conditionConfig.color}30`
              }}
            >
              {conditionConfig.label}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="relative flex flex-col p-3 space-y-2">
          <div className="flex flex-col gap-1.5">
            <h3 className="line-clamp-2 text-[14px] leading-[1.3] text-white font-sf-ui-medium min-h-[36px]">
              {displayTitle}
            </h3>

            <div className="flex items-baseline gap-1">
              <span className="text-[17px] font-ttc-bold text-white/90 tracking-tight">
                {Number(price).toLocaleString('ru-RU')}
              </span>
              <span className="text-[12px] font-sf-ui-bold text-white/30">₽</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-white/[0.02]">
            <div className="flex items-center gap-1 opacity-40">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[10px] font-sf-ui-light text-white truncate max-w-[80px]">
                {location || 'Везде'}
              </span>
            </div>
            <span className="text-[10px] font-sf-ui-light text-white/20 uppercase">
              {publishedText}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function AdCardSkeleton() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-theme')
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    }
    const handleThemeUpdate = (e: Event) => {
      setTheme((e as CustomEvent).detail)
    }
    window.addEventListener('theme-updated', handleThemeUpdate)
    return () => window.removeEventListener('theme-updated', handleThemeUpdate)
  }, [])

  return (
    <div className="relative w-full">
      <div
        className="relative overflow-hidden rounded-2xl bg-[var(--bg-secondary)]"
        style={{
          height: `calc(160px + var(--ad-card-info-height, 80px))`,
          borderRadius: '16px',
        }}
      >
        <div className="relative h-[160px] overflow-hidden bg-[var(--bg-primary)] opacity-50">
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
        </div>
        <div
          className="relative flex flex-col justify-between p-3"
          style={{ 
            height: 'var(--ad-card-info-height, 80px)',
            background: theme === 'dark' 
              ? 'linear-gradient(to bottom, rgba(9,9,9,0.95), rgba(9,9,9,1))'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,1))'
          }}
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className={`h-3.5 w-full rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
              </div>
              <div className={`h-3.5 w-2/3 rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
              </div>
            </div>
            
            <div className={`h-5 w-20 rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
            <div className={`h-3 w-16 rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
            </div>
            <div className={`h-3 w-12 rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const FAKE_ADS: StoredAd[] = [
  {
    id: 'fake-1',
    userId: 'system',
    userTag: 'Nikfd',
    title: 'VooPoo VINCI 2 (Dazzling Line)',
    description: 'В идеальном состоянии, полный комплект. Не вскрывался.',
    price: '1700',
    imageUrl: 'https://megabuzz.ru/wp-content/uploads/2022/12/whale-fall-blue.png?q=80&w=800&auto=format&fit=crop',
    condition: 'Новое',
    location: 'Москва',
    category: 'things',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'fake-2',
    userId: 'system',
    userTag: 'Smehl_o0k',
    title: 'GeekVape Wenax K1 Black',
    description: 'Лимитированная серия. Оригинал, любые проверки.',
    price: '1200',
    imageUrl: 'https://shop-aladdin.ru/wa-data/public/shop/products/60/77/17760/images/9728/9728.970.jpg?q=80&w=800&auto=format&fit=crop',
    condition: 'Новое',
    location: 'Санкт-Петербург',
    category: 'things',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'fake-3',
    userId: 'system',
    userTag: 'Direc002',
    title: 'RELX Infinity (Sky Blush)',
    description: 'Ревизия 1200. Состояние новой консоли.',
    price: '800',
    imageUrl: 'https://d2j6dbq0eux0bg.cloudfront.net/images/19599006/3599134317.jpg?q=80&w=800&auto=format&fit=crop',
    condition: 'Отличное',
    location: 'Екатеринбург',
    category: 'things',
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'fake-4',
    userId: 'system',
    userTag: 'UnoFall',
    title: 'Elf Bar BC5000',
    description: 'Пробег 500 кадров. На гарантии.',
    price: '2300',
    imageUrl: 'https://shop.aladdin-vape.ru/wa-data/public/shop/products/87/17/1787/images/3962/3962.970.jpg',
    condition: 'Новое',
    location: 'Казань',
    category: 'things',
    createdAt: Date.now() - 14400000,
  },
  {
    id: 'fake-5',
    userId: 'system',
    userTag: 'Kirill09',
    title: 'Smok Vaporizer Novo 2',
    description: 'Цвет антрацит. Запечатанная.',
    price: '1400',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0022/4775/3801/products/smok_novo_2_25w_pod_system_-_silver_cobra_700x700.jpg?v=1594247201?id=05e9b293eff60c7ec97d5024d5e543ff_l-4297394-images-thumbs&n=13?q=80&w=800&auto=format&fit=crop',
    condition: 'Новое',
    location: 'Кадуй',
    category: 'things',
    createdAt: Date.now() - 18000000,
  }
]

export default function Ads({
  onOpenAd,
  createOnMount,
  onCreateConsumed,
  isAuthed,
  onOpenStoreById,
}: {
  onOpenAd?: (ad: StoredAd) => void
  createOnMount?: boolean
  onCreateConsumed?: () => void
  isAuthed?: boolean
  onOpenStoreById?: (id: string) => void
}) {
  const AuthIllustration = () => (
    <div className="mb-6 flex justify-center w-full">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" />
        <motion.path 
          d="M8 12L11 15L16 9" 
          stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          animate={{ 
            opacity: [0.3, 1, 0.3],
            scale: [0.95, 1.05, 0.95]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  )

  const ContactIllustration = () => (
    <div className="mb-6 flex justify-center w-full">
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="80" r="60" fill="url(#contact_warning_glow)" fillOpacity="0.2"/>
        <motion.g
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Phone Shape */}
          <rect x="75" y="45" width="50" height="90" rx="12" fill="#1C1C1E" stroke="white" strokeOpacity="0.1" strokeWidth="2"/>
          {/* Icons of contacts */}
          <rect x="85" y="60" width="30" height="4" rx="2" fill="#3B82F6" />
          <rect x="85" y="75" width="20" height="4" rx="2" fill="#10B981" />
          {/* Warning Circle */}
          <circle cx="125" cy="115" r="18" fill="#F59E0B" />
          <path d="M125 108V118M125 122H125.01" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
        <defs>
          <radialGradient id="contact_warning_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 80) rotate(90) scale(80)">
            <stop stopColor="#F59E0B"/>
            <stop offset="1" stopColor="#F59E0B" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [items, setItems] = useState<StoredAd[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserAltId, setCurrentUserAltId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [editingAd, setEditingAd] = useState<StoredAd | null>(null)
  const [contactWarningOpen, setContactWarningOpen] = useState(false)
  const [contactWarningLocked, setContactWarningLocked] = useState(false)
  const [authWarningOpen, setAuthWarningOpen] = useState(false)
  const [authWarningLocked, setAuthWarningLocked] = useState(false)
  const [authIsAdult, setAuthIsAdult] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [sortType, setSortType] = useState<'new' | 'cheap' | 'rating'>('new')
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-theme')
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    }
    const handleThemeUpdate = (e: Event) => {
      setTheme((e as CustomEvent).detail)
    }
    window.addEventListener('theme-updated', handleThemeUpdate)
    return () => window.removeEventListener('theme-updated', handleThemeUpdate)
  }, [])

  const [userCity, setUserCity] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showCategories, setShowCategories] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-show-categories')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && typeof e.detail.show === 'boolean') {
        setShowCategories(e.detail.show)
      }
    }
    window.addEventListener('settings-categories-updated', handleUpdate)
    return () => window.removeEventListener('settings-categories-updated', handleUpdate)
  }, [])

  const checkHasContacts = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return true
    try {
      const auth = await loadLocalAuth()
      const userId = auth?.uuid ?? auth?.uid ?? null
      if (!userId) return false
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { contacts?: unknown }>)
        : {}
      const localContacts = normalizeContacts(profMap[userId]?.contacts)
      if (localContacts.length > 0) return true
      const client = getSupabase()
      if (!client) return false
      const { data, error } = await client
        .from('profiles')
        .select('contacts')
        .eq('id', userId)
        .maybeSingle()
      if (error || !data) return false
      const dbContacts = normalizeContacts(
        (data as { contacts?: unknown }).contacts,
      )
      return dbContacts.length > 0
    } catch {
      return false
    }
  }

  const handleCreateClick = () => {
    if (!isAuthed) {
      setContactWarningOpen(false)
      setAuthWarningOpen(true)
      return
    }
    void (async () => {
      const ok = await checkHasContacts()
      if (ok) {
        setCreateOpen(true)
        return
      }
      setAuthWarningOpen(false)
      setContactWarningOpen(true)
    })()
  }

  useEffect(() => {
    if (!contactWarningOpen && !authWarningOpen) return
    const isLocked = contactWarningOpen ? setContactWarningLocked : setAuthWarningLocked
    isLocked(true)
    const t = setTimeout(() => {
      isLocked(false)
    }, 2000)
    return () => {
      clearTimeout(t)
    }
  }, [contactWarningOpen, authWarningOpen])

  useEffect(() => {
    if (createOnMount && !createOpen) {
      if (!isAuthed) {
        setContactWarningOpen(false)
        setAuthWarningOpen(true)
        if (onCreateConsumed) onCreateConsumed()
        return
      }
      void (async () => {
        const ok = await checkHasContacts()
        if (ok) {
          setCreateOpen(true)
        } else {
          setAuthWarningOpen(false)
          setContactWarningOpen(true)
        }
        if (onCreateConsumed) onCreateConsumed()
      })()
    }
  }, [createOnMount, createOpen, onCreateConsumed, isAuthed])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const loadCity = async () => {
      if (cancelled) return
      let uid: string | null = null
      try {
        const raw = window.localStorage.getItem('hw-auth')
        const auth = raw ? (JSON.parse(raw) as { uid?: string | null; uuid?: string | null } | null) : null
        const id = auth?.uuid ?? auth?.uid ?? null
        uid = typeof id === 'string' && id.length > 0 ? id : null
      } catch {
        uid = null
      }
      if (!uid) {
        if (!cancelled) setUserCity(null)
        return
      }
      let nextCity: string | null = null
      try {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { city?: string | null }>)
          : {}
        const localCity = profMap[uid]?.city
        if (typeof localCity === 'string' && localCity.trim().length > 0) {
          nextCity = localCity.trim()
        }
      } catch {
      }
      const client = getSupabase()
      if (client && uid) {
        try {
          const { data } = await client
            .from('profiles')
            .select('city')
            .eq('id', uid)
            .maybeSingle()
          const dbCity = (data?.city as string | null | undefined) ?? null
          if (typeof dbCity === 'string' && dbCity.trim().length > 0) {
            nextCity = dbCity.trim()
          }
        } catch {
        }
      }
      if (!cancelled) {
        setUserCity(nextCity)
      }
    }
    loadCity()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('hw-auth')
      const auth = raw ? (JSON.parse(raw) as { uid?: string | null; uuid?: string | null } | null) : null
      const uuid = auth?.uuid ?? null
      const uid = auth?.uid ?? null
      const main = uuid ?? uid ?? null
      const alt = uuid && uid && uuid !== uid ? uid : null
      setCurrentUserId(typeof main === 'string' && main.length > 0 ? main : null)
      setCurrentUserAltId(typeof alt === 'string' && alt.length > 0 ? alt : null)
    } catch {
      setCurrentUserId(null)
      setCurrentUserAltId(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const all = await loadAdsFromStorage()
      if (cancelled) return
      // Объединяем реальные объявления из БД с фейковыми для наполнения
      const merged = [...all, ...FAKE_ADS]
      const sorted = merged.sort((a, b) => b.createdAt - a.createdAt)
      setItems(sorted)
      // Save to localStorage for other components (like AdDetail recommendations)
      persistAdsCache(sorted)
      setInitialLoading(false)
    }
    load()
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ type?: string; id?: string; row?: AdsTableRow }>
      if (ev.detail?.type === 'created' && ev.detail.row) {
        const ad = mapRowToStoredAd(ev.detail.row)
        setItems((prev) => {
          if (prev.some((x) => x.id === ad.id)) return prev
          const updated = [ad, ...prev]
          persistAdsCache(updated)
          return updated
        })
        return
      }
      if (ev.detail?.type === 'deleted' && ev.detail.id) {
        setItems((prev) => {
          const updated = prev.filter((a) => a.id !== ev.detail.id)
          persistAdsCache(updated)
          return updated
        })
        return
      }
      load()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('ads-updated', handler as EventListener)
    }
    return () => {
      cancelled = true
      if (typeof window !== 'undefined') {
        window.removeEventListener('ads-updated', handler as EventListener)
      }
    }
  }, [])

  const searchPlaceholder = userCity ? `Поиск в ${toPrepositionalCity(userCity)}` : 'Поиск в Кадуе'

  const visibleItems = useMemo(() => {
    let filtered = items
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (normalizedQuery.length > 0) {
      filtered = filtered.filter((ad) => ad.title.toLowerCase().includes(normalizedQuery))
    }

    if (selectedCategory) {
      if (selectedCategory === 'Новые') {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        filtered = filtered.filter((ad) => ad.createdAt > oneDayAgo)
      } else if (selectedCategory === 'Подтверждённые') {
        // Here we could check if user is verified, for now let's say all ads with location are "confirmed" or similar logic
        // Or if we have a list of verified tags. Let's assume for now ads with specific tags or just placeholder
        filtered = filtered.filter((ad) => ad.location !== null)
      } else if (selectedCategory === 'Популярные') {
        // Just sort by most specs or similar for now
        filtered = [...filtered].sort((a, b) => (b.specs?.length || 0) - (a.specs?.length || 0))
      } else if (selectedCategory === 'Бесплатно') {
        filtered = filtered.filter((ad) => {
          const p = ad.price.toLowerCase().replace(/\s/g, '')
          return p === '0' || p.includes('бесплатно')
        })
      } else if (selectedCategory === 'Обмен') {
        filtered = filtered.filter((ad) => {
          const t = ad.title.toLowerCase()
          const d = (ad.description || '').toLowerCase()
          return t.includes('обмен') || d.includes('обмен')
        })
      }
    }

    if (activeFilters) {
      if (activeFilters.categories.length > 0) {
        filtered = filtered.filter((ad) => ad.category && activeFilters.categories.includes(ad.category as any))
      }
      if (activeFilters.conditions.length > 0) {
        filtered = filtered.filter((ad) => {
          if (!ad.condition) return false
          const condOption = CONDITION_OPTIONS.find(opt => opt.label === ad.condition)
          return condOption && activeFilters.conditions.includes(condOption.id as any)
        })
      }
      if (activeFilters.minPrice) {
        const min = parseInt(activeFilters.minPrice)
        if (!isNaN(min)) {
          filtered = filtered.filter((ad) => {
            const price = parseInt(ad.price.replace(/\D/g, ''))
            return !isNaN(price) && price >= min
          })
        }
      }
      if (activeFilters.maxPrice) {
        const max = parseInt(activeFilters.maxPrice)
        if (!isNaN(max)) {
          filtered = filtered.filter((ad) => {
            const price = parseInt(ad.price.replace(/\D/g, ''))
            return !isNaN(price) && price <= max
          })
        }
      }
    }

    // Apply Sorting
    const sorted = [...filtered]
    if (sortType === 'new') {
      sorted.sort((a, b) => b.createdAt - a.createdAt)
    } else if (sortType === 'cheap') {
      sorted.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/\D/g, '')) || 0
        const priceB = parseInt(b.price.replace(/\D/g, '')) || 0
        return priceA - priceB
      })
    } else if (sortType === 'rating') {
      // For now sorting by random rating since we don't have it in StoredAd
      // In real app this would be seller rating
      sorted.sort((a, b) => (b.specs?.length || 0) - (a.specs?.length || 0))
    }

    return sorted
  }, [items, searchQuery, activeFilters, selectedCategory, sortType])
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="h-full overflow-y-auto scrollbar-hidden transition-all duration-300"
        style={{
          paddingLeft: ADS_SIDE_PADDING,
          paddingRight: ADS_SIDE_PADDING,
          paddingBottom: 16,
        }}
      >
        <div
          className="flex w-full flex-col items-stretch pt-3 pb-2"
        >
          <div className="flex items-center gap-2 mb-1 w-full px-1">
            <div
              className="flex items-stretch flex-1 min-w-0"
              style={{ height: 54 }}
            >
              <motion.div
                className="flex h-full items-center backdrop-blur-xl relative overflow-hidden group w-full"
                style={{
                  borderRadius: 24,
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  paddingLeft: 16,
                  paddingRight: 0,
                }}
              >
                {/* Glass Shine Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className={`absolute inset-0 opacity-10 ${theme === 'dark' ? 'bg-gradient-to-tr from-transparent via-white/5 to-white/10' : 'bg-gradient-to-tr from-transparent via-black/5 to-black/10'}`} />
                  <motion.div 
                    animate={{
                      opacity: isSearchActive ? 0.15 : 0.05,
                      background: isSearchActive 
                        ? theme === 'dark' 
                          ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)'
                          : 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 70%)'
                        : theme === 'dark'
                          ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)'
                          : 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.05) 0%, transparent 70%)'
                    }}
                    className="absolute inset-0 transition-opacity duration-300"
                  />
                </div>

                <motion.div
                  className="flex h-full items-center relative z-10 w-full"
                  style={{
                    paddingRight: 16,
                  }}
                >
                  <img
                    src="/interface/search-02.svg"
                    alt=""
                    style={{ 
                      width: 22, 
                      height: 22, 
                      marginRight: 8,
                      filter: theme === 'dark' ? 'none' : 'invert(1) opacity(0.5)'
                    }}
                  />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="font-sf-ui-light flex-1 bg-transparent outline-none border-none"
                    style={{
                      fontSize: 16,
                      lineHeight: '18px',
                      color: theme === 'dark' ? '#A8A8A8' : '#3C3C43',
                    }}
                    onFocus={() => setIsSearchActive(true)}
                    onBlur={() => setIsSearchActive(false)}
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Sort & Filter Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={sortMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className="h-[54px] w-[54px] flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl"
                >
                  <ArrowUpDown className={`w-5 h-5 ${sortType !== 'new' ? 'text-blue-400' : 'text-white/40'}`} />
                </motion.button>

                <AnimatePresence>
                  {isSortMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                      className="absolute top-[64px] right-0 w-[200px] z-[100] rounded-2xl bg-[#1C1C1E] border border-white/10 shadow-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => { setSortType('new'); setIsSortMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-white/5 ${sortType === 'new' ? 'text-white' : 'text-white/40'}`}
                      >
                        <span className="text-[14px] font-sf-ui-medium">Новинки</span>
                        <Clock className={`w-4 h-4 ${sortType === 'new' ? 'text-blue-400' : 'opacity-0'}`} />
                      </button>
                      <button
                        onClick={() => { setSortType('cheap'); setIsSortMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-white/5 ${sortType === 'cheap' ? 'text-white' : 'text-white/40'}`}
                      >
                        <span className="text-[14px] font-sf-ui-medium">Сначала дешевле</span>
                        <Tag className={`w-4 h-4 ${sortType === 'cheap' ? 'text-blue-400' : 'opacity-0'}`} />
                      </button>
                      <button
                        onClick={() => { setSortType('rating'); setIsSortMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-white/5 ${sortType === 'rating' ? 'text-white' : 'text-white/40'}`}
                      >
                        <span className="text-[14px] font-sf-ui-medium">По рейтингу</span>
                        <UserCheck className={`w-4 h-4 ${sortType === 'rating' ? 'text-blue-400' : 'opacity-0'}`} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setFiltersOpen(true)}
                className="h-[54px] w-[54px] flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl"
              >
                <img src="/interface/filter.svg" alt="" className="w-6 h-6 opacity-40" />
              </motion.button>
            </div>
          </div>

          {/* Category Carousel */}
          <AnimatePresence>
            {showCategories && (
              <motion.div 
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full relative overflow-hidden"
              >
                <div 
                  className="flex overflow-x-auto scrollbar-hidden category-carousel w-full px-0" 
                >
                  <div className="flex gap-2 py-1">
                    {[
                      { name: 'Новые' },
                      { name: 'Популярные' },
                      { name: 'Подтверждённые' },
                      { name: 'Бесплатно' },
                      { name: 'Обмен' },
                      { name: 'Аукцион', disabled: true }
                    ].map((category, index) => (
                      <motion.button
                        key={category.name}
                        type="button"
                        disabled={category.disabled}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-sf-ui-medium text-[14px] transition-all duration-300 relative overflow-hidden ${
                          category.disabled 
                            ? 'opacity-30 grayscale cursor-not-allowed' 
                            : selectedCategory === category.name 
                              ? 'bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.1)]' 
                              : 'bg-white/[0.04] text-white/60 border border-white/[0.06] hover:bg-white/[0.08]'
                        } active:scale-95`}
                        whileTap={category.disabled ? {} : { scale: 0.95 }}
                        onClick={() => {
                          if (category.disabled) return
                          setSelectedCategory(selectedCategory === category.name ? null : category.name)
                        }}
                      >
                        <CategoryIcon name={category.name} isSelected={selectedCategory === category.name} />
                        <span className="relative z-10 translate-y-[0.5px]">{category.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="grid grid-cols-2 pb-4"
          style={{
            columnGap: ADS_GRID_GAP,
            rowGap: ADS_GRID_GAP,
          }}
        >
          {initialLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <AdCardSkeleton key={`skeleton-${index}`} />
              ))
            : visibleItems.map((ad) => {
                const isOwn =
                  (currentUserId !== null && ad.userId === currentUserId) ||
                  (currentUserAltId !== null && ad.userId === currentUserAltId)
                return (
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
                    specs={ad.specs}
                    onDelete={isOwn ? () => deleteAdById(ad.id) : undefined}
                    isOwn={isOwn}
                    storeId={ad.storeId}
                    storeName={ad.storeName}
                    storeAvatarUrl={ad.storeAvatarUrl}
                    onClick={() => {
                      if (onOpenAd) {
                        onOpenAd(ad)
                      }
                    }}
                    onEdit={isOwn ? () => setEditingAd(ad) : undefined}
                    onOpenStore={onOpenStoreById}
                  />
                )
              })}
        </div>
      </div>
      {createOpen && (
        <AdsCreate
          onClose={() => {
            setCreateOpen(false)
          }}
        />
      )}
      <AnimatePresence>
        {filtersOpen && (
          <AdsFilters
            onClose={() => setFiltersOpen(false)}
            onApply={(filters) => {
              setActiveFilters(filters)
              setFiltersOpen(false)
            }}
            initialFilters={activeFilters || { categories: [], conditions: [], minPrice: '', maxPrice: '' }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {contactWarningOpen && isAuthed && (
          <>
            {/* Затемнение фона - на весь экран, но ниже навигации и самого уведомления */}
            <motion.div
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => {
                if (contactWarningLocked) return
                setContactWarningOpen(false)
              }}
            />
            
            {/* Само уведомление - выше всего */}
             <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
               <motion.div
                 className="relative w-full rounded-t-[32px] bg-[#121212] border-t border-white/10 p-8 flex flex-col items-center text-center space-y-6 pointer-events-auto pb-[calc(env(safe-area-inset-bottom, 0px) + 24px)]"
                 initial={{ translateY: '100%' }}
                 animate={{ translateY: 0 }}
                 exit={{ translateY: '100%' }}
                 transition={{ type: 'spring', damping: 30, stiffness: 350 }}
               >
                 <ContactIllustration />
                 
                 <div className="space-y-2">
                   <h3 className="text-[22px] font-ttc-bold text-white leading-tight">
                     Укажите способы связи
                   </h3>
                   <p className="text-[14px] text-white/40 font-sf-ui-light max-w-[260px]">
                     Чтобы покупатели могли вам написать или позвонить - добавьте Telegram или VK в профиле
                   </p>
                 </div>
                 
                 <div className="w-full flex flex-col gap-3 pt-4">
                   <button
                     type="button"
                     className="h-14 w-full rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                     onClick={() => {
                       if (contactWarningLocked) return
                       if (typeof window !== 'undefined') {
                         const ev = new Event('open-contacts')
                         window.dispatchEvent(ev)
                       }
                       setContactWarningOpen(false)
                     }}
                   >
                     Перейти в профиль
                   </button>
                   
                   <button
                     type="button"
                     className="h-14 w-full rounded-[22px] bg-white/5 text-white/70 font-sf-ui-medium text-[15px] active:scale-[0.97] transition-all"
                     onClick={() => {
                       if (contactWarningLocked) return
                       setContactWarningOpen(false)
                     }}
                   >
                     Позже
                   </button>
                 </div>
               </motion.div>
             </div>
          </>
        )}

        {authWarningOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => {
                if (authWarningLocked) return
                setAuthWarningOpen(false)
              }}
            />
            
             <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
               <motion.div
                 className="relative w-full rounded-t-[32px] bg-[#121212] border-t border-white/10 p-8 flex flex-col items-center text-center space-y-6 pointer-events-auto pb-[calc(env(safe-area-inset-bottom, 0px) + 24px)]"
                 initial={{ translateY: '100%' }}
                 animate={{ translateY: 0 }}
                 exit={{ translateY: '100%' }}
                 transition={{ type: 'spring', damping: 30, stiffness: 350 }}
               >
                 <AuthIllustration />
                 
                 <div className="space-y-2">
                   <h3 className="text-[22px] font-ttc-bold text-white leading-tight">
                     Вам есть 18 лет?
                   </h3>
                   <p className="text-[14px] text-white/40 font-sf-ui-light max-w-[260px]">
                     Чтобы публиковать объявления и общаться - подтвердите свой возраст
                   </p>
                 </div>

                 <div 
                   className="flex items-center gap-3 cursor-pointer group select-none"
                   onClick={() => setAuthIsAdult(!authIsAdult)}
                 >
                   <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${authIsAdult ? 'bg-white border-white' : 'bg-transparent border-white/20 group-hover:border-white/40'}`}>
                     {authIsAdult && <Check size={16} className="text-black" strokeWidth={3} />}
                   </div>
                   <span className={`text-[15px] transition-colors duration-300 ${authIsAdult ? 'text-white/80' : 'text-white/40'}`}>
                     Мне есть 18 лет
                   </span>
                 </div>
                 
                 <div className="w-full flex flex-col gap-3 pt-4">
                   <button
                     type="button"
                     disabled={!authIsAdult}
                     className={`h-14 w-full rounded-[22px] font-sf-ui-bold text-[16px] transition-all ${
                       authIsAdult 
                         ? 'bg-white text-black active:scale-[0.97]' 
                         : 'bg-white/10 text-white/20 cursor-not-allowed'
                     }`}
                     onClick={() => {
                       if (!authIsAdult) return
                       setAuthWarningOpen(false)
                       window.dispatchEvent(new Event('trigger-auth'))
                     }}
                   >
                     Продолжить
                   </button>
                   
                   <button
                     type="button"
                     className="h-14 w-full rounded-[22px] bg-white/5 text-white/70 font-sf-ui-medium text-[15px] active:scale-[0.97] transition-all"
                     onClick={() => {
                       setAuthWarningOpen(false)
                       window.dispatchEvent(new CustomEvent('trigger-auth', { detail: { screen: 'login' } }))
                     }}
                   >
                     У меня уже есть аккаунт
                   </button>
                 </div>
               </motion.div>
             </div>
          </>
        )}
      </AnimatePresence>
      {editingAd && (
        <AdsEdit
          ad={editingAd}
          onClose={() => setEditingAd(null)}
        />
      )}
    </div>
  )
}

