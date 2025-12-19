'use client'

export default function Ads() {
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
          className="absolute left-0 right-0 flex flex-col items-center"
          style={{
            top: 'var(--ads-buttons-top)',
            rowGap: 'var(--ads-buttons-gap)',
          }}
        >
          <button
            type="button"
            className="relative flex items-center justify-center gap-2"
            style={{
              width: 350.07,
              height: 'var(--ads-main-button-height)',
              borderRadius: 10,
              background: 'var(--feed-create-bg)',
              paddingLeft: 18,
              paddingRight: 18,
            }}
          >
            <img
              src="/interface/plus-02.svg"
              alt=""
              className="h-6 w-6"
            />
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
            style={{ width: 355, height: 'var(--ads-secondary-button-height)' }}
          >
            <button
              type="button"
              className="flex items-center gap-2"
              style={{
                width: 209.21,
                height: 'var(--ads-secondary-button-height)',
                borderRadius: 10,
                background: 'linear-gradient(90deg, #111111 0%, #1D1F1D 100%)',
                paddingLeft: 16,
                paddingRight: 12,
              }}
            >
              <img
                src="/interface/search-02.svg"
                alt=""
                className="h-6 w-6"
              />
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
              className="flex items-center justify-center gap-2"
              style={{
                width: 135,
                height: 'var(--ads-secondary-button-height)',
                borderRadius: 10,
                background: 'linear-gradient(180deg, #111111 0%, #1D1F1D 100%)',
                paddingLeft: 16,
                paddingRight: 12,
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
              <img
                src="/interface/filter.svg"
                alt=""
                className="h-8 w-8"
              />
            </button>
          </div>
        </div>

        <div className="flex h-full w-full items-center justify-center" />
      </div>
    </div>
  )
}
