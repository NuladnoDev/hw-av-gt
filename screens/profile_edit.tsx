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
  ChevronLeft,
  Trash2,
  Sparkles,
  Info,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  X
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
  const [avatarDirty, setAvatarDirty] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectorClosing, setSelectorClosing] = useState(false)
  const [selectorType, setSelectorType] = useState<'gender' | 'city' | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showPasswordSettings, setShowPasswordSettings] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [idRevealed, setIdRevealed] = useState(false)
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
      }
      setAvatarUrl(finalUrl)
      setAvatarDirty(true)
    } finally {
      setAvatarLoading(false)
    }
  }

  const removeAvatar = () => {
    setAvatarUrl(null)
    setAvatarDirty(true)
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

  const saveAvatar = async () => {
    if (!avatarDirty || !userId) return
    const client = getSupabase()
    
    const updateLocal = (url: string | null) => {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw ? (JSON.parse(profRaw) as Record<string, any>) : {}
      const prev = profMap[userId] ?? {}
      if (url) {
        profMap[userId] = { ...prev, avatar_url: url }
      } else {
        const nextProf = { ...prev }
        delete nextProf.avatar_url
        profMap[userId] = nextProf
      }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }

    if (client) {
      await client.from('profiles').upsert({ id: userId, avatar_url: avatarUrl })
    }
    updateLocal(avatarUrl)
    
    const event = new CustomEvent('profile-updated', { detail: { avatar_url: avatarUrl } })
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

  const handlePasswordChange = async () => {
    setPasswordError('')
    if (!oldPassword) {
      setPasswordError('Введите старый пароль')
      return
    }
    if (!newPassword) {
      setPasswordError('Введите новый пароль')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов')
      return
    }

    setIsChangingPassword(true)
    try {
      const client = getSupabase()
      if (!client) throw new Error('Supabase client not found')

      // Get current user email
      const { data: { user } } = await client.auth.getUser()
      if (!user?.email) throw new Error('Пользователь не найден')

      // Verify old password by signing in again
      const { error: signInError } = await client.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      })

      if (signInError) {
        setPasswordError('Неверный старый пароль')
        return
      }

      // Update password
      const { error: updateError } = await client.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setPasswordError(updateError.message)
      } else {
        // Success
        setOldPassword('')
        setNewPassword('')
        setShowPasswordSettings(false)
        // Could add a success toast here
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Произошла ошибка')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const dirty =
    avatarDirty ||
    tagText.trim() !== (originalTag ?? '') ||
    (description ?? '') !== (originalDescription ?? '') ||
    (age ?? '') !== (originalAge ?? '') ||
    (gender ?? '') !== (originalGender ?? '') ||
    (city ?? '') !== (originalCity ?? '') ||
    (political ?? '') !== (originalPolitical ?? '') ||
    (hobbies ?? '') !== (originalHobbies ?? '')

  return (
    <div className="fixed inset-0 z-[150] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative h-full w-full max-w-[430px] bg-[#0A0A0A] flex flex-col">
        {/* Hidden File Input */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatarFile(e.target.files)}
        />
        {/* Header */}
        <div className="safe-top h-[64px] flex items-center justify-between px-6 bg-[#0A0A0A] sticky top-0 z-20">
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
            <ChevronLeft size={24} className="text-white" />
          </button>
          
          <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center">
            <span className="text-[20px] font-ttc-bold text-white">Настройки</span>
          </div>

          <button
            type="button"
            onClick={async () => {
              await saveAvatar()
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

        <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide flex flex-col items-center mt-[-64px]">
          <style jsx global>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          
          <div className="w-full flex flex-col items-center pt-24">
            <div 
              className="relative group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              <div 
                className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-[#1A1A1A] shadow-2xl relative flex items-center justify-center"
                style={{ background: avatarUrl ? '#1A1A1A' : gradient }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[40px] text-white/50 font-ttc-bold leading-none">
                    <span className="translate-y-[2px]">{initialLetter}</span>
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
                  <X size={16} strokeWidth={3} />
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {isModerator && <ModeratorBadge size={18} />}
                  {isQuality && <QualityBadge size={18} />}
                </div>
                <span className="text-[24px] font-ttc-bold text-white">{tagText || 'user'}</span>
                {isVerified && <VerifiedBadge size={18} />}
              </div>
              <p className="text-white/40 text-[13px] font-sf-ui-light">Нажмите на фото, чтобы изменить</p>
            </div>
          </div>

            {/* Form Sections */}
          <div className="w-full px-6 space-y-6 mt-6">
            {/* Tag Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[13px] font-sf-ui-medium text-white/40 tracking-wider">Имя пользователя</span>
              </div>
              <div className="relative">
                <input
                  value={tagText}
                  onChange={(e) => setTagText(e.target.value)}
                  placeholder="Ваш уникальный тег"
                  className={`w-full h-[56px] bg-[#0F0F0F] border ${tagError ? 'border-red-500/50' : 'border-white/5'} rounded-[28px] px-6 text-white font-sf-ui-light outline-none focus:border-white/20 transition-colors`}
                />
                {tagError && <p className="absolute -bottom-5 left-4 text-[11px] text-red-500">{tagError}</p>}
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Info size={16} className="text-white/40" />
                <span className="text-[13px] font-sf-ui-medium text-white/40 tracking-wider">О себе</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите что-нибудь интересное..."
                className="w-full min-h-[120px] bg-[#0F0F0F] border border-white/5 rounded-[32px] p-6 text-white font-sf-ui-light outline-none focus:border-white/20 transition-colors resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => setShowAccountSettings(true)}
                className="w-full h-[56px] bg-[#1A1A1A] border border-white/5 rounded-[28px] flex items-center justify-between px-6 group hover:bg-white/[0.08] transition-all"
              >
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-white/60" />
                  <span className="text-white font-sf-ui-medium">Настройки аккаунта</span>
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

      <AnimatePresence>
        {showAccountSettings && (
          <div key="account-settings-overlay" className="fixed inset-0 z-[100] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative h-full w-full max-w-[430px] bg-[#0A0A0A] flex flex-col"
            >
              {/* Account Settings Header */}
              <div className="safe-top h-[64px] flex items-center px-6 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-20">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountSettings(false)
                    setIdRevealed(false)
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <div className="flex-1 text-center pr-10">
                  <span className="text-[20px] font-ttc-bold text-white">Настройки аккаунта</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
                {/* User Info Card */}
                <div className="bg-[#0F0F0F] border border-white/5 rounded-[32px] p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shadow-xl"
                      style={{ background: avatarUrl ? '#0A0A0A' : gradient }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-white font-ttc-bold text-[20px]">{initialLetter}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[18px] font-sf-ui-medium text-white">{tagText || 'user'}</span>
                      <span className="text-[13px] text-white/40 font-sf-ui-light">Ваш профиль</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                      <div
                        className="flex flex-col flex-1 cursor-pointer group/id"
                        onClick={() => setIdRevealed(true)}
                      >
                        <span className="text-[12px] text-white/30 uppercase tracking-wider mb-1">hw-id</span>
                        <div className="relative inline-block overflow-hidden rounded-md">
                          <span
                            className={`text-[14px] text-white font-mono break-all pr-2 transition-all duration-500 ease-out ${
                              !idRevealed ? 'blur-[6px] select-none opacity-30 scale-95' : 'blur-0 opacity-100 scale-100'
                            }`}
                          >
                            {userId || 'ID не найден'}
                          </span>
                          {!idRevealed && (
                             <motion.div
                               initial={{ opacity: 0 }}
                               animate={{ 
                                  opacity: 1,
                                  backgroundPosition: ['0px 0px', '6px 6px']
                                }}
                                transition={{
                                  backgroundPosition: {
                                    duration: 0.2,
                                    repeat: Infinity,
                                    ease: "linear"
                                  }
                                }}
                                className="absolute inset-0 flex items-center justify-start pointer-events-none"
                              >
                                <div className="w-full h-full bg-white/10 opacity-40" style={{
                                  backgroundImage: `radial-gradient(circle, currentColor 1.1px, transparent 1.1px)`,
                                  backgroundSize: '6px 6px'
                                }} />
                              </motion.div>
                           )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (userId) {
                            navigator.clipboard.writeText(userId)
                            setIdRevealed(true)
                            // Could add a toast here
                          }
                        }}
                        className="w-10 h-10 aspect-square flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/5 ml-4"
                      >
                        <Copy size={18} className="text-white/60" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="bg-[#0F0F0F] border border-white/5 rounded-[32px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSettings(true)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Lock size={20} className="text-blue-400" />
                      </div>
                      <span className="text-white font-sf-ui-medium">Изменить пароль</span>
                    </div>
                    <ChevronRight size={20} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="h-[1px] bg-white/[0.03] mx-5" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountSettings(false)
                      setShowConfirm(false)
                      setIdRevealed(false)
                      // Trigger delete confirm from Setting or local state
                      // For now we'll use a local delete confirm or dispatch event
                      window.dispatchEvent(new Event('profile-delete-request'))
                    }}
                    className="w-full flex items-center justify-between p-5 hover:bg-red-500/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <Trash2 size={20} className="text-red-500" />
                      </div>
                      <span className="text-red-500 font-sf-ui-medium">Удалить аккаунт</span>
                    </div>
                    <ChevronRight size={20} className="text-red-500/20 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showPasswordSettings && (
          <div key="password-settings-overlay" className="fixed inset-0 z-[110] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative h-full w-full max-w-[430px] bg-[#0A0A0A] flex flex-col"
            >
              {/* Password Settings Header */}
              <div className="safe-top h-[64px] flex items-center px-6 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-20">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSettings(false)
                    setOldPassword('')
                    setNewPassword('')
                    setPasswordError('')
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <div className="flex-1 text-center pr-10">
                  <span className="text-[20px] font-ttc-bold text-white">Изменение пароля</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide">
                <div className="space-y-6">
                  {/* Old Password */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Lock size={16} className="text-white/40" />
                      <span className="text-[13px] font-sf-ui-medium text-white/40 tracking-wider">Старый пароль</span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-[56px] bg-[#0F0F0F] border border-white/5 rounded-[28px] px-6 text-white font-sf-ui-light outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Sparkles size={16} className="text-white/40" />
                      <span className="text-[13px] font-sf-ui-medium text-white/40 tracking-wider">Новый пароль</span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-[56px] bg-[#0F0F0F] border border-white/5 rounded-[28px] px-6 text-white font-sf-ui-light outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                      <p className="text-[13px] text-red-500 font-sf-ui-light">{passwordError}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !oldPassword || !newPassword}
                    className={`w-full h-[56px] rounded-[28px] font-sf-ui-medium transition-all flex items-center justify-center gap-2 ${
                      !isChangingPassword && oldPassword && newPassword
                        ? 'bg-white text-black active:scale-95'
                        : 'bg-white/5 text-white/20'
                    }`}
                  >
                    {isChangingPassword ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={20} />
                        <span>Сохранить новый пароль</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-white/20 text-[13px] text-center px-4 font-sf-ui-light leading-relaxed">
                  После смены пароля вам может потребоваться войти в аккаунт повторно на других устройствах.
                </p>
              </div>
            </motion.div>
          </div>
        )}

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
