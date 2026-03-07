'use client'

import { useEffect, useState } from 'react'
import { MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AdCardSkeleton } from './ads'

const defaultRussianCities = [
  'Череповец',
  'Кадуй',
  'Москва',
  'Волгоград',
  'Владивосток',
  'Воронеж',
  'Екатеринбург',
  'Казань',
  'Калининград',
  'Краснодар',
  'Красноярск',
  'Нижний Новгород',
  'Новосибирск',
  'Омск',
  'Пермь',
  'Ростов-на-Дону',
  'Самара',
  'Санкт-Петербург',
  'Саратов',
  'Тюмень',
  'Уфа',
  'Хабаровск',
  'Челябинск',
]

export default function HelloScreenCity({
  onBack,
  onNext,
}: {
  onBack?: () => void
  onNext?: (city: string) => void
}) {
  const [scale, setScale] = useState(1)
  const [citySearch, setCitySearch] = useState('')
  const [cityResults, setCityResults] = useState<string[]>(defaultRussianCities)
  const [cityLoading, setCityLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.max(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const query = citySearch.trim()
    if (query.length < 2) {
      setCityResults(defaultRussianCities)
      setCityLoading(false)
      return
    }
    let cancelled = false
    const controller = new AbortController()
    const run = async () => {
      try {
        setCityLoading(true)
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&countrycodes=ru&limit=20&city=${encodeURIComponent(
          query,
        )}`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          if (!cancelled) {
            setCityResults(defaultRussianCities)
          }
          return
        }
        const data = (await res.json()) as { display_name?: string }[]
        if (cancelled) return
        const names = data.map((item) => {
          const name = item.display_name ?? ''
          const comma = name.indexOf(',')
          return comma > 0 ? name.slice(0, comma) : name
        })
        const merged = names.length > 0 ? names : defaultRussianCities
        const unique = Array.from(new Set(merged))
        setCityResults(unique)
      } catch {
        if (!cancelled) {
          setCityResults(defaultRussianCities)
        }
      } finally {
        if (!cancelled) {
          setCityLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [citySearch])

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden"
      style={{ 
        '--ads-bottom-offset': '-140px',
      } as React.CSSProperties}
    >
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />
        
        {/* Плывущие скелетоны объявлений на фоне снизу */}
        <div 
          className="absolute left-0 right-0 h-[600px] pointer-events-none opacity-[0.15] z-0 flex flex-col gap-4 overflow-hidden"
          style={{ bottom: 'var(--ads-bottom-offset)' }}
        >
          {/* Мягкая тень-затемнение сверху вниз */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent h-[150px]" />

          {/* Первый ряд */}
          <div className="flex w-full overflow-hidden">
            <motion.div 
              className="flex gap-4 flex-nowrap"
              animate={{ x: [0, -1500] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={`row1-${i}`} className="w-[180px] flex-shrink-0 scale-90">
                  <AdCardSkeleton />
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Второй ряд (в обратную сторону + смещение) */}
          <div className="flex w-full overflow-hidden ml-[-100px]">
            <motion.div 
              className="flex gap-4 flex-nowrap"
              animate={{ x: [-1500, 0] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={`row2-${i}`} className="w-[180px] flex-shrink-0 scale-90">
                  <AdCardSkeleton />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Затемнение снизу вверх до кнопки */}
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent z-10 pointer-events-none" />

        {/* Background Decorative Element */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-white/[0.01] blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/[0.01] blur-[80px] rounded-full pointer-events-none" />

        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack()
              return
            }
            const event = new CustomEvent('city-back')
            window.dispatchEvent(event)
          }}
          className="absolute left-6 top-[50px] z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-200 active:scale-95"
          aria-label="Назад"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-x-0 top-0 bottom-0 flex flex-col pt-[140px] pb-10 px-6 z-20 pointer-events-none"
        >
          <div className="pointer-events-auto flex flex-col h-full w-full">
            <div className="mb-2 w-full text-left text-[32px] font-bold leading-[1.2em] text-white font-ttc-bold tracking-tight text-shadow-sm">
              Выберите город
            </div>
            <div className="mb-6 w-full text-left text-[16px] leading-[1.4em] text-white/50 font-light max-w-[280px]" style={{ fontFamily: 'var(--font-inter)' }}>
              Укажите город для размещения ваших объявлений
            </div>

            <div className="mb-6 w-full">
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                  <Search size={20} />
                </span>
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Поиск города"
                  className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 text-[18px] leading-[1.4em] text-white outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all placeholder:text-white/20 backdrop-blur-md"
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {cityResults.length > 0 ? (
                  cityResults.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className={`w-full rounded-2xl px-5 py-4 text-left text-[17px] leading-[1.4em] transition-all border ${
                        selectedCity === city 
                          ? 'bg-white text-black border-white shadow-lg' 
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {city}
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center text-[16px] leading-[1.4em] text-white/20 font-sf-ui-regular">
                    Город не найден
                  </div>
                )}
                {cityLoading && (
                  <div className="pb-4 pt-2 text-center text-[14px] leading-[16px] text-white/40 font-sf-ui-light italic">
                    Загрузка городов…
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 w-full flex justify-start">
              <button
                type="button"
                disabled={!selectedCity}
                onClick={() => {
                  if (selectedCity && onNext) {
                    onNext(selectedCity)
                  }
                }}
                className={`h-[64px] w-[64px] rounded-full text-center transition-all duration-300 flex items-center justify-center relative overflow-hidden group shadow-xl ${
                  selectedCity 
                    ? 'bg-white text-black active:scale-[0.9]' 
                    : 'bg-white/10 text-white/20'
                }`}
              >
                <ChevronRight size={28} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}

