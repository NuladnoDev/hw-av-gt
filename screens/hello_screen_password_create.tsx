'use client'

import { useEffect, useState } from 'react'

export default function HelloScreenPasswordCreate({
  onBack,
  onNext,
}: {
  onBack?: () => void
  onNext?: () => void
}) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [scale, setScale] = useState(1)

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
            const event = new CustomEvent('password-back')
            window.dispatchEvent(event)
          }}
          className="group absolute left-[24px] top-[44px] flex h-[32px] w-[32px] items-center justify-center rounded-full bg-transparent"
        >
          <img
            src="/interface/str.svg"
            alt="back"
            className="h-[22px] w-[22px] transition-transform group-active:-translate-x-1"
          />
        </button>

        <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform px-6 flex flex-col items-center">
          <svg
            width="115"
            height="115"
            viewBox="0 0 115 115"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-10"
          >
            <path
              d="M97.2708 24.4375L103.979 17.7292C105.896 15.8125 105.896 12.9375 103.979 11.0208C102.062 9.10418 99.1875 9.10418 97.2708 11.0208L46.9583 61.3333C43.125 58.9375 38.3333 57.5 33.5416 57.5C20.125 57.5 9.58331 68.0417 9.58331 81.4584C9.58331 94.875 20.125 105.417 33.5416 105.417C46.9583 105.417 57.5 94.875 57.5 81.4584C57.5 76.6667 56.0625 71.875 53.6666 68.0417L77.1458 44.5625L83.8541 51.2708C85.7708 53.1875 88.6458 53.1875 90.5625 51.2708C92.4791 49.3542 92.4791 46.4792 90.5625 44.5625L83.8541 37.8542L90.5625 31.1458L97.2708 37.8542C99.1875 39.7708 102.062 39.7708 103.979 37.8542C105.896 35.9375 105.896 33.0625 103.979 31.1458L97.2708 24.4375ZM33.5416 95.8334C25.3958 95.8334 19.1666 89.6042 19.1666 81.4584C19.1666 73.3125 25.3958 67.0833 33.5416 67.0833C41.6875 67.0833 47.9166 73.3125 47.9166 81.4584C47.9166 89.6042 41.6875 95.8334 33.5416 95.8334Z"
              fill="#FFD900"
            />
          </svg>
          <div className="mb-2 w-full text-center text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
            Создайте пароль
          </div>
          <div className="mb-6 w-full text-center text-[16px] leading-[1.4em] text-[#A1A1A1]">
            Придумайте надёжный пароль для вашего профиля
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
            {false && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#D45E5E]">
                пароль слишком простой
              </span>
            )}
            {password.length > 0 && (
              <span
                onClick={() => setShow((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer select-none text-[14px] leading-[1.3em] text-[#FFD900] transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                {show ? 'скрыть' : 'показать'}
              </span>
            )}
          </div>

          <label className="self-start mb-2 text-[14px] leading-[1.3em] text-[#BDBDBD]">
            Введите пароль ещё раз
          </label>
          <div className="relative mb-4 w-full">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="пароль"
              className={`h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-4 pr-24 text-[16px] leading-[1.4em] text-white outline-none ${showConfirm ? 'reveal-text' : ''}`}
            />
            {false && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#D45E5E]">
                пароли не совпадают
              </span>
            )}
            {confirm.length > 0 && (
              <span
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer select-none text-[14px] leading-[1.3em] text-[#FFD900] transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                {showConfirm ? 'скрыть' : 'показать'}
              </span>
            )}
          </div>

          <button
            type="button"
            className="mt-2 h-[47px] w-full rounded-[10px] bg-[#111111] text-center"
            onClick={() => {
              if (onNext) {
                onNext()
                return
              }
              const event = new CustomEvent('password-next', { detail: { password } })
              window.dispatchEvent(event)
            }}
          >
            <span className="inline-block text-[18px] font-semibold leading-[1.25em] tracking-[0.015em] text-white font-vk-demi">
              Продолжить
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
