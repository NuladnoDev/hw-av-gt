'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Search, 
  Plus 
} from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'

export const defaultRussianCities = [
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

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export default function CreateStoreFlow({ 
  onClose, 
  userId, 
  onCreated 
}: { 
  onClose: () => void; 
  userId: string | null; 
  onCreated: (store: { id: string; name: string; avatar_url: string | null }) => void 
}) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [cityResults, setCityResults] = useState<string[]>(defaultRussianCities)
  const [cityLoading, setCityLoading] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [scale, setScale] = useState(1)
  const [showCityStep, setShowCityStep] = useState(false)
  const [subscriptions, setSubscriptions] = useState<{ id: string; tag: string; avatarUrl: string | null }[]>([])

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
    const loadSubscriptions = async () => {
      if (!userId) return
      const client = getSupabase()
      if (!client) return
      try {
        const { data, error } = await client
          .from('follows')
          .select('target_id, profiles!follows_target_id_fkey(tag, avatar_url)')
          .eq('follower_id', userId)
        
        if (!error && data) {
          const subs = data.map((f: any) => ({
            id: f.target_id,
            tag: f.profiles.tag || 'user',
            avatarUrl: f.profiles.avatar_url
          }))
          setSubscriptions(subs)
        }
      } catch (e) {
        console.error('Error loading subs in flow:', e)
      }
    }
    loadSubscriptions()
  }, [userId])

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
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&countrycodes=ru&limit=20&city=${encodeURIComponent(query)}`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          if (!cancelled) setCityResults(defaultRussianCities)
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
        if (!cancelled) setCityResults(defaultRussianCities)
      } finally {
        if (!cancelled) setCityLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [citySearch])

  const handleCreate = async () => {
    if (!name.trim() || !userId) return
    setLoading(true)
    const client = getSupabase()
    if (!client) {
      setLoading(false)
      return
    }

    const slug = `${slugify(name)}-${Math.floor(Math.random() * 10000)}`
    
    try {
      const { data: store, error: storeError } = await client
        .from('stores')
        .insert({
          name: name.trim(),
          slug,
          description: description.trim(),
          city: city.trim(),
          owner_id: userId
        })
        .select()
        .single()

      if (storeError) throw storeError

      // Add owner
      const members = [
        { store_id: store.id, user_id: userId, role: 'owner' },
        ...selectedStaff.map(uid => ({ store_id: store.id, user_id: uid, role: 'member' }))
      ]

      const { error: memberError } = await client
        .from('store_members')
        .insert(members)

      if (memberError) throw memberError

      onCreated({
        id: store.id,
        name: store.name,
        avatar_url: store.avatar_url
      })
    } catch (e) {
      console.error('Error creating store:', e)
      alert('Ошибка при создании магазина.')
    } finally {
      setLoading(false)
    }
  }

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <motion.div 
      layoutId="store-create-expansion"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0A0A0A] overflow-hidden" 
      style={{ height: '100dvh' }}
    >
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />

        <div className="absolute left-0 w-full top-0 h-[88px] flex items-center px-6 z-10">
          <button onClick={step === 1 ? onClose : () => setStep(s => s - 1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all active:scale-95">
            {step === 1 ? <X size={24} className="text-white" /> : <ChevronLeft size={28} className="text-white" />}
          </button>
        </div>

        <div className="absolute inset-0 pt-[88px] px-8 overflow-y-auto pb-32">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-[32px] font-ttc-bold text-white leading-tight">Как назовем<br/>ваш магазин?</h2>
                  <p className="mt-2 text-white/40 text-[16px] font-sf-ui-light">Это название будут видеть все покупатели</p>
                </div>
                <div className="space-y-6">
                  <div className="relative">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Название магазина"
                      className="w-full bg-transparent border-b border-white/10 py-4 text-[24px] text-white outline-none focus:border-white/30 transition-all placeholder:text-white/10 font-sf-ui-medium"
                    />
                  </div>
                  <div>
                    <div className="mb-2 text-[14px] text-white/40 ml-1">Город</div>
                    <button
                      onClick={() => setShowCityStep(true)}
                      className="h-[56px] w-full rounded-2xl bg-white/5 border border-white/10 px-4 text-white text-left flex items-center justify-between hover:bg-white/[0.08] transition-all group"
                    >
                      <span className={city ? 'text-white font-sf-ui-medium' : 'text-white/20 font-sf-ui-light'}>
                        {city || 'Выберите город'}
                      </span>
                      <ChevronRight size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {showCityStep && (
              <motion.div
                key="cityStep"
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col"
              >
                <div className="h-[88px] flex items-center px-6">
                  <button onClick={() => setShowCityStep(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                    <ChevronLeft size={28} className="text-white" />
                  </button>
                </div>
                <div className="flex-1 px-8 pb-10 overflow-hidden flex flex-col">
                  <h2 className="text-[32px] font-ttc-bold text-white leading-tight mb-6">Выберите город</h2>
                  
                  <div className="relative mb-6">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                      <Search size={20} />
                    </span>
                    <input
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Поиск города"
                      className="h-[64px] w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-5 text-[18px] text-white outline-none focus:border-white/20 transition-all backdrop-blur-md"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {cityResults.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCity(c)
                          setShowCityStep(false)
                        }}
                        className={`w-full rounded-2xl px-5 py-4 text-left text-[17px] border transition-all ${
                          city === c 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/5 text-white border-white/10'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                    {cityLoading && <div className="text-center text-white/40 py-4 italic">Загрузка...</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-[32px] font-ttc-bold text-white leading-tight">Расскажите<br/>о себе</h2>
                  <p className="mt-2 text-white/40 text-[16px] font-sf-ui-light">Краткое описание поможет покупателям доверять вам</p>
                </div>
                <div className="space-y-6">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Привлекательное описание вашего магазина..."
                    className="w-full h-[200px] bg-white/5 border border-white/10 rounded-3xl p-6 text-[18px] text-white outline-none focus:border-white/20 transition-all placeholder:text-white/10 resize-none font-sf-ui-light"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-[32px] font-ttc-bold text-white leading-tight">Добавьте<br/>команду</h2>
                  <p className="mt-2 text-white/40 text-[16px] font-sf-ui-light">Выберите людей из своих подписок, которые смогут публиковать товары от имени магазина</p>
                </div>
                
                <div className="space-y-2">
                  {subscriptions.length > 0 ? (
                    subscriptions.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => toggleStaff(sub.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-3xl border transition-all ${
                          selectedStaff.includes(sub.id) 
                            ? 'bg-white border-white' 
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                          {sub.avatarUrl ? (
                            <img src={sub.avatarUrl} alt={sub.tag} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-vk-demi bg-gradient-to-br from-blue-500 to-purple-500">
                              {sub.tag[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`text-[17px] font-sf-ui-medium ${selectedStaff.includes(sub.id) ? 'text-black' : 'text-white'}`}>
                            {sub.tag}
                          </div>
                        </div>
                        {selectedStaff.includes(sub.id) && (
                          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                            <Plus size={14} className="text-white rotate-45" />
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center text-white/20 font-sf-ui-light">
                      У вас пока нет подписок,<br/>кого можно было бы добавить
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 pb-12 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent">
          <button
            onClick={step === 3 ? handleCreate : () => setStep(s => s + 1)}
            disabled={loading || (step === 1 && !name.trim())}
            className="h-[64px] w-full rounded-full bg-white text-black font-vk-demi text-[18px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-20"
          >
            {loading ? 'Создание...' : (
              <>
                {step === 3 ? 'Готово' : 'Продолжить'}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
