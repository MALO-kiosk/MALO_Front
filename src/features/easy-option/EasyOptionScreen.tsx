import {
  AISpeechDisplay,
  EasyCartBarTotal,
  OutlineFrame,
  TopWhitePanel,
} from '@/components/common'
import './EasyOptionScreen.css'

export type EasyOptionScreenProps = {
  /** 처음으로 → 홈 */
  onGoHome?: () => void
  /** 상단 옵션 안내 문구 */
  optionTitle?: string
}

export function EasyOptionScreen({
  onGoHome,
  optionTitle = '옵션',
}: EasyOptionScreenProps) {
  return (
    <div className="easy-option">
      <OutlineFrame
        variant="home"
        className="easy-option__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame variant="staff" className="easy-option__staff-frame" />
      <TopWhitePanel className="easy-option__panel">
        <h1 className="easy-option__title">{optionTitle}</h1>
      </TopWhitePanel>
      <AISpeechDisplay className="ai-speech-display--easy-option" />
      <EasyCartBarTotal />
    </div>
  )
}
