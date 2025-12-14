'use client'

import { useEffect, useState } from 'react'

export default function HomeScreen() {
  const [scale, setScale] = useState(1)
  const [tab, setTab] = useState<'ads' | 'feed' | 'profile'>('feed')

  useEffect(() => {
    const baseW = 375
    const baseH = 812
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = Math.min(vw / baseW, vh / baseH)
      setScale(Math.max(1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#171717] overflow-hidden">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#171717]" />

        <div
          className="absolute left-0 w-full px-6 flex items-center justify-between"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
            {tab === 'ads' ? 'Объявления' : tab === 'feed' ? 'Лента' : 'Профиль'}
          </div>
          <div className="flex items-center gap-4">
            <img
              src="/navigation/filers.svg"
              alt="filters"
              className="h-[22px] w-[22px]"
            />
            <img
              src="/navigation/plus.svg"
              alt="add"
              className="h-[20px] w-[20px]"
            />
          </div>
        </div>

        <div
          className="absolute left-0 w-full px-6"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)', height: 'calc(812px - 88px - 56px - var(--home-header-offset))' }}
        >
          {tab === 'feed' && (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center text-[16px] leading-[1.4em] text-[#A1A1A1]">
                Лента пуста
              </div>
            </div>
          )}
          {tab === 'ads' && (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center text-[16px] leading-[1.4em] text-[#A1A1A1]">
                Объявления пусты
              </div>
            </div>
          )}
          {tab === 'profile' && (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center text-[16px] leading-[1.4em] text-[#A1A1A1]">
                Профиль
              </div>
            </div>
          )}
        </div>

        <div
          className="absolute left-0 w-full bg-[#171717]"
          style={{ height: '88px', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <div className="absolute -top-[0.5px] left-0 w-full" style={{ height: '0.5px', background: 'rgba(255,255,255,0.1)' }} />
          <div className="grid h-full w-full grid-cols-3">
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1"
              onClick={() => setTab('ads')}
            >
              <img
                src="/navigation/bag-04%201.svg"
                alt="Объявления"
                className="h-[24px] w-[24px]"
                style={{ opacity: tab === 'ads' ? 1 : 0.6 }}
              />
              <span className={`text-[12px] ${tab === 'ads' ? 'text-white' : 'text-white/60'}`}>
                Объявления
              </span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1"
              onClick={() => setTab('feed')}
            >
              <img
                src="/navigation/House%201.svg"
                alt="Лента"
                className="h-[24px] w-[24px]"
                style={{ opacity: tab === 'feed' ? 1 : 0.6 }}
              />
              <span className={`text-[12px] ${tab === 'feed' ? 'text-white' : 'text-white/60'}`}>
                Лента
              </span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1"
              onClick={() => setTab('profile')}
            >
              <img
                src="/navigation/Vector.svg"
                alt="Профиль"
                className="h-[24px] w-[24px]"
                style={{ opacity: tab === 'profile' ? 1 : 0.6 }}
              />
              <span className={`text-[12px] ${tab === 'profile' ? 'text-white' : 'text-white/60'}`}>
                Профиль
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
