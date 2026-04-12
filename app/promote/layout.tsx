import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Продвижение — HelloWorld',
}

export default function PromoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowY: 'auto', height: '100%', minHeight: '100vh' }}>
      {children}
    </div>
  )
}
