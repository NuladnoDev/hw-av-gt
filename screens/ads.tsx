'use client'

export default function Ads() {
  return (
    <div
      className="absolute left-0 w-full px-6"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)', height: 'calc(812px - 88px - 56px - var(--home-header-offset))' }}
    >
      <div className="flex h-full w-full items-center justify-center">
      </div>
    </div>
  )
}
