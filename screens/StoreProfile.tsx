import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Settings, 
  Users, 
  Package, 
  MapPin, 
  Info,
  Trash2,
  X,
  Camera,
  UserPlus,
  UserMinus,
  Bell,
  BellOff,
  Search,
  RefreshCw
} from 'lucide-react'
import { getSupabase } from '../lib/supabaseClient'
import VerifiedBadge from '../components/VerifiedBadge'
import QualityBadge from '../components/QualityBadge'
import ModeratorBadge from '../components/ModeratorBadge'

interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  owner_id: string
  city: string | null
  verified: boolean
  rating: number
  is_verified?: boolean
  is_quality?: boolean
  is_moderator?: boolean
}

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  profiles: {
    tag: string | null
    avatar_url: string | null
  }
}

interface Ad {
  id: string
  title: string
  price: string
  images: string[]
  category: string
  created_at: string
}

export default function StoreProfile({
  storeId,
  currentUserId,
  onOpenProfileById,
}: {
  storeId: string
  currentUserId: string | null
  onOpenProfileById?: (id: string) => void
}) {
  const [store, setStore] = useState<Store | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ads' | 'about' | 'staff'>('ads')
  const [isOwner, setIsOwner] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)

  useEffect(() => {
    loadStoreData()
  }, [storeId])

  const loadStoreData = async () => {
    if (!isRefreshing) setLoading(true)
    const client = getSupabase()
    if (!client) return

    try {
      // Load store info
      const { data: storeData, error: storeError } = await client
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single()

      if (storeError) throw storeError
      setStore(storeData)
      setIsOwner(storeData.owner_id === currentUserId)

      // Load members
      const { data: membersData } = await client
        .from('store_members')
        .select('*, profiles(tag, avatar_url)')
        .eq('store_id', storeId)
      
      setMembers(membersData || [])

      // Load ads
      const { data: adsData } = await client
        .from('ads')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
      
      setAds(adsData || [])

      // Check following
      if (currentUserId) {
        const { data: followData } = await client
          .from('store_follows')
          .select('*')
          .eq('store_id', storeId)
          .eq('user_id', currentUserId)
          .maybeSingle()
        
        setIsFollowing(!!followData)
        if (followData) setNotificationsEnabled(followData.notifications_enabled)
      }
    } catch (e) {
      console.error('Error loading store data:', e)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].pageY
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      const currentY = e.touches[0].pageY
      const distance = currentY - startYRef.current
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.4, 80))
      }
    }
  }

  const onTouchEnd = () => {
    if (pullDistance > 60) {
      setIsRefreshing(true)
      loadStoreData()
    } else {
      setPullDistance(0)
    }
  }

  const handleAvatarUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !store) return
    const file = files[0]
    const client = getSupabase()
    if (!client) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}-${Math.random()}.${fileExt}`
      const filePath = `store-avatars/${fileName}`

      const { error: uploadError } = await client.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = client.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await client
        .from('stores')
        .update({ avatar_url: publicUrl })
        .eq('id', store.id)

      if (updateError) throw updateError
      setStore({ ...store, avatar_url: publicUrl })
    } catch (e) {
      console.error('Error uploading avatar:', e)
    }
  }

  const toggleFollow = async () => {
    if (!currentUserId || !store) return
    const client = getSupabase()
    if (!client) return

    try {
      if (isFollowing) {
        await client
          .from('store_follows')
          .delete()
          .eq('store_id', store.id)
          .eq('user_id', currentUserId)
        setIsFollowing(false)
      } else {
        await client
          .from('store_follows')
          .insert({
            store_id: store.id,
            user_id: currentUserId,
            notifications_enabled: true
          })
        setIsFollowing(true)
        setNotificationsEnabled(true)
      }
    } catch (e) {
      console.error('Error toggling follow:', e)
    }
  }

  if (loading || !store) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-[#0A0A0A]">
      {/* Header / Cover Area - Fully Transparent */}
      <div className="relative w-full h-[100px] bg-transparent overflow-hidden" />

      {/* Profile Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 -mt-[50px] relative z-10 pb-20 scrollbar-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull-to-refresh Indicator */}
        <div 
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-50 transition-all duration-200"
          style={{ 
            top: 10,
            opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
          }}
        >
          <div 
            className="bg-[#1A1A1A] p-2 rounded-full border border-white/10 shadow-2xl"
            style={{ 
              transform: `translateY(${pullDistance}px)`
            }}
          >
            <RefreshCw 
              size={18} 
              className={`text-white/60 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${pullDistance * 2}deg)` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-white/10 border-4 border-[#0A0A0A] shadow-[0_0_30px_rgba(0,0,0,0.6),0_4px_20px_rgba(0,0,0,0.8)]">
              {store.avatar_url ? (
                <img src={store.avatar_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-ttc-bold bg-gradient-to-br from-white/10 to-white/5">
                  {store.name[0].toUpperCase()}
                </div>
              )}
            </div>
            {isOwner && (
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]"
              >
                <Camera size={24} className="text-white" />
              </button>
            )}
            <input 
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarUpload(e.target.files)}
            />
          </div>

          {/* Name & City */}
          <div className="mt-4 w-full flex items-center justify-center">
            {/* Left side badges for symmetry */}
            <div className="flex-1 flex justify-end items-center gap-2 mr-4">
              {store.is_moderator && <ModeratorBadge size={22} />}
              {store.is_quality && <QualityBadge size={22} />}
            </div>

            <h1 className="text-[28px] font-ttc-bold text-white leading-tight flex items-center justify-center gap-2">
              {store.name}
            </h1>

            {/* Right side badges */}
            <div className="flex-1 flex items-center gap-2 ml-4">
              {(store.is_verified || store.verified) && <VerifiedBadge size={22} />}
            </div>
          </div>

          {store.city && (
            <div className="mt-1 flex items-center justify-center gap-1 text-white/40 text-[14px]">
              <MapPin size={14} />
              {store.city}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 w-full max-w-[320px]">
            {isOwner ? (
              <button 
                onClick={() => setShowSettings(true)}
                className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-white font-sf-ui-medium active:scale-95 transition-all"
              >
                <Settings size={18} />
                Настройки
              </button>
            ) : (
              <>
                <button 
                  onClick={toggleFollow}
                  className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-vk-demi active:scale-95 transition-all ${
                    isFollowing 
                      ? 'bg-white/5 border border-white/10 text-white' 
                      : 'bg-white text-black'
                  }`}
                >
                  {isFollowing ? 'Вы подписаны' : 'Подписаться'}
                </button>
                {isFollowing && (
                  <button 
                    onClick={async () => {
                      const client = getSupabase()
                      if (!client || !currentUserId) return
                      const newVal = !notificationsEnabled
                      await client
                        .from('store_follows')
                        .update({ notifications_enabled: newVal })
                        .eq('store_id', store.id)
                        .eq('user_id', currentUserId)
                      setNotificationsEnabled(newVal)
                    }}
                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} className="text-white/40" />}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Stats */}
          <div className="mt-8 flex w-full max-w-[320px] justify-between px-4">
            <div className="text-center">
              <div className="text-[18px] font-ttc-bold text-white">{ads.length}</div>
              <div className="text-[12px] text-white/40 uppercase tracking-wider">Товары</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-ttc-bold text-white">{members.length}</div>
              <div className="text-[12px] text-white/40 uppercase tracking-wider">Команда</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-ttc-bold text-white">{store.rating}</div>
              <div className="text-[12px] text-white/40 uppercase tracking-wider">Рейтинг</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
          {[
            { id: 'ads', label: 'Товары', icon: Package },
            { id: 'staff', label: 'Команда', icon: Users },
            { id: 'about', label: 'Описание', icon: Info },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[14px] font-sf-ui-medium transition-all ${
                tab === t.id ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {tab === 'ads' && (
              <motion.div
                key="ads"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-3"
              >
                {ads.length > 0 ? (
                  ads.map((ad) => (
                    <button 
                      key={ad.id}
                      className="aspect-[4/5] rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative group active:scale-95 transition-all"
                    >
                      {ad.images?.[0] && (
                        <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                        <div className="text-white font-ttc-bold text-[15px] truncate">{ad.title}</div>
                        <div className="text-white/60 text-[13px]">{ad.price} ₽</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-20 text-center text-white/20 font-sf-ui-light">
                    Здесь пока нет товаров
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'staff' && (
              <motion.div
                key="staff"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onOpenProfileById?.(m.user_id)}
                    className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 active:scale-[0.98] transition-all"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                      {m.profiles.avatar_url ? (
                        <img src={m.profiles.avatar_url} alt={m.profiles.tag || ''} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-vk-demi bg-gradient-to-br from-blue-500 to-purple-500">
                          {m.profiles.tag?.[0].toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-sf-ui-medium text-[16px]">@{m.profiles.tag}</div>
                      <div className="text-white/40 text-[13px] capitalize">{m.role === 'owner' ? 'Владелец' : m.role === 'admin' ? 'Админ' : 'Сотрудник'}</div>
                    </div>
                    <ChevronRight size={18} className="text-white/20" />
                  </button>
                ))}
              </motion.div>
            )}

            {tab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-[32px] bg-[#111111]/80 border border-[#2B2B2B] backdrop-blur-xl"
              >
                <div className="bg-[#0D0D0D] px-3 py-2 leading-[1.6em] text-[#A1A1A1] whitespace-pre-wrap text-[15px] rounded-[24px]">
                  {store.description || 'Описание не заполнено.'}
                </div>
                <div className="mt-4 bg-[#101010] p-4 rounded-[28px]">
                  <div className="mb-2 font-ttc-bold text-white text-[17px]">О магазине</div>
                  {store.city && (
                    <div className="flex items-center gap-3 text-white/60">
                      <MapPin size={18} />
                      <span className="text-[15px]">{store.city}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <StoreSettingsModal 
            store={store} 
            members={members}
            onClose={() => setShowSettings(false)}
            onUpdate={(updated) => {
              setStore(updated)
              loadStoreData() // Refresh to get updated members etc
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StoreSettingsModal({ 
  store, 
  members,
  onClose, 
  onUpdate 
}: { 
  store: Store
  members: Member[]
  onClose: () => void
  onUpdate: (store: Store) => void 
}) {
  const [name, setName] = useState(store.name)
  const [description, setDescription] = useState(store.description || '')
  const [city, setCity] = useState(store.city || '')
  const [loading, setLoading] = useState(false)
  const [staffTab, setStaffTab] = useState(false)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [staffSearch, setStaffSearch] = useState('')
  const [staffResults, setStaffResults] = useState<{ id: string; tag: string; avatar_url: string | null }[]>([])
  const [staffSearchLoading, setStaffSearchLoading] = useState(false)

  useEffect(() => {
    if (!staffSearch.trim()) {
      setStaffResults([])
      return
    }
    const timer = setTimeout(() => searchUsers(), 500)
    return () => clearTimeout(timer)
  }, [staffSearch])

  const searchUsers = async () => {
    const client = getSupabase()
    if (!client) return
    setStaffSearchLoading(true)
    try {
      const { data } = await client
        .from('profiles')
        .select('id, tag, avatar_url')
        .ilike('tag', `%${staffSearch}%`)
        .limit(5)
      
      if (data) {
        setStaffResults(data as any)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setStaffSearchLoading(false)
    }
  }

  const addMember = async (userId: string) => {
    const client = getSupabase()
    if (!client) return
    try {
      const { error } = await client
        .from('store_members')
        .insert({
          store_id: store.id,
          user_id: userId,
          role: 'member'
        })
      if (error) throw error
      setStaffSearch('')
      setShowAddStaff(false)
      onUpdate(store)
    } catch (e) {
      alert('Пользователь уже в команде или ошибка')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const client = getSupabase()
    if (!client) return

    try {
      const { data, error } = await client
        .from('stores')
        .update({
          name: name.trim(),
          description: description.trim(),
          city: city.trim()
        })
        .eq('id', store.id)
        .select()
        .single()

      if (error) throw error
      onUpdate(data)
      onClose()
    } catch (e) {
      console.error('Error updating store:', e)
      alert('Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (memberId: string) => {
    const client = getSupabase()
    if (!client) return
    if (!confirm('Удалить сотрудника?')) return

    try {
      await client.from('store_members').delete().eq('id', memberId)
      onUpdate(store) // Just trigger refresh
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-[400px] bg-[#111111] rounded-t-[40px] border-t border-white/10 p-8 pb-12 max-h-[90dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[24px] font-ttc-bold text-white">Настройки магазина</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="flex gap-2 mb-8 p-1 rounded-xl bg-white/5">
          <button 
            onClick={() => setStaffTab(false)}
            className={`flex-1 h-10 rounded-lg text-[14px] font-sf-ui-medium transition-all ${!staffTab ? 'bg-white text-black' : 'text-white/40'}`}
          >
            Основное
          </button>
          <button 
            onClick={() => setStaffTab(true)}
            className={`flex-1 h-10 rounded-lg text-[14px] font-sf-ui-medium transition-all ${staffTab ? 'bg-white text-black' : 'text-white/40'}`}
          >
            Команда ({members.length})
          </button>
        </div>

        {!staffTab ? (
          <div className="space-y-6">
            <div>
              <div className="mb-2 text-[13px] text-white/40 ml-1">Название</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div>
              <div className="mb-2 text-[13px] text-white/40 ml-1">Описание</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 rounded-2xl bg-white/5 border border-white/10 p-4 text-white outline-none focus:border-white/20 transition-all resize-none"
              />
            </div>
            <div>
              <div className="mb-2 text-[13px] text-white/40 ml-1">Город</div>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-white/20 transition-all"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full h-14 rounded-4xl bg-white text-black font-vk-demi text-[16px] active:scale-95 transition-all mt-4"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
                  {m.profiles.avatar_url && <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="text-white font-sf-ui-medium">@{m.profiles.tag}</div>
                  <div className="text-white/40 text-[12px] capitalize">{m.role}</div>
                </div>
                {m.role !== 'owner' && (
                  <button 
                    onClick={() => removeMember(m.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}

            {!showAddStaff ? (
              <button 
                className="w-full h-14 rounded-2xl border border-dashed border-white/20 flex items-center justify-center gap-2 text-white/60 hover:text-white hover:border-white/40 transition-all"
                onClick={() => setShowAddStaff(true)}
              >
                <UserPlus size={18} />
                Добавить сотрудника
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                      <Search size={16} />
                    </span>
                    <input
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      placeholder="Введите @тег..."
                      autoFocus
                      className="w-full h-12 rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 text-white outline-none focus:border-white/20 transition-all text-[14px]"
                    />
                  </div>
                  <button onClick={() => setShowAddStaff(false)} className="p-3 text-white/40 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                {staffSearchLoading && <div className="text-center py-4 text-white/20 text-sm italic">Поиск...</div>}
                
                <div className="space-y-2">
                  {staffResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => addMember(u.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-[10px] font-vk-demi text-white/40">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.tag?.[0].toUpperCase()}
                      </div>
                      <span className="text-white font-sf-ui-medium text-[14px]">@{u.tag}</span>
                      <Plus size={16} className="ml-auto text-white/40" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
