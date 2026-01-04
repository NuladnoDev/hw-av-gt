'use client'

import { Suspense } from 'react'
import HomeScreen from '@/screens/home'

export default function HomePage() {
  return (
    <Suspense>
      <HomeScreen />
    </Suspense>
  )
}
