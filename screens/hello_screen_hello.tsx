'use client'

import { useEffect, useRef, useState } from 'react'

export default function HelloScreen({
  onNext,
  onLogin,
}: {
  onNext?: () => void
  onLogin?: () => void
}) {
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)
  const loginButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || ''
    const ios = /iPhone|iPad|iPod/i.test(ua)
    setIsIOS(ios)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ((navigator as any).standalone === true)
    setIsStandalone(standalone)
    setShowIosTip(ios && !standalone)
  }, [])

  useEffect(() => {
    if (showIosTip) return
    const updateOffset = () => {
      try {
        const btn = loginButtonRef.current
        if (!btn) return
        const rect = btn.getBoundingClientRect()
        const viewportH = window.visualViewport?.height ?? window.innerHeight
        const margin = isIOS ? 60 : 12
        const overflow = rect.bottom + margin - viewportH
        const root = document.documentElement
        if (overflow > 0) {
          root.style.setProperty('--hello-login-offset-y', `${overflow}px`)
        } else {
          root.style.setProperty('--hello-login-offset-y', '0px')
        }
      } catch {}
    }
    updateOffset()
    window.addEventListener('resize', updateOffset)
    const vv = window.visualViewport as any
    vv?.addEventListener?.('resize', updateOffset)
    return () => {
      window.removeEventListener('resize', updateOffset)
      vv?.removeEventListener?.('resize', updateOffset)
    }
  }, [showIosTip, isIOS])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0A0A0A]">
      <div className="relative h-[812px] w-[375px]">
        <div hidden={showIosTip}>
        <img
          src="/interface/src.svg"
          alt="src"
          className="absolute left-[133px] top-[190px] h-[150px] w-[150px]"
        />
        <div
          className="absolute left-[113px] top-[380px] h-[26px] w-[150px] text-center text-[32px] font-bold leading-[0.8125em] text-white font-ttc-bold whitespace-nowrap"
        >
          hw-project
        </div>
        <div className="absolute left-[48px] top-[406px] h-[26px] w-[279px] text-center text-[20px] font-light leading-[1.3em] text-white">
          Удобно. быстро. безопастно
        </div>
        <div className="absolute left-[75px] top-[432px] h-[26px] w-[244px] text-center text-[16px] font-light leading-[1.625em] text-[#FFD900]">
          Пользовательское соглашение
        </div>
        <button
          type="button"
          className="absolute left-[113px] top-[492px] h-[47px] w-[157px] rounded-[10px] bg-[#111111] text-center"
          onClick={() => {
            if (onNext) {
              onNext()
              return
            }
            const event = new CustomEvent('hello-next')
            window.dispatchEvent(event)
          }}
        >
          <span
            className="inline-block h-[25px] w-[149px] text-[20px] font-semibold leading-[1.25em] tracking-[0.015em] text-white font-vk-demi"
          >
            Далее
          </span>
        </button>
        </div>
        {!showIosTip && (
          <button
            type="button"
            ref={loginButtonRef}
            className="absolute left-0 w-full text-center"
            style={{
              bottom: isStandalone
                ? 'calc(env(safe-area-inset-bottom, 0px) + var(--hello-login-standalone-bottom) + var(--hello-login-offset-y))'
                : 'calc(env(safe-area-inset-bottom, 0px) + var(--hello-login-browser-bottom) + var(--hello-login-offset-y))',
            }}
            onClick={() => {
              if (onLogin) {
                onLogin()
                return
              }
              const event = new CustomEvent('hello-login')
              window.dispatchEvent(event)
            }}
          >
            <span className="inline-block text-[16px] leading-[1.4em] text-white">
              У меня уже есть аккаунт
            </span>
          </button>
        )}
        {showIosTip && (
          <div
            className="absolute left-0 top-0 flex h-full w-full items-center justify-center"
            style={{ zIndex: 20, transform: 'translateY(var(--hello-tip-overlay-offset-y))' }}
          >
            <div className="relative">
              <div
                className="absolute left-0 top-4 w-full rounded-[16px]"
                style={{ height: 'calc(var(--hello-tip-modal-width) * 0.6)', background: 'rgba(255,255,255,0.04)', filter: 'blur(6px)' }}
              />
              <div
                className="rounded-[var(--hello-tip-card-radius)] border text-center"
                style={{
                  width: 'var(--hello-tip-modal-width)',
                  height: 'var(--hello-tip-modal-height)',
                  padding: 'var(--hello-tip-modal-padding)',
                  background: 'var(--hello-tip-card-bg)',
                  borderColor: 'var(--hello-tip-card-border)',
                  boxShadow: 'var(--hello-tip-card-shadow)',
                }}
              >
                <img
                  src="/interface/link-broken.svg"
                  alt="union"
                  style={{
                    width: 'var(--hello-tip-union-size)',
                    height: 'var(--hello-tip-union-size)',
                    marginBottom: 'var(--hello-tip-union-margin-bottom)',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    transform: 'translate(var(--hello-tip-union-offset-x), var(--hello-tip-union-offset-y))',
                  }}
                />
                <div
                  className="mx-auto text-white"
                  style={{
                    fontSize: 'var(--hello-tip-title-size)',
                    width: 'var(--hello-tip-text-block-width)',
                    fontFamily: 'var(--font-sf-ui-text-light)',
                    lineHeight: 'calc(1.25em + var(--hello-tip-text-indent))',
                  }}
                >
                  <span>Ой, похоже у вас </span>
                  <span style={{ color: 'white', fontFamily: 'var(--font-sf-ui-text-medium)' }}>Iphone</span>
                </div>
                <div
                  className="mx-auto text-white"
                  style={{
                    fontSize: 'var(--hello-tip-text-size)',
                    marginTop: 'var(--hello-tip-line-gap)',
                    width: 'var(--hello-tip-text-block-width)',
                    fontFamily: 'var(--font-sf-ui-text-light)',
                    lineHeight: 'calc(1.4em + var(--hello-tip-text-indent))',
                  }}
                >
                  <span>В таком случае </span>
                  <span style={{ color: 'var(--hello-tip-iphone-color)' }}>крайне рекомендуется</span>
                  <span> добавить сайт как </span>
                  <span style={{ color: 'white' }}>приложение</span>
                </div>
                <div style={{ height: 'var(--hello-tip-gap)' }} />
                <div className="mx-auto" style={{ width: 'var(--hello-tip-instruction-width)', marginTop: 'var(--hello-tip-flow-margin-top)' }}>
                  <div className="flex items-center justify-center" style={{ gap: 'var(--hello-tip-flow-gap)' }}>
                    <img src="/interface/dot-horizontal.svg" alt="dot" style={{ width: 'var(--hello-tip-icon-size)', height: 'var(--hello-tip-icon-size)' }} />
                    <span className="text-white" style={{ fontSize: 'var(--hello-tip-text-size)' }}>→</span>
                    <img src="/interface/Share.svg" alt="Share" style={{ width: 'var(--hello-tip-icon-size)', height: 'var(--hello-tip-icon-size)' }} />
                    <span className="text-white" style={{ fontSize: 'var(--hello-tip-text-size)' }}>Поделиться</span>
                    <span className="text-white" style={{ fontSize: 'var(--hello-tip-text-size)' }}>→</span>
                    <img src="/interface/add-square-03.svg" alt="Add" style={{ width: 'var(--hello-tip-icon-size)', height: 'var(--hello-tip-icon-size)' }} />
                    <span className="text-white" style={{ fontSize: 'var(--hello-tip-text-size)' }}>
                      «Домой»
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="absolute left-0 w-full text-center"
                style={{
                  bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--hello-close-bottom))',
                }}
                onClick={() => {
                  setShowIosTip(false)
                }}
              >
                <span
                  className="inline-flex items-center justify-center font-vk-demi"
                  style={{
                    width: 'var(--hello-close-width)',
                    height: 'var(--hello-close-height)',
                    borderRadius: 'var(--hello-close-radius)',
                    background: 'var(--hello-close-bg)',
                    fontSize: 'var(--hello-close-text-size)',
                    color: 'var(--hello-close-text-color)',
                  }}
                >
                  Закрыть
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
