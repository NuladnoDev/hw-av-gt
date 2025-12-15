'use client'

import { useEffect, useState } from 'react'

export default function InfoMe({
  onClose,
}: {
  onClose?: () => void
}) {
  const [scale, setScale] = useState(1)
  const [dirty, setDirty] = useState(false)

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

  const close = () => {
    if (onClose) onClose()
    else {
      const ev = new Event('close-info-me')
      window.dispatchEvent(ev)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center bg-[#0A0A0A] overflow-hidden edit-screen-in">
      <div className="relative h-[812px] w-[375px]" style={{ transform: `scale(${scale})` }}>
        <div className="absolute left-0 top-0 h-[812px] w-[375px]" style={{ backgroundColor: '#0A0A0A' }} />

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset))', height: '56px' }}
        >
          <div className="relative h-full w-full">
            <button
              type="button"
              onClick={close}
              className="absolute left-6 top-0 flex h-full items-center"
              aria-label="Назад"
            >
              <img
                src="/interface/str.svg"
                alt="back"
                className="h-[22px] w-[22px]"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </button>
            <button
              type="button"
              className="absolute right-6 top-0 flex h-full items-center"
              disabled={!dirty}
            >
              <span className={`text-[16px] leading-[1em] ${dirty ? 'text-white' : 'text-white/60'} font-sf-ui-medium`}>Сохр.</span>
            </button>
          </div>
        </div>

        <div
          className="absolute left-0 w-full px-6 overflow-y-auto"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
            height: 'calc(812px - 56px - var(--home-header-offset))',
          }}
        >
          <div className="relative w-full">
          </div>
        </div>

        <div
          className="absolute left-0 w-full bg-[#0A0A0A]"
          style={{ bottom: 0, height: 'env(safe-area-inset-bottom, 0px)' }}
        />
      </div>
    </div>
  )
}

