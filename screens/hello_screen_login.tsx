'use client'

import { useEffect, useState } from 'react'

export default function HelloScreenLogin({
  onBack,
}: {
  onBack?: () => void
}) {
  const [scale, setScale] = useState(1)
  const [tag, setTag] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0A0A0A]">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px] bg-[#0A0A0A]" />

        <button
          type="button"
          onClick={() => {
            if (onBack) {
              onBack()
              return
            }
            const event = new CustomEvent('login-back')
            window.dispatchEvent(event)
          }}
          className="group absolute left-[24px] top-[44px] z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full bg-transparent"
        >
          <img
            src="/interface/str.svg"
            alt="back"
            className="h-[22px] w-[22px] transition-transform group-active:-translate-x-1"
          />
        </button>

        <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform px-6 flex flex-col items-center">
          <svg
            width="122"
            height="122"
            viewBox="0 0 122 122"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-10"
          >
            <path d="M103.698 109.8L103.699 91.5016C103.7 81.3942 95.5066 73.2 85.3992 73.2H36.6029C26.4969 73.2 18.304 81.3919 18.3029 91.4979L18.3008 109.8M79.3008 30.5C79.3008 40.6068 71.1076 48.8 61.0008 48.8C50.894 48.8 42.7008 40.6068 42.7008 30.5C42.7008 20.3932 50.894 12.2 61.0008 12.2C71.1076 12.2 79.3008 20.3932 79.3008 30.5Z" stroke="#FFD900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="mb-2 w-full text-center text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
            Вход
          </div>
          <div className="mb-6 w-full text-center text-[16px] leading-[1.4em] text-[#A1A1A1]">
            Введите ваш тег и пароль
          </div>

          <label className="self-start mb-2 text-[14px] leading-[1.3em] text-[#BDBDBD]">
            Тег
          </label>
          <div className="relative mb-4 w-full">
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="durov"
              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-4 pr-28 text-[16px] leading-[1.4em] text-white outline-none"
            />
            {tag.trim().length > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#86D671] slide-in-up">
                тег найден
              </span>
            )}
          </div>

          <label className="self-start mb-2 text-[14px] leading-[1.3em] text-[#BDBDBD]">
            Пароль
          </label>
          <div className="relative mb-4 w-full">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? 'text' : 'password'}
              placeholder="пароль"
              className={`h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-4 pr-24 text-[16px] leading-[1.4em] text-white outline-none ${show ? 'reveal-text' : ''}`}
            />
            {password.length > 0 && (
              <span
                onClick={() => setShow((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer select-none text-[14px] leading-[1.3em] text-[#FFD900] transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                {show ? 'скрыть' : 'показать'}
              </span>
            )}
          </div>

          <button
            type="button"
            className="mt-2 h-[47px] w-full rounded-[10px] bg-[#111111] text-center"
          >
            <span className="inline-block text-[18px] font-semibold leading-[1.25em] tracking-[0.015em] text-white font-vk-demi">
              Войти
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
