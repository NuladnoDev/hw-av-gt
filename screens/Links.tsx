'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { getSupabase } from '@/lib/supabaseClient'

type ContactType = 'vk' | 'telegram'

type Contact = {
  type: ContactType
  url: string
}

type LinksProps = {
  onClose?: () => void
}

const detectContactType = (value: string): ContactType | null => {
  const v = value.trim().toLowerCase()
  if (!v) return null
  if (v.includes('vk.com') || v.includes('vkontakte')) return 'vk'
  if (v.includes('t.me') || v.includes('telegram.me') || v.includes('telegram.org')) return 'telegram'
  return null
}

const normalizeContacts = (items: unknown): Contact[] => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const anyItem = item as { type?: string; url?: unknown }
      const type = anyItem.type === 'vk' || anyItem.type === 'telegram' ? anyItem.type : null
      const url = typeof anyItem.url === 'string' ? anyItem.url.trim() : ''
      if (!type || !url) return null
      return { type, url }
    })
    .filter((x): x is Contact => !!x)
}

const getShortUrl = (url: string): string => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  if (withoutProtocol.length <= 32) return withoutProtocol
  return `${withoutProtocol.slice(0, 20)}…${withoutProtocol.slice(-7)}`
}

export default function Links({ onClose }: LinksProps) {
  const [scale, setScale] = useState(1)
  const [linkInput, setLinkInput] = useState('')
  const [contactType, setContactType] = useState<ContactType | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [errorText, setErrorText] = useState('')
  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const [dragOffsetX, setDragOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

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
    if (typeof window === 'undefined') return
    let cancelled = false
    const load = async () => {
      try {
        const authRaw = window.localStorage.getItem('hw-auth')
        const auth = authRaw ? (JSON.parse(authRaw) as { uid?: string | null }) : null
        const userId = auth?.uid ?? null
        if (!userId) return
        const profRaw = window.localStorage.getItem('hw-profiles')
        const profMap = profRaw
          ? (JSON.parse(profRaw) as Record<string, { contacts?: Contact[] }>)
          : {}
        const localContacts = normalizeContacts(profMap[userId]?.contacts)
        if (!cancelled && localContacts.length > 0) {
          setContacts(localContacts)
        }
        const client = getSupabase()
        if (!client) return
        const { data: prof, error } = await client
          .from('profiles')
          .select('contacts')
          .eq('id', userId)
          .maybeSingle()
        if (cancelled || error || !prof) return
        const fromDb = normalizeContacts((prof as { contacts?: unknown }).contacts)
        if (fromDb.length > 0) {
          setContacts(fromDb)
        }
      } catch {
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const saveContacts = async (next: Contact[]) => {
    if (typeof window === 'undefined') return
    try {
      const authRaw = window.localStorage.getItem('hw-auth')
      const auth = authRaw ? (JSON.parse(authRaw) as { uid?: string | null }) : null
      const userId = auth?.uid ?? null
      if (!userId) return
      const profRaw = window.localStorage.getItem('hw-profiles')
      const profMap = profRaw
        ? (JSON.parse(profRaw) as Record<string, { contacts?: Contact[] }>)
        : {}
      const prev = profMap[userId] ?? {}
      profMap[userId] = { ...prev, contacts: next }
      window.localStorage.setItem('hw-profiles', JSON.stringify(profMap))
      const client = getSupabase()
      if (client) {
        await client
          .from('profiles')
          .upsert({ id: userId, contacts: next })
      }
      const event = new CustomEvent('profile-updated', {
        detail: { contacts: next },
      })
      window.dispatchEvent(event)
    } catch {}
  }

  const handleInputChange = (value: string) => {
    setLinkInput(value)
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      setContactType(null)
      setErrorText('')
      return
    }
    const detected = detectContactType(trimmed)
    if (!detected) {
      setContactType(null)
      setErrorText('Неверная ссылка')
      return
    }
    const duplicate = contacts.some((c) => c.type === detected)
    if (duplicate) {
      setContactType(detected)
      setErrorText('Этот способ связи уже добавлен')
    } else {
      setContactType(detected)
      setErrorText('')
    }
  }

  const canAdd =
    linkInput.trim().length > 0 &&
    contactType !== null &&
    !errorText &&
    !contacts.some((c) => c.type === contactType)

  const addContact = () => {
    if (!canAdd || !contactType) return
    const url = linkInput.trim()
    const nextContacts = [...contacts, { type: contactType, url }]
    setContacts(nextContacts)
    void saveContacts(nextContacts)
    setLinkInput('')
    setContactType(null)
    setErrorText('')
  }

  const handleDeleteContact = (contact: Contact) => {
    const key = `${contact.type}-${contact.url}`
    const next = contacts.filter((c) => `${c.type}-${c.url}` !== key)
    setContacts(next)
    void saveContacts(next)
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else if (typeof window !== 'undefined') {
      const ev = new Event('close-links')
      window.dispatchEvent(ev)
    }
  }

  const currentIconSrc =
    contactType === 'vk'
      ? '/interface/vk.svg'
      : contactType === 'telegram'
        ? '/interface/telegram.svg'
        : null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden edit-screen-in"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
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
              Способы связи
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
                  Введите ссылку
                </label>
                <div className="relative">
                  <input
                    value={linkInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addContact()
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-28 py-3 text-white font-sf-ui-light focus:outline-none focus:border-white/30 transition-all"
                    placeholder="https://vk.com/username или https://t.me/username"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center gap-2" style={{ zIndex: 1 }}>
                    {currentIconSrc && (
                      <div className="flex items-center justify-center rounded-full bg-white/10 w-7 h-7">
                        <img
                          src={currentIconSrc}
                          alt={contactType === 'vk' ? 'ВКонтакте' : 'Telegram'}
                          className="w-4 h-4"
                        />
                      </div>
                    )}
                    <AnimatePresence>
                      {canAdd && (
                        <motion.button
                          type="button"
                          onClick={addContact}
                          className="rounded-full bg-white px-3 py-1 text-[11px] font-sf-ui-medium text-black shadow-sm"
                          initial={{ opacity: 0, scale: 0.8, x: 6 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: 6 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                          Добавить
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {errorText && (
                  <p className="mt-1 text-xs text-white/40">
                    {errorText}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2 font-sf-ui-light">
                  Ваши способы связи
                </label>
                {contacts.length === 0 ? (
                  <div className="text-sm text-white/40 font-sf-ui-light">
                    Пока ничего не добавлено
                  </div>
                ) : (
                  <>
                    <motion.div layout className="flex flex-col gap-2">
                      <AnimatePresence mode="popLayout">
                        {contacts.map((contact) => {
                          const key = `${contact.type}-${contact.url}`
                          const isDragging = draggingKey === key
                          const offset = isDragging ? dragOffsetX : 0
                          const clamped = Math.max(-120, Math.min(0, offset))
                          const intensity = Math.min(1, Math.abs(clamped) / 120)
                          const bg = `rgba(220,38,38,${0.2 + intensity * 0.4})`
                          return (
                            <motion.div
                              key={key}
                              layout
                              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                              exit={{ opacity: 0, height: 0, marginBottom: -8 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="relative"
                            >
                              <div
                                className="absolute inset-0 rounded-xl"
                                style={{
                                  background: clamped < 0 ? bg : '#151515',
                                }}
                              />
                              <motion.div
                                className="relative flex items-center justify-between rounded-xl px-4 py-3 bg-[#151515]"
                                style={{
                                  x: clamped,
                                  touchAction: 'pan-y',
                                }}
                                drag="x"
                                dragConstraints={{ left: -120, right: 0 }}
                                dragElastic={0.2}
                                onDragStart={() => {
                                  setDraggingKey(key)
                                  setDragOffsetX(0)
                                  setIsDragging(true)
                                }}
                                onDrag={(event, info) => {
                                  if (draggingKey !== key) return
                                  setDragOffsetX(info.offset.x)
                                }}
                                onDragEnd={(event, info) => {
                                  const finalOffset = info.offset.x
                                  if (finalOffset <= -70) {
                                    handleDeleteContact(contact)
                                  }
                                  setDraggingKey(null)
                                  setDragOffsetX(0)
                                  setIsDragging(false)
                                }}
                                onClick={() => {
                                  if (!isDragging) {
                                    window.open(contact.url, '_blank', 'noopener noreferrer')
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="flex items-center justify-center overflow-hidden"
                                    style={{
                                      width: 'var(--profile-contact-avatar-size, 32px)',
                                      height: 'var(--profile-contact-avatar-size, 32px)',
                                    }}
                                  >
                                    <img
                                      src={contact.type === 'vk' ? '/interface/vk.svg' : '/interface/telegram.svg'}
                                      alt={contact.type === 'vk' ? 'ВКонтакте' : 'Telegram'}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span
                                      className="text-white font-sf-ui-light"
                                      style={{ fontSize: 'var(--profile-contact-label-size, 15px)' }}
                                    >
                                      {contact.type === 'vk' ? 'ВКонтакте' : 'Telegram'}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-white/60 text-xs max-w-[160px] text-right truncate">
                                  {getShortUrl(contact.url)}
                                </span>
                              </motion.div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </motion.div>
                    <p className="mt-2 text-[11px] text-white/35 font-sf-ui-light">
                      Свайпните влево, что бы удалить конкретный способ связи
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ bottom: 0, height: 'env(safe-area-inset-bottom, 0px)' }}
        />
      </div>
    </motion.div>
  )
}
