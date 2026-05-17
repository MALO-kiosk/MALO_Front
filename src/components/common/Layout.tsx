import type { ReactNode } from 'react'
import Header from './Header'
import OrderProcess from './Orderprocess'

interface LayoutProps {
  children: ReactNode
  onHome?: () => void
}

export default function Layout({ children, onHome }: LayoutProps) {
  return (
    <div
      className="app-layout"
      style={{
        position: 'absolute',
        inset: 0,
        width: '1080px',
        height: '1920px',
        margin: '0 auto',
        background: '#F8F8F8',
        overflow: 'hidden',
      }}
    >
      <div
        className="top-section-wrapper"
        style={{
          width: '1080px',
          height: '259px',
          position: 'relative',
          zIndex: 9999,
          background: '#FFF',
          boxShadow: '0 3px 8px 0 rgba(0, 0, 0, 0.03)',
        }}
      >
        <Header onHome={onHome} />
        <OrderProcess />
      </div>

      <main
        className="app-content"
        style={{ width: '1080px', height: 'calc(1920px - 259px)' }}
      >
        {children}
      </main>
    </div>
  )
}
