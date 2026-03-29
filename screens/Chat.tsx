'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Send, Image as ImageIcon, User, ShieldCheck, Clock, CheckCircle2, MessageCircle, ShoppingBag, X, ArrowUp } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import type { StoredAd } from './ads'

type Message = {
  id: string
  chat_id: string
  sender_id: string
  message: string
  image_url: string | null
  ad_context?: StoredAd | null
  created_at: string
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

export default function Chat({ 
  onClose, 
  receiverId, 
  receiverName, 
  receiverAvatar,
  adContext,
  contacts: initialContacts = []
}: { 
  onClose: () => void 
  receiverId: string
  receiverName?: string
  receiverAvatar?: string | null
  adContext?: StoredAd | null
  contacts?: Array<{ type: 'vk' | 'telegram', url: string }>
}) {
  const [scale, setScale] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [showAdPreview, setShowAdPreview] = useState(!!adContext)
  const [contacts, setContacts] = useState(initialContacts)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const modalInputRef = useRef<HTMLTextAreaElement>(null)
  const [viewportHeight, setViewportHeight] = useState('100%')
  const [viewportTop, setViewportTop] = useState(0)
  const [modalViewportHeight, setModalViewportHeight] = useState(0)
  const [modalViewportOffset, setModalViewportOffset] = useState(0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardOffset, setKeyboardOffset] = useState(1) // Дефолтный отступ 2px
  const [isInputModalOpen, setIsInputModalOpen] = useState(false)

  // TikTok-style focus logic
  useEffect(() => {
    if (isInputModalOpen) {
      // На iOS фокус должен быть максимально быстрым
      const timer = setTimeout(() => {
        if (modalInputRef.current) {
          modalInputRef.current.focus()
          // Прокручиваем вьюпорт в 0, чтобы iOS не пытался сам "докрутить" до поля
          window.scrollTo(0, 0)
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isInputModalOpen])

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
    "Где удобно встретиться?",
    "Хочу приобрести",
    "Был в ремонте?",
    "Актуально?",
    "Торг уместен?",
    "Можно дополнительные фото?"
  ]

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    // Блокировка скролла body при открытом чате (Safari PWA)
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

    // Автофокус при входе
    setTimeout(() => {
      inputRef.current?.focus()
    }, 500)

    // Обработка высоты вьюпорта для мобильных устройств (клавиатура)
    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height
        const offsetTop = window.visualViewport.offsetTop
        const scale = window.visualViewport.scale
        
        // Для ОСНОВНОГО контейнера чата мы больше не меняем высоту динамически при открытии клавы,
        // чтобы избежать прыжков. Клавиатура будет работать только в модальном окне ввода.
        if (!isInputModalOpen) {
          setViewportHeight(`${height}px`)
          setViewportTop(offsetTop)
        } else {
          // Если модалка открыта, обновляем её высоту и положение
          setModalViewportHeight(height)
          setModalViewportOffset(offsetTop)
        }
        
        // Корректируем отступ клавиатуры
        setKeyboardOffset(offsetTop > 0 ? Math.max(0, 2 - offsetTop) : 2)
        
        const isOpen = height < window.innerHeight * 0.85
        setIsKeyboardOpen(isOpen)
        
        if (isOpen && !isInputModalOpen) {
          scrollToBottom()
          // Принудительно сбрасываем скролл документа, чтобы не было "прыжков"
          window.scrollTo(0, 0)
        }
      }
    }

    // Слушатель на скролл окна, чтобы предотвратить "улетание"
    const handleWindowScroll = () => {
      if (isKeyboardOpen) {
        window.scrollTo(0, 0)
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize)
      window.visualViewport.addEventListener('scroll', handleVisualViewportResize)
      window.addEventListener('scroll', handleWindowScroll, { passive: false })
      handleVisualViewportResize()
    }

    const update = () => {
      setScale(1)
    }
    update()
    window.addEventListener('resize', update)
    
    return () => {
      // Возвращаем стили body
      document.documentElement.style.overflow = originalHtmlStyle
      document.documentElement.style.height = ''
      document.body.style.overflow = originalStyle
      document.body.style.height = originalHeight
      document.body.style.position = originalPosition
      document.body.style.width = ''

      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', handleWindowScroll)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize)
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize)
      }
    }
  }, [])

  useEffect(() => {
    const initChat = async () => {
      const authRaw = localStorage.getItem('hw-auth')
      if (authRaw) {
        const auth = JSON.parse(authRaw)
        const myId = auth.uuid || auth.uid
        setUserId(myId)
      }

      // Даже если гость, пробуем загрузить контакты продавца
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
            if (normalized.length > 0) {
              setContacts(normalized as any)
            }
          }
        }
      }

      setLoading(false)
      scrollToBottom()
    }

    initChat()
  }, [receiverId])

  const handleSendMessage = async (text: string, context: StoredAd | null = null) => {
    if (!text.trim() && !context) return
    if (!userId) return

    setSending(true)
    
    const msg: Message = {
      id: Math.random().toString(),
      chat_id: chatId || 'new',
      sender_id: userId,
      message: text,
      image_url: null,
      ad_context: context,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, msg])
    setNewMessage('')
    if (context) setShowAdPreview(false)
    
    setSending(false)
    scrollToBottom()
    
    // Здесь должна быть отправка в Supabase
  }

  return (
    <div className="fixed inset-0 z-[150] flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
      <div 
        className="relative w-full flex flex-col" 
        style={{ 
          height: viewportHeight, 
          top: `${viewportTop}px`,
          position: 'fixed',
          left: 0,
          // Убираем transform scale для чата, так как он ломает visualViewport на мобильных
          // Добавляем переменную для ручной корректировки если понадобится
          '--keyboard-offset': `${keyboardOffset}px` 
        } as any}
      >
        
        {/* Messages Area - Base layer with background */}
        <div className="absolute inset-0 bg-[#0A0A0A] overflow-y-auto scrollbar-hidden px-4 py-6 pt-32 pb-48 space-y-6">
          {/* Seller Profile Info at the top of messages */}
          <div className="flex flex-col items-center text-center py-6 px-6 space-y-4 border-b border-white/5 mb-6">
            <div className="w-full flex flex-col items-center space-y-4">
              <RegistrationIllustration />
              <div className="space-y-1">
                <h3 className="text-[20px] font-ttc-bold text-white">{receiverName || 'Продавец'}</h3>
                <p className="text-[13px] text-white/40 font-sf-ui-light max-w-[240px]">
                  Вы можете приобрести товар не выходя с сайта
                </p>
              </div>
            </div>

            {contacts && contacts.length > 0 && (
              <div className="w-full max-w-[280px] space-y-4 pt-4 border-t border-white/5">
                <div className="text-[11px] text-white/20 font-sf-ui-medium uppercase tracking-[0.15em]">Способы связи</div>
                <div className="grid gap-2">
                  {contacts.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all group"
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

          {messages.map((msg) => {
            const isMe = msg.sender_id === userId
            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={msg.id}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {msg.ad_context && (
                    <div className="mb-2 rounded-[28px] bg-white/5 border border-white/10 overflow-hidden w-[180px] shadow-2xl">
                      <div className="flex flex-col">
                        <div className="h-[240px] w-full bg-white/10 overflow-hidden">
                          <img src={msg.ad_context.imageUrl || msg.ad_context.imageUrls?.[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4">
                          <div className="text-[14px] font-ttc-bold text-white truncate">{msg.ad_context.title}</div>
                          <div className="text-[13px] text-blue-400 font-sf-ui-medium mt-1">{msg.ad_context.price} ₽</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {msg.message && (
                    <div 
                      className={`px-4 py-3 rounded-[22px] text-[15px] font-sf-ui-light leading-relaxed shadow-lg ${
                        isMe 
                          ? 'bg-white text-black rounded-tr-none' 
                          : 'bg-[#1C1C1E] text-white rounded-tl-none border border-white/5'
                      }`}
                    >
                      {msg.message}
                    </div>
                  )}
                  
                  <span className="text-[10px] text-white/20 mt-1 font-sf-ui-medium uppercase tracking-wider">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Header - Fixed Overlay */}
        <div 
          className="flex flex-col z-50 sticky top-0 bg-transparent"
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
            
            <div className="flex items-center ml-4 flex-1 overflow-hidden">
              <span className="text-[16px] font-ttc-bold text-white truncate pr-4 drop-shadow-md">
                {adContext?.title || receiverName || 'Продавец'}
              </span>
            </div>
          </div>
        </div>

        {/* Input Area Wrapper - Fixed Bottom Overlay */}
        <div className="mt-auto flex flex-col bg-black/20 backdrop-blur-2xl z-[60] border-t border-white/5">
          {/* Ad Context Preview - Above quick replies and input */}
          <AnimatePresence>
            {showAdPreview && adContext && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-4 pt-4"
              >
                <div className="relative overflow-hidden rounded-[28px] bg-transparent border-none shadow-none max-w-[140px]">
                  <div className="flex flex-col">
                    <div className="h-24 w-full bg-white/10 overflow-hidden relative">
                      <img src={adContext.imageUrl || adContext.imageUrls?.[0]} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setShowAdPreview(false)}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="text-[13px] font-ttc-bold text-white/90 truncate">{adContext.title}</div>
                      <div className="text-[12px] text-blue-400 font-sf-ui-medium mt-0.5">{adContext.price} ₽</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`p-4 space-y-4 ${isKeyboardOpen ? 'pb-[var(--keyboard-offset,2px)]' : 'pb-[calc(env(safe-area-inset-bottom, 0px) + 8px)]'}`}>
            {/* Quick Responses */}
            {messages.length === 0 && !newMessage && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-4 px-4">
                {quickResponses.map((text) => (
                  <button
                    key={text}
                    onClick={() => handleSendMessage(text, showAdPreview ? adContext : null)}
                    className="whitespace-nowrap px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[13px] font-sf-ui-medium active:scale-95 transition-all hover:bg-white/10"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2">
              <div 
                className="relative flex-1 cursor-text"
                onClick={() => setIsInputModalOpen(true)}
              >
                <div className="w-full min-h-[52px] bg-white/5 border border-white/10 rounded-[26px] px-5 py-3.5 text-[16px] text-white/40 flex items-center">
                  Сообщение...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TikTok-style Input Modal */}
        <AnimatePresence>
          {isInputModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md"
              style={{ 
                // На iOS используем visualViewport для фиксации положения
                height: modalViewportHeight > 0 ? `${modalViewportHeight}px` : '100dvh',
                top: `${modalViewportOffset}px`,
                position: 'fixed',
                left: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'end'
              } as any}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsInputModalOpen(false)
              }}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="bg-[#121212] rounded-t-[32px] border-t border-white/10 p-4 pb-[calc(env(safe-area-inset-bottom, 0px) + 16px)]"
              >
                {!userId ? (
                  <div className="flex flex-col items-center text-center p-4 space-y-6">
                    <AuthIllustration />
                    <div className="space-y-2">
                      <h3 className="text-[22px] font-ttc-bold text-white leading-tight">
                        Нужен аккаунт
                      </h3>
                      <p className="text-[14px] text-white/40 font-sf-ui-light max-w-[260px]">
                        Чтобы отправлять сообщения, покупать товары и сохранять избранное — создайте профиль
                      </p>
                    </div>
                    <div className="w-full flex flex-col gap-3 pt-4">
                      <button 
                        onClick={() => {
                          setIsInputModalOpen(false)
                          onClose()
                          window.dispatchEvent(new Event('trigger-auth'))
                        }}
                        className="w-full h-14 bg-white text-black rounded-[22px] font-sf-ui-bold text-[16px] active:scale-95 transition-all"
                      >
                        Зарегистрироваться
                      </button>
                      <button 
                        onClick={() => setIsInputModalOpen(false)}
                        className="w-full h-14 bg-white/5 text-white/60 rounded-[22px] font-sf-ui-medium text-[15px]"
                      >
                        Позже
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <button 
                        onClick={() => setIsInputModalOpen(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/60"
                      >
                        <X size={20} />
                      </button>
                      <span className="text-white/40 font-sf-ui-medium text-[14px]">Новое сообщение</span>
                    </div>

                    {/* Ad Context Preview in Modal */}
                    <AnimatePresence>
                      {showAdPreview && adContext && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4"
                        >
                          <div className="relative overflow-hidden rounded-[24px] bg-transparent border-none shadow-none max-w-[120px]">
                            <div className="flex flex-col">
                              <div className="h-20 w-full bg-white/10 overflow-hidden relative rounded-[20px]">
                                <img src={adContext.imageUrl || adContext.imageUrls?.[0]} alt="" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setShowAdPreview(false)}
                                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/80"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              <div className="py-2 px-1">
                                <div className="text-[12px] font-ttc-bold text-white/90 truncate">{adContext.title}</div>
                                <div className="text-[11px] text-blue-400 font-sf-ui-medium mt-0.5">{adContext.price} ₽</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative flex items-center gap-3">
                      <div className="relative flex-1">
                        <textarea
                          ref={modalInputRef}
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value)
                            // Автоматическое изменение высоты
                            e.target.style.height = '52px'
                            e.target.style.height = `${e.target.scrollHeight}px`
                          }}
                          placeholder="Напишите сообщение..."
                          className="w-full max-h-[160px] min-h-[52px] bg-white/5 border border-white/10 rounded-[24px] px-5 py-[14px] text-[16px] text-white outline-none focus:border-white/20 transition-all placeholder:text-white/20 resize-none font-sf-ui-light leading-normal scrollbar-hidden"
                          rows={1}
                          style={{ height: '52px' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage(newMessage, showAdPreview ? adContext : null)
                              setIsInputModalOpen(false)
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          handleSendMessage(newMessage, showAdPreview ? adContext : null)
                          setIsInputModalOpen(false)
                        }}
                        disabled={!newMessage.trim()}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 self-end mb-[2px] ${
                          newMessage.trim() ? 'bg-white text-black active:scale-90' : 'bg-white/5 text-white/20'
                        }`}
                      >
                        <ArrowUp size={24} strokeWidth={2.5} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
