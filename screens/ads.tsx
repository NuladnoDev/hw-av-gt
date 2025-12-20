'use client'

export default function Ads({
  onCreate,
}: {
  onCreate?: () => void
}) {
  return (
    <div
      className="absolute left-0 flex w-full justify-center"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + var(--home-header-offset) + 56px)',
        height: 'calc(812px - 88px - 56px - var(--home-header-offset))',
      }}
    >
      <div
        className="relative h-full w-full"
        style={{ maxWidth: 370 }}
      >
        <div
          className="flex flex-col items-center"
          style={{ marginTop: 56, rowGap: 12 }}
        >
          <button
            type="button"
            className="relative flex items-center justify-center"
            style={{
              width: 350.07,
              height: 53.86,
              borderRadius: 10,
              background: 'linear-gradient(90deg, #93B49E 0%, #304838 100%)',
            }}
            onClick={onCreate}
          >
            <span
              className="font-vk-demi"
              style={{
                fontSize: 15,
                lineHeight: '19.68px',
                color: '#FFFFFF',
              }}
            >
              Создать обьявление
            </span>
          </button>

          <div
            className="flex justify-between"
            style={{ width: 355, height: 54 }}
          >
            <button
              type="button"
              className="flex items-center"
              style={{
                width: 209.21,
                height: 53.86,
                borderRadius: 10,
                background: 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)',
                paddingLeft: 16,
              }}
            >
              <span
                className="font-sf-ui-light"
                style={{
                  fontSize: 15,
                  lineHeight: '18px',
                  color: '#A8A8A8',
                }}
              >
                Поиск в Кадуе
              </span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center"
              style={{
                width: 135,
                height: 54,
                borderRadius: 10,
                background: 'linear-gradient(180deg, #111111 0%, #1D1F1D 100%)',
              }}
            >
              <span
                className="font-vk-demi"
                style={{
                  fontSize: 15,
                  lineHeight: '19.68px',
                  color: '#FFFFFF',
                }}
              >
                Фильтры
              </span>
            </button>
          </div>
        </div>

        <div className="flex h-full w-full items-center justify-center" />
      </div>
    </div>
  )
}
