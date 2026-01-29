'use client'
import { useEffect, useRef, useState } from 'react'
import { getSupabase, clearLocalAuth, loadLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'
import ModeratorBadge from '../components/ModeratorBadge'
import QualityBadge from '../components/QualityBadge'
import VerifiedBadge from '../components/VerifiedBadge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  MapPin, 
  Briefcase, 
  Heart, 
  Hash, 
  Settings, 
  LogOut, 
  ChevronRight,
  Sparkles,
  Info,
  AlertTriangle
} from 'lucide-react'

export default function ProfileEdit({
  onClose,
  initialTag: initialTagProp,
}: {
  onClose: () => void
  initialTag?: string
}) {
  const [scale, setScale] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [tagText, setTagText] = useState<string>(typeof initialTagProp === 'string' ? initialTagProp.replace(/^@/, '') : '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [tagError, setTagError] = useState('')
  const [description, setDescription] = useState('')
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [political, setPolitical] = useState<string>('')
  const [hobbies, setHobbies] = useState<string>('')
  const [isVerified, setIsVerified] = useState(false)
  const [isQuality, setIsQuality] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const [originalTag, setOriginalTag] = useState<string>('')
  const [originalDescription, setOriginalDescription] = useState<string>('')
  const [originalAge, setOriginalAge] = useState<string>('')
  const [originalGender, setOriginalGender] = useState<string>('')
  const [originalCity, setOriginalCity] = useState<string>('')
  const [originalPolitical, setOriginalPolitical] = useState<string>('')
  const [originalHobbies, setOriginalHobbies] = useState<string>('')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectorClosing, setSelectorClosing] = useState(false)
  const [selectorType, setSelectorType] = useState<'gender' | 'city' | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cityQuery, setCityQuery] = useState('')
  const [cityResults, setCityResults] = useState<string[]>([])
  const [cityLoading, setCityLoading] = useState(false)
  const selectorSheetRef = useRef<HTMLDivElement | null>(null)
  const extraAllEmpty =
    (description ?? '').trim().length === 0 &&
    (age ?? '').trim().length === 0 &&
    (gender ?? '').trim().length === 0 &&
    (city ?? '').trim().length === 0 &&
    (political ?? '').trim().length === 0 &&
    (hobbies ?? '').trim().length === 0
  const extraDirty =
    (description ?? '') !== (originalDescription ?? '') ||
    (age ?? '') !== (originalAge ?? '') ||
    (gender ?? '') !== (originalGender ?? '') ||
    (city ?? '') !== (originalCity ?? '') ||
    (political ?? '') !== (originalPolitical ?? '') ||
    (hobbies ?? '') !== (originalHobbies ?? '')

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const vw = window.innerWidth
    const vh = window.innerHeight
    const s = Math.min(vw / baseW, vh / baseH)
    setScale(Math.min(1, s))
  }, [])

  useEffect(() => {
    if (!selectorOpen || selectorType !== 'city') return
    const q = cityQuery.trim()
    if (q.length === 0) {
      setCityResults([])
      return
    }
    const controller = new AbortController()
    ;(async () => {
      try {
        setCityLoading(true)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=20&countrycodes=ru&accept-language=ru&addressdetails=1`
        const res = await fetch(url, { signal: controller.signal })
        const json = (await res.json()) as Array<{ display_name?: string; address?: { city?: string; town?: string; village?: string; hamlet?: string; municipality?: string } }>
        const names = Array.from(
          new Set(
            (json ?? [])
              .map((e) => {
                const a = e.address ?? {}
                const fromAddr = a.city || a.town || a.village || a.hamlet || a.municipality || ''
                return (fromAddr || (e.display_name ?? '').split(',')[0]).trim()
              })
              .filter((s) => s.length > 0)
          )
        )
        setCityResults(names)
      } catch {
      } finally {
        setCityLoading(false)
      }
    })()
    return () => controller.abort()
  }, [selectorOpen, selectorType, cityQuery])

  useEffect(() => {
    const client = getSupabase()
    ;(async () => {
      let mainId: string | null = null
      let altId: string | null = null
      let authTag: string | undefined
      let authEmail: string | undefined
      try {
        const auth = await loadLocalAuth()
        mainId = auth?.uuid ?? auth?.uid ?? null
        altId =
          auth?.uuid && auth?.uid && auth.uuid !== auth.uid ? auth.uid : null
        authTag = auth?.tag
        authEmail = auth?.email
      } catch {
        mainId = null
        altId = null
        authTag = undefined
        authEmail = undefined
      }
      const id = mainId ?? altId
      setUserId(id)
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<
            string,
            {
              tag?: string
              avatar_url?: string
              description?: string
              age?: string
              gender?: string
              city?: string
              political?: string
              hobbies?: string
              is_verified?: boolean
              is_quality?: boolean
              is_moderator?: boolean
            }
          >)
        : {}
      let localProf = id ? profMap[id] : undefined
      if (!localProf && altId && altId !== id) {
        localProf = profMap[altId]
      }
      setIsVerified(localProf?.is_verified ?? false)
      setIsQuality(localProf?.is_quality ?? false)
      setIsModerator(localProf?.is_moderator ?? false)
      const baseTag =
        localProf?.tag ??
        authTag ??
        (typeof initialTagProp === 'string' ? initialTagProp.replace(/^@/, '') : '') ??
        (authEmail && authEmail.includes('@') ? authEmail.split('@')[0] : '') ??
        ''
      setTagText(baseTag)
      setOriginalTag(baseTag)
      if (localProf?.avatar_url) setAvatarUrl(localProf.avatar_url)
      const d = localProf?.description ?? ''
      setDescription(d)
      setOriginalDescription(d)
      const a = localProf?.age ?? ''
      setAge(a)
      setOriginalAge(a)
      const g = localProf?.gender ?? ''
      setGender(g)
      setOriginalGender(g)
      const c = localProf?.city ?? ''
      setCity(c)
      setOriginalCity(c)
      const pl = localProf?.political ?? ''
      setPolitical(pl)
      setOriginalPolitical(pl)
      const hb = localProf?.hobbies ?? ''
      setHobbies(hb)
      setOriginalHobbies(hb)

      const dbId = mainId ?? altId
      if (!client || !dbId) return
      try {
        const { data: prof, error: profError } = await client
          .from('profiles')
          .select('tag, avatar_url, description, age, gender, city, political, hobbies, is_verified, is_quality, is_moderator')
          .eq('id', dbId)
          .maybeSingle()
        if (profError || !prof) return
        
        setIsVerified(prof.is_verified ?? false)
        setIsQuality(prof.is_quality ?? false)
        setIsModerator(prof.is_moderator ?? false)
        const tagFromDb = (prof.tag as string | undefined) ?? undefined
        const avatarFromDb = (prof.avatar_url as string | undefined) ?? undefined
        const descFromDb = (prof.description as string | undefined) ?? ''
        const ageFromDb = (prof.age as string | number | undefined) ?? undefined
        const genderFromDb = (prof.gender as string | undefined) ?? undefined
        const politicalFromDb = (prof.political as string | undefined) ?? undefined
        const hobbiesFromDb = (prof.hobbies as string | undefined) ?? undefined
        const cityFromDb = (prof.city as string | undefined) ?? undefined

        if (typeof tagFromDb === 'string' && tagFromDb.trim().length > 0) {
          setTagText(tagFromDb.trim())
          setOriginalTag(tagFromDb.trim())
        }
        if (typeof avatarFromDb === 'string' && avatarFromDb.trim().length > 0) {
          setAvatarUrl(avatarFromDb)
        }
        setDescription(descFromDb ?? '')
        setOriginalDescription(descFromDb ?? '')
        if (typeof ageFromDb === 'number') {
          const a2 = String(ageFromDb)
          setAge(a2)
          setOriginalAge(a2)
        } else if (typeof ageFromDb === 'string') {
          setAge(ageFromDb)
          setOriginalAge(ageFromDb)
        } else {
          setAge('')
          setOriginalAge('')
        }
        const g2 = typeof genderFromDb === 'string' ? genderFromDb : ''
        setGender(g2)
        setOriginalGender(g2)
        const c2 = typeof cityFromDb === 'string' ? cityFromDb : ''
        setCity(c2)
        setOriginalCity(c2)
        const p2 = typeof politicalFromDb === 'string' ? politicalFromDb : ''
        setPolitical(p2)
        setOriginalPolitical(p2)
        const h2 = typeof hobbiesFromDb === 'string' ? hobbiesFromDb : ''
        setHobbies(h2)
        setOriginalHobbies(h2)
      } catch {
      }
    })()
  }, [])

  const gradientIndex = (() => {
    const base = userId ?? 'user'
    let sum = 0
    for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i)
    return sum % avatarGradients.length
  })()
  const gradient = avatarGradients[gradientIndex]
  const initialLetter = tagText && tagText.length > 0 ? tagText.trim().charAt(0).toUpperCase() : 'U'
  const defaultCities = ['Кадуй', 'Череповец', 'Вологда', 'Грязовец', 'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону', 'Будка']

  const handleAvatarFile = async (files: FileList | null) => {
    const f = files && files[0]
    if (!f || !userId) return
    setAvatarLoading(true)
    try {
      const client = getSupabase()
      let finalUrl: string | null = null
      if (client) {
        const path = `${userId}/${Date.now()}_${f.name}`
        const up = await client.storage.from('avatars').upload(path, f, { upsert: true })
        if (!up.error) {
          const pub = client.storage.from('avatars').getPublicUrl(path)
          finalUrl = pub.data.publicUrl
          await client.from('profiles').upsert({ id: userId, avatar_url: finalUrl })
        }
      }
      if (!finalUrl) {
        const reader = new FileReader()
        const dataUrl = await new Promise<string | null>((res) => {
          reader.onload = () => res(typeof reader.result === 'string' ? reader.result : null)
          reader.readAsDataURL(f)
        })
        finalUrl = dataUrl
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw ? JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; political?: string; hobbies?: string }> : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = { ...prev, avatar_url: finalUrl ?? undefined }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
      if (finalUrl) {
        setAvatarUrl(finalUrl)
        const event = new CustomEvent('profile-updated', { detail: { avatar_url: finalUrl } })
        window.dispatchEvent(event)
      }
    } finally {
      setAvatarLoading(false)
    }
  }

  const removeAvatar = async () => {
    if (!userId) {
      setAvatarUrl(null)
      const event = new CustomEvent('profile-updated', { detail: { avatar_url: null } })
      window.dispatchEvent(event)
      return
    }
    const client = getSupabase()
    if (client) {
      const { error } = await client.from('profiles').upsert({ id: userId, avatar_url: null })
      if (error) {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>) : {}
        const prev = profMap[userId] ?? {}
        const next = { ...prev }
        delete next.avatar_url
        profMap[userId] = next
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>) : {}
      const prev = profMap[userId] ?? {}
      const next = { ...prev }
      delete next.avatar_url
      profMap[userId] = next
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
    setAvatarUrl(null)
    const event = new CustomEvent('profile-updated', { detail: { avatar_url: null } })
    window.dispatchEvent(event)
  }

  const saveTag = async () => {
    const next = tagText.trim()
    if (next.length === 0) return
    const client = getSupabase()

    const updateLocal = () => {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<
            string,
            {
              tag?: string
              avatar_url?: string
              description?: string
              age?: string
              gender?: string
              city?: string
              political?: string
              hobbies?: string
            }
          >)
        : {}
      if (userId) {
        const prev = profMap[userId] ?? {}
        profMap[userId] = { ...prev, tag: next }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
    }

    if (client && userId) {
      const { error } = await client.from('profiles').upsert({ id: userId, tag: next })
      updateLocal()
    } else if (userId) {
      updateLocal()
    }

    const event = new CustomEvent('profile-updated', { detail: { tag: next } })
    window.dispatchEvent(event)
  }

  const saveAbout = async () => {
    const client = getSupabase()
    let mainId: string | null = null
    let altId: string | null = null
    try {
      const auth = await loadLocalAuth()
      mainId = auth?.uuid ?? auth?.uid ?? null
      altId =
        auth?.uuid && auth?.uid && auth.uuid !== auth.uid ? auth.uid : null
    } catch {
      mainId = null
      altId = null
    }
    const id = mainId ?? altId
    if (!id) return
    const payload: Record<string, unknown> = {
      id,
      description: description ?? '',
      age: (age ?? '').trim(),
      gender: (gender ?? '').trim(),
      city: (city ?? '').trim(),
      political: (political ?? '').trim(),
      hobbies: (hobbies ?? '').trim(),
    }
    const updateLocal = () => {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<
            string,
            {
              tag?: string
              avatar_url?: string
              description?: string
              age?: string
              gender?: string
              city?: string
              political?: string
              hobbies?: string
            }
          >)
        : {}
      if (mainId) {
        const prev = profMap[mainId] ?? {}
        profMap[mainId] = {
          ...prev,
          description: payload.description as string,
          age:
            typeof payload.age === 'number'
              ? String(payload.age)
              : (payload.age as string | null) ?? '',
          gender: (payload.gender as string | null) ?? '',
          city: (payload.city as string | null) ?? '',
          political: (payload.political as string | null) ?? '',
          hobbies: (payload.hobbies as string | null) ?? '',
        }
      }
      if (altId && altId !== mainId) {
        const prevAlt = profMap[altId] ?? {}
        profMap[altId] = {
          ...prevAlt,
          description: payload.description as string,
          age:
            typeof payload.age === 'number'
              ? String(payload.age)
              : (payload.age as string | null) ?? '',
          gender: (payload.gender as string | null) ?? '',
          city: (payload.city as string | null) ?? '',
          political: (payload.political as string | null) ?? '',
          hobbies: (payload.hobbies as string | null) ?? '',
        }
      }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
    if (client) {
      const { error } = await client.from('profiles').upsert(payload)
      updateLocal()
    } else {
      updateLocal()
    }
    const event = new CustomEvent('profile-updated', {
      detail: {
        description: description ?? '',
        age: age ?? '',
        gender: gender ?? '',
        city: city ?? '',
        political: political ?? '',
        hobbies: hobbies ?? '',
      },
    })
    window.dispatchEvent(event)
  }

  const saveDescription = async () => {
    const client = getSupabase()
    let mainId: string | null = null
    let altId: string | null = null
    try {
      const auth = await loadLocalAuth()
      mainId = auth?.uuid ?? auth?.uid ?? null
      altId =
        auth?.uuid && auth?.uid && auth.uuid !== auth.uid ? auth.uid : null
    } catch {
      mainId = null
      altId = null
    }
    const id = mainId ?? altId
    if (!id) return
    const next = description ?? ''
    const updateLocal = () => {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<
            string,
            { tag?: string; avatar_url?: string; description?: string }
          >)
        : {}
      if (mainId) {
        const prev = profMap[mainId] ?? {}
        profMap[mainId] = { ...prev, description: next }
      }
      if (altId && altId !== mainId) {
        const prevAlt = profMap[altId] ?? {}
        profMap[altId] = { ...prevAlt, description: next }
      }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
    if (client) {
      const { error } = await client
        .from('profiles')
        .upsert({ id, description: next })
      updateLocal()
    } else {
      updateLocal()
    }
    const event = new CustomEvent('profile-updated', { detail: { description: next } })
    window.dispatchEvent(event)
  }

  const dirty =
    tagText.trim() !== (originalTag ?? '') ||
    (description ?? '') !== (originalDescription ?? '') ||
    (age ?? '') !== (originalAge ?? '') ||
    (gender ?? '') !== (originalGender ?? '') ||
    (city ?? '') !== (originalCity ?? '') ||
    (political ?? '') !== (originalPolitical ?? '') ||
    (hobbies ?? '') !== (originalHobbies ?? '')

  return (
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-full w-full max-w-[430px] bg-[#0A0A0A] flex flex-col">
        {/* Header */}
        <div className="safe-top h-[64px] flex items-center justify-between px-6 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-20">
          <button
            type="button"
            onClick={() => {
              if (dirty) {
                setShowConfirm(true)
              } else {
                onClose()
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <img
              src="/interface/x-01.svg"
              alt="close"
              className="h-5 w-5 invert brightness-[2]"
            />
          </button>
          
          <button
            type="button"
            onClick={async () => {
              await saveTag()
              await saveAbout()
              onClose()
            }}
            disabled={!dirty}
            className={`px-5 h-10 rounded-full font-sf-ui-medium transition-all ${
              dirty 
                ? 'bg-white text-black scale-100 active:scale-95' 
                : 'bg-white/5 text-white/30 scale-100'
            }`}
          >
            Готово
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          {/* Avatar Section */}
          <div className="relative pt-10 pb-6 flex flex-col items-center">
            <div 
              className="relative group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              <div 
                className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-[#1A1A1A] shadow-2xl relative"
                style={{ background: avatarUrl ? '#1A1A1A' : gradient }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[40px] text-white/50 font-ttc-bold">
                    {initialLetter}
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Sparkles className="text-white w-8 h-8" />
                </div>
              </div>

              {avatarUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeAvatar()
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <LogOut size={14} className="rotate-180" />
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[24px] font-ttc-bold text-white">@{tagText || 'user'}</span>
                <div className="flex items-center gap-1.5">
                  {isModerator && <ModeratorBadge size={18} />}
                  {isQuality && <QualityBadge size={18} />}
                  {isVerified && <VerifiedBadge size={18} />}
                </div>
              </div>
              <p className="text-white/40 text-[13px] font-sf-ui-light">Нажмите на фото, чтобы изменить</p>
            </div>
          </div>

          {/* Form Sections */}
          <div className="px-6 space-y-6">
            {/* Tag Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Hash size={16} className="text-white/40" />
                <span className="text-[13px] font-sf-ui-medium text-white/40 uppercase tracking-wider">Тег профиля</span>
              </div>
              <div className="relative">
                <input
                  value={tagText}
                  onChange={(e) => setTagText(e.target.value)}
                  placeholder="Ваш уникальный тег"
                  className={`w-full h-[56px] bg-[#1A1A1A] border ${tagError ? 'border-red-500/50' : 'border-white/5'} rounded-[28px] px-6 text-white font-sf-ui-light outline-none focus:border-white/20 transition-colors`}
                />
                {tagError && <p className="absolute -bottom-5 left-4 text-[11px] text-red-500">{tagError}</p>}
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Info size={16} className="text-white/40" />
                <span className="text-[13px] font-sf-ui-medium text-white/40 uppercase tracking-wider">О себе</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите что-нибудь интересное..."
                className="w-full min-h-[120px] bg-[#1A1A1A] border border-white/5 rounded-[32px] p-6 text-white font-sf-ui-light outline-none focus:border-white/20 transition-colors resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.dispatchEvent(new Event('open-settings'))
                }}
                className="w-full h-[56px] bg-[#1A1A1A] border border-white/5 rounded-[28px] flex items-center justify-between px-6 group hover:bg-white/[0.08] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Settings size={20} className="text-white/60" />
                  </div>
                  <span className="text-white font-sf-ui-medium">Настройки</span>
                </div>
                <ChevronRight size={20} className="text-white/20 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={async () => {
                  const client = getSupabase()
                  if (client) await client.auth.signOut()
                  await clearLocalAuth()
                  window.dispatchEvent(new Event('local-auth-changed'))
                }}
                className="w-full h-[56px] bg-red-500/10 border border-red-500/10 rounded-[28px] flex items-center justify-center gap-2 group hover:bg-red-500/20 transition-all"
              >
                <LogOut size={20} className="text-red-500" />
                <span className="text-red-500 font-sf-ui-medium">Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[340px] bg-[#1A1A1A]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              {/* Liquid background effect */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full" />

              <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <AlertTriangle className="text-yellow-500 w-8 h-8" />
                </div>
                
                <h2 className="text-[22px] font-ttc-bold text-white mb-3">Несохранённые изменения</h2>
                <p className="text-white/50 font-sf-ui-light text-[15px] leading-relaxed mb-8">
                  Вы изменили информацию в профиле. Что вы хотите сделать с этими изменениями?
                </p>

                <div className="w-full space-y-3">
                  <button
                    onClick={async () => {
                      await saveTag()
                      await saveAbout()
                      setShowConfirm(false)
                      onClose()
                    }}
                    className="w-full h-[56px] bg-white text-black rounded-[20px] font-sf-ui-medium text-[16px] active:scale-95 transition-all shadow-lg shadow-white/5"
                  >
                    Сохранить
                  </button>
                  
                  <button
                    onClick={() => {
                      setTagText(originalTag ?? '')
                      setDescription(originalDescription ?? '')
                      setAge(originalAge ?? '')
                      setGender(originalGender ?? '')
                      setCity(originalCity ?? '')
                      setPolitical(originalPolitical ?? '')
                      setHobbies(originalHobbies ?? '')
                      setShowConfirm(false)
                      onClose()
                    }}
                    className="w-full h-[56px] bg-white/5 text-white/60 rounded-[20px] font-sf-ui-medium text-[16px] hover:bg-white/10 active:scale-95 transition-all"
                  >
                    Отмена
                  </button>
                  
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="w-full py-2 text-white/30 font-sf-ui-light text-[13px] hover:text-white/50 transition-colors"
                  >
                    Продолжить редактирование
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
