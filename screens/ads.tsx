'use client'

import { useState } from 'react'
import AdsCreate from './Ads_Create'

interface AdCardProps {
  id: string
  title: string
  price: string
  imageUrl: string
  username: string
  condition?: string
  location?: string
}

const ADS_SIDE_PADDING = 4
const ADS_GRID_GAP = 6

const MOCK_ADS: AdCardProps[] = [
  {
    id: '1',
    title: 'HQD Cuvie Plus Манго',
    price: '900',
    imageUrl: '/interface/Posting.png',
    username: 'vape_shop',
    condition: 'Новое',
    location: 'Кадуй',
  },
  {
    id: '2',
    title: 'iPhone 13 128 ГБ',
    price: '55000',
    imageUrl: '/interface/Posting.png',
    username: 'tech_seller',
    condition: 'Отличное',
    location: 'Череповец',
  },
  {
    id: '3',
    title: 'Маникюр с выездом',
    price: '1500',
    imageUrl: '/interface/Posting.png',
    username: 'nails_by_anna',
    condition: 'Услуга',
    location: 'Кадуй',
  },
  {
    id: '4',
    title: 'Бариста в кофейню',
    price: '45000',
    imageUrl: '/interface/Posting.png',
    username: 'coffee_place',
    condition: 'Вакансия',
    location: 'Кадуй',
  },
]

function AdCard({ title, price, imageUrl, username, condition, location }: AdCardProps) {
  return (
    <div className="relative h-[240px] cursor-pointer overflow-hidden rounded-2xl bg-[#151515] group">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 scale-110 blur-xl opacity-50"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      <div className="relative h-[160px] overflow-hidden">
        <img src={imageUrl} alt={title} className="relative z-10 h-full w-full object-contain" />
        <div className="absolute left-2 top-2 z-20 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-xs text-white font-['SF_UI_Text:Light',sans-serif]">@{username}</p>
        </div>
      </div>

      <div className="relative flex h-[80px] flex-col justify-between bg-gradient-to-b from-[#151515]/95 to-[#151515] p-3">
        <div>
          <h3 className="mb-1 line-clamp-1 text-sm text-white font-['SF_UI_Text:Medium',sans-serif]">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-white/50">
            {condition && <span>{condition}</span>}
            {condition && location && <span>•</span>}
            {location && <span>{location}</span>}
          </div>
        </div>
        <p className="text-lg text-white font-vk-demi">{price} ₽</p>
      </div>

      <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover:bg-white/5" />
    </div>
  )
}

export default function Ads() {
  const [createOpen, setCreateOpen] = useState(false)
  return (
    <div className="relative h-full w-full">
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ top: 'var(--feed-controls-top)' }}
      >
        <div
          className="flex w-full flex-col items-center"
          style={{ rowGap: 'var(--ads-buttons-gap)' }}
        >
          <button
            type="button"
            className="relative flex items-center justify-center"
            style={{
              width: 350.07,
              height: 53.86,
              borderRadius: 10,
              background: 'var(--feed-create-bg)',
            }}
            onClick={() => setCreateOpen(true)}
          >
            <img
              src="/interface/plus-02.svg"
              alt=""
              style={{ width: 25, height: 26, marginRight: 8 }}
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
              <img
                src="/interface/search-02.svg"
                alt=""
                style={{ width: 22, height: 22, marginRight: 8 }}
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
              className="flex items-center justify-center"
              style={{
                width: 135,
                height: 54,
                borderRadius: 10,
                background: 'linear-gradient(180deg, #111111 0%, #1D1F1D 100%)',
              }}
            >
              <img
                src="/interface/filter.svg"
                alt=""
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
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
      </div>

      <div
        className="absolute left-0 right-0 bottom-0 overflow-y-auto"
        style={{
          top: 'calc(var(--feed-controls-top) + 130px)',
          paddingLeft: ADS_SIDE_PADDING,
          paddingRight: ADS_SIDE_PADDING,
          paddingBottom: 16,
        }}
      >
        <div
          className="grid grid-cols-2 pb-4"
          style={{
            columnGap: ADS_GRID_GAP,
            rowGap: ADS_GRID_GAP,
          }}
        >
          {MOCK_ADS.map((ad) => (
            <AdCard key={ad.id} {...ad} />
          ))}
        </div>
      </div>
      {createOpen && (
        <AdsCreate
          onClose={() => {
            setCreateOpen(false)
          }}
        />
      )}
    </div>
  )
}
