'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { X, ChevronRight } from 'lucide-react'
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
      className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <motion.div
        className="relative h-[812px] w-[375px] bg-[#0A0A0A]"
        style={{ transform: `scale(${scale})` }}
        initial={{ y: 812 }}
        animate={{ y: 0 }}
        exit={{ y: 812 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Header */}
        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-4 p-2 -ml-1 rounded-lg hover:bg-white/5 active:scale-95 transition-all duration-300"
              aria-label="Назад"
            >
              <X size={24} className="text-white" />
            </button>
            <div className="text-white" style={{ fontSize: 'var(--profile-name-size, 20px)' }}>
              Поиск пользователей
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div
          className="absolute left-0 w-full px-4"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + 16px)' }}
        >
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=""
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sf-ui-light focus:outline-none focus:border-white/30 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-all"
                aria-label="Очистить"
              >
                <X size={18} className="text-white/40" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div
          className="absolute left-0 w-full px-4 overflow-y-auto"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px + 16px + 60px)',
            height: 'calc(812px - 56px - 16px - 60px - var(--home-header-offset))',
          }}
        >
          {/* Show loading only if we don't have results yet */}
          {searchLoading && searchResults.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/60 text-sm">Поиск...</div>
            </div>
          )}
          
          {/* Show no results only if we're not loading and have no results */}
          {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/60 text-sm">Пользователи не найдены</div>
            </div>
          )}

          {/* Show results if we have them and query is not empty */}
          {searchResults.length > 0 && searchQuery.trim() && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <motion.button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectUser(user.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
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
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: gradient }}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.tag}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitialLetter(user.tag)
                        )}
                      </div>
                    )
                  })()}
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">@{user.tag}</div>
                  </div>
                  <ChevronRight size={20} className="text-white/40" />
                </motion.button>
              ))}
            </div>
          )}

          {!searchQuery.trim() && (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/60 text-sm text-center">
                {/* Начните вводить ник пользователя для поиска */}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}