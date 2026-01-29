'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
}

const ADS_SIDE_PADDING = 4
const ADS_GRID_GAP = 6
const ADS_TITLE_MAX_LENGTH = 40

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
  specs: string | null
  created_at: string | null
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
      .select('*')
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

export function AdCard({
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
}: AdCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
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
        className="relative cursor-pointer overflow-hidden rounded-2xl bg-[var(--bg-secondary)] group active:scale-[0.98] transition-all duration-200"
        style={{
          minHeight: `calc(160px + var(--ad-card-info-height, 84px))`,
          borderRadius: '18px',
        }}
        onClick={onClick}
      >
        {/* Background Blur Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 scale-125 blur-2xl opacity-[0.15] saturate-200"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Image Container */}
        <div className="relative h-[160px] overflow-hidden bg-black/20 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={title} 
            className="relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          
          {/* Top Overlays */}
          {!showEditLabel && (
            <div className="absolute left-2.5 top-2.5 z-20 rounded-xl bg-black/40 px-2.5 py-1.5 backdrop-blur-md border border-white/5">
              <p
                className="text-white font-sf-ui-medium tracking-tight"
                style={{ fontSize: '11px' }}
              >
                @{username}
              </p>
            </div>
          )}
          
          {isOwn && (
            <button
              type="button"
              className="absolute right-2.5 top-2.5 z-20 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-colors"
              style={{
                height: 30,
                minWidth: 30,
                paddingLeft: showEditLabel ? 10 : 0,
                paddingRight: showEditLabel ? 12 : 0,
                gap: showEditLabel ? 6 : 0,
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (onEdit) onEdit()
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M13.6763 4.31627C13.2488 2.56124 10.7512 2.56124 10.3237 4.31627C10.2599 4.57999 10.1347 4.82492 9.95831 5.03112C9.78194 5.23732 9.55938 5.39897 9.30874 5.50291C9.0581 5.60684 8.78646 5.65014 8.51592 5.62927C8.24538 5.60839 7.9836 5.52394 7.75187 5.38279C6.20832 4.44227 4.44201 6.20855 5.38254 7.75207C5.99006 8.74884 5.45117 10.0494 4.31713 10.325C2.56096 10.7514 2.56096 13.25 4.31713 13.6753C4.58093 13.7392 4.8259 13.8645 5.03211 14.041C5.23831 14.2175 5.39991 14.4402 5.50375 14.691C5.6076 14.9418 5.65074 15.2135 5.62968 15.4841C5.60862 15.7547 5.52394 16.0165 5.38254 16.2482C4.44201 17.7917 6.20832 19.558 7.75187 18.6175C7.98356 18.4761 8.24536 18.3914 8.51597 18.3704C8.78658 18.3493 9.05834 18.3924 9.30912 18.4963C9.5599 18.6001 9.7826 18.7617 9.95911 18.9679C10.1356 19.1741 10.2609 19.4191 10.3248 19.6829C10.7512 21.439 13.2499 21.439 13.6752 19.6829C13.7393 19.4192 13.8647 19.1744 14.0413 18.9684C14.2178 18.7623 14.4405 18.6008 14.6912 18.497C14.9419 18.3932 15.2135 18.35 15.4841 18.3709C15.7546 18.3919 16.0164 18.4764 16.2481 18.6175C17.7917 19.558 19.558 17.7917 18.6175 16.2482C18.4763 16.0165 18.3918 15.7547 18.3709 15.4842C18.35 15.2136 18.3932 14.942 18.497 14.6913C18.6008 14.4406 18.7623 14.2179 18.9683 14.0414C19.1744 13.8648 19.4192 13.7394 19.6829 13.6753C21.439 13.2489 21.439 10.7502 19.6829 10.325C19.4191 10.2611 19.1741 10.1358 18.9679 9.95928C18.7617 9.78278 18.6001 9.56007 18.4962 9.3093C18.3924 9.05853 18.3493 8.78677 18.3703 8.51617C18.3914 8.24556 18.4761 7.98376 18.6175 7.75207C19.558 6.20855 17.7917 4.44227 16.2481 5.38279C16.0164 5.52418 15.7546 5.60886 15.484 5.62992C15.2134 5.65098 14.9417 5.60784 14.6909 5.504C14.4401 5.40016 14.2174 5.23856 14.0409 5.03236C13.8644 4.82616 13.7391 4.58119 13.6752 4.3174L13.6763 4.31627Z" stroke="white" strokeWidth="2" />
                <path d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z" stroke="white" strokeWidth="2" />
              </svg>
              {showEditLabel && (
                <span className="font-sf-ui-medium text-[12px] text-white">
                  Изменить
                </span>
              )}
            </button>
          )}
        </div>

        {/* Info Section */}
        <div
          className="relative flex flex-col p-3.5 bg-[var(--bg-secondary)] backdrop-blur-sm border-t border-[var(--border-light)]"
          style={{ minHeight: 'var(--ad-card-info-height, 84px)' }}
        >
          <div className="flex flex-col gap-0.5">
            <h3
              className="line-clamp-1 text-[var(--text-primary)] font-ttc-demibold tracking-tight translate-y-[1px]"
              style={{ fontSize: 16, lineHeight: '20px' }}
            >
              {displayTitle}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-sf-ui-medium text-[11px] uppercase tracking-wider">
                {condition && (
                  <span className={
                    condition === 'Новое' ? 'text-emerald-400' : 
                    condition === 'Отличное' ? 'text-green-400' :
                    condition === 'Хорошее' ? 'text-yellow-400' :
                    condition === 'Не очень' ? 'text-orange-400' : 'text-[var(--text-secondary)]'
                  }>
                    {condition}
                  </span>
                )}
                {condition && (location || (specs && specs.length > 0)) && <span>•</span>}
                
                {specs && specs.length > 0 ? (
                  <button
                    type="button"
                    className="flex items-center gap-1 active:opacity-60 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExpanded(!isExpanded)
                    }}
                  >
                    <span className="text-[var(--text-secondary)] font-sf-ui-medium text-[11px] uppercase tracking-wider">Детали</span>
                    <motion.svg 
                      width="8" 
                      height="8" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[var(--text-secondary)]"
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                    >
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  </button>
                ) : (
                  location && <span className="line-clamp-1">{location}</span>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && specs && specs.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border-light)]">
                  {specs.slice(0, 4).map((spec, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)] opacity-60 font-sf-ui-light line-clamp-1 mr-2">{spec.label}</span>
                      <span className="text-[var(--text-primary)] opacity-80 font-sf-ui-medium text-right line-clamp-1">{spec.value}</span>
                    </div>
                  ))}
                  {specs.length > 4 && (
                    <div className="text-[10px] text-[var(--text-secondary)] opacity-40 font-sf-ui-light italic mt-0.5">
                      + ещё {specs.length - 4}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-baseline justify-between mt-3">
            <div className="text-[19px] text-[var(--text-primary)] font-ttc-demibold tracking-tight translate-y-[1px]">
              {Number(price).toLocaleString('ru-RU')} <span className="text-[15px] font-sf-ui-medium opacity-70">₽</span>
            </div>
            {publishedText && (
              <span className="text-[11px] text-[var(--text-secondary)] opacity-50 font-sf-ui-medium uppercase">
                {publishedText}
              </span>
            )}
          </div>
        </div>

        {/* Hover Highlight */}
        <div className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/[0.02] pointer-events-none" />
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
          <div className="space-y-2">
            <div className={`h-4 w-3/4 rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-16 rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
              </div>
              <div className={`h-3 w-20 rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
              </div>
            </div>
          </div>
          <div className={`mt-2 h-5 w-24 rounded ${theme === 'dark' ? 'bg-[#121212]' : 'bg-black/5'} overflow-hidden relative`}>
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${theme === 'dark' ? 'via-white/10' : 'via-black/5'} to-transparent animate-shimmer`} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Ads({
  onOpenAd,
  createOnMount,
  onCreateConsumed,
  isAuthed,
}: {
  onOpenAd?: (ad: StoredAd) => void
  createOnMount?: boolean
  onCreateConsumed?: () => void
  isAuthed?: boolean
}) {
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null)
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
      setItems(all.sort((a, b) => b.createdAt - a.createdAt))
      setInitialLoading(false)
    }
    load()
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ type?: string; id?: string; row?: AdsTableRow }>
      if (ev.detail?.type === 'created' && ev.detail.row) {
        const ad = mapRowToStoredAd(ev.detail.row)
        setItems((prev) => {
          if (prev.some((x) => x.id === ad.id)) return prev
          return [ad, ...prev]
        })
        return
      }
      if (ev.detail?.type === 'deleted' && ev.detail.id) {
        setItems((prev) => prev.filter((a) => a.id !== ev.detail.id))
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

    return filtered
  }, [items, searchQuery, activeFilters, selectedCategory])
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ top: 'var(--feed-controls-top, 10px)' }}
      >
        <div
          className="flex w-full flex-col items-center"
        >
          <div
            className="flex items-stretch"
            style={{ width: 355, height: 54 }}
          >
            <motion.div
              className="flex h-full items-center backdrop-blur-xl relative overflow-hidden group"
              style={{
                width: 355,
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
                className="flex h-full items-center relative z-10"
                style={{
                  width: 209.21,
                  paddingRight: 16,
                }}
                animate={{
                  width: isSearchActive ? 355 : 209.21,
                }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
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
              <AnimatePresence>
                {!isSearchActive && (
                  <motion.button
                    type="button"
                    className="flex h-full items-center justify-center relative z-10"
                    style={{
                      width: 135,
                      height: 54,
                        borderRadius: 0,
                        borderLeft: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: 'transparent',
                      }}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    onClick={() => setFiltersOpen(true)}
                  >
                    <img
                      src="/interface/filter.svg"
                      alt=""
                      style={{ 
                        width: 24, 
                        height: 24, 
                        marginRight: 8,
                        filter: theme === 'dark' ? 'none' : 'invert(1) opacity(0.8)'
                      }}
                    />
                    <span
                      className="font-vk-demi"
                      style={{
                        fontSize: 15,
                        lineHeight: '19.68px',
                        color: theme === 'dark' ? '#FFFFFF' : '#000000',
                      }}
                    >
                      Фильтры
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Category Carousel */}
          <AnimatePresence>
            {showCategories && (
              <motion.div 
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 14 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full relative overflow-hidden"
              >
                {/* Left fade gradient – только вокруг карусели */}
                <div 
                  className="absolute left-[-24px] top-0 bottom-0 z-10 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, var(--bg-primary), transparent)',
                    width: 48,
                  }}
                />
                {/* Right fade gradient – только вокруг карусели */}
                <div 
                  className="absolute right-[-24px] top-0 bottom-0 z-10 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to left, var(--bg-primary), transparent)',
                    width: 48,
                  }}
                />
                <div 
                  className="flex overflow-x-auto scrollbar-hidden category-carousel px-1" 
                  style={{ width: 355, margin: '0 auto' }}
                >
                  <div className="flex gap-2 py-1">
                    {[
                      { name: 'Новые', color: '#FF6B6B' },
                      { name: 'Подтверждённые', color: '#F9CA24' },
                      { name: 'Популярные', color: '#32CD32' },
                      { name: 'Бесплатно', color: '#6C5CE7' },
                      { name: 'Обмен', color: '#A29BFE' },
                      { name: 'Аукцион', color: '#FD79A8', disabled: true }
                    ].map((category, index) => (
                      <motion.button
                        key={category.name}
                        type="button"
                        disabled={category.disabled}
                        className={`flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-full font-ttc-demibold text-sm transition-all duration-300 backdrop-blur-xl relative overflow-hidden ${
                          category.disabled 
                            ? 'opacity-40 grayscale cursor-not-allowed' 
                            : selectedCategory === category.name 
                              ? 'scale-105 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)]' 
                              : theme === 'dark' ? 'hover:scale-105 hover:bg-white/[0.05]' : 'hover:scale-105 hover:bg-black/[0.05]'
                        } active:scale-95`}
                        style={{
                          backgroundColor: category.disabled 
                            ? theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
                            : selectedCategory === category.name 
                              ? `${category.color}40` 
                              : `${category.color}15`,
                          border: `1px solid ${category.disabled 
                            ? theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                            : selectedCategory === category.name 
                              ? category.color 
                              : `${category.color}40`}`,
                          color: category.disabled 
                            ? theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                            : theme === 'dark' ? '#FFFFFF' : '#000000',
                        }}
                        whileHover={category.disabled ? {} : { y: -1 }}
                        whileTap={category.disabled ? {} : { scale: 0.95 }}
                        onClick={() => {
                          if (category.disabled) return
                          setSelectedCategory(selectedCategory === category.name ? null : category.name)
                          console.log('Category clicked:', category.name)
                        }}
                      >
                        {/* Glass Shine Effect */}
                        {!category.disabled && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className={`absolute inset-0 opacity-20 ${theme === 'dark' ? 'bg-gradient-to-tr from-transparent via-white/10 to-white/20' : 'bg-gradient-to-tr from-transparent via-black/10 to-black/20'}`} />
                            {selectedCategory === category.name && (
                              <motion.div 
                                layoutId="category-glow"
                                className="absolute inset-0 blur-md opacity-30"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                          </div>
                        )}
                        <span className="relative z-10 translate-y-[1px]">{category.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div
        className="absolute left-0 right-0 bottom-0 overflow-y-auto scrollbar-hidden transition-all duration-300"
        style={{
          top: showCategories ? 'calc(var(--feed-controls-top) + 128px)' : 'calc(var(--feed-controls-top) + 72px)',
          paddingLeft: ADS_SIDE_PADDING,
          paddingRight: ADS_SIDE_PADDING,
          paddingBottom: 16,
        }}
      >
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
                      onClick={() => {
                        if (onOpenAd) {
                          onOpenAd(ad)
                        }
                      }}
                      onEdit={isOwn ? () => setEditingAd(ad) : undefined}
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
              className="fixed inset-0 z-[85]"
              initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
              animate={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
              exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => {
                if (contactWarningLocked) return
                setContactWarningOpen(false)
              }}
            />
            
            {/* Само уведомление - выше всего */}
             <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
               <motion.button
                 type="button"
                 className="relative mb-[calc(var(--nav-bottom-offset,12px)+var(--bottom-nav-height,96px)+15px)] w-[340px] max-w-[94%] rounded-2xl bg-white px-5 py-4 text-left shadow-2xl flex items-center justify-between overflow-hidden pointer-events-auto"
                 initial={{ translateY: 40, opacity: 0 }}
                 animate={{ translateY: 0, opacity: 1 }}
                 exit={{ translateY: 40, opacity: 0 }}
                 transition={{ duration: 0.25, ease: 'easeOut' }}
                 onClick={() => {
                   if (contactWarningLocked) return
                   if (typeof window !== 'undefined') {
                     const ev = new Event('open-contacts')
                     window.dispatchEvent(ev)
                   }
                   setContactWarningOpen(false)
                 }}
               >
                 <div className="flex-1 pr-4">
                   <div className="text-[15px] leading-[1.4em] text-black font-sf-ui-medium">
                     Для создания объявлений нужно указать способ связи
                   </div>
                   <div className="mt-1 text-[13px] leading-[1.4em] text-black/80 font-sf-ui-light">
                     Нажмите, чтоб указать
                   </div>
                 </div>
                 <div className="flex-shrink-0">
                   <img 
                     src="/interface/telegram.svg" 
                     alt="" 
                     className="w-12 h-12"
                   />
                 </div>
               </motion.button>
             </div>
          </>
        )}

        {authWarningOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[85]"
              initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
              animate={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
              exit={{ backgroundColor: 'rgba(0,0,0,0)' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => {
                if (authWarningLocked) return
                setAuthWarningOpen(false)
              }}
            />
            
             <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
               <motion.div
                 className="relative mb-[calc(var(--nav-bottom-offset,12px)+var(--bottom-nav-height,96px)+15px)] w-[340px] max-w-[94%] rounded-2xl bg-[#1C1C1E] px-5 py-6 text-center shadow-2xl flex flex-col items-center pointer-events-auto"
                 initial={{ translateY: 40, opacity: 0 }}
                 animate={{ translateY: 0, opacity: 1 }}
                 exit={{ translateY: 40, opacity: 0 }}
                 transition={{ duration: 0.25, ease: 'easeOut' }}
               >
                 <div className="text-[17px] leading-[1.3] text-white font-sf-ui-medium mb-6">
                   Чтобы публиковать объявления нужен аккаунт
                 </div>
                 
                 <button
                   type="button"
                   className="h-[44px] w-full rounded-[10px] bg-white text-black font-vk-demi text-[15px] mb-3"
                   onClick={() => {
                     setAuthWarningOpen(false)
                     window.dispatchEvent(new Event('trigger-auth'))
                   }}
                 >
                   Зарегистрироваться
                 </button>
                 
                 <button
                   type="button"
                   className="text-[12px] text-white/70 font-sf-ui-light"
                   onClick={() => {
                     setAuthWarningOpen(false)
                     window.dispatchEvent(new CustomEvent('trigger-auth', { detail: { screen: 'login' } }))
                   }}
                 >
                   У меня уже есть аккаунт
                 </button>
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
