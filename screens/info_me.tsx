'use client'
import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, X } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

type InfoMeProps = {
  onClose?: () => void
}

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

const politicalOptions = [
  'Либерализм',
  'Консерватизм',
  'Социализм',
  'Коммунизм',
  'Национализм',
  'Анархизм',
]

export default function InfoMe({ onClose }: InfoMeProps) {
  const [scale, setScale] = useState(1)
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      if (typeof window === 'undefined') return null
      const authRaw = window.localStorage.getItem('hw-auth')
      const auth = authRaw ? (JSON.parse(authRaw) as { uid?: string }) : null
      return auth?.uid ?? null
    } catch {
      return null
    }
  })
  const [age, setAge] = useState<string>('')
  const [political, setPolitical] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [hobbies, setHobbies] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [citySelectorOpen, setCitySelectorOpen] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [cityResults, setCityResults] = useState<string[]>([])
  const [cityLoading, setCityLoading] = useState(false)
  const [politicalOpen, setPoliticalOpen] = useState(false)

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.min(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (!citySelectorOpen) return
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
  }, [citySearch, citySelectorOpen])

  useEffect(() => {
    const client = getSupabase()
    ;(async () => {
      const authRaw = window.localStorage.getItem('hw-auth')
      const auth = authRaw ? (JSON.parse(authRaw) as { uid?: string }) : null
      const id = auth?.uid ?? null
      setUserId(id)
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
        : {}
      const localProf = id ? profMap[id] : undefined
      const aLocal = localProf?.age ?? ''
      const gLocal = localProf?.gender ?? ''
      const cLocal = localProf?.city ?? ''
      const pLocal = localProf?.political ?? ''
      const hLocal = localProf?.hobbies ?? ''
      setAge(aLocal)
      setGender(gLocal)
      setCity(cLocal)
      setPolitical(pLocal)
      setHobbies(hLocal)

      if (!client || !id) return
      try {
        const { data: prof, error: profError } = await client
          .from('profiles')
          .select('age, gender, city, political, hobbies')
          .eq('id', id)
          .maybeSingle()
        if (profError || !prof) return
        const ageFromDb = (prof.age as string | number | undefined) ?? undefined
        const genderFromDb = (prof.gender as string | undefined) ?? undefined
        const cityFromDb = (prof.city as string | undefined) ?? undefined
        const politicalFromDb = (prof.political as string | undefined) ?? undefined
        const hobbiesFromDb = (prof.hobbies as string | undefined) ?? undefined
        if (typeof ageFromDb === 'number') {
          const a = String(ageFromDb)
          setAge(a)
        } else if (typeof ageFromDb === 'string' && ageFromDb.trim().length > 0) {
          setAge(ageFromDb)
        }
        if (typeof genderFromDb === 'string' && genderFromDb.trim().length > 0) {
          setGender(genderFromDb)
        }
        if (typeof cityFromDb === 'string' && cityFromDb.trim().length > 0) {
          setCity(cityFromDb)
        }
        if (typeof politicalFromDb === 'string' && politicalFromDb.trim().length > 0) {
          setPolitical(politicalFromDb)
        }
        if (typeof hobbiesFromDb === 'string' && hobbiesFromDb.trim().length > 0) {
          setHobbies(hobbiesFromDb)
        }
      } catch {
      }
    })()
  }, [])

  const saveAbout = async () => {
    if (!userId) return
    const client = getSupabase()
    const payload: Record<string, unknown> = {
      id: userId,
      age: (age ?? '').trim(),
      gender: (gender ?? '').trim(),
      city: (city ?? '').trim(),
      political: (political ?? '').trim(),
      hobbies: (hobbies ?? '').trim(),
    }
    if (client) {
      const { error } = await client.from('profiles').upsert(payload)
      if (error) {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
          : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = {
          ...prev,
          age: typeof payload.age === 'number' ? String(payload.age) : ((payload.age as string | null) ?? ''),
          gender: (payload.gender as string | null) ?? '',
          city: (payload.city as string | null) ?? '',
          political: (payload.political as string | null) ?? '',
          hobbies: (payload.hobbies as string | null) ?? '',
        }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
        : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = {
        ...prev,
        age: typeof payload.age === 'number' ? String(payload.age) : ((payload.age as string | null) ?? ''),
        gender: (payload.gender as string | null) ?? '',
        city: (payload.city as string | null) ?? '',
        political: (payload.political as string | null) ?? '',
        hobbies: (payload.hobbies as string | null) ?? '',
      }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
    const event = new CustomEvent('profile-updated', {
      detail: {
        age: age ?? '',
        gender: gender ?? '',
        city: city ?? '',
        political: political ?? '',
        hobbies: hobbies ?? '',
      },
    })
    window.dispatchEvent(event)
  }

  const handleClose = async () => {
    await saveAbout()
    if (onClose) {
      onClose()
    } else {
      const ev = new Event('close-info-me')
      window.dispatchEvent(ev)
    }
  }

  const isGenderSelected = (value: string) => gender.trim().toLowerCase().startsWith(value.toLowerCase())

  const openCitySelector = () => {
    setCitySearch('')
    setCitySelectorOpen(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden edit-screen-in">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px]" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <button
              type="button"
              onClick={handleClose}
              className="absolute left-4 p-2 -ml-1 rounded-lg hover:bg-white/5 active:scale-95 transition-all duration-300"
              aria-label="Назад"
              style={{ marginTop: 'var(--about-header-icon-margin-top)' }}
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div
              className="font-ttc-bold text-white"
              style={{ fontSize: 'var(--about-title-size)', marginTop: 'var(--about-header-title-margin-top)' }}
            >
              Обо мне
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 w-full overflow-y-auto"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
            height: 'calc(812px - 56px - var(--home-header-offset))',
          }}
        >
          <div className="relative max-w-[370px] mx-auto px-6 py-8">
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-white/60 text-sm mb-2 font-sf-ui-light">
                  Возраст
                </label>
                <div className="relative">
                  <input
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    inputMode="numeric"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sf-ui-light focus:outline-none focus:border-white/30 transition-all"
                    placeholder="Введите возраст"
                  />
                  {age.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAge('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-all"
                      aria-label="Очистить"
                    >
                      <X size={18} className="text-white/40" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2 font-sf-ui-light">
                  Политические взгляды
                </label>
                <button
                  type="button"
                  onClick={() => setPoliticalOpen((v) => !v)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sf-ui-light flex items-center justify-between hover:bg-white/10 transition-all text-left"
                >
                  <span className={political ? '' : 'text-white/50'}>
                    {political || 'Выбери один из вариантов'}
                  </span>
                  <ChevronDown size={20} className="text-white/40" />
                </button>
                <div
                  className="mt-2 overflow-hidden rounded-[12px] bg-[#151515]"
                  style={{
                    maxHeight: politicalOpen ? 'var(--about-political-max-height, 260px)' : '0px',
                    transition: 'max-height 220ms ease, opacity 220ms ease, transform 220ms ease',
                    opacity: politicalOpen ? 1 : 0,
                    transform: politicalOpen ? 'translateY(0)' : 'translateY(-4px)',
                  }}
                >
                  {politicalOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="flex w-full items-center justify-between px-4"
                      style={{ height: 'var(--about-political-row-height, 44px)' }}
                      onClick={() => {
                        setPolitical(option)
                        setPoliticalOpen(false)
                      }}
                    >
                      <div
                        className="leading-[20px] text-white font-sf-ui-light"
                        style={{ fontSize: 'var(--about-political-text-size, 16px)' }}
                      >
                        {option}
                      </div>
                      {political === option && (
                        <div
                          className="rounded-full"
                          style={{
                            width: 'var(--about-political-dot-size, 8px)',
                            height: 'var(--about-political-dot-size, 8px)',
                            backgroundColor: '#6EBC3D',
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2 font-sf-ui-light">
                  Место жительства
                </label>
                <button
                  type="button"
                  onClick={openCitySelector}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sf-ui-light flex items-center justify-between hover:bg-white/10 transition-all text-left"
                >
                  <span className={city ? '' : 'text-white/50'}>
                    {city || 'Выберите город'}
                  </span>
                  <ChevronDown size={20} className="text-white/40" />
                </button>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2 font-sf-ui-light">
                  Увлечения
                </label>
                <div className="relative">
                  <input
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    placeholder="Программист, дизайнер, художник"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sf-ui-light focus:outline-none focus:border-white/30 transition-all placeholder:text-white/50"
                  />
                  {hobbies.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHobbies('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-all"
                      aria-label="Очистить"
                    >
                      <X size={18} className="text-white/40" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-white/60 text-sm mb-4 font-sf-ui-light">
                  Выберите пол
                </label>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('Женский')}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isGenderSelected('жен') ? 'border-[#4CAF50] bg-[#4CAF50]' : 'border-white/30'
                      }`}
                    >
                      {isGenderSelected('жен') && (
                        <div className="w-3 h-3 rounded-full bg-[#0a0a0a]" />
                      )}
                    </div>
                    <span className="text-white font-sf-ui-light">
                      Женский
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('Мужской')}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isGenderSelected('муж') ? 'border-[#4CAF50] bg-[#4CAF50]' : 'border-white/30'
                      }`}
                    >
                      {isGenderSelected('муж') && (
                        <div className="w-3 h-3 rounded-full bg-[#0a0a0a]" />
                      )}
                    </div>
                    <span className="text-white font-sf-ui-light">
                      Мужской
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {citySelectorOpen && (
          <div className="absolute inset-0 z-20 flex h-full w-full items-end justify-center">
            <div
              className="absolute inset-0 bg-black/40 overlay-in"
              onClick={() => setCitySelectorOpen(false)}
            />
            <div
              className="relative flex w-full flex-col bottom-sheet-in"
              style={{
                height: 'var(--city-sheet-height, 762px)',
                backgroundColor: 'var(--city-sheet-bg, #101010)',
                borderRadius: '14px 14px 0 0',
                top: 'var(--city-sheet-top-offset, 50px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex w-full items-end justify-center"
                style={{ height: 'var(--city-header-height, 100px)' }}
              >
                <div className="relative w-full" style={{ height: 'var(--city-search-container-height, 52px)' }}>
                  <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
                    <div
                      className="font-ttc-bold text-white"
                      style={{
                        fontSize: 'var(--city-search-title-size, 21px)',
                        lineHeight: '26px',
                        letterSpacing: '-0.41px',
                      }}
                    >
                      Место проживания
                    </div>
                    <button
                      type="button"
                      onClick={() => setCitySelectorOpen(false)}
                      className="absolute right-3 top-0 flex h-full items-center justify-center"
                      aria-label="Закрыть"
                    >
                      <img
                        src="/interface/x-01.svg"
                        alt="close"
                        className="h-6 w-6"
                        style={{
                          opacity: 'var(--city-search-clear-icon-opacity, 0.9)',
                          filter: 'var(--city-search-clear-icon-filter, invert(72%) sepia(4%) saturate(0%) hue-rotate(163deg) brightness(90%) contrast(88%))',
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div
                className="flex w-full items-center px-3"
                style={{ height: 'var(--city-search-container-height, 52px)' }}
              >
                <div
                  className="relative w-full"
                  style={{ height: 'var(--city-search-height, 36px)' }}
                >
                  <input
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Поиск"
                    className="h-full w-full pl-9 pr-9 leading-[22px] outline-none font-sf-ui-light placeholder:text-[#818C99]"
                    style={{
                      borderRadius: 'var(--city-search-radius, 10px)',
                      backgroundColor: 'var(--city-search-bg, #101010)',
                      fontSize: 'var(--city-search-text-size, 17px)',
                      color: 'var(--city-search-text-color, #ffffff)',
                    }}
                  />
                  <img
                    src="/interface/Search Icon.svg"
                    alt="search"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ opacity: 'var(--city-search-icon-opacity, 0.8)' }}
                  />
                  {citySearch.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCitySearch('')}
                      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                      aria-label="Очистить поиск"
                    >
                      <img
                        src="/interface/x-01.svg"
                        alt="clear"
                        className="h-[18px] w-[18px]"
                        style={{
                          opacity: 'var(--city-search-clear-icon-opacity, 0.9)',
                          filter: 'var(--city-search-clear-icon-filter, invert(72%) sepia(4%) saturate(0%) hue-rotate(163deg) brightness(90%) contrast(88%))',
                        }}
                      />
                    </button>
                  )}
                </div>
              </div>
              <div
                className="flex-1 overflow-y-auto"
                style={{ paddingTop: 'var(--city-list-padding-top, 4px)' }}
              >
                {cityResults.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setCity(name)
                      setCitySelectorOpen(false)
                    }}
                    className="flex w-full items-center"
                    style={{
                      height: 'var(--city-item-height, 48px)',
                      paddingLeft: 'var(--city-item-horizontal-padding, 12px)',
                      paddingRight: 'var(--city-item-horizontal-padding, 12px)',
                    }}
                  >
                    <div
                      className="leading-[22px] text-white font-sf-ui-light"
                      style={{ fontSize: 'var(--city-item-text-size, 17px)' }}
                    >
                      {name}
                    </div>
                  </button>
                ))}
                {cityLoading && (
                  <div className="px-3 pb-4 pt-2 text-[13px] leading-[16px] text-white/60 font-sf-ui-light">
                    Загрузка городов…
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ bottom: 0, height: 'env(safe-area-inset-bottom, 0px)' }}
        />
      </div>
    </div>
  )
}
