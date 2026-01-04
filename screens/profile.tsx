'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { getSupabase } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'
import { AdCard, loadAdsFromStorage, deleteAdById, StoredAd } from './ads'
import AdsEdit from './Ads_Edit'

export default function Profile({
  profileTab,
  setProfileTab,
  userTag,
  editMode,
}: {
  profileTab: 'ads' | 'about' | 'friends'
  setProfileTab: (t: 'ads' | 'about' | 'friends') => void
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
  const [editingAd, setEditingAd] = useState<StoredAd | null>(null)

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
    <div
      style={
        {
          '--profile-max-width': '380px',
          '--profile-switch-negative-margin': '12px',
          '--profile-about-negative-margin': '12px',
          '--profile-switch-height': '52px',
          '--profile-switch-padding': '4px',
          '--profile-switch-offset': '10px',
          '--profile-section-margin-top': '24px',
          '--profile-name-size': '28px',
          '--profile-name-margin-top': '6px',
          '--profile-avatar-size': '110px',
          '--profile-cover-height': '90px',
          '--profile-avatar-top-offset': '0px',
        } as React.CSSProperties
      }
    >
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
          top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) + var(--profile-avatar-top-offset, 0px))',
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
          top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + var(--profile-cover-height) + calc(var(--profile-avatar-size) / 2) + 12px + var(--profile-avatar-top-offset, 0px))',
          height: 'calc(812px - 88px - 56px - var(--profile-cover-height) - calc(var(--profile-avatar-size) / 2) - var(--home-header-offset) - 12px - var(--profile-avatar-top-offset, 0px))',
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
          <div 
            className="flex w-full items-center justify-center" 
            style={{ 
              marginTop: 'var(--profile-switch-offset)',
              marginLeft: 'calc(-1 * var(--profile-switch-negative-margin, 12px))',
              marginRight: 'calc(-1 * var(--profile-switch-negative-margin, 12px))',
              width: 'calc(100% + (2 * var(--profile-switch-negative-margin, 12px)))'
            }}
          >
            <div
              className="relative flex w-full items-center gap-1 rounded-[16px] border border-[#2B2B2B] bg-[#111111]"
              style={{
                height: 'var(--profile-switch-height, 52px)',
                padding: 'var(--profile-switch-padding, 4px)',
                maxWidth: 'var(--profile-max-width, 380px)',
              }}
            >
              <button
                type="button"
                onClick={() => setProfileTab('ads')}
                className="relative flex-1 h-full rounded-[12px] px-3 text-[14px] overflow-hidden"
              >
                {profileTab === 'ads' && (
                  <motion.div
                    layoutId="profile-tabs-active"
                    className="absolute inset-0 rounded-[12px] bg-[#222222]"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8,
                    }}
                  />
                )}
                <span className={`relative z-10 ${profileTab === 'ads' ? 'text-white' : 'text-white/70'}`}>Объявления</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('about')}
                className="relative flex-1 h-full rounded-[12px] px-3 text-[14px] overflow-hidden"
              >
                {profileTab === 'about' && (
                  <motion.div
                    layoutId="profile-tabs-active"
                    className="absolute inset-0 rounded-[12px] bg-[#222222]"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8,
                    }}
                  />
                )}
                <span className={`relative z-10 ${profileTab === 'about' ? 'text-white' : 'text-white/70'}`}>О себе</span>
              </button>
              <button
                type="button"
                aria-disabled="true"
                className="flex-1 h-full rounded-[12px] px-3 text-[14px] text-white/40 cursor-not-allowed"
              >
                Скоро
              </button>
            </div>
          </div>
          <motion.div
            key={profileTab}
            className="relative w-full h-full profile-switch-transition"
            style={{ marginTop: 'var(--profile-section-margin-top, 24px)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {profileTab === 'ads' ? (
              <div className="w-full">
                {userAds.length > 0 ? (
                  <div
                    className="grid grid-cols-2 pb-4"
                    style={{
                      columnGap: 6,
                      rowGap: 6,
                      paddingLeft: 4,
                      paddingRight: 4,
                      marginLeft: -24,
                      marginRight: -24,
                      width: 'calc(100% + 48px)',
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
                      onEdit={() => setEditingAd(ad)}
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
              <div
                className="mx-auto w-full rounded-[16px] border border-[#2B2B2B] bg-[#111111]/80 p-4"
                style={{ 
                  maxWidth: 'var(--profile-max-width, 380px)',
                  marginLeft: 'calc(-1 * var(--profile-about-negative-margin, 12px))',
                  marginRight: 'calc(-1 * var(--profile-about-negative-margin, 12px))',
                  width: 'calc(100% + (2 * var(--profile-about-negative-margin, 12px)))'
                }}
              >
                <div className="space-y-4">
                  <div>
                    <div
                      className="mb-2 font-ttc-bold text-white"
                      style={{ fontSize: 'var(--profile-public-title-size)' }}
                    >
                      Описание профиля
                    </div>
                    {editMode ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => saveDescription(description.trim())}
                        className="w-full min-h-[80px] rounded-[12px] border border-[#2B2B2B] bg-[#111111] px-3 py-2 leading-[1.6em] text-white outline-none"
                        style={{ fontSize: 'var(--profile-public-text-size)' }}
                      />
                    ) : (
                      <div
                        className="rounded-[12px] bg-[#0D0D0D] px-3 py-2 leading-[1.6em] text-[#A1A1A1]"
                        style={{ fontSize: 'var(--profile-public-text-size)' }}
                      >
                        {description && description.trim().length > 0 ? description : 'Описание не заполнено'}
                      </div>
                    )}
                  </div>
                  <motion.div
                    className="rounded-[14px] bg-[#101010] px-3 py-3"
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <div
                      className="mb-2 font-ttc-bold text-white"
                      style={{ fontSize: 'var(--profile-public-title-size)' }}
                    >
                      О себе
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Возраст
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              onBlur={() => saveAge(age.trim())}
                              className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                            />
                          ) : (
                            <div
                              className="rounded-[10px] bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ fontSize: 'var(--profile-public-text-size)' }}
                            >
                              {age && age.trim().length > 0 ? age : 'Не указан'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Город
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              onBlur={() => saveCity(city.trim())}
                              className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                            />
                          ) : (
                            <div
                              className="rounded-[10px] bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ fontSize: 'var(--profile-public-text-size)' }}
                            >
                              {city && city.trim().length > 0 ? city : 'Не указано'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Пол
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={gender}
                              onChange={(e) => setGender(e.target.value)}
                              onBlur={() => saveGender(gender.trim())}
                              className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                            />
                          ) : (
                            <div
                              className="rounded-[10px] bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ fontSize: 'var(--profile-public-text-size)' }}
                            >
                              {gender && gender.trim().length > 0 ? gender : 'Не указан'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Взгляды
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={political}
                              onChange={(e) => setPolitical(e.target.value)}
                              onBlur={() => savePolitical(political.trim())}
                              className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                            />
                          ) : (
                            <div
                              className="rounded-[10px] bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ fontSize: 'var(--profile-public-text-size)' }}
                            >
                              {political && political.trim().length > 0 ? political : 'Не указано'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 text-white/60"
                          style={{ fontSize: 'var(--profile-public-text-size)' }}
                        >
                          Увлечения
                        </div>
                        <div className="flex-[2]">
                          {editMode ? (
                            <input
                              value={hobbies}
                              onChange={(e) => setHobbies(e.target.value)}
                              onBlur={() => saveHobbies(hobbies.trim())}
                              className="w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] px-3 leading-[1.4em] text-white outline-none"
                              style={{ height: 'var(--profile-public-input-height)', fontSize: 'var(--profile-public-text-size)' }}
                            />
                          ) : (
                            <div
                              className="rounded-[10px] bg-[#151515] px-3 py-1.5 text-right text-[#E5E5E5]"
                              style={{ fontSize: 'var(--profile-public-text-size)' }}
                            >
                              {hobbies && hobbies.trim().length > 0 ? hobbies : 'Не указано'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
        {editingAd && (
          <AdsEdit
            ad={editingAd}
            onClose={() => setEditingAd(null)}
          />
        )}
      </div>
    </div>
  )
}
