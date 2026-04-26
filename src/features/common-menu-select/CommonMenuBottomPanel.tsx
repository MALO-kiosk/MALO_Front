import type { ReactNode } from 'react'
import './CommonMenuBottomPanel.css'

export type CommonMenuBottomPanelProps = {
  children?: ReactNode
}

export function CommonMenuBottomPanel({ children }: CommonMenuBottomPanelProps) {
  return (
    <div className="common-menu-bottom-panel">
      <hr className="common-menu-bottom-panel__rule" aria-hidden />
      {children}
    </div>
  )
}
