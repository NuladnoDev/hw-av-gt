'use client'
import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
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
  const [tagEditing, setTagEditing] = useState(false)
  const [description, setDescription] = useState('')
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [political, setPolitical] = useState<string>('')
  const [hobbies, setHobbies] = useState<string>('')
  const [originalTag, setOriginalTag] = useState<string>('')
  const [originalDescription, setOriginalDescription] = useState<string>('')
  const [originalAge, setOriginalAge] = useState<string>('')
  const [originalGender, setOriginalGender] = useState<string>('')
  const [originalPolitical, setOriginalPolitical] = useState<string>('')
  const [originalHobbies, setOriginalHobbies] = useState<string>('')

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
    const client = getSupabase()
    if (client) {
      ;(async () => {
        const { data } = await client.auth.getUser()
        const id = data.user?.id ?? null
        setUserId(id)
        if (!id) return
        const { data: prof } = await client.from('profiles').select('tag, avatar_url, description, age, gender, political, hobbies').eq('id', id).maybeSingle()
        const tagFromDb = (prof?.tag as string | undefined) ?? undefined
        const avatarFromDb = (prof?.avatar_url as string | undefined) ?? undefined
        const descFromDb = (prof?.description as string | undefined) ?? ''
        const ageFromDb = (prof?.age as string | number | undefined) ?? undefined
        const genderFromDb = (prof?.gender as string | undefined) ?? undefined
        const politicalFromDb = (prof?.political as string | undefined) ?? undefined
        const hobbiesFromDb = (prof?.hobbies as string | undefined) ?? undefined
        if (typeof tagFromDb === 'string' && tagFromDb.trim().length > 0) {
          setTagText(tagFromDb.trim())
          setOriginalTag(tagFromDb.trim())
        } else if (typeof initialTagProp === 'string' && initialTagProp.trim().length > 0) {
          setTagText(initialTagProp.replace(/^@/, '').trim())
          setOriginalTag(initialTagProp.replace(/^@/, '').trim())
        }
        if (typeof avatarFromDb === 'string' && avatarFromDb.trim().length > 0) {
          setAvatarUrl(avatarFromDb)
        }
        setDescription(descFromDb ?? '')
        setOriginalDescription(descFromDb ?? '')
        if (typeof ageFromDb === 'number') {
          const a = String(ageFromDb)
          setAge(a)
          setOriginalAge(a)
        } else if (typeof ageFromDb === 'string') {
          setAge(ageFromDb)
          setOriginalAge(ageFromDb)
        } else {
          setAge('')
          setOriginalAge('')
        }
        const g = typeof genderFromDb === 'string' ? genderFromDb : ''
        setGender(g)
        setOriginalGender(g)
        const p = typeof politicalFromDb === 'string' ? politicalFromDb : ''
        setPolitical(p)
        setOriginalPolitical(p)
        const h = typeof hobbiesFromDb === 'string' ? hobbiesFromDb : ''
        setHobbies(h)
        setOriginalHobbies(h)
      })()
    } else {
      const authRaw = window.localStorage.getItem('hw-auth')
      const auth = authRaw ? JSON.parse(authRaw) as { tag?: string; uid?: string; email?: string } : null
      const id = auth?.uid ?? null
      setUserId(id)
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw ? JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; political?: string; hobbies?: string }> : {}
      const p = id ? profMap[id] : undefined
      const tagLocal = p?.tag ?? auth?.tag ?? (typeof initialTagProp === 'string' ? initialTagProp.replace(/^@/, '') : '')
      setTagText(tagLocal ?? '')
      setOriginalTag(tagLocal ?? '')
      if (p?.avatar_url) setAvatarUrl(p.avatar_url)
      const d = p?.description ?? ''
      setDescription(d)
      setOriginalDescription(d)
      const a = p?.age ?? ''
      setAge(a)
      setOriginalAge(a)
      const g = p?.gender ?? ''
      setGender(g)
      setOriginalGender(g)
      const pl = p?.political ?? ''
      setPolitical(pl)
      setOriginalPolitical(pl)
      const hb = p?.hobbies ?? ''
      setHobbies(hb)
      setOriginalHobbies(hb)
    }
  }, [])

  const gradientIndex = (() => {
    const base = userId ?? 'user'
    let sum = 0
    for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i)
    return sum % avatarGradients.length
  })()
  const gradient = avatarGradients[gradientIndex]
  const initialLetter = tagText && tagText.length > 0 ? tagText.trim().charAt(0).toUpperCase() : 'U'

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

  const saveTag = async () => {
    const next = tagText.trim()
    if (next.length === 0) return
    const client = getSupabase()
    if (client && userId) {
      const { error } = await client.from('profiles').upsert({ id: userId, tag: next })
      if (error) {
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
      political: (political ?? '').trim(),
      hobbies: (hobbies ?? '').trim(),
    }
    if (client) {
      await client.from('profiles').upsert(payload)
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw ? JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; political?: string; hobbies?: string }> : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = {
        ...prev,
        description: payload.description as string,
        age: typeof payload.age === 'number' ? String(payload.age) : (payload.age as string | null) ?? '',
        gender: (payload.gender as string | null) ?? '',
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
              <span className={`text-[16px] leading-[1em] ${dirty ? 'text-white' : 'text-white/60'} font-sf-ui-medium`}>Сохранить</span>
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
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden border border-[rgba(255,255,255,0.2)]"
          style={{
            width: 'var(--profile-avatar-size)',
            height: 'var(--profile-avatar-size)',
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2))',
            boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
            background: gradient,
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
            height: 'calc(812px - 88px - 56px - var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) - var(--home-header-offset) - 12px)',
          }}
        >
          <div className="flex w-full flex-col items-center">
            {!tagEditing ? (
              <div className="leading-[2.3em] text-white font-ttc-bold flex items-center gap-2" style={{ fontSize: 'var(--profile-name-size)', marginTop: 'var(--profile-name-margin-top)' }}>
                <span>{tagText && tagText.trim().length > 0 ? tagText : 'user'}</span>
                <button
                  type="button"
                  className="opacity-90"
                  onClick={() => setTagEditing(true)}
                  aria-label="Редактировать тег"
                >
                  <img
                    src="/interface/krr.svg"
                    alt="edit-tag"
                    className="h-[18px] w-[18px]"
                    style={{
                      filter:
                        'brightness(0) saturate(100%) invert(84%) sepia(68%) saturate(569%) hue-rotate(360deg) brightness(101%) contrast(101%)',
                    }}
                  />
                </button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center" style={{ marginTop: 'var(--profile-name-margin-top)' }}>
                <input
                  value={tagText}
                  onChange={(e) => {
                    setTagText(e.target.value)
                  }}
                  onBlur={() => {
                    setTagEditing(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setTagEditing(false)
                    }
                  }}
                  className="h-[40px] w-[220px] rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-3 text-[16px] leading-[1.4em] text-white outline-none"
                />
              </div>
            )}

            <div className="mt-8 w-full max-w-[320px]">
              <div className="mx-auto rounded-[12px] border border-[#2B2B2B] bg-[#111111] p-4">
                <div className="text-[16px] leading-[1.7em] text-white font-ttc-bold mb-2">Описание профиля</div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                  }}
                  rows={3}
                  placeholder=""
                  className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#0F0F0F] p-3 text-[16px] leading-[1.4em] text-white outline-none"
                />
              </div>
              <div className="mt-3 mx-auto rounded-[12px] border border-[#2B2B2B] bg-[#111111] p-4">
                <div className="text-[16px] leading-[1.7em] text-white font-ttc-bold mb-2">О себе</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[14px] leading-[1.7em] text-white/80">Возраст</div>
                    <input
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value)
                      }}
                      placeholder="Возраст"
                      className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#0F0F0F] px-3 py-2 text-[16px] leading-[1.4em] text-white outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[14px] leading-[1.7em] text-white/80">Пол</div>
                    <input
                      value={gender}
                      onChange={(e) => {
                        setGender(e.target.value)
                      }}
                      placeholder="Пол"
                      className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#0F0F0F] px-3 py-2 text-[16px] leading-[1.4em] text-white outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[14px] leading-[1.7em] text-white/80">Политические взгляды</div>
                    <input
                      value={political}
                      onChange={(e) => {
                        setPolitical(e.target.value)
                      }}
                      placeholder="Политические взгляды"
                      className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#0F0F0F] px-3 py-2 text-[16px] leading-[1.4em] text-white outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[14px] leading-[1.7em] text-white/80">Хобби</div>
                    <input
                      value={hobbies}
                      onChange={(e) => {
                        setHobbies(e.target.value)
                      }}
                      placeholder="Хобби"
                      className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#0F0F0F] px-3 py-2 text-[16px] leading-[1.4em] text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 relative w-full h-full profile-switch-transition">
              <img
                src="/interface/glass.png"
                alt="empty"
                style={{
                  position: 'absolute',
                  top: 'var(--profile-empty-icon-top)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'var(--profile-empty-icon-size)',
                  height: 'var(--profile-empty-icon-size)',
                }}
              />
              <div
                className="text-center text-[16px] leading-[1.4em] text-[#A1A1A1]"
                style={{ position: 'absolute', left: 0, right: 0, bottom: 'var(--profile-empty-text-bottom)' }}
              >
                Здесь будут ваши настройки
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  )
}
