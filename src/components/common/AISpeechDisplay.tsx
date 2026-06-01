import type { CSSProperties } from 'react'
import personIcon from '@/assets/icons/person_icon.svg'
import './AISpeechDisplay.css'

export type AISpeechDisplayProps = {
  message?: string
  /** 마이크 활성 상태 — true일 때 말풍선 테두리 펄스 효과 */
  listening?: boolean
  className?: string
  style?: CSSProperties
}

export function AISpeechDisplay({
  message = '원하시는 음료를 선택해주세요',
  listening = false,
  className,
  style,
}: AISpeechDisplayProps) {
  const rootClass = className
    ? `ai-speech-display ${className}`
    : 'ai-speech-display'

  return (
    <div className={rootClass} style={style}>
      <div className={`ai-speech-display__bubble${listening ? ' ai-speech-display__bubble--listening' : ''}`}>
        <p className="ai-speech-display__text">{message}</p>
      </div>
      <img
        src={personIcon}
        alt=""
        className="ai-speech-display__person"
        width={120}
        height={120}
      />
    </div>
  )
}
