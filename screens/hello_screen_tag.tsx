'use client'

import { useEffect, useState } from 'react'

export default function HelloScreenTag({
  onBack,
  onNext,
}: {
  onBack?: () => void
  onNext?: () => void
}) {
  const [value, setValue] = useState('')
  const [showNotice, setShowNotice] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    setShowNotice(value.trim().length > 0)
  }, [value])

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
            const event = new CustomEvent('tag-back')
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
          <img
            src="/hello_screen/tag.svg"
            alt="tag"
            className="h-[138px] w-[138px] mb-10"
          />
          <div className="mb-2 w-full text-center text-[28px] font-bold leading-[1em] text-white font-ttc-bold">
            Выберите тег
          </div>
          <div className="mb-6 w-full text-center text-[16px] leading-[1.4em] text-[#A1A1A1]">
            Укажите уникальный тег для вашего профиля
          </div>

          <label className="self-start mb-2 text-[14px] leading-[1.3em] text-[#BDBDBD]">
            Тег
          </label>
          <div className="relative mb-4 w-full">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="durov"
              className="h-[48px] w-full rounded-[10px] border border-[#2B2B2B] bg-[#111111] pl-4 pr-28 text-[16px] leading-[1.4em] text-white outline-none"
            />
            {showNotice && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] leading-[1.3em] text-[#86D671] slide-in-up">
                этот тег свободен
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
              const event = new CustomEvent('tag-next', { detail: { value } })
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
