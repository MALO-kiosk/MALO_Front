import { OutlineFrame } from '@/components/common'
import './ModeSelectScreen.css'

export type ModeSelectScreenProps = {
  onGoHome?: () => void
  onSelectEasy?: () => void
  onSelectNormal?: () => void
  onStaffCall?: () => void
}

export function ModeSelectScreen({
  onGoHome,
  onSelectEasy,
  onSelectNormal,
  onStaffCall,
}: ModeSelectScreenProps) {
  return (
    <div className="mode-select">
      <OutlineFrame
        variant="home"
        className="mode-select__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame variant="staff" className="mode-select__staff-frame" onStaffCall={onStaffCall} />

      <main className="mode-select__main">
        <button
          type="button"
          className="mode-select__easy-btn"
          aria-label="쉬운 모드"
          onClick={() => onSelectEasy?.()}
        >
          <span className="mode-select__easy-label">쉬운 모드</span>
        </button>
        <button
          type="button"
          className="mode-select__normal-btn"
          aria-label="일반 모드"
          onClick={() => onSelectNormal?.()}
        >
          <span className="mode-select__normal-label">일반 모드</span>
        </button>
      </main>
    </div>
  )
}
