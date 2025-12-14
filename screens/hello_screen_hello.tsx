'use client'

export default function HelloScreen({
  onNext,
  onLogin,
}: {
  onNext?: () => void
  onLogin?: () => void
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0A0A0A]">
      <div className="relative h-[812px] w-[375px]">
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
    </div>
  )
}
