'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'

export default function HelloScreenPasswordCreate({
  onBack,
  onNext,
  initialError,
}: {
  onBack?: () => void
  onNext?: (password: string) => void
  initialError?: string
}) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [scale, setScale] = useState(1)
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [submitError, setSubmitError] = useState(initialError ?? '')

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

  const errorToShow = submitError || initialError || ''

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden">
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
          className="absolute left-6 top-[50px] z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Назад"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform px-6 flex flex-col items-center">
          <img
            src="/interface/key skeleton alt.svg"
            alt="key"
            className="mb-10 h-[115px] w-[115px]"
          />
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
            {passwordError && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#D45E5E]">
                {passwordError}
              </span>
            )}
            {password.length > 0 && (
              <span
                onClick={() => setShow((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer select-none text-[14px] leading-[1.3em] text-white transition-transform duration-150 hover:scale-105 active:scale-95"
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
            {confirmError && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#D45E5E]">
                {confirmError}
              </span>
            )}
            {confirm.length > 0 && (
              <span
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer select-none text-[14px] leading-[1.3em] text-white transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                {showConfirm ? 'скрыть' : 'показать'}
              </span>
            )}
          </div>

          <button
            type="button"
            className="mt-2 h-[47px] w-full rounded-[10px] bg-[#111111] text-center"
            onClick={() => {
              setSubmitError('')
              setPasswordError('')
              setConfirmError('')
              if (password.length < 6) {
                setPasswordError('минимум 6 символов')
                return
              }
              if (confirm !== password) {
                setConfirmError('пароли не совпадают')
                return
              }
              if (onNext) {
                onNext(password)
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
          {errorToShow && (
            <div className="mt-2 w-full text-center text-[14px] leading-[1.3em] text-[#D45E5E]">
              {errorToShow}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
