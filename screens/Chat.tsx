'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Image as ImageIcon, User, ShieldCheck, Clock, CheckCircle2, MessageCircle, ShoppingBag, ArrowUp, X } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import { AdCard, type StoredAd } from './ads'
import FormattedText from '@/components/FormattedText'

type Message = {
  id: string
  chat_id: string
  sender_id: string
  message: string
  image_url: string | null
  ad_context?: StoredAd | null
  created_at: string
  read_at?: string | null
}

type ChatSession = {
  id: string
  buyer_id: string
  seller_id: string
  store_id: string | null
  last_message?: string
  updated_at: string
  profiles?: {
    tag: string
    avatar_url: string | null
    is_verified?: boolean
  }
}

type ChatPreview = {
  id: string
  receiverId: string
  receiverName: string
  receiverAvatar: string | null
  adId: string | null
  adTitle: string | null
  isDirect: boolean
  updatedAt: string
  lastMessage: string
  lastMessageSenderId: string | null
  lastMessageReadAt: string | null
}

export default function Chat({ 
  onClose, 
  receiverId, 
  receiverName, 
  receiverAvatar,
  adContext,
  initialMessage = '',
  contacts: initialContacts = [],
  forceReceiverTitle = false
}: { 
  onClose: () => void 
  receiverId: string
  receiverName?: string
  receiverAvatar?: string | null
  adContext?: StoredAd | null
  initialMessage?: string
  contacts?: Array<{ type: 'vk' | 'telegram', url: string }>
  forceReceiverTitle?: boolean
}) {
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [showAdPreview, setShowAdPreview] = useState(!!adContext)
  const [contacts, setContacts] = useState(initialContacts)
  const [receiverLastSeen, setReceiverLastSeen] = useState<string | null>(null)
  const [isReceiverTyping, setIsReceiverTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [micPermissionDenied, setMicPermissionDenied] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const localMessageCounterRef = useRef(0)
  const presenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingChannelRef = useRef<any>(null)
  const [keyboardInset, setKeyboardInset] = useState(0)

  const AuthIllustration = () => (
    <div className="mb-6 flex justify-center w-full">
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="80" r="60" fill="url(#auth_chat_glow)" fillOpacity="0.2"/>
        <motion.g
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="60" y="40" width="80" height="100" rx="16" fill="#1C1C1E" stroke="white" strokeOpacity="0.1" strokeWidth="2"/>
          <motion.circle 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            cx="100" cy="85" r="20" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2" 
          />
          <path d="M125 110V108C125 106.343 126.343 105 128 105C129.657 105 131 106.343 131 108V110M123 110H133V115C133 116.105 132.105 117 131 117H125C123.895 117 123 116.105 123 115V110Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
        <defs>
          <radialGradient id="auth_chat_glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 80) rotate(90) scale(80)">
            <stop stopColor="#3B82F6"/>
            <stop offset="1" stopColor="#3B82F6" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
  )

  const RegistrationIllustration = () => (
    <div className="flex flex-col items-center -mt-12 -mb-6">
      <svg width="220" height="160" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background soft glow */}
        <circle cx="120" cy="90" r="80" fill="url(#paint0_radial_chat)" fillOpacity="0.15"/>
        
        {/* Floating Message Bubbles */}
        <motion.g
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Left Bubble (Slightly behind) */}
          <rect x="50" y="60" width="80" height="50" rx="18" fill="#1C1C1E" stroke="#3B82F6" strokeOpacity="0.3" strokeWidth="1.5" />
          <path d="M50 90L40 100L55 95" fill="#1C1C1E" />
          <rect x="65" y="75" width="40" height="4" rx="2" fill="white" fillOpacity="0.1" />
          <rect x="65" y="85" width="25" height="4" rx="2" fill="white" fillOpacity="0.05" />
        </motion.g>

        <motion.g
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          {/* Right Bubble (Main focus) */}
          <rect x="110" y="80" width="90" height="55" rx="20" fill="#3B82F6" />
          <path d="M200 115L215 125L200 120" fill="#3B82F6" />
          {/* Content lines in bubble */}
          <rect x="125" y="95" width="50" height="5" rx="2.5" fill="white" />
          <rect x="125" y="107" width="30" height="5" rx="2.5" fill="white" fillOpacity="0.6" />
          
          {/* Sparkles around main bubble */}
          <motion.circle 
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            cx="210" cy="80" r="3" fill="white" 
          />
          <motion.circle 
            animate={{ opacity: [0, 0.8, 0], scale: [0.3, 1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
            cx="100" cy="140" r="2" fill="white" 
          />
        </motion.g>

        <defs>
          <radialGradient id="paint0_radial_chat" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(120 90) rotate(90) scale(80)">
            <stop stopColor="#3B82F6"/>
            <stop offset="1" stopColor="#3B82F6" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
  )

  const quickResponses = [
    '\u0413\u0434\u0435 \u0443\u0434\u043e\u0431\u043d\u043e \u0432\u0441\u0442\u0440\u0435\u0442\u0438\u0442\u044c\u0441\u044f?',
    '\u0425\u043e\u0447\u0443 \u043f\u0440\u0438\u043e\u0431\u0440\u0435\u0441\u0442\u0438',
    '\u0411\u044b\u043b \u0432 \u0440\u0435\u043c\u043e\u043d\u0442\u0435?',
    '\u0410\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u043e?',
    '\u0422\u043e\u0440\u0433 \u0443\u043c\u0435\u0441\u0442\u0435\u043d?',
    '\u041c\u043e\u0436\u043d\u043e \u0434\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0444\u043e\u0442\u043e?',
  ]

  const scrollToBottom = (instant = false) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' })
    }, instant ? 0 : 100)
  }

  const formatLastSeen = (iso: string | null): string => {
    if (!iso) return ''
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 2) return 'в сети'
    const diffHours = Math.floor(diffMin / 60)
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()
    const timeStr = date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return `был(а) в ${timeStr}`
    if (isYesterday) return `был(а) вчера в ${timeStr}`
    const weekdays = ['воскресенье','понедельник','вторник','среду','четверг','пятницу','субботу']
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays < 7) return `был(а) в ${weekdays[date.getDay()]} в ${timeStr}`
    return `был(а) ${date.toLocaleDateString('ru', { day: 'numeric', month: 'long' })} в ${timeStr}`
  }

  const isOnline = (iso: string | null): boolean => {
    if (!iso) return false
    return (new Date().getTime() - new Date(iso).getTime()) < 120000 // 2 минуты
  }

  const getDayKey = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'invalid'
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }

  const getDateDividerLabel = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (dateKey === todayKey) return '\u0421\u0435\u0433\u043e\u0434\u043d\u044f'
    if (dateKey === yesterdayKey) return '\u0412\u0447\u0435\u0440\u0430'
    return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const keyboardGapCompensation = isIOS ? 34 : 0
  const keyboardTranslate = keyboardInset > 0 ? Math.max(0, keyboardInset - keyboardGapCompensation) : 0
  const chatScope = 'direct'
  const resolvedReceiverName = receiverName && receiverName.trim().length > 0 ? receiverName.trim() : 'Пользователь'
  const resolvedTitle = forceReceiverTitle ? resolvedReceiverName : (adContext?.title || resolvedReceiverName)

  const persistChatState = (ownerId: string, nextMessages: Message[]) => {
    const threadStorageKey = `hw-chat-thread:${ownerId}:${receiverId}:${chatScope}`
    const previewsStorageKey = `hw-chat-previews:${ownerId}`
    try {
      localStorage.setItem(threadStorageKey, JSON.stringify(nextMessages))
      const last = nextMessages[nextMessages.length - 1]
      const lastMessage = last
        ? (last.message.trim().length > 0
            ? last.message.trim()
            : last.image_url
              ? 'Фото'
              : last.ad_context?.title || 'Сообщение')
        : ''
      const raw = localStorage.getItem(previewsStorageKey)
      const prev = raw ? (JSON.parse(raw) as ChatPreview[]) : []
      const safePrev = Array.isArray(prev) ? prev : []
      const id = `${receiverId}:${chatScope}`
      const nextItem: ChatPreview = {
        id,
        receiverId,
        receiverName: resolvedReceiverName,
        receiverAvatar: receiverAvatar ?? null,
        adId: adContext?.id ?? null,
        adTitle: adContext?.title ?? null,
        isDirect: !adContext?.id,
        updatedAt: last?.created_at ?? new Date().toISOString(),
        lastMessage,
        lastMessageSenderId: last?.sender_id ?? null,
        lastMessageReadAt: last?.read_at ?? null,
      }
      const merged = [nextItem, ...safePrev.filter((item) => item?.id !== id)].slice(0, 100)
      localStorage.setItem(previewsStorageKey, JSON.stringify(merged))
      window.dispatchEvent(new CustomEvent('chat-previews-updated'))
    } catch {
    }
  }

  useEffect(() => {
    // Р‘Р»РѕРєРёСЂРѕРІРєР° СЃРєСЂРѕР»Р»Р° body РїСЂРё РѕС‚РєСЂС‹С‚РѕРј С‡Р°С‚Рµ (Safari PWA)
    const originalStyle = window.getComputedStyle(document.body).overflow
    const originalHeight = document.body.style.height
    const originalPosition = document.body.style.position
    const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow

    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100%'
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100dvh'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    const handleVisualViewportResize = () => {
      if (!window.visualViewport) return
      const viewport = window.visualViewport
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - (viewport.height + viewport.offsetTop),
      )
      setKeyboardInset(Math.round(keyboardHeight))
      if (keyboardHeight > 60) {
        scrollToBottom()
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize)
      window.visualViewport.addEventListener('scroll', handleVisualViewportResize)
      handleVisualViewportResize()
    }

    return () => {
      // Р’РѕР·РІСЂР°С‰Р°РµРј СЃС‚РёР»Рё body
      document.documentElement.style.overflow = originalHtmlStyle
      document.documentElement.style.height = ''
      document.body.style.overflow = originalStyle
      document.body.style.height = originalHeight
      document.body.style.position = originalPosition
      document.body.style.width = ''

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize)
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize)
      }
    }
  }, [])

  useEffect(() => {
    const initChat = async () => {
      let myId: string | null = null
      const authRaw = localStorage.getItem('hw-auth')
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw)
          myId = auth.uuid || auth.uid
          setUserId(myId)
        } catch {}
      }

      const nextChatId = `${receiverId}:direct`
      setChatId(nextChatId)

      // Сразу показываем из localStorage — без мигания
      if (myId) {
        try {
          const threadStorageKey = `hw-chat-thread:${myId}:${receiverId}:direct`
          const raw = localStorage.getItem(threadStorageKey)
          const stored = raw ? (JSON.parse(raw) as Message[]) : []
          if (Array.isArray(stored) && stored.length > 0) {
            setMessages(stored)
            scrollToBottom(true)
          }
        } catch {}
      }

      if (myId) {
        const client = getSupabase()
        if (client) {
          // Загружаем историю из Supabase
          const { data, error } = await client
            .from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${myId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${myId})`)
            .order('created_at', { ascending: true })
            .limit(200)

          if (!error && data) {
            const mapped: Message[] = data.map((row: any) => ({
              id: row.id,
              chat_id: `${receiverId}:direct`,
              sender_id: row.sender_id,
              message: row.message || '',
              image_url: row.image_url || null,
              ad_context: row.ad_id ? {
                id: row.ad_id,
                title: row.ad_title || '',
                price: row.ad_price || '',
                imageUrl: row.ad_image_url || '/logo.svg',
                userId: row.receiver_id,
                userTag: '',
                description: null,
                condition: null,
                location: null,
                category: null,
                createdAt: new Date(row.created_at).getTime(),
              } : null,
              created_at: row.created_at,
              read_at: row.read_at || null,
            }))
            setMessages(mapped)
            persistChatState(myId, mapped)

            // Отмечаем входящие как прочитанные
            const unreadIds = data
              .filter((row: any) => row.receiver_id === myId && !row.read_at)
              .map((row: any) => row.id)
            if (unreadIds.length > 0) {
              await client
                .from('chat_messages')
                .update({ read_at: new Date().toISOString() })
                .in('id', unreadIds)
            }
          } else {
            // Fallback: localStorage
            try {
              const threadStorageKey = `hw-chat-thread:${myId}:${receiverId}:direct`
              const raw = localStorage.getItem(threadStorageKey)
              const stored = raw ? (JSON.parse(raw) as Message[]) : []
              setMessages(Array.isArray(stored) ? stored : [])
            } catch {
              setMessages([])
            }
          }
        } else {
          // Нет Supabase — localStorage
          try {
            const threadStorageKey = `hw-chat-thread:${myId}:${receiverId}:direct`
            const raw = localStorage.getItem(threadStorageKey)
            const stored = raw ? (JSON.parse(raw) as Message[]) : []
            setMessages(Array.isArray(stored) ? stored : [])
          } catch {
            setMessages([])
          }
        }
      } else {
        setMessages([])
      }

      if (contacts.length === 0 && receiverId) {
        const client = getSupabase()
        if (client) {
          const { data, error } = await client
            .from('profiles')
            .select('contacts')
            .eq('id', receiverId)
            .maybeSingle()
          if (!error && data?.contacts && Array.isArray(data.contacts)) {
            const normalized = data.contacts
              .map((item: any) => {
                if (!item || typeof item !== 'object') return null
                const type = item.type === 'vk' || item.type === 'telegram' ? item.type : null
                const url = typeof item.url === 'string' ? item.url.trim() : ''
                if (!type || !url) return null
                return { type, url }
              })
              .filter((x: any) => !!x)
            if (normalized.length > 0) setContacts(normalized as any)
          }
        }
      }

      setLoading(false)
      scrollToBottom(true)
    }

    initChat()
  }, [receiverId])

  // Realtime подписка на новые сообщения
  useEffect(() => {
    if (!userId) return
    const client = getSupabase()
    if (!client) return

    const channel = client
      .channel(`chat:${[userId, receiverId].sort().join(':')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload: any) => {
          const row = payload.new
          // Только сообщения от нашего собеседника
          if (row.sender_id !== receiverId) return
          const newMsg: Message = {
            id: row.id,
            chat_id: `${receiverId}:direct`,
            sender_id: row.sender_id,
            message: row.message || '',
            image_url: row.image_url || null,
            ad_context: row.ad_id ? {
              id: row.ad_id,
              title: row.ad_title || '',
              price: row.ad_price || '',
              imageUrl: row.ad_image_url || '/logo.svg',
              userId: row.sender_id,
              userTag: '',
              description: null,
              condition: null,
              location: null,
              category: null,
              createdAt: new Date(row.created_at).getTime(),
            } : null,
            created_at: row.created_at,
            read_at: null,
          }
          setMessages((prev) => {
            const next = [...prev, newMsg]
            persistChatState(userId, next)
            return next
          })
          scrollToBottom()
          // Отмечаем прочитанным
          await client
            .from('chat_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', row.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=eq.${userId}`,
        },
        (payload: any) => {
          const row = payload.new
          if (!row.read_at) return
          setMessages((prev) =>
            prev.map((m) => (m.id === row.id ? { ...m, read_at: row.read_at } : m))
          )
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [userId, receiverId])

  // Presence: обновляем своё присутствие + подписываемся на собеседника
  useEffect(() => {
    if (!userId) return
    const client = getSupabase()
    if (!client) return

    const updateMyPresence = async () => {
      await client.from('user_presence').upsert(
        { user_id: userId, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }

    // Загружаем last_seen собеседника
    const loadReceiverPresence = async () => {
      const { data } = await client
        .from('user_presence')
        .select('last_seen')
        .eq('user_id', receiverId)
        .maybeSingle()
      if (data?.last_seen) setReceiverLastSeen(data.last_seen)
    }

    updateMyPresence()
    loadReceiverPresence()

    // Обновляем своё присутствие каждые 30 сек
    presenceIntervalRef.current = setInterval(updateMyPresence, 30000)

    // Realtime подписка на присутствие собеседника
    const presenceChannel = client
      .channel(`presence:${receiverId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence', filter: `user_id=eq.${receiverId}` },
        (payload: any) => {
          if (payload.new?.last_seen) setReceiverLastSeen(payload.new.last_seen)
        }
      )
      .subscribe()

    return () => {
      if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current)
      client.removeChannel(presenceChannel)
    }
  }, [userId, receiverId])

  // Typing indicator через Realtime broadcast
  useEffect(() => {
    if (!userId) return
    const client = getSupabase()
    if (!client) return

    const channelName = `typing:${[userId, receiverId].sort().join(':')}`
    const channel = client.channel(channelName)

    channel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload.payload?.userId !== receiverId) return
        setIsReceiverTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsReceiverTyping(false), 3000)
      })
      .subscribe()

    typingChannelRef.current = channel

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      client.removeChannel(channel)
    }
  }, [userId, receiverId])

  useEffect(() => {
    if (!initialMessage || initialMessage.trim().length === 0) return
    setNewMessage(initialMessage)
  }, [initialMessage])

  const handleSendMessage = async (text: string, context: StoredAd | null = null) => {
    if (!text.trim() && !context) return
    if (!userId) return

    setSending(true)

    // Оптимистично добавляем в UI
    localMessageCounterRef.current += 1
    const tempId = `temp-${receiverId}-${localMessageCounterRef.current}`
    const msg: Message = {
      id: tempId,
      chat_id: `${receiverId}:direct`,
      sender_id: userId,
      message: text,
      image_url: null,
      ad_context: context,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages((prev) => {
      const next = [...prev, msg]
      persistChatState(userId, next)
      return next
    })
    setNewMessage('')
    if (inputRef.current) inputRef.current.style.height = '58px'
    if (context) setShowAdPreview(false)
    scrollToBottom()

    // Отправляем в Supabase
    const client = getSupabase()
    if (client) {
      const { data, error } = await client
        .from('chat_messages')
        .insert({
          sender_id: userId,
          receiver_id: receiverId,
          message: text.trim() || null,
          image_url: null,
          ad_id: context?.id ?? null,
          ad_title: context?.title ?? null,
          ad_price: context?.price ?? null,
          ad_image_url: context?.imageUrl ?? null,
        })
        .select('id, created_at')
        .single()

      if (!error && data) {
        // Заменяем temp id на реальный
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === tempId ? { ...m, id: data.id, created_at: data.created_at } : m
          )
          persistChatState(userId, next)
          return next
        })
        // Push-уведомление получателю (fire & forget)
        fetch('/api/push/new-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId: userId, receiverId, message: text.trim() }),
        }).catch(() => {})
      }
    }

    setSending(false)
    window.scrollTo(0, 0)
  }

  const handleSendImage = async (file: File | null) => {
    if (!file || !userId) return
    try {
      const client = getSupabase()
      let imageUrl: string | null = null

      if (client) {
        // Загружаем в Supabase Storage
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `chat/${userId}/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await client.storage
          .from('chat-images')
          .upload(path, file, { upsert: false })
        if (!uploadError && uploadData) {
          const { data: urlData } = client.storage.from('chat-images').getPublicUrl(path)
          imageUrl = urlData?.publicUrl ?? null
        }
      }

      // Fallback: base64 если storage недоступен
      if (!imageUrl) {
        imageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
          reader.readAsDataURL(file)
        })
      }

      if (!imageUrl) return

      localMessageCounterRef.current += 1
      const tempId = `temp-img-${receiverId}-${localMessageCounterRef.current}`
      const msg: Message = {
        id: tempId,
        chat_id: `${receiverId}:direct`,
        sender_id: userId,
        message: '',
        image_url: imageUrl,
        ad_context: null,
        created_at: new Date().toISOString(),
        read_at: null,
      }
      setMessages((prev) => {
        const next = [...prev, msg]
        persistChatState(userId, next)
        return next
      })
      scrollToBottom()

      if (client) {
        const { data, error } = await client
          .from('chat_messages')
          .insert({
            sender_id: userId,
            receiver_id: receiverId,
            message: null,
            image_url: imageUrl,
          })
          .select('id, created_at')
          .single()
        if (!error && data) {
          setMessages((prev) => {
            const next = prev.map((m) =>
              m.id === tempId ? { ...m, id: data.id, created_at: data.created_at } : m
            )
            persistChatState(userId, next)
            return next
          })
          fetch('/api/push/new-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: userId, receiverId, message: 'Фото' }),
          }).catch(() => {})
        }
      }
    } catch {}
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      recordingChunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data) }
      recorder.start(100)
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingDuration(0)
      recordingTimerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000)
    } catch {
      setMicPermissionDenied(true)
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return
    setIsRecording(false)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)

    await new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current) { resolve(); return }
      mediaRecorderRef.current.onstop = () => resolve()
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
    })

    if (recordingDuration < 1) { recordingChunksRef.current = []; return }

    const mimeType = recordingChunksRef.current[0]?.type || 'audio/webm'
    const blob = new Blob(recordingChunksRef.current, { type: mimeType })
    recordingChunksRef.current = []
    await sendVoiceMessage(blob)
  }

  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return
    setIsRecording(false)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    mediaRecorderRef.current.onstop = null
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
    recordingChunksRef.current = []
    setRecordingDuration(0)
  }

  const sendVoiceMessage = async (blob: Blob) => {
    if (!userId) return
    const client = getSupabase()
    let audioUrl: string | null = null

    if (client) {
      const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
      const path = `chat-voice/${userId}/${Date.now()}.${ext}`
      const { data, error } = await client.storage.from('chat-images').upload(path, blob, { contentType: blob.type })
      if (!error && data) {
        const { data: urlData } = client.storage.from('chat-images').getPublicUrl(path)
        audioUrl = urlData?.publicUrl ?? null
      }
    }

    if (!audioUrl) {
      audioUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.readAsDataURL(blob)
      })
    }

    if (!audioUrl) return

    localMessageCounterRef.current += 1
    const tempId = `temp-voice-${receiverId}-${localMessageCounterRef.current}`
    const msg: Message = {
      id: tempId,
      chat_id: `${receiverId}:direct`,
      sender_id: userId,
      message: '',
      image_url: `voice:${audioUrl}`,
      ad_context: null,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages((prev) => { const next = [...prev, msg]; persistChatState(userId, next); return next })
    scrollToBottom()

    if (client) {
      const { data, error } = await client.from('chat_messages').insert({
        sender_id: userId, receiver_id: receiverId, message: null, image_url: `voice:${audioUrl}`,
      }).select('id, created_at').single()
      if (!error && data) {
        setMessages((prev) => {
          const next = prev.map((m) => m.id === tempId ? { ...m, id: data.id, created_at: data.created_at } : m)
          persistChatState(userId, next)
          return next
        })
        fetch('/api/push/new-message', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId: userId, receiverId, message: '🎤 Голосовое сообщение' }),
        }).catch(() => {})
      }
    }
  }

  const VoiceMessage = ({ url, isMe }: { url: string; isMe: boolean }) => {
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const audioRef = useRef<HTMLAudioElement>(null)
    const toggle = () => {
      const a = audioRef.current; if (!a) return
      if (playing) { a.pause(); setPlaying(false) } else { a.play(); setPlaying(true) }
    }
    const bars = [3,5,8,6,10,7,12,9,6,11,8,5,9,12,7,10,6,8,11,5,9,7,10,6,8,12,5,7]
    return (
      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[20px] min-w-[180px] max-w-[240px] ${isMe ? 'bg-white text-black' : 'bg-[#1C1C1E] text-white border border-white/5'}`}>
        <audio ref={audioRef} src={url}
          onTimeUpdate={() => { const a = audioRef.current; if (a) setProgress(a.currentTime / (a.duration || 1)) }}
          onLoadedMetadata={() => { const a = audioRef.current; if (a) setDuration(a.duration) }}
          onEnded={() => { setPlaying(false); setProgress(0) }}
        />
        <button type="button" onClick={toggle} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
          {playing
            ? <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>}
        </button>
        <div className="flex-1 flex items-center gap-[2px] h-6">
          {bars.map((h, i) => (
            <div key={i} className="rounded-full flex-1" style={{
              height: `${h * 2}px`,
              background: i / bars.length <= progress ? (isMe ? 'rgba(0,0,0,0.6)' : '#64CF86') : (isMe ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'),
              transition: 'background 0.1s',
            }}/>
          ))}
        </div>
        <span className="text-[11px] shrink-0 opacity-50 font-sf-ui-light">{duration > 0 ? `${Math.floor(duration)}с` : ''}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[150] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div className="relative w-full h-[100dvh] flex flex-col">
        
        {/* Messages Area - Base layer with background */}
        <div
          className="absolute inset-0 bg-[#0A0A0A] overflow-y-auto scrollbar-hidden px-4 py-6 pt-32"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)' }}
        >
          {/* Seller Profile Info at the top of messages */}
          <div className="flex flex-col items-center text-center py-6 px-6 space-y-4 mb-6">
            <div className="w-full flex flex-col items-center space-y-4">
              {showAdPreview && adContext ? (
                <div className="w-[188px]">
                  <AdCard
                    id={adContext.id}
                    title={adContext.title}
                    price={adContext.price}
                    imageUrl={adContext.imageUrl || adContext.imageUrls?.[0] || '/logo.svg'}
                    username={(receiverName || 'seller').replace(/^@/, '')}
                    location={adContext.location || undefined}
                    condition={adContext.condition || undefined}
                    createdAt={adContext.createdAt}
                  />
                </div>
              ) : messages.length === 0 ? (
                <RegistrationIllustration />
              ) : null}
              <div className="space-y-1">
                <h3 className="text-[20px] font-ttc-bold text-white">{receiverName || '\u041f\u0440\u043e\u0434\u0430\u0432\u0435\u0446'}</h3>
                {messages.length === 0 ? (
                  <p className="text-[13px] text-white/40 font-sf-ui-light max-w-[240px]">
                    {'\u0412\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0440\u0438\u043e\u0431\u0440\u0435\u0441\u0442\u0438 \u0442\u043e\u0432\u0430\u0440 \u043d\u0435 \u0432\u044b\u0445\u043e\u0434\u044f \u0441 \u0441\u0430\u0439\u0442\u0430'}
                  </p>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[12px] text-white/35 font-sf-ui-light">
                      {'\u0415\u0441\u043b\u0438 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u0432\u0435\u0434\u0435\u0442 \u0441\u0435\u0431\u044f \u0433\u0440\u0443\u0431\u043e, \u0432\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0436\u0430\u043b\u043e\u0431\u0443'}
                    </span>
                    <span className="text-[13px] font-sf-ui-semibold text-red-300/90 border-b border-red-300/40 pb-[1px]">
                      {'\u041f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u043d\u0430 \u043f\u043e\u0432\u0435\u0434\u0435\u043d\u0438\u0435'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {contacts && contacts.length > 0 && (
              <div className="w-full max-w-[280px] space-y-4 pt-4 border-t border-white/5">
                <div className="text-[11px] text-white/20 font-sf-ui-medium uppercase tracking-[0.15em]">{'\u0421\u043f\u043e\u0441\u043e\u0431\u044b \u0441\u0432\u044f\u0437\u0438'}</div>
                <div className="grid gap-2">
                  {contacts.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.035] border border-white/[0.035] hover:bg-white/[0.06] active:scale-[0.98] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                        <img 
                          src={c.type === 'telegram' ? '/interface/telegram.svg' : '/interface/vk.svg'} 
                          alt={c.type}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-[14px] text-white font-sf-ui-medium capitalize">{c.type}</span>
                        <span className="text-[12px] text-white/30 font-sf-ui-light truncate w-full">{c.url.replace(/^https?:\/\//, '')}</span>
                      </div>
                      <ChevronLeft size={16} className="text-white/10 rotate-180 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {messages.map((msg, index) => {
            const isMe = msg.sender_id === userId
            const prevMessage = index > 0 ? messages[index - 1] : null
            const currentTs = new Date(msg.created_at).getTime()
            const prevTs = prevMessage ? new Date(prevMessage.created_at).getTime() : NaN
            const dayKey = getDayKey(msg.created_at)
            const prevDayKey = prevMessage ? getDayKey(prevMessage.created_at) : ''
            const isSameSender = !!prevMessage && prevMessage.sender_id === msg.sender_id
            const isWithinTenMinutes =
              Number.isFinite(currentTs) &&
              Number.isFinite(prevTs) &&
              currentTs - prevTs < 10 * 60 * 1000
            const isGrouped = isSameSender && isWithinTenMinutes
            const showTimestamp = !prevMessage || !isWithinTenMinutes
            const showDateDivider = !prevMessage || dayKey !== prevDayKey
            const dateDividerLabel = getDateDividerLabel(msg.created_at)

            return (
              [
                showDateDivider ? (
                  <div key={`date-${msg.id}`} className="flex justify-center mt-4 mb-2">
                    <div className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] text-white/45 font-sf-ui-medium capitalize tracking-wide">
                      {dateDividerLabel}
                    </div>
                  </div>
                ) : null,
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={msg.id}
                  className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${index === 0 ? 'mt-0' : isGrouped ? 'mt-1.5' : 'mt-3'}`}
                >
                  <div className={`max-w-[82%] min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {msg.image_url && (
                      msg.image_url.startsWith('voice:') ? (
                        <div className="mb-2">
                          <VoiceMessage url={msg.image_url.slice(6)} isMe={isMe} />
                        </div>
                      ) : (
                        <div className="mb-2 w-[220px] rounded-[20px] overflow-hidden border border-white/10 bg-white/5">
                          <img
                            src={msg.image_url}
                            alt=""
                            className="w-full h-[220px] object-cover cursor-zoom-in"
                            onClick={() => setPreviewImage(msg.image_url || null)}
                          />
                        </div>
                      )
                    )}
                    {msg.ad_context && (
                      <div className="mb-2 w-[220px]">
                        <AdCard
                          id={msg.ad_context.id}
                          title={msg.ad_context.title}
                          price={msg.ad_context.price}
                          imageUrl={msg.ad_context.imageUrl || msg.ad_context.imageUrls?.[0] || '/logo.svg'}
                          username={(receiverName || 'seller').replace(/^@/, '')}
                          location={msg.ad_context.location || undefined}
                          condition={msg.ad_context.condition || undefined}
                          createdAt={msg.ad_context.createdAt}
                        />
                      </div>
                    )}
                    
                    {msg.message && (
                      <div 
                        className={`max-w-full min-w-0 px-4 py-3 rounded-[26px] text-[15px] font-sf-ui-medium leading-relaxed shadow-lg ${
                          isMe 
                            ? 'bg-white text-black' 
                            : 'bg-[#1C1C1E] text-white border border-white/5'
                        } whitespace-pre-wrap break-all [overflow-wrap:anywhere]`}
                      >
                        <FormattedText text={msg.message} />
                      </div>
                    )}
                    
                    {showTimestamp && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-white/20 font-sf-ui-medium uppercase tracking-wider">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <div className="relative h-3 w-4">
                            <svg
                              viewBox="0 0 16 12"
                              className={`absolute left-0 top-0 h-3 w-3 ${msg.read_at ? 'text-[#6FB2FF]' : 'text-white/35'}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1.5 6.5L4.5 9.5L8.5 2.5" />
                            </svg>
                            {msg.read_at && (
                              <svg
                                viewBox="0 0 16 12"
                                className="absolute left-[4px] top-0 h-3 w-3 text-[#6FB2FF]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1.5 6.5L4.5 9.5L8.5 2.5" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>,
              ]
            )
          })}
          <div ref={messagesEndRef} />
          {/* Typing indicator */}
          <AnimatePresence>
            {isReceiverTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="flex justify-start mt-3 px-4"
              >
                <div className="flex items-center gap-1.5 bg-[#1C1C1E] border border-white/5 rounded-[20px] px-4 py-3">
                  {[0, 0.18, 0.36].map((delay) => (
                    <motion.div
                      key={delay}
                      className="w-2 h-2 rounded-full bg-white/50"
                      animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Header - Fixed Overlay */}
        <div 
          className="flex flex-col z-50 sticky top-0 bg-[#0A0A0A]/92 backdrop-blur-xl border-b border-white/5 shadow-[0_10px_26px_rgba(0,0,0,0.35)]"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="flex items-center px-6 h-16">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md transition-colors"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            
            <div className="flex items-center ml-3 flex-1 overflow-hidden gap-3">
              {/* Аватар */}
              <div className="shrink-0">
                {receiverAvatar ? (
                  <img src={receiverAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-[14px] font-sf-ui-medium">
                    {(resolvedReceiverName || 'U').replace(/^@/, '').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden justify-center">
                <span className="text-[16px] font-ttc-bold text-white truncate pr-4 leading-tight">
                  {resolvedTitle}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 h-4">
                {isReceiverTyping ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-white/40 font-sf-ui-light">Печатает</span>
                    {[0, 0.2, 0.4].map((delay) => (
                      <motion.span
                        key={delay}
                        className="text-[12px] text-white/40 font-sf-ui-light"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
                      >.</motion.span>
                    ))}
                  </div>
                ) : receiverLastSeen ? (
                  <>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline(receiverLastSeen) ? 'bg-[#64CF86]' : 'bg-white/25'}`} />
                    <span className="text-[12px] text-white/40 font-sf-ui-light truncate">
                      {formatLastSeen(receiverLastSeen)}
                    </span>
                  </>
                ) : null}
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area Wrapper - Fixed Bottom Overlay */}
        <div
          className="absolute left-0 right-0 bottom-0 flex flex-col z-[60]"
          style={{ transform: `translateY(-${keyboardTranslate}px)` }}
        >

          <div
            className="p-4 space-y-4"
            style={{ paddingBottom: keyboardInset > 0 ? '0px' : 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
          >
            {/* Quick Responses */}
            {messages.length === 0 && !newMessage && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-4 px-4">
                {quickResponses.map((text) => (
                  <button
                    key={text}
                    onClick={() => handleSendMessage(text, showAdPreview ? adContext : null)}
                    className="whitespace-nowrap px-4 py-2.5 rounded-full bg-white/[0.035] border border-white/[0.045] text-white/60 text-[13px] font-sf-ui-medium active:scale-95 transition-all hover:bg-white/[0.06]"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {!userId ? (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.dispatchEvent(new Event('trigger-auth'))
                }}
                className="w-full h-[52px] rounded-[26px] bg-white text-black text-[15px] font-sf-ui-medium active:scale-[0.98] transition-all"
              >
                {'\u0412\u043e\u0439\u0442\u0438, \u0447\u0442\u043e\u0431\u044b \u043d\u0430\u043f\u0438\u0441\u0430\u0442\u044c'}
              </button>
            ) : (
              <div className="relative">
                {/* UI записи голосового */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute bottom-full left-0 right-0 mb-2 flex items-center gap-3 px-4 py-3 rounded-[20px] bg-[#1C1C1E] border border-white/10"
                    >
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <div className="flex-1 flex items-center gap-[3px] h-5">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 rounded-full bg-white/50"
                            animate={{ height: [`${4 + Math.random() * 12}px`, `${4 + Math.random() * 16}px`, `${4 + Math.random() * 8}px`] }}
                            transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        ))}
                      </div>
                      <span className="text-[13px] text-white/60 font-sf-ui-light shrink-0">
                        {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </span>
                      <button type="button" onClick={cancelRecording} className="shrink-0 text-white/40 active:text-white/70">
                        <X size={16} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="absolute left-4 bottom-[20px] text-white/74 active:scale-95 transition-all z-10"
                >
                  <ImageIcon size={18} strokeWidth={2.7} className="fill-none" />
                </button>
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  enterKeyHint="send"
                  onFocus={() => {
                    window.scrollTo(0, 0)
                    scrollToBottom()
                  }}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    e.target.style.height = '58px'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`
                    // Broadcast typing
                    if (typingChannelRef.current && userId) {
                      typingChannelRef.current.send({
                        type: 'broadcast',
                        event: 'typing',
                        payload: { userId },
                      })
                    }
                  }}
                  placeholder={'\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435...'}
                  className="w-full max-h-[180px] min-h-[58px] bg-[#141414] border border-white/[0.06] rounded-[26px] pl-11 pr-14 py-[16px] text-[16px] text-white outline-none focus:border-white/[0.14] transition-all placeholder:text-white/25 resize-none font-sf-ui-light leading-normal scrollbar-hidden"
                  rows={1}
                  style={{ height: '58px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(newMessage, showAdPreview ? adContext : null)
                    }
                  }}
                />
                <button
                  onClick={() => handleSendMessage(newMessage, showAdPreview ? adContext : null)}
                  disabled={!newMessage.trim() || sending}
                  className={`absolute right-3.5 bottom-[19px] transition-all ${
                    newMessage.trim() ? 'text-white active:scale-90' : 'text-white/28'
                  }`}
                >
                  {newMessage.trim() ? (
                    <ArrowUp size={20} strokeWidth={3} className="text-current fill-none" />
                  ) : (
                    <button
                      type="button"
                      onPointerDown={(e) => { e.preventDefault(); startRecording() }}
                      onPointerUp={() => stopRecording()}
                      onPointerLeave={() => { if (isRecording) stopRecording() }}
                      className={`w-8 h-8 flex items-center justify-center transition-all ${isRecording ? 'text-red-500 scale-110' : 'text-white/50 active:text-white/80'}`}
                    >
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    </button>
                  )}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    void handleSendImage(file)
                    e.currentTarget.value = ''
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[220] bg-black/95"
              onClick={() => setPreviewImage(null)}
            >
              {/* Шапка */}
              <div
                className="absolute top-0 left-0 right-0 flex items-center justify-end gap-2 px-5 z-10"
                style={{ height: 'calc(env(safe-area-inset-top, 0px) + 56px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-all"
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      const res = await fetch(previewImage)
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `photo_${Date.now()}.jpg`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    } catch {
                      window.open(previewImage, '_blank')
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-all"
                  onClick={() => setPreviewImage(null)}
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
              {/* Фото */}
              <div className="absolute inset-0 flex items-center justify-center p-5 pt-20 pb-10">
                <motion.img
                  src={previewImage}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Плашка: нет доступа к микрофону */}
        <AnimatePresence>
          {micPermissionDenied && (
            <>
              <motion.div
                className="fixed inset-0 z-[230] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMicPermissionDenied(false)}
              />
              <div className="fixed inset-0 z-[240] flex items-end justify-center pointer-events-none">
                <motion.div
                  initial={{ translateY: '100%' }}
                  animate={{ translateY: 0 }}
                  exit={{ translateY: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                  className="w-full bg-[#121212] border-t border-white/10 rounded-t-[32px] px-6 pt-7 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pointer-events-auto"
                >
                  <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/15" />

                  {/* SVG микрофон */}
                  <div className="flex justify-center mb-5">
                    <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <svg viewBox="0 0 48 48" className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="18" y="4" width="12" height="22" rx="6"/>
                        <path d="M8 22v2a16 16 0 0 0 32 0v-2"/>
                        <line x1="24" y1="40" x2="24" y2="46"/>
                        <line x1="16" y1="46" x2="32" y2="46"/>
                        {/* Перечёркивающая линия */}
                        <line x1="6" y1="6" x2="42" y2="42" strokeOpacity="0.5"/>
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-[20px] font-sf-ui-medium text-white mb-2">Нет доступа к микрофону</h3>
                    <p className="text-[14px] text-white/40 font-sf-ui-light leading-relaxed">
                      Чтобы отправлять голосовые сообщения, разрешите доступ к микрофону в настройках браузера
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setMicPermissionDenied(false)
                      try {
                        await navigator.mediaDevices.getUserMedia({ audio: true })
                      } catch {}
                    }}
                    className="h-14 w-full rounded-[22px] bg-white/10 border border-white/10 text-white font-sf-ui-medium text-[16px] active:scale-[0.97] transition-all mb-3"
                  >
                    Дать доступ
                  </button>
                  <button
                    type="button"
                    onClick={() => setMicPermissionDenied(false)}
                    className="h-12 w-full rounded-[22px] text-white/40 font-sf-ui-light text-[15px] active:opacity-60 transition-all"
                  >
                    Отмена
                  </button>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
