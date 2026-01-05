'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import AdsCreate from './Ads_Create'
import AdsEdit from './Ads_Edit'

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
}

const ADS_SIDE_PADDING = 4
const ADS_GRID_GAP = 6
const ADS_TITLE_MAX_LENGTH = 40

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
}: AdCardProps) {
  const displayTitle =
    title.length > ADS_TITLE_MAX_LENGTH
      ? `${title.slice(0, ADS_TITLE_MAX_LENGTH - 1).trimEnd()}…`
      : title

  const showEditButton = isOwn === true && !!onDelete && !onClick

  return (
    <div
      className="relative w-full"
    >
      <div
        className="relative cursor-pointer overflow-hidden rounded-2xl bg-[#151515] group"
        style={{
          height: `calc(160px + var(--ad-card-info-height, 80px))`,
          borderRadius: showEditButton ? '16px 16px 0 0' : '16px',
        }}
        onClick={onClick}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 scale-110 blur-xl opacity-50"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        <div className="relative h-[160px] overflow-hidden">
          <img src={imageUrl} alt={title} className="relative z-10 h-full w-full object-contain" />
          <div className="absolute left-2 top-2 z-20 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
            <p
              className="text-white font-['SF_UI_Text:Light',sans-serif]"
              style={{ fontSize: 'var(--ad-card-user-tag-size, 12px)' }}
            >
              @{username}
            </p>
          </div>
          {isOwn && (
            <button
              type="button"
              className="absolute right-2 top-2 z-20 flex h-[29px] w-[29px] items-center justify-center rounded-full bg-black/60 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation()
                if (onEdit) onEdit()
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M13.6763 4.31627C13.2488 2.56124 10.7512 2.56124 10.3237 4.31627C10.2599 4.57999 10.1347 4.82492 9.95831 5.03112C9.78194 5.23732 9.55938 5.39897 9.30874 5.50291C9.0581 5.60684 8.78646 5.65014 8.51592 5.62927C8.24538 5.60839 7.9836 5.52394 7.75187 5.38279C6.20832 4.44227 4.44201 6.20855 5.38254 7.75207C5.99006 8.74884 5.45117 10.0494 4.31713 10.325C2.56096 10.7514 2.56096 13.25 4.31713 13.6753C4.58093 13.7392 4.8259 13.8645 5.03211 14.041C5.23831 14.2175 5.39991 14.4402 5.50375 14.691C5.6076 14.9418 5.65074 15.2135 5.62968 15.4841C5.60862 15.7547 5.52394 16.0165 5.38254 16.2482C4.44201 17.7917 6.20832 19.558 7.75187 18.6175C7.98356 18.4761 8.24536 18.3914 8.51597 18.3704C8.78658 18.3493 9.05834 18.3924 9.30912 18.4963C9.5599 18.6001 9.7826 18.7617 9.95911 18.9679C10.1356 19.1741 10.2609 19.4191 10.3248 19.6829C10.7512 21.439 13.2499 21.439 13.6752 19.6829C13.7393 19.4192 13.8647 19.1744 14.0413 18.9684C14.2178 18.7623 14.4405 18.6008 14.6912 18.497C14.9419 18.3932 15.2135 18.35 15.4841 18.3709C15.7546 18.3919 16.0164 18.4764 16.2481 18.6175C17.7917 19.558 19.558 17.7917 18.6175 16.2482C18.4763 16.0165 18.3918 15.7547 18.3709 15.4842C18.35 15.2136 18.3932 14.942 18.497 14.6913C18.6008 14.4406 18.7623 14.2179 18.9683 14.0414C19.1744 13.8648 19.4192 13.7394 19.6829 13.6753C21.439 13.2489 21.439 10.7502 19.6829 10.325C19.4191 10.2611 19.1741 10.1358 18.9679 9.95928C18.7617 9.78278 18.6001 9.56007 18.4962 9.3093C18.3924 9.05853 18.3493 8.78677 18.3703 8.51617C18.3914 8.24556 18.4761 7.98376 18.6175 7.75207C19.558 6.20855 17.7917 4.44227 16.2481 5.38279C16.0164 5.52418 15.7546 5.60886 15.484 5.62992C15.2134 5.65098 14.9417 5.60784 14.6909 5.504C14.4401 5.40016 14.2174 5.23856 14.0409 5.03236C13.8644 4.82616 13.7391 4.58119 13.6752 4.3174L13.6763 4.31627Z" stroke="white" strokeWidth="2" />
                <path d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z" stroke="white" strokeWidth="2" />
              </svg>
            </button>
          )}
        </div>

        <div
          className="relative flex flex-col justify-between bg-gradient-to-b from-[#151515]/95 to-[#151515] p-3"
          style={{ height: 'var(--ad-card-info-height, 80px)' }}
        >
          <div style={{ marginBottom: 'var(--ad-card-title-price-gap, 4px)' }}>
            <h3
              className="line-clamp-1 text-white font-['SF_UI_Text:Medium',sans-serif]"
              style={{ fontSize: 'var(--ad-card-title-size, 15px)' }}
            >
              {displayTitle}
            </h3>
          </div>

          <div>
            <div
              className="flex items-center gap-2 text-white/50"
              style={{
                fontSize: 'var(--ad-card-meta-size, 14px)',
                marginBottom: 'var(--ad-card-meta-price-gap, 2px)',
              }}
            >
              {condition && <span>{condition}</span>}
              {condition && location && <span>•</span>}
              {location && <span>{location}</span>}
            </div>
            <p className="text-lg text-white font-vk-demi">{price} ₽</p>
          </div>
        </div>

        <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover:bg-white/5" />
      </div>

      {showEditButton && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-[1px] w-full bg-white text-black font-sf-ui-medium"
          style={{
            borderRadius: '0 0 16px 16px',
            paddingTop: 6,
            paddingBottom: 6,
            fontSize: 'var(--ad-card-edit-size, 14px)',
          }}
        >
          Изменить
        </button>
      )}
    </div>
  )
}

export default function Ads({
  onOpenAd,
  createOnMount,
  onCreateConsumed,
}: {
  onOpenAd?: (ad: StoredAd) => void
  createOnMount?: boolean
  onCreateConsumed?: () => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [items, setItems] = useState<StoredAd[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserAltId, setCurrentUserAltId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingAd, setEditingAd] = useState<StoredAd | null>(null)

  const [userCity, setUserCity] = useState<string | null>(null)

  useEffect(() => {
    if (createOnMount && !createOpen) {
      setCreateOpen(true)
      if (onCreateConsumed) onCreateConsumed()
    }
  }, [createOnMount, createOpen, onCreateConsumed])

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

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleItems =
    normalizedQuery.length === 0
      ? items
      : items.filter((ad) => ad.title.toLowerCase().includes(normalizedQuery))
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ top: 'var(--feed-controls-top, 10px)' }}
      >
        <div
          className="flex w-full flex-col items-center"
          style={{ rowGap: 'var(--ads-buttons-gap)' }}
        >
          <button
            type="button"
            className="relative flex items-center justify-center"
            style={{
              width: 350.07,
              height: 53.86,
              borderRadius: 10,
              background: 'var(--feed-create-bg)',
            }}
            onClick={() => setCreateOpen(true)}
          >
            <img
              src="/interface/plus-02.svg"
              alt=""
              style={{ width: 25, height: 26, marginRight: 8 }}
            />
            <span
              className="font-vk-demi"
              style={{
                fontSize: 15,
                lineHeight: '19.68px',
                color: '#FFFFFF',
              }}
            >
              Создать обьявление
            </span>
          </button>

          <div
            className="flex justify-between"
            style={{ width: 355, height: 54 }}
          >
            <div
              className="flex items-center"
              style={{
                width: 209.21,
                height: 53.86,
                borderRadius: 10,
                background: 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)',
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <img
                src="/interface/search-02.svg"
                alt=""
                style={{ width: 22, height: 22, marginRight: 8 }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="font-sf-ui-light flex-1 bg-transparent outline-none border-none"
                style={{
                  fontSize: 15,
                  lineHeight: '18px',
                  color: '#A8A8A8',
                }}
              />
            </div>

            <button
              type="button"
              className="flex items-center justify-center"
              style={{
                width: 135,
                height: 54,
                borderRadius: 10,
                background: 'linear-gradient(180deg, #111111 0%, #1D1F1D 100%)',
              }}
            >
              <img
                src="/interface/filter.svg"
                alt=""
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <span
                className="font-vk-demi"
                style={{
                  fontSize: 15,
                  lineHeight: '19.68px',
                  color: '#FFFFFF',
                }}
              >
                Фильтры
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        className="absolute left-0 right-0 bottom-0 overflow-y-auto scrollbar-hidden"
        style={{
          top: 'calc(var(--feed-controls-top) + 130px)',
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
      {editingAd && (
        <AdsEdit
          ad={editingAd}
          onClose={() => setEditingAd(null)}
        />
      )}
    </div>
  )
}
