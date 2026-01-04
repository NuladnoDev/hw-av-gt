'use client'

import { useEffect, useState } from 'react'
import { MapPin, Search } from 'lucide-react'

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
          className="group absolute left-[24px] top-[50px] z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full bg-transparent"
        >
          <img
            src="/interface/str.svg"
            alt="back"
            className="h-[22px] w-[22px] transition-transform group-active:-translate-x-1"
          />
        </button>

        <div className="absolute inset-0 flex flex-col pt-[110px] pb-[96px] px-6">
          <div className="flex flex-col items-center">
            <div className="mb-8 flex h-[80px] w-[80px] items-center justify-center rounded-[24px] bg-[#1A1A1A]">
              <MapPin size={40} strokeWidth={1.5} className="text-white" />
            </div>
            <div className="mb-3 text-center text-[28px] font-bold leading-[1.2em] text-white font-ttc-bold">
              Выберите город
            </div>
            <div className="mb-8 max-w-[260px] text-center text-[14px] leading-[1.4em] text-[#A1A1A1]">
              Укажите город для размещения ваших объявлений
            </div>
          </div>

          <div className="mb-4 w-full">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Search size={20} />
              </span>
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Поиск города"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] py-3 pl-11 pr-4 text-[16px] leading-[1.4em] text-white outline-none placeholder:text-[#6B7280] focus:border-[#3A3A3A]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto pr-1">
              {cityResults.length > 0 ? (
                cityResults.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`mb-2 w-full rounded-2xl px-5 py-3 text-left text-[16px] leading-[1.4em] transition-all ${
                      selectedCity === city ? 'bg-white text-black' : 'bg-[#1A1A1A] text-white hover:bg-[#252525]'
                    }`}
                  >
                    {city}
                  </button>
                ))
              ) : (
                <div className="py-12 text-center text-[14px] leading-[1.4em] text-[#6B7280]">
                  Город не найден
                </div>
              )}
              {cityLoading && (
                <div className="pb-4 pt-2 text-[13px] leading-[16px] text-white/60 font-sf-ui-light">
                  Загрузка городов…
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 w-full">
            <button
              type="button"
              disabled={!selectedCity}
              onClick={() => {
                if (selectedCity && onNext) {
                  onNext(selectedCity)
                }
              }}
              className={`h-[52px] w-full rounded-2xl text-[18px] font-semibold leading-[1.25em] tracking-[0.015em] font-vk-demi transition-all ${
                selectedCity ? 'bg-white text-black active:scale-95' : 'bg-[#1A1A1A] text-gray-600'
              }`}
            >
              Продолжить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

