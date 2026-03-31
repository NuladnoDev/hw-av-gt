'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ShieldCheck, Plus, ChevronRight, Users, ShoppingBag, MapPin } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

type StoreCard = {
  id: string
  name: string
  avatarUrl: string | null
  isVerified: boolean
  rating: number
  city: string | null
  adsCount: number
  followersCount: number
}

type MyStore = {
  id: string
  name: string
  avatar_url: string | null
}

const StoreHeroIllustration = () => (
  <div className="w-full flex justify-center py-8">
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="140" cy="90" r="70" fill="url(#hero_glow)" fillOpacity="0.15" />
      <rect x="80" y="40" width="120" height="100" rx="12" fill="#1A1A1A" stroke="white" strokeOpacity="0.1" strokeWidth="2" />
      <rect x="90" y="50" width="100" height="60" rx="4" fill="#0A0A0A" />
      <rect x="100" y="60" width="20" height="20" rx="4" fill="#3B82F6" fillOpacity="0.4" />
      <rect x="130" y="60" width="20" height="20" rx="4" fill="#8B5CF6" fillOpacity="0.4" />
      <rect x="160" y="60" width="20" height="20" rx="4" fill="#EC4899" fillOpacity="0.4" />
      <defs>
        <radialGradient id="hero_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(140 90) rotate(90) scale(90)">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  </div>
)

export default function StoreCatalog({
  onCreateStore,
  onOpenStore,
  myStores = [],
}: {
  onCreateStore: () => void
  onOpenStore: (id: string) => void
  myStores?: MyStore[]
}) {
  const [stores, setStores] = useState<StoreCard[]>([])
  const [loading, setLoading] = useState(true)

  const myStoreIds = useMemo(() => new Set(myStores.map((s) => s.id)), [myStores])

  useEffect(() => {
    let cancelled = false
    const loadStores = async () => {
      const client = getSupabase()
      if (!client) {
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      try {
        const { data, error } = await client
          .from('stores')
          .select('id, name, avatar_url, verified, rating, city, created_at')
          .order('created_at', { ascending: false })
          .limit(60)
        if (error || !data) {
          if (!cancelled) setStores([])
          return
        }

        const rows = data as Array<{
          id: string
          name: string
          avatar_url: string | null
          verified: boolean | null
          rating: number | null
          city: string | null
        }>

        const enriched = await Promise.all(
          rows.map(async (row) => {
            const [adsRes, followersRes] = await Promise.all([
              client.from('ads').select('*', { count: 'exact', head: true }).eq('store_id', row.id),
              client.from('store_follows').select('*', { count: 'exact', head: true }).eq('store_id', row.id),
            ])
            return {
              id: row.id,
              name: row.name,
              avatarUrl: row.avatar_url,
              isVerified: !!row.verified,
              rating: typeof row.rating === 'number' ? row.rating : 0,
              city: row.city,
              adsCount: adsRes.count ?? 0,
              followersCount: followersRes.count ?? 0,
            } satisfies StoreCard
          }),
        )

        enriched.sort((a, b) => {
          const scoreA = a.adsCount * 2 + a.followersCount + a.rating * 10
          const scoreB = b.adsCount * 2 + b.followersCount + b.rating * 10
          return scoreB - scoreA
        })

        if (!cancelled) setStores(enriched)
      } catch {
        if (!cancelled) setStores([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadStores()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-y-auto scrollbar-hidden">
      <div className="flex flex-col items-center">
        <StoreHeroIllustration />
        {myStores.length === 0 && (
          <div className="px-6 w-full mb-8">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onCreateStore}
              className="w-full h-14 rounded-[22px] bg-white text-black font-sf-ui-bold text-[16px] flex items-center justify-center gap-2.5 shadow-xl shadow-white/5 active:bg-zinc-200 transition-colors"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              Открыть свой магазин
            </motion.button>
          </div>
        )}
      </div>

      {myStores.length > 0 && (
        <div className="px-6 mb-4">
          <div className="text-[13px] text-white/35 uppercase tracking-widest mb-2">Ваши магазины</div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
            {myStores.map((store) => (
              <button
                key={store.id}
                onClick={() => onOpenStore(store.id)}
                className="shrink-0 h-10 px-3 rounded-xl bg-white/10 border border-white/15 text-white text-[13px] flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-md overflow-hidden bg-white/20 flex items-center justify-center text-[10px] font-ttc-bold">
                  {store.avatar_url ? (
                    <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    store.name[0].toUpperCase()
                  )}
                </div>
                <span className="truncate max-w-[120px]">{store.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 mb-3 mt-1">
        <h3 className="text-[20px] font-ttc-bold text-white/90">Витрины магазинов</h3>
      </div>

      <div className="flex flex-col border-t border-white/5">
        {loading ? (
          <div className="px-6 py-10 text-center text-white/35 text-[14px]">Загружаем магазины...</div>
        ) : stores.length === 0 ? (
          <div className="px-6 py-10 text-center text-white/35 text-[14px]">Пока нет ни одного магазина</div>
        ) : (
          stores.map((store) => (
            <motion.button
              key={store.id}
              whileTap={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={() => onOpenStore(store.id)}
              className="w-full px-6 py-4 flex items-center gap-4 border-b border-white/5 active:bg-white/[0.03] transition-colors group"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-white/20 transition-colors">
                  {store.avatarUrl ? (
                    <img src={store.avatarUrl} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10">
                      <span className="text-white text-[20px] font-ttc-bold">{store.name[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                {myStoreIds.has(store.id) && (
                  <div className="absolute -bottom-1 -right-1 px-1.5 h-4 rounded-full bg-blue-500 text-[9px] text-white font-sf-ui-bold flex items-center">
                    MY
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col items-start gap-0.5 overflow-hidden">
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-[16px] font-ttc-bold text-white group-hover:text-blue-400 transition-colors truncate">{store.name}</span>
                  {store.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-[12px] text-white/35">
                  {store.city ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {store.city}
                    </span>
                  ) : (
                    <span>Без города</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 text-[11px] text-white/60 font-sf-ui-medium">
                  <ShoppingBag className="w-3 h-3" />
                  {store.adsCount}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-white/30 font-sf-ui-medium">
                  <Users className="w-3 h-3" />
                  {store.followersCount}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/30 transition-all group-hover:translate-x-1" />
            </motion.button>
          ))
        )}
      </div>

      <div className="h-32 shrink-0" />
    </div>
  )
}

