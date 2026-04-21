import type { CSSProperties } from 'react'
import './EasyOrderActionBar.css'

export type EasyOrderActionBarProps = {
  /** 주문 취소 */
  onCancel?: () => void
  /** 메뉴 담기 */
  onAddMenu?: () => void
  className?: string
  style?: CSSProperties
}

export function EasyOrderActionBar({
  onCancel,
  onAddMenu,
  className,
  style,
}: EasyOrderActionBarProps) {
  const rootClass = ['easy-order-action-bar', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} style={style}>
      <button
        type="button"
        className="easy-order-action-bar__cancel"
        onClick={onCancel}
      >
        주문취소
      </button>
      <button
        type="button"
        className="easy-order-action-bar__add"
        onClick={onAddMenu}
      >
        메뉴담기
      </button>
    </div>
  )
}
