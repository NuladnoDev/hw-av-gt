'use client'
import { useEffect, useRef, useState } from 'react'
import { getSupabase, clearLocalAuth } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'

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
      const authRaw = window.localStorage.getItem('hw-auth')
      const auth = authRaw ? (JSON.parse(authRaw) as { tag?: string; uid?: string; email?: string }) : null
      const id = auth?.uid ?? null
      setUserId(id)
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
        : {}
      const localProf = id ? profMap[id] : undefined
      const baseTag =
        localProf?.tag ??
        auth?.tag ??
        (typeof initialTagProp === 'string' ? initialTagProp.replace(/^@/, '') : '') ??
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

      if (!client || !id) return
      try {
        const { data: prof, error: profError } = await client
          .from('profiles')
          .select('tag, avatar_url, description, age, gender, city, political, hobbies')
          .eq('id', id)
          .maybeSingle()
        if (profError || !prof) return
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
    if (client && userId) {
      const { error } = await client.from('profiles').upsert({ id: userId, tag: next })
      if (error) {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>) : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = { ...prev, tag: next }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
        const event = new CustomEvent('profile-updated', { detail: { tag: next } })
        window.dispatchEvent(event)
        return
      }
    } else if (userId) {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw ? JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; political?: string; hobbies?: string }> : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = { ...prev, tag: next }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
    const event = new CustomEvent('profile-updated', { detail: { tag: next } })
    window.dispatchEvent(event)
  }

  const saveAbout = async () => {
    if (!userId) return
    const client = getSupabase()
    const payload: Record<string, unknown> = {
      id: userId,
      description: description ?? '',
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
        const profMap = profRaw ? JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }> : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = {
          ...prev,
          description: payload.description as string,
          age: typeof payload.age === 'number' ? String(payload.age) : (payload.age as string | null) ?? '',
          gender: (payload.gender as string | null) ?? '',
          city: (payload.city as string | null) ?? '',
          political: (payload.political as string | null) ?? '',
          hobbies: (payload.hobbies as string | null) ?? '',
        }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw ? JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }> : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = {
        ...prev,
        description: payload.description as string,
        age: typeof payload.age === 'number' ? String(payload.age) : (payload.age as string | null) ?? '',
        gender: (payload.gender as string | null) ?? '',
        city: (payload.city as string | null) ?? '',
        political: (payload.political as string | null) ?? '',
        hobbies: (payload.hobbies as string | null) ?? '',
      }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
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
    if (!userId) return
    const next = description ?? ''
    if (client) {
      const { error } = await client.from('profiles').upsert({ id: userId, description: next })
      if (error) {
        const event = new CustomEvent('profile-updated', { detail: { description: next } })
        window.dispatchEvent(event)
        return
      }
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw ? JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string }> : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = { ...prev, description: next }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
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
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden edit-screen-in">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px]" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={() => {
                setTagText(originalTag ?? '')
                setDescription(originalDescription ?? '')
                setAge(originalAge ?? '')
                setGender(originalGender ?? '')
                setPolitical(originalPolitical ?? '')
                setHobbies(originalHobbies ?? '')
                onClose()
              }}
              className="absolute left-6 top-0 flex h-full items-center"
              aria-label="Закрыть без сохранения"
            >
              <img
                src="/interface/x-01.svg"
                alt="close"
                className="h-[22px] w-[22px]"
                style={{ filter: 'invert(1) brightness(1.6)' }}
              />
            </button>
            <button
              type="button"
              onClick={async () => {
                await saveTag()
                await saveAbout()
                if (tagText.trim().length > 0) {
                  setOriginalTag(tagText.trim())
                }
                setOriginalDescription(description ?? '')
                setOriginalAge(age ?? '')
                setOriginalGender(gender ?? '')
                setOriginalPolitical(political ?? '')
                setOriginalHobbies(hobbies ?? '')
                const ev = new CustomEvent('profile-edit-closed', { detail: { tab: 'about' } })
                window.dispatchEvent(ev)
                onClose()
              }}
              className="absolute right-6 top-0 flex h-full items-center"
              disabled={!dirty}
            >
              <span className={`text-[16px] leading-[1em] ${dirty ? 'text-white' : 'text-white/60'} font-sf-ui-medium`}>Сохр.</span>
            </button>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 flex h-full items-center">
              <div className="text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
                Профиль
              </div>
            </div>
            <div className="absolute left-0 bottom-[-0.5px] w-full" style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatarFile(e.target.files)}
        />

        <div
          className="absolute left-0 w-full"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)', height: 'var(--profile-cover-height)' }}
        >
          <div className="h-full w-full" style={{ background: '#0A0A0A' }} />
        </div>
          <div className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
            style={{
              width: 'var(--profile-avatar-size)',
              height: 'var(--profile-avatar-size)',
              top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2))',
              boxShadow: `0 0 var(--profile-avatar-glow-size) var(--profile-avatar-glow-color), 0 4px 18px rgba(0,0,0,0.35)`,
              background: avatarUrl ? '#0A0A0A' : gradient,
            }}
            onClick={() => avatarInputRef.current?.click()}
          >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <img
                src="/interface/image-add.svg"
                alt="add"
                className="absolute left-1/2 top-1/2 h-[34px] w-[34px]"
                style={{ transform: 'translate(-50%, -50%)', filter: 'invert(1) brightness(2)' }}
              />
            )}
          </div>
        

        <div
          className="absolute left-0 w-full px-6 overflow-y-auto"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) + calc(var(--profile-avatar-size) / 2) + 12px)',
            height: 'calc(812px - var(--profile-edit-bottom-height) - 56px - var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) - var(--home-header-offset) - 12px)',
          }}
        >
          <div className="flex w-full flex-col items-center">
            <div className="leading-[2.3em] text-white font-ttc-bold flex items-center gap-2" style={{ fontSize: 'var(--profile-name-size)', marginTop: 'var(--profile-name-margin-top)' }}>
              <span>{tagText && tagText.trim().length > 0 ? tagText : 'user'}</span>
              <button
                type="button"
                className="opacity-80"
                onClick={removeAvatar}
                aria-label="Удалить фото"
              >
                <img
                  src="/interface/trash-03.svg"
                  alt="trash"
                  className="h-[18px] w-[18px]"
                  style={{ filter: 'invert(1) brightness(0.7)' }}
                />
              </button>
            </div>

            <div className="mt-8 w-full" style={{ marginLeft: '-24px', marginRight: '-24px' }}>
              <div
                className="mx-auto rounded-[12px] border border-[#2B2B2B] bg-[#111111] p-4"
                style={{ width: '107%', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}
              >
                <div className="leading-[1.6em] font-sf-ui-light mb-1" style={{ fontSize: 'var(--profile-edit-label-size)', color: tagError ? 'var(--profile-tag-error-color)' : '#ffffff' }}>
                  {tagError ? tagError : 'Тег пользователя'}
                </div>
                <input
                  value={tagText}
                  onChange={(e) => {
                    const v = e.target.value
                    setTagText(v)
                    const t = v.trim()
                    if (t.length === 0) setTagError('введите тег')
                    else setTagError('')
                  }}
                  placeholder="Тег"
                  className="mb-3 w-full rounded-[10px] bg-[#0F0F0F] px-3 leading-[1.4em] text-white outline-none font-sf-ui-light"
                  style={{ height: 'var(--profile-edit-input-height)', fontSize: 'calc(var(--profile-edit-text-size) - 2px)', border: tagError ? '1px solid var(--profile-tag-error-border-color)' : 'none' }}
                />
                <div className="leading-[1.7em] font-sf-ui-light mb-2" style={{ fontSize: 'var(--profile-edit-label-size)', color: '#ffffff' }}>Описание профиля</div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                  }}
                  rows={3}
                  placeholder=""
                  className="w-full rounded-[10px] bg-[#0F0F0F] px-3 py-2 leading-[1.4em] text-white outline-none font-sf-ui-light"
                  style={{ fontSize: 'calc(var(--profile-edit-text-size) - 2px)', border: 'var(--profile-edit-input-border)' }}
                />
              </div>
              <button
                type="button"
                className="mt-3 mx-auto block w-full rounded-[12px] border border-[#2B2B2B] bg-[#111111] p-4 text-center"
                style={{ width: '107%', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}
                onClick={() => {
                  onClose()
                  const ev = new Event('open-settings')
                  window.dispatchEvent(ev)
                }}
              >
                <div className="leading-[1.7em] text-white font-sf-ui-medium" style={{ fontSize: 'var(--profile-extra-title-size)' }}>Настройки</div>
              </button>
              <button
                type="button"
                className="mt-3 mx-auto block w-full rounded-[12px] border border-[#2B2B2B] bg-[#111111] p-4 text-center"
                style={{ width: '107%', position: 'relative', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--profile-logout-bg)' }}
                onClick={async () => {
                  const client = getSupabase()
                  if (client) {
                    await client.auth.signOut()
                  }
                  await clearLocalAuth()
                  window.dispatchEvent(new Event('local-auth-changed'))
                }}
              >
                <div className="leading-[1.7em] text-white font-sf-ui-medium" style={{ fontSize: 'var(--profile-extra-title-size)', color: 'var(--profile-action-text-color)' }}>Выйти</div>
              </button>
            </div>
          </div>
        </div>

        
 
      </div>
    </div>
  )
}
