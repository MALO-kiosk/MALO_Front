import type { CSSProperties, ReactNode } from 'react'
import './TopWhitePanel.css'

export type TopWhitePanelProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /** 기본 section — 접근성용 main 등 */
  as?: 'main' | 'section' | 'div'
  /** false면 높이 269px 고정 (기본) · true면 min-height + 자동 높이 */
  autoHeight?: boolean
  /** autoHeight 시 최소 높이(px). 기본 287 */
  minHeightPx?: number
  /** 고정 높이(px). 기본 269 · autoHeight가 true면 무시 */
  heightPx?: number
}

export function TopWhitePanel({
  children,
  className,
  style,
  as = 'section',
  autoHeight = false,
  minHeightPx = 287,
  heightPx = 269,
}: TopWhitePanelProps) {
  const Tag = as
  const mergedStyle: CSSProperties = autoHeight
    ? { ...style, minHeight: minHeightPx, height: 'auto' }
    : { ...style, height: heightPx }

  const rootClass = ['top-white-panel', className].filter(Boolean).join(' ')

  return (
    <Tag className={rootClass} style={mergedStyle}>
      {children}
    </Tag>
  )
}
