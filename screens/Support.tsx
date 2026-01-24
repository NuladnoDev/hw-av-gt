'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Send, Image as ImageIcon, User, ShieldCheck, Clock, CheckCircle2, MessageCircle, Trash2 } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
              profiles (tag, avatar_url),
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
            avatar_url
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

    const { error } = await client
      .from('support_tickets')
      .delete()
      .eq('id', ticketId)

    if (!error) {
      setTickets(prev => prev.filter(t => t.id !== ticketId))
      if (activeTicket?.id === ticketId) setActiveTicket(null)
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
      <div className="flex flex-col h-full mx-auto w-full max-w-[375px] bg-[#0A0A0A] relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-10">
          <button 
            onClick={activeTicket && isModerator ? () => setActiveTicket(null) : onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center flex-1 -mt-1">
            <span className="text-[17px] font-sf-ui-medium text-white/90">
              {activeTicket ? (isModerator ? `@${activeTicket.profiles?.tag}` : 'Поддержка') : ''}
            </span>
          </div>
          {activeTicket && isModerator && activeTicket.status === 'open' && (
            <button 
              onClick={handleCloseTicket}
              className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 active:scale-95 transition-all"
            >
              <span className="text-[12px] text-red-400 font-sf-ui-medium">Закрыть</span>
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
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <h2 className="text-[20px] font-ttc-bold text-white">Все обращения</h2>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[11px] text-white/50 font-sf-ui-medium uppercase tracking-wider">Live</span>
                </div>
              </div>

              {tickets.map(ticket => {
                const isUnanswered = (ticket as any).lastMessageSenderId === ticket.user_id && ticket.status === 'open'
                
                return (
                  <div key={ticket.id} className="relative group">
                    {/* Delete Background */}
                    <div className="absolute inset-0 bg-red-500/20 rounded-3xl flex items-center justify-end px-8">
                      <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    
                    {/* Ticket Card */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: -100, right: 0 }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -60) {
                          handleDeleteTicket(ticket.id)
                        }
                      }}
                      className="relative z-10 w-full"
                    >
                      <button
                        onClick={() => setActiveTicket(ticket)}
                        className={`w-full flex items-center gap-4 p-5 bg-[#121212] border border-white/5 rounded-3xl hover:border-white/10 active:scale-[0.98] transition-all text-left shadow-lg ${isUnanswered ? 'ring-1 ring-blue-500/30 bg-blue-500/[0.02]' : ''}`}
                      >
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0 border border-white/10">
                            {ticket.profiles?.avatar_url ? (
                              <img src={ticket.profiles.avatar_url} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              <User className="w-7 h-7 text-white/40" />
                            )}
                          </div>
                          {isUnanswered && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-[#121212]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-ttc-bold text-[16px] text-white/90 truncate">
                              @{ticket.profiles?.tag || 'User'}
                            </span>
                            <span className="text-[11px] text-white/30 font-sf-ui-medium">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className={`text-[14px] truncate font-sf-ui-medium mb-3 ${isUnanswered ? 'text-white/80' : 'text-white/40'}`}>
                            {(ticket as any).lastMessage}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-ttc-bold uppercase tracking-wider ${
                                ticket.status === 'open' 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                  : 'bg-white/5 text-white/30 border border-white/5'
                              }`}>
                                {ticket.status === 'open' ? 'Открыт' : 'Закрыт'}
                              </span>
                              {isUnanswered && (
                                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-ttc-bold uppercase tracking-wider">
                                  Нужен ответ
                                </span>
                              )}
                            </div>
                            <div className="flex -space-x-2">
                              {/* Optional: Show icons of moderators who participated */}
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
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <MessageCircle className="w-10 h-10 text-white/10" />
                  </div>
                  <h3 className="text-[17px] font-ttc-bold text-white/90 mb-2">Обращений пока нет</h3>
                  <p className="text-[14px] text-white/30 font-sf-ui-light leading-relaxed">
                    Когда пользователи напишут в поддержку, они появятся здесь в реальном времени.
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
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-4`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isOwn 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5'
                      }`}>
                        {msg.image_url ? (
                          <img 
                            src={msg.image_url} 
                            alt="Support attachment" 
                            className="rounded-lg max-w-full mb-2"
                          />
                        ) : (
                          <p className="text-[15px] font-sf-ui-light leading-relaxed break-words">
                            {msg.message}
                          </p>
                        )}
                        <div className={`text-[10px] mt-1 ${isOwn ? 'text-white/50' : 'text-white/30'} flex items-center gap-1`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && <CheckCircle2 className="w-3 h-3" />}
                        </div>
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
          <div className="p-4 border-t border-white/5 bg-[#0A0A0A] safe-area-bottom">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 pr-3 focus-within:border-blue-500/50 transition-colors">
                <button 
                  onClick={() => {/* fileInputRef.current?.click() */}}
                  disabled={true}
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-white/10 cursor-not-allowed"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={sending}
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Задайте вопрос"
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none shadow-none text-white text-[15px] font-sf-ui-light py-2"
                  disabled={sending}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                    newMessage.trim() && !sending 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-white/5 text-white/20'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
          </div>
        )}
      </div>

      <style jsx>{`
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
