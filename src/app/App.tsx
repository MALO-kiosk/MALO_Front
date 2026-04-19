import { useState } from 'react'
import { StageViewport } from '@/components/layout'
import { CommonMenuSelectScreen } from '@/features/common-menu-select'
import { EasyMenuSelectScreen } from '@/features/easy-menu-select'
import { EasyOptionScreen } from '@/features/easy-option'
import { HomeScreen } from '@/features/home'
import { ModeSelectScreen } from '@/features/mode-select'

type AppPage =
  | 'home'
  | 'mode-select'
  | 'easy-menu-select'
  | 'easy-option'
  | 'common-menu-select'

export default function App() {
  const [page, setPage] = useState<AppPage>('home')

  return (
    <StageViewport>
      {page === 'home' ? (
        <HomeScreen onPlaceTypeSelected={() => setPage('mode-select')} />
      ) : page === 'mode-select' ? (
        <ModeSelectScreen
          onGoHome={() => setPage('home')}
          onSelectEasy={() => setPage('easy-menu-select')}
          onSelectNormal={() => setPage('common-menu-select')}
        />
      ) : page === 'easy-menu-select' ? (
        <EasyMenuSelectScreen
          onGoHome={() => setPage('home')}
          onOrder={() => setPage('easy-option')}
        />
      ) : page === 'easy-option' ? (
        <EasyOptionScreen onGoHome={() => setPage('home')} />
      ) : (
        <CommonMenuSelectScreen onGoHome={() => setPage('home')} />
      )}
    </StageViewport>
  )
}
