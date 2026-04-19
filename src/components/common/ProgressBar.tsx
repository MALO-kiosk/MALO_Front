import type { CSSProperties } from 'react'
import './ProgressBar.css'

export type ProgressBarProps = {
  className?: string
  style?: CSSProperties
  /** 진행 채움 너비(px). 기본 203 — 이후 단계 연동 시 변경 */
  fillWidth?: number
}

export function ProgressBar({
  className,
  style,
  fillWidth = 203,
}: ProgressBarProps) {
  return (
    <div
      className={
        className ? `progress-section ${className}` : 'progress-section'
      }
      style={style}
    >
      <div className="progress-section__steps" role="presentation">
        <span className="progress-section__label progress-section__label--menu">
          메뉴선택
        </span>
        <span className="progress-section__label progress-section__label--earn">
          적립하기
        </span>
        <span className="progress-section__label progress-section__label--pay">
          결제하기
        </span>
        <span className="progress-section__label progress-section__label--done">
          주문완료
        </span>
      </div>
      <div className="progress-section__track" role="presentation">
        <div
          className="progress-section__fill"
          style={{ width: fillWidth }}
          aria-hidden
        />
      </div>
    </div>
  )
}
