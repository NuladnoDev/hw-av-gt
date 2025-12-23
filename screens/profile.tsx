'use client'
import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'
import { AdCard, loadAdsFromStorage, deleteAdById, StoredAd } from './ads'

export default function Profile({
  profileTab,
  setProfileTab,
  userTag,
  editMode,
}: {
  profileTab: 'posts' | 'ads' | 'about' | 'friends'
  setProfileTab: (t: 'posts' | 'ads' | 'about' | 'friends') => void
  userTag?: string
  editMode?: boolean
}) {
  const [tagText, setTagText] = useState<string>(typeof userTag === 'string' ? userTag.replace(/^@/, '') : '')
  const [tagEditing, setTagEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [description, setDescription] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [political, setPolitical] = useState<string>('')
  const [hobbies, setHobbies] = useState<string>('')
  const [userAds, setUserAds] = useState<StoredAd[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!userId) {
        setUserAds([])
        return
      }
      const all = await loadAdsFromStorage()
      if (cancelled) return
      setUserAds(all.filter((a) => a.userId === userId).sort((a, b) => b.createdAt - a.createdAt))
    }
    load()
    const handler = () => {
      load()
    }
    window.addEventListener('ads-updated', handler as EventListener)
    return () => {
      cancelled = true
      window.removeEventListener('ads-updated', handler as EventListener)
    }
  }, [userId])

  useEffect(() => {
    const authRaw = window.localStorage.getItem('hw-auth')
    const auth = authRaw ? (JSON.parse(authRaw) as { tag?: string; uid?: string; email?: string }) : null
    const idLocal = auth?.uid ?? null
    setUserId(idLocal)
    const profRaw = window.localStorage.getItem('hw-profiles')
    const profMap = profRaw
      ? (JSON.parse(profRaw) as Record<
          string,
          { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }
        >)
      : {}
    const p = idLocal ? profMap[idLocal] : undefined
    const tagLocal = p?.tag ?? (typeof userTag === 'string' ? userTag.replace(/^@/, '') : '')
    if (tagLocal) setTagText(tagLocal)
    if (p?.avatar_url) setAvatarUrl(p.avatar_url)
    if (p?.description) setDescription(p.description)
    if (p?.age) setAge(p.age)
    if (p?.gender) setGender(p.gender)
    if (p?.city) setCity(p.city ?? '')
    if (p?.political) setPolitical(p.political)
    if (p?.hobbies) setHobbies(p.hobbies)
    const client = getSupabase()
    if (!client || !idLocal) return
    ;(async () => {
      try {
        const { data: prof, error: err } = await client
          .from('profiles')
          .select('tag, avatar_url, description, age, gender, city, political, hobbies')
          .eq('id', idLocal)
          .maybeSingle()
        if (err || !prof) {
          return
        }
        const tagFromDb = (prof.tag as string | undefined) ?? undefined
        const avatarFromDb = (prof.avatar_url as string | undefined) ?? undefined
        const descFromDb = (prof.description as string | undefined) ?? ''
        const ageFromDb = (prof.age as string | number | undefined) ?? undefined
        const genderFromDb = (prof.gender as string | undefined) ?? undefined
        const politicalFromDb = (prof.political as string | undefined) ?? undefined
        const hobbiesFromDb = (prof.hobbies as string | undefined) ?? undefined
        if (typeof tagFromDb === 'string' && tagFromDb.trim().length > 0) {
          setTagText(tagFromDb.trim())
        } else if (typeof userTag === 'string' && userTag.trim().length > 0) {
          setTagText(userTag.replace(/^@/, '').trim())
        }
        if (typeof avatarFromDb === 'string' && avatarFromDb.trim().length > 0) {
          setAvatarUrl(avatarFromDb)
        }
        setDescription(descFromDb ?? '')
        if (typeof ageFromDb === 'number') setAge(String(ageFromDb))
        else if (typeof ageFromDb === 'string') setAge(ageFromDb)
        setGender(typeof genderFromDb === 'string' ? genderFromDb : '')
        setCity(typeof (prof.city as string | undefined) === 'string' ? (prof.city as string) : '')
        setPolitical(typeof politicalFromDb === 'string' ? politicalFromDb : '')
        setHobbies(typeof hobbiesFromDb === 'string' ? hobbiesFromDb : '')
      } catch {
      }
    })()
  }, [userTag])
  useEffect(() => {
    const handleUpdated = (e: Event) => {
      const ev = e as CustomEvent<{ tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>
      if (typeof ev.detail?.tag === 'string') setTagText(ev.detail.tag)
      if (typeof ev.detail?.avatar_url === 'string') setAvatarUrl(ev.detail.avatar_url)
      if (typeof ev.detail?.description === 'string') setDescription(ev.detail.description)
      if (typeof ev.detail?.age === 'string') setAge(ev.detail.age)
      if (typeof ev.detail?.gender === 'string') setGender(ev.detail.gender)
      if (typeof ev.detail?.city === 'string') setCity(ev.detail.city)
      if (typeof ev.detail?.political === 'string') setPolitical(ev.detail.political)
      if (typeof ev.detail?.hobbies === 'string') setHobbies(ev.detail.hobbies)
    }
    window.addEventListener('profile-updated', handleUpdated as EventListener)
    return () => window.removeEventListener('profile-updated', handleUpdated as EventListener)
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
          const { error } = await client.from('profiles').upsert({ id: userId, tag: tagText, avatar_url: finalUrl })
          if (error) {
            const profRaw = window.localStorage.getItem('hw-profiles')
            const profMap = profRaw
              ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
              : {}
            const prev = profMap[userId] ?? {}
            profMap[userId] = { ...prev, avatar_url: finalUrl ?? undefined }
            window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
          }
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
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
          : {}
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

  const saveTag = async (next: string) => {
    setTagText(next)
    const client = getSupabase()
    if (!userId) return
    if (client) {
      const { error } = await client.from('profiles').upsert({ id: userId, tag: next })
      if (error) {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
          : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = { ...prev, tag: next }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
        : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = { ...prev, tag: next }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
  }

  const upsertProfile = async (patch: Partial<{ description: string; age: string; gender: string; city: string; political: string; hobbies: string }>) => {
    const client = getSupabase()
    if (!userId) return
    const payload: Record<string, unknown> = { id: userId, ...patch }
    if (client) {
      const { error } = await client.from('profiles').upsert(payload)
      if (error) {
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
          : {}
        const prev = profMap[userId] ?? {}
        profMap[userId] = {
          ...prev,
          description: (payload.description as string | undefined) ?? prev.description,
          age: (payload.age as string | undefined) ?? prev.age,
          gender: (payload.gender as string | undefined) ?? prev.gender,
          city: (payload.city as string | undefined) ?? prev.city,
          political: (payload.political as string | undefined) ?? prev.political,
          hobbies: (payload.hobbies as string | undefined) ?? prev.hobbies,
        }
        window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      }
    } else {
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string; description?: string; age?: string; gender?: string; city?: string; political?: string; hobbies?: string }>)
        : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = {
        ...prev,
        description: (payload.description as string | undefined) ?? prev.description,
        age: (payload.age as string | undefined) ?? prev.age,
        gender: (payload.gender as string | undefined) ?? prev.gender,
        city: (payload.city as string | undefined) ?? prev.city,
        political: (payload.political as string | undefined) ?? prev.political,
        hobbies: (payload.hobbies as string | undefined) ?? prev.hobbies,
      }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
    }
  }
  const saveDescription = async (next: string) => {
    setDescription(next)
    await upsertProfile({ description: next })
    const event = new CustomEvent('profile-updated', { detail: { description: next } })
    window.dispatchEvent(event)
  }
  const saveAge = async (next: string) => {
    setAge(next)
    await upsertProfile({ age: next })
  }
  const saveGender = async (next: string) => {
    setGender(next)
    await upsertProfile({ gender: next })
  }
  const saveCity = async (next: string) => {
    setCity(next)
    await upsertProfile({ city: next })
  }
  const savePolitical = async (next: string) => {
    setPolitical(next)
    await upsertProfile({ political: next })
  }
  const saveHobbies = async (next: string) => {
    setHobbies(next)
    await upsertProfile({ hobbies: next })
  }

  return (
    <>
      <div
        className="absolute left-0 w-full"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)', height: 'var(--profile-cover-height)' }}
      >
        <div className="h-full w-full" style={{ background: '#0A0A0A' }} />
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
        style={{
          width: 'var(--profile-avatar-size)',
          height: 'var(--profile-avatar-size)',
          top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2))',
          boxShadow: `0 0 var(--profile-avatar-glow-size) var(--profile-avatar-glow-color), 0 4px 18px rgba(0,0,0,0.35)`,
          background: avatarUrl ? '#0A0A0A' : gradient,
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white font-vk-demi text-[36px]">
            {initialLetter}
          </div>
        )}
        {editMode && (
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute left-0 top-0 h-full w-full flex items-center justify-center bg-black/20"
            aria-label="Сменить аватар"
          >
            <img
              src="/interface/image-add.svg"
              alt="add"
              className="h-[40px] w-[40px]"
              style={{
                filter:
                  'brightness(0) saturate(100%) invert(84%) sepia(68%) saturate(569%) hue-rotate(360deg) brightness(101%) contrast(101%)',
                opacity: 0.9,
              }}
            />
          </button>
        )}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatarFile(e.target.files)}
        />
      </div>
      <div
        className="absolute left-0 w-full px-6 overflow-y-auto pb-8"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) + calc(var(--profile-avatar-size) / 2) + 12px)',
          height: 'calc(812px - 88px - 56px - var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) - var(--home-header-offset) - 12px)',
        }}
      >
        <div className="flex w-full flex-col items-center">
          {!tagEditing ? (
            <div className="leading-[2.3em] text-white font-ttc-bold flex items-center gap-2" style={{ fontSize: 'var(--profile-name-size)', marginTop: 'var(--profile-name-margin-top)' }}>
              <span>{tagText && tagText.trim().length > 0 ? tagText : 'user'}</span>
              {editMode && (
                <button
                  type="button"
                  className="opacity-80"
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
              )}
              {editMode && (
                <button
                  type="button"
                  className="opacity-80"
                  onClick={async () => {
                    if (!userId) {
                      setAvatarUrl(null)
                      const ev = new CustomEvent('profile-updated', { detail: { avatar_url: null } })
                      window.dispatchEvent(ev)
                      return
                    }
                    const client = getSupabase()
                    if (client) {
                      await client.from('profiles').upsert({ id: userId, avatar_url: null })
                    }
                    const profRaw = window.localStorage.getItem('hw-profiles')
                    const profMap = profRaw ? (JSON.parse(profRaw) as Record<string, { tag?: string; avatar_url?: string }>) : {}
                    const prev = profMap[userId] ?? {}
                    const next = { ...prev }
                    delete next.avatar_url
                    profMap[userId] = next
                    window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
                    setAvatarUrl(null)
                    const ev = new CustomEvent('profile-updated', { detail: { avatar_url: null } })
                    window.dispatchEvent(ev)
                  }}
                  aria-label="Удалить фото"
                >
                  <img
                    src="/interface/trash-03.svg"
                    alt="trash"
                    className="h-[18px] w-[18px]"
                    style={{ filter: 'invert(1) brightness(0.7)' }}
                  />
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center" style={{ marginTop: 'var(--profile-name-margin-top)' }}>
              <input
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                onBlur={() => {
                  setTagEditing(false)
                  const next = tagText.trim()
                  if (next.length > 0) saveTag(next)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTagEditing(false)
                    const next = tagText.trim()
                    if (next.length > 0) saveTag(next)
                  }
                }}
                className="h-[40px] w-[220px] rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-3 text-[16px] leading-[1.4em] text-white outline-none"
              />
            </div>
          )}
          <div className="flex w-full items-center justify-center" style={{ marginTop: 'var(--profile-switch-offset)' }}>
            <div className="flex h-[45px] items-center justify-between rounded-[12px] border border-[#2B2B2B] bg-[#111111] px-2">
              <button
                type="button"
                onClick={() => setProfileTab('posts')}
                className={`h-[32px] rounded-[8px] px-3 text-[14px] ${profileTab === 'posts' ? 'bg-[#222222] text-white' : 'text-white/70'}`}
              >
                Посты
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('ads')}
                className={`h-[32px] rounded-[8px] px-3 text-[14px] ${profileTab === 'ads' ? 'bg-[#222222] text-white' : 'text-white/70'}`}
              >
                Объявления
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('about')}
                className={`h-[32px] rounded-[8px] px-3 text-[14px] ${profileTab === 'about' ? 'bg-[#222222] text-white' : 'text-white/70'}`}
              >
                О себе
              </button>
              <button
                type="button"
                aria-disabled="true"
                className="h-[32px] rounded-[8px] px-3 text-[14px] text-white/40 cursor-not-allowed"
              >
                Скоро
              </button>
            </div>
          </div>
          <div key={profileTab} className="mt-12 relative w-full h-full profile-switch-transition">
            {profileTab === 'posts' ? (
              <>
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
                  У вас ещё нет публикаций
                </div>
                <button
                  type="button"
                  className="text-center rounded-[10px] bg-[#111111]"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: 'var(--profile-empty-button-bottom)',
                    width: 'var(--profile-empty-button-width)',
                    height: 'var(--profile-empty-button-height)',
                    borderRadius: 'var(--profile-empty-button-radius)',
                    background: 'var(--profile-empty-button-bg)',
                  }}
                >
                  <span
                    className="inline-block font-vk-demi"
                    style={{
                      fontSize: 'var(--profile-empty-button-text-size)',
                      color: 'var(--profile-empty-button-text-color)',
                      lineHeight: '1.25em',
                      letterSpacing: '0.015em',
                    }}
                  >
                    Добавить
                  </span>
                </button>
              </>
            ) : profileTab === 'ads' ? (
              <div className="w-full">
                {userAds.length > 0 ? (
                  <div
                    className="grid grid-cols-2 pb-8"
                    style={{
                      columnGap: 6,
                      rowGap: 6,
                      marginLeft: -12,
                      marginRight: -12,
                    }}
                  >
                  {userAds.map((ad) => (
                    <AdCard
                      key={ad.id}
                      id={ad.id}
                      title={ad.title}
                      price={ad.price}
                      imageUrl={ad.imageUrl}
                      username={(ad.userTag ?? 'user').replace(/^@/, '')}
                      condition={ad.condition ?? undefined}
                      location={ad.location ?? undefined}
                      onDelete={() => deleteAdById(ad.id)}
                      isOwn
                    />
                  ))}
                  </div>
                ) : (
                  <>
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
                      У вас ещё нет объявлений
                    </div>
                    <button
                      type="button"
                      className="text-center rounded-[10px] bg-[#111111]"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: 'var(--profile-empty-button-bottom)',
                        width: 'var(--profile-empty-button-width)',
                        height: 'var(--profile-empty-button-height)',
                        borderRadius: 'var(--profile-empty-button-radius)',
                        background: 'var(--profile-empty-button-bg)',
                      }}
                    >
                      <span
                        className="inline-block font-vk-demi"
                        style={{
                          fontSize: 'var(--profile-empty-button-text-size)',
                          color: 'var(--profile-empty-button-text-color)',
                          lineHeight: '1.25em',
                          letterSpacing: '0.015em',
                        }}
                      >
                        Добавить
                      </span>
                    </button>
                  </>
                )}
              </div>
            ) : profileTab === 'about' ? (
                <>
                <div style={{ marginLeft: '-24px', marginRight: '-24px' }}>
                  <div className="mx-auto rounded-[12px] border border-[#2B2B2B] bg-[#111111]/80 p-4" style={{ width: '92%' }}>
                    <div style={{ fontSize: 'var(--profile-public-title-size)' }} className="leading-[1.7em] text-white font-ttc-bold mb-2">Описание профиля</div>
                    {editMode ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => saveDescription(description.trim())}
                        className="w-full min-h-[80px] rounded-[10px] border border-[#2B2B2B] bg-[#111111]/80 px-3 py-2 leading-[1.6em] text-white outline-none"
                        style={{ fontSize: 'var(--profile-public-text-size)' }}
                      />
                    ) : (
                      <div className="leading-[1.7em] text-[#A1A1A1]" style={{ fontSize: 'var(--profile-public-text-size)' }}>
                        {description && description.trim().length > 0 ? description : 'Описание не заполнено'}
                      </div>
                    )}
                  </div>
                  <div className="mx-auto mt-3 rounded-[12px] border border-[#2B2B2B] bg-[#111111]/80 p-4" style={{ width: '92%' }}>
                    <div style={{ fontSize: 'var(--profile-public-title-size)' }} className="leading-[1.7em] text-white font-ttc-bold mb-2">О себе</div>
                    <div className="space-y-3">
                      <div>
                        <div className="leading-[1.7em] text-white/80" style={{ fontSize: 'var(--profile-public-text-size)' }}>Возраст</div>
                        {editMode ? (
                          <input
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            onBlur={() => saveAge(age.trim())}
                            className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111]/80 px-3 leading-[1.4em] text-white outline-none"
                            style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                          />
                        ) : (
                          <div className="leading-[1.7em] text-[#A1A1A1]" style={{ fontSize: 'var(--profile-public-text-size)' }}>{age && age.trim().length > 0 ? age : 'Не указан'}</div>
                        )}
                      </div>
                      <div>
                        <div className="leading-[1.7em] text-white/80" style={{ fontSize: 'var(--profile-public-text-size)' }}>Место жительства</div>
                        {editMode ? (
                          <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            onBlur={() => saveCity(city.trim())}
                            className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111]/80 px-3 leading-[1.4em] text-white outline-none"
                            style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                          />
                        ) : (
                          <div className="leading-[1.7em] text-[#A1A1A1]" style={{ fontSize: 'var(--profile-public-text-size)' }}>{city && city.trim().length > 0 ? city : 'Не указано'}</div>
                        )}
                      </div>
                      <div>
                        <div className="leading-[1.7em] text-white/80" style={{ fontSize: 'var(--profile-public-text-size)' }}>Пол</div>
                        {editMode ? (
                          <input
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            onBlur={() => saveGender(gender.trim())}
                            className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111]/80 px-3 leading-[1.4em] text-white outline-none"
                            style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                          />
                        ) : (
                          <div className="leading-[1.7em] text-[#A1A1A1]" style={{ fontSize: 'var(--profile-public-text-size)' }}>{gender && gender.trim().length > 0 ? gender : 'Не указан'}</div>
                        )}
                      </div>
                      <div>
                        <div className="leading-[1.7em] text-white/80" style={{ fontSize: 'var(--profile-public-text-size)' }}>Политические взгляды</div>
                        {editMode ? (
                          <input
                            value={political}
                            onChange={(e) => setPolitical(e.target.value)}
                            onBlur={() => savePolitical(political.trim())}
                            className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111]/80 px-3 leading-[1.4em] text-white outline-none"
                            style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                          />
                        ) : (
                          <div className="leading-[1.7em] text-[#A1A1A1]" style={{ fontSize: 'var(--profile-public-text-size)' }}>{political && political.trim().length > 0 ? political : 'Не указано'}</div>
                        )}
                      </div>
                      <div>
                        <div className="leading-[1.7em] text-white/80" style={{ fontSize: 'var(--profile-public-text-size)' }}>Увлечения</div>
                        {editMode ? (
                          <input
                            value={hobbies}
                            onChange={(e) => setHobbies(e.target.value)}
                            onBlur={() => saveHobbies(hobbies.trim())}
                            className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111]/80 px-3 leading-[1.4em] text-white outline-none"
                            style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                          />
                        ) : (
                          <div className="leading-[1.7em] text-[#A1A1A1]" style={{ fontSize: 'var(--profile-public-text-size)' }}>{hobbies && hobbies.trim().length > 0 ? hobbies : 'Не указано'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mx-auto mt-3" style={{ width: '100%' }}>
                    <div className="h-[24px] bg-[#0A0A0A]" />
                  </div>
                </div>
              </>
            ) : (
              null
            )}
          </div>
        </div>
      </div>

      
    </>
  )
}
