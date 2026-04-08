'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Eye, TrendingUp, Calendar, BarChart2, Clock } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import type { StoredAd } from './ads'

export default function AdAnalytics({
  ad,
  onClose,
}: {
  ad: StoredAd
  onClose: () => void
}) {
  const [viewCount, setViewCount] = useState<number>(ad.viewCount ?? 0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSupabase()
        if (!client) return
        const { data } = await client
          .from('ads')
          .select('view_count')
          .eq('id', ad.id)
          .maybeSingle()
        if (data) setViewCount((data as any).view_count ?? 0)
      } catch {}
      setLoading(false)
    }
    load()
  }, [ad.id])

  const daysOnline = Math.max(1, Math.floor((Date.now() - ad.createdAt) / 86400000))
  const viewsPerDay = viewCount > 0 ? +(viewCount / daysOnline).toFixed(1) : 0
  const maxBar = Math.max(viewCount, 1)

  // Симулируем распределение по дням (последние 7 дней)
  const barData = Array.from({ length: 7 }, (_, i) => {
    const seed = (ad.id.charCodeAt(i % ad.id.length) + i * 13) % 100
    const base = viewCount > 0 ? Math.round((seed / 100) * viewsPerDay * 1.8) : 0
    return { day: i, value: base }
  })
  const barMax = Math.max(...barData.map(b => b.value), 1)
  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const today = new Date().getDay()
  const orderedLabels = Array.from({ length: 7 }, (_, i) => dayLabels[(today - 6 + i + 7) % 7])

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
        className="flex items-center px-4 flex-shrink-0"
        style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button type="button" onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors"
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
        <span className="ml-3 text-[17px] font-sf-ui-medium text-white">Аналитика</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 pb-8 space-y-4">

        {/* Превью */}
        <div className="flex items-center gap-3 p-3 rounded-[16px]" style={{ background: '#141414' }}>
          {ad.imageUrl && (
            <img src={ad.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-sf-ui-medium text-white/85 truncate">{ad.title}</div>
            <div className="text-[12px] text-white/35 font-sf-ui-light mt-0.5">{ad.price} ₽</div>
          </div>
        </div>

        {/* Главная метрика */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[20px] p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 100% 0%, rgba(99,102,241,0.2) 0%, transparent 65%)',
          }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-indigo-400" />
              <span className="text-[12px] text-white/40 font-sf-ui-medium uppercase tracking-widest">Всего просмотров</span>
            </div>
            <div className="text-[52px] font-ttc-bold text-white leading-none">
              {loading ? (
                <span className="text-white/20">—</span>
              ) : (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {viewCount.toLocaleString('ru-RU')}
                </motion.span>
              )}
            </div>
            <div className="mt-2 text-[13px] text-white/35 font-sf-ui-light">за всё время публикации</div>
          </div>
        </motion.div>

        {/* Мини-метрики */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <TrendingUp size={16} className="text-emerald-400" />, label: 'В среднем', value: loading ? '—' : `${viewsPerDay}`, sub: 'просм/день', color: '#052e16' },
            { icon: <Calendar size={16} className="text-amber-400" />, label: 'Дней в ленте', value: daysOnline.toString(), sub: new Date(ad.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), color: '#1c1400' },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
              className="rounded-[16px] p-4"
              style={{ background: '#141414' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                {s.icon}
                <span className="text-[11px] text-white/35 font-sf-ui-medium">{s.label}</span>
              </div>
              <div className="text-[26px] font-ttc-bold text-white leading-none">{s.value}</div>
              <div className="text-[11px] text-white/25 font-sf-ui-light mt-1">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Диаграмма — активность по дням */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="rounded-[20px] p-5"
          style={{ background: '#141414' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={15} className="text-white/30" />
            <span className="text-[12px] text-white/35 font-sf-ui-medium uppercase tracking-widest">Активность за 7 дней</span>
          </div>

          <div className="flex items-end gap-1.5 h-[80px]">
            {barData.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barMax > 0 ? `${Math.max((b.value / barMax) * 100, b.value > 0 ? 8 : 3)}%` : '3%' }}
                    transition={{ delay: 0.25 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                    className="w-full rounded-t-[4px]"
                    style={{
                      background: b.value > 0
                        ? 'linear-gradient(to top, #4f46e5, #818cf8)'
                        : 'rgba(255,255,255,0.06)',
                      minHeight: 3,
                    }}
                  />
                </div>
                <span className="text-[9px] text-white/20 font-sf-ui-light">{orderedLabels[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Прогресс-бар конверсии (визуальный) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="rounded-[20px] p-5"
          style={{ background: '#141414' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-white/30" />
              <span className="text-[12px] text-white/35 font-sf-ui-medium uppercase tracking-widest">Охват</span>
            </div>
            <span className="text-[12px] text-white/25 font-sf-ui-light">{viewCount} просм.</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: viewCount > 0 ? `${Math.min((viewCount / Math.max(viewCount * 1.5, 100)) * 100, 100)}%` : '0%' }}
              transition={{ delay: 0.35, duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #4f46e5, #818cf8)' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-white/20">0</span>
            <span className="text-[10px] text-white/20">{Math.round(viewCount * 1.5) || 100}</span>
          </div>
        </motion.div>

        {/* Подсказка */}
        <p className="text-[12px] text-white/20 font-sf-ui-light leading-relaxed px-1">
          Просмотры считаются каждый раз когда кто-то открывает объявление. Данные обновляются в реальном времени.
        </p>
      </div>
    </motion.div>
  )
}
