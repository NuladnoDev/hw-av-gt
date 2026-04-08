'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, TrendingUp, Eye, Zap, Star, BarChart2, Users, Clock, Check } from 'lucide-react'

const PLANS = [
  {
    id: 'base',
    name: 'Буст',
    price: '149',
    days: 3,
    features: ['×2 показов в ленте', 'Значок «Продвигается»', 'Приоритет в поиске'],
  },
  {
    id: 'pro',
    name: 'Стандартный',
    price: '349',
    days: 7,
    popular: true,
    features: ['×5 показов в ленте', 'Значок «Продвигается»', 'Топ поиска', 'Рекомендации похожим'],
  },
  {
    id: 'max',
    name: 'Постоянная реклама',
    price: '699',
    days: 14,
    features: ['×10 показов в ленте', 'Значок «Продвигается»', 'Топ-1 поиска', 'Рекомендации', 'Баннер в ленте'],
  },
]

const CHART_DATA = [12, 28, 45, 38, 62, 89, 134, 178, 210, 245, 198, 267, 312, 289]

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-1 h-[60px]">
      {data.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ delay: 0.03 * i, duration: 0.5, ease: 'easeOut' }}
          className="flex-1 rounded-t-[3px]"
          style={{ background: i >= data.length - 7 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)' }}
        />
      ))}
    </div>
  )
}

export default function PromotePage() {
  const [selected, setSelected] = useState('pro')
  const selectedPlan = PLANS.find(p => p.id === selected)!

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    html.style.cssText += '; position: static !important; overflow: auto !important; height: auto !important;'
    body.style.cssText += '; position: static !important; overflow: auto !important; height: auto !important;'
    return () => {
      html.style.position = ''
      html.style.overflow = ''
      html.style.height = ''
      body.style.position = ''
      body.style.overflow = ''
      body.style.height = ''
    }
  }, [])

  return (
    <div className="bg-[#0a0a0a] text-white">
      {/* Шапка */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/[0.05] px-4 h-14 flex items-center gap-3">
        <button onClick={() => window.close()} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 active:bg-white/10 transition-colors">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <span className="text-[16px] font-sf-ui-medium text-white">Продвижение</span>
      </div>

      <div className="px-4 py-6 space-y-5 max-w-lg mx-auto" style={{ scrollbarWidth: 'none' }}>
        <style>{`body::-webkit-scrollbar, html::-webkit-scrollbar { display: none; }`}</style>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 100% 0%, rgba(255,100,50,0.35) 0%, transparent 65%)',
          }} />
          <motion.div
            animate={{ x: ['-100%', '400%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 8 }}
            className="absolute top-[45%] left-0 w-[25%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-orange-400" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest">HelloWorld Boost</span>
            </div>
            <div className="text-[26px] font-ttc-bold text-white leading-tight mb-2">
              Больше покупателей<br />за меньше времени
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Продвигаемые объявления получают в 5–10 раз больше просмотров
            </p>
          </div>
        </motion.div>

        {/* График */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="rounded-[20px] p-5" style={{ background: '#111' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-white/30" />
            <span className="text-[11px] text-white/30 uppercase tracking-widest">Охват с продвижением</span>
          </div>
          <BarChart data={CHART_DATA} />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-white/20">Без продвижения</span>
            <span className="text-[10px] text-white/50">С продвижением →</span>
          </div>
        </motion.div>

        {/* Преимущества */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-[20px] overflow-hidden" style={{ background: '#111' }}
        >
          {[
            { icon: <Eye size={16} className="text-white/60" />, title: 'До ×10 просмотров', sub: 'Больше людей увидят объявление' },
            { icon: <TrendingUp size={16} className="text-white/60" />, title: 'Топ поиска', sub: 'Первым в результатах' },
            { icon: <Users size={16} className="text-white/60" />, title: 'Рекомендации', sub: 'Похожим покупателям' },
            { icon: <Clock size={16} className="text-white/60" />, title: 'Быстрее продажа', sub: 'В среднем на 3 дня быстрее' },
            { icon: <Star size={16} className="text-white/60" />, title: 'Значок «Продвигается»', sub: 'Виден всем в ленте' },
          ].map((item, i, arr) => (
            <div key={i}>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-sf-ui-medium text-white/85">{item.title}</div>
                  <div className="text-[12px] text-white/35 mt-0.5">{item.sub}</div>
                </div>
                <Check size={14} className="text-white/20 flex-shrink-0" />
              </div>
              {i < arr.length - 1 && <div className="h-px bg-white/[0.04] mx-5" />}
            </div>
          ))}
        </motion.div>

        {/* Тарифы — вертикальные как у Cursor */}
        <div>
          <p className="text-[11px] text-white/25 uppercase tracking-widest mb-3 px-1">Выберите тариф</p>
          <div className="space-y-3">
            {PLANS.map((plan, i) => (
              <motion.button
                key={plan.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.06 }}
                onClick={() => setSelected(plan.id)}
                className="w-full text-left rounded-[20px] p-5 transition-all relative overflow-hidden"
                style={{
                  background: selected === plan.id ? '#1a1a1a' : '#111',
                  border: selected === plan.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Название и цена */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-[18px] font-ttc-bold text-white">{plan.name}</div>
                      {plan.popular && (
                        <div className="px-2 py-0.5 rounded-full text-[10px] font-sf-ui-medium bg-white/10 text-white/50">
                          Популярный
                        </div>
                      )}
                    </div>
                    <div className="text-[12px] text-white/30 mt-0.5">{plan.days} дней</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[22px] font-sf-ui-medium text-white">{plan.price} <span className="text-[15px] text-white/50">₽</span></div>
                  </div>
                </div>

                {/* Разделитель */}
                <div className="h-px bg-white/[0.06] mb-4" />

                {/* Фичи */}
                <div className="space-y-2.5">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Check size={9} className="text-white/60" />
                      </div>
                      <span className="text-[13px] text-white/55">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Индикатор выбора */}
                {selected === plan.id && (
                  <motion.div
                    layoutId="plan-selected"
                    className="absolute inset-0 rounded-[20px] pointer-events-none"
                    style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Кнопка */}
        <div className="pb-8">
          <button
            type="button"
            className="w-full h-[54px] rounded-[16px] font-sf-ui-medium text-[15px] text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}
            onClick={() => alert('Для оформления продвижения обратитесь к менеджеру платформы')}
          >
            <Zap size={16} className="text-black" />
            Продвигать за {selectedPlan.price} ₽
          </button>
          <p className="text-center text-[11px] text-white/20 mt-3 leading-relaxed">
            На данный момент покупка невозможна. Покупая продвижение вы принимаете наши условия.<br />
            Оплата до начала продвижения.
          </p>
        </div>

      </div>
    </div>
  )
}
