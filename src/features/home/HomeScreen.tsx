import { STAGE_HEIGHT, STAGE_WIDTH } from '@/config/stage'
import './HomeScreen.css'

export function HomeScreen() {
  return (
    <header className="home-screen">
      <h1 className="home-screen__title">MALO</h1>
      <p className="home-screen__subtitle">
        {STAGE_WIDTH}×{STAGE_HEIGHT} 스테이지 — 화면 단위는{' '}
        <code className="home-screen__code">src/features/</code> 아래에 폴더를
        나눠 두면 됩니다.
      </p>
    </header>
  )
}
