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

    const currentTicketId = activeTicket.id

    const loadAndSubscribe = async () => {
      // 1. Load existing messages
      const { data, error } = await client
        .from('support_messages')
        .select('*')
        .eq('ticket_id', currentTicketId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading messages:', error)
        return null
      }

      if (!isMounted) return null

      setMessages(data || [])
      scrollToBottom()

      // 2. Subscribe to new messages
      const channel = client
        .channel(`ticket-${currentTicketId}`)
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
        .subscribe((status) => {
          console.log(`Subscription status for ticket ${currentTicketId}:`, status)
        })

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
      
      // Map tickets to include the last message text
      const ticketsWithLastMsg = (allTickets || []).map((ticket: any) => {
        const msgs = ticket.support_messages || []
        const lastMsg = msgs.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        return {
          ...ticket,
          lastMessage: lastMsg?.message || 'Нет сообщений'
        }
      })
      
      setTickets(ticketsWithLastMsg)
      setLoading(false)
    } else {
      // Fetch user's ticket (last one created)
      const { data: userTicket, error: ticketError } = await client
        .from('support_tickets')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (userTicket) {
        if (userTicket.status === 'closed') {
          setShowClosedNotice(true)
        } else {
          setActiveTicket(userTicket)
        }
      } else {
        // Create new ticket if none exists
        const { data: newTicket, error: createError } = await client
          .from('support_tickets')
          .insert({ user_id: uid })
          .select()
          .single()
        
        if (createError) {
          console.error('Error creating ticket:', createError)
        } else if (newTicket) {
          setActiveTicket(newTicket)
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeTicket || !userId || sending) return

    const client = getSupabase()
    if (!client) return

    setSending(true)
    const msgText = newMessage.trim()
    setNewMessage('')

    const { data, error } = await client
      .from('support_messages')
      .insert({
        ticket_id: activeTicket.id,
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
        .eq('id', activeTicket.id)
      
      if (isModerator) {
        notifyUser(activeTicket.id, msgText)
      }
    }

    setSending(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeTicket || !userId) return

    const client = getSupabase()
    if (!client) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `support/${activeTicket.id}/${fileName}`

    const { error: uploadError } = await client.storage
      .from('support_assets')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      alert('Ошибка при загрузке фото. Убедитесь, что бакет support_assets создан и доступен.')
      return
    }

    const { data: { publicUrl } } = client.storage
      .from('support_assets')
      .getPublicUrl(filePath)

    const { data: msgData, error: msgError } = await client
      .from('support_messages')
      .insert({
        ticket_id: activeTicket.id,
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
        notifyUser(activeTicket.id, 'Отправлено изображение')
      }
    }
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
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="relative overflow-hidden rounded-2xl">
                  {/* Delete Background */}
                  <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
                    <Trash2 className="w-6 h-6 text-white" />
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
                    className="relative z-10 w-full flex items-center gap-4 p-4 bg-[#0A0A0A] border border-white/5 active:scale-[0.98] transition-all text-left"
                    style={{ x: 0 }}
                  >
                    <button
                      onClick={() => setActiveTicket(ticket)}
                      className="flex-1 flex items-center gap-4 text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-ttc-bold text-white/90 truncate">@{ticket.profiles?.tag}</span>
                          <span className="text-[11px] text-white/30 shrink-0">{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[13px] text-white/50 truncate font-sf-ui-light mb-2">
                          {(ticket as any).lastMessage}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-white/10 text-white/40'}`}>
                            {ticket.status === 'open' ? 'Открыт' : 'Закрыт'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-[15px] font-sf-ui-light">Обращений пока нет</p>
                </div>
              )}
            </div>
          ) : !activeTicket && showClosedNotice ? (
            // User: Closed Ticket Notice
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-red-500/50" />
              </div>
              <h3 className="text-[19px] font-ttc-bold text-white mb-2">Обращение закрыто</h3>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 w-full">
                <p className="text-[15px] text-white/60 font-sf-ui-medium leading-relaxed">
                  Предыдущий тикет был закрыт поддержкой.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowClosedNotice(false)
                  // Logic to create new ticket could go here if needed
                }}
                className="mt-8 px-8 py-4 rounded-2xl bg-white text-black font-ttc-bold text-[15px] active:scale-95 transition-all"
              >
                Понятно
              </button>
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
              ) : activeTicket?.status === 'closed' ? (
                <div className="mx-2 mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <p className="text-[13px] text-red-200/70 font-sf-ui-medium leading-relaxed text-center">
                    Это обращение закрыто. Вы можете просматривать историю сообщений, но отправка новых недоступна.
                  </p>
                </div>
              ) : null}

              {messages.map((msg, i) => {
                const isOwn = msg.sender_id === userId
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
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
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {activeTicket && (
          <div className="p-4 border-t border-white/5 bg-[#0A0A0A] safe-area-bottom">
            {activeTicket.status === 'open' ? (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 pr-3 focus-within:border-blue-500/50 transition-colors">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 active:scale-90 transition-all text-white/40"
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
                  placeholder="Напишите сообщение..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white text-[15px] font-sf-ui-light py-2"
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
            ) : (
              <div className="flex items-center justify-center py-2 px-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[14px] text-white/30 font-sf-ui-medium">Обращение закрыто</span>
              </div>
            )}
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
