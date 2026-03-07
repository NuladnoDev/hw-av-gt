'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import { avatarGradients } from '@/lib/avatarGradients'

type UserSearchProps = {
  onClose: () => void
  onSelectUser: (userId: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: Array<{id: string, tag: string, avatarUrl: string | null}>
  searchLoading: boolean
  onSearch: (query: string) => void
}

type RecentUser = {
  id: string
  tag: string
  avatarUrl: string | null
}

export default function UserSearchScreen({
  onClose,
  onSelectUser,
  searchQuery,
  setSearchQuery,
  searchResults,
  searchLoading,
  onSearch
}: UserSearchProps) {
  const [scale, setScale] = useState(1)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])

  useEffect(() => {
    const saved = window.localStorage.getItem('hw-recent-searches')
    if (saved) {
      try {
        setRecentUsers(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent searches', e)
      }
    }
  }, [])

  const addToRecent = (user: RecentUser) => {
    setRecentUsers(prev => {
      const filtered = prev.filter(u => u.id !== user.id)
      const updated = [user, ...filtered].slice(0, 10)
      window.localStorage.setItem('hw-recent-searches', JSON.stringify(updated))
      return updated
    })
  }

  const clearRecent = () => {
    setRecentUsers([])
    window.localStorage.removeItem('hw-recent-searches')
  }

  useEffect(() => {
    // Prevent background scroll when search is open
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [])

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
    if (searchQuery.trim() === '') {
      return
    }
    const timer = setTimeout(() => {
      if (!searchLoading) {
        onSearch(searchQuery)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, onSearch, searchLoading])

  const getInitialLetter = (tag: string) => {
    return tag?.charAt(0)?.toUpperCase() || 'U'
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex w-full items-center justify-center bg-black/60 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <motion.div
        className="relative h-[812px] w-[375px] bg-[#0A0A0A] overflow-hidden shadow-2xl"
        style={{ transform: `scale(${scale})` }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Background Decorative Element */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/5 blur-[80px] rounded-full pointer-events-none" />

        {/* Header */}
        <div
          className="absolute left-0 w-full z-10"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 20px)', height: '56px' }}
        >
          <div className="relative h-full w-full flex items-center px-6">
            <button
              type="button"
              onClick={onClose}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl active:scale-95 transition-all duration-200"
              aria-label="Назад"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <div className="flex-1 text-center pr-[44px] text-white font-ttc-bold text-[18px]">
              Поиск
            </div>
          </div>
        </div>

        {/* Search Input Container */}
        <div
          className="absolute left-0 w-full px-6 z-10"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 20px + 56px + 12px)' }}
        >
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors z-20 pointer-events-none">
              <img
                src="/interface/search-02.svg"
                alt="search"
                className="w-5 h-5 opacity-40 group-focus-within:opacity-70 transition-opacity"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Имя пользователя..."
              className="w-full h-[56px] bg-white/5 border border-white/10 rounded-3xl pl-12 pr-12 text-white font-sf-ui-light placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all backdrop-blur-md"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 transition-all z-20"
                aria-label="Очистить"
              >
                <X size={16} className="text-white/40" />
              </button>
            )}
          </div>

          {/* Recent Searches (Telegram style) */}
          <AnimatePresence>
            {!searchQuery.trim() && recentUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/40 text-[14px] font-sf-ui-light tracking-wide">Недавние</span>
                  <button 
                    onClick={clearRecent}
                    className="text-white/20 hover:text-white/40 text-[13px] font-sf-ui-light transition-colors"
                  >
                    Очистить
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {recentUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => onSelectUser(user.id)}
                      className="flex flex-col items-center gap-2 shrink-0 group active:scale-95 transition-transform"
                    >
                      {(() => {
                        const gradientIndex = (() => {
                          const base = user.id || user.tag || 'user'
                          let sum = 0
                          for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i)
                          return sum % avatarGradients.length
                        })()
                        const gradient = avatarGradients[gradientIndex]
                        
                        return (
                          <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-white/10 shadow-lg group-hover:border-white/20 transition-colors"
                            style={{ background: gradient }}
                          >
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.tag}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="opacity-80 font-ttc-bold text-xl">{user.tag.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        )
                      })()}
                      <span className="text-white/60 text-[12px] font-sf-ui-light max-w-[64px] truncate group-hover:text-white transition-colors">
                        {user.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        <div
          className="absolute left-0 w-full px-6 overflow-y-auto pb-10"
          style={{
            top: searchQuery.trim() 
              ? 'calc(env(safe-area-inset-top, 0px) + 20px + 56px + 12px + 56px + 24px)'
              : recentUsers.length > 0 
                ? 'calc(env(safe-area-inset-top, 0px) + 20px + 56px + 12px + 56px + 24px + 120px)'
                : 'calc(env(safe-area-inset-top, 0px) + 20px + 56px + 12px + 56px + 24px)',
            height: 'calc(812px - (env(safe-area-inset-top, 0px) + 20px + 56px + 12px + 56px + 24px))',
            transition: 'top 0.3s ease-out'
          }}
        >
          {/* Show loading only if we don't have results yet */}
          {searchLoading && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
              <div className="text-white/40 text-sm font-sf-ui-light">Поиск пользователей...</div>
            </div>
          )}
          
          {/* Show no results only if we're not loading and have no results */}
          {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 mb-4 backdrop-blur-sm">
                <Search size={32} className="text-white/20" />
              </div>
              <div className="text-white/60 text-base font-sf-ui-light">Никого не нашли</div>
              <div className="text-white/30 text-sm font-sf-ui-light mt-1">Попробуйте изменить запрос</div>
            </div>
          )}

          {/* Show results if we have them and query is not empty */}
          {searchResults.length > 0 && searchQuery.trim() && (
            <div className="space-y-3">
              {searchResults.map((user, idx) => (
                <motion.button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    addToRecent(user)
                    onSelectUser(user.id)
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-[0.98] backdrop-blur-sm"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05, ease: 'easeOut' }}
                >
                  {(() => {
                    const gradientIndex = (() => {
                      const base = user.id || user.tag || 'user'
                      let sum = 0
                      for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i)
                      return sum % avatarGradients.length
                    })()
                    const gradient = avatarGradients[gradientIndex]
                    
                    return (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-white/10 shadow-lg shrink-0"
                        style={{ background: gradient }}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.tag}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="opacity-80 font-ttc-bold">{getInitialLetter(user.tag)}</span>
                        )}
                      </div>
                    )
                  })()}
                  <div className="flex-1 text-left">
                    <div className="text-white font-sf-ui-light text-[16px] leading-tight">
                      @{user.tag}
                    </div>
                    <div className="text-white/40 text-[13px] mt-0.5">
                      Нажмите, чтобы открыть профиль
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 text-white/30">
                    <ChevronRight size={18} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {!searchQuery.trim() && !searchLoading && recentUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}