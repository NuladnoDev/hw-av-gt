import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'hw-project — Маркетплейс нового поколения',
  description: 'Выкладывай, покупай, продавай. Современный маркетплейс для покупки и продажи товаров с удобным интерфейсом.',
  keywords: ['маркетплейс', 'купить', 'продать', 'объявления', 'hw-project'],
  openGraph: {
    title: 'hw-project — Маркетплейс нового поколения',
    description: 'Выкладывай, покупай, продавай.',
    type: 'website',
    locale: 'ru_RU',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
