'use client'

import { useEffect, useState } from 'react'
import { MapPin, Search, ChevronLeft } from 'lucide-react'
import { motion } from 'motion/react'

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
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />

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
          className="absolute left-6 top-[50px] z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Назад"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 flex flex-col pt-[110px] pb-10 px-6"
        >
          <div className="flex flex-col items-center">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
              <div className="relative flex h-[80px] w-[80px] items-center justify-center rounded-[24px] bg-white/5 border border-white/10">
                <MapPin size={40} strokeWidth={1.5} className="text-white" />
              </div>
            </div>
            <div className="mb-3 text-center text-[32px] font-bold leading-[1.2em] text-white font-ttc-bold tracking-tight">
              Выберите город
            </div>
            <div className="mb-8 max-w-[260px] text-center text-[16px] leading-[1.4em] text-white/50 font-sf-ui-regular">
              Укажите город для размещения ваших объявлений
            </div>
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
                className="h-[56px] w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 text-[17px] leading-[1.4em] text-white outline-none placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.08] transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto pr-1 space-y-2">
              {cityResults.length > 0 ? (
                cityResults.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`w-full rounded-2xl px-5 py-4 text-left text-[17px] leading-[1.4em] transition-all border ${
                      selectedCity === city 
                        ? 'bg-white text-black border-white' 
                        : 'bg-white/5 text-white border-white/5 hover:bg-white/10'
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

          <div className="mt-6 w-full">
            <button
              type="button"
              disabled={!selectedCity}
              onClick={() => {
                if (selectedCity && onNext) {
                  onNext(selectedCity)
                }
              }}
              className={`h-[56px] w-full rounded-2xl text-[18px] font-bold leading-[1.25em] tracking-tight font-vk-demi transition-all ${
                selectedCity 
                  ? 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-white/10 text-white/20'
              }`}
            >
              Продолжить
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

