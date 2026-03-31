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
      <div className="px-6 pt-4 pb-3">
        <div className="text-[22px] font-ttc-bold text-white/90">Магазины</div>
        <div className="text-[13px] text-white/35 mt-1">Витрины продавцов и брендов</div>
      </div>
      <div className="px-6 pb-4">
        <div className="overflow-hidden rounded-[22px] border border-white/[0.05] bg-[#121212]">
          <div className="relative p-4 min-h-[220px]">
            <div
              className="absolute inset-0 opacity-90 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 18% 22%, rgba(88, 88, 88, 0.26) 0%, transparent 46%), radial-gradient(circle at 85% 75%, rgba(72, 72, 72, 0.2) 0%, transparent 48%), linear-gradient(135deg, #161616 0%, #111111 100%)',
              }}
            />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="max-w-[62%]">
                <div className="text-[12px] tracking-[0.04em] text-white/45">О вашем магазине</div>
                <div className="mt-1 text-[18px] leading-[1.1] font-ttc-bold text-white">
                  Создайте витрину и публикуйте объявления от имени магазина
                </div>
                <div className="mt-2 text-[13px] text-white/45">
                  Добавьте описание, город и начните собирать подписчиков
                </div>
              </div>
              <motion.svg
                width="124"
                height="102"
                viewBox="0 0 124 102"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
                animate={{ y: [0, -3, 0], rotate: [0, -1, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <rect x="10" y="18" width="84" height="62" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />
                <rect x="22" y="30" width="52" height="7" rx="3.5" fill="rgba(255,255,255,0.24)" />
                <rect x="22" y="43" width="42" height="5.5" rx="2.75" fill="rgba(255,255,255,0.15)" />
                <rect x="22" y="53" width="30" height="5.5" rx="2.75" fill="rgba(255,255,255,0.1)" />
                <rect x="77" y="42" width="11" height="26" rx="5.5" fill="rgba(255,255,255,0.1)" />
                <circle cx="98" cy="28" r="11" fill="rgba(255,255,255,0.12)" />
                <path d="M98 23V33M93 28H103" stroke="rgba(255,255,255,0.72)" strokeWidth="2" strokeLinecap="round" />
                <motion.circle
                  cx="18"
                  cy="14"
                  r="3"
                  fill="rgba(255,255,255,0.35)"
                  animate={{ opacity: [0.25, 0.8, 0.25] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.svg>
            </div>
            <motion.button
              whileTap={{ scale: myStores.length > 0 ? 1 : 0.98 }}
              disabled={myStores.length > 0}
              onClick={() => {
                if (myStores.length > 0) return
                onCreateStore()
              }}
              className={`relative z-10 mt-3 h-[46px] w-full rounded-[16px] border text-[14px] font-sf-ui-medium flex items-center justify-center gap-2 transition-colors ${
                myStores.length > 0
                  ? 'bg-white/[0.03] border-white/[0.04] text-white/35 cursor-not-allowed'
                  : 'bg-white/[0.06] border-white/[0.08] text-white active:bg-white/[0.1]'
              }`}
            >
              <Plus className="w-4.5 h-4.5" strokeWidth={2.2} />
              {myStores.length > 0 ? 'Магазин уже создан' : 'Создать магазин'}
            </motion.button>
          </div>
        </div>
      </div>
      <div className="mx-6 border-b border-white/[0.04]" />

      {myStores.length > 0 && (
        <div className="px-6 mt-4 mb-3">
          <div className="text-[12px] text-white/40 mb-2">Ваши магазины</div>
          <div className="rounded-[16px] bg-white/[0.02] p-2 flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
            {myStores.map((store) => (
              <button
                key={store.id}
                onClick={() => onOpenStore(store.id)}
                className="shrink-0 h-10 px-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] text-white text-[13px] flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-[8px] overflow-hidden bg-white/20 flex items-center justify-center text-[10px] font-ttc-bold">
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

      <div className="px-6 mb-2 mt-2">
        <h3 className="text-[15px] font-sf-ui-medium text-white/75">Все витрины</h3>
      </div>

      <div className="flex flex-col border-t border-white/[0.04]">
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
              className="w-full px-6 py-4 flex items-center gap-3 border-b border-white/[0.04] active:bg-white/[0.03] transition-colors group"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-[14px] overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-white/[0.14] transition-colors">
                  {store.avatarUrl ? (
                    <img src={store.avatarUrl} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10">
                      <span className="text-white text-[16px] font-ttc-bold">{store.name[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                {myStoreIds.has(store.id) && (
                  <div className="absolute -bottom-1 -right-1 px-1.5 h-4 rounded-full bg-white/90 text-[9px] text-black font-sf-ui-bold flex items-center">
                    MY
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col items-start gap-0.5 overflow-hidden">
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-[15px] font-sf-ui-medium text-white/90 group-hover:text-white transition-colors truncate">{store.name}</span>
                  {store.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-white/65 shrink-0" />}
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
                <div className="flex items-center gap-1 text-[11px] text-white/55 font-sf-ui-medium">
                  <ShoppingBag className="w-3 h-3" />
                  {store.adsCount}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-white/30 font-sf-ui-medium">
                  <Users className="w-3 h-3" />
                  {store.followersCount}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-white/15 group-hover:text-white/35 transition-all group-hover:translate-x-1" />
            </motion.button>
          ))
        )}
      </div>

      <div className="h-32 shrink-0" />
    </div>
  )
}

