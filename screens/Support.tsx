'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Send, Image as ImageIcon, User, ShieldCheck, Clock, CheckCircle2, MessageCircle, Trash2, Plus, X, ArrowUp } from 'lucide-react'
import { getSupabase, loadLocalAuth } from '@/lib/supabaseClient'

type Message = {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  image_url: string | null
  created_at: string
}

type Ticket = {
  id: string
  user_id: string
  status: 'open' | 'closed'
  created_at: string
  updated_at?: string
  lastMessage?: string
  lastMessageSenderId?: string
  profiles?: {
    tag: string
    avatar_url: string | null
    is_verified?: boolean
  }
}

export default function Support({ onClose }: { onClose: () => void }) {
  const [scale, setScale] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [isModerator, setIsModerator] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [userTickets, setUserTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showClosedNotice, setShowClosedNotice] = useState(false)
  const [showSupportNotice, setShowSupportNotice] = useState(false)
  const [isInputModalOpen, setIsInputModalOpen] = useState(false)
  const [viewportHeight, setViewportHeight] = useState('100%')
  const [viewportTop, setViewportTop] = useState(0)
  const [modalViewportHeight, setModalViewportHeight] = useState(0)
  const [modalViewportOffset, setModalViewportOffset] = useState(0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalInputRef = useRef<HTMLTextAreaElement>(null)

  // TikTok-style focus logic
  useEffect(() => {
    if (isInputModalOpen) {
      const timer = setTimeout(() => {
        if (modalInputRef.current) {
          modalInputRef.current.focus()
          window.scrollTo(0, 0)
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isInputModalOpen])

  useEffect(() => {
    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height
        const offsetTop = window.visualViewport.offsetTop
        
        if (!isInputModalOpen) {
          setViewportHeight(`${height}px`)
          setViewportTop(offsetTop)
        } else {
          setModalViewportHeight(height)
          setModalViewportOffset(offsetTop)
        }
        
        const isOpen = height < window.innerHeight * 0.85
        setIsKeyboardOpen(isOpen)
        
        if (isOpen && !isInputModalOpen) {
          scrollToBottom()
          window.scrollTo(0, 0)
        }
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize)
      window.visualViewport.addEventListener('scroll', handleVisualViewportResize)
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize)
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize)
      }
    }
  }, [isInputModalOpen])

  const quickQuestions = [
    "Как создать объявление?",
    "Как изменить город в профиле?",
    "Как связаться с продавцом?",
    "Безопасны ли сделки?",
    "Как работает поиск?",
    "Как удалить аккаунт?"
  ]

  const moderatorPhrases = [
    "Здравствуйте! Чем я могу вам помочь?",
    "Ваш запрос передан техническому специалисту.",
    "Пожалуйста, ожидайте, мы проверяем информацию.",
    "Ваша проблема решена. Есть ли другие вопросы?",
    "Для решения вопроса нам потребуется скриншот.",
    "Благодарим за обращение в поддержку!"
  ]

  const aiAnswers: Record<string, string> = {
    "Как создать объявление?": "Для создания объявления нажмите на кнопку '+' в нижнем меню. Заполните описание, добавьте фото и укажите цену. После модерации оно появится в ленте!",
    "Как изменить город в профиле?": "Перейдите в настройки профиля (иконка человечка -> 'Редактировать'). Там вы сможете выбрать ваш текущий город из списка.",
    "Как связаться с продавцом?": "В карточке каждого объявления есть кнопка 'Написать' или 'Позвонить'. Нажмите на нее, чтобы начать диалог напрямую с автором.",
    "Безопасны ли сделки?": "Мы рекомендуем встречаться в людных местах и проверять товар перед оплатой. Никогда не переводите предоплату незнакомым лицам.",
    "Как работает поиск?": "Используйте строку поиска сверху и фильтры по категориям/цене, чтобы быстро найти нужную вещь в вашем городе.",
    "Как удалить аккаунт?": "Для удаления аккаунта напишите нам в поддержку через форму ниже (не через быстрые вопросы), и мы обработаем ваш запрос в течение 24 часов."
  }

  const handleQuickQuestion = async (text: string) => {
    if (sending || !activeTicket || !userId) return
    
    // Показываем сообщение пользователя
    const userMsg: Message = {
      id: Math.random().toString(),
      ticket_id: activeTicket.id,
      sender_id: userId,
      message: text,
      image_url: null,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    scrollToBottom()

    // Имитируем "печатание" ИИ
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))

    const answer = aiAnswers[text] || "К сожалению, я не нашел готового ответа. Пожалуйста, сформулируйте запрос для поддержки."
    
    const aiMsg: Message = {
      id: Math.random().toString(),
      ticket_id: activeTicket.id,
      sender_id: 'ai-bot', // Специальный ID для бота
      message: answer,
      image_url: null,
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, aiMsg])
    setSending(false)
    scrollToBottom()
  }

  const notifyUser = async (ticketId: string, message: string) => {
    try {
      await fetch('/api/push/support-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, userId, message })
      })
    } catch (err) {
      console.error('Error calling notify API:', err)
    }
  }

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
    if (!activeTicket) {
      setMessages([])
      return
    }

    let isMounted = true
    const client = getSupabase()
    if (!client) return

    const loadAndSubscribe = async () => {
      // 1. Load existing messages
      let query = client.from('support_messages').select('*')
      
      if (isModerator) {
        query = query.eq('ticket_id', activeTicket.id)
      } else {
        // For user, load messages from ALL their tickets to show history
        const ticketIds = userTickets.map(t => t.id)
        if (ticketIds.length > 0) {
          query = query.in('ticket_id', ticketIds)
        } else {
          query = query.eq('ticket_id', activeTicket.id)
        }
      }

      const { data, error } = await query.order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading messages:', error)
        return null
      }

      if (!isMounted) return null

      setMessages(data || [])
      scrollToBottom()

      // 2. Subscribe to messages AND ticket updates
      const currentTicketId = activeTicket.id
      const channel = client
        .channel(`active-ticket-${currentTicketId}`)
        // Listen for new messages
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'support_messages',
          filter: `ticket_id=eq.${currentTicketId}`
        }, (payload) => {
          if (isMounted) {
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev
              return [...prev, payload.new as Message]
            })
            scrollToBottom()
          }
        })
        // Listen for ticket status changes (closure)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${currentTicketId}`
        }, (payload) => {
          if (isMounted) {
            setActiveTicket(prev => prev ? { ...prev, ...payload.new } : (payload.new as Ticket))
          }
        })
        .subscribe()

      return channel
    }

    const channelPromise = loadAndSubscribe()

    return () => {
      isMounted = false
      channelPromise.then(channel => {
        if (channel) {
          // Даем небольшую задержку перед отпиской, чтобы WebSocket успел открыться
          setTimeout(() => {
            client.removeChannel(channel).catch(e => {
              // Игнорируем ошибки при удалении, так как это обычно означает, что соединение уже закрыто
            })
          }, 100)
        }
      })
    }
  }, [activeTicket?.id])

  useEffect(() => {
    if (!isModerator || activeTicket) return

    const client = getSupabase()
    if (!client) return

    const channel = client
      .channel('moderator-list')
      .on('postgres_changes', {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'support_tickets'
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          // Fetch the full ticket data including profile for the new ticket
          const { data: newTicket, error } = await client
            .from('support_tickets')
            .select(`
              *,
              profiles (tag, avatar_url, is_verified),
              support_messages (message, created_at)
            `)
            .eq('id', payload.new.id)
            .single()
          
          if (newTicket) {
            const msgs = newTicket.support_messages || []
            const lastMsg = msgs.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
            
            setTickets(prev => [{
               ...newTicket,
               lastMessage: lastMsg?.message || 'Новое обращение',
               lastMessageSenderId: lastMsg?.sender_id
             }, ...prev])
           }
         } else if (payload.eventType === 'UPDATE') {
           setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t))
         } else if (payload.eventType === 'DELETE') {
           setTickets(prev => prev.filter(t => t.id === payload.old.id))
         }
       })
       .on('postgres_changes', {
         event: 'INSERT',
         schema: 'public',
         table: 'support_messages'
       }, (payload) => {
         // Update last message in the list
         setTickets(prev => prev.map(t => {
           if (t.id === payload.new.ticket_id) {
             return { 
               ...t, 
               lastMessage: payload.new.message || 'Отправлено фото', 
               lastMessageSenderId: payload.new.sender_id,
               updated_at: payload.new.created_at 
             }
           }
           return t
         }).sort((a, b) => {
           const timeA = new Date(a.updated_at || a.created_at).getTime()
           const timeB = new Date(b.updated_at || b.created_at).getTime()
           return timeB - timeA
         }))
       })
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [isModerator, activeTicket === null])

  const init = async () => {
    console.log('Support: Starting init...')
    const client = getSupabase()
    if (!client) {
      console.error('Support: No Supabase client found')
      return
    }

    const auth = await loadLocalAuth()
    const uid = auth?.uuid || auth?.uid
    console.log('Support: User UID:', uid)
    if (!uid) {
      setLoading(false)
      return
    }
    setUserId(uid)

    // Check if user is moderator
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('is_moderator')
      .eq('id', uid)
      .maybeSingle()
    
    if (profileError) {
      console.error('Support: Error fetching profile:', profileError)
    }
    
    const isMod = !!profile?.is_moderator
    console.log('Support: Is Moderator:', isMod)
    setIsModerator(isMod)

    if (isMod) {
      // 1. Auto-delete tickets older than 7 days
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { error: deleteOldError } = await client
        .from('support_tickets')
        .delete()
        .lt('created_at', weekAgo.toISOString())
      
      if (deleteOldError) {
        console.error('Support: Error deleting old tickets:', deleteOldError)
      } else {
        console.log('Support: Old tickets cleaned up')
      }

      // 2. Fetch all tickets with profiles and last message
      console.log('Support: Fetching all tickets for moderator...')
      const { data: allTickets, error: fetchError } = await client
        .from('support_tickets')
        .select(`
          *,
          profiles (
            tag,
            avatar_url,
            is_verified
          ),
          support_messages (
            message,
            created_at
          )
        `)
        .order('updated_at', { ascending: false })
      
      if (fetchError) {
        console.error('Support: Error fetching tickets:', fetchError)
      } else {
        console.log('Support: Tickets fetched:', allTickets?.length)
      }
      
      // Map tickets to include the last message text and sender
      const ticketsWithLastMsg: Ticket[] = (allTickets || []).map((ticket: any) => {
        const msgs = ticket.support_messages || []
        const lastMsg = msgs.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        return {
          ...ticket,
          lastMessage: lastMsg?.message || 'Нет сообщений',
          lastMessageSenderId: lastMsg?.sender_id
        }
      })
      
      setTickets(ticketsWithLastMsg)
      setLoading(false)
    } else {
      // Fetch user's tickets (all of them for history)
      const { data: uTickets, error: ticketError } = await client
        .from('support_tickets')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (uTickets && uTickets.length > 0) {
        setUserTickets(uTickets)
        // Latest ticket is the active one
        setActiveTicket(uTickets[0])
      } else {
        // Create new ticket if none exists
        const { data: newTicket, error: createError } = await client
          .from('support_tickets')
          .insert({ user_id: uid, status: 'open' })
          .select()
          .single()
        
        if (newTicket) {
          setActiveTicket(newTicket as Ticket)
          setUserTickets([newTicket as Ticket])
        }
      }
      setLoading(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!activeTicket || sending) return
    const client = getSupabase()
    if (!client) return

    setSending(true)
    const { error } = await client
      .from('support_tickets')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', activeTicket.id)

    if (error) {
      console.error('Error closing ticket:', error)
      alert('Ошибка при закрытии обращения')
    } else {
      setActiveTicket(prev => prev ? { ...prev, status: 'closed' } : null)
      notifyUser(activeTicket.id, 'Обращение было закрыто поддержкой')
      // If moderator, refresh list
      if (isModerator) {
        init()
      }
    }
    setSending(false)
  }

  const handleDeleteTicket = async (ticketId: string) => {
    const client = getSupabase()
    if (!client) return

    // Сначала удаляем все сообщения, связанные с тикетом (Foreign Key Constraint)
    await client
      .from('support_messages')
      .delete()
      .eq('ticket_id', ticketId)

    const { error } = await client
      .from('support_tickets')
      .delete()
      .eq('id', ticketId)

    if (!error) {
      setTickets(prev => prev.filter(t => t.id !== ticketId))
      if (activeTicket?.id === ticketId) setActiveTicket(null)
    } else {
      console.error('Error deleting ticket:', error)
    }
  }

  useEffect(() => {
    init()
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const createNewTicket = async (uid: string) => {
    const client = getSupabase()
    if (!client) return null
    const { data, error } = await client
      .from('support_tickets')
      .insert({ user_id: uid, status: 'open' })
      .select()
      .single()
    if (error) {
      console.error('Error creating new ticket:', error)
      return null
    }
    return data as Ticket
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeTicket || !userId || sending) return

    const client = getSupabase()
    if (!client) return

    setSending(true)
    const msgText = newMessage.trim()
    setNewMessage('')

    let currentTicketId = activeTicket.id

    // If ticket is closed and user is sending a message, create a new ticket
    if (!isModerator && activeTicket.status === 'closed') {
      const newTicket = await createNewTicket(userId)
      if (newTicket) {
        currentTicketId = newTicket.id
        setActiveTicket(newTicket)
        setUserTickets(prev => [newTicket, ...prev])
      } else {
        setNewMessage(msgText)
        setSending(false)
        return
      }
    }

    const { data, error } = await client
      .from('support_messages')
      .insert({
        ticket_id: currentTicketId,
        sender_id: userId,
        message: msgText
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      setNewMessage(msgText)
      alert('Ошибка при отправке сообщения. Проверьте соединение или настройки БД.')
    } else {
      // Optimistically add message if real-time is slow
      setMessages(prev => [...prev, data as Message])
      scrollToBottom()

      // Показываем плашку "Запрос отправлен"
      setShowSupportNotice(true)
      setTimeout(() => setShowSupportNotice(false), 4000)

      await client
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentTicketId)
      
      if (isModerator) {
        notifyUser(currentTicketId, msgText)
      }
    }

    setSending(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeTicket || !userId) return

    const client = getSupabase()
    if (!client) return

    setSending(true)
    let currentTicketId = activeTicket.id

    // If ticket is closed and user is sending a message, create a new ticket
    if (!isModerator && activeTicket.status === 'closed') {
      const newTicket = await createNewTicket(userId)
      if (newTicket) {
        currentTicketId = newTicket.id
        setActiveTicket(newTicket)
        setUserTickets(prev => [newTicket, ...prev])
      } else {
        setSending(false)
        return
      }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `support/${currentTicketId}/${fileName}`

    const { error: uploadError } = await client.storage
      .from('support_assets')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      alert('Ошибка при загрузке фото. Убедитесь, что бакет support_assets создан и доступен.')
      setSending(false)
      return
    }

    const { data: { publicUrl } } = client.storage
      .from('support_assets')
      .getPublicUrl(filePath)

    const { data: msgData, error: msgError } = await client
      .from('support_messages')
      .insert({
        ticket_id: currentTicketId,
        sender_id: userId,
        message: '',
        image_url: publicUrl
      })
      .select()
      .single()
    
    if (msgError) {
      console.error('Error inserting image message:', msgError)
    } else if (msgData) {
      setMessages(prev => [...prev, msgData as Message])
      scrollToBottom()
      if (isModerator) {
        notifyUser(currentTicketId, 'Отправлено изображение')
      }
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col overflow-hidden"
    >
      <div 
        className="relative w-full flex flex-col mx-auto max-w-[375px] bg-[#0A0A0A] shadow-2xl"
        style={{ 
          height: viewportHeight, 
          top: `${viewportTop}px`,
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)'
        } as any}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-10">
          <button 
            onClick={activeTicket && isModerator ? () => setActiveTicket(null) : onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 active:scale-90 transition-all shadow-lg"
          >
            <ChevronLeft className="w-6 h-6 text-white/80" />
          </button>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[17px] font-sf-ui-medium text-white/90">
              {activeTicket ? (isModerator ? `@${activeTicket.profiles?.tag}` : 'Поддержка') : ''}
            </span>
          </div>
          {activeTicket && isModerator && activeTicket.status === 'open' && (
            <button 
              onClick={handleCloseTicket}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 active:scale-95 transition-all"
            >
              <div className="w-5 h-[2px] bg-red-400 rounded-full" />
            </button>
          )}
          {!isModerator && activeTicket && (
            <div className="w-10" />
          )}
          {!activeTicket && (
            <div className="w-10" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {!activeTicket && isModerator ? (
            // Moderator: Tickets List
            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between px-3 mb-4">
                <div className="flex flex-col">
                  <h2 className="text-[24px] font-ttc-bold text-white tracking-tight">Тикеты</h2>
                  <p className="text-[12px] text-white/20 font-sf-ui-medium uppercase tracking-widest">Управление поддержкой</p>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-[20px] bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-[11px] text-white/60 font-sf-ui-bold uppercase tracking-widest">Live</span>
                </div>
              </div>

              {tickets.map(ticket => {
                const isUnanswered = (ticket as any).lastMessageSenderId === ticket.user_id && ticket.status === 'open'
                
                return (
                  <div key={ticket.id} className="relative group px-1">
                    {/* Delete Background - Hidden until swipe starts */}
                    <div className="absolute inset-0 bg-red-500/10 rounded-[32px] flex items-center justify-end px-8 border border-red-500/20 opacity-0 group-active:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center gap-1">
                        <Trash2 className="w-6 h-6 text-red-400" />
                        <span className="text-[10px] text-red-400/60 font-sf-ui-bold uppercase">Удалить</span>
                      </div>
                    </div>
                    
                    {/* Ticket Card */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: -100, right: 0 }}
                      onDragStart={() => {
                        const bg = document.getElementById(`delete-bg-${ticket.id}`)
                        if (bg) bg.style.opacity = '1'
                      }}
                      onDragEnd={(_, info) => {
                        const bg = document.getElementById(`delete-bg-${ticket.id}`)
                        if (bg && info.offset.x >= -60) bg.style.opacity = '0'
                        
                        if (info.offset.x < -60) {
                          handleDeleteTicket(ticket.id)
                        }
                      }}
                      className="relative z-10 w-full"
                    >
                      <div id={`delete-bg-${ticket.id}`} className="absolute inset-0 bg-red-500/20 rounded-[32px] border border-red-500/30 opacity-0 transition-opacity pointer-events-none" />
                      <button
                        onClick={() => setActiveTicket(ticket)}
                        className={`w-full flex items-center gap-4 p-5 bg-[#0A0A0A] border border-white/10 rounded-[32px] hover:bg-white/[0.04] hover:border-white/20 active:scale-[0.98] transition-all text-left shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${isUnanswered ? 'ring-1 ring-blue-500/30 bg-blue-500/[0.04]' : ''}`}
                      >
                        <div className="relative">
                          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden shadow-inner">
                            {ticket.profiles?.avatar_url ? (
                              <img src={ticket.profiles.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-7 h-7 text-white/20" />
                            )}
                          </div>
                          {isUnanswered && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-[3px] border-[#0A0A0A] flex items-center justify-center shadow-lg">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-ttc-bold text-[17px] text-white/90 truncate flex items-center gap-2">
                              @{ticket.profiles?.tag || 'User'}
                              {ticket.profiles?.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                            </span>
                            <span className="text-[11px] text-white/20 font-sf-ui-medium tracking-tight">
                              {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className={`text-[14px] truncate font-sf-ui-medium mb-3 leading-tight ${isUnanswered ? 'text-white/80' : 'text-white/40'}`}>
                            {(ticket as any).lastMessage || 'Нет сообщений'}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-3 py-1 rounded-full font-sf-ui-bold uppercase tracking-widest ${
                                ticket.status === 'open' 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                  : 'bg-white/5 text-white/30 border border-white/5'
                              }`}>
                                {ticket.status === 'open' ? 'Активен' : 'Архив'}
                              </span>
                              {isUnanswered && (
                                <span className="text-[9px] px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-sf-ui-bold uppercase tracking-widest shadow-[0_0_12px_rgba(59,130,246,0.1)]">
                                  Ждет ответа
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-white/10 font-sf-ui-bold uppercase tracking-widest">
                              ID: {ticket.id.slice(0, 4)}
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  </div>
                )
              })}

              {tickets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
                  <div className="w-24 h-24 rounded-[32px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 flex items-center justify-center mb-8 shadow-2xl relative group">
                    <div className="absolute inset-0 bg-blue-500/5 rounded-[32px] blur-2xl group-hover:bg-blue-500/10 transition-all" />
                    <MessageCircle className="w-10 h-10 text-white/20 relative z-10" />
                  </div>
                  <h3 className="text-[19px] font-ttc-bold text-white mb-3">Тикетов пока нет</h3>
                  <p className="text-[14px] text-white/30 font-sf-ui-medium leading-relaxed max-w-[240px] mx-auto">
                    Все входящие обращения от пользователей появятся здесь в реальном времени.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Chat View
            <>
              {/* Warning Message */}
              {activeTicket?.status === 'open' ? (
                <div className="mx-2 mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[13px] text-amber-200/70 font-sf-ui-medium leading-relaxed text-center">
                    Пожалуйста, пишите только по делу. За спам или неадекватное поведение — блокировка без возможности восстановления.
                  </p>
                </div>
              ) : (activeTicket?.status === 'closed' && isModerator) ? (
                <div className="mx-2 mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <p className="text-[13px] text-red-200/70 font-sf-ui-medium leading-relaxed text-center">
                    Это обращение закрыто. Вы не можете отправлять сообщения в закрытый тикет.
                  </p>
                </div>
              ) : null}

              {messages.map((msg, i) => {
                const isOwn = msg.sender_id === userId
                const isAI = msg.sender_id === 'ai-bot'
                const showClosedDivider = i > 0 && messages[i-1].ticket_id !== msg.ticket_id

                return (
                  <div key={msg.id}>
                    {showClosedDivider && (
                      <div className="flex items-center gap-4 my-8 px-2">
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <span className="text-[11px] text-white/20 font-sf-ui-medium uppercase tracking-wider text-center">
                          Обращение было закрыто поддержкой
                        </span>
                        <div className="h-[1px] flex-1 bg-white/5" />
                      </div>
                    )}
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-2`}
                    >
                      <div className={`max-w-[85%] px-4 py-2.5 shadow-sm ${
                        isOwn 
                          ? 'bg-[#3390ec] text-white rounded-[20px] rounded-tr-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' 
                          : isAI
                            ? 'bg-white/10 text-white/90 rounded-[20px] rounded-tl-[4px] border border-white/20 backdrop-blur-md'
                            : 'bg-white/[0.03] backdrop-blur-2xl border border-white/10 text-white rounded-[20px] rounded-tl-[4px]'
                      }`}>
                        {isAI && (
                          <div className="flex items-center gap-1.5 mb-1 opacity-50">
                            <ShieldCheck className="w-3 h-3" />
                            <span className="text-[10px] font-sf-ui-bold uppercase tracking-tighter">AI Ассистент</span>
                          </div>
                        )}
                        {msg.image_url ? (
                          <div className="relative">
                            <img 
                              src={msg.image_url} 
                              alt="Support attachment" 
                              className="rounded-lg max-w-full mb-1"
                            />
                            <div className={`text-[10px] absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full backdrop-blur-md bg-black/20 ${isOwn ? 'text-white/70' : 'text-white/80'} flex items-center gap-1`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isOwn && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                          </div>
                        ) : (
                          <div className="relative flex items-end gap-x-2">
                            <p className="text-[15px] font-sf-ui-light leading-relaxed break-words max-w-full">
                              {msg.message}
                            </p>
                            <div className={`text-[10px] shrink-0 mb-[-2px] ${isOwn ? 'text-white/40' : 'text-white/60'} flex items-center gap-1`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isOwn && <CheckCircle2 className="w-2.5 h-2.5 opacity-70" />}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )
              })}

              {/* Добавляем плашку в конец, если текущий активный тикет закрыт */}
              {activeTicket?.status === 'closed' && (
                <div className="flex justify-center my-6 px-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
                    <span className="text-[12px] text-white/40 font-sf-ui-medium uppercase tracking-wider">
                      Обращение закрыто поддержкой
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {activeTicket && (activeTicket.status === 'open' || !isModerator) && (
          <div className="p-4 bg-transparent safe-area-bottom relative z-20">
            {/* Quick Questions / Moderator Phrases */}
            <div className="mb-3 overflow-hidden -mx-4">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar animate-scroll-questions px-4">
                {(isModerator ? moderatorPhrases : quickQuestions).concat(isModerator ? moderatorPhrases : quickQuestions).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => isModerator ? setNewMessage(q) : handleQuickQuestion(q)}
                    className="whitespace-nowrap px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/10 text-white/60 text-[13px] hover:bg-white/10 hover:text-white transition-all active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Support Notice */}
            <AnimatePresence>
              {showSupportNotice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-3"
                >
                  <div className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[13px] text-white/70 font-sf-ui-medium">Запрос отправлен в поддержку</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Support Input (Trigger) */}
            <div 
              className="flex items-center gap-3 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[26px] p-2 hover:bg-white/[0.05] transition-all cursor-text shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
              onClick={() => setIsInputModalOpen(true)}
            >
                <div className="w-10 h-10 flex items-center justify-center rounded-xl text-white/10">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex-1 text-white/30 text-[15px] py-2">
                  Сообщение...
                </div>
            </div>
          </div>
        )}

        {/* TikTok-style Input Modal for Support */}
        <AnimatePresence>
          {isInputModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md"
              style={{ 
                height: modalViewportHeight > 0 ? `${modalViewportHeight}px` : '100dvh',
                top: `${modalViewportOffset}px`,
                position: 'fixed',
                left: '50%',
                width: '100%',
                maxWidth: '375px',
                transform: 'translateX(-50%)',
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
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => setIsInputModalOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/60"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-white/40 font-sf-ui-medium text-[14px]">Запрос в поддержку</span>
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="relative flex-1">
                    <textarea
                      ref={modalInputRef}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        e.target.style.height = '52px'
                        e.target.style.height = `${e.target.scrollHeight}px`
                      }}
                      placeholder="Опишите проблему..."
                      className="w-full max-h-[160px] min-h-[52px] bg-white/5 border border-white/10 rounded-[24px] px-5 py-[14px] text-[16px] text-white outline-none focus:border-white/20 transition-all placeholder:text-white/20 resize-none font-sf-ui-light leading-normal scrollbar-hidden"
                      rows={1}
                      style={{ height: '52px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                          setIsInputModalOpen(false)
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      handleSendMessage()
                      setIsInputModalOpen(false)
                    }}
                    disabled={!newMessage.trim() || sending}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 self-end mb-[2px] ${
                      newMessage.trim() && !sending ? 'bg-white text-black active:scale-90' : 'bg-white/5 text-white/20'
                    }`}
                  >
                    <ArrowUp className="w-6 h-6" strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scrollQuestions {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-questions {
          width: max-content;
          animation: scrollQuestions 40s linear infinite;
        }
        .animate-scroll-questions:hover {
          animation-play-state: paused;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  )
}
