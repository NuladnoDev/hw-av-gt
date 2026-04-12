'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, ArrowUpDown, Clock, Tag, UserCheck, Heart, X } from 'lucide-react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'
import AdsCreate, { CONDITION_OPTIONS } from './Ads_Create'
import AdsEdit from './Ads_Edit'
import AdAnalytics from './AdAnalytics'
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
  onAnalytics?: () => void
  createdAt?: number
  specs?: AdSpecItem[]
  storeId?: string | null
  storeName?: string | null
  storeAvatarUrl?: string | null
  isAdult?: boolean
  onAdultClick?: () => void
  onOpenStore?: (id: string) => void
  userId?: string | null
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
  viewCount?: number
  isAdult?: boolean
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
  view_count?: number | null
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
    viewCount: row.view_count ?? 0,
    isAdult: !!(row as any).is_adult,
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
    case 'Мои объявления':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="7" r="3.5" fill={color} fillOpacity={opacity} stroke={color} strokeWidth="1.8"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M16 3h5M18.5 1v4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
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
  onAnalytics,
  createdAt,
  specs,
  storeId,
  storeName,
  storeAvatarUrl,
  onOpenStore,
  userId,
  isAdult,
  onAdultClick,
}: AdCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isFavorite, setIsFavorite] = useState(false)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || storeId) return
    try {
      const raw = localStorage.getItem('hw-profiles')
      if (!raw) return
      const map = JSON.parse(raw) as Record<string, { avatar_url?: string | null }>
      const av = map[userId]?.avatar_url
      if (typeof av === 'string' && av.length > 0) setUserAvatarUrl(av)
    } catch {}
  }, [userId, storeId])

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
        onClick={isAdult ? onAdultClick : onClick}
      >
        {/* Image Container */}
        <div className="relative h-[200px] overflow-hidden bg-white/5 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={title} 
            className={`relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isAdult ? 'blur-xl scale-110' : ''}`}
          />
          {/* 18+ overlay */}
          {isAdult && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40">
              <svg width="52" height="36" viewBox="0 0 52 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="26" cy="18" rx="24" ry="15" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="2.2"/>
                <ellipse cx="26" cy="18" rx="9" ry="9" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="2.2"/>
                <circle cx="26" cy="18" r="4" fill="rgba(255, 255, 255, 0.9)"/>
                <line x1="4" y1="3" x2="48" y2="33" stroke="rgba(160,160,160,0.9)" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <div className="mt-2 px-2.5 py-0.5 rounded-full border border-white/30 bg-black/40">
                <span className="text-[13px] font-ttc-medium text-white leading-none tracking-widest">Товар 18+</span>
              </div>
            </div>
          )}
          
          {/* Top Overlays */}
          {!showEditLabel && (storeId || username) && (
            <div className="absolute left-2 top-2 z-20 rounded-md bg-black/40 px-2 py-1 backdrop-blur-md border border-white/5">
              <div className="flex items-center gap-1.5 truncate">
                <div className={`w-3.5 h-3.5 ${storeId ? 'rounded-[3px]' : 'rounded-full'} overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center text-[7px] font-ttc-bold text-white`}>
                  {storeId && storeAvatarUrl ? (
                    <img src={storeAvatarUrl} alt={storeName ?? 'store'} className="h-full w-full object-cover" />
                  ) : !storeId && userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={username} className="h-full w-full object-cover" />
                  ) : (
                    <span className="translate-y-[0.5px]">
                      {storeId ? (storeName?.[0]?.toUpperCase() ?? 'M') : (username?.[0]?.toUpperCase() ?? '?')}
                    </span>
                  )}
                </div>
                <div className="truncate text-[10px] font-sf-ui-medium text-white/60">
                  {storeId ? (storeName ?? 'Магазин') : `@${username}`}
                </div>
              </div>
            </div>
          )}
          {/* Condition Badge убран с фото — теперь в info section */}
        </div>

        {/* Info Section */}
        <div className="relative flex flex-col p-3 space-y-2">
          <div className="flex flex-col gap-1.5">
            <h3 className="line-clamp-2 text-[14px] leading-[1.3] text-white font-sf-ui-medium min-h-[36px]">
              {displayTitle}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-[17px] font-ttc-bold text-white/90 tracking-tight">
                  {Number(price).toLocaleString('ru-RU')}
                </span>
                <span className="text-[12px] font-sf-ui-bold text-white/30">₽</span>
              </div>
              <div className="flex items-center gap-1.5">
                {conditionConfig && (
                  <div
                    style={{
                      width: 22, height: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#1e1e1e',
                      borderRadius: 7,
                      color: conditionConfig.color,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, transform: 'scale(0.8)' }}>
                      {conditionConfig.icon}
                    </span>
                  </div>
                )}
                {isOwn && onEdit && (
                  <button
                    type="button"
                    style={{
                      width: 22, height: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#1e1e1e',
                      borderRadius: 7,
                      flexShrink: 0,
                    }}
                    onClick={(e) => { e.stopPropagation(); onEdit() }}
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.5 1.5L14.5 4.5L5.5 13.5L1.5 14.5L2.5 10.5L11.5 1.5Z" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.5 3.5L12.5 6.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
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
    imageUrl: 'https://justfreid.ru/_obmen/photo/2ecb85c9-f3c8-11ed-b806-18c04d5eb1f0_1.jpg?v=1594247201?id=05e9b293eff60c7ec97d5024d5e543ff_l-4297394-images-thumbs&n=13?q=80&w=800&auto=format&fit=crop',
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

const LEAF_SHAPES = [
  "M10 1C10 1 14 5 13 10C12 15 7 16 5 13C3 10 5 5 10 1Z",
  "M8 0C8 0 15 4 14 10C13 16 6 17 4 13C2 9 4 3 8 0Z",
  "M9 1C9 1 16 6 13 12C10 18 4 16 3 11C2 6 5 1 9 1Z",
  "M7 0C7 0 13 3 12 9C11 15 5 15 3 11C1 7 3 2 7 0Z",
]
const LEAF_COLORS = ['#c2410c', '#b45309', '#a16207', '#92400e', '#854d0e', '#d97706']

type Leaf = { id: number; x: number; size: number; duration: number; delay: number; shape: string; color: string; rotate: number; sway: number }

function FallingLeaves({ containerHeight = 140 }: { containerHeight?: number }) {
  const [leaves, setLeaves] = useState<Leaf[]>([])

  useEffect(() => {
    const gen = (): Leaf[] => Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 88,
      size: 7 + Math.random() * 7,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 12,
      shape: LEAF_SHAPES[Math.floor(Math.random() * LEAF_SHAPES.length)],
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      rotate: Math.random() * 360,
      sway: 14 + Math.random() * 20,
    }))
    setLeaves(gen())
  }, [])

  return (
    <>
      {leaves.map(leaf => (
        <motion.svg
          key={leaf.id}
          width={leaf.size}
          height={leaf.size * 1.3}
          viewBox="0 0 16 20"
          fill={leaf.color}
          style={{ position: 'absolute', left: `${leaf.x}%`, top: -16 }}
          animate={{
            y: [0, containerHeight + 20],
            x: [0, leaf.sway, -leaf.sway * 0.6, leaf.sway * 0.4, 0],
            rotate: [leaf.rotate, leaf.rotate + 200, leaf.rotate + 360],
            opacity: [0, 0.4, 0.4, 0],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.08, 0.88, 1],
          }}
        >
          <path d={leaf.shape} />
          <path d="M8 18 Q9 12 8 3" stroke={leaf.color} strokeOpacity={0.5} strokeWidth="0.7" fill="none" />
        </motion.svg>
      ))}
    </>
  )
}

const BANNERS = [
  {
    label: 'Рекламный слот',
    title: 'Здесь могла быть ваша реклама',
    link: 'Подробнее о партнерских отношениях',
    href: '/partner-agreement',
  },
  {
    label: 'Продвижение',
    title: 'Здесь могло быть ваше объявление',
    link: 'Подробнее о продвижении',
    href: '/promote',
  },
]

function BannerCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % BANNERS.length), 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative mx-2 mt-1 mb-[15.5px] rounded-[24px] border border-white/[0.05] bg-[#121212] overflow-hidden"
      style={{ minHeight: 165, boxShadow: 'none' }}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {BANNERS.map((b, i) => (
          <div key={i} className="relative flex-shrink-0 p-5" style={{ minHeight: 162, minWidth: '100%' }}>
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 15% 50%, rgba(55,55,55,0.35) 0%, transparent 60%), linear-gradient(to right, #161616 0%, #0a0a0a 100%)',
            }} />
            <motion.div
              animate={{ x: ['-100%', '350%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 6 }}
              className="absolute top-[40%] left-0 z-10 w-[28%] h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />
            {/* Листья — за контентом */}
            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
              <FallingLeaves />
            </div>
            <img
              src="/name.png" alt=""
              className="absolute bottom-0 right-4 z-20 pointer-events-none"
              style={{ width: 120, height: 'auto', objectFit: 'contain' }}
            />
            <div className="relative z-20 flex h-full items-center gap-4">
              <div className="max-w-[62%]">
                <div className="text-[12px] tracking-[0.04em] text-white/45">{b.label}</div>
                <div className="mt-1 text-[20px] leading-[1.1] font-sf-ui-light text-white">{b.title}</div>
                <div
                  className="mt-2 text-[13px] text-white/45 underline underline-offset-2 cursor-pointer"
                  onClick={() => window.open(b.href, '_blank')}
                >{b.link}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Точки */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 z-30">
        {BANNERS.map((_, i) => (
          <button
            key={i} type="button"
            onClick={() => setIndex(i)}
            className="transition-all duration-300"
            style={{
              width: index === i ? 16 : 5,
              height: 5,
              borderRadius: 3,
              background: index === i ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

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

  const EmptySearchIllustration = () => (
    <motion.svg
      width="120"
      height="92"
      viewBox="0 0 120 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="mx-auto"
    >
      <rect x="10" y="12" width="76" height="56" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />
      <rect x="22" y="26" width="40" height="5" rx="2.5" fill="rgba(255,255,255,0.22)" />
      <rect x="22" y="36" width="30" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="22" y="44" width="24" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
      <circle cx="86" cy="62" r="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.24)" />
      <path d="M93 69L103 79" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
      <path d="M80.5 62H91.5" stroke="rgba(255,255,255,0.58)" strokeWidth="2.5" strokeLinecap="round" />
    </motion.svg>
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [items, setItems] = useState<StoredAd[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserAltId, setCurrentUserAltId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [editingAd, setEditingAd] = useState<StoredAd | null>(null)
  const [analyticsAd, setAnalyticsAd] = useState<StoredAd | null>(null)
  const [contactWarningOpen, setContactWarningOpen] = useState(false)
  const [contactWarningLocked, setContactWarningLocked] = useState(false)
  const [authWarningOpen, setAuthWarningOpen] = useState(false)
  const [authWarningLocked, setAuthWarningLocked] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [sortType, setSortType] = useState<'new' | 'cheap' | 'rating'>('new')
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const [showVerifBanner, setShowVerifBanner] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('hw-verif-banner-dismissed') !== '1'
    return true
  })
  const [ageGateOpen, setAgeGateOpen] = useState(false)
  const [ageGatePendingAd, setAgeGatePendingAd] = useState<StoredAd | null>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
  const [loadError, setLoadError] = useState(false)
  const [showCategories, setShowCategories] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hw-show-categories')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })
  const adsHeaderSpacer = showCategories ? 136 : 82

  useEffect(() => {
    const el = listRef.current
    if (!el) return

    let startY = 0
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0]?.clientY ?? 0
      const delta = currentY - startY
      const atTop = el.scrollTop <= 0
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1

      if ((atTop && delta > 0) || (atBottom && delta < 0)) {
        e.preventDefault()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && typeof e.detail.show === 'boolean') {
        setShowCategories(e.detail.show)
      }
    }
    window.addEventListener('settings-categories-updated', handleUpdate)
    return () => window.removeEventListener('settings-categories-updated', handleUpdate)
  }, [])

  useEffect(() => {
    const handleApplySearch = (e: Event) => {
      const detail = (e as CustomEvent).detail as { query?: string; category?: string | null } | undefined
      const query = typeof detail?.query === 'string' ? detail.query.trim() : ''
      if (!query) return
      setSearchQuery(query)
      setSelectedCategory(null)
      if (listRef.current) {
        listRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    window.addEventListener('ads-apply-search', handleApplySearch)
    return () => window.removeEventListener('ads-apply-search', handleApplySearch)
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
      if (all.length === 0) {
        // Проверяем есть ли вообще соединение с Supabase
        const client = getSupabase()
        if (!client) {
          setLoadError(true)
          setInitialLoading(false)
          return
        }
        // Пробуем простой запрос чтобы понять — пусто или ошибка
        try {
          const { error } = await client.from('ads').select('id').limit(1)
          if (error) {
            setLoadError(true)
            setInitialLoading(false)
            return
          }
        } catch {
          setLoadError(true)
          setInitialLoading(false)
          return
        }
      }
      setLoadError(false)
      const sorted = [...all].sort((a, b) => b.createdAt - a.createdAt)
      setItems(sorted)
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
      } else if (selectedCategory === 'Мои объявления') {
        filtered = filtered.filter((ad) => ad.userId && (ad.userId === currentUserId || ad.userId === currentUserAltId))
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
    <div className="relative h-full w-full overflow-hidden" style={{ touchAction: 'none' }}>
      <div
        className="absolute left-0 top-0 w-full z-[80]"
        style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
      >
        <div className="relative mb-2">
          {/* Фон — покрывает safe area + шапку home.tsx + саму плашку */}
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-none rounded-b-[34px]"
            style={{
              top: 'calc(-1 * (env(safe-area-inset-top, 0px) + 56px + var(--home-header-offset, 0px)))',
              background: theme === 'dark' ? '#0d0d0d' : '#d6d6d6',
              boxShadow: theme === 'dark' ? '0 10px 18px rgba(0,0,0,0.22)' : '0 8px 16px rgba(0,0,0,0.06)',
            }}
          />
          <div
            className="relative flex w-full flex-col items-stretch rounded-b-[34px] pt-2 pb-2"
          >
          {/* Поиск + кнопки */}
          <div className="flex items-center gap-2 mb-1 w-full px-1">
            <div
              className="flex items-stretch flex-1 min-w-0"
              style={{ height: 56 }}
            >
              <motion.div
                className="flex h-full items-center backdrop-blur-xl relative overflow-hidden group w-full"
                style={{
                  borderRadius: 24,
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(0, 0, 0, 0.06)',
                  paddingLeft: 16,
                  paddingRight: 0,
                }}
              >
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

                <motion.div className="flex h-full items-center relative z-10 w-full" style={{ paddingRight: 8 }}>
                  <img
                    src="/interface/search-02.svg"
                    alt=""
                    style={{ width: 22, height: 22, marginRight: 8, filter: theme === 'dark' ? 'none' : 'invert(1) opacity(0.5)' }}
                  />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="font-sf-ui-light flex-1 bg-transparent outline-none border-none"
                    style={{ fontSize: 16, lineHeight: '18px', color: theme === 'dark' ? '#A8A8A8' : '#3C3C43' }}
                    onFocus={() => { setIsSearchActive(true); setIsSortMenuOpen(false) }}
                    onBlur={() => setIsSearchActive(false)}
                  />

                  <div className="relative flex items-center" ref={sortMenuRef}>
                    <AnimatePresence>
                      {searchQuery.trim().length > 0 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9, x: 8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 8 }}
                          transition={{ duration: 0.16 }} whileTap={{ scale: 0.95 }}
                          onClick={() => { setSearchQuery(''); setIsSortMenuOpen(false) }}
                          className="h-[36px] w-[36px] flex items-center justify-center" aria-label="Очистить поиск"
                        >
                          <X className="w-5 h-5 text-white/45" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {!isSearchActive && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9, x: 8 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 8 }}
                          transition={{ duration: 0.16 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                          className="h-[36px] w-[36px] flex items-center justify-center"
                        >
                          <ArrowUpDown className={`w-4 h-4 ${sortType !== 'new' ? 'text-blue-400' : 'text-white/40'}`} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isSortMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }} animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                          className="absolute top-[52px] right-0 w-[200px] z-[100] rounded-2xl bg-[#1C1C1E] border border-white/10 shadow-2xl overflow-hidden"
                        >
                          <button onClick={() => { setSortType('new'); setIsSortMenuOpen(false) }} className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-white/5 ${sortType === 'new' ? 'text-white' : 'text-white/40'}`}>
                            <span className="text-[14px] font-sf-ui-medium">Новинки</span>
                            <Clock className={`w-4 h-4 ${sortType === 'new' ? 'text-blue-400' : 'opacity-0'}`} />
                          </button>
                          <button onClick={() => { setSortType('cheap'); setIsSortMenuOpen(false) }} className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-white/5 ${sortType === 'cheap' ? 'text-white' : 'text-white/40'}`}>
                            <span className="text-[14px] font-sf-ui-medium">Сначала дешевле</span>
                            <Tag className={`w-4 h-4 ${sortType === 'cheap' ? 'text-blue-400' : 'opacity-0'}`} />
                          </button>
                          <button onClick={() => { setSortType('rating'); setIsSortMenuOpen(false) }} className={`w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-white/5 ${sortType === 'rating' ? 'text-white' : 'text-white/40'}`}>
                            <span className="text-[14px] font-sf-ui-medium">По рейтингу</span>
                            <UserCheck className={`w-4 h-4 ${sortType === 'rating' ? 'text-blue-400' : 'opacity-0'}`} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltersOpen(true)}
              className="h-[54px] w-[54px] flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl"
              style={{ touchAction: 'manipulation' }}
            >
              <img src="/interface/filter.svg" alt="" className="w-6 h-6 opacity-40" />
            </motion.button>
          </div>

          {/* Category Carousel */}
          <AnimatePresence>
            {showCategories && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full relative overflow-hidden px-2"
              >
                <div className="flex overflow-x-auto scrollbar-hidden category-carousel w-full overflow-y-hidden">
                  <div className="flex gap-2 py-1 pl-1 pr-3">
                    {([
                      { name: 'Новые' },
                      { name: 'Популярные' },
                      { name: 'Подтверждённые' },
                      { name: 'Мои объявления' },
                      { name: 'Бесплатно' },
                      { name: 'Обмен' },
                      { name: 'Аукцион', disabled: true }
                    ] as { name: string; disabled?: boolean }[]).map((category) => (
                      <motion.button
                        key={category.name}
                        type="button"
                        disabled={category.disabled}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-sf-ui-medium text-[14px] transition-all duration-300 relative overflow-hidden ${
                          category.disabled
                            ? 'opacity-30 grayscale cursor-not-allowed'
                            : selectedCategory === category.name
                              ? 'bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.1)]'
                              : 'bg-white/[0.02] text-white/60 border border-white/[0.035] hover:bg-white/[0.04]'
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
        </div>
      </div>
      <div
        ref={listRef}
        className="absolute inset-0 overflow-y-auto scrollbar-hidden"
        style={{
          paddingLeft: ADS_SIDE_PADDING,
          paddingRight: ADS_SIDE_PADDING,
          paddingTop: adsHeaderSpacer,
          paddingBottom: 16,
          overscrollBehaviorY: 'none',
          WebkitOverflowScrolling: 'auto',
          touchAction: 'pan-y',
        }}
      >
        <BannerCarousel />

        {/* Плашка верификации */}
        <AnimatePresence>
          {showVerifBanner && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="mx-2 mb-[15.5px] rounded-[20px] overflow-hidden relative"
              style={{ minHeight: 90 }}
            >
              {/* Фон */}
              <div className="absolute inset-0" style={{ background: '#161616' }} />
              {/* Световой луч */}
              <motion.div
                animate={{ x: ['-100%', '350%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 7 }}
                className="absolute top-[45%] left-0 z-10 w-[25%] h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />

              {/* Крестик и стрелка — вверху справа */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                <button
                  type="button"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors"
                  onClick={() => window.dispatchEvent(new Event('open-settings'))}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowVerifBanner(false)
                    localStorage.setItem('hw-verif-banner-dismissed', '1')
                  }}
                >
                  <X className="w-3.5 h-3.5 text-white/50" />
                </button>
              </div>

              {/* Контент */}
              <div
                className="relative z-20 flex items-center px-5 py-4 h-full cursor-pointer active:opacity-80 transition-opacity"
                onClick={() => window.dispatchEvent(new Event('open-settings'))}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <img src="/interface/verified.svg" alt="" className="w-4 h-4" style={{ filter: 'brightness(0) invert(1) opacity(0.9)' }} />
                    <span className="text-[11px] font-sf-ui-medium text-white/40 uppercase tracking-[0.1em]">HelloWorld</span>
                  </div>
                  <div className="text-[18px] font-sf-ui-medium text-white leading-tight">Верификация аккаунта</div>
                  <div className="text-[12px] text-white/45 font-sf-ui-light mt-0.5">Получи значок и доверие покупателей</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {initialLoading ? (
          <div
            className="w-full rounded-[20px] bg-white/[0.028] grid grid-cols-2 pt-[1px] pb-4"
            style={{ columnGap: ADS_GRID_GAP, rowGap: ADS_GRID_GAP }}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <AdCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : loadError ? (
          <div className="w-full min-h-[360px] rounded-[20px] bg-white/[0.028] border border-white/[0.05] px-6 py-10 flex flex-col items-center justify-center text-center">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Глобус */}
              <circle cx="60" cy="60" r="36" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" fill="none"/>
              <ellipse cx="60" cy="60" rx="16" ry="36" stroke="rgba(255,255,255,0.10)" strokeWidth="2" fill="none"/>
              <line x1="24" y1="60" x2="96" y2="60" stroke="rgba(255,255,255,0.10)" strokeWidth="2"/>
              <line x1="30" y1="42" x2="90" y2="42" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
              <line x1="30" y1="78" x2="90" y2="78" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
              {/* Перечёркивающая линия */}
              <line x1="28" y1="28" x2="92" y2="92" stroke="rgba(255,80,80,0.55)" strokeWidth="3" strokeLinecap="round"/>
              {/* Замок снизу справа */}
              <rect x="72" y="82" width="22" height="16" rx="4" fill="#1a1a1a" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
              <path d="M76 82v-4a7 7 0 0 1 14 0v4" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="83" cy="90" r="2" fill="rgba(255,255,255,0.35)"/>
            </svg>
            <div className="mt-5 text-[18px] font-sf-ui-medium text-white/80 leading-snug">
              Проблема на стороне провайдера
            </div>
            <div className="mt-2 text-[13px] text-white/35 font-sf-ui-light leading-relaxed max-w-[260px]">
              Попробуйте зайти позже или включить средство подмены трафика (VPN)
            </div>
            <button
              type="button"
              onClick={() => { setLoadError(false); setInitialLoading(true); loadAdsFromStorage().then(all => { const sorted = [...all].sort((a,b) => b.createdAt - a.createdAt); setItems(sorted); persistAdsCache(sorted); setInitialLoading(false) }).catch(() => { setLoadError(true); setInitialLoading(false) }) }}
              className="mt-6 px-6 py-2.5 rounded-full bg-white/8 border border-white/10 text-[14px] text-white/60 font-sf-ui-light active:opacity-70 transition-opacity"
            >
              Попробовать снова
            </button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="w-full min-h-[300px] rounded-[20px] bg-white/[0.028] border border-white/[0.05] px-5 py-8 flex flex-col items-center justify-center text-center">
            <EmptySearchIllustration />
            <div className="mt-5 text-[20px] font-ttc-bold text-white/92">Ничего не найдено</div>
            <div className="mt-2 text-[14px] text-white/45 max-w-[260px] leading-relaxed">
              Попробуйте изменить запрос или выбрать другую категорию
            </div>
          </div>
        ) : (
          <div
            className="w-full rounded-[20px] bg-white/[0.028] grid grid-cols-2 pt-[1px] pb-4"
            style={{
              columnGap: ADS_GRID_GAP,
              rowGap: ADS_GRID_GAP,
            }}
          >
            {visibleItems.map((ad) => {
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
                  userId={ad.userId}
                  isAdult={ad.isAdult}
                  onAdultClick={() => { setAgeGatePendingAd(ad); setAgeGateOpen(true) }}
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
        )}
      </div>
      {/* Плашка подтверждения возраста 18+ */}
      <AnimatePresence>
        {ageGateOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAgeGateOpen(false)}
            />
            <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
              <motion.div
                className="relative w-full rounded-t-[32px] bg-[#121212] border-t border-white/10 px-8 pt-8 pb-[calc(env(safe-area-inset-bottom,0px)+28px)] flex flex-col items-center text-center pointer-events-auto"
                initial={{ translateY: '100%' }} animate={{ translateY: 0 }} exit={{ translateY: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              >
                <div className="w-12 h-1.5 rounded-full bg-white/15 mx-auto mb-6" />
                {/* SVG иллюстрация */}
                <div className="mb-5">
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="36" cy="36" r="35" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
                    <circle cx="36" cy="36" r="26" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                    {/* Глаз */}
                    <ellipse cx="36" cy="36" rx="14" ry="9" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
                    <circle cx="36" cy="36" r="5" fill="rgba(255,255,255,0.7)"/>
                    <circle cx="38" cy="34" r="1.5" fill="rgba(0,0,0,0.5)"/>
                    {/* 18 */}
                    <text x="36" y="58" textAnchor="middle" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.5)" fontFamily="sans-serif">18+</text>
                  </svg>
                </div>
                <div className="text-[22px] font-ttc-bold text-white leading-tight mb-2">
                  Контент для лиц старше 18 лет
                </div>
                <div className="text-[14px] text-white/40 font-sf-ui-light max-w-[260px] leading-relaxed mb-7">
                  Это объявление содержит товары категории 18+. Подтвердите, что вам исполнилось 18 лет.
                </div>
                <button
                  type="button"
                  className="w-full h-[54px] rounded-full bg-white text-black font-sf-ui-medium text-[16px] active:scale-[0.97] transition-all mb-3"
                  onClick={() => {
                    setAgeGateOpen(false)
                    if (ageGatePendingAd && onOpenAd) {
                      onOpenAd(ageGatePendingAd)
                      setAgeGatePendingAd(null)
                    }
                  }}
                >
                  Мне есть 18 лет — продолжить
                </button>
                <p className="text-[11px] text-white/20 font-sf-ui-light leading-relaxed max-w-[280px]">
                  Нажимая «Продолжить», вы подтверждаете своё совершеннолетие и принимаете ответственность за просмотр материалов 18+ в соответствии с законодательством РФ.
                </p>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

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
                    Требуется авторизация
                  </h3>
                  <p className="text-[14px] text-white/40 font-sf-ui-light max-w-[260px]">
                    Чтобы публиковать объявления и общаться, войдите или создайте аккаунт
                  </p>
                 </div>
                 
                 <div className="w-full flex flex-col gap-3 pt-4">
                   <button
                     type="button"
                    className="h-14 w-full rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] active:scale-[0.97] transition-all"
                     onClick={() => {
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
          onAnalytics={() => { setAnalyticsAd(editingAd); setEditingAd(null) }}
        />
      )}
      <AnimatePresence>
        {analyticsAd && (
          <AdAnalytics
            ad={analyticsAd}
            onClose={() => setAnalyticsAd(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

