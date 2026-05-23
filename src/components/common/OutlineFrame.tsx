import type { CSSProperties } from 'react'
import bellIcon from '@/assets/icons/bell_icon.svg'
import homeIcon from '@/assets/icons/home_icon.svg'
import './OutlineFrame.css'

export type OutlineFrameVariant = 'home' | 'staff'

export type OutlineFrameProps = {
  variant: OutlineFrameVariant
  /** 생략 시 home: "처음으로", staff: "직원 호출" */
  label?: string
  /** home 변형에서만 — 지정 시 처음 화면으로 이동 등 클릭 처리 */
  onHomeClick?: () => void
  /** staff 변형에서만 — 직원 호출 클릭 처리 */
  onStaffCall?: () => void
  className?: string
  style?: CSSProperties
}

export function OutlineFrame({
  variant,
  label,
  onHomeClick,
  onStaffCall,
  className,
  style,
}: OutlineFrameProps) {
  const resolvedLabel =
    label ??
    (variant === 'home' ? '처음으로' : '직원 호출')

  const rootClass = [
    'outline-frame',
    `outline-frame--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (variant === 'home') {
    const inner = (
      <div className="outline-frame__inner">
        <img
          src={homeIcon}
          alt=""
          className="outline-frame__icon outline-frame__icon--home"
          width={30}
          height={33}
        />
        <span className="outline-frame__label outline-frame__label--home">
          {resolvedLabel}
        </span>
      </div>
    )

    if (onHomeClick) {
      return (
        <button
          type="button"
          className={rootClass}
          style={style}
          onClick={onHomeClick}
          aria-label={resolvedLabel}
        >
          {inner}
        </button>
      )
    }

    return (
      <div className={rootClass} style={style}>
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={rootClass}
      style={style}
      onClick={onStaffCall}
      aria-label={resolvedLabel}
    >
      <span className="outline-frame__label outline-frame__label--staff">
        {resolvedLabel}
      </span>
      <img
        src={bellIcon}
        alt=""
        className="outline-frame__icon outline-frame__icon--bell"
        width={27}
        height={30}
      />
    </button>
  )
}
