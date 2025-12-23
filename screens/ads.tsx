'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import AdsCreate from './Ads_Create'

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
}

const ADS_SIDE_PADDING = 4
const ADS_GRID_GAP = 6
const ADS_TITLE_MAX_LENGTH = 40

export type StoredAd = {
  id: string
  userId: string | null
  userTag: string | null
  title: string
  price: string
  imageUrl: string
  condition: string | null
  location: string | null
  category: string | null
  createdAt: number
}

type AdsTableRow = {
  id: string
  user_id: string | null
  user_tag: string | null
  title: string | null
  price: string | null
  image_url: string | null
  condition: string | null
  location: string | null
  category: string | null
  created_at: string | null
}

const mapRowToStoredAd = (row: AdsTableRow): StoredAd => {
  const created = row.created_at ? new Date(row.created_at).getTime() : Date.now()
  return {
    id: row.id,
    userId: row.user_id ?? null,
    userTag: row.user_tag ?? null,
    title: row.title ?? '',
    price: row.price ?? '',
    imageUrl: row.image_url ?? '',
    condition: row.condition,
    location: row.location,
    category: row.category,
    createdAt: created,
  }
}

export const loadAdsFromStorage = async (): Promise<StoredAd[]> => {
  const client = getSupabase()
  if (!client) return []
  try {
    const { data, error } = await client
      .from('ads')
      .select('id,user_id,user_tag,title,price,image_url,condition,location,category,created_at')
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

export function AdCard({ title, price, imageUrl, username, condition, location, onDelete, isOwn }: AdCardProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [translateX, setTranslateX] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const canSwipe = !!onDelete && (isOwn === undefined || isOwn === true)

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (deleting || !canSwipe) return
    if (e.touches.length > 0) {
      setTouchStartX(e.touches[0].clientX)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (deleting || !canSwipe) return
    if (touchStartX === null) return
    if (e.touches.length === 0) return
    const currentX = e.touches[0].clientX
    const delta = currentX - touchStartX
    if (delta < 0) {
      setTranslateX(delta)
    }
  }

  const handleTouchEnd = () => {
    if (deleting || !canSwipe) return
    if (translateX < -80 && onDelete) {
      setDeleting(true)
      setTranslateX(-400)
      setTimeout(() => {
        onDelete()
      }, 160)
    } else {
      setTranslateX(0)
    }
    setTouchStartX(null)
  }

  const displayTitle =
    title.length > ADS_TITLE_MAX_LENGTH
      ? `${title.slice(0, ADS_TITLE_MAX_LENGTH - 1).trimEnd()}…`
      : title

  return (
    <div
      className="relative h-[240px] cursor-pointer overflow-hidden rounded-2xl bg-[#151515] group"
      style={{
        transform: `translateX(${translateX}px)`,
        transition: touchStartX === null || deleting ? 'transform 0.16s ease-out' : 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
          <p className="text-xs text-white font-['SF_UI_Text:Light',sans-serif]">@{username}</p>
        </div>
      </div>

      <div className="relative flex h-[80px] flex-col justify-between bg-gradient-to-b from-[#151515]/95 to-[#151515] p-3">
        <div>
          <h3 className="mb-1 line-clamp-1 text-sm text-white font-['SF_UI_Text:Medium',sans-serif]">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-2 text-xs text-white/50">
            {condition && <span>{condition}</span>}
            {condition && location && <span>•</span>}
            {location && <span>{location}</span>}
          </div>
        </div>
        <p className="text-lg text-white font-vk-demi">{price} ₽</p>
      </div>

      <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover:bg-white/5" />
    </div>
  )
}

export default function Ads() {
  const [createOpen, setCreateOpen] = useState(false)
  const [items, setItems] = useState<StoredAd[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('hw-auth')
      const auth = raw ? (JSON.parse(raw) as { uid?: string | null } | null) : null
      const uid = auth?.uid ?? null
      setCurrentUserId(typeof uid === 'string' && uid.length > 0 ? uid : null)
    } catch {
      setCurrentUserId(null)
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
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ top: 'var(--feed-controls-top)' }}
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
            <button
              type="button"
              className="flex items-center"
              style={{
                width: 209.21,
                height: 53.86,
                borderRadius: 10,
                background: 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)',
                paddingLeft: 16,
              }}
            >
              <img
                src="/interface/search-02.svg"
                alt=""
                style={{ width: 22, height: 22, marginRight: 8 }}
              />
              <span
                className="font-sf-ui-light"
                style={{
                  fontSize: 15,
                  lineHeight: '18px',
                  color: '#A8A8A8',
                }}
              >
                Поиск в Кадуе
              </span>
            </button>

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
        className="absolute left-0 right-0 bottom-0 overflow-y-auto"
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
            {items.map((ad) => {
              const isOwn = currentUserId !== null && ad.userId === currentUserId
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
    </div>
  )
}
